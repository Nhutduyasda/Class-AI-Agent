import { z } from "zod";
import { GitLedger, type Snapshot } from "./git-ledger.ts";
import { Plan, Authorization, Provider, project, digest, attemptId, must, type PlanType } from "./model.ts";

const Receipt = z.strictObject({
  artifactSha256: z.string().regex(/^[a-f0-9]{64}$/),
  receiptSha256: z.string().regex(/^[a-f0-9]{64}$/),
  confirmedMicrousd: z.number().int().min(0).max(1000000000),
  billingKind: z.literal("MOCK_BILLING_ONLY")
});

const trustedMockAdapters = new WeakSet<object>();

export type MockProvider = Readonly<{
  kind: "MOCK_LLM" | "MOCK_AZURE_SPEECH";
  readonly calls: number;
  send: (
    input: {
      attemptId: string;
      inputSha256: string;
    }
  ) => Promise<unknown>;
}>;

export function mockProvider(
  kind: "MOCK_LLM" | "MOCK_AZURE_SPEECH",
  behavior: "OK" | "TIMEOUT" | "MISSING_RECEIPT" = "OK",
  canary = "FAKE_ONLY",
  confirmedMicrousd = 100
): MockProvider {
  must(kind === "MOCK_LLM" || kind === "MOCK_AZURE_SPEECH", "REAL_PROVIDER_DISABLED");

  must(
    Number.isInteger(confirmedMicrousd) && confirmedMicrousd >= 0 && confirmedMicrousd <= 1000000000,
    "CONTROL_INPUT_INVALID"
  );

  must(typeof canary === "string" && canary.length<=512,"CONTROL_INPUT_INVALID");
  must(["OK","TIMEOUT","MISSING_RECEIPT"].includes(behavior),"CONTROL_INPUT_INVALID");
  let calls = 0;

  const adapter = Object.freeze({
    kind,

    get calls() {
      return calls;
    },

    async send(
      input: {
        attemptId: string;
        inputSha256: string;
      }
    ) {
      calls++;

      if (behavior === "TIMEOUT")
        throw Error(canary);

      if (behavior === "MISSING_RECEIPT") return {
        raw: canary
      };

      const artifactSha256 = digest({
        kind,
        ...input
      });

      return {
        artifactSha256,

        receiptSha256: digest({
          artifactSha256,
          mock: true
        }),

        confirmedMicrousd,
        billingKind: "MOCK_BILLING_ONLY" as const
      };
    }
  });

  trustedMockAdapters.add(adapter);
  return adapter;
}

export const realProviderDisabled = {
  kind: "REAL_PROVIDER_DISABLED" as const,

  async send(): Promise<never> {
    throw Error("REAL_PROVIDER_DISABLED");
  }
};

async function prepareInternal(ledger: GitLedger, input: unknown, approval: unknown, now: string) {
  const p = Plan.parse(input), auth = Authorization.parse(approval);
  let s = await ledger.read();
  const existing = project(s.journal).productions[p.productionId];

  if (existing) {
    must(digest(existing.plan) === digest(p), "PRODUCTION_ID_REUSED");

    if (existing.authorization) {
      must(digest(existing.authorization) === digest(auth), "AUTHORIZATION_CHANGED");
      return s;
    }

    if (existing.state === "PLANNED") s = (await ledger.append(s.revision, {
      kind: "VALIDATED",
      productionId: p.productionId
    }, now)).snapshot;

    return (await ledger.append(s.revision, {
      kind: "AUTHORIZED",
      productionId: p.productionId,
      authorization: auth
    }, now)).snapshot;
  }

  s = (await ledger.append(s.revision, {
    kind: "PLANNED",
    plan: p
  }, now)).snapshot;

  s = (await ledger.append(s.revision, {
    kind: "VALIDATED",
    productionId: p.productionId
  }, now)).snapshot;

  return (await ledger.append(s.revision, {
    kind: "AUTHORIZED",
    productionId: p.productionId,
    authorization: auth
  }, now)).snapshot;
}

async function executeMockInternal(
  ledger: GitLedger,
  productionId: string,
  requestId: string,
  provider: MockProvider | typeof realProviderDisabled,
  now: string,
  options: {
    workflowRunId?: string;
    crashAt?: "BEFORE_RESERVATION" | "AFTER_RESERVATION" | "BEFORE_DISPATCH" | "AFTER_DISPATCH" | "AFTER_RESPONSE";
    preflightFails?: boolean;
  } = {}
) {
  // Gate 2 can never read process credentials or send a real request; a trusted future host boundary is separate.
  must(provider !== realProviderDisabled, "REAL_PROVIDER_DISABLED");

  must(trustedMockAdapters.has(provider), "UNTRUSTED_PROVIDER_ADAPTER");
  Provider.parse(provider.kind);
  let s = await ledger.read();
  const p = project(s.journal).productions[productionId];
  must(p, "UNKNOWN_PRODUCTION");
  const req = p.plan.requests.find(r => r.requestId === requestId);
  must(req && req.provider === provider.kind, "PROVIDER_NOT_AUTHORIZED");
  const id = attemptId(s.journal.policy, p.plan, requestId);
  const old = p.attempts[id];

  if (old) {
    if (old.state === "VERIFIED") return {
      status: "CACHED_VERIFIED",
      attemptId: id,
      artifactSha256: old.artifactSha256
    };

    if (["RESERVED", "DISPATCHING", "AMBIGUOUS_PAID"].includes(old.state)) await ledger.append(s.revision, {
      kind: "RECONCILIATION_REQUIRED",
      productionId,
      attemptId: id,
      reason: "CRASH_RECOVERY"
    }, now);

    throw Error("RECONCILIATION_REQUIRED_NO_RETRY");
  }

  if (options.crashAt === "BEFORE_RESERVATION")
    throw Error("SIMULATED_CRASH");

  s = (await ledger.append(s.revision, {
    kind: "RESERVED",
    productionId,
    requestId,
    attemptId: id
  }, now)).snapshot;

  if (options.crashAt === "AFTER_RESERVATION" || options.crashAt === "BEFORE_DISPATCH")
    throw Error("SIMULATED_CRASH");

  if (options.preflightFails) {
    await ledger.append(s.revision, {
      kind: "FAILED_BEFORE_DISPATCH",
      productionId,
      attemptId: id,
      reason: "PREFLIGHT_NOT_SENT"
    }, now);

    throw Error("PREFLIGHT_NOT_SENT");
  }

  s = (await ledger.append(s.revision, {
    kind: "DISPATCHING",
    productionId,
    attemptId: id
  }, now)).snapshot;

  if (options.crashAt === "AFTER_DISPATCH")
    throw Error("SIMULATED_CRASH");

  let receipt: z.infer<typeof Receipt>;

  try {
    receipt = Receipt.parse(await provider.send({
      attemptId: id,
      inputSha256: req.inputSha256
    }));
  } catch {
    await ledger.append(s.revision, {
      kind: "AMBIGUOUS_PAID",
      productionId,
      attemptId: id,
      reason: "UNKNOWN_RESPONSE"
    }, now);

    throw Error("AMBIGUOUS_PAID_NO_RETRY");
  }

  if (options.crashAt === "AFTER_RESPONSE")
    throw Error("SIMULATED_CRASH");

  await ledger.append(s.revision, {
    kind: "VERIFIED",
    productionId,
    attemptId: id,
    ...receipt
  }, now);

  return {
    status: "MOCK_VERIFIED",
    attemptId: id,
    artifactSha256: receipt.artifactSha256
  };
}

const safeCodes = new Set([
  "UNTRUSTED_PROVIDER_ADAPTER",
  "SCHEDULE_DAY_MISMATCH",
  "REAL_PROVIDER_DISABLED",
  "UNKNOWN_PRODUCTION",
  "PROVIDER_NOT_AUTHORIZED",
  "RECONCILIATION_REQUIRED_NO_RETRY",
  "SIMULATED_CRASH",
  "PREFLIGHT_NOT_SENT",
  "AMBIGUOUS_PAID_NO_RETRY",
  "CAS_CONFLICT_OR_STORAGE_FAILURE",
  "COMMIT_ACK_UNCERTAIN",
  "REVISION_CONFLICT",
  "GIT_OPERATION_FAILED",
  "TRUSTED_CHECKPOINT_REQUIRED",
  "JOURNAL_MISSING",
  "JOURNAL_CORRUPT",
  "JOURNAL_REWOUND",
  "JOURNAL_PREFIX_CHANGED",
  "POLICY_PIN_MISMATCH",
  "PLAN_AUTHORITY_MISMATCH",
  "INVALID_AUTHORIZATION",
  "AUTHORIZATION_CHANGED",
  "AUTHORIZATION_EXPIRED",
  "PRODUCTION_ID_REUSED",
  "VIDEO_BUDGET_EXCEEDED",
  "AGGREGATE_BUDGET_EXCEEDED",
  "OPENING_BALANCE_UNVERIFIED",
  "POLICY_EXPIRED",
  "PRICING_EXPIRED",
  "UNRESOLVED_PAID_ATTEMPT",
  "PRODUCT_REQUIRES_ON_DEMAND_APPROVAL",
  "SCHEDULE_NOT_AUTHORIZED",
  "DAILY_SLOT_TAKEN",
  "INVALID_TRANSITION",
  "ATTEMPT_ALREADY_USED",
  "CHECKPOINT_AHEAD",
  "UNEXPECTED_GIT_HISTORY",
  "REQUEST_ORDER",
  "VIETNAM_DATE_MISMATCH"
]);

function safeError(e: unknown) {
  return Error(e instanceof Error && safeCodes.has(e.message) ? e.message : "CONTROL_INPUT_INVALID");
}

export async function prepare(...args: Parameters<typeof prepareInternal>) {
  try {
    return await prepareInternal(...args);
  } catch (e) {
    throw safeError(e);
  }
}

export async function executeMock(...args: Parameters<typeof executeMockInternal>) {
  try {
    return await executeMockInternal(...args);
  } catch (e) {
    throw safeError(e);
  }
}
