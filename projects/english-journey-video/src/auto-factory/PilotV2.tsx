import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion";
export type V2Props = {
  durationInFrames: number;
  revealFrame: number;
  practiceStartFrame: number;
  answerRevealFrame: number;
  captions: {
    sceneId: string;
    text: string;
    startFrame: number;
    endFrame: number;
  }[];
  kind: "SYNTHETIC_OFFLINE" | "AUTHORIZED_SPEECH";
};
export const V2Video: React.FC<V2Props> = (p) => {
  const frame = useCurrentFrame(),
    caption = p.captions.find(
      (c) => frame >= c.startFrame && frame < c.endFrame,
    ),
    practice = frame >= p.practiceStartFrame && frame < p.answerRevealFrame;
  return (
    <AbsoluteFill
      style={{
        background: "#101d32",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "160px 130px 340px 90px",
        gap: 60,
        justifyContent: "center",
      }}
    >
      <Audio src={staticFile("speech.wav")} />
      <div style={{ fontSize: 27, color: "#ffcf65" }}>
        {p.kind === "SYNTHETIC_OFFLINE"
          ? "SYNTHETIC TEST • NOT SPEECH"
          : "IMPORTED AUDIO • REVIEW PENDING"}
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: frame < p.revealFrame ? "#ff9a9a" : "#65dacb",
        }}
      >
        {frame < p.revealFrame
          ? "I hungry"
          : frame >= p.answerRevealFrame
            ? "I am tired"
            : "I am hungry"}{" "}
        <svg
          aria-label={frame < p.revealFrame ? "incorrect" : "correct"}
          width={58}
          height={58}
          viewBox="0 0 64 64"
          style={{ verticalAlign: "middle" }}
        >
          <path
            d={
              frame < p.revealFrame
                ? "M14 14L50 50M50 14L14 50"
                : "M10 34L25 49L55 14"
            }
            fill="none"
            stroke="currentColor"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ fontSize: 52, lineHeight: 1.25 }}>
        {caption?.text ??
          (practice ? "Chọn A hay B?" : "Thử nói lại cả câu nhé.")}
      </div>
      {practice ? (
        <div style={{ fontSize: 50 }}>
          A. I tired
          <br />
          B. I am tired
        </div>
      ) : null}
      <div style={{ fontSize: 25 }}>
        English Journey • VOICE_ONLY • Chưa được phép xuất bản
      </div>
    </AbsoluteFill>
  );
};
registerRoot(() => (
  <Composition
    id="Video06V2"
    component={V2Video}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={720}
    defaultProps={{
      durationInFrames: 720,
      revealFrame: 15,
      practiceStartFrame: 330,
      answerRevealFrame: 480,
      captions: [],
      kind: "SYNTHETIC_OFFLINE",
    }}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.durationInFrames,
    })}
  />
));
