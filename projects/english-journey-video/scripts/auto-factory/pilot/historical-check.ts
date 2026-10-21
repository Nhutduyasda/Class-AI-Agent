// Read-only authorized reuse test. Does not import history into Video06 or historical output paths.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha, verifiedWave } from "./media.ts";
const [root, out] = process.argv.slice(2);
if (!root || !out)
  throw Error(
    "Usage: node historical-check.ts <extracted-authorized-Video03-package> <report.json>",
  );
const manifest = JSON.parse(
    await readFile(join(root, "audio-manifest.json"), "utf8"),
  ),
  ledger = JSON.parse(await readFile(join(root, "ledger.json"), "utf8")),
  authorization = JSON.parse(
    await readFile(join(root, "authorization.json"), "utf8"),
  );
if (
  manifest.status !== "ALL_AUDIO_SAVED_VERIFIED" ||
  manifest.briefSha256 !== ledger.briefSha256 ||
  authorization.briefSha256 !== ledger.briefSha256
)
  throw Error("HISTORICAL_PROVENANCE");
const files = [];
for (const f of manifest.files) {
  if (!/^[a-z]+\.wav$/.test(f.file)) throw Error("FILE_NAME");
  const receipt = JSON.parse(
      await readFile(join(root, f.file + ".receipt.json"), "utf8"),
    ),
    call = ledger.calls.find((c: any) => c.id === f.scene);
  if (
    !call ||
    receipt.sha256 !== f.sha256 ||
    call.sha256 !== f.sha256 ||
    receipt.provenance?.kind !== "AZURE_REST" ||
    receipt.provenance.voice !== "vi-VN-NamMinhNeural" ||
    receipt.provenance.approvalId !== authorization.approvalId ||
    receipt.provenance.textSha256 !== sha(call.text)
  )
    throw Error("RECEIPT_BINDING");
  const w = await verifiedWave(join(root, f.file), f.sha256);
  if (Math.abs(w.durationSeconds - f.durationSeconds) > 1 / 48000)
    throw Error("DURATION");
  files.push({
    scene: f.scene,
    sha256: f.sha256,
    samples: w.samples,
    durationSeconds: w.durationSeconds,
    fullDecode: "PASS",
    voice: receipt.provenance.voice,
  });
}
await writeFile(
  out,
  JSON.stringify(
    {
      scope: "AUTHORIZED_HISTORICAL_WAV_DECODER_INTEGRATION_ONLY",
      files,
      voice06: "BLOCKED_NO_AUTHENTIC_VIDEO06_AUDIO",
      bilingualSpeechListening: "UNVERIFIED",
      historicalSynthesisRequests: 0,
      historicalOutputsModified: false,
      publicationAllowed: false,
    },
    null,
    2,
  ) + "\n",
);
