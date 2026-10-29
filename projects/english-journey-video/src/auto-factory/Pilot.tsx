import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion";
export type PilotProps = {
  kind: "AUTHORIZED_SPEECH" | "SYNTHETIC_OFFLINE";
  durationInFrames: number;
  captions: {
    sceneId?: string;
    text: string;
    startFrame: number;
    endFrame: number;
  }[];
  audioSha256: string;
  scriptSha256: string;
  hook: string;
};
export const PilotVideo: React.FC<PilotProps> = (p) => {
  const frame = useCurrentFrame();
  const cue = p.captions.find(
    (c) => frame >= c.startFrame && frame < c.endFrame,
  );
  return (
    <AbsoluteFill
      style={{
        background: "#101d32",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: "160px 130px 340px 90px",
        gap: 65,
        justifyContent: "center",
      }}
    >
      <Audio src={staticFile("speech.wav")} />
      <div style={{ fontSize: 27, color: "#ffcf65" }}>
        {p.kind === "SYNTHETIC_OFFLINE"
          ? "SYNTHETIC TEST • NOT SPEECH"
          : "IMPORTED SPEECH • OWNER REVIEW PENDING"}
      </div>
      <div style={{ fontSize: 58, fontWeight: 800 }}>
        {cue?.sceneId === "hook" || frame === 0 ? p.hook : "I + am + tính từ"}
      </div>
      <div style={{ fontSize: 56, lineHeight: 1.25, overflowWrap: "anywhere" }}>
        {cue?.text ?? "Thử nói lại cả câu nhé."}
      </div>
      {cue?.sceneId === "practice" ? (
        <div style={{ fontSize: 48 }}>
          A. I tired.
          <br />
          B. I am tired.
        </div>
      ) : null}
      {cue?.sceneId === "close" ? (
        <div style={{ fontSize: 60, color: "#65dacb" }}>I am tired.</div>
      ) : null}
      <div style={{ fontSize: 25, color: "#65dacb" }}>
        English Journey • Không có hình Minh • Chưa được phép xuất bản
      </div>
    </AbsoluteFill>
  );
};
registerRoot(() => (
  <Composition
    id="ProductionPilot"
    component={PilotVideo}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={660}
    defaultProps={{
      kind: "SYNTHETIC_OFFLINE",
      durationInFrames: 660,
      captions: [],
      audioSha256: "",
      scriptSha256: "",
      hook: "Nói mình đói thế nào?",
    }}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.durationInFrames,
    })}
  />
));
