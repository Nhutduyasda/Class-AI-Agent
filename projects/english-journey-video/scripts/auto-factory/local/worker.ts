import { readFile, writeFile } from "node:fs/promises";
import { simulation } from "./executor.ts";
import { NOW } from "./fixtures.ts";
const [path, result, crash] = process.argv.slice(2),
  c = JSON.parse(await readFile(path, "utf8"));
try {
  const x = await simulation(c, "run", {
    now: NOW,
    requestLimit: 1,
    crashAt: crash as any,
  });
  await writeFile(
    result,
    JSON.stringify({ status: "PASS", calls: x.newMockCalls }),
  );
} catch {
  await writeFile(result, JSON.stringify({ status: "BLOCKED" }));
  process.exitCode = 2;
}
