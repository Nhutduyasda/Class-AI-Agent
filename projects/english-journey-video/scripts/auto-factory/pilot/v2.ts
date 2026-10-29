import { wave, sha } from "./media.ts";
export function v2Clock(input: any, script: any) {
  if (
    input.scriptSha256 !== sha(script.bytes) ||
    script.body.visibility !== "VOICE_ONLY" ||
    input.captions.length !== 6
  )
    throw Error("V2_SCRIPT_BINDING");
  const s = script.body.segments;
  for (const [i, c] of input.captions.entries())
    if (
      c.sceneId !== s[i].id ||
      c.text !== s[i].text ||
      c.language !== s[i].language ||
      c.voice !==
        (c.language === "vi-VN" ? "vi-VN-NamMinhNeural" : "en-US-AndrewNeural")
    )
      throw Error("V2_ROUTING");
  const pcm = wave(input.audio).pcm,
    practice = input.captions.find((x: any) => x.sceneId === "practice"),
    answer = input.captions.find((x: any) => x.sceneId === "answer");
  if (!practice || !answer || answer.startSample - practice.endSample !== 9600)
    throw Error("V2_GAP");
  const extra = 62400,
    cut = answer.startSample; // replace existing200ms gap with1500ms; no speech is stretched or trimmed
  const audio = Buffer.concat([
    input.audio.subarray(0, 44),
    pcm.subarray(0, cut * 2),
    Buffer.alloc(extra * 2),
    pcm.subarray(cut * 2),
  ]);
  audio.writeUInt32LE(audio.length - 8, 4);
  audio.writeUInt32LE(audio.length - 44, 40);
  const captions = input.captions.map((x: any) => {
    const c = {
      ...x,
      startSample: x.startSample + (x.startSample >= cut ? extra : 0),
      endSample: x.endSample + (x.startSample >= cut ? extra : 0),
    };
    return {
      ...c,
      startFrame: Math.floor(c.startSample / 1600),
      endFrame: Math.ceil(c.endSample / 1600),
    };
  });
  const samples = wave(audio).samples;
  if (samples / 48000 < 20 || samples / 48000 > 35) throw Error("V2_DURATION");
  return {
    ...input,
    audio,
    captions,
    durationSamples: samples,
    durationInFrames: Math.ceil(samples / 1600),
    audioSha256: sha(audio),
    revealFrame: 15,
    practiceStartFrame: practice.startFrame,
    answerRevealFrame: captions.find((x: any) => x.sceneId === "answer")
      .startFrame,
    practiceHoldSamples: 72000,
    qa: {
      ...input.qa,
      technicalProduction: "NOT_EVALUATED",
      publicationAllowed: false,
    },
  };
}
