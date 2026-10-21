import { execFileSync } from "node:child_process";
import { mkdtemp, copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GitLedger } from "../../../src/auto-factory/control/git-ledger.ts";
import { Policy, Plan, digest, type PolicyType, type PlanType } from "../../../src/auto-factory/control/model.ts";
export const NOW = "2026-10-21T06:00:00Z";

export function policy(overrides: Partial<PolicyType> = {}) {
  return Policy.parse({
    schemaVersion: 1,
    scope: "OFFLINE_SIMULATION_ONLY",
    policyId: "offline-policy",
    ownerApprovalId: "mock-owner-approval",
    codeSha: "f4e20463ba83f27e40520321feb146673e88f081",
    expiresAt: "2026-11-21T00:00:00Z",
    productionMicrousd: 8000000,
    reserveMicrousd: 2000000,
    totalMicrousd: 10000000,
    maxVideoMicrousd: 80000,
    openingLiabilities: 0,
    openingBalanceVerified: true,
    englishScheduledAllowed: true,
    productOnDemandAllowed: true,

    pricing: {
      id: "mock-price-only",
      checkedAt: "2026-10-21T00:00:00Z",
      expiresAt: "2026-10-22T00:00:00Z",
      evidenceSha256: digest("MOCK_PRICE_NOT_PROVIDER_BILLING")
    },

    blockUnresolved: true,
    ...overrides
  });
}

export function planFor(
  p: PolicyType,
  id = "production-one",
  mode: "ENGLISH_LEARNING" | "PRODUCT_SHOWCASE" = "ENGLISH_LEARNING"
): PlanType {
  return Plan.parse({
    schemaVersion: 1,
    productionId: id,
    mode,
    trigger: mode === "PRODUCT_SHOWCASE" ? "ON_DEMAND" : "SCHEDULED",
    scheduledFor: NOW,
    localDate: "2026-10-21",
    contentSha256: digest("canonical content"),
    policySha256: digest(p),
    codeSha: p.codeSha,

    requests: [{
      requestId: "llm",
      provider: "MOCK_LLM",
      maxMicrousd: 1000,
      inputSha256: digest("bounded llm input")
    }, {
      requestId: "speech",
      provider: "MOCK_AZURE_SPEECH",
      maxMicrousd: 2000,
      inputSha256: digest("approved speech plan")
    }]
  });
}

export function approval(p: PolicyType, plan: PlanType) {
  return {
    ownerApprovalId: p.ownerApprovalId,
    productionId: plan.productionId,
    planSha256: digest(plan),
    policySha256: digest(p),
    codeSha: p.codeSha,
    expiresAt: "2026-10-22T00:00:00Z"
  };
}

export async function context(p = policy()) {
  const root = await mkdtemp(join(tmpdir(), "ej-durable-Đ-"));
  const remote = join(root, "remote.git");

  execFileSync("git", ["init", "--bare", "--quiet", remote], {
    stdio: "pipe"
  });

  const ref = "refs/heads/test-factory-ledger", checkpoint = join(root, "owner-anchor", "one.json");

  const ledger = new GitLedger({
    remote,
    work: join(root, "writer-one"),
    ref,
    checkpoint,
    policySha256: digest(p)
  });

  const genesis = await ledger.initialize(p);

  return {
    root,
    remote,
    ref,
    checkpoint,
    ledger,
    policy: p,
    genesis
  };
}

export async function secondWriter(c: Awaited<ReturnType<typeof context>>, name = "two") {
  const checkpoint = join(c.root, "owner-anchor", name + ".json");
  await copyFile(c.checkpoint, checkpoint);

  return new GitLedger({
    remote: c.remote,
    ref: c.ref,
    work: join(c.root, "writer-" + name),
    checkpoint,
    policySha256: digest(c.policy)
  });
}
