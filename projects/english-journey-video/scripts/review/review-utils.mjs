// Objective measurements and evidence validation; never assert subjective watch quality.
export function parseFps(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !value) return NaN;
  const parts = value.split('/').map(Number);
  if (parts.some(n => !Number.isFinite(n)) || parts.length > 2 || parts.length === 0) return NaN;
  return parts.length === 2 ? (parts[1] ? parts[0] / parts[1] : NaN) : parts[0];
}
export function inspectProbe(probe) {
  const issues = [];
  const streams = probe?.streams ?? [];
  const video = streams.find(s => s.codec_type === 'video');
  const audio = streams.find(s => s.codec_type === 'audio');
  const durationSeconds = Number(probe?.format?.duration ?? video?.duration ?? 0);
  const fps = parseFps(video?.avg_frame_rate || video?.r_frame_rate);
  if (!video) issues.push('Video stream missing');
  else {
    if (video.codec_name !== 'h264') issues.push('Video codec must be H.264');
    if (video.width !== 1080 || video.height !== 1920) issues.push('Video must be 1080x1920');
    if (!Number.isFinite(fps) || Math.abs(fps - 30) > 0.01) issues.push('Video must be 30 FPS');
  }
  if (!audio) issues.push('Audio stream missing');
  else if (audio.codec_name !== 'aac') issues.push('Audio codec must be AAC');
  if (!Number.isFinite(durationSeconds) || durationSeconds < 1) issues.push('Video duration missing/invalid');
  return {issues, details:{width:video?.width ?? null,height:video?.height ?? null,fps:Number.isFinite(fps)?fps:null,durationSeconds,videoCodec:video?.codec_name ?? null,audioCodec:audio?.codec_name ?? null,sampleRate:audio?.sample_rate ?? null}};
}
export function inspectTimeline(timeline, brief, durationSeconds, fps=30) {
  const issues = [];
  if (!timeline) return {issues, status:'SKIPPED — no timeline supplied'};
  const scenes = timeline.scenes;
  if (!Array.isArray(scenes) || !scenes.length) return {issues:['Timeline must contain nonempty scenes'],status:'FAIL'};
  if (Math.abs((timeline.durationInFrames ?? 0) / fps - durationSeconds) > 0.2) issues.push('Timeline length differs from MP4 duration');
  scenes.forEach((s,i) => {
    if (!(Number.isInteger(s.startFrame) && Number.isInteger(s.endFrame) && s.endFrame>s.startFrame)) issues.push('Invalid scene frame range: '+s.type);
    if (i===0 && s.startFrame!==0) issues.push('Scenes must start at frame zero');
    if (i>0 && scenes[i-1].endFrame!==s.startFrame) issues.push('Non-contiguous scenes at '+s.type);
  });
  if (scenes.at(-1).endFrame !== timeline.durationInFrames) issues.push('Last scene does not end at timeline duration');
  if (brief) {
    const expected = brief.spokenSegments ?? [];
    if (JSON.stringify(scenes.map(s=>s.type))!==JSON.stringify(expected.map(s=>s.id))) issues.push('Approved six-stage order changed');
    if (!Array.isArray(timeline.tokens)) issues.push('Missing speech tokens to verify approved wording');
    else expected.forEach(s => {
      const actual = timeline.tokens.filter(t=>t.scene===s.id).map(t=>t.text).join(' ');
      if (actual!==s.spoken) issues.push('Approved words differ in scene '+s.id);
    });
    if (timeline.facts?.original!==brief.approvedEvidence?.original || timeline.facts?.correction!==brief.approvedEvidence?.correction) issues.push('Approved lesson evidence changed');
  }
  return {issues,status:issues.length?'FAIL':'PASS'};
}
export function evidenceTimes(timeline,durationSeconds,fps=30) {
  const output = [];
  const seen = new Set();
  function add(label, t) {
    const sec = Math.max(0, Math.min(Number(t),Math.max(0,durationSeconds-0.1)));
    if(!Number.isFinite(sec)) return;
    const id=label.replace(/[^a-z0-9-]/gi,'-').toLowerCase();
    if(seen.has(id)) return;
    seen.add(id);
    output.push({label:id,timeSeconds:Number(sec.toFixed(3))});
  }
  add('opening-frame',0.05);add('hook-1-second',1);add('hook-2-5-seconds',2.5);
  if(timeline?.scenes?.length) {
    for(const s of timeline.scenes) add('scene-'+s.type,((s.startFrame+s.endFrame)/2)/fps);
    const complete=timeline.events?.find(e=>e.kind==='complete');
    if(complete) add('demo-correction-complete',complete.frame/fps+0.5);
  } else {
    add('quarter',durationSeconds*.25);add('middle',durationSeconds*.5);add('three-quarters',durationSeconds*.75);
  }
  add('last-second',durationSeconds-1);
  return output;
}
export function compareTwoPasses(worksheet) {
  const first=worksheet?.firstPass,second=worksheet?.secondPass;
  if(!first || !second || !first.preference || !second.preference) return {status:'INCOMPLETE',winner:null,reason:'Two independent real video reviews required'};
  const A=JSON.stringify(first.order),B=JSON.stringify(second.order);
  if(A!==JSON.stringify(['candidate','baseline']) || B!==JSON.stringify(['baseline','candidate'])) return {status:'INVALID',winner:null,reason:'Pass orders must be reversed'};
  for(const p of [first,second]) {
    if(!['candidate','baseline','tie'].includes(p.preference)) return {status:'INVALID',winner:null,reason:'Invalid preference'};
    if(p.watchedEntireVideos!==true || p.listenedToAudio!==true) return {status:'INCOMPLETE',winner:null,reason:'Reviewer has not confirmed full watching and listening'};
    if(typeof p.reason!=='string' || p.reason.trim().length<12) return {status:'INCOMPLETE',winner:null,reason:'Each pass needs an evidence-based reason'};
    if(!Array.isArray(p.evidence) || p.evidence.length===0 || p.evidence.some(e=>!Number.isFinite(e.timeSec)||typeof e.observation!=='string'||e.observation.trim().length<6)) return {status:'INCOMPLETE',winner:null,reason:'Timestamped observation required for each pass'};
  }
  if(first.preference===second.preference && first.preference!=='tie') return {status:'CONSENSUS',winner:first.preference,reason:'Same choice after reversed order (advisory; owner approval still required)'};
  return {status:'INCONCLUSIVE',winner:null,reason:'Split vote or tie; retain baseline pending owner decision'};
}
