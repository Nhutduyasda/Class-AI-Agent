import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {plan,ids} from './voice-runner.mjs';
import {executeOne,inspectWave,sha256} from './direct-audio.mjs';
test('immutable approved script, six scenes and authorized single attempts',async()=>{
 const a=await plan(process.cwd());assert.equal(a.characters,1031);assert.ok(a.estimatedUsd<.05);assert.equal(a.p.briefSha256,'aac903c2df5f5d99f0902930a96e2bf6bb2afb701a7136d0f6e00117ba2bde23');assert.deepEqual(a.brief.spokenSegments.map(s=>s.id),ids);assert.deepEqual(Object.values(a.p.maxAttempts),[1,1,1,1,1,1]);
});
test('ambiguous transport consumes attempt and blocks second request',async()=>{
 await mkdir('.cache',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.cache/ej04-test-')),a=await plan(process.cwd()),ledgerFile=join(dir,'ledger.json');
 const ledger={briefSha256:a.briefSha256,calls:a.brief.spokenSegments.map(s=>({id:s.id,text:s.spoken,characters:Array.from(s.spoken).length,attempts:0,estimatedUsd:Array.from(s.spoken).length*15/1e6}))};await writeFile(ledgerFile,JSON.stringify(ledger));let calls=0;
 const config={id:'hook',ledgerFile,briefFile:a.briefFile,authorization:a.p,destination:join(dir,'hook.wav'),credentialsReady:true,transport:async()=>{calls++;throw Error('SIMULATED_AMBIGUOUS_FAILURE');}};
 await assert.rejects(executeOne(config));await assert.rejects(executeOne(config));assert.equal(calls,1);const final=JSON.parse(await readFile(ledgerFile));assert.equal(final.calls[0].attempts,1);assert.equal(final.calls[0].status,'FAILED_OR_AMBIGUOUS_NO_RETRY');
});
test('all six real Azure receipts match WAV and copy',async()=>{
 const a=await plan(process.cwd()),ledger=JSON.parse(await readFile('out/marketing04/ledger.json'));
 assert.equal(ledger.synthesisRequestsSubmitted,6);
 for(const id of ids){const f='out/marketing04/raw/'+id+'.wav',b=await readFile(f),info=inspectWave(b),r=JSON.parse(await readFile(f+'.receipt.json')),s=a.brief.spokenSegments.find(s=>s.id===id);assert.equal(r.provenance.kind,'AZURE_REST');assert.equal(r.sha256,info.sha256);assert.equal(r.provenance.textSha256,sha256(Buffer.from(s.spoken)));assert.equal(ledger.calls.find(c=>c.id===id).attempts,1);}
});
