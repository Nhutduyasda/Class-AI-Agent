export function editorialMarkers(plan,timeline){
 const text=plan.scenes.find(s=>s.id==='demo').canonicalText;
 const cues={request:'Rồi hỏi ChatGPT',hint:'Agree là động từ hay tính từ?',strike:'không cần thêm am',correct:'I agree’',practice:'I agree with you'};
 const markers={};
 for(const [name,needle] of Object.entries(cues)){
  const start=text.indexOf(needle);if(start<0)throw Error('MISSING_DEMO_CUE_'+name);
  const token=timeline.tokens.find(t=>t.scene==='demo'&&t.textStart<=start&&t.textEnd>start);
  if(!token)throw Error('OBSERVED_DEMO_CUE_REQUIRED_'+name);
  markers[name]=Math.ceil(token.startMs*30/1000);
 }
 if(!(markers.hint<markers.strike&&markers.strike<markers.correct&&markers.correct<markers.practice))throw Error('DEMO_REVEAL_ORDER');
 return markers;
}
