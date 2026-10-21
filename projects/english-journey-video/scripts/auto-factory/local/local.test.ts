import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFile,
  writeFile,
  rm,
  open,
  mkdir,
  copyFile,
} from "node:fs/promises";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fixture, NOW } from "./fixtures.ts";
import { simulation, validate, realExecution } from "./executor.ts";
import { captureBuild, sha, treeHash } from "./trust.ts";
import {
  layout,
  exclusive,
  backupFiles,
  restore,
  privateRoots,
} from "./retention.ts";
const mutateAuth = async (f: any, fn: (a: any) => void) => {
  fn(f.a);
  await writeFile(f.c.authorizationFile, JSON.stringify(f.a));
};
test("V2 12 mock requests, durable readback, exact resume and opening liabilities", async () => {
  const f = await fixture();
  try {
    const init = await simulation(f.c, "initialize", { now: NOW });
    assert.equal(init.newMockCalls, 0);
    const a = await simulation(f.c, "run", { now: NOW });
    assert.equal(a.newMockCalls, 12);
    assert.equal(a.projection.confirmedCosts, 14895);
    assert.equal(a.projection.openingLiabilities, 12345);
    assert.equal(a.projection.remainingProduction, 8000000 - 12345 - 14895);
    assert.equal(a.projection.submittedRequests, 12);
    const b = await simulation(f.c, "run", { now: NOW });
    assert.equal(b.newMockCalls, 0);
    assert.equal(b.cached, 12);
    assert.equal(b.paidExecutionAllowed, false);
    assert.equal(b.productionLedger, "BLOCKED_TEST_AUTHORITY_ONLY");
    const receipts = await readFile(
      join(f.c.media, "receipts", "neutral-hook.json"),
      "utf8",
    );
    assert.ok(!receipts.includes("FAKE_SECRET"));
  } finally {
    await rm(f.home, { recursive: true, force: true });
  }
});
for (const crashAt of [
  "BEFORE_RESERVATION",
  "AFTER_RESERVATION",
  "BEFORE_DISPATCH",
  "AFTER_DISPATCH",
  "AFTER_RESPONSE",
] as const)
  test("restart at " + crashAt, async () => {
    const f = await fixture();
    try {
      await simulation(f.c, "initialize", { now: NOW });
      await assert.rejects(
        simulation(f.c, "run", { now: NOW, requestLimit: 1, crashAt }),
        /SIMULATED_CRASH/,
      );
      if (crashAt === "BEFORE_RESERVATION") {
        assert.equal(
          (await simulation(f.c, "run", { now: NOW, requestLimit: 1 }))
            .newMockCalls,
          1,
        );
      } else {
        await assert.rejects(
          simulation(f.c, "run", { now: NOW, requestLimit: 1 }),
          /RECONCILIATION_REQUIRED_NO_RETRY/,
        );
      }
    } finally {
      await rm(f.home, { recursive: true, force: true });
    }
  });
for (const behavior of ["TIMEOUT", "MISSING_RECEIPT"] as const)
  test(
    "ambiguous mock " + behavior + " blocks all later requests",
    async () => {
      const f = await fixture();
      try {
        await simulation(f.c, "initialize", { now: NOW });
        await assert.rejects(
          simulation(f.c, "run", { now: NOW, behavior }),
          /AMBIGUOUS_PAID_NO_RETRY/,
        );
        await assert.rejects(
          simulation(f.c, "run", { now: NOW }),
          /RECONCILIATION_REQUIRED_NO_RETRY/,
        );
      } finally {
        await rm(f.home, { recursive: true, force: true });
      }
    },
  );
test("missing auth, wrong code/dependency/hash/count/price/balance and paid scope fail closed", async () => {
  const f = await fixture();
  try {
    await assert.rejects(realExecution(), /REAL_PROVIDER_DISABLED/);
    const original = JSON.stringify(f.a);
    for (const fn of [
      (a: any) => (a.scriptSha256 = "0".repeat(64)),
      (a: any) => (a.ssmlSha256[0] = "0".repeat(64)),
      (a: any) => (a.maxRequests = 13),
      (a: any) => (a.maxAttempts = 2),
      (a: any) => (a.paidExecutionAllowed = true),
      (a: any) => (a.scope = "PRODUCTION"),
      (a: any) => (a.pricingExpiresAt = "2026-10-20T00:00:00Z"),
      (a: any) => (a.mockOpeningBalanceVerified = false),
      (a: any) => (a.openingLiabilities = 7999999),
    ]) {
      f.a = JSON.parse(original);
      await mutateAuth(f, fn);
      await assert.rejects(validate(f.c, NOW));
    }
    await rm(f.c.authorizationFile);
    await assert.rejects(validate(f.c, NOW));
    await writeFile(f.c.authorizationFile, original);
    await writeFile(
      join(f.c.root, "scripts/auto-factory/local/cli.ts"),
      "tampered",
    );
    await assert.rejects(validate(f.c, NOW), /CHECKOUT_NOT_CLEAN/);
    await copyFile(
      join(import.meta.dirname, "cli.ts"),
      join(f.c.root, "scripts/auto-factory/local/cli.ts"),
    );
    await writeFile(join(f.c.root, "node_modules/zod/tampered.txt"), "changed");
    await assert.rejects(validate(f.c, NOW), /BUILD_HASH_MISMATCH/);
  } finally {
    await rm(f.home, { recursive: true, force: true });
  }
});
test("missing journal/storage and remote rollback refuse resume; no silent initialization", async () => {
  const f = await fixture();
  try {
    await assert.rejects(
      simulation(f.c, "run", { now: NOW }),
      /JOURNAL_MISSING/,
    );
    await simulation(f.c, "initialize", { now: NOW });
    const genesis = execFileSync(
      f.c.tools.git,
      ["--git-dir", f.c.remote, "rev-parse", "refs/heads/test-local-video06"],
      { encoding: "utf8" },
    ).trim();
    await simulation(f.c, "run", { now: NOW, requestLimit: 1 });
    execFileSync(f.c.tools.git, [
      "--git-dir",
      f.c.remote,
      "update-ref",
      "refs/heads/test-local-video06",
      genesis,
    ]);
    await assert.rejects(
      simulation(f.c, "run", { now: NOW }),
      /JOURNAL_REWOUND/,
    );
    await rm(f.c.remote, { recursive: true });
    await assert.rejects(simulation(f.c, "run", { now: NOW }));
  } finally {
    await rm(f.home, { recursive: true, force: true });
  }
});
test("two Node processes cannot double dispatch one request", async () => {
  const f = await fixture();
  try {
    await simulation(f.c, "initialize", { now: NOW });
    const cfg = join(f.home, "worker-config.json");
    await writeFile(cfg, JSON.stringify(f.c));
    const files = [join(f.home, "one.json"), join(f.home, "two.json")];
    await Promise.all(
      files.map(
        (out) =>
          new Promise<void>((resolve, reject) => {
            const p = spawn(
              process.execPath,
              [join(import.meta.dirname, "worker.ts"), cfg, out],
              { stdio: "ignore" },
            );
            p.on("error", reject);
            p.on("exit", () => resolve());
          }),
      ),
    );
    const results = await Promise.all(
      files.map((p) => readFile(p, "utf8").then(JSON.parse)),
    );
    assert.equal(
      results.reduce((n, r) => n + (r.calls ?? 0), 0),
      1,
    );
    assert.equal(
      (await simulation(f.c, "run", { now: NOW, requestLimit: 1 }))
        .newMockCalls,
      0,
    );
  } finally {
    await rm(f.home, { recursive: true, force: true });
  }
});
test("Unicode private directories, immutable media, backup and hash-verified restore", async () => {
  const f = await fixture();
  try {
    await privateRoots(f.c.root, f.c.media, f.c.backup, f.c.anchor);
    await layout(f.c.media);
    await exclusive(
      f.c.media,
      "authorized-wav/mock.wav",
      Buffer.from("mock-data-not-speech"),
    );
    await exclusive(f.c.media, "receipts/mock.json", '{"kind":"MOCK"}');
    await assert.rejects(
      exclusive(f.c.media, "authorized-wav/mock.wav", "different"),
      /IMMUTABLE/,
    );
    const m = await backupFiles(f.c.media, f.c.backup, [
      "authorized-wav/mock.wav",
      "receipts/mock.json",
    ]);
    assert.equal(m.files.length, 2);
    const target = join(f.home, "restored-Đ");
    await mkdir(target);
    assert.equal(
      (await restore(f.c.backup, target, sha(JSON.stringify(m) + "\n"))).files,
      2,
    );
    await writeFile(join(f.c.backup, "authorized-wav/mock.wav"), "corrupt");
    const fresh = join(f.home, "new-restore");
    await mkdir(fresh);
    await assert.rejects(
      restore(f.c.backup, fresh, sha(JSON.stringify(m) + "\n")),
      /BACKUP_HASH/,
    );
    await assert.rejects(exclusive(f.c.media, "../outside.json", "x"));
    await assert.rejects(
      privateRoots(f.c.root, f.c.root, f.c.backup, f.c.anchor),
      /IN_REPO/,
    );
  } finally {
    await rm(f.home, { recursive: true, force: true });
  }
});

for (const boundary of [
  "BEFORE_RESERVATION",
  "AFTER_RESERVATION",
  "AFTER_DISPATCH",
  "AFTER_RESPONSE",
])
  test("abrupt child termination " + boundary, async () => {
    const f = await fixture();
    try {
      await simulation(f.c, "initialize", { now: NOW });
      const cfg = join(f.home, "crash-config.json");
      await writeFile(cfg, JSON.stringify(f.c));
      const exit = await new Promise<any>((resolve, reject) => {
        const p = spawn(
          process.execPath,
          [join(import.meta.dirname, "crash-worker.ts"), cfg, boundary],
          { stdio: "ignore" },
        );
        p.on("error", reject);
        p.on("exit", (code, signal) => resolve({ code, signal }));
      });
      assert.ok(exit.signal || exit.code !== 0);
      if (boundary === "BEFORE_RESERVATION")
        assert.equal(
          (await simulation(f.c, "run", { now: NOW, requestLimit: 1 }))
            .newMockCalls,
          1,
        );
      else
        await assert.rejects(
          simulation(f.c, "run", { now: NOW, requestLimit: 1 }),
          /RECONCILIATION_REQUIRED_NO_RETRY/,
        );
    } finally {
      await rm(f.home, { recursive: true, force: true });
    }
  });
