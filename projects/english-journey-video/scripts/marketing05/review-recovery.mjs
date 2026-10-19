import {readFile,access} from 'node:fs/promises';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {digest,validatePlan} from '../bilingual/core.mjs';import {validateBriefSource} from '../bilingual/runner.mjs';import {verifyWave} from '../bilingual/wave.mjs';
export async function reviewRecovery(root=process.cwd(),number='01'){
 if(!['01','02'].includes(number))throw Error('UNKNOWN_RECOVERY');
 const load=async p=>readFile(resolve(root,p)),dir='docs/reviews/marketing05/recovery-'+number;
 const r=JSON.parse(await load(dir+'/recovery-plan.json')),plan=JSON.parse(await load(dir+'/ssml-plan.json'));validatePlan(plan);await validateBriefSource(root,plan);
 const bindings=[['docs/reviews/marketing05/ssml-plan.json',r.oldPlanFileSha256],['out/bilingual/marketing-video-05/ledger.json',r.oldLedgerSha256],['out/bilingual/marketing-video-05/authorization.json',r.oldAuthorizationSha256],['briefs/marketing-video-05-approved.json',r.canonicalBriefSha256],['out/bilingual/marketing-video-05/hook.wav',r.hookSha256],['out/bilingual/marketing-video-05/hook.wav.receipt.json',r.hookReceiptSha256]];
 for(const [p,h]of bindings)if(digest(await load(p))!==h)throw Error('ANCESTOR_OR_HOOK_CHANGED_STOP');
 verifyWave(await load('out/bilingual/marketing-video-05/hook.wav'));
 const old=JSON.parse(await load('docs/reviews/marketing05/ssml-plan.json'));
 if(number==='02')for(const [p,h] of [['out/bilingual/marketing-video-05-recovery-01/ledger.json',r.previousRecoveryLedgerSha256],['out/bilingual/marketing-video-05-recovery-01/authorization.json',r.previousRecoveryAuthorizationSha256]])if(digest(await load(p))!==h)throw Error('PREVIOUS_RECOVERY_CHANGED');
 if(plan.planSha256!==r.newPlanSha256||plan.productionId!=='marketing-video-05-recovery-'+number||plan.requestCount!==5||plan.requests.map(x=>x.id).join(',')!=='problem,solution,demo,benefit,cta'||plan.mode!=='multivoice'||plan.warnings.length||plan.estimatedUsd!==r.newEstimatedUsd||plan.estimatedUsd>.02||plan.pricing.usdPerMillion!==15||r.newLimitUsd!==.02)throw Error('RECOVERY_SCOPE_CHANGED');
 for(const req of plan.requests)if(req.ssmlSha256!==old.requests.find(x=>x.id===req.id)?.ssmlSha256)throw Error('SSML_CHANGED');
 if(!plan.pricing.verified||!Number.isFinite(Date.parse(plan.pricing.checkedAt))||Date.now()-Date.parse(plan.pricing.checkedAt)>7*86400000||Date.parse(plan.pricing.checkedAt)>Date.now()+60000)throw Error('PRICE_EXPIRED_STOP');
 // A previously started recovery must be investigated, never launched again.
 try{await access(resolve(root,'out/bilingual/marketing-video-05-recovery-'+number+'/ledger.json'));throw Error('RECOVERY_ALREADY_STARTED_STOP');}catch(e){if(e.code!=='ENOENT')throw e;}
 return {...r,rows:plan.requests.map(x=>({scene:x.id,characters:x.billableCharacters,usd:x.estimatedUsd})),policy:{scope:'BILINGUAL_V1',productionId:plan.productionId,planSha256:plan.planSha256,liveSynthesisAllowed:false,limitUsd:.02,maxRequests:5,requestIds:r.requestIds,maxAttemptsPerRequest:1,mode:'multivoice',priceUsdPerMillion:15,recoveryOf:r.oldPlanSha256,historicalLedgerSha256:r.oldLedgerSha256,additionalProblemAttemptExplicitlyApproved:false}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)reviewRecovery(process.argv[2],process.argv[3]).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1;});
