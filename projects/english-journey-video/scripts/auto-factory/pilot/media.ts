import { z } from "zod";
import { createHash } from "node:crypto";
import { readFile, realpath, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute, join } from "node:path";
import { execFileSync } from "node:child_process";
export const sha = (b: Buffer | string) =>
  createHash("sha256").update(b).digest("hex");
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const Script = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: z.literal("english-video-06"),
    approved: z.literal(false),
    presenterId: z.literal("minh-main"),
    visibility: z.enum(["NO_PRESENTER", "VOICE_ONLY"]),
    targetSeconds: z.tuple([z.literal(20), z.literal(35)]),
    segments: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z][a-z0-9-]{0,40}$/),
          language: z.enum(["vi-VN", "en-US"]),
          text: z.string().min(1).max(220),
          visual: z.string().min(1),
        }),
      )
      .min(1)
      .max(16),
  })
  .superRefine((s, c) => {
    if (new Set(s.segments.map((x) => x.id)).size !== s.segments.length)
      c.addIssue({ code: "custom", message: "DUPLICATE_SEGMENT" });
  });
export const Manifest = z.strictObject({
  schemaVersion: z.literal(1),
  scriptSha256: digest,
  kind: z.enum(["AUTHORIZED_SPEECH", "SYNTHETIC_OFFLINE"]),
  sourceReference: z.string().min(1).max(300),
  rightsBasis: z.string().min(1).max(300),
  authorizationReference: z.string().min(1).max(300),
  segments: z
    .array(
      z.strictObject({
        id: z.string(),
        language: z.enum(["vi-VN", "en-US"]),
        voice: z.enum(["vi-VN-NamMinhNeural", "en-US-AndrewNeural"]),
        text: z.string(),
        file: z.string().regex(/^[a-zA-Z0-9_-]+\.wav$/),
        sha256: digest,
      }),
    )
    .min(1)
    .max(16),
});
export function wave(b: Buffer) {
  if (
    b.length < 44 ||
    b.length > 64 * 1024 * 1024 ||
    b.toString("ascii", 0, 4) !== "RIFF" ||
    b.toString("ascii", 8, 12) !== "WAVE" ||
    b.readUInt32LE(4) + 8 !== b.length
  )
    throw Error("INVALID_WAV_CONTAINER");
  let fmt: Buffer | undefined,
    data: Buffer | undefined,
    at = 12;
  while (at < b.length) {
    if (at + 8 > b.length) throw Error("TRUNCATED_CHUNK");
    const n = b.readUInt32LE(at + 4),
      end = at + 8 + n;
    if (end > b.length) throw Error("TRUNCATED_CHUNK");
    const id = b.toString("ascii", at, at + 4);
    if (id === "fmt ") {
      if (fmt) throw Error("DUPLICATE_FMT");
      fmt = b.subarray(at + 8, end);
    }
    if (id === "data") {
      if (data) throw Error("DUPLICATE_DATA");
      data = b.subarray(at + 8, end);
    }
    at = end + (n % 2);
  }
  if (
    at !== b.length ||
    !fmt ||
    fmt.length < 16 ||
    !data ||
    !data.length ||
    fmt.readUInt16LE(0) !== 1 ||
    fmt.readUInt16LE(2) !== 1 ||
    fmt.readUInt32LE(4) !== 48000 ||
    fmt.readUInt16LE(14) !== 16 ||
    fmt.readUInt16LE(12) !== 2 ||
    fmt.readUInt32LE(8) !== 96000 ||
    data.length % 2
  )
    throw Error("PCM_48K_MONO_16_REQUIRED");
  return {
    pcm: data,
    samples: data.length / 2,
    sampleRate: 48000,
    durationSeconds: data.length / 96000,
  };
}
function wrap(pcm: Buffer) {
  const h = Buffer.alloc(44);
  h.write("RIFF");
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(48000, 24);
  h.writeUInt32LE(96000, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
export async function importMedia(
  scriptBytes: Buffer,
  raw: unknown,
  root: string,
  approvedManifestSha256: string,
) {
  const s = Script.parse(JSON.parse(scriptBytes.toString("utf8"))),
    m = Manifest.parse(raw);
  // Hash must come from separately reviewed owner evidence; manifest self-assertions alone are not approval.
  if (sha(JSON.stringify(m)) !== approvedManifestSha256)
    throw Error("UNTRUSTED_PROVENANCE");
  if (
    m.scriptSha256 !== sha(scriptBytes) ||
    m.segments.length !== s.segments.length
  )
    throw Error("SCRIPT_BINDING");
  const base = await realpath(root),
    parts: Buffer[] = [],
    captions = [];
  let sample = 0;
  for (const [i, x] of m.segments.entries()) {
    const expected = s.segments[i];
    if (
      x.id !== expected.id ||
      x.text !== expected.text ||
      x.language !== expected.language ||
      x.voice !==
        (x.language === "vi-VN" ? "vi-VN-NamMinhNeural" : "en-US-AndrewNeural")
    )
      throw Error("CANONICAL_ROUTING_MISMATCH");
    const file = await realpath(join(base, x.file)),
      rel = relative(base, file);
    if (rel.startsWith("..") || isAbsolute(rel)) throw Error("MEDIA_ESCAPE");
    const w = await verifiedWave(file, x.sha256);
    const startSample = sample;
    parts.push(w.pcm);
    sample += w.samples;
    captions.push({
      sceneId: x.id,
      text: x.text,
      startSample,
      endSample: sample,
      startFrame: Math.floor(startSample / 1600),
      endFrame: Math.ceil(sample / 1600),
      language: x.language,
      voice: x.voice,
    });
    // Explicit editorial pause, not an inferred speech boundary.
    const gap = i === s.segments.length - 1 ? 16000 : 9600;
    parts.push(Buffer.alloc(gap * 2));
    sample += gap;
  }
  if (sample / 48000 < 20 || sample / 48000 > 35)
    throw Error("PILOT_DURATION_OUTSIDE_20_35");
  return {
    schemaVersion: 1 as const,
    scriptSha256: sha(scriptBytes),
    manifestSha256: approvedManifestSha256,
    kind: m.kind,
    provenance: {
      sourceReference: m.sourceReference,
      authorizationReference: m.authorizationReference,
      rightsBasis: m.rightsBasis,
    },
    captions,
    durationSamples: sample,
    durationInFrames: Math.ceil(sample / 1600),
    audio: wrap(Buffer.concat(parts)),
    qa: {
      audio:
        m.kind === "AUTHORIZED_SPEECH"
          ? "SEGMENT_BOUNDARIES_VERIFIED_CONTENT_LISTENING_PENDING"
          : "SYNTHETIC_NOT_SPEECH",
      wordAlignment: "NOT_AVAILABLE",
      technicalProduction: "NOT_EVALUATED",
      human: "HUMAN_REVIEW_PENDING",
      publicationAllowed: false,
    },
  };
}
export function sentenceSubtitles(
  captions: { text: string; startSample: number; endSample: number }[],
  vtt = false,
) {
  const stamp = (samples: number, up = false) => {
    let ms = up ? Math.ceil(samples / 48) : Math.floor(samples / 48);
    const h = Math.floor(ms / 3600000),
      m = Math.floor(ms / 60000) % 60,
      sec = Math.floor(ms / 1000) % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}${vtt ? "." : ","}${String(ms % 1000).padStart(3, "0")}`;
  };
  return (
    (vtt ? "WEBVTT\n\n" : "") +
    captions
      .map(
        (c, i) =>
          `${i + 1}\n${stamp(c.startSample)} --> ${stamp(c.endSample, true)}\n${c.text}\n`,
      )
      .join("\n")
  );
}
export async function saveImport(
  result: Awaited<ReturnType<typeof importMedia>>,
  out: string,
) {
  const { audio, ...metadata } = result;
  const id = sha(audio),
    dir = resolve(out, id);
  await mkdir(dir, { recursive: true });
  for (const [name, bytes] of [
    ["speech.wav", audio],
    ["subtitles.srt", Buffer.from(sentenceSubtitles(result.captions))],
    ["subtitles.vtt", Buffer.from(sentenceSubtitles(result.captions, true))],
    [
      "import.json",
      Buffer.from(
        JSON.stringify({ ...metadata, audioSha256: id }, null, 2) + "\n",
      ),
    ],
  ] as const) {
    try {
      await writeFile(join(dir, name), bytes, { flag: "wx" });
    } catch (e: any) {
      if (
        e.code !== "EEXIST" ||
        !(await readFile(join(dir, name))).equals(bytes)
      )
        throw Error("CACHE_CONFLICT");
    }
  }
  return dir;
}

export async function verifiedWave(file: string, expectedSha256: string) {
  const b = await readFile(file);
  if (sha(b) !== expectedSha256) throw Error("MEDIA_HASH");
  const w = wave(b);
  const decoded = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-xerror",
      "-i",
      file,
      "-map",
      "0:a:0",
      "-f",
      "s16le",
      "-acodec",
      "pcm_s16le",
      "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  if (!decoded.equals(w.pcm)) throw Error("FULL_DECODE_MISMATCH");
  return w;
}
