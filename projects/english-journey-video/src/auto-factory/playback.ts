import { z } from "zod";
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const file = z.string().regex(/^[a-zA-Z0-9_-]+\.(wav|png|jpg|mp4)$/);

export const AudioInput = z.strictObject({
  file,
  sha256: digest,
  sampleRate: z.number().int().min(8000).max(192000),
  durationSamples: z.number().int().positive(),
  observedDurationSeconds: z.number().positive(),
  provenance: z.enum(["SYNTHETIC_OFFLINE", "AUTHORIZED_LOCAL"]),
  alignment: z.literal("UNVERIFIED")
});

export const PresenterAsset = z.strictObject({
  assetId: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
  presenterId: z.literal("minh-main"),
  file,
  sha256: digest,
  fileType: z.enum(["image/png", "image/jpeg", "video/mp4"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  rightsBasis: z.enum(["OWNER_PROVIDED_PERMISSION", "ORIGINAL_OFFLINE_FIXTURE", "LICENSED"]),
  usageRestrictions: z.array(z.string().min(1)).min(1),
  sourceReference: z.string().min(1),
  visibility: z.enum(["HANDS_ONLY", "FACE_ONLY", "HALF_BODY", "FULL_BODY"]),
  reviewStatus: z.enum(["UNVERIFIED", "APPROVED_OFFLINE_ONLY"]),
  identityVerified: z.literal(false)
});

export const Playback = z.strictObject({
  schemaVersion: z.literal(1),
  audio: AudioInput.optional(),

  captions: z.array(z.strictObject({
    sceneId: z.string().min(1),
    text: z.string().min(1),
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive()
  })).min(1),

  presenterAssets: z.array(PresenterAsset).max(16)
});

export type PlaybackType = z.infer<typeof Playback>;

export type Timeline = {
  fps: number;
  durationInFrames: number;
  shots: Array<{
    id: string;
    spoken: string;
    startFrame: number;
    endFrame: number;
    frames: number;
    visibility: string;
  }>;
};

export function checkTimeline(p: Timeline) {
  let end = 0;
  const ids = new Set();

  for (const s of p.shots) {
    if (ids.has(s.id) || s.startFrame !== end || s.endFrame - s.startFrame !== s.frames || !Number.isInteger(s.frames) || s.frames <= 0)
      throw Error("INVALID_TIMELINE");

    end = s.endFrame;
    ids.add(s.id);
  }

  if (p.fps !== 30 || end !== p.durationInFrames)
    throw Error("INVALID_TIMELINE");
}

export function validatePlayback(p: Timeline, input: unknown) {
  checkTimeline(p);
  const m = Playback.parse(input);

  if (m.captions.length !== p.shots.length)
    throw Error("CAPTION_COVERAGE");

  for (const [i, c] of m.captions.entries()) {
    const s = p.shots[i];

    if (c.sceneId !== s.id || c.text !== s.spoken || c.startFrame !== s.startFrame || c.endFrame !== s.endFrame)
      throw Error("CANONICAL_CAPTION_MISMATCH");
  }

  if (m.audio && (Math.abs(m.audio.durationSamples / m.audio.sampleRate - m.audio.observedDurationSeconds) > 1 / m.audio.sampleRate || m.audio.observedDurationSeconds > p.durationInFrames / p.fps))
    throw Error("AUDIO_DURATION_MISMATCH");

  const ids = new Set();

  for (const a of m.presenterAssets) {
    if (ids.has(a.assetId) || a.reviewStatus !== "APPROVED_OFFLINE_ONLY" || !p.shots.some(s => s.visibility === a.visibility) || !((a.fileType === "image/png" && a.file.endsWith(".png")) || (a.fileType === "image/jpeg" && a.file.endsWith(".jpg")) || (a.fileType === "video/mp4" && a.file.endsWith(".mp4"))))
      throw Error("ASSET_BINDING");

    ids.add(a.assetId);
  }

  return m;
}

export function qaStates(remotion: boolean) {
  return {
    fixture: "OFFLINE_FIXTURE_PASS",
    renderer: remotion ? "REMOTION_RENDER_PASS" : "FFMPEG_FIXTURE_ONLY",
    audio: "AUDIO_ALIGNMENT_UNVERIFIED",
    presenter: "PRESENTER_ASSET_UNVERIFIED",
    technicalProduction: "NOT_EVALUATED",
    human: "HUMAN_REVIEW_PENDING",
    publicationAllowed: false
  } as const;
}
