import { readFile, writeFile, mkdir, realpath, copyFile, access } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, selectComposition, renderMedia, renderStill } from "@remotion/renderer";
import { plan, hash, RenderPlan, ReviewItem } from "../../src/auto-factory/engine.ts";
import { Playback, AudioInput, PresenterAsset, validatePlayback, qaStates, type PlaybackType } from "../../src/auto-factory/playback.ts";
import { learning, product, NOW } from "./fixtures.ts";
import { verifyMp4 } from "./run.ts";
import os from "node:os";

try {
  os.networkInterfaces();
} catch {
  os.networkInterfaces = () => ({
    lo: [{
      address: "127.0.0.1",
      family: "IPv4",
      internal: false,
      netmask: "255.0.0.0",
      mac: "00:00:00:00:00:00",
      cidr: "127.0.0.1/8"
    }]
  });
}

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

export async function browserPath(explicit?: string) {
  if (explicit) {
    try {
      await access(explicit);
      return resolve(explicit);
    } catch {
      throw Error("BROWSER_PATH_INVALID");
    }
  }

  const candidates = [...(explicit ? [explicit] : []), resolve(
    "node_modules/.remotion/chrome-headless-shell",
    process.platform === "win32" ? "win64/chrome-headless-shell-win64/chrome-headless-shell.exe" : process.platform === "darwin" ? "mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell" : "linux64/chrome-headless-shell-linux64/chrome-headless-shell"
  ), ...(process.platform === "win32" ? [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  ] : [])];

  for (const p of candidates) {
    try {
      await access(p);
      return resolve(p);
    } catch {}
  }

  throw Error("BROWSER_NOT_INSTALLED_USE_EXPLICIT_SETUP");
}

export async function verifyMedia(root: string, p: ReturnType<typeof plan>, input: unknown) {
  const media = validatePlayback(p, input), base = await realpath(root);

  for (const item of [media.audio, ...media.presenterAssets].filter(Boolean)) {
    const x = item!;
    const file = await realpath(join(base, x.file)), rel = relative(base, file);

    if (rel.startsWith("..") || isAbsolute(rel))
      throw Error("MEDIA_ESCAPE");

    const bytes = await readFile(file);

    if (sha(bytes) !== x.sha256)
      throw Error("MEDIA_HASH_MISMATCH");

    const info = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], {
      encoding: "utf8"
    }));

    if (x === media.audio) {
      const a = info.streams.find((s: any) => s.codec_type === "audio");

      if (!a || !Number.isFinite(Number(a.duration)) || Number(a.sample_rate) !== media.audio!.sampleRate || Math.abs(Number(a.duration) - media.audio!.observedDurationSeconds) > 1 / media.audio!.sampleRate)
        throw Error("AUDIO_PROBE_MISMATCH");
    } else {
      const a = x as typeof media.presenterAssets[number];
      const v = info.streams.find((s: any) => s.codec_type === "video");
      if(a.fileType==="video/mp4"&&!info.format?.format_name?.split(",").includes("mp4"))throw Error("ASSET_CONTAINER_MISMATCH");
      if(a.fileType==="image/png"&&bytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a")throw Error("ASSET_CONTAINER_MISMATCH");
      if(a.fileType==="image/jpeg"&&bytes.subarray(0,2).toString("hex")!=="ffd8")throw Error("ASSET_CONTAINER_MISMATCH");

      if (!v || v.width !== a.width || v.height !== a.height || !({
        "image/png": "png",
        "image/jpeg": "mjpeg",
        "video/mp4": "h264"
      }[a.fileType] === v.codec_name))
        throw Error("ASSET_PROBE_MISMATCH");
    }

    execFileSync("ffmpeg", ["-v", "error", "-xerror", "-i", file, "-f", "null", "-"], {
      stdio: "pipe"
    });
  }

  return media;
}

export async function renderFixture(root: string, browser: string, brief: unknown) {
  const p = plan(brief, NOW);
  const dir = resolve(root, p.runId);

  await mkdir(dir, {
    recursive: true
  });

  const publicDir = join(dir, "media");

  await mkdir(publicDir, {
    recursive: true
  });

  const wav = join(publicDir, "tone.wav");
  const seconds = p.durationInFrames / 30;

  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=440:sample_rate=48000:duration=${seconds}`,
    "-af",
    "volume=0.08",
    "-c:a",
    "pcm_s16le",
    wav
  ], {
    stdio: "pipe"
  });

  const media: PlaybackType = {
    schemaVersion: 1,

    audio: {
      file: "tone.wav",
      sha256: sha(await readFile(wav)),
      sampleRate: 48000,
      durationSamples: seconds * 48000,
      observedDurationSeconds: seconds,
      provenance: "SYNTHETIC_OFFLINE",
      alignment: "UNVERIFIED"
    },

    captions: p.shots.map(s => ({
      sceneId: s.id,
      text: s.spoken,
      startFrame: s.startFrame,
      endFrame: s.endFrame
    })),

    presenterAssets: []
  };

  await verifyMedia(publicDir, p, media);
  RenderPlan.parse(p);

  const inputProps = {
    plan: p,
    media
  };

  const serveUrl = await bundle({
    entryPoint: resolve("src/auto-factory/Composition.tsx"),
    publicDir
  });

  const composition = await selectComposition({
    serveUrl,
    browserExecutable: browser,
    id: "AutoFactory",
    inputProps
  });

  if (composition.durationInFrames !== p.durationInFrames || composition.fps !== 30)
    throw Error("DYNAMIC_METADATA_MISMATCH");

  const output = join(dir, "remotion.mp4");

  await renderMedia({
    serveUrl,
    browserExecutable: browser,
    composition,
    inputProps,
    outputLocation: output,
    codec: "h264",
    audioCodec: "aac",
    pixelFormat: "yuv420p",
    crf: 24,
    concurrency: 2
  });

  const format = verifyMp4(output, p.durationInFrames);
  const proofFrames = [0, ...p.shots.slice(1).flatMap(s => [s.startFrame - 1, s.startFrame]), p.durationInFrames - 1];
  const proofs = [];

  for (const frame of proofFrames) {
    const file = join(dir, `frame-${frame}.png`);

    execFileSync(
      "ffmpeg",
      ["-v", "error", "-y", "-i", output, "-vf", `select=eq(n\\,${frame})`, "-frames:v", "1", file],
      {
        stdio: "pipe"
      }
    );

    proofs.push({
      frame,
      sha256: sha(await readFile(file)),
      scene: p.shots.find(s => frame >= s.startFrame && frame < s.endFrame)!.id
    });
  }

  for (let i = 1; i < proofs.length - 1; i += 2) {
    if (proofs[i].sha256 === proofs[i + 1].sha256)
      throw Error("SCENE_PROOF_UNCHANGED");
  }

  const qa = {
    ...format,
    ...qaStates(true),
    speech: "SYNTHETIC_TONE_NOT_SPEECH",
    captionTiming: "CANONICAL_SCENE_BOUNDARIES_NOT_SPEECH_ALIGNMENT",
    sha256: sha(await readFile(output)),
    planSha256: hash(p),
    mediaSha256: hash(media),

    browserVersion: execFileSync(browser, ["--version"], {
      encoding: "utf8"
    }).trim(),

    remotionVersion: "4.0.535",
    durationInFrames: composition.durationInFrames,
    proofs
  };

  for (const [name, data] of Object.entries({
    plan: p,
    media,
    qa,

    review: ReviewItem.parse({
      schemaVersion: 1,
      runId: p.runId,
      planSha256: hash(p),
      videoSha256: qa.sha256,
      status: "PENDING_OWNER",
      fixture: true,
      publicationAllowed: false
    })
  }))
    await writeFile(join(dir, `${name}.json`), JSON.stringify(data, null, 2) + "\n");

  return qa;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--install-browser")) console.log(await ensureBrowser({
    logLevel: "info"
  }));
  else if (process.argv.includes("--schemas")) {
    for (const [name, schema] of Object.entries({
      playback: Playback,
      audio: AudioInput,
      presenterAsset: PresenterAsset
    })) await writeFile(
      `schemas/auto-factory/${name}.json`,
      JSON.stringify((await import("zod")).z.toJSONSchema(schema), null, 2) + "\n"
    );
  } else {
    const b = await browserPath(
      process.argv[process.argv.indexOf("--browser") + 1] && process.argv.includes("--browser") ? process.argv[process.argv.indexOf("--browser") + 1] : undefined
    );

    const shorter = structuredClone(learning);
    shorter.runId = "remotion-learning";
    shorter.scenes[2].frames = 120; // 22s proves dynamic metadata, not the 24s default

    for (const fixture of [shorter, product("PHONE_CASE", "HANDS_ONLY"), product("FASHION", "FACE_ONLY", "TIKTOK_SHOP")])
      console.log(JSON.stringify(await renderFixture("out/auto-factory-remotion", b, fixture)));
  }
}
