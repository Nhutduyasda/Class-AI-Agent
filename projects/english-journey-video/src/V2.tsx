import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';

const token=z.object({text:z.string(),startMs:z.number(),endMs:z.number(),segmentId:z.string(),scene:z.string()});
export const v2Schema=z.object({timeline:z.object({
  durationInFrames:z.number().int(),durationSeconds:z.number().min(32).max(39),fps:z.literal(30),audioSrc:z.literal('v2/mix.wav'),
  facts:z.object({original:z.string(),revised:z.string()}),
  scenes:z.array(z.object({type:z.string(),startFrame:z.number(),endFrame:z.number()})).length(5),
  pages:z.array(z.object({startMs:z.number(),endMs:z.number(),text:z.string(),tokens:z.array(token)})),
  tokens:z.array(token),events:z.array(z.object({kind:z.string(),frame:z.number()})),
})});
export type V2Props=z.infer<typeof v2Schema>;
const C={bg:'#0A261D',mint:'#BBEC88',cream:'#F6EDDA',dark:'#203F30',red:'#B45143',muted:'#BECBBF'};
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)} as const;
const p=(frame:number,at:number,d=18)=>interpolate(frame,[at,at+d],[0,1],clamp);
const fonts=`@font-face{font-family:Journey;src:url('${staticFile('fonts/DejaVuSans.ttf')}')}@font-face{font-family:Journey;src:url('${staticFile('fonts/DejaVuSans-Bold.ttf')}');font-weight:700}`;

const Pencil:React.FC<{left:number;top:number;angle?:number}> = ({left,top,angle=-35})=><svg width="210" height="60" viewBox="0 0 210 60" style={{position:'absolute',left,top,transform:`rotate(${angle}deg)`,filter:'drop-shadow(0 8px 10px #00150a66)'}}>
  <path d="M5 30 L35 13 H178 V47 H35 Z" fill="#D7B77B"/><path d="M35 13 H165 V30 H35 Z" fill="#EDCE93"/><path d="M5 30 L18 22 V38 Z" fill="#243F30"/><rect x="173" y="13" width="12" height="34" rx="3" fill="#E5AF9D"/><path d="M164 13 H176 V47 H164 Z" fill="#DAD7C4"/>
</svg>;
const Original:React.FC<{text:string;frame:number}> = ({text,frame})=><div data-testid="v2-before" style={{fontSize:53,lineHeight:1.53,fontWeight:700}} aria-label={text}>
  {text.split(' ').map((word,i)=><React.Fragment key={i}>{i?' ':''}<span style={{position:'relative',display:'inline-block',color:['supermarke','yesteday'].includes(word)?C.red:C.dark}}>
    {word}{['supermarke','yesteday'].includes(word)&&<span style={{position:'absolute',height:4,bottom:4,left:0,width:`${100*p(frame,0,12)}%`,background:C.red,borderRadius:4,transform:'rotate(-2deg)'}}/>}
  </span></React.Fragment>)}
</div>;
const EditWord:React.FC<{wrong:string;before:string;added:string;after:string;at:number;frame:number}> = ({wrong,before,added,after,at,frame})=>{
 const reveal=p(frame,at,16);const hit=p(frame,at+8,18);
 return <div style={{position:'relative',marginBottom:34}}>
  <div style={{fontSize:48,color:C.red,display:'inline-block',position:'relative',opacity:interpolate(reveal,[0,1],[1,.55])}}>{wrong}<span style={{position:'absolute',height:3,left:-5,top:'52%',width:`${reveal*105}%`,background:C.red,transform:'rotate(-4deg)'}}/></div>
  <div style={{fontSize:68,fontWeight:700,color:C.dark,marginTop:4,opacity:reveal,transform:`translateY(${(1-reveal)*12}px)`}}>{before}<span style={{display:'inline-block',background:C.mint,borderRadius:12,padding:'0 8px',transform:`scale(${1+(1-hit)*.16})`}}>{added}</span>{after}</div>
 </div>;
};

export const V2:React.FC<V2Props>=({timeline:m})=>{
 const f=useCurrentFrame();const ms=f*1000/30;
 const scene=m.scenes.find(s=>f>=s.startFrame&&f<s.endFrame)??m.scenes[4];const local=f-scene.startFrame;
 const captions=m.pages.find(page=>ms>=page.startMs&&ms<page.endMs);
 const intro=p(local,0,14);
 const spell1=m.events.find(e=>e.kind==='spell')!.frame;
 const spell2=m.events.filter(e=>e.kind==='spell')[1].frame;
 const bridge=m.events.find(e=>e.kind==='bridge')!.frame;
 const connect=p(f,bridge,22);
 const correction=m.events.find(e=>e.kind==='complete')!.frame;
 const move=p(f,correction-20,16),join=p(f,correction,16),dinner=p(f,correction+20,16);
 const paper:React.CSSProperties={position:'absolute',left:94,right:160,top:560,padding:'38px 34px',borderRadius:22,background:C.cream,color:C.dark,boxShadow:'0 24px 55px #00000035',transform:`translateY(${(1-intro)*12}px) rotate(${scene.type==='opening'?-1.2:0}deg)`};
 return <AbsoluteFill style={{background:C.bg,fontFamily:'Journey, sans-serif',color:C.cream}}>
  <style>{fonts}</style><Audio src={staticFile(m.audioSrc)}/>
  <svg width="1080" height="1920" style={{position:'absolute',opacity:.1}}><path d="M-80 1050 Q350 500 1170 760 M-70 1090 Q420 630 1120 825" stroke={C.mint} strokeWidth="2" fill="none"/><circle cx="1080" cy="1520" r="500" fill="#A1C7A0" opacity=".18"/></svg>
  <div style={{position:'absolute',left:96,top:245,right:160,display:'flex',justifyContent:'space-between',fontSize:26,letterSpacing:1.5,fontWeight:700}}><span>ENGLISH JOURNEY</span><span style={{color:C.mint}}>NHẬT KÝ · 15</span></div>
  {scene.type==='opening'&&<>
    <div style={{position:'absolute',left:96,top:340,right:150,fontSize:83,lineHeight:1.2,fontWeight:700,letterSpacing:-2}}>Một câu thôi.<br/><span style={{color:C.mint}}>Sai mấy chỗ?</span></div>
    <div style={{...paper,top:595}}><div style={{fontSize:26,fontWeight:700,letterSpacing:2,marginBottom:24,color:C.red}}>BEFORE · CÂU MÌNH ĐÃ VIẾT</div><Original text={m.facts.original} frame={f}/><div style={{fontSize:28,marginTop:26,color:'#667460'}}>Kể chuyện đi siêu thị hôm qua.</div></div>
    <Pencil left={745} top={1110} angle={-28+2*Math.sin(f/40)}/>
  </>}
  {scene.type==='mistakes'&&<>
    <div style={{position:'absolute',left:96,top:340,fontSize:70,fontWeight:700,lineHeight:1.3}}>Nhìn từng chữ.<br/><span style={{color:C.mint}}>Sửa từng lỗi.</span></div>
    <div style={{...paper,top:560}}>
      <div style={{fontSize:27,fontWeight:700,color:C.red,marginBottom:28}}>01 · HAI LỖI CHÍNH TẢ</div>
      <EditWord wrong="supermarke" before="supermarke" added="t" after="" at={spell1} frame={f}/>
      <EditWord wrong="yesteday" before="yeste" added="r" after="day" at={spell2} frame={f}/>
      <div style={{fontSize:27,marginTop:8,color:'#61735D'}}>Chữ được thêm đang tô xanh.</div>
    </div><Pencil left={765} top={1030} angle={-25+4*p(f,spell2,20)}/>
  </>}
  {scene.type==='bridge'&&<>
    <div style={{position:'absolute',left:96,top:340,fontSize:71,fontWeight:700,lineHeight:1.3}}>Hai hành động.<br/><span style={{color:C.mint}}>Một từ nối.</span></div>
    <div style={{...paper,top:600,padding:'50px 30px 42px'}}>
      <div style={{fontSize:26,color:C.red,fontWeight:700,marginBottom:36}}>02 · THÊM “AND” = “VÀ”</div>
      <div style={{height:245,position:'relative'}}>
        <div style={{position:'absolute',top:25,left:0,width:228,textAlign:'center',transform:`translateX(${(1-connect)*-8}px)`}}><div style={{fontSize:64,fontWeight:700}}>went</div><div style={{fontSize:32,marginTop:20}}>đã đi</div></div>
        <div style={{position:'absolute',top:25,right:0,width:264,textAlign:'center',transform:`translateX(${(1-connect)*8}px)`}}><div style={{fontSize:64,fontWeight:700}}>bought</div><div style={{fontSize:32,marginTop:20}}>đã mua</div></div>
        <svg width="100%" height="200" viewBox="0 0 754 200" style={{position:'absolute',top:0}}><path d="M216 100 Q377 215 538 100" pathLength="1" stroke={C.dark} strokeWidth="5" fill="none" strokeDasharray="1" strokeDashoffset={1-connect}/></svg>
        <div style={{position:'absolute',top:120,left:'50%',transform:`translateX(-50%) translateY(${(1-connect)*-45}px) scale(${.8+.2*connect})`,background:C.mint,color:C.dark,borderRadius:20,padding:'10px 23px',fontSize:58,fontWeight:700,opacity:connect}}>and</div>
      </div>
      <div style={{fontSize:35,textAlign:'center',fontWeight:700,opacity:connect}}>đã đi <span style={{background:C.mint,padding:'3px 12px',borderRadius:8}}>và</span> đã mua</div>
    </div>
  </>}
  {scene.type==='fullfix'&&<>
    <div style={{position:'absolute',left:96,top:340,fontSize:74,lineHeight:1.25,fontWeight:700}}>Hiểu rồi.<br/><span style={{color:C.mint}}>Mình viết lại.</span></div>
    <div style={{...paper,top:560}}>
      <div style={{fontSize:27,fontWeight:700,color:C.dark,marginBottom:30}}>AFTER · CÂU MÌNH VIẾT LẠI</div>
      <div data-testid="v2-after" aria-label={m.facts.revised} style={{fontSize:51,lineHeight:1.53,fontWeight:700}}>
        After work <span style={{position:'relative',background:move>=.95?'#DAEABF':'transparent',borderRadius:7,display:'inline-block',transform:`translateY(${(1-move)*18}px)`,opacity:move}}>yesterday,</span>{' '}I went to the supermarket{' '}<span style={{display:'inline-block',background:C.mint,padding:'0 5px',borderRadius:7,opacity:join,transform:`scale(${.8+.2*join})`}}>and</span>{' '}bought food{' '}<span style={{borderBottom:'3px solid #88A970',opacity:dinner}}>for dinner.</span>
      </div>
      <div style={{marginTop:28,fontSize:28,lineHeight:1.5,color:'#557048',opacity:dinner}}>“for dinner” thêm ý:<br/>mua đồ cho bữa tối.</div>
    </div><Pencil left={770} top={1100} angle={-30}/>
  </>}
  {scene.type==='cta'&&<>
    <div style={{position:'absolute',left:96,top:350,fontSize:79,lineHeight:1.28,fontWeight:700}}>AI sửa.<br/><span style={{color:C.mint}}>Mình hiểu.</span><br/>Mình viết lại.</div>
    <div style={{...paper,top:800,padding:'38px 34px',transform:`translateY(${(1-p(local,20))*15}px)`}}>
      <svg width="690" height="72" viewBox="0 0 690 72" aria-label="Hiểu lỗi rồi tự viết lại"><path d="M15 40 Q290 75 665 25" pathLength="1" fill="none" stroke="#89A35E" strokeWidth="5" strokeDasharray="1" strokeDashoffset={1-p(local,20,30)}/><path d="M25 22 L36 34 L61 8" fill="none" stroke={C.dark} strokeWidth="6" strokeLinecap="round"/></svg>
      <div style={{fontSize:48,fontWeight:700,lineHeight:1.4}}>Bạn từng sai<br/>lỗi này chưa?</div>
    </div>
  </>}
  <div style={{position:'absolute',left:96,right:160,top:1330,height:155,padding:'12px 0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:47,fontWeight:700,lineHeight:1.38,textAlign:'center'}}>
    {captions&&<div>{captions.tokens.map((word,i)=><React.Fragment key={word.startMs}>{i?' ':''}<span style={{display:'inline-block',color:ms>=word.startMs&&ms<word.endMs?C.mint:C.cream}}>{word.text}</span></React.Fragment>)}</div>}
  </div>
  <div style={{position:'absolute',left:96,top:1540,fontSize:24,color:C.muted}}>Lỗi Writing thật · Học từ một câu của mình</div>
  <div style={{position:'absolute',left:96,right:160,top:1600,height:4,background:'#426047'}}><div style={{height:'100%',width:`${100*(f+1)/m.durationInFrames}%`,background:C.mint}}/></div>
 </AbsoluteFill>;
};
