import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {preflight} from './preflight.mjs';
import {validateAuthorization} from '../bilingual/runner.mjs';
import {editorialMarkers} from './editorial.mjs';
const brief=JSON.parse(await readFile('briefs/marketing-video-05-approved.json','utf8'));
const plan=JSON.parse(await readFile('docs/reviews/marketing05/ssml-plan.json','utf8'));
test('approved paragraphs normalize only whitespace; all six scenes retain exact copy',()=>{
 assert.equal(brief.spokenSegments.map(s=>s.id).join(','),'hook,problem,solution,demo,benefit,cta');
 for(const s of brief.spokenSegments){assert.equal(s.approvedText.replace(/\s+/gu,' '),s.spoken);assert.equal(plan.scenes.find(p=>p.id===s.id).spans.map(x=>x.text).join(''),s.spoken);}
 assert.equal(plan.textCodepoints,1151);assert.equal(plan.billableCharacters,1151);
});
test('all English examples and terms explicitly route Andrew; entity metadata routes Nam Minh',()=>{
 for(const s of brief.spokenSegments)for(const span of s.voiceProduction.spans){
  assert.equal(s.spoken.slice(span.start,span.end),span.text);
  assert.equal(span.language,['AI','ChatGPT','Nghe','Thay','suy'].includes(span.text)?'vi-VN':'en-US');
 }
 assert.equal(plan.warnings.length,0);
 assert.match(brief.spokenSegments[0].spoken,/I am agree/);
 assert.match(brief.spokenSegments[1].spoken,/I am agree/);
});
test('cost review never grants live approval and cannot pass synthesis authorization',async()=>{
 const review=await preflight();assert.equal(review.limitUsd,.05);assert.equal(review.estimatedUsd,.017265);
 assert.equal(review.policy.liveSynthesisAllowed,false);assert.equal(review.policy.maxRequests,6);
 assert.throws(()=>validateAuthorization(plan,review.policy,null,{offline:true}),/AUTHORIZATION/);
});
test('DEMO markers fail closed without observed audio tokens',()=>{
 assert.throws(()=>editorialMarkers(plan,{tokens:[]}),/OBSERVED_DEMO_CUE_REQUIRED/);
});
