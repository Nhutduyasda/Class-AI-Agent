// No side effects on import. Only --run with a NEW bound policy can synthesize.
import {readFile,writeFile,mkdir,open,unlink,realpath,access,link} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {digest,validatePlan,containedPath} from './core.mjs';
import {authenticationHeaders,credentialReadiness} from '../marketing03/auth.mjs';
import {inspectWave,atomicJson} from '../marketing03/direct-audio.mjs';
import {saveVerifiedWave,verifyWave} from './wave.mjs';
export const ENDPOINT='https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1';
export const VOICES_ENDPOINT='https://southeastasia.tts.speech.microsoft.com/cognitiveservices/voices/list';
export function validateVoiceEvidence(e,now=Date.now()) {
  if(e?.kind!=='AZURE_VOICES_LIST'||e.region!=='southeastasia'||e.resource!=='english-journey-namminh'||e.endpoint!==VOICES_ENDPOINT||!Number.isFinite(Date.parse(e.checkedAt))||now-Date.parse(e.checkedAt)>86400000||Date.parse(e.checkedAt)>now+60000||!['vi-VN-NamMinhNeural','en-US-AndrewNeural'].every(v=>e.voices?.some(x=>x.ShortName===v&&x.VoiceType==='Neural')))throw Error('FRESH_RESOURCE_VOICE_CHECK_REQUIRED');
}
export async function checkVoices(env=process.env,fetcher=fetch) {
  if(!credentialReadiness(env).ready)throw Error('PRIVATE_CREDENTIAL_REQUIRED');
  const response=await fetcher(VOICES_ENDPOINT,{method:'GET',redirect:'error',headers:authenticationHeaders(env),signal:AbortSignal.timeout(20000)});
  if(!response.ok){await response.body?.cancel();throw Error('VOICE_LIST_FAILED_NO_RETRY');}
  const body=await response.json();if(!Array.isArray(body))throw Error('VOICE_LIST_INVALID');
  const result={kind:'AZURE_VOICES_LIST',region:'southeastasia',resource:'english-journey-namminh',endpoint:VOICES_ENDPOINT,checkedAt:new Date().toISOString(),voices:body.filter(v=>['vi-VN-NamMinhNeural','en-US-AndrewNeural'].includes(v.ShortName)).map(v=>({ShortName:v.ShortName,Locale:v.Locale,Gender:v.Gender,VoiceType:v.VoiceType,Status:v.Status}))};
  validateVoiceEvidence(result);return result;
}
export function validateAuthorization(plan,p,e,{now=Date.now(),offline=false}={}) {
  validatePlan(plan);
  if(p?.scope!=='BILINGUAL_V1'||p.liveSynthesisAllowed!==true||!p.approvalId||p.productionId!==plan.productionId||p.planSha256!==plan.planSha256||!Number.isFinite(Date.parse(p.expiresAt))||Date.parse(p.expiresAt)<=now||!Number.isFinite(p.limitUsd)||p.limitUsd<=0||p.limitUsd<plan.estimatedUsd||p.maxRequests!==plan.requests.length||JSON.stringify(p.requestIds)!==JSON.stringify(plan.requests.map(r=>r.id))||p.maxAttemptsPerRequest!==1||p.mode!==plan.mode||p.priceUsdPerMillion!==plan.pricing.usdPerMillion)throw Error('NEW_EXACT_COST_AUTHORIZATION_REQUIRED');
  if(plan.warnings.length)throw Error('UNRESOLVED_LANGUAGE_SPANS');
  if(/^marketing-video-0[1-4]$/.test(plan.productionId))throw Error('HISTORICAL_VIDEO_PROTECTED');
  if(!offline){
    validateVoiceEvidence(e,now);
    if(plan.pricing.verified!==true||!Number.isFinite(Date.parse(plan.pricing.checkedAt))||now-Date.parse(plan.pricing.checkedAt)>7*86400000||Date.parse(plan.pricing.checkedAt)>now+60000||plan.pricing.meterName!=='S1 Neural Text To Speech Characters'||plan.pricing.unitOfMeasure!=='1M')throw Error('CURRENT_NEURAL_PRICE_REQUIRED');
  }
}
export async function postOnce(ssml,env=process.env) {
  if(!credentialReadiness(env).ready)throw Error('PRIVATE_CREDENTIAL_REQUIRED');
  const r=await fetch(ENDPOINT,{method:'POST',redirect:'error',headers:{...authenticationHeaders(env),'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'riff-48khz-16bit-mono-pcm','User-Agent':'EnglishJourneyBilingual/1.0'},body:ssml,signal:AbortSignal.timeout(60000)});
  if(!r.ok){await r.body?.cancel();throw Error('AZURE_REQUEST_FAILED_NO_RETRY');}
  let bytes=0;const chunks=[];
  for await(const chunk of r.body){bytes+=chunk.length;if(bytes>60_000_000)throw Error('OVERSIZE_RESPONSE');chunks.push(chunk);}
  return Buffer.concat(chunks);
}
export async function validateBriefSource(projectRoot,plan){
  if(typeof plan.briefRelativePath!=='string'||!plan.briefRelativePath.startsWith('briefs/')||plan.briefRelativePath.includes('..'))throw Error('LIVE_BRIEF_SOURCE_REQUIRED');
  const file=containedPath(projectRoot,[plan.briefRelativePath]),actual=await realpath(file),rel=relative(await realpath(projectRoot),actual);
  if(rel.startsWith('..')||isAbsolute(rel))throw Error('BRIEF_SYMLINK_ESCAPE');
  const bytes=await readFile(actual),brief=JSON.parse(bytes);
  if(digest(bytes)!==plan.briefSha256||brief.approved!==true||brief.id!==plan.productionId||JSON.stringify(brief.spokenSegments.map(s=>({id:s.id,spoken:s.spoken})))!==JSON.stringify(plan.scenes.map(s=>({id:s.id,spoken:s.canonicalText}))))throw Error('APPROVED_BRIEF_CHANGED_AFTER_PLAN');
}
function assertLedger(plan,ledger) {
  if(ledger.planSha256!==plan.planSha256||ledger.productionId!==plan.productionId||ledger.calls.length!==plan.requests.length||ledger.calls.some((c,i)=>c.id!==plan.requests[i].id||c.ssmlSha256!==plan.requests[i].ssmlSha256||c.estimatedUsd!==plan.requests[i].estimatedUsd||!Number.isInteger(c.attempts)||c.attempts<0||c.attempts>1)||ledger.requestsSubmitted!==ledger.calls.reduce((n,c)=>n+c.attempts,0)||Math.abs(ledger.reservedUsd-ledger.calls.reduce((n,c)=>n+c.attempts*c.estimatedUsd,0))>1e-10)throw Error('LEDGER_INVALID_DO_NOT_RESET');
  if(ledger.calls.some(c=>!['NOT_SUBMITTED','VERIFIED'].includes(c.status)))throw Error('AMBIGUOUS_ATTEMPT_STOP_ALL_NO_RETRY');
  if(ledger.calls.some(c=>c.status==='NOT_SUBMITTED'?c.attempts!==0:c.attempts!==1))throw Error('LEDGER_ATTEMPT_STATUS_INVALID');
}
export async function runPlan({projectRoot,plan,authorization,voiceEvidence,transport=postOnce,offline=false}) {
  if((transport!==postOnce)!==offline)throw Error('MOCK_TRANSPORT_MUST_BE_EXPLICIT');
  validateAuthorization(plan,authorization,voiceEvidence,{offline});
  if(!offline)await validateBriefSource(projectRoot,plan);
  if(!offline&&!credentialReadiness().ready)throw Error('PRIVATE_CREDENTIAL_REQUIRED_BEFORE_ATTEMPT');
  // Every run has its own output/ledger; Video 01–04 assets are never destinations.
  const root=await realpath(projectRoot),out=containedPath(root,['out','bilingual',plan.productionId]);await mkdir(out,{recursive:true});
  const resolvedOut=await realpath(out),rel=relative(root,resolvedOut);
  if(rel.startsWith('..')||isAbsolute(rel))throw Error('SYMLINK_OUTPUT_ESCAPE');
  const lockFile=join(out,'session.lock'),lock=await open(lockFile,'wx',0o600),ledgerFile=join(out,'ledger.json');
  let ledger;
  try{
    // Decoder/storage checks before any paid request.
    execFileSync('ffmpeg',['-version'],{stdio:'pipe'});execFileSync('ffprobe',['-version'],{stdio:'pipe'});
    const storageProbe=join(out,'.storage-'+randomUUID()),storageLink=storageProbe+'.linked';
    try{const h=await open(storageProbe,'wx',0o600);try{await h.writeFile('STORAGE_CHECK');await h.sync();}finally{await h.close();}await link(storageProbe,storageLink);if(await readFile(storageLink,'utf8')!=='STORAGE_CHECK')throw Error('STORAGE_NOT_READY');}
    finally{await unlink(storageLink).catch(e=>{if(e.code!=='ENOENT')throw e;});await unlink(storageProbe).catch(e=>{if(e.code!=='ENOENT')throw e;});}
    const seed={schemaVersion:1,productionId:plan.productionId,planSha256:plan.planSha256,kind:offline?'OFFLINE_FIXTURE_ONLY':'AZURE_REST',requestsSubmitted:0,reservedUsd:0,calls:plan.requests.map(r=>({id:r.id,ssmlSha256:r.ssmlSha256,estimatedUsd:r.estimatedUsd,attempts:0,status:'NOT_SUBMITTED'}))};
    try{await writeFile(ledgerFile,JSON.stringify(seed,null,2),{flag:'wx',mode:0o600});ledger=seed;}catch(e){if(e.code!=='EEXIST')throw e;ledger=JSON.parse(await readFile(ledgerFile,'utf8'));}
    assertLedger(plan,ledger);
    if(ledger.kind!==seed.kind)throw Error('MOCK_PRODUCTION_LEDGER_MISMATCH');
    for(let i=0;i<plan.requests.length;i++){
      const request=plan.requests[i],call=ledger.calls[i],file=containedPath(out,[request.id+'.wav']);
      if(call.status==='VERIFIED'){
        const receipt=JSON.parse(await readFile(file+'.receipt.json','utf8')),actual=inspectWave(await readFile(file));
        if(actual.sha256!==call.sha256||receipt.sha256!==call.sha256||receipt.provenance.planSha256!==plan.planSha256||receipt.provenance.ssmlSha256!==request.ssmlSha256||receipt.provenance.kind!==ledger.kind)throw Error('CACHED_WAV_RECEIPT_MISMATCH');
        verifyWave(await readFile(file));continue;
      }
      try{await access(file);throw Error('EXISTING_WAV_RECOVER_DO_NOT_RESYNTHESIZE');}catch(e){if(e.code!=='ENOENT')throw e;}
      validateAuthorization(plan,authorization,voiceEvidence,{offline});
      if(!offline)await validateBriefSource(root,plan);
      if(ledger.reservedUsd+request.estimatedUsd>authorization.limitUsd+1e-12)throw Error('BUDGET_EXCEEDED');
      call.attempts=1;call.status='SUBMITTING';call.approvalId=authorization.approvalId;call.submittedAt=new Date().toISOString();ledger.requestsSubmitted++;ledger.reservedUsd+=request.estimatedUsd;
      await atomicJson(ledgerFile,ledger);
      try{
        const bytes=await transport(request.ssml),receipt=await saveVerifiedWave(bytes,file,{kind:ledger.kind,planSha256:plan.planSha256,ssmlSha256:request.ssmlSha256,textSha256:digest(request.text),voices:[...new Set(request.spans.map(s=>s.voice))],format:plan.profile.format,scene:request.scene,request:request.id});
        call.status='VERIFIED';call.sha256=receipt.sha256;call.durationSeconds=receipt.durationSeconds;call.file=request.id+'.wav';
        await atomicJson(ledgerFile,ledger);
      }catch(e){
        call.status='FAILED_OR_AMBIGUOUS_NO_RETRY';await atomicJson(ledgerFile,ledger);if(offline)throw e;throw Error('FAILED_OR_AMBIGUOUS_NO_RETRY');
      }
    }
    const manifest={schemaVersion:1,planSha256:plan.planSha256,kind:ledger.kind,resource:plan.profile.resource,region:plan.profile.region,requestsSubmitted:ledger.requestsSubmitted,reservedUsd:ledger.reservedUsd,files:ledger.calls.map(c=>({...c,scene:plan.requests.find(r=>r.id===c.id).scene})),subjectiveQA:'BLOCKED_REQUIRES_REAL_LISTENING',timing:'PENDING_OBSERVED_AUDIO_ALIGNMENT'};
    await atomicJson(join(out,'audio-manifest.json'),manifest);return {status:'ALL_WAV_VERIFIED',requests:ledger.requestsSubmitted,reservedUsd:ledger.reservedUsd,output:out};
  }finally{await lock.close();await unlink(lockFile);}
}
async function main(){
  const [mode,rootArg,planArg,policyArg,evidenceArg]=process.argv.slice(2);
  if(mode==='--check-voices'){const evidence=await checkVoices();await writeFile(resolve(rootArg),JSON.stringify(evidence,null,2),{flag:'wx'});console.log(JSON.stringify({status:'VOICES_LIST_VERIFIED_NO_TTS',voices:evidence.voices.map(v=>v.ShortName)}));return;}
  if(mode==='--preflight'){
    const plan=JSON.parse(await readFile(planArg,'utf8')),policy=JSON.parse(await readFile(policyArg,'utf8'));
    validateAuthorization(plan,policy,null,{offline:true});
    await validateBriefSource(resolve(rootArg),plan);
    console.log(JSON.stringify({status:'COST_POLICY_READY_RESOURCE_CHECK_PENDING',requests:plan.requestCount,billableCharacters:plan.billableCharacters,estimatedUsd:plan.estimatedUsd,planSha256:plan.planSha256}));return;
  }
  if(mode!=='--run')throw Error('ONLY_EXPLICIT_CHECK_OR_AUTHORIZED_RUN');
  const plan=JSON.parse(await readFile(planArg,'utf8')),authorization=JSON.parse(await readFile(policyArg,'utf8')),voiceEvidence=JSON.parse(await readFile(evidenceArg,'utf8'));
  console.log(JSON.stringify(await runPlan({projectRoot:resolve(rootArg),plan,authorization,voiceEvidence})));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.log(JSON.stringify({status:'STOPPED_NO_RETRY',code:'CHECK_POLICY_EVIDENCE_AND_LEDGER'}));process.exitCode=1;}).finally(()=>{delete process.env.SPEECH_KEY;});
