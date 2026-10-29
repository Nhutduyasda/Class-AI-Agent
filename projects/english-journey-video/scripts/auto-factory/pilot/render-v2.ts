// Zero-paid-request renderer integration fixture. No real provider transport.
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { browserPath } from "../remotion.ts";
import { verifyMp4 } from "../run.ts";
import { importMedia, sha, Manifest } from "./media.ts";
import { v2Clock } from "./v2.ts";
const bytes = await readFile("briefs/english-video-06-candidate-v2.json"),
  body = JSON.parse(bytes.toString()),
  temp = await mkdtemp(join(tmpdir(), "V2-media-Đ-")),
  out = resolve("out/auto-factory-v2-preflight");
await mkdir(out, { recursive: true });
try {
  const segments = [];
  for (const [i, s] of body.segments.entries()) {
    const file = s.id + ".wav";
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=${s.language === "en-US" ? 660 : 440}:sample_rate=48000:duration=3.5`,
      "-c:a",
      "pcm_s16le",
      join(temp, file),
    ]);
    segments.push({
      id: s.id,
      text: s.text,
      language: s.language,
      voice:
        s.language === "en-US" ? "en-US-AndrewNeural" : "vi-VN-NamMinhNeural",
      file,
      sha256: sha(await readFile(join(temp, file))),
    });
  }
  const manifest = Manifest.parse({
    schemaVersion: 1,
    scriptSha256: sha(bytes),
    kind: "SYNTHETIC_OFFLINE",
    sourceReference:
      "original tones;440Hz Vietnamese-labelled spans,660Hz English-labelled spans; not voices",
    rightsBasis: "ORIGINAL_OFFLINE_FIXTURE",
    authorizationReference: "MOCK_ONLY_NO_OWNER_SPEECH_APPROVAL",
    segments,
  });
  const input = await importMedia(
      bytes,
      manifest,
      temp,
      sha(JSON.stringify(manifest)),
    ),
    v = v2Clock(input, { bytes, body });
  await writeFile(join(out, "speech.wav"), v.audio);
  const props = {
    durationInFrames: v.durationInFrames,
    revealFrame: 15,
    practiceStartFrame: v.practiceStartFrame,
    answerRevealFrame: v.answerRevealFrame,
    captions: v.captions,
    kind: "SYNTHETIC_OFFLINE" as const,
  };
  const browser = await browserPath(),
    serveUrl = await bundle({
      entryPoint: resolve("src/auto-factory/PilotV2.tsx"),
      publicDir: out,
    });
  const composition = await selectComposition({
    serveUrl,
    browserExecutable: browser,
    id: "Video06V2",
    inputProps: props,
  });
  await renderMedia({
    serveUrl,
    browserExecutable: browser,
    composition,
    inputProps: props,
    outputLocation: join(out, "pilot-v2.mp4"),
    codec: "h264",
    audioCodec: "aac",
    pixelFormat: "yuv420p",
    crf: 24,
    concurrency: 2,
  });
  const check = verifyMp4(join(out, "pilot-v2.mp4"), v.durationInFrames);
  const frames = [
    0,
    14,
    15,
    v.practiceStartFrame,
    v.answerRevealFrame - 1,
    v.answerRevealFrame,
    v.durationInFrames - 1,
  ];
  for (const frame of frames)
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-i",
      join(out, "pilot-v2.mp4"),
      "-vf",
      `select=eq(n\\,${frame})`,
      "-frames:v",
      "1",
      join(out, `frame-${frame}.png`),
    ]);
  const qa = {
    kind: "SYNTHETIC_OFFLINE",
    renderer: "REMOTION_RENDER_PASS",
    format: check.format,
    fullDecode: check.fullDecode,
    width: check.width,
    height: check.height,
    fps: check.fps,
    frames: check.frames,
    duration: check.duration,
    videoCodec: check.videoCodec,
    audioCodec: check.audioCodec,
    artifactSha256: sha(await readFile(join(out, "pilot-v2.mp4"))),
    audioSha256: sha(v.audio),
    scriptSha256: sha(bytes),
    practiceHoldSamples: v.practiceHoldSamples,
    technicalProduction: "NOT_EVALUATED",
    speechAlignment: "BLOCKED_NO_AUTHENTIC_V2_SPEECH",
    human: "PENDING_OWNER",
    publicationAllowed: false,
  };
  await writeFile(
    join(out, "input.json"),
    JSON.stringify(props, null, 2) + "\n",
  );
  await writeFile(join(out, "qa.json"), JSON.stringify(qa, null, 2) + "\n");
  console.log(JSON.stringify(qa));
} finally {
  await rm(temp, { recursive: true, force: true });
}
