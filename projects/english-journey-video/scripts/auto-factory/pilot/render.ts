import { readFile, writeFile, open, unlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { browserPath } from "../remotion.ts";
import { verifyMp4 } from "../run.ts";
import { wave, sha } from "./media.ts";
const [rootArg, manifestSha] = process.argv.slice(2);
if (!rootArg || !manifestSha)
  throw Error(
    "Usage: node scripts/auto-factory/pilot/render.ts <import-dir> <reviewed-import-json-byte-sha256>",
  );
const root = resolve(rootArg),
  bytes = await readFile(join(root, "import.json"));
if (sha(bytes) !== manifestSha) throw Error("IMPORT_APPROVAL_HASH");
const m = JSON.parse(bytes.toString()),
  audio = await readFile(join(root, "speech.wav")),
  w = wave(audio);
if (
  sha(audio) !== m.audioSha256 ||
  w.samples !== m.durationSamples ||
  m.durationInFrames !== Math.ceil(w.samples / 1600) ||
  w.durationSeconds < 20 ||
  w.durationSeconds > 35 ||
  !["AUTHORIZED_SPEECH", "SYNTHETIC_OFFLINE"].includes(m.kind) ||
  m.qa?.publicationAllowed !== false
)
  throw Error("IMPORT_INTEGRITY");
let end = 0;
for (const c of m.captions) {
  if (
    !Number.isInteger(c.startSample) ||
    !Number.isInteger(c.endSample) ||
    c.startSample < end ||
    c.endSample <= c.startSample ||
    c.endSample > w.samples ||
    c.startFrame !== Math.floor(c.startSample / 1600) ||
    c.endFrame !== Math.ceil(c.endSample / 1600) ||
    typeof c.text !== "string"
  )
    throw Error("CAPTION_INTEGRITY");
  end = c.endSample;
}
const lockPath = join(root, "render.lock");
const lock = await open(lockPath, "wx");
try {
  await unlink(join(root, "render-qa.json")).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
  const props = {
    kind: m.kind,
    durationInFrames: m.durationInFrames,
    captions: m.captions,
    audioSha256: m.audioSha256,
    scriptSha256: m.scriptSha256,
    hook: "Nói mình đói thế nào?",
  };
  const browser = await browserPath(),
    serveUrl = await bundle({
      entryPoint: resolve("src/auto-factory/Pilot.tsx"),
      publicDir: root,
    });
  const composition = await selectComposition({
    serveUrl,
    browserExecutable: browser,
    id: "ProductionPilot",
    inputProps: props,
  });
  await renderMedia({
    serveUrl,
    browserExecutable: browser,
    composition,
    inputProps: props,
    outputLocation: join(root, "pilot.mp4"),
    codec: "h264",
    audioCodec: "aac",
    pixelFormat: "yuv420p",
    crf: 24,
    concurrency: 2,
  });
  if (
    sha(await readFile(join(root, "speech.wav"))) !== m.audioSha256 ||
    sha(await readFile(join(root, "import.json"))) !== manifestSha
  )
    throw Error("INPUT_CHANGED_DURING_RENDER");
  const check = verifyMp4(join(root, "pilot.mp4"), m.durationInFrames);
  const technical = {
    format: check.format,
    fullDecode: check.fullDecode,
    width: check.width,
    height: check.height,
    fps: check.fps,
    frames: check.frames,
    videoCodec: check.videoCodec,
    audioCodec: check.audioCodec,
    duration: check.duration,
  };
  for (const frame of [
    0,
    Math.floor(m.durationInFrames / 2),
    m.durationInFrames - 1,
  ])
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-i",
      join(root, "pilot.mp4"),
      "-vf",
      `select=eq(n\\,${frame})`,
      "-frames:v",
      "1",
      join(root, `frame-${frame}.png`),
    ]);
  const qa = {
    ...technical,
    ...m.qa,
    renderer: "REMOTION_RENDER_PASS",
    kind: m.kind,
    artifactSha256: sha(await readFile(join(root, "pilot.mp4"))),
    importSha256: manifestSha,
    scriptSha256: m.scriptSha256,
    audioSha256: m.audioSha256,
    subjectiveVoice: "BLOCKED_PENDING_AUTHENTIC_LISTENING",
    technicalProduction: "NOT_EVALUATED",
    publicationAllowed: false,
  };
  await writeFile(
    join(root, "render-qa.json"),
    JSON.stringify(qa, null, 2) + "\n",
  );
  console.log(JSON.stringify(qa));
} finally {
  await lock.close();
  await unlink(lockPath);
}
