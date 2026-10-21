import { z } from "zod";
import { createHash } from "node:crypto";

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object")
    return JSON.stringify(value);

  if (Array.isArray(value))
    return "[" + value.map(canonical).join(",") + "]";

  return "{" + Object.entries(value).sort(([a], [b]) => a.localeCompare(b, "en")).map(([k, v]) => JSON.stringify(k) + ":" + canonical(v)).join(",") + "}";
}

export const digest = (v: unknown) => createHash("sha256").update(canonical(v)).digest("hex");

export function must(ok: unknown, code: string): asserts ok {
  if (!ok)
    throw Error(code);
}

const id = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/), sha = z.string().regex(/^[a-f0-9]{64}$/), money = z.number().int().min(0).max(1000000000), date = z.iso.datetime();
export const Provider = z.enum(["MOCK_LLM", "MOCK_AZURE_SPEECH", "REAL_PROVIDER_DISABLED"]);

export const Policy = z.strictObject({
  schemaVersion: z.literal(1),
  scope: z.literal("OFFLINE_SIMULATION_ONLY"),
  policyId: id,
  ownerApprovalId: id,
  codeSha: z.string().regex(/^[a-f0-9]{40}$/),
  expiresAt: date,
  productionMicrousd: z.literal(8000000),
  reserveMicrousd: z.literal(2000000),
  totalMicrousd: z.literal(10000000),
  maxVideoMicrousd: z.literal(80000),
  openingLiabilities: money,
  openingBalanceVerified: z.boolean(),
  englishScheduledAllowed: z.boolean(),
  productOnDemandAllowed: z.boolean(),

  pricing: z.strictObject({
    id: id,
    checkedAt: date,
    expiresAt: date,
    evidenceSha256: sha
  }),

  blockUnresolved: z.literal(true)
});

export type PolicyType = z.infer<typeof Policy>;

export const Plan = z.strictObject({
  schemaVersion: z.literal(1),
  productionId: id,
  mode: z.enum(["ENGLISH_LEARNING", "PRODUCT_SHOWCASE"]),
  trigger: z.enum(["SCHEDULED", "ON_DEMAND"]),
  scheduledFor: date,
  localDate: z.iso.date(),
  contentSha256: sha,
  policySha256: sha,
  codeSha: z.string().regex(/^[a-f0-9]{40}$/),

  requests: z.array(z.strictObject({
    requestId: id,
    provider: Provider,
    maxMicrousd: money,
    inputSha256: sha
  })).min(1).max(16)
});

export type PlanType = z.infer<typeof Plan>;

export const Authorization = z.strictObject({
  ownerApprovalId: id,
  productionId: id,
  planSha256: sha,
  policySha256: sha,
  codeSha: z.string().regex(/^[a-f0-9]{40}$/),
  expiresAt: date
});

export const States = z.enum([
  "PLANNED",
  "VALIDATED",
  "AUTHORIZED",
  "RESERVED",
  "DISPATCHING",
  "VERIFIED",
  "FAILED_BEFORE_DISPATCH",
  "AMBIGUOUS_PAID",
  "RECONCILIATION_REQUIRED",
  "BLOCKED"
]);

export const Payload = z.discriminatedUnion("kind", [z.strictObject({
  kind: z.literal("PLANNED"),
  plan: Plan
}), z.strictObject({
  kind: z.literal("VALIDATED"),
  productionId: id
}), z.strictObject({
  kind: z.literal("AUTHORIZED"),
  productionId: id,
  authorization: Authorization
}), z.strictObject({
  kind: z.literal("RESERVED"),
  productionId: id,
  requestId: id,
  attemptId: sha
}), z.strictObject({
  kind: z.literal("DISPATCHING"),
  productionId: id,
  attemptId: sha
}), z.strictObject({
  kind: z.literal("VERIFIED"),
  productionId: id,
  attemptId: sha,
  artifactSha256: sha,
  receiptSha256: sha,
  confirmedMicrousd: money,
  billingKind: z.literal("MOCK_BILLING_ONLY")
}), z.strictObject({
  kind: z.enum(["FAILED_BEFORE_DISPATCH", "AMBIGUOUS_PAID", "RECONCILIATION_REQUIRED"]),
  productionId: id,
  attemptId: sha,
  reason: z.enum(["PREFLIGHT_NOT_SENT", "UNKNOWN_RESPONSE", "CRASH_RECOVERY", "MISSING_RECEIPT"])
}), z.strictObject({
  kind: z.literal("BLOCKED"),
  productionId: id,
  reason: z.literal("OWNER_STOP")
}), z.strictObject({
  kind: z.literal("RECONCILED"),
  productionId: id,
  attemptId: sha,
  ownerApprovalId: id,
  evidenceSha256: sha,
  confirmedMicrousd: money,
  decision: z.enum(["CONFIRMED_CHARGE", "PROVEN_NOT_SENT"])
})]);

export const Event = z.strictObject({
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  eventId: sha,
  previousHash: sha,
  at: date,
  payload: Payload,
  hash: sha
});

export const Journal = z.strictObject({
  schemaVersion: z.literal(1),
  policy: Policy,
  events: z.array(Event).max(10000)
});

export type JournalType = z.infer<typeof Journal>;
export type PayloadType = z.infer<typeof Payload>;

type Attempt = {
  attemptId: string;
  requestId: string;
  provider: z.infer<typeof Provider>;
  maxMicrousd: number;
  state: z.infer<typeof States>;
  confirmedMicrousd?: number;
  artifactSha256?: string;
  receiptSha256?: string;
  wasDispatched: boolean;
};

type Production = {
  plan: PlanType;
  state: z.infer<typeof States>;
  authorization?: z.infer<typeof Authorization>;
  attempts: Record<string, Attempt>;
};

export type Projection = {
  productions: Record<string, Production>;
  dailySlots: Record<string, string>;
  openingLiabilities: number;
  outstandingReservations: number;
  submittedRequests: number;
  confirmedCosts: number;
  unknownCharges: number;
  remainingProduction: number;
  unresolved: boolean;
};

export function localDate(at: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(at));

  return ["year", "month", "day"].map(k => parts.find(p => p.type === k)!.value).join("-");
}

export function attemptId(policy: PolicyType, p: PlanType, requestId: string) {
  return digest({
    policy: digest(policy),
    productionId: p.productionId,
    requestId
  });
}

export function validatePlan(policy: PolicyType, input: unknown) {
  const p = Plan.parse(input);
  must(p.policySha256 === digest(policy) && p.codeSha === policy.codeSha, "PLAN_AUTHORITY_MISMATCH");
  must(p.localDate === localDate(p.scheduledFor), "VIETNAM_DATE_MISMATCH");
  must(new Set(p.requests.map(r => r.requestId)).size === p.requests.length, "DUPLICATE_REQUEST");
  must(p.requests.every(r => r.provider !== "REAL_PROVIDER_DISABLED"), "REAL_PROVIDER_DISABLED");

  must(
    p.requests.reduce((n, r) => n + r.maxMicrousd, 0) <= policy.maxVideoMicrousd,
    "VIDEO_BUDGET_EXCEEDED"
  );

  if (p.trigger === "SCHEDULED")
    must(p.mode === "ENGLISH_LEARNING" && policy.englishScheduledAllowed, "SCHEDULE_NOT_AUTHORIZED");

  if (p.mode === "PRODUCT_SHOWCASE")
    must(p.trigger === "ON_DEMAND" && policy.productOnDemandAllowed, "PRODUCT_REQUIRES_ON_DEMAND_APPROVAL");

  return p;
}

function currentAuthority(policy: PolicyType, p: Production, at: string) {
  must(policy.openingBalanceVerified, "OPENING_BALANCE_UNVERIFIED");
  must(Date.parse(policy.expiresAt) > Date.parse(at), "POLICY_EXPIRED");

  must(
    Date.parse(policy.pricing.checkedAt) <= Date.parse(at) && Date.parse(policy.pricing.expiresAt) > Date.parse(at),
    "PRICING_EXPIRED"
  );

  must(!!p.authorization && Date.parse(p.authorization.expiresAt) > Date.parse(at), "AUTHORIZATION_EXPIRED");
  if(p.plan.trigger==="SCHEDULED")must(p.plan.localDate===localDate(at),"SCHEDULE_DAY_MISMATCH");
}

export function budget(policy: PolicyType, productions: Record<string, Production>): Omit<Projection, "productions" | "dailySlots"> {
  let outstandingReservations = 0, submittedRequests = 0, confirmedCosts = 0, unknownCharges = 0, unresolved = false;

  for (const p of Object.values(productions)) for (const a of Object.values(p.attempts)) {
    if (a.wasDispatched)
      submittedRequests++;

    if (a.confirmedMicrousd !== undefined)
      confirmedCosts += a.confirmedMicrousd;
    else if (a.state !== "FAILED_BEFORE_DISPATCH") {
      outstandingReservations += a.maxMicrousd;

      if (["DISPATCHING", "AMBIGUOUS_PAID", "RECONCILIATION_REQUIRED"].includes(a.state)) {
        unknownCharges += a.maxMicrousd;
        unresolved = true;
      }
    }
  }

  return {
    openingLiabilities: policy.openingLiabilities,
    outstandingReservations,
    submittedRequests,
    confirmedCosts,
    unknownCharges,
    remainingProduction: policy.productionMicrousd - policy.openingLiabilities - outstandingReservations - confirmedCosts,
    unresolved
  };
}

export function project(raw: unknown) {
  const j = Journal.parse(raw), productions: Record<string, Production> = Object.create(null), dailySlots: Record<string, string> = Object.create(null);
  let previous = digest(j.policy), at = -Infinity;
  const ids = new Set();

  for (const [i, event] of j.events.entries()) {
    const {
      hash,
      ...body
    } = event;

    must(
      event.revision === i + 1 && event.previousHash === previous && digest(body) === hash && !ids.has(event.eventId),
      "EVENT_CHAIN_INVALID"
    );

    must(Date.parse(event.at) >= at, "EVENT_TIME_REWIND");
    ids.add(event.eventId);
    previous = hash;
    at = Date.parse(event.at);
    apply(j.policy, productions, dailySlots, event.payload, event.at);
  }

  return {
    productions,
    dailySlots,
    ...budget(j.policy, productions)
  };
}

function apply(
  policy: PolicyType,
  all: Record<string, Production>,
  slots: Record<string, string>,
  payload: PayloadType,
  at: string
) {
  if (payload.kind === "PLANNED") {
    const p = validatePlan(policy, payload.plan);
    must(!all[p.productionId], "DUPLICATE_PRODUCTION");

    all[p.productionId] = {
      plan: p,
      state: "PLANNED",
      attempts: {}
    };

    return;
  }

  const p = all[payload.productionId];
  must(p, "UNKNOWN_PRODUCTION");

  if (payload.kind === "VALIDATED") {
    must(p.state === "PLANNED", "INVALID_TRANSITION");
    validatePlan(policy, p.plan);
    p.state = "VALIDATED";
    return;
  }

  if (payload.kind === "AUTHORIZED") {
    must(p.state === "VALIDATED", "INVALID_TRANSITION");
    const a = payload.authorization;

    must(
      a.productionId === p.plan.productionId && a.planSha256 === digest(p.plan) && a.policySha256 === digest(policy) && a.codeSha === policy.codeSha && a.ownerApprovalId === policy.ownerApprovalId && Date.parse(a.expiresAt) > Date.parse(at),
      "INVALID_AUTHORIZATION"
    );

    p.authorization = a;
    p.state = "AUTHORIZED";
    return;
  }

  if (payload.kind === "BLOCKED") {
    p.state = "BLOCKED";
    return;
  }

  must(p.state !== "BLOCKED", "PRODUCTION_BLOCKED");

  if (payload.kind === "RESERVED") {
    currentAuthority(policy, p, at);
    const b = budget(policy, all);
    must(!b.unresolved, "UNRESOLVED_PAID_ATTEMPT");
    must(["AUTHORIZED", "VERIFIED"].includes(p.state), "INVALID_TRANSITION");
    const req = p.plan.requests.find(r => r.requestId === payload.requestId);
    must(req && req.provider !== "REAL_PROVIDER_DISABLED", "REQUEST_NOT_AUTHORIZED");

    must(
      payload.attemptId === attemptId(policy, p.plan, req.requestId) && !p.attempts[payload.attemptId],
      "DUPLICATE_ATTEMPT"
    );

    must(!Object.values(p.attempts).some(a => a.requestId === req.requestId), "DUPLICATE_REQUEST");
    const index = p.plan.requests.indexOf(req);

    must(
      p.plan.requests.slice(0, index).every(r => Object.values(p.attempts).some(a => a.requestId === r.requestId && a.state === "VERIFIED")),
      "REQUEST_ORDER"
    );

    must(b.remainingProduction >= req.maxMicrousd, "AGGREGATE_BUDGET_EXCEEDED");
    const incurred = Object.values(p.attempts).reduce((n, a) => n + (a.confirmedMicrousd ?? (a.state === "FAILED_BEFORE_DISPATCH" ? 0 : a.maxMicrousd)), 0);
    const remainingQuotes = p.plan.requests.filter(r => !Object.values(p.attempts).some(a => a.requestId === r.requestId)).reduce((n, r) => n + r.maxMicrousd, 0);
    must(incurred + remainingQuotes <= policy.maxVideoMicrousd, "VIDEO_BUDGET_EXCEEDED");

    if (p.plan.trigger === "SCHEDULED") {
      must(!slots[p.plan.localDate] || slots[p.plan.localDate] === p.plan.productionId, "DAILY_SLOT_TAKEN");
      slots[p.plan.localDate] = p.plan.productionId;
    }

    p.attempts[payload.attemptId] = {
      attemptId: payload.attemptId,
      requestId: req.requestId,
      provider: req.provider,
      maxMicrousd: req.maxMicrousd,
      state: "RESERVED",
      wasDispatched: false
    };

    p.state = "RESERVED";
    return;
  }

  const a = p.attempts["attemptId" in payload ? payload.attemptId : ""];
  must(a, "UNKNOWN_ATTEMPT");

  if (payload.kind === "DISPATCHING") {
    currentAuthority(policy, p, at);
    must(a.state === "RESERVED" && p.state === "RESERVED", "ATTEMPT_ALREADY_USED");

    must(
      !budget(policy, all).unresolved && budget(policy, all).remainingProduction >= 0,
      "UNRESOLVED_PAID_ATTEMPT"
    );

    a.state = "DISPATCHING";
    a.wasDispatched = true;
    p.state = "DISPATCHING";
    return;
  }

  if (payload.kind === "VERIFIED") {
    must(a.state === "DISPATCHING", "INVALID_TRANSITION");
    a.state = "VERIFIED";
    a.confirmedMicrousd = payload.confirmedMicrousd;
    a.artifactSha256 = payload.artifactSha256;
    a.receiptSha256 = payload.receiptSha256;
    p.state = "VERIFIED";
    return;
  }

  if (payload.kind === "RECONCILED") {
    must(
      ["RECONCILIATION_REQUIRED", "AMBIGUOUS_PAID", "DISPATCHING", "RESERVED"].includes(a.state),
      "RECONCILIATION_NOT_REQUIRED"
    );

    must(payload.ownerApprovalId === policy.ownerApprovalId, "OWNER_RECONCILIATION_REQUIRED");

    if (payload.decision === "PROVEN_NOT_SENT")
      must(!a.wasDispatched && payload.confirmedMicrousd === 0, "DISPATCHED_NOT_PROVEN_UNSENT");

    a.confirmedMicrousd = payload.confirmedMicrousd;
    a.state = "BLOCKED";
    p.state = "BLOCKED";
    return;
  }

  if (payload.kind === "FAILED_BEFORE_DISPATCH") {
    must(
      a.state === "RESERVED" && !a.wasDispatched && payload.reason === "PREFLIGHT_NOT_SENT",
      "UNSAFE_RELEASE"
    );

    a.state = "FAILED_BEFORE_DISPATCH";
    p.state = "FAILED_BEFORE_DISPATCH";
    return;
  }

  must(
    ["RESERVED", "DISPATCHING", "AMBIGUOUS_PAID", "RECONCILIATION_REQUIRED"].includes(a.state),
    "INVALID_TRANSITION"
  );

  must(payload.kind !== "AMBIGUOUS_PAID" || a.wasDispatched, "NO_DISPATCH_EVIDENCE");
  a.state = payload.kind;
  p.state = payload.kind;
}

export function appendEvent(raw: unknown, payload: unknown, at: string, eventId: string) {
  const j = Journal.parse(raw);
  project(j);
  const clean = Payload.parse(payload);
  const last = j.events.at(-1);

  const body = {
    schemaVersion: 1 as const,
    revision: j.events.length + 1,
    eventId,
    previousHash: last?.hash ?? digest(j.policy),
    at,
    payload: clean
  };

  const event = Event.parse({
    ...body,
    hash: digest(body)
  });

  const next = {
    ...j,
    events: [...j.events, event]
  };

  project(next);
  return Journal.parse(next);
}
