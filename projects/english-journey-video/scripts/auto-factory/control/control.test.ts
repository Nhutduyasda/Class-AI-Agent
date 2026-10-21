import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, copyFile, mkdir, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { GitLedger } from "../../../src/auto-factory/control/git-ledger.ts";
import { prepare, executeMock, mockProvider, realProviderDisabled } from "../../../src/auto-factory/control/executor.ts";
import { project, digest, appendEvent, attemptId, validatePlan, localDate, Policy, Plan } from "../../../src/auto-factory/control/model.ts";
import { context, secondWriter, policy, planFor, approval, NOW } from "./fixtures.ts";

async function ready(
  c: Awaited<ReturnType<typeof context>>,
  id = "production-one",
  mode: "ENGLISH_LEARNING" | "PRODUCT_SHOWCASE" = "ENGLISH_LEARNING"
) {
  const p = planFor(c.policy, id, mode);
  await prepare(c.ledger, p, approval(c.policy, p), NOW);
  return p;
}

test("real bare remote acknowledgement, event chain, no double charge across services", async () => {
  const c = await context();
  const p = await ready(c);
  const r = await executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW);
  assert.equal(r.status, "MOCK_VERIFIED");
  await executeMock(c.ledger, p.productionId, "speech", mockProvider("MOCK_AZURE_SPEECH"), NOW);
  const s = await c.ledger.read(), b = project(s.journal);
  assert.equal(s.revision, 9);
  assert.equal(b.confirmedCosts, 200);
  assert.equal(b.outstandingReservations, 0);
  assert.equal(b.submittedRequests, 2);
  assert.equal(b.remainingProduction, 7999800);

  assert.equal(execFileSync("git", ["--git-dir", c.remote, "rev-parse", c.ref], {
    encoding: "utf8"
  }).trim(), s.commit);
});

test("new runner with retained independent anchor reuses verified receipt", async () => {
  const c = await context(), p = await ready(c);
  await executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW);
  const restarted = await secondWriter(c);
  const adapter = mockProvider("MOCK_LLM");

  const x = await executeMock(restarted, p.productionId, "llm", adapter, NOW, {
    workflowRunId: "a-different-run"
  });

  assert.equal(x.status, "CACHED_VERIFIED");
  assert.equal(adapter.calls, 0);
  assert.equal(project((await restarted.read()).journal).confirmedCosts, 100);
});

test("two actual OS processes race through independent git writers", async () => {
  const c = await context(), a = await ready(c, "production-a"), b = await ready(c, "production-b");
  const s = await c.ledger.read();
  const readyFiles: string[] = [], resultFiles: string[] = [], processes: Promise<void>[] = [];
  const go = join(c.root, "go");

  for (const [i, p] of [a, b].entries()) {
    const checkpoint = join(c.root, "owner-anchor", `race-${i}.json`);
    await copyFile(c.checkpoint, checkpoint);
    const config = join(c.root, `race-${i}.json`), r = join(c.root, `result-${i}.json`), ready = join(c.root, `ready-${i}`);
    readyFiles.push(ready);
    resultFiles.push(r);

    await writeFile(config, JSON.stringify({
      options: {
        remote: c.remote,
        ref: c.ref,
        work: join(c.root, `race-writer-${i}`),
        checkpoint,
        policySha256: digest(c.policy)
      },

      revision: s.revision,

      payload: {
        kind: "RESERVED",
        productionId: p.productionId,
        requestId: "llm",
        attemptId: attemptId(c.policy, p, "llm")
      },

      at: NOW,
      ready,
      go,
      result: r
    }));

    const child = spawn(process.execPath, [resolve("scripts/auto-factory/control/race-worker.ts"), config], {
      stdio: "pipe"
    });

    processes.push(new Promise((res, rej) => {
      child.on("error", rej);
      child.on("exit", code => code === 0 ? res() : rej(Error("RACE_WORKER_FAILED")));
    }));
  }

  for (let n = 0; ; n++) {
    const ok = await Promise.all(readyFiles.map(f => readFile(f).then(() => true, () => false)));

    if (ok.every(Boolean))
      break;

    assert.ok(n < 1000, "workers ready within bound");
    await new Promise(r => setTimeout(r, 10));
  }

  await writeFile(go, "go");
  await Promise.all(processes);
  const results = await Promise.all(resultFiles.map(async f => JSON.parse(await readFile(f, "utf8"))));
  assert.equal(results.filter(x => x.status === "COMMITTED").length, 1);
  const final = await c.ledger.read();
  assert.equal(final.revision, s.revision + 1);
  assert.equal(Object.keys(project(final.journal).dailySlots).length, 1);
});

for (const crashAt of ["BEFORE_RESERVATION", "AFTER_RESERVATION", "BEFORE_DISPATCH", "AFTER_DISPATCH", "AFTER_RESPONSE"] as const) test(`restart after ${crashAt} never repeats uncertain paid simulation`, async () => {
  const c = await context(), p = await ready(c);
  const provider = mockProvider("MOCK_LLM");

  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", provider, NOW, {
    crashAt
  }), /SIMULATED_CRASH/);

  const before = provider.calls, restarted = await secondWriter(c);

  if (crashAt === "BEFORE_RESERVATION") {
    await executeMock(restarted, p.productionId, "llm", provider, NOW);
    assert.equal(provider.calls, 1);
  } else {
    await assert.rejects(executeMock(restarted, p.productionId, "llm", provider, NOW, {
      workflowRunId: "new-id"
    }), /RECONCILIATION/);

    assert.equal(provider.calls, before);
    assert.equal(project((await restarted.read()).journal).unresolved, true);
  }
});

for (const behavior of ["TIMEOUT", "MISSING_RECEIPT"] as const) test(`${behavior} consumes one attempt; global latch blocks later production`, async () => {
  const c = await context(), p = await ready(c), q = await ready(c, "product-other", "PRODUCT_SHOWCASE");
  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM", behavior), NOW), /AMBIGUOUS/);
  await assert.rejects(executeMock(c.ledger, q.productionId, "llm", mockProvider("MOCK_LLM"), NOW), /UNRESOLVED/);
  const b = project((await c.ledger.read()).journal);
  assert.equal(b.unknownCharges, 1000);
  assert.equal(b.outstandingReservations, 1000);
  assert.equal(b.submittedRequests, 1);
});

test("preflight failure proves no dispatch, retains immutable attempt and slot", async () => {
  const c = await context(), p = await ready(c);

  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW, {
    preflightFails: true
  }), /PREFLIGHT/);

  const b = project((await c.ledger.read()).journal);
  assert.equal(b.outstandingReservations, 0);
  assert.equal(b.submittedRequests, 0);
  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW), /RECONCILIATION/);
  assert.equal(Object.keys(b.dailySlots).length, 1);
});

test("duplicate production ID is idempotent only for same immutable content", async () => {
  const c = await context(), p = await ready(c), s = await c.ledger.read();
  assert.equal((await prepare(c.ledger, p, approval(c.policy, p), NOW)).revision, s.revision);

  const changed = {
    ...p,
    contentSha256: digest("changed")
  };

  await assert.rejects(prepare(c.ledger, changed, approval(c.policy, changed), NOW), /PRODUCTION_ID_REUSED/);
});

test("unknown opening balance blocks reservations before mock", async () => {
  const c = await context(policy({
          openingBalanceVerified: false
        })),
        p = await ready(c);

  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW), /OPENING_BALANCE/);
  assert.equal(project((await c.ledger.read()).journal).submittedRequests, 0);
});

test(
  "aggregate allocation boundary includes opening liabilities and protects USD 2 reserve",
  async () => {
    const c = await context(policy({
            openingLiabilities: 7999001
          })),
          p = await ready(c);

    await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW), /AGGREGATE/);

    assert.throws(() => policy({
      productionMicrousd: 10000000
    } as any));

    const d = await context(policy({
            openingLiabilities: 7999000
          })),
          q = await ready(d);

    await executeMock(d.ledger, q.productionId, "llm", mockProvider("MOCK_LLM"), NOW);
    assert.equal(project((await d.ledger.read()).journal).remainingProduction, 900);
  }
);

test("per video ceiling includes combined LLM and speech; equality allowed", () => {
  const k = policy(), p = planFor(k);
  p.requests[0].maxMicrousd = 78000;
  assert.ok(validatePlan(k, p));
  p.requests[0].maxMicrousd = 78001;
  assert.throws(() => validatePlan(k, p), /VIDEO_BUDGET/);
});

test("stale pricing blocks dispatch even with valid earlier authorization", async () => {
  const c = await context(), p = await ready(c);

  await assert.rejects(
    executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), "2026-10-22T00:00:00Z"),
    /PRICING_EXPIRED/
  );
});

test("invalid authorization is durable-plan-bound and cannot authorize calls", async () => {
  const c = await context(), p = planFor(c.policy);

  await assert.rejects(prepare(c.ledger, p, {
    ...approval(c.policy, p),
    planSha256: digest("wrong")
  }, NOW), /INVALID_AUTHORIZATION/);

  assert.equal(project((await c.ledger.read()).journal).productions[p.productionId].state, "VALIDATED");
});

test("interrupted offline preparation resumes without recreating plan", async () => {
  const c = await context(), p = planFor(c.policy);

  await c.ledger.append(0, {
    kind: "PLANNED",
    plan: p
  }, NOW);

  await prepare(c.ledger, p, approval(c.policy, p), NOW);
  assert.equal((await c.ledger.read()).revision, 3);
});

test("different modes never inherit English schedule permissions", () => {
  const k = policy(), p = planFor(k, "product", "PRODUCT_SHOWCASE");

  assert.throws(() => validatePlan(k, {
    ...p,
    trigger: "SCHEDULED"
  }), /SCHEDULE/);

  const noProduct = policy({
    productOnDemandAllowed: false
  });

  assert.throws(() => validatePlan(noProduct, planFor(noProduct, "product", "PRODUCT_SHOWCASE")), /PRODUCT/);
  assert.equal(localDate("2026-10-20T17:00:00Z"), "2026-10-21");

  assert.throws(() => validatePlan(k, {
    ...planFor(k),
    localDate: "2026-10-20"
  }), /DATE/);
});

test("no real provider, arbitrary endpoint/ref or marketplace metadata crosses boundary", async () => {
  const c = await context(), p = await ready(c);
  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", realProviderDisabled, NOW), /REAL_PROVIDER_DISABLED/);

  for (const injected of [{
    endpoint: "https://127.0.0.1"
  }, {
    productUrl: "https://shopee.vn/execute"
  }, {
    metadata: "run shell command"
  }, {
    codeSha: "refs/pull/10/head"
  }]) await assert.rejects(prepare(c.ledger, {
    ...p,
    ...injected
  }, approval(c.policy, p), NOW));

  assert.throws(() => new GitLedger({
    remote: "https://github.com/a/b",
    work: c.root,
    ref: c.ref,
    checkpoint: c.checkpoint,
    policySha256: digest(c.policy)
  }), /HOSTED/);

  assert.throws(() => new GitLedger({
    remote: c.remote,
    work: c.root,
    ref: "refs/heads/factory-ledger",
    checkpoint: c.checkpoint,
    policySha256: digest(c.policy)
  }), /TEST_REF/);
});

test("fake canary credential never appears in errors, journal, receipt or diagnostics", async () => {
  const canary = "FAKE_CANARY_SECRET_DO_NOT_LOG_37", c = await context(), p = await ready(c);
  let msg = "";

  try {
    await executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM", "TIMEOUT", canary), NOW);
  } catch (e) {
    msg = String(e);
  }

  const s = await c.ledger.read();

  assert.ok(!JSON.stringify({
    msg,
    journal: s.journal
  }).includes(canary));

  assert.match(msg, /AMBIGUOUS_PAID_NO_RETRY/);
});

test("hash-chain mutation detected before any use", async () => {
  const c = await context();
  await ready(c);
  const s = await c.ledger.read(), bad = structuredClone(s.journal);

  bad.events[0].payload = {
    kind: "BLOCKED",
    productionId: "made-up",
    reason: "OWNER_STOP"
  };

  assert.throws(() => project(bad), /CHAIN/);
});

test("ref rewind and missing branch detected from retained anchor", async () => {
  const c = await context();
  await ready(c);
  execFileSync("git", ["--git-dir", c.remote, "update-ref", c.ref, c.genesis.commit]);
  await assert.rejects(c.ledger.read(), /REWOUND/);
  execFileSync("git", ["--git-dir", c.remote, "update-ref", "-d", c.ref]);
  await assert.rejects(c.ledger.read(), /MISSING/);
});

test("missing checkpoint and unavailable storage fail closed", async () => {
  const c = await context();

  const other = new GitLedger({
    remote: c.remote,
    ref: c.ref,
    work: join(c.root, "new-runner"),
    checkpoint: join(c.root, "missing-checkpoint"),
    policySha256: digest(c.policy)
  });

  await assert.rejects(other.read(), /CHECKPOINT/);
  await rename(c.remote, c.remote + ".offline");
  await assert.rejects(c.ledger.read(), /GIT_OPERATION/);
});

test("owner reconciliation records a charge without reusing the attempt", async () => {
  const c = await context(), p = await ready(c);
  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM", "TIMEOUT"), NOW));
  const s = await c.ledger.read(), id = attemptId(c.policy, p, "llm");

  await c.ledger.append(s.revision, {
    kind: "RECONCILED",
    productionId: p.productionId,
    attemptId: id,
    ownerApprovalId: c.policy.ownerApprovalId,
    evidenceSha256: digest("MOCK_ONLY owner billing receipt"),
    confirmedMicrousd: 500,
    decision: "CONFIRMED_CHARGE"
  }, NOW);

  const b = project((await c.ledger.read()).journal);
  assert.equal(b.confirmedCosts, 500);
  assert.equal(b.outstandingReservations, 0);
  assert.equal(b.unresolved, false);
  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW), /RECONCILIATION/);
});

test("lost reservation acknowledgement never invokes provider after accepted commit", async () => {
  const c = await context(), p = await ready(c);

  class LostAck extends GitLedger {
    override async read() {
      const s = await super.read();

      if (s.journal.events.at(-1)?.payload.kind === "RESERVED")
        throw Error("SIMULATED_READBACK_LOSS");

      return s;
    }
  }

  const l = new LostAck({
    remote: c.remote,
    ref: c.ref,
    work: join(c.root, "lost-ack-writer"),
    checkpoint: c.checkpoint,
    policySha256: digest(c.policy)
  });

  const provider = mockProvider("MOCK_LLM");
  await assert.rejects(executeMock(l, p.productionId, "llm", provider, NOW), /COMMIT_ACK_UNCERTAIN/);
  assert.equal(provider.calls, 0);
  assert.equal(project((await c.ledger.read()).journal).productions[p.productionId].state, "RESERVED");
  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW), /RECONCILIATION/);
});

function pushTestSnapshot(c: Awaited<ReturnType<typeof context>>, journal: unknown, parent: string) {
  const cwd = c.ledger.work;

  const git = (args: string[], input?: string) => execFileSync("git", ["-c", "user.name=Offline Test", "-c", "user.email=test@example.invalid", ...args], {
    cwd,
    input,
    encoding: "utf8",
    stdio: "pipe"
  }).trim();

  const blob = git(["hash-object", "-w", "--stdin"], JSON.stringify(journal) + "\n");
  const tree = git(["mktree"], `100644 blob ${blob}\tledger.json\n`);
  const commit = git(["commit-tree", tree, "-p", parent], "Isolated corruption test\n");
  git(["push", c.remote, `${commit}:${c.ref}`]);
}

test("corrupted real remote Git journal is rejected", async () => {
  const c = await context();
  await ready(c);
  const s = await c.ledger.read(), bad = structuredClone(s.journal);
  bad.events[0].hash = "0".repeat(64);
  pushTestSnapshot(c, bad, s.commit);
  await assert.rejects(c.ledger.read(), /JOURNAL_CORRUPT/);
});

test("valid rehashed history rewrite retaining Git ancestry fails anchored prefix", async () => {
  const c = await context();
  await ready(c);
  const s = await c.ledger.read(), bad = structuredClone(s.journal);
  let prev = digest(bad.policy);

  for (const e of bad.events) {
    e.at = "2026-10-21T06:00:01Z";
    e.previousHash = prev;

    const {
      hash,
      ...body
    } = e;

    e.hash = digest(body);
    prev = e.hash;
  }

  project(bad);
  pushTestSnapshot(c, bad, s.commit);
  await assert.rejects(c.ledger.read(), /PREFIX_CHANGED/);
});

test("read-only high-water checkpoint detects rollback after observation", async () => {
  const c = await context();
  const other = await secondWriter(c, "read-only");
  await ready(c);
  await other.read();
  execFileSync("git", ["--git-dir", c.remote, "update-ref", c.ref, c.genesis.commit]);
  await assert.rejects(other.read(), /REWOUND/);
});

test("reconciliation cannot erase dispatch charge as proven unsent", async () => {
  const c = await context(), p = await ready(c);
  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM", "TIMEOUT"), NOW));
  const s = await c.ledger.read();

  await assert.rejects(c.ledger.append(s.revision, {
    kind: "RECONCILED",
    productionId: p.productionId,
    attemptId: attemptId(c.policy, p, "llm"),
    ownerApprovalId: c.policy.ownerApprovalId,
    evidenceSha256: digest("not enough"),
    confirmedMicrousd: 0,
    decision: "PROVEN_NOT_SENT"
  }, NOW), /NOT_PROVEN_UNSENT/);
});

test("offline provider simulation has no network path", async () => {
  const c = await context(), p = await ready(c);
  const before = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = async () => {
    calls++;
    throw Error("NETWORK_FORBIDDEN");
  };

  try {
    await executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM"), NOW);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = before;
  }
});

test("confirmed overrun is recorded honestly and blocks further video spending", async () => {
  const c = await context(), p = await ready(c);
  await executeMock(c.ledger, p.productionId, "llm", mockProvider("MOCK_LLM", "OK", "FAKE_ONLY", 80001), NOW);
  assert.equal(project((await c.ledger.read()).journal).confirmedCosts, 80001);

  await assert.rejects(
    executeMock(c.ledger, p.productionId, "speech", mockProvider("MOCK_AZURE_SPEECH"), NOW),
    /VIDEO_BUDGET/
  );
});

test("product cannot reuse learning production authorization", async () => {
  const c = await context(), learning = planFor(c.policy), product = planFor(c.policy, "explicit-product", "PRODUCT_SHOWCASE");
  await assert.rejects(prepare(c.ledger, product, approval(c.policy, learning), NOW), /INVALID_AUTHORIZATION/);
});

test("untrusted transport disguised as a mock is rejected before execution", async () => {
  const c = await context(), p = await ready(c);
  let calls = 0;

  await assert.rejects(executeMock(c.ledger, p.productionId, "llm", {
    kind: "MOCK_LLM",
    calls: 0,

    async send() {
      calls++;
      throw Error("untrusted-code");
    }
  }, NOW), /UNTRUSTED_PROVIDER_ADAPTER/);

  assert.equal(calls, 0);
  const trusted = mockProvider("MOCK_LLM");
  assert.equal(Object.isFrozen(trusted), true);
});

test('untrusted provider getters are never evaluated before adapter identity check',async()=>{const c=await context(),p=await ready(c);let touched=0;const untrusted={get kind(){touched++;return 'MOCK_LLM' as const;},calls:0,async send(){throw Error('untrusted');}};await assert.rejects(executeMock(c.ledger,p.productionId,'llm',untrusted,NOW),/UNTRUSTED_PROVIDER_ADAPTER/);assert.equal(touched,0);});

test('scheduled reservation cannot backdate or burst-catch-up on another local day',()=>{const k=policy(),p=planFor(k);p.scheduledFor='2026-10-20T06:00:00Z';p.localDate='2026-10-20';let j={schemaVersion:1 as const,policy:k,events:[] as any[]};j=appendEvent(j,{kind:'PLANNED',plan:p},NOW,digest('one'));j=appendEvent(j,{kind:'VALIDATED',productionId:p.productionId},NOW,digest('two'));j=appendEvent(j,{kind:'AUTHORIZED',productionId:p.productionId,authorization:approval(k,p)},NOW,digest('three'));assert.throws(()=>appendEvent(j,{kind:'RESERVED',productionId:p.productionId,requestId:'llm',attemptId:attemptId(k,p,'llm')},NOW,digest('four')),/SCHEDULE_DAY_MISMATCH/);});
