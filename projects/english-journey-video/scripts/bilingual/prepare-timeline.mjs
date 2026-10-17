import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {inspectWave} from '../marketing03/direct-audio.mjs';
import {buildTimeline,subtitles} from './timing.mjs';
import {validatePlan,containedPath} from './core.mjs';
const [planPath,rootArg]=process.argv.slice(2);
if(!planPath||!rootArg)throw Error('Usage: node scripts/bilingual/prepare-timeline.mjs <plan.json> <project-root>');
const root=resolve(rootArg),plan=JSON.parse(await readFile(planPath,'utf8'));validatePlan(plan);
const out=containedPath(root,['out','bilingual',plan.productionId]),ledger=JSON.parse(await readFile(join(out,'ledger.json'),'utf8'));
if(ledger.kind!=='AZURE_REST'||ledger.planSha256!==plan.planSha256)throw Error('REAL_AZURE_AUDIO_REQUIRED');
const files=[];
for(const r of plan.requests){
 const file=join(out,r.id+'.wav'),info=inspectWave(await readFile(file)),receipt=JSON.parse(await readFile(file+'.receipt.json','utf8')),call=ledger.calls.find(c=>c.id===r.id);
 if(call?.status!=='VERIFIED'||call.sha256!==info.sha256||receipt.sha256!==info.sha256||receipt.provenance.ssmlSha256!==r.ssmlSha256||receipt.provenance.planSha256!==plan.planSha256||receipt.provenance.kind!=='AZURE_REST')throw Error('RECEIPT_MISMATCH');
 files.push({id:r.id,kind:'AZURE_REST',sha256:info.sha256,sampleRate:48000,samples:Math.round(info.durationSeconds*48000),planSha256:plan.planSha256});
}
const observations=JSON.parse(await readFile(join(out,'observations.json'),'utf8'));
const timeline=buildTimeline(plan,files,observations,{gapMs:plan.mode==='split'?plan.profile.splitGapMs:0});
await writeFile(join(out,'timeline.json'),JSON.stringify(timeline,null,2)+'\n');
for(const ext of ['srt','vtt'])await writeFile(join(out,'subtitles.'+ext),subtitles(timeline.pages,ext));
console.log(JSON.stringify({status:'OBSERVED_TIMELINE_READY',durationSeconds:timeline.durationSeconds,voiceSpans:timeline.voiceSpans.length,articleEvents:timeline.events.length,subjectiveQA:timeline.subjectiveQA}));
