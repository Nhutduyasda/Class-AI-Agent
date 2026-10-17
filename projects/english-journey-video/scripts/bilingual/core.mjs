import {createHash} from 'node:crypto';
import path from 'node:path';
export const digest = value => createHash('sha256').update(value).digest('hex');
export const escapeXml = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export const codepoints = text => Array.from(text).length;
export const safeId = value => typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)&&!/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(value);
export function containedPath(root, pieces, flavor=path) {
  const base=flavor.resolve(root), target=flavor.resolve(base,...pieces), rel=flavor.relative(base,target);
  if (!rel || rel==='..' || rel.startsWith('..'+flavor.sep) || flavor.isAbsolute(rel)) throw Error('UNSAFE_OUTPUT_PATH');
  return target;
}
export function validateProfile(p) {
  if(p.provider!=='AZURE_OFFICIAL_ONLY'||p.resource!=='english-journey-namminh'||p.region!=='southeastasia'||p.voices?.['vi-VN']!=='vi-VN-NamMinhNeural'||p.voices?.['en-US']!=='en-US-AndrewNeural'||p.rate!=='+0%'||p.pitch!=='default'||p.format!=='riff-48khz-16bit-mono-pcm') throw Error('INVALID_VOICE_PROFILE');
}
const wordEdge=(t,i)=>i<0||i>=t.length||!/[\p{L}\p{N}_]/u.test(t[i]);
export function segment(text, metadata={}, profile) {
  validateProfile(profile);
  if(typeof text!=='string'||!text.trim()||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)||text!==text.normalize('NFC'))throw Error('INVALID_CANONICAL_TEXT_USE_NFC');
  const labels=Array(text.length).fill('vi-VN'), reasons=Array(text.length).fill('default-vi'), phones=Array(text.length).fill(null), locked=Array(text.length).fill(false);
  const overrides=metadata.spans??[];
  let lastEnd=0;
  for(const s of overrides){
    if(!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start<lastEnd||s.end<=s.start||s.end>text.length||!['vi-VN','en-US'].includes(s.language)||text.slice(s.start,s.end)!==s.text||/[\uD800-\uDBFF]/.test(text[s.end-1])||/[\uDC00-\uDFFF]/.test(text[s.start]))throw Error('INVALID_OR_STALE_MANUAL_SPAN');
    if(s.phoneme&&!['ə','ən','ðə','ði','eɪ'].includes(s.phoneme))throw Error('INVALID_PHONEME');
    if(!wordEdge(text,s.start-1)||!wordEdge(text,s.end))throw Error('MANUAL_SPAN_MUST_NOT_SPLIT_WORD');
    if(s.phoneme&&(s.language!=='en-US'||! /^(A|AN|THE)$/i.test(s.text)))throw Error('PHONEME_ONLY_FOR_ARTICLE');
    for(let i=s.start;i<s.end;i++){labels[i]=s.language;reasons[i]='manual';locked[i]=true;phones[i]=s.phoneme??null;}
    lastEnd=s.end;
  }
  function mark(start,end,lang,reason,phone=null){
    if(locked.slice(start,end).some(Boolean))return;
    for(let i=start;i<end;i++){labels[i]=lang;reasons[i]=reason;phones[i]=phone;}
  }
  const terms=[...profile.englishExamples,...profile.englishTerms,...Object.keys(profile.entityDefaults)].sort((a,b)=>b.length-a.length);
  const occupied=Array(text.length).fill(false);
  for(const term of terms){
    let at=-1;
    while((at=text.indexOf(term,at+1))!==-1){
      const end=at+term.length;
      if(!wordEdge(text,at-1)||!wordEdge(text,end)||occupied.slice(at,end).some(Boolean))continue;
      mark(at,end,profile.entityDefaults[term]??'en-US','known-term');for(let i=at;i<end;i++)occupied[i]=true;
    }
  }
  // General Latin English clauses: require an English anchor; never infer from A/an/the alone.
  const lex=new Set('i you he she it we they saw see ate eat cat apple sleeping was were am is are went go to school yesterday want improve my english a an the'.split(' '));
  for(const match of text.matchAll(/[A-Za-z]+(?:[ ,’'\-]+[A-Za-z]+)*[.!?]?/g)){
    const tokens=match[0].match(/[A-Za-z]+/g)??[];
    if(tokens.length>=3&&tokens.every(w=>lex.has(w.toLowerCase()))&&tokens.some(w=>/^(I|you|he|she|it|we|they|yesterday)$/i.test(w))) mark(match.index,match.index+match[0].length,'en-US','english-clause');
  }
  const articlePhonemes={A:'ə',AN:'ən',THE:'ðə'};
  for(const match of text.matchAll(/\b(?:A|AN|THE)\b/g)){
    const at=match.index,end=at+match[0].length;
    if(labels.slice(at,end).every(x=>x==='en-US'))continue;
    const before=text.slice(Math.max(0,at-55),at);
    if(/(?:lớp|nhóm|đáp án|phương án|tên|bạn|anh|chị)\s*$/iu.test(before))continue;
    const list=/(?:A\s*[,/]\s*AN\s*[,/]\s*THE)/g;
    const inList=Array.from(text.matchAll(list)).some(m=>at>=m.index&&end<=m.index+m[0].length);
    if(inList||/(?:mạo từ|dùng|chọn)\s*[:“"']?\s*$/iu.test(before))mark(at,end,'en-US','article-context',articlePhonemes[match[0]]);
  }
  // Unknown ASCII/proper-name runs are surfaced; explicit metadata can classify either language.
  const warnings=[];
  const viPlain=new Set('a an the ai em anh chi ban minh sau khi vi du hay ma nay cho con trong ra noi co la va de dung moi hoc loi sai roi voi tu viec mot da thi sao xem theo qua ngay sang chia tra log khong neu thong tin luon nam'.split(' '));
  for(const m of text.matchAll(/\p{L}[\p{L}\p{N}]*/gu)){
    if(!/^[A-Za-z][A-Za-z0-9]*$/.test(m[0]))continue;
    if(labels.slice(m.index,m.index+m[0].length).some(x=>x==='en-US')||locked.slice(m.index,m.index+m[0].length).every(Boolean)||Object.hasOwn(profile.entityDefaults,m[0])||viPlain.has(m[0].toLowerCase()))continue;
    warnings.push({start:m.index,end:m.index+m[0].length,text:m[0],code:'UNRESOLVED_LATIN_TOKEN'});
  }
  const spans=[];
  let start=0;
  for(let i=1;i<=text.length;i++){
    if(i===text.length||labels[i]!==labels[start]||phones[i]!==phones[start]||reasons[i]!==reasons[start]){
      spans.push({start,end:i,text:text.slice(start,i),language:labels[start],voice:profile.voices[labels[start]],reason:reasons[start],...(phones[start]?{phoneme:phones[start]}:{})});start=i;
    }
  }
  if(spans.map(s=>s.text).join('')!==text)throw Error('EXACT_COPY_VIOLATION');
  return {canonicalText:text,spans,warnings};
}
export function ssmlFor(spans) {
  const body=spans.map(s=>{
    if(!['vi-VN-NamMinhNeural','en-US-AndrewNeural'].includes(s.voice))throw Error('INVALID_VOICE');
    const text=escapeXml(s.text);
    const content=s.phoneme?`<phoneme alphabet="ipa" ph="${escapeXml(s.phoneme)}">${text}</phoneme>`:text;
    return `<voice name="${s.voice}">${content}</voice>`;
  }).join('');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">${body}</speak>`;
}
export function billing(ssml) {
  // Documented billable envelope: all serialized content except speak/voice tags.
  const serialized=ssml.replace(/<\/?(?:speak|voice)\b[^>]*>/g,'');
  let billableCharacters=0;
  for(const cp of serialized)billableCharacters+=/\p{Script=Han}/u.test(cp)?2:1;
  return {billableCharacters,method:'SSML_SERIALIZED_EXCLUDING_SPEAK_VOICE_INCLUDING_OPTIONAL_MARKUP',escapedEntitiesConservativelyCounted:true};
}
export function makePlan(brief,briefBytes,profile,pricing,{mode=profile.mode,briefRelativePath=null}={}) {
  validateProfile(profile);
  if(brief.approved!==true||!safeId(brief.id)||!['multivoice','split'].includes(mode))throw Error('APPROVED_BRIEF_REQUIRED');
  if(!Array.isArray(brief.spokenSegments)||!brief.spokenSegments.length||new Set(brief.spokenSegments.map(s=>s.id)).size!==brief.spokenSegments.length)throw Error('INVALID_SCENES');
  const requests=[],scenes=[];
  for(const s of brief.spokenSegments){
    if(!safeId(s.id))throw Error('INVALID_SCENE_ID');
    const segmented=segment(s.spoken,s.voiceProduction,profile);scenes.push({id:s.id,...segmented});
    const splitChunks=[];let leading=[];
    for(const span of segmented.spans){
      if(!/[\p{L}\p{N}]/u.test(span.text)){
        if(splitChunks.length)splitChunks.at(-1).push(span);else leading.push(span);
      }else{splitChunks.push([...leading,span]);leading=[];}
    }
    if(leading.length)throw Error('NO_SPOKEN_WORDS');
    const chunks=mode==='multivoice'?[segmented.spans]:splitChunks;
    chunks.forEach((spans,i)=>{
      const ssml=ssmlFor(spans),count=billing(ssml);
      requests.push({id:mode==='multivoice'?s.id:`${s.id}--${i}`,scene:s.id,spans,ssml,ssmlSha256:digest(ssml),text:spans.map(s=>s.text).join(''),...count,estimatedUsd:Number((count.billableCharacters*pricing.usdPerMillion/1e6).toFixed(12))});
    });
  }
  if(!Number.isFinite(pricing.usdPerMillion)||pricing.usdPerMillion<=0||pricing.currency!=='USD'||pricing.region!==profile.region)throw Error('INVALID_PRICE');
  const plan={schemaVersion:1,productionId:brief.id,briefRelativePath,briefSha256:digest(briefBytes),profileSha256:digest(JSON.stringify(profile)),profile,pricing,mode,scenes,requests,requestCount:requests.length,textCodepoints:brief.spokenSegments.reduce((n,s)=>n+codepoints(s.spoken),0),billableCharacters:requests.reduce((n,r)=>n+r.billableCharacters,0),estimatedUsd:Number(requests.reduce((n,r)=>n+r.estimatedUsd,0).toFixed(12)),warnings:scenes.flatMap(s=>s.warnings.map(w=>({scene:s.id,...w}))),liveSynthesisAllowed:false};
  return {...plan,planSha256:digest(JSON.stringify(plan))};
}
export function validatePlan(plan) {
  const {planSha256,...payload}=plan;
  if(digest(JSON.stringify(payload))!==planSha256)throw Error('PLAN_CHANGED');
  validateProfile(plan.profile);
  if(!safeId(plan.productionId)||!Array.isArray(plan.requests)||!plan.requests.length||plan.requestCount!==plan.requests.length||new Set(plan.requests.map(r=>r.id)).size!==plan.requests.length||plan.requests.some(r=>!safeId(r.id)||!plan.scenes.some(s=>s.id===r.scene)))throw Error('INVALID_PLAN_STRUCTURE');
  if(plan.requests.some(r=>Math.abs(r.estimatedUsd-r.billableCharacters*plan.pricing.usdPerMillion/1e6)>1e-10)||Math.abs(plan.estimatedUsd-plan.requests.reduce((n,r)=>n+r.estimatedUsd,0))>1e-10||plan.billableCharacters!==plan.requests.reduce((n,r)=>n+r.billableCharacters,0))throw Error('PLAN_COST_MISMATCH');
  for(const scene of plan.scenes)if(scene.spans.map(s=>s.text).join('')!==scene.canonicalText)throw Error('EXACT_COPY_VIOLATION');
  for(const r of plan.requests)if(ssmlFor(r.spans)!==r.ssml||digest(r.ssml)!==r.ssmlSha256||billing(r.ssml).billableCharacters!==r.billableCharacters)throw Error('SSML_CHANGED');
}
