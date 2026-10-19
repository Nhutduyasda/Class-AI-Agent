import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';
import {validateAuthorization} from '../bilingual/runner.mjs';import {digest,validatePlan} from '../bilingual/core.mjs';
const load=async p=>JSON.parse(await readFile(p));
const old=await load('docs/reviews/marketing05/ssml-plan.json'),plan=await load('docs/reviews/marketing05/recovery-02/ssml-plan.json'),r=await load('docs/reviews/marketing05/recovery-02/recovery-plan.json');
test('recovery02 excludes HOOK and preserves exact original SSML for five scenes',()=>{
 validatePlan(plan);assert.equal(plan.requestCount,5);assert.equal(plan.estimatedUsd,.016515);assert.ok(!plan.requests.some(x=>x.id==='hook'));
 for(const x of plan.requests)assert.equal(x.ssmlSha256,old.requests.find(y=>y.id===x.id).ssmlSha256);
});
test('recovery02 never treats either previous authorization as new permission',async()=>{
 for(const f of ['docs/reviews/marketing05/authorization.json','docs/reviews/marketing05/recovery-01/authorization.json']){
  const p=await load(f);assert.throws(()=>validateAuthorization(plan,p,null,{offline:true}));
 }
 const pending={scope:'BILINGUAL_V1',productionId:plan.productionId,planSha256:plan.planSha256,liveSynthesisAllowed:false};assert.throws(()=>validateAuthorization(plan,pending,null,{offline:true}));
});
test('recovery02 requires explicit extra PROBLEM permission even with a scoped cost policy',()=>{
 const p={scope:'BILINGUAL_V1',productionId:plan.productionId,planSha256:plan.planSha256,liveSynthesisAllowed:true,approvalId:'OFFLINE_VALIDATION_ONLY',expiresAt:new Date(Date.now()+3600000).toISOString(),limitUsd:.02,maxRequests:5,requestIds:r.requestIds,maxAttemptsPerRequest:1,mode:'multivoice',priceUsdPerMillion:15,recoveryOf:r.oldPlanSha256,historicalLedgerSha256:r.oldLedgerSha256};
 assert.throws(()=>validateAuthorization(plan,p,null,{offline:true}),/EXPLICIT_PROBLEM/);
 assert.doesNotThrow(()=>validateAuthorization(plan,{...p,additionalProblemAttemptExplicitlyApproved:true},null,{offline:true}));
});
test('historical snapshots preserve outcomes; local runtime ledgers retain frozen byte hashes',async()=>{
 const oldSnapshot=await load('docs/reviews/marketing05/ledger.json'),firstSnapshot=await load('docs/reviews/marketing05/recovery-01/ledger.json');
 assert.equal(oldSnapshot.requestsSubmitted,2);assert.equal(firstSnapshot.requestsSubmitted,1);assert.equal(oldSnapshot.calls[1].status,'FAILED_OR_AMBIGUOUS_NO_RETRY');assert.equal(firstSnapshot.calls[0].failure.stage,'WAV_PROBE');
 for(const [file,h]of [['out/bilingual/marketing-video-05/ledger.json',r.oldLedgerSha256],['out/bilingual/marketing-video-05-recovery-01/ledger.json',r.previousRecoveryLedgerSha256]]){
  try{await access(file);}catch(e){if(e.code==='ENOENT')continue;throw e;}assert.equal(digest(await readFile(file)),h);
 }
});
