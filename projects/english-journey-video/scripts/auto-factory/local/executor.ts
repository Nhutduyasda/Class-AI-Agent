import { z } from "zod";
import { readFile, realpath, open, unlink } from "node:fs/promises";
import { join, relative, isAbsolute } from "node:path";
import {
  Build,
  verifyBuild,
  sha,
  external,
  git,
  type ToolPaths,
} from "./trust.ts";
import { privateRoots, layout, exclusive } from "./retention.ts";
import { GitLedger } from "../../../src/auto-factory/control/git-ledger.ts";
import {
  Policy,
  Plan,
  digest,
  localDate,
  project,
  attemptId,
} from "../../../src/auto-factory/control/model.ts";
import {
  prepare,
  executeMock,
  mockProvider,
} from "../../../src/auto-factory/control/executor.ts";
import { verifyReadiness } from "../pilot/readiness.mjs";
const hash = z.string().regex(/^[a-f0-9]{64}$/),
  date = z.iso.datetime();
export const MockAuthorization = z.strictObject({
  schemaVersion: z.literal(1),
  scope: z.literal("MOCK_ONLY_NOT_OWNER_APPROVAL"),
  productionId: z.literal("video06-v2-audition"),
  buildSha256: hash,
  scriptSha256: hash,
  readinessSha256: hash,
  ssmlSha256: z.array(hash).length(12),
  maxRequests: z.literal(12),
  maxAttempts: z.literal(1),
  azureMaxMicrousd: z.number().int().min(14895).max(80000),
  totalMaxMicrousd: z.number().int().min(14895).max(80000),
  openingLiabilities: z.number().int().min(0).max(8000000),
  mockOpeningBalanceVerified: z.boolean(),
  checkedAt: date,
  pricingExpiresAt: date,
  expiresAt: date,
  paidExecutionAllowed: z.literal(false),
});
export type LocalConfig = {
  root: string;
  tools: ToolPaths;
  buildFile: string;
  authorizationFile: string;
  media: string;
  backup: string;
  anchor: string;
  remote: string;
  work: string;
};
export async function validate(c: LocalConfig, now = new Date().toISOString()) {
  const repoRoot = git(c.root, c.tools.git, ["rev-parse", "--show-toplevel"]);
  await external(repoRoot, c.buildFile);
  await external(repoRoot, c.authorizationFile);
  const b = Build.parse(JSON.parse(await readFile(c.buildFile, "utf8"))),
    a = MockAuthorization.parse(
      JSON.parse(await readFile(c.authorizationFile, "utf8")),
    );
  if (sha(JSON.stringify(b)) !== a.buildSha256)
    throw Error("BUILD_AUTHORIZATION_HASH");
  await verifyBuild(c.root, b, c.tools);
  if (
    !Number.isFinite(Date.parse(now)) ||
    Date.parse(a.checkedAt) > Date.parse(now) ||
    Date.parse(a.expiresAt) <= Date.parse(now) ||
    Date.parse(a.pricingExpiresAt) <= Date.parse(now)
  )
    throw Error("STALE_AUTHORIZATION_OR_PRICING");
  if (!a.mockOpeningBalanceVerified) throw Error("OPENING_BALANCE_UNVERIFIED");
  if (
    a.azureMaxMicrousd > a.totalMaxMicrousd ||
    a.totalMaxMicrousd + a.openingLiabilities > 8000000
  )
    throw Error("BUDGET_EXCEEDED");
  const sb = await readFile(
      join(c.root, "briefs/english-video-06-candidate-v2.json"),
    ),
    rb = await readFile(
      join(c.root, "briefs/auto-factory/video06-v2-readiness.json"),
    ),
    r = JSON.parse(rb.toString()),
    price = JSON.parse(
      await readFile(
        join(c.root, "briefs/auto-factory/video06-price-reference.json"),
        "utf8",
      ),
    );
  verifyReadiness(r, sb, "v2", price);
  if (a.scriptSha256 !== sha(sb) || a.readinessSha256 !== sha(rb))
    throw Error("SCRIPT_PLAN_HASH");
  const requests = r.audition.variants.flatMap((v: any) =>
    v.requests.map((x: any) => ({ ...x, requestId: v.variant + "-" + x.id })),
  );
  if (
    requests.length !== 12 ||
    JSON.stringify(requests.map((r: any) => r.ssmlSha256)) !==
      JSON.stringify(a.ssmlSha256)
  )
    throw Error("REQUEST_SCOPE_HASH");
  if (
    r.audition.estimatedMicrousd > a.azureMaxMicrousd ||
    r.audition.estimatedMicrousd > a.totalMaxMicrousd
  )
    throw Error("BUDGET_EXCEEDED");
  const roots = await privateRoots(repoRoot, c.media, c.backup, c.anchor);
  for (const p of [c.remote, c.work]) await external(repoRoot, p);
  const storage = await Promise.all(
    [c.media, c.backup, c.anchor, c.remote, c.work].map((p) => realpath(p)),
  );
  for (let i = 0; i < storage.length; i++)
    for (let j = 0; j < i; j++) {
      const rel = relative(storage[j], storage[i]),
        back = relative(storage[i], storage[j]);
      if (
        (!rel.startsWith("..") && !isAbsolute(rel)) ||
        (!back.startsWith("..") && !isAbsolute(back))
      )
        throw Error("STORAGE_ROOT_OVERLAP");
    }
  const ar = await realpath(c.anchor);
  for (const p of [c.remote, c.work, c.media, c.backup]) {
    const real = await realpath(p),
      rel = relative(real, ar),
      reverse = relative(ar, real);
    if (
      (!rel.startsWith("..") && !isAbsolute(rel)) ||
      (!reverse.startsWith("..") && !isAbsolute(reverse))
    )
      throw Error("ANCHOR_NOT_SEPARATE");
  }
  return { b, a, r, requests, roots };
}
export async function simulation(
  c: LocalConfig,
  operation: "initialize" | "run",
  options: {
    now?: string;
    crashAt?:
      | "BEFORE_RESERVATION"
      | "AFTER_RESERVATION"
      | "BEFORE_DISPATCH"
      | "AFTER_DISPATCH"
      | "AFTER_RESPONSE";
    behavior?: "OK" | "TIMEOUT" | "MISSING_RECEIPT";
    requestLimit?: number;
  } = {},
) {
  const now = options.now ?? new Date().toISOString(),
    v = await validate(c, now),
    { a, b, requests } = v;
  await layout(c.media);
  const lock = join(c.media, "executor.lock");
  const h = await open(lock, "wx", 0o600);
  try {
    const policy = Policy.parse({
      schemaVersion: 1,
      scope: "OFFLINE_SIMULATION_ONLY",
      policyId: "video06-local-mock",
      ownerApprovalId: "outside-repo-mock-only",
      codeSha: b.codeSha,
      expiresAt: a.expiresAt,
      productionMicrousd: 8000000,
      reserveMicrousd: 2000000,
      totalMicrousd: 10000000,
      maxVideoMicrousd: 80000,
      openingLiabilities: a.openingLiabilities,
      openingBalanceVerified: a.mockOpeningBalanceVerified,
      englishScheduledAllowed: false,
      productOnDemandAllowed: false,
      pricing: {
        id: "outside-repo-mock-pricing",
        checkedAt: a.checkedAt,
        expiresAt: a.pricingExpiresAt,
        evidenceSha256: digest({
          price: a.pricingExpiresAt,
          scope: "MOCK_ONLY",
        }),
      },
      blockUnresolved: true,
    });
    // A fixed timestamp from external mock approval preserves plan identity across resumes.
    const plan = Plan.parse({
      schemaVersion: 1,
      productionId: a.productionId,
      mode: "ENGLISH_LEARNING",
      trigger: "ON_DEMAND",
      scheduledFor: a.checkedAt,
      localDate: localDate(a.checkedAt),
      contentSha256: a.scriptSha256,
      policySha256: digest(policy),
      codeSha: b.codeSha,
      requests: requests.map((r: any) => ({
        requestId: r.requestId,
        provider: "MOCK_AZURE_SPEECH",
        maxMicrousd: r.estimatedMicrousd,
        inputSha256: r.ssmlSha256,
      })),
    });
    const ledger = new GitLedger({
      remote: c.remote,
      work: c.work,
      checkpoint: join(c.anchor, "mock-checkpoint.json"),
      ref: "refs/heads/test-local-video06",
      policySha256: digest(policy),
      gitExecutable: c.tools.git,
    });
    if (operation === "initialize") await ledger.initialize(policy); // explicit only; NEVER initialize on missing journal during resume
    await prepare(
      ledger,
      plan,
      {
        ownerApprovalId: policy.ownerApprovalId,
        productionId: plan.productionId,
        planSha256: digest(plan),
        policySha256: digest(policy),
        codeSha: b.codeSha,
        expiresAt: a.expiresAt,
      },
      now,
    );
    let sent = 0,
      cached = 0;
    for (const r of requests.slice(
      0,
      operation === "initialize" ? 0 : (options.requestLimit ?? 12),
    )) {
      await validate(c, new Date(now).toISOString());
      // Fixed module-owned mock adapter only. There is no credential parameter or real-provider branch.
      const provider = mockProvider(
        "MOCK_AZURE_SPEECH",
        options.behavior ?? "OK",
        "FAKE_SECRET_DO_NOT_LOG",
        r.estimatedMicrousd,
      );
      const result = await executeMock(
        ledger,
        plan.productionId,
        r.requestId,
        provider,
        now,
        { crashAt: options.crashAt },
      );
      sent += provider.calls;
      if (result.status === "CACHED_VERIFIED") cached++;
      const snap = await ledger.read(),
        state = project(snap.journal).productions[plan.productionId],
        receipt = state.attempts[attemptId(policy, plan, r.requestId)];
      if (
        !receipt ||
        receipt.state !== "VERIFIED" ||
        receipt.artifactSha256 !== result.artifactSha256
      )
        throw Error("MOCK_RECEIPT_BINDING");
      await exclusive(c.media, "ssml/" + r.requestId + ".ssml", r.ssml);
      await exclusive(
        c.media,
        "receipts/" + r.requestId + ".json",
        JSON.stringify({
          kind: "MOCK_RECEIPT_NOT_AUDIO",
          requestId: r.requestId,
          inputSha256: r.ssmlSha256,
          attemptId: result.attemptId,
          artifactSha256: result.artifactSha256,
          publicationAllowed: false,
        }) + "\n",
      );
    }
    const snap = await ledger.read(),
      projection = project(snap.journal);
    return {
      scope: "MOCK_ONLY",
      newMockCalls: sent,
      cached,
      revision: snap.revision,
      projection,
      paidExecutionAllowed: false,
      productionLedger: "BLOCKED_TEST_AUTHORITY_ONLY",
      windowsReadiness:
        process.platform === "win32"
          ? "MOCK_TESTS_ONLY_NOT_PRODUCTION_PROOF"
          : "UNVERIFIED",
    };
  } finally {
    await h.close();
    await unlink(lock);
  }
}
export async function realExecution(): Promise<never> {
  throw Error("REAL_PROVIDER_DISABLED");
}
