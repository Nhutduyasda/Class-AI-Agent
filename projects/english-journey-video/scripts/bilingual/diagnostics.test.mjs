import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir} from 'node:fs/promises';import path from 'node:path';
import {postOnce,runPlan} from './runner.mjs';import {PipelineFailure,safeFailure} from './diagnostics.mjs';
import {makePlan,digest} from './core.mjs';import {saveVerifiedWave,verifyWave} from './wave.mjs';
const env={SPEECH_KEY:'OFFLINE_SECRET_NEVER_LOG'},rid='11111111-2222-3333-4444-555555555555';
test('HTTP rejection records only status/request id; never reads body and never retries',async()=>{
 let calls=0,cancelled=0,read=0;
 await assert.rejects(postOnce('fixture',env,async()=>{calls++;return {ok:false,status:429,headers:new Headers({'x-requestid':rid}),body:{cancel:async()=>{cancelled++;}},text:async()=>{read++;return env.SPEECH_KEY;}};}),e=>{
  assert.deepEqual(safeFailure(e),{stage:'HTTP_STATUS',errorType:'Error',httpStatus:429,requestId:rid});assert.ok(!JSON.stringify(e).includes(env.SPEECH_KEY));return true;
 });assert.equal(calls,1);assert.equal(cancelled,1);assert.equal(read,0);
});
test('timeout and stream failure retain safe stages without raw errors or retry',async()=>{
 let calls=0;await assert.rejects(postOnce('fixture',env,async()=>{calls++;throw Object.assign(new Error(env.SPEECH_KEY),{name:'TimeoutError'});}),e=>safeFailure(e).stage==='HTTP_SEND');assert.equal(calls,1);
 await assert.rejects(postOnce('fixture',env,async()=>({ok:true,status:200,headers:new Headers({'x-requestid':rid}),body:(async function*(){yield Buffer.from('x');throw Object.assign(new Error(env.SPEECH_KEY),{code:'ECONNRESET'});})()})),e=>{assert.equal(e.diagnostic.stage,'HTTP_STREAM');assert.equal(e.diagnostic.code,'ECONNRESET');assert.equal(e.diagnostic.httpStatus,200);assert.ok(!JSON.stringify(e).includes(env.SPEECH_KEY));return true;});
});
test('arbitrary error fields and request IDs cannot inject secrets into diagnostics',()=>{
 const e=Object.assign(new Error(env.SPEECH_KEY),{code:env.SPEECH_KEY,headers:{key:env.SPEECH_KEY},stack:env.SPEECH_KEY});
 const d=safeFailure(new PipelineFailure('NOT_ALLOWED',e,{httpStatus:999,requestId:env.SPEECH_KEY}));assert.deepEqual(d,{stage:'UNKNOWN',errorType:'Error'});assert.ok(!JSON.stringify(d).includes(env.SPEECH_KEY));
});
test('local malformed WAV failure consumes one attempt, records stage and blocks all reruns',async()=>{
 const profile=JSON.parse(await readFile('config/bilingual-voice.json')),pricing=JSON.parse(await readFile('config/bilingual-neural-price.json'));
 const brief={id:'diagnostics-fixture',approved:true,spokenSegments:[{id:'first',spoken:'I saw a cat.'},{id:'second',spoken:'I saw a cat.'}]};const plan=makePlan(brief,Buffer.from(JSON.stringify(brief)),profile,pricing);
 const authorization={scope:'BILINGUAL_V1',liveSynthesisAllowed:true,approvalId:'OFFLINE_ONLY',productionId:plan.productionId,planSha256:plan.planSha256,expiresAt:new Date(Date.now()+3600000).toISOString(),limitUsd:.02,maxRequests:2,requestIds:['first','second'],maxAttemptsPerRequest:1,mode:'multivoice',priceUsdPerMillion:15};
 await mkdir('.cache/diagnostics-tests',{recursive:true});const root=await mkdtemp(path.resolve('.cache/diagnostics-tests/case-'));let calls=0;
 const cfg={projectRoot:root,plan,authorization,offline:true,transport:async()=>{calls++;const b=Buffer.from(env.SPEECH_KEY);Object.defineProperty(b,'responseDiagnostic',{value:{httpStatus:200,requestId:rid}});return b;}};
 await assert.rejects(runPlan(cfg));await assert.rejects(runPlan(cfg));assert.equal(calls,1);
 const ledger=JSON.parse(await readFile(path.join(root,'out/bilingual/diagnostics-fixture/ledger.json')));assert.equal(ledger.calls[0].failure.stage,'WAV_STRUCTURE');assert.equal(ledger.calls[0].failure.httpStatus,200);assert.equal(ledger.calls[0].failure.requestId,rid);assert.equal(ledger.calls[1].attempts,0);assert.ok(!JSON.stringify(ledger).includes(env.SPEECH_KEY));
});
test('valid WAV with destination collision records filesystem stage and preserves existing file',async()=>{
 await mkdir('.cache/diagnostics-tests',{recursive:true});const root=await mkdtemp(path.resolve('.cache/diagnostics-tests/collision-'));
 const bytes=Buffer.alloc(44+96000);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(48000,24);bytes.writeUInt32LE(96000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(96000,40);
 const {writeFile}=await import('node:fs/promises');const dest=path.join(root,'hook.wav');await writeFile(dest,'PRESERVE');
 await assert.rejects(saveVerifiedWave(bytes,dest,{kind:'OFFLINE_FIXTURE_ONLY'}),e=>e.diagnostic.stage==='FILE_COMMIT'&&e.diagnostic.code==='EEXIST');assert.equal(await readFile(dest,'utf8'),'PRESERVE');
});
function longWave(seconds){
 const b=Buffer.alloc(44+seconds*96000);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(96000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(seconds*96000,40);return b;
}
test('15/30/90-second offline WAV fixtures fully drain Windows ffprobe stdin',()=>{
 for(const seconds of [15,30,90]){const b=longWave(seconds),v=verifyWave(b);assert.equal(v.durationSeconds,seconds);assert.equal(v.sha256,digest(b));}
});
test('failed local audio validation retains quarantined bytes and provenance; never a production WAV',async()=>{
 const {readdir}=await import('node:fs/promises');await mkdir('.cache/diagnostics-tests',{recursive:true});const root=await mkdtemp(path.resolve('.cache/diagnostics-tests/quarantine-'));
 const bytes=longWave(15);bytes.writeUInt32LE(24000,24);const provenance={kind:'OFFLINE_FIXTURE_ONLY',ssmlSha256:'a'.repeat(64),textSha256:'b'.repeat(64)};
 await assert.rejects(saveVerifiedWave(bytes,path.join(root,'bad.wav'),provenance),e=>e.diagnostic.stage==='WAV_STRUCTURE');
 const files=await readdir(root);assert.ok(!files.includes('bad.wav'));const pending=files.find(x=>x.includes('.pending-')&&!x.endsWith('.json'));assert.equal(digest(await readFile(path.join(root,pending))),digest(bytes));
 const evidence=JSON.parse(await readFile(path.join(root,pending+'.provenance.json')));assert.equal(evidence.sha256,digest(bytes));assert.deepEqual(evidence.provenance,provenance);
});
