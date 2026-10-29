// Test-only abrupt process termination at acknowledged Gate2 boundaries. Never a provider runner.
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { GitLedger } from "../../../src/auto-factory/control/git-ledger.ts";
import { digest } from "../../../src/auto-factory/control/model.ts";
import {
  executeMock,
  mockProvider,
} from "../../../src/auto-factory/control/executor.ts";
import { NOW } from "./fixtures.ts";
const [file, boundary] = process.argv.slice(2),
  c = JSON.parse(await readFile(file, "utf8"));
const j = JSON.parse(
  execFileSync(
    c.tools.git,
    [
      "--git-dir",
      c.remote,
      "show",
      "refs/heads/test-local-video06:ledger.json",
    ],
    { encoding: "utf8" },
  ),
);
class CrashLedger extends GitLedger {
  async append(...args: Parameters<GitLedger["append"]>) {
    const kind = args[1].kind;
    if (
      (boundary === "BEFORE_RESERVATION" && kind === "RESERVED") ||
      (boundary === "AFTER_RESPONSE" && kind === "VERIFIED")
    )
      process.kill(process.pid, "SIGKILL");
    const x = await super.append(...args);
    if (
      (boundary === "AFTER_RESERVATION" && kind === "RESERVED") ||
      (boundary === "AFTER_DISPATCH" && kind === "DISPATCHING")
    )
      process.kill(process.pid, "SIGKILL");
    return x;
  }
}
const ledger = new CrashLedger({
  remote: c.remote,
  work: join(c.work, "abrupt-worker"),
  checkpoint: join(c.anchor, "mock-checkpoint.json"),
  ref: "refs/heads/test-local-video06",
  policySha256: digest(j.policy),
  gitExecutable: c.tools.git,
});
await executeMock(
  ledger,
  "video06-v2-audition",
  "neutral-hook",
  mockProvider("MOCK_AZURE_SPEECH"),
  NOW,
);
throw Error("FAULT_BOUNDARY_NOT_REACHED");
