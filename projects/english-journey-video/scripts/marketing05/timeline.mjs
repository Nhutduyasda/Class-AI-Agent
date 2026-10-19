import {readFile,writeFile} from 'node:fs/promises';
import {digest} from '../bilingual/core.mjs';import {buildTimeline,subtitles} from '../bilingual/timing.mjs';import {editorialMarkers} from './editorial.mjs';
const folder='out/marketing05-production',plan=JSON.parse(await readFile('docs/reviews/marketing05/ssml-plan.json'));
const assembly=JSON.parse(await readFile(folder+'/audio-assembly.json'));
if(assembly.kind!=='VERIFIED_AUDIO_ASSEMBLY_NOT_SPENDING_LEDGER'||assembly.assemblyPlanSha256!==plan.planSha256)throw Error('VERIFIED_ASSEMBLY_REQUIRED');
const files=[];
for(const f of assembly.files){
 const bytes=await readFile(folder+'/raw/'+f.id+'.wav');if(digest(bytes)!==f.sha256||f.assemblyPlanSha256!==plan.planSha256||f.ssmlSha256!==plan.requests.find(r=>r.id===f.id)?.ssmlSha256)throw Error('ASSEMBLY_AUDIO_CHANGED');
 // planSha256 here identifies the exact-copy assembly clock. Original receipt
 // plan hashes stay intact in audio-assembly.json and raw/*.receipt.json.
 files.push({...f,planSha256:plan.planSha256});
}
const observations=JSON.parse(await readFile(folder+'/observations.json'));
const m=buildTimeline(plan,files,observations,{gapMs:0,tailMs:800,audioSrc:'marketing05/mix.wav'});
// Observations are readable phrases, not invented word-level timestamps.
m.pages=m.tokens.map(t=>({text:t.text,startMs:t.startMs,endMs:t.endMs,scene:t.scene}));
const spans=[];
for(const s of m.voiceSpans){const previous=spans.at(-1);if(previous&&previous.scene===s.scene&&s.startMs<previous.endMs){if(previous.voice!==s.voice)throw Error('OBSERVED_VOICE_BOUNDARY_NEEDS_REVIEW');previous.endMs=Math.max(previous.endMs,s.endMs);previous.text+=s.text;}else spans.push({...s});}
m.voiceSpans=spans;
m.markers=editorialMarkers(plan,m);m.sourceAssembly='audio-assembly.json';m.captionTiming='Canonical copy with local ASR observed audio endpoints; no interpolated word timestamps. Human sync review pending.';
await writeFile(folder+'/timeline.json',JSON.stringify(m,null,2)+'\n');
for(const ext of ['srt','vtt'])await writeFile(folder+'/subtitles.'+ext,subtitles(m.pages,ext));
console.log(JSON.stringify({duration:m.durationSeconds,scenes:m.scenes,markers:m.markers,pages:m.pages.length}));
