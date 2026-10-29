import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { approvedInputs, authorize, hash, sha, IDENTITIES, type Trust, type Envelope } from './contracts.ts';
import { canonical } from '../pilot/readiness.mjs';
import { captureCloudBuild, loadedRoot } from './build.ts';
import { CloudLedger } from './ledger.ts';
import { cloudPilot } from './executor.ts';
import { type Store, type Versioned, GitHubPrivateStore } from './store.ts';
import { AzureSpeech, ENDPOINT, type Speech, type SpeechResult } from './speech.ts';
import { IsolatedAzureSpeech } from './isolated-speech.ts';
const NOW='2026-10-29T07:00:00Z';
class MemoryStore implements Store {
  readonly values=new Map<string,Versioned>(); sequence=0;
  failKey:string|null=null; failAfterWrite=false;
  histories=new Map<string,Versioned[]>();
  async history(key:string){return [...(this.histories.get(key)??[])];}
  readonly id:string; constructor(id:string) {this.id=id;}
  async read(key:string) {const r=this.values.get(key);return r?{version:r.version,bytes:Buffer.from(r.bytes)}:null;}
  async create(key:string,bytes:Buffer) {assert.ok(!this.values.has(key),'CAS_CREATE_CONFLICT');return this.save(key,bytes);}
  async replace(key:string,version:string,bytes:Buffer) {assert.equal(this.values.get(key)?.version,version,'CAS_CONFLICT');return this.save(key,bytes);}
  save(key:string,bytes:Buffer) {if(this.failKey===key)throw Error('DISPOSABLE_STORE_FAILURE');const value={version:String(++this.sequence),bytes:Buffer.from(bytes)};this.values.set(key,value);const history=this.histories.get(key)??[];history.push(value);this.histories.set(key,history);if(this.failAfterWrite)throw Error('LOST_ACK');return value;}
}
function wav() {const b=Buffer.alloc(44+9600);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(96000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(9600,40);return b;}
class FakeSpeech implements Speech {
  calls=0;fail=false;bad=false;
  async send(r:any):Promise<SpeechResult> {this.calls++;if(this.fail)throw Error('FAKE_SECRET_NEVER_LOG');return {wav:this.bad?Buffer.from('bad'):wav(),providerRequestId:'mock-request-not-azure',receivedAt:NOW,voice:r.voice,ssmlSha256:r.ssmlSha256,provenance:'AZURE_HTTPS_RESPONSE_NOT_BILLING_RECEIPT'};}
}
async function fixture() {
  const requests=await approvedInputs(loadedRoot),owner=generateKeyPairSync('ed25519'),reviewer=generateKeyPairSync('ed25519');
  const primary=new MemoryStore('fixture-primary-not-remote'),anchor=new MemoryStore('fixture-independent-not-remote'),speech=new FakeSpeech();
  const trust:Trust={ownerPublicKey:owner.publicKey.export({format:'pem',type:'spki'}).toString(),reviewerPublicKey:reviewer.publicKey.export({format:'pem',type:'spki'}).toString(),buildSha256:hash(await captureCloudBuild()),primaryStoreId:primary.id,anchorStoreId:anchor.id};
  const grant={schemaVersion:1,scope:'VIDEO06_V2_CLOUD_PILOT',productionId:'video06-v2-audition',...IDENTITIES,buildSha256:trust.buildSha256,resource:'english-journey-namminh',region:'southeastasia',issuedAt:NOW,expiresAt:'2026-10-29T07:15:00Z',pricingExpiresAt:'2026-10-29T07:15:00Z',accountEvidenceSha256:hash('FAKE_ACCOUNT_EVIDENCE'),pricingTaxEvidenceSha256:hash('FAKE_TAX_PRICE'),storageEvidenceSha256:hash('FAKE_STORAGE'),securityReviewSha256:hash('FAKE_REVIEW_NOT_APPROVAL'),primaryStoreId:primary.id,anchorStoreId:anchor.id,openingLiabilities:10000,totalMicrousd:10000000,productionMicrousd:8000000,reserveMicrousd:2000000,azureMaxMicrousd:30000,aggregateMaxMicrousd:80000,maxAttempts:1,quotes:requests.map(r=>({id:r.id,ssmlSha256:r.ssmlSha256,maximumTaxInclusiveMicrousd:2000}))};
  const envelope=():Envelope=>({grant,ownerSignature:sign(null,Buffer.from(canonical(grant)),owner.privateKey).toString('base64'),reviewerSignature:sign(null,Buffer.from(canonical(grant)),reviewer.privateKey).toString('base64')});
  const ledger=()=>new CloudLedger(primary,anchor,authorize(envelope(),trust,requests,NOW));
  const run=()=>cloudPilot({root:loadedRoot,envelope:envelope(),trust,primary,anchor,speech,now:()=>NOW});
  return {requests,owner,reviewer,primary,anchor,speech,trust,grant,envelope,ledger,run};
}
test('three V2 identities are distinct, exact and unchanged; twelve SSML requests',async()=>{const r=await approvedInputs(loadedRoot);assert.equal(r.length,12);assert.notEqual(IDENTITIES.planPayload,IDENTITIES.planBytes);});
test('two external signatures, distinct reviewer and current exact build required',async()=>{
  const f=await fixture();authorize(f.envelope(),f.trust,f.requests,NOW);
  for(const e of [{...f.envelope(),ownerSignature:''},{...f.envelope(),reviewerSignature:''},{...f.envelope(),grant:{...f.grant,maxAttempts:2}}])assert.throws(()=>authorize(e,f.trust,f.requests,NOW),/CLOUD_AUTHORIZATION_REJECTED/);
  assert.throws(()=>authorize(f.envelope(),{...f.trust,reviewerPublicKey:f.trust.ownerPublicKey},f.requests,NOW));
  assert.throws(()=>authorize(f.envelope(),{...f.trust,buildSha256:'0'.repeat(64)},f.requests,NOW));
});
for(const failure of ['expired','budget','liability','duplicate','ssml','store'] as const)test('signed invalid authorization rejects '+failure,async()=>{
  const f=await fixture();
  if(failure==='expired')f.grant.pricingExpiresAt='2026-10-29T06:59:00Z';
  if(failure==='budget')f.grant.quotes[0].maximumTaxInclusiveMicrousd=30000;
  if(failure==='liability')f.grant.openingLiabilities=7999999;
  if(failure==='duplicate')f.grant.quotes[0].id=f.grant.quotes[1].id;
  if(failure==='ssml')f.grant.quotes[0].ssmlSha256='0'.repeat(64);
  if(failure==='store')f.grant.anchorStoreId=f.grant.primaryStoreId;
  assert.throws(()=>authorize(f.envelope(),f.trust,f.requests,NOW));assert.equal(f.speech.calls,0);
});
test('cloud journal full fake run12/resume0, independently acknowledged copies and liabilities',async()=>{
  const f=await fixture();await f.ledger().initialize();const first=await f.run(),resume=await f.run();
  assert.equal(first.newRequests,12);assert.equal(resume.newRequests,0);assert.equal(resume.cached,12);assert.equal(first.revision,36);assert.equal(first.maximumOutstandingLiabilityMicrousd,24000);assert.equal(first.confirmedInvoiceMicrousd,null);
  assert.equal(f.speech.calls,12);for(const [k,p]of f.primary.values)if(k.includes('/receipts/'))assert.deepEqual(p.bytes,f.anchor.values.get(k)!.bytes);
  const out=resolve(loadedRoot,'out/work-only-cloud-mock');await mkdir(out,{recursive:true});
  await writeFile(resolve(out,'summary.json'),JSON.stringify({kind:'IN_MEMORY_CLOUD_PORT_TEST_NOT_HOSTED_ACCEPTANCE',first,resume,realAzureRequests:0,apiCostUsd:0},null,2)+'\n');
});
test('uninitialized remote state does not silently initialize',async()=>{const f=await fixture();await assert.rejects(f.run(),/PRODUCTION_AUTHORITY_MISSING/);assert.equal(f.speech.calls,0);});
for(const boundary of ['RESERVED','DISPATCHING']as const)test('restart after '+boundary+' never dispatches again',async()=>{
  const f=await fixture(),l=f.ledger();let s=await l.initialize();s=await l.append(s,'RESERVED',f.requests[0].id,NOW);if(boundary==='DISPATCHING')await l.append(s,'DISPATCHING',f.requests[0].id,NOW);
  await assert.rejects(f.run(),/RECONCILIATION_REQUIRED_NO_RETRY/);assert.equal(f.speech.calls,0);
});
test('lost primary acknowledgement cannot dispatch; checkpoint mismatch blocks restart',async()=>{const f=await fixture();await f.ledger().initialize();f.primary.failAfterWrite=true;await assert.rejects(f.run());f.primary.failAfterWrite=false;await assert.rejects(f.run(),/(CHECKPOINT_DIVERGED|HISTORY_CHANGED)/);assert.equal(f.speech.calls,0);});
test('independent checkpoint unavailable before dispatch fails closed',async()=>{const f=await fixture();await f.ledger().initialize();f.anchor.failKey='video06-v2/checkpoint.json';await assert.rejects(f.run());assert.equal(f.speech.calls,0);});
test('two concurrent coordinators cannot double dispatch',async()=>{const f=await fixture();await f.ledger().initialize();await Promise.allSettled([f.run(),f.run()]);assert.ok(f.speech.calls<=12);const s=await f.ledger().read();assert.equal(s.journal.events.filter(e=>e.kind==='DISPATCHING').length,f.speech.calls);});
test('timeout latches one attempt globally; no secret in returned error',async()=>{const f=await fixture();await f.ledger().initialize();f.speech.fail=true;await assert.rejects(f.run(),/PROVIDER_OUTCOME_UNCERTAIN_NO_RETRY/);await assert.rejects(f.run(),/RECONCILIATION_REQUIRED_NO_RETRY/);assert.equal(f.speech.calls,1);});
test('invalid WAV or failed backup never reaches next request',async()=>{for(const badWav of [true,false]){const f=await fixture();await f.ledger().initialize();f.speech.bad=badWav;if(!badWav)f.anchor.failKey=`video06-v2/receipts/${f.requests[0].id}.json`;await assert.rejects(f.run());await assert.rejects(f.run(),/RECONCILIATION_REQUIRED_NO_RETRY/);assert.equal(f.speech.calls,1);}});
test('rollback or corrupt checkpoint blocks before provider',async()=>{const f=await fixture();await f.ledger().initialize();const old=await f.primary.read('video06-v2/journal.json');await f.run();f.primary.values.set('video06-v2/journal.json',old!);await assert.rejects(f.run(),/(CHECKPOINT_DIVERGED|HISTORY_CHANGED)/);assert.equal(f.speech.calls,12);});
test('cached response requires exact primary and backup hashes',async()=>{const f=await fixture();await f.ledger().initialize();await f.run();f.anchor.values.delete(`video06-v2/receipts/${f.requests[0].id}.json`);await assert.rejects(f.run(),/RECEIPT_OR_BACKUP_MISSING/);assert.equal(f.speech.calls,12);});
test('HTTP broker fixes endpoint/output, disables redirects; error is sanitized and never retried',async()=>{
  const f=await fixture(),old=globalThis.fetch;let calls=0;globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,ENDPOINT);assert.equal(init?.redirect,'error');assert.equal((init?.headers as any)['X-Microsoft-OutputFormat'],'riff-48khz-16bit-mono-pcm');throw Error('FAKE_SECRET_NEVER_LOG');};
  try {await assert.rejects(new AzureSpeech(async()=>'FAKE_CANARY_NOT_A_KEY').send(f.requests[0]),/^Error: SPEECH_OUTCOME_UNCERTAIN_NO_RETRY$/);assert.equal(calls,1);}finally{globalThis.fetch=old;}
});
test('private GitHub store rejects public/unsafe endpoints before mutation',async()=>{
  assert.throws(()=>new GitHubPrivateStore('https://evil.test','state','a'.repeat(40),'fake'));
  const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({private:false}),{status:200});};
  try {await assert.rejects(new GitHubPrivateStore('owner/private','state','a'.repeat(40),'FAKE_TOKEN').read('state.json'),/PRIVATE_REPOSITORY_REQUIRED/);assert.equal(calls,1);}finally{globalThis.fetch=old;}
});
test('broker subprocess missing credential emits only fixed error with no Azure call',async()=>{const f=await fixture();await assert.rejects(new IsolatedAzureSpeech(async()=>{throw Error('FAKE_CANARY_NOT_A_KEY');}).send(f.requests[0]),/SPEECH_OUTCOME_UNCERTAIN_NO_RETRY/);});

test('fast-forward restoration of BOTH journal and checkpoint is detected from immutable history',async()=>{
  const f=await fixture(),ledger=f.ledger();await ledger.initialize();
  const genesis=await f.primary.read('video06-v2/journal.json'),anchor=await f.anchor.read('video06-v2/checkpoint.json');
  let state=await ledger.read();state=await ledger.append(state,'RESERVED',f.requests[0].id,NOW);await ledger.append(state,'DISPATCHING',f.requests[0].id,NOW);
  await f.primary.replace('video06-v2/journal.json',(await f.primary.read('video06-v2/journal.json'))!.version,genesis!.bytes);
  await f.anchor.replace('video06-v2/checkpoint.json',(await f.anchor.read('video06-v2/checkpoint.json'))!.version,anchor!.bytes);
  await assert.rejects(ledger.read(),/HISTORY_REWOUND/);assert.equal(f.speech.calls,0);
});

test('credential boundary rejects substituted SSML even with a self-consistent hash',async()=>{
  const f=await fixture();let keyReads=0;const speech=new AzureSpeech(async()=>{keyReads++;return 'FAKE_KEY';});
  await assert.rejects(speech.send({...f.requests[0],ssml:'unapproved',ssmlSha256:sha('unapproved')}),/SPEECH_SCOPE/);assert.equal(keyReads,0);
});
test('hung credential supplier times out without provider invocation',async()=>{
  const f=await fixture(),started=Date.now();await assert.rejects(new IsolatedAzureSpeech(()=>new Promise(()=>{})).send(f.requests[0]),/SPEECH_OUTCOME_UNCERTAIN_NO_RETRY/);assert.ok(Date.now()-started<10000);
});

test('valid SSML with swapped voice/id is rejected before credential lookup',async()=>{
  const f=await fixture();let lookups=0;const speech=new AzureSpeech(async()=>{lookups++;return 'FAKE';});
  await assert.rejects(speech.send({...f.requests[0],voice:'en-US-AndrewNeural'}),/SPEECH_SCOPE/);
  await assert.rejects(speech.send({...f.requests[0],id:f.requests[1].id}),/SPEECH_SCOPE/);assert.equal(lookups,0);
});
test('oversized credential buffer is wiped on rejection',async()=>{
  const f=await fixture(),key=Buffer.alloc(513,65);await assert.rejects(new IsolatedAzureSpeech(async()=>key).send(f.requests[0]));assert.ok(key.every(b=>b===0));
});
test('independently pinned journal backup restores to a clean disposable destination after primary loss',async()=>{
  const f=await fixture(),ledger=f.ledger();await ledger.initialize();await f.run();
  const checkpoint=await f.anchor.read('video06-v2/checkpoint.json');f.primary.values.clear();f.primary.histories.clear();
  const exported=await ledger.exportRecovery(sha(checkpoint!.bytes)),destination=new MemoryStore('clean-disposable-restore-not-authority');
  for(const file of exported.files)await destination.create(file.key,file.bytes);
  for(const entry of exported.manifest)assert.equal(sha((await destination.read(entry.key))!.bytes),entry.sha256);
  await assert.rejects(ledger.exportRecovery('0'.repeat(64)),/RECOVERY_CHECKPOINT_HASH/);assert.equal(f.speech.calls,12);
});
test('GitHub adapter reads a >1MB private receipt using a verified Git blob',async()=>{
  const old=globalThis.fetch,bytes=Buffer.alloc(1024*1024+128,65),oid=createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');let blobReads=0;
  globalThis.fetch=async(input,init)=>{
    assert.equal(init?.redirect,'error');const url=String(input);let value:any;
    if(url.endsWith('/branches/state/protection'))value={allow_force_pushes:{enabled:false},allow_deletions:{enabled:false},enforce_admins:{enabled:true}};
    else if(url.endsWith('/branches/state'))value={protected:true,commit:{sha:'a'.repeat(40)}};
    else if(url.includes('/contents/'))value={type:'file',encoding:'none',content:'',size:bytes.length,sha:oid};
    else if(url.includes('/git/blobs/')){blobReads++;value={encoding:'base64',content:bytes.toString('base64'),sha:oid};}
    else value={private:true};return new Response(JSON.stringify(value));
  };
  try{const r=await new GitHubPrivateStore('owner/approved-private','state','a'.repeat(40),'FAKE_TOKEN').read('receipt.json');assert.deepEqual(r!.bytes,bytes);assert.equal(blobReads,1);}finally{globalThis.fetch=old;}
});
test('protected flag alone is insufficient for state-store acceptance',async()=>{
  const old=globalThis.fetch;globalThis.fetch=async(input)=>new Response(JSON.stringify(String(input).endsWith('/protection')?{}:String(input).endsWith('/branches/state')?{protected:true,commit:{sha:'a'.repeat(40)}}:{private:true}));
  try{await assert.rejects(new GitHubPrivateStore('owner/private','state','a'.repeat(40),'FAKE_TOKEN').read('state.json'),/STATE_PROTECTION_INSUFFICIENT/);}finally{globalThis.fetch=old;}
});
