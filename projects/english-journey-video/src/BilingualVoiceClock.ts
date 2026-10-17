import {useCurrentFrame} from 'remotion';
export type BilingualTiming = {
  fps: number;
  audioSrc: string;
  durationInFrames: number;
  scenes: {type:string;startFrame:number;endFrame:number}[];
  pages: {text:string;startMs:number;endMs:number}[];
  voiceSpans: {text:string;language:string;voice:string;startMs:number;endMs:number}[];
  events: {kind:string;article?:string;frame:number;scene:string;voice:string}[];
};
export function activeAtFrame(timeline:BilingualTiming,frame:number) {
  const ms=frame/timeline.fps*1000;
  const scene=timeline.scenes.find(s=>s.startFrame<=frame&&frame<s.endFrame)??null;
  return {
    scene,
    caption:timeline.pages.find(p=>p.startMs<=ms&&ms<p.endMs)??null,
    voiceSpan:timeline.voiceSpans.find(s=>s.startMs<=ms&&ms<s.endMs)??null,
    // Last observed event is available for a persistent article emphasis.
    articleEvent:timeline.events.filter(e=>e.kind==='article'&&e.frame<=frame&&e.scene===scene?.type).at(-1)??null,
  };
}
export function useBilingualVoiceClock(timeline:BilingualTiming) {
  return activeAtFrame(timeline,useCurrentFrame());
}
