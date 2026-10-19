// Offline only. Does not import any network transport or grant cost permission.
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {makePlan,digest,validatePlan} from '../bilingual/core.mjs';
const dir='docs/reviews/marketing05/recovery-01';await mkdir(dir,{recursive:true});
const oldPlanBytes=await readFile('docs/reviews/marketing05/ssml-plan.json'),old=JSON.parse(oldPlanBytes);
validatePlan(old);
const ledgerBytes=await readFile('out/bilingual/marketing-video-05/ledger.json'),ledger=JSON.parse(ledgerBytes);
const authBytes=await readFile('out/bilingual/marketing-video-05/authorization.json'),auth=JSON.parse(authBytes);
const originalBytes=await readFile('briefs/marketing-video-05-approved.json'),original=JSON.parse(originalBytes);
const receiptBytes=await readFile('out/bilingual/marketing-video-05/hook.wav.receipt.json'),receipt=JSON.parse(receiptBytes),hook=await readFile('out/bilingual/marketing-video-05/hook.wav');
if(digest(originalBytes)!==old.briefSha256||ledger.planSha256!==old.planSha256||auth.planSha256!==old.planSha256||ledger.calls[0].sha256!==digest(hook)||receipt.sha256!==digest(hook)||ledger.calls[1].status!=='FAILED_OR_AMBIGUOUS_NO_RETRY'||ledger.calls.slice(2).some(c=>c.attempts!==0))throw Error('HISTORICAL_STATE_CHANGED');
try{await access('out/bilingual/marketing-video-05/problem.wav');throw Error('PROBLEM_ARTIFACT_REQUIRES_REVIEW');}catch(e){if(e.code!=='ENOENT')throw e;}
const linkage={oldPlanSha256:old.planSha256,oldPlanFileSha256:digest(oldPlanBytes),oldLedgerSha256:digest(ledgerBytes),oldAuthorizationSha256:digest(authBytes),oldApprovalId:auth.approvalId,canonicalBriefSha256:digest(originalBytes),hookSha256:digest(hook),hookReceiptSha256:digest(receiptBytes),historicalReservedUsd:ledger.reservedUsd,oldProblemMayHaveBeenCharged:true};
const brief={...original,id:'marketing-video-05-recovery-01',approvalScope:'UNCHANGED_OWNER_APPROVED_COPY_RECOVERY_COST_NOT_APPROVED',recovery:linkage,spokenSegments:original.spokenSegments.filter(s=>s.id!=='hook')};
const briefPath='briefs/marketing-video-05-recovery-01.json',bytes=Buffer.from(JSON.stringify(brief,null,2)+'\n');
const plan=makePlan(brief,bytes,old.profile,old.pricing,{mode:'multivoice',briefRelativePath:briefPath});
for(const r of plan.requests){const previous=old.requests.find(p=>p.id===r.id);if(r.ssmlSha256!==previous.ssmlSha256||r.text!==previous.text)throw Error('UNEXPECTED_SSML_DIFFERENCE');}
const recovery={schemaVersion:1,status:'AWAITING_NEW_PRIVATE_COST_APPROVAL',productionId:plan.productionId,...linkage,newPlanSha256:plan.planSha256,requestIds:plan.requests.map(r=>r.id),additionalProblemAttempts:1,newRequests:5,newEstimatedUsd:plan.estimatedUsd,newLimitUsd:.02,combinedReferenceEstimatedUsd:Number((plan.estimatedUsd+ledger.reservedUsd).toFixed(6)),combinedReferenceReservationCeilingUsd:.02426,ssmlChanged:false,hookAction:'REUSE_VERIFIED_NEVER_SYNTHESIZE',requiresExplicitDuplicateProblemRiskAcknowledgement:true,confirmation:'APPROVE-VIDEO05-RECOVERY-5REQ-PROBLEM-EXTRA-USD0.02',liveSynthesisAllowed:false};
for(const [file,data] of [[briefPath,bytes],[dir+'/ssml-plan.json',JSON.stringify(plan,null,2)+'\n'],[dir+'/recovery-plan.json',JSON.stringify(recovery,null,2)+'\n']])await writeFile(file,data,{flag:'wx'});
console.log(JSON.stringify(recovery,null,2));
