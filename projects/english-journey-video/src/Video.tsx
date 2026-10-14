import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {captionFor, type Props} from './story';
import {VoiceCaptions} from './VoiceCaptions';
import {voiceSceneAt} from './voice';

const ink = '#F6F5F0';
const mint = '#B8F36A';
const pink = '#FFB3AC';
const card: React.CSSProperties = {background:'#172923', border:'2px solid #365047', borderRadius:32, padding:'44px 38px'};
const clamp = {extrapolateLeft:'clamp', extrapolateRight:'clamp'} as const;

export const Video: React.FC<Props> = ({brief, narration}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const seconds = frame / fps;
  const voiceScene = narration ? voiceSceneAt(narration, frame) : undefined;
  const beat = voiceScene ? brief.beats.find(b => b.type === voiceScene.type)! : brief.beats.find(b => seconds >= b.start && seconds < b.end) ?? brief.beats[4];
  const local = voiceScene ? (frame - voiceScene.startFrame) / fps : seconds - beat.start;
  const activeToken = narration?.tokens.find(token => seconds * 1000 >= token.startMs && seconds * 1000 < token.endMs);
  const conjunctionStart = narration?.tokens.find(t => t.segmentId === 'teach-vi' && t.text === 'Rồi')?.startMs;
  const conjunctionActive = narration ? (activeToken?.text.toLowerCase().replace(/[.,]/g, '') === 'and' || activeToken?.segmentId === 'teach-vi' && conjunctionStart !== undefined && seconds * 1000 >= conjunctionStart) : local >= 3.5;
  // A fully visible hook at frame zero; subsequent scenes slide 16px into place.
  const enter = beat.type === 'hook' ? 1 : interpolate(local, [0, .28], [.82, 1], clamp);
  const caption = captionFor(beat.type, local);
  const accent = beat.type === 'before' ? pink : mint;
  const step = {hook:'01 / NHẬN RA', before:'02 / CÂU GỐC', teach:'03 / HIỂU LỖI', after:'04 / VIẾT LẠI', cta:'05 / LUYỆN TẬP'}[beat.type];
  return <AbsoluteFill style={{background:'#0B1C16',color:ink,fontFamily:'Journey, sans-serif'}}>
    {narration && <Audio src={staticFile(narration.audioSrc)} />}
    <style>{`@font-face{font-family:Journey;src:url('${staticFile('fonts/DejaVuSans.ttf')}')}@font-face{font-family:Journey;src:url('${staticFile('fonts/DejaVuSans-Bold.ttf')}');font-weight:700}`}</style>
    <div style={{position:'absolute', width:760,height:760,borderRadius:'50%',left:-380,top:760,background:'#18392A',opacity:.55}}/>
    <div style={{position:'absolute',left:96,right:160,top:250,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:26,fontWeight:700,letterSpacing:2}}>
      <span>{brief.brand.toUpperCase()}</span><span style={{color:mint}}>LESSON 15</span>
    </div>
    <div style={{position:'absolute',left:96,right:160,top:340,height:6,background:'#30433B',borderRadius:4}}>
      <div style={{width:`${100 * (frame + 1) / durationInFrames}%`,height:'100%',background:mint,borderRadius:4}}/>
    </div>
    <div style={{position:'absolute',left:96,right:160,top:420,opacity:enter,transform:`translateY(${(1-enter)*80}px)`}}>
      <div style={{color:accent,fontSize:27,fontWeight:700,letterSpacing:3,marginBottom:36}}>{step}</div>
      {beat.type === 'hook' && <>
        <div style={{fontSize:78,lineHeight:1.26,fontWeight:700,letterSpacing:-2}}>Tôi từng viết sai<br/>câu tiếng Anh<br/><span style={{color:mint}}>đơn giản này!</span></div>
        <div style={{...card,marginTop:64,fontSize:52,lineHeight:1.5}}>Viết xong một câu.<br/><span style={{color:mint}}>Nhưng vẫn thấy “sai sai”?</span></div>
      </>}
      {beat.type === 'before' && <>
        <div style={{fontSize:56,fontWeight:700,marginBottom:36}}>Câu mình đã viết</div>
        <div style={{...card,borderColor:'#6A4A43'}}>
          <div style={{color:pink,fontSize:28,fontWeight:700,marginBottom:28}}>BEFORE · GIỮ NGUYÊN CÂU GỐC</div>
          <div data-testid="original" style={{fontSize:62,lineHeight:1.42,fontWeight:700,whiteSpace:'normal'}}>{brief.facts.original}</div>
        </div>
      </>}
      {beat.type === 'teach' && <>
        <div style={{fontSize:64,fontWeight:700,lineHeight:1.3,marginBottom:40}}>Sửa 2 nhóm lỗi</div>
        <div style={{...card,marginBottom:28,borderColor:!conjunctionActive ? mint : '#365047'}}>
          <div style={{fontSize:31,color:mint,marginBottom:18,fontWeight:700}}>01 · CHÍNH TẢ</div>
          <div style={{fontSize:53,lineHeight:1.45,fontWeight:700}}>supermarket<br/>yesterday</div>
        </div>
        <div style={{...card,borderColor:conjunctionActive ? mint : '#365047'}}>
          <div style={{fontSize:31,color:mint,marginBottom:18,fontWeight:700}}>02 · NỐI HÀNH ĐỘNG</div>
          <div style={{fontSize:48,lineHeight:1.5}}>went … <span style={{color:mint,fontWeight:700}}>and</span> bought …</div>
        </div>
      </>}
      {beat.type === 'after' && <>
        <div style={{fontSize:56,fontWeight:700,marginBottom:36}}>Câu sau khi viết lại</div>
        <div style={{...card,borderColor:mint}}>
          <div style={{color:mint,fontSize:28,fontWeight:700,marginBottom:28}}>AFTER · BẢN ĐÃ SỬA</div>
          <div data-testid="revised" style={{fontSize:59,lineHeight:1.42,fontWeight:700}}>{brief.facts.revised}</div>
        </div>
      </>}
      {beat.type === 'cta' && <>
        <div style={{fontSize:78,fontWeight:700,lineHeight:1.55}}>Viết sai<br/><span style={{color:mint}}>↓ Hiểu lỗi</span><br/>↓ Tự viết lại</div>
        <div style={{fontSize:41,lineHeight:1.4,marginTop:52,color:'#C7D7CE'}}>Một câu, một lần sửa.<br/>Tiếp tục luyện viết.</div>
      </>}
    </div>
    <div style={{position:'absolute',left:96,right:160,top:1280,minHeight:180,display:'flex',alignItems:'center',justifyContent:'center',borderTop:'2px solid #365047',paddingTop:30,fontSize:48,fontWeight:700,lineHeight:1.4,textAlign:'center',whiteSpace:'pre-line'}}>{narration ? <VoiceCaptions narration={narration} /> : caption}</div>
    <div style={{position:'absolute',left:96,top:1530,fontSize:23,color:'#A9BCB1'}}>Ví dụ sửa câu từ Reading & Grammar · Lesson 15</div>
  </AbsoluteFill>;
};
