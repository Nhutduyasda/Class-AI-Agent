import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {localTestWave} from './local-fixture.mjs';
import {inspectWave,saveVerifiedWave,executeOne,sha256,credentialReadiness,ssml,initializeRuntimeLedger,postAzureOnce,ENDPOINT,FORMAT} from './direct-audio.mjs';

const wave=localTestWave();
const baseline=await readFile('docs/reviews/marketing03/azure-ledger.json');
async function context(t){
 const dir=await mkdtemp(join(tmpdir(),'video03-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const ledgerFile=join(dir,'ledger.json'),briefFile=join(dir,'brief.json');
 await writeFile(ledgerFile,baseline);const bytes=await readFile('briefs/marketing-video-03-approved.json');await writeFile(briefFile,bytes);
 const authorization={liveSynthesisAllowed:true,approvalId:'LOCAL_TEST_NOT_OWNER_APPROVAL',expiresAt:new Date(Date.now()+60000).toISOString(),briefSha256:sha256(bytes),maxAttempts:{hook:1,problem:1},limitUsd:.05};
 return {dir,ledgerFile,briefFile,authorization,destination:join(dir,'problem.wav'),id:'problem',credentialsReady:true};
}
test('canonical 48k mono PCM file reports measured size, duration and SHA',()=>{
 const r=inspectWave(wave);assert.equal(r.durationSeconds,2);assert.equal(r.bytes,192044);assert.equal(r.sha256,sha256(wave));
});
test('RIFF parser handles odd-length metadata chunks before fmt',()=>{
 const chunk=Buffer.alloc(12);chunk.write('JUNK');chunk.writeUInt32LE(3,4);chunk.write('abc',8);
 const b=Buffer.concat([wave.subarray(0,12),chunk,wave.subarray(12)]);b.writeUInt32LE(b.length-8,4);assert.equal(inspectWave(b).durationSeconds,2);
});
test('reject HTML/error text, truncated binary and wrong PCM format',()=>{
 for(const b of [Buffer.from('<html>Error</html>'),wave.subarray(0,-2)])assert.throws(()=>inspectWave(b));
 for(const [at,value] of [[20,3],[22,2],[34,8]]){const b=Buffer.from(wave);b.writeUInt16LE(value,at);assert.throws(()=>inspectWave(b));}
 const b=Buffer.from(wave);b.writeUInt32LE(24000,24);assert.throws(()=>inspectWave(b));
});
test('atomic receiver decodes and reads back real WAV; refuses overwrite',async t=>{
 const c=await context(t);const r=await saveVerifiedWave(wave,c.destination,{kind:'LOCAL_TEST_ONLY'});
 assert.equal(r.fullDecode,'PASS');assert.equal(r.sha256,sha256(await readFile(c.destination)));
 await assert.rejects(saveVerifiedWave(wave,c.destination,{kind:'LOCAL_TEST_ONLY'}));assert.equal(sha256(await readFile(c.destination)),r.sha256);
});
test('malformed response never publishes final WAV or receipt',async t=>{
 const c=await context(t);await assert.rejects(saveVerifiedWave(Buffer.from('bad'),c.destination,{kind:'LOCAL_TEST_ONLY'}));
 await assert.rejects(readFile(c.destination));await assert.rejects(readFile(c.destination+'.receipt.json'));
});
test('default-deny authorization and missing secret prevent transport calls',async t=>{
 const c=await context(t);let calls=0;const transport=async()=>{calls++;return wave;};
 await assert.rejects(executeOne({...c,transport,authorization:{liveSynthesisAllowed:false}}),/NO_CURRENT/);
 await assert.rejects(executeOne({...c,transport,credentialsReady:false}),/credential/);assert.equal(calls,0);
});
test('existing HOOK attempt remains blocked under original one-call limit',async t=>{
 const c=await context(t);let calls=0;
 await assert.rejects(executeOne({...c,id:'hook',transport:async()=>{calls++;return wave;}}),/ATTEMPT_LIMIT/);
 assert.equal(calls,0);assert.equal(JSON.parse(await readFile(c.ledgerFile)).calls[0].attempts,1);
});
test('budget and script-hash guards run before any transport',async t=>{
 const c=await context(t);let calls=0;const transport=async()=>{calls++;return wave;};
 await assert.rejects(executeOne({...c,transport,authorization:{...c.authorization,limitUsd:.0001}}),/Budget/);
 await assert.rejects(executeOne({...c,transport,authorization:{...c.authorization,briefSha256:'bad'}}),/hash/);assert.equal(calls,0);
});
test('non-finite ledger costs and missing historical scenes cannot bypass budget',async t=>{
 const c=await context(t);let calls=0;const transport=async()=>{calls++;return wave;};
 const invalid=JSON.parse(baseline);invalid.calls[1].estimatedUsd=null;await writeFile(c.ledgerFile,JSON.stringify(invalid));
 await assert.rejects(executeOne({...c,transport}),/cost/);
 invalid.calls.shift();await writeFile(c.ledgerFile,JSON.stringify(invalid));await assert.rejects(executeOne({...c,transport}),/Incomplete/);assert.equal(calls,0);
});
test('REST wire contract uses fixed region, exact SSML and 48k PCM; mocked fetch only',async t=>{
 let calls=0;const body=ssml('Kiểm tra.');
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  calls++;assert.equal(url,ENDPOINT);assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.equal(options.body,body);assert.equal(options.headers['X-Microsoft-OutputFormat'],FORMAT);assert.equal(options.headers['Content-Type'],'application/ssml+xml');assert.equal(options.headers['Ocp-Apim-Subscription-Key'],'LOCAL_TEST_KEY');return new Response(wave,{status:200});
 });
 assert.deepEqual(await postAzureOnce(body,{SPEECH_KEY:'LOCAL_TEST_KEY'}),wave);assert.equal(calls,1);
});
test('REST 429 response causes one mocked fetch, without retry or response-body disclosure',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('PRIVATE_RESPONSE_NOT_TO_LOG',{status:429});});
 await assert.rejects(postAzureOnce(ssml('Test.'),{SPEECH_KEY:'LOCAL_TEST_KEY'}),e=>e.message==='Azure HTTP 429; no retry');assert.equal(calls,1);
});
test('one failed transport persists attempt and is never retried',async t=>{
 const c=await context(t);let calls=0;const transport=async()=>{calls++;throw Error('mock timeout');};
 await assert.rejects(executeOne({...c,transport}),/ambiguous/);
 const l=JSON.parse(await readFile(c.ledgerFile));assert.equal(l.calls[1].attempts,1);assert.equal(l.calls[1].status,'FAILED_OR_AMBIGUOUS_NO_RETRY');assert.equal(l.calls[0].attempts,1);
 await assert.rejects(executeOne({...c,transport}),/ATTEMPT_LIMIT/);assert.equal(calls,1);
});
test('bad WAV consumes the submitted attempt without marking audio received',async t=>{
 const c=await context(t);await assert.rejects(executeOne({...c,transport:async()=>Buffer.from('HTTP 200 but not audio')}));
 const call=JSON.parse(await readFile(c.ledgerFile)).calls[1];assert.equal(call.attempts,1);assert.notEqual(call.audioVerified,true);await assert.rejects(readFile(c.destination));
});
test('successful mock saves and verifies before marking ledger, preserving HOOK history',async t=>{
 const c=await context(t);const before=JSON.parse(baseline).calls[0];let calls=0;
 const r=await executeOne({...c,transport:async body=>{calls++;assert.equal(body,ssml(JSON.parse(baseline).calls[1].text));return wave;}});
 const l=JSON.parse(await readFile(c.ledgerFile));assert.deepEqual(l.calls[0],before);assert.equal(l.calls[1].status,'AUDIO_SAVED_VERIFIED');assert.equal(l.calls[1].sha256,r.sha256);assert.equal(calls,1);assert.equal(r.provenance.kind,'LOCAL_MOCK_ONLY');
});
test('pre-existing output or reservation prevents submission and remains untouched',async t=>{
 const c=await context(t);let calls=0;const transport=async()=>{calls++;return wave;};await writeFile(c.destination+'.reservation','existing');
 await assert.rejects(executeOne({...c,transport}));assert.equal(await readFile(c.destination+'.reservation','utf8'),'existing');assert.equal(calls,0);
});
test('credential status reveals presence only, never secret values',()=>{
 const r=credentialReadiness({SPEECH_KEY:'TEST_NOT_REAL',SPEECH_BEARER_TOKEN:'TEST_NOT_REAL'});assert.equal(r.ready,true);assert.ok(!JSON.stringify(r).includes('TEST_NOT_REAL'));
});
test('runtime initialization preserves existing attempts instead of replacing with checkpoint',async t=>{
 const c=await context(t);const changed=JSON.parse(baseline);changed.calls[0].attempts=2;await writeFile(c.ledgerFile,JSON.stringify(changed));
 const r=await initializeRuntimeLedger('docs/reviews/marketing03/azure-ledger.json',c.ledgerFile);
 assert.equal(r.status,'EXISTING_LEDGER_PRESERVED');assert.equal(JSON.parse(await readFile(c.ledgerFile)).calls[0].attempts,2);
});
test('Python recovery importer rejects corrupt WAV before touching destination or ledger',async t=>{
 const c=await context(t);const root=join(c.dir,'out/marketing03');await mkdir(root,{recursive:true});await writeFile(join(root,'ledger.json'),baseline);
 const bad=join(c.dir,'bad.wav');await writeFile(bad,'not audio');
 const script=join(process.cwd(),'scripts/marketing03/ledger.py');
 assert.throws(()=>execFileSync('python3',[script,'import','hook',bad],{cwd:c.dir,stdio:'pipe'}));
 assert.deepEqual(await readFile(join(root,'ledger.json')),baseline);await assert.rejects(readFile(join(root,'raw/hook.wav')));
});
test('Python local fixture import preserves attempts and requires separate source proof',async t=>{
 const c=await context(t);const root=join(c.dir,'out/marketing03');await mkdir(root,{recursive:true});await writeFile(join(root,'ledger.json'),baseline);
 const fixture=join(c.dir,'LOCAL-TEST.wav');await writeFile(fixture,wave);const script=join(process.cwd(),'scripts/marketing03/ledger.py');
 execFileSync('python3',[script,'import','hook',fixture],{cwd:c.dir,stdio:'pipe'});
 const l=JSON.parse(await readFile(join(root,'ledger.json')));assert.equal(l.calls[0].attempts,1);assert.equal(l.calls[0].audioVerified,false);assert.equal(l.calls[0].technicalAudioVerified,true);assert.equal(l.calls[0].status,'WAV_DECODED_PROVENANCE_PENDING');
});
test('canonical ledger in repository remains byte identical throughout offline tests',async()=>assert.deepEqual(await readFile('docs/reviews/marketing03/azure-ledger.json'),baseline));
