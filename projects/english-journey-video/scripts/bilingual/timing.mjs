import {digest,validatePlan} from './core.mjs';
const observedKinds=new Set(['LOCAL_ASR_OBSERVED','AZURE_BOUNDARY']);
export function buildTimeline(plan,files,observations,{fps=30,gapMs=120,tailMs=600,audioSrc=`bilingual/${plan.productionId}/mix.wav`,allowOffline=false}={}) {
  validatePlan(plan);
  if(fps!==30||!Number.isFinite(gapMs)||gapMs<0||gapMs>2000||!Number.isFinite(tailMs)||tailMs<0)throw Error('INVALID_TIMELINE_SETTINGS');
  const scenes=[],pages=[],tokens=[],segments=[],events=[],voiceSpans=[];let cursor=0;
  if(files.length!==plan.requests.length||new Set(files.map(f=>f.id)).size!==files.length)throw Error('INCOMPLETE_AUDIO_FILES');
  for(const scene of plan.scenes){
    const startFrame=cursor/1600,sceneOffset=cursor/48,sceneRequests=plan.requests.filter(r=>r.scene===scene.id);
    for(let index=0;index<sceneRequests.length;index++){
      const r=sceneRequests[index],file=files.find(f=>f.id===r.id);
      if(!file||(!allowOffline&&file.kind!=='AZURE_REST')||!Number.isInteger(file.samples)||file.samples<=0||file.sampleRate!==48000||! /^[a-f0-9]{64}$/.test(file.sha256)||file.planSha256!==plan.planSha256)throw Error('UNVERIFIED_AUDIO_FILE');
      const obs=observations.filter(o=>o.requestId===r.id).sort((a,b)=>a.textStart-b.textStart);
      const sampleOffset=cursor;let previousTextEnd=0,previousTimeEnd=0;
      for(const o of obs){
        if(o.audioSha256!==file.sha256||!observedKinds.has(o.kind)||!Number.isInteger(o.textStart)||!Number.isInteger(o.textEnd)||o.textStart<previousTextEnd||o.textEnd<=o.textStart||o.textEnd>r.text.length||!Number.isFinite(o.startMs)||!Number.isFinite(o.endMs)||o.startMs<previousTimeEnd-.001||o.startMs<0||o.endMs<=o.startMs||o.endMs>file.samples/48+.1||r.text.slice(previousTextEnd,o.textStart).trim())throw Error('OBSERVED_TIMING_REQUIRED');
        const text=r.text.slice(o.textStart,o.textEnd);
        if(o.canonicalText!==undefined&&o.canonicalText!==text)throw Error('ASR_MUST_NOT_REWRITE_COPY');
        const startMs=sampleOffset/48+o.startMs,endMs=sampleOffset/48+o.endMs;
        const token={text,startMs,endMs,scene:scene.id,requestId:r.id,textStart:o.textStart,textEnd:o.textEnd,kind:o.kind};tokens.push(token);
        previousTextEnd=o.textEnd;previousTimeEnd=o.endMs;
      }
      if(!obs.length||r.text.slice(previousTextEnd).trim())throw Error('INCOMPLETE_OBSERVED_TRANSCRIPT');
      let requestOffset=0;
      for(const span of r.spans){
        const begin=requestOffset,end=begin+span.text.length;requestOffset=end;
        // A phrase may include a closing quote assigned to the next voice in
        // SSML. Punctuation alone must not make that voice inherit the preceding
        // English phrase's audio interval.
        const letters=[...span.text.matchAll(/[\p{L}\p{N}]/gu)];if(!letters.length)continue;
        const speechBegin=begin+letters[0].index,speechEnd=begin+letters.at(-1).index+letters.at(-1)[0].length;
        const times=obs.filter(o=>o.textStart<speechEnd&&o.textEnd>speechBegin);
        if(!times.length)throw Error('VOICE_SPAN_TIMING_UNAVAILABLE');
        voiceSpans.push({scene:scene.id,requestId:r.id,text:span.text,language:span.language,voice:span.voice,startMs:sampleOffset/48+times[0].startMs,endMs:sampleOffset/48+times.at(-1).endMs,kind:'OBSERVED_AUDIO_SPAN'});
        for(const o of times){
          const word=r.text.slice(o.textStart,o.textEnd).trim();
          if(/^(?:a|an|the)$/i.test(word)&&span.language==='en-US')events.push({kind:'article',article:word.toUpperCase(),frame:Math.round((sampleOffset/48+o.startMs)*fps/1000),scene:scene.id,voice:span.voice});
        }
      }
      cursor+=file.samples;
      if(index<sceneRequests.length-1)cursor+=Math.round(gapMs*48);
    }
    const speechEndMs=cursor/48;cursor=Math.ceil((cursor+tailMs*48)/1600)*1600;
    scenes.push({type:scene.id,startFrame,endFrame:cursor/1600});segments.push({id:scene.id,spoken:scene.canonicalText,startMs:sceneOffset,speechEndMs,endMs:cursor/48});
  }
  // Canonical pages use exact character slices; ASR strings never become subtitles.
  for(const s of scenes){
    const scene=plan.scenes.find(x=>x.id===s.type),own=tokens.filter(t=>t.scene===s.type);let group=[];
    for(let i=0;i<own.length;i++){
      group.push(own[i]);
      if(group.length>=7||/[.!?;:,]$/.test(own[i].text.trim())||i===own.length-1){
        const first=group[0],last=group.at(-1),request=plan.requests.find(r=>r.id===first.requestId);
        if(group.some(t=>t.requestId!==first.requestId)){
          // Split requests can cross a page: preserve words, joining only approved whitespace.
          const text=group.map(t=>t.text).join(' ');pages.push({text,startMs:first.startMs,endMs:last.endMs,scene:s.type});
        }else pages.push({text:request.text.slice(first.textStart,last.textEnd),startMs:first.startMs,endMs:last.endMs,scene:s.type});
        group=[];
      }
    }
    if(scene.canonicalText.replace(/\s+/g,' ').trim()!==pages.filter(p=>p.scene===s.type).map(p=>p.text.trim()).join(' ').replace(/\s+/g,' '))throw Error('CAPTION_COPY_MISMATCH');
  }
  const markers=Object.fromEntries(events.map((e,i)=>[`${e.scene}-article-${e.article.toLowerCase()}-${i}`,e.frame]));
  return {schemaVersion:1,planSha256:plan.planSha256,briefSha256:plan.briefSha256,fps,durationInFrames:cursor/1600,durationSeconds:cursor/48000,audioSrc,scenes,pages,tokens,segments,voiceSpans,events,markers,audioSamples:cursor,timing:allowOffline?'OFFLINE_TEST_FIXTURE_ONLY':'OBSERVED_AUDIO_ONLY_NO_INTERPOLATION',subjectiveQA:'BLOCKED_REQUIRES_REAL_LISTENING'};
}
const stamp=(ms,separator)=>{const n=Math.round(ms),h=Math.floor(n/3600000),m=Math.floor(n/60000)%60,s=Math.floor(n/1000)%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${separator}${String(n%1000).padStart(3,'0')}`;};
export function subtitles(pages,format='srt') {
  if(!['srt','vtt'].includes(format))throw Error('INVALID_SUBTITLE_FORMAT');
  return (format==='vtt'?'WEBVTT\n\n':'')+pages.map((p,i)=>(format==='srt'?`${i+1}\n`:'')+`${stamp(p.startMs,format==='srt'?',':'.')} --> ${stamp(p.endMs,format==='srt'?',':'.')}\n${p.text}\n`).join('\n');
}
