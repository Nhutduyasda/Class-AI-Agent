import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, access, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { GitLedger, gitNullDevice } from "../../../src/auto-factory/control/git-ledger.ts";
import { policy } from "../control/fixtures.ts";
import { digest } from "../../../src/auto-factory/control/model.ts";
import { safeEnv } from "./trust.ts";

test("Git null configuration uses native Git device paths on every supported OS", () => {
  assert.equal(gitNullDevice("win32"), "NUL");
  assert.equal(gitNullDevice("linux"), "/dev/null");
  assert.equal(gitNullDevice("darwin"), "/dev/null");
  assert.equal(safeEnv().GIT_CONFIG_GLOBAL, gitNullDevice());
  assert.equal(safeEnv().GIT_CONFIG_NOSYSTEM, "1");
  assert.equal(safeEnv().GIT_TERMINAL_PROMPT, "0");
  assert.equal(safeEnv().GIT_ALLOW_PROTOCOL, "file");
});

test("real ledger ignores inherited Git configuration and local pre-push hooks", async () => {
  const home = await mkdtemp(join(tmpdir(), "Git-NUL-Đ-"));
  const saved = { global: process.env.GIT_CONFIG_GLOBAL, count: process.env.GIT_CONFIG_COUNT };
  try {
    const work = join(home, "writer"), remote = join(home, "remote.git"), hooks = join(home, "hooks");
    await mkdir(work); await mkdir(hooks);
    const git = (args: string[]) => execFileSync("git", args, { env: safeEnv(), stdio: "pipe" });
    git(["init", "--quiet", work]); git(["init", "--bare", "--quiet", remote]);
    await writeFile(join(hooks, "pre-push"), "#!/bin/sh\nexit 97\n", { mode: 0o755 });
    git(["-C", work, "config", "core.hooksPath", hooks]);
    const poison = join(home, "poison.gitconfig");
    await writeFile(poison, "[this is invalid\n");
    process.env.GIT_CONFIG_GLOBAL = poison;
    process.env.GIT_CONFIG_COUNT = "invalid";
    const p = policy();
    const ledger = new GitLedger({ remote, work, ref: "refs/heads/test-nul", checkpoint: join(home, "anchor.json"), policySha256: digest(p) });
    const initial = await ledger.initialize(p);
    assert.equal((await ledger.read()).commit, initial.commit);
    await access(join(home, "anchor.json"));
  } finally {
    if (saved.global === undefined) delete process.env.GIT_CONFIG_GLOBAL; else process.env.GIT_CONFIG_GLOBAL = saved.global;
    if (saved.count === undefined) delete process.env.GIT_CONFIG_COUNT; else process.env.GIT_CONFIG_COUNT = saved.count;
    await rm(home, { recursive: true, force: true });
  }
});
