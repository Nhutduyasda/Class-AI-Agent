import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validatePlan} from '../bilingual/core.mjs';
import {validateBriefSource} from '../bilingual/runner.mjs';
export async function preflight(root=process.cwd()) {
 const plan=JSON.parse(await readFile(resolve(root,'docs/reviews/marketing05/ssml-plan.json'),'utf8'));
 validatePlan(plan);await validateBriefSource(root,plan);
 if(plan.productionId!=='marketing-video-05'||plan.mode!=='multivoice'||plan.requestCount!==6||plan.warnings.length||plan.estimatedUsd>0.05||plan.pricing.usdPerMillion!==15)throw Error('VIDEO05_PLAN_REQUIRES_REVIEW');
 if(plan.pricing.verified!==true||Date.now()-Date.parse(plan.pricing.checkedAt)>7*86400000||Date.parse(plan.pricing.checkedAt)>Date.now()+60000)throw Error('PRICE_EVIDENCE_EXPIRED_STOP');
 if(plan.requests.map(r=>r.id).join(',')!=='hook,problem,solution,demo,benefit,cta')throw Error('SCENE_ORDER');
 return {status:'READY_FOR_PRIVATE_COST_CONFIRMATION_NO_TTS',planSha256:plan.planSha256,estimatedUsd:plan.estimatedUsd,limitUsd:0.05,confirmation:'APPROVE-VIDEO05-USD0.05',priceCheckedAt:plan.pricing.checkedAt,rows:plan.requests.map(r=>({scene:r.id,characters:r.billableCharacters,usd:r.estimatedUsd})),policy:{scope:'BILINGUAL_V1',productionId:plan.productionId,planSha256:plan.planSha256,liveSynthesisAllowed:false,limitUsd:0.05,maxRequests:6,requestIds:plan.requests.map(r=>r.id),maxAttemptsPerRequest:1,mode:'multivoice',priceUsdPerMillion:15}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)preflight(process.argv[2]).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
