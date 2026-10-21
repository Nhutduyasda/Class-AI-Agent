import { readFile } from "node:fs/promises";
import { importMedia, saveImport } from "./media.ts";
const [script, manifest, root, approvedManifestSha, out] =
  process.argv.slice(2);
if (!out)
  throw Error(
    "Usage: node scripts/auto-factory/pilot/import.ts <candidate.json> <manifest.json> <media-root> <independently-reviewed-manifest-sha256> <output-root>",
  );
const result = await importMedia(
  await readFile(script),
  JSON.parse(await readFile(manifest, "utf8")),
  root,
  approvedManifestSha,
);
console.log(await saveImport(result, out));
