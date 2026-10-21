import { readFile, writeFile } from "node:fs/promises";
import { GitLedger } from "../../../src/auto-factory/control/git-ledger.ts";
const cfg = JSON.parse(await readFile(process.argv[2], "utf8"));
const ledger = new GitLedger(cfg.options);
await ledger.read();
await writeFile(cfg.ready, "ready");

while (true) {
  try {
    await readFile(cfg.go);
    break;
  } catch {
    await new Promise(r => setTimeout(r, 10));
  }
}

try {
  const result = await ledger.append(cfg.revision, cfg.payload, cfg.at);

  await writeFile(cfg.result, JSON.stringify({
    status: "COMMITTED",
    ack: result.ack
  }));
} catch (e) {
  await writeFile(cfg.result, JSON.stringify({
    status: "REJECTED",
    code: e instanceof Error ? e.message : "SAFE_ERROR"
  }));
}
