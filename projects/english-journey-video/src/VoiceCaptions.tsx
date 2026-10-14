import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {pageAt, type Narration} from './voice';

export const VoiceCaptions: React.FC<{narration:Narration}> = ({narration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame * 1000 / fps;
  const page = pageAt(narration, now);
  if (!page) return null;
  return <span data-testid="voice-caption" style={{display:'block',width:'100%'}}>
    {page.tokens.map((token,index)=>{
      const active = now >= token.startMs && now < token.endMs;
      const scale = active ? interpolate(now-token.startMs,[0,80,140],[1,1.035,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : 1;
      return <React.Fragment key={`${token.segmentId}-${token.startMs}`}>
        {index > 0 ? ' ' : ''}<span data-active={active} style={{display:'inline-block',color:active?'#B8F36A':'#F6F5F0',transform:`scale(${scale})`,textShadow:'0 2px 5px #0B1C16'}}>{token.text}</span>
      </React.Fragment>;
    })}
  </span>;
};
