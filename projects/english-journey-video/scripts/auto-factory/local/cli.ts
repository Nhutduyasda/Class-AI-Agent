import { readFile } from "node:fs/promises";
import { simulation, realExecution } from "./executor.ts";
const [mode, config] = process.argv.slice(2);
try {
  if (mode !== "initialize-mock" && mode !== "run-mock") await realExecution();
  if (!config) throw Error("CONFIG_REQUIRED");
  const c = JSON.parse(await readFile(config, "utf8"));
  console.log(
    JSON.stringify(
      await simulation(c, mode === "initialize-mock" ? "initialize" : "run"),
    ),
  );
} catch (e) {
  const msg = e instanceof Error ? e.message : "";
  const allowed = new Set([
    "REAL_PROVIDER_DISABLED",
    "CONFIG_REQUIRED",
    "STALE_AUTHORIZATION_OR_PRICING",
    "BUILD_AUTHORIZATION_HASH",
    "BUILD_HASH_MISMATCH",
    "CHECKOUT_NOT_CLEAN",
    "SCRIPT_PLAN_HASH",
    "REQUEST_SCOPE_HASH",
    "OPENING_BALANCE_UNVERIFIED",
    "BUDGET_EXCEEDED",
    "RECONCILIATION_REQUIRED_NO_RETRY",
    "AMBIGUOUS_PAID_NO_RETRY",
    "TRUSTED_CHECKPOINT_REQUIRED",
    "JOURNAL_REWOUND",
    "JOURNAL_MISSING",
    "JOURNAL_PREFIX_CHANGED",
    "COMMIT_ACK_UNCERTAIN",
  ]);
  console.error(allowed.has(msg) ? msg : "LOCAL_PREFLIGHT_BLOCKED");
  process.exitCode = 1;
}
