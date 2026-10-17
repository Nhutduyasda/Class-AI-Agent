// Video 04 direct WAV receiver. Importing / default CLI never contacts Azure.
import {readFile,writeFile,open,mkdir,rename,link,unlink} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {credentialReadiness,authenticationHeaders} from './auth.mjs';
export {credentialReadiness} from './auth.mjs';

export const ENDPOINT='https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1';
export const FORMAT='riff-48khz-16bit-mono-pcm';
export const VOICE='vi-VN-NamMinhNeural';
export const sha256=b=>createHash('sha256').update(b).digest('hex');
export const ssml=text=>'<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="vi-VN"><voice name="'+VOICE+'">'+text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</voice></speak>';

export function inspectWave(input){
 const b=Buffer.from(input);
 if(b.length<44||b.length>60_000_000||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE'||b.readUInt32LE(4)+8!==b.length)throw Error('Invalid/truncated RIFF WAV');
 let fmt,data,offset=12;
 while(offset+8<=b.length){
  const kind=b.toString('ascii',offset,offset+4),size=b.readUInt32LE(offset+4),start=offset+8;
  if(start+size>b.length)throw Error('Truncated WAV chunk');
  if(kind==='fmt '){if(fmt||size<16)throw Error('Invalid fmt chunk');fmt=b.subarray(start,start+size);}
  if(kind==='data'){if(data)throw Error('Duplicate data chunk');data=b.subarray(start,start+size);}
  offset=start+size+(size%2);
 }
 if(offset!==b.length||!fmt||!data||!data.length||data.length%2)throw Error('Missing/invalid PCM data');
 if(fmt.readUInt16LE(0)!==1||fmt.readUInt16LE(2)!==1||fmt.readUInt32LE(4)!==48000||fmt.readUInt32LE(8)!==96000||fmt.readUInt16LE(12)!==2||fmt.readUInt16LE(14)!==16)throw Error('Expected PCM 48kHz mono 16-bit');
 const durationSeconds=data.length/96000;
 if(durationSeconds<.1||durationSeconds>120)throw Error('Unexpected audio duration');
 return {sampleRate:48000,channels:1,bitsPerSample:16,codec:'pcm_s16le',durationSeconds,bytes:b.length,sha256:sha256(b)};
}

export async function saveVerifiedWave(bytes,destination,provenance){
 const info=inspectWave(bytes),dest=resolve(destination);
 if(!provenance?.kind)throw Error('Audio provenance required');
 await mkdir(dirname(dest),{recursive:true});
 const temp=dest+'.pending-'+randomUUID();
 let committed=false;
 try{
  const h=await open(temp,'wx',0o600);
  try{await h.writeFile(bytes);await h.sync();}finally{await h.close();}
  // Parse header AND check actual file using the real decoder, before publication.
  execFileSync('ffmpeg',['-v','error','-xerror','-i',temp,'-f','null','-'],{stdio:'pipe',timeout:30000});
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',temp],{encoding:'utf8',timeout:10000}));
  const a=probe.streams;
  if(a.length!==1||a[0].codec_name!=='pcm_s16le'||a[0].sample_rate!=='48000'||a[0].channels!==1)throw Error('Decoder format differs from WAV header');
  if(sha256(await readFile(temp))!==info.sha256)throw Error('Read-back hash mismatch');
  // Hard-link commits exclusively; unlike rename, it cannot overwrite a good WAV.
  await link(temp,dest);committed=true;
  const receipt={...info,file:dest,provenance,fullDecode:'PASS',readBack:'PASS',verifiedAt:new Date().toISOString()};
  await writeFile(dest+'.receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  return receipt;
 }catch(e){
  // A committed WAV is retained if receipt writing fails: recover it, never resynthesize.
  if(committed)throw Error('WAV_SAVED_RECEIPT_FAILED; recover existing file, do not retry synthesis');
  throw e;
 }finally{await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}

export async function atomicJson(file,data){
 const tmp=file+'.pending-'+randomUUID();
 await mkdir(dirname(resolve(file)),{recursive:true});
 const h=await open(tmp,'wx',0o600);
 try{await h.writeFile(JSON.stringify(data,null,2)+'\n');await h.sync();}finally{await h.close();}
 await rename(tmp,file);
}

export async function initializeRuntimeLedger(source='docs/reviews/marketing04/azure-ledger.json',target='out/marketing04/ledger.json'){
 const checkpoint=await readFile(source);await mkdir(dirname(resolve(target)),{recursive:true});
 try{await writeFile(target,checkpoint,{flag:'wx',mode:0o600});return {status:'INITIALIZED_FROM_CHECKPOINT'};}
 catch(e){
  if(e.code!=='EEXIST')throw e;
  const runtime=JSON.parse(await readFile(target,'utf8')),baseline=JSON.parse(checkpoint);
  if(runtime.briefSha256!==baseline.briefSha256||baseline.calls.some(s=>!(runtime.calls.find(x=>x.id===s.id)?.attempts>=s.attempts)))throw Error('Runtime ledger inconsistent; manual recovery required, never reset it');
  return {status:'EXISTING_LEDGER_PRESERVED'};
 }
}

export async function postAzureOnce(body,env=process.env){
 if(!credentialReadiness(env).ready)throw Error('Secure environment credential unavailable');
 const auth=authenticationHeaders(env);
 // Redirects and retries disabled; never log provider response bodies or auth headers.
 const r=await fetch(ENDPOINT,{method:'POST',redirect:'error',headers:{...auth,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':FORMAT,'User-Agent':'EnglishJourneyVideo04/1.1'},body,signal:AbortSignal.timeout(45000)});
 if(!r.ok){await r.body?.cancel();const error=Error('Azure HTTP '+r.status+'; no retry');error.safeCode='HTTP_'+r.status;throw error;}
 const chunks=[];let count=0;
 for await(const chunk of r.body){count+=chunk.length;if(count>60_000_000)throw Error('Audio response exceeds limit');chunks.push(chunk);}
 return Buffer.concat(chunks);
}

export async function executeOne({id,ledgerFile,briefFile,authorization,destination,transport=postAzureOnce,credentialsReady=credentialReadiness().ready}){
 if(!authorization?.liveSynthesisAllowed||!authorization.approvalId||Date.parse(authorization.expiresAt)<=Date.now()||!Number.isFinite(Date.parse(authorization.expiresAt)))throw Error('NO_CURRENT_LIVE_AUTHORIZATION');
 if(!credentialsReady)throw Error('Secure environment credential unavailable');
 const briefBytes=await readFile(briefFile),brief=JSON.parse(briefBytes);
 const lockFile=ledgerFile+'.lock';const lock=await open(lockFile,'wx',0o600);
 let ledger,call,submitted=false,reservationOwned=false;
 try{
  ledger=JSON.parse(await readFile(ledgerFile,'utf8'));
  if(ledger.briefSha256!==sha256(briefBytes)||authorization.briefSha256!==sha256(briefBytes))throw Error('Approved copy hash mismatch');
  if(JSON.stringify(ledger.calls.map(s=>s.id))!==JSON.stringify(brief.spokenSegments.map(s=>s.id)))throw Error('Incomplete or duplicate ledger scenes');
  call=ledger.calls.find(s=>s.id===id);const approved=brief.spokenSegments.find(s=>s.id===id);
  if(!call||call.text!==approved?.spoken||call.characters!==Array.from(call.text).length)throw Error('Approved speech mismatch');
  const cap=authorization.maxAttempts?.[id];
  if(!Number.isInteger(cap)||cap<1||cap>(id==='hook'&&authorization.additionalHookAttemptExplicitlyApproved===true?2:1)||call.attempts>=cap)throw Error('ATTEMPT_LIMIT; no automatic retry');
  let spent=0;
  for(const s of ledger.calls){
   const text=brief.spokenSegments.find(x=>x.id===s.id)?.spoken;
   if(s.text!==text||!Number.isInteger(s.attempts)||s.attempts<0||!Number.isFinite(s.estimatedUsd)||Math.abs(s.estimatedUsd-Array.from(text).length*15/1e6)>1e-12)throw Error('Ledger cost/copy invalid');
   spent+=s.attempts*Array.from(text).length*15/1e6;
  }
  if(!Number.isFinite(authorization.limitUsd)||authorization.limitUsd>.05||spent+call.estimatedUsd>authorization.limitUsd+1e-10)throw Error('Budget exceeded');
  // Probe output directory without any paid request. Existing WAVs are recovery cases.
  await mkdir(dirname(resolve(destination)),{recursive:true});
  const reserved=await open(destination+'.reservation','wx',0o600);reservationOwned=true;await reserved.close();
  try{await readFile(destination);throw Error('WAV already exists; recover/verify it');}catch(e){if(e.code!=='ENOENT')throw e;}
  const entry={attempt:call.attempts+1,approvalId:authorization.approvalId,submittedAt:new Date().toISOString(),status:'SUBMITTING'};
  call.history??=[];call.history.push(entry);call.attempts++;call.status='SUBMITTING';
  ledger.synthesisRequestsSubmitted=ledger.calls.reduce((n,s)=>n+s.attempts,0);
  ledger.knownReferenceChargeUsd=ledger.calls.reduce((n,s)=>n+s.attempts*s.estimatedUsd,0);
  await atomicJson(ledgerFile,ledger);submitted=true;
  // Exactly one transport invocation. Any failure consumes this attempt, including timeout.
  const bytes=await transport(ssml(call.text));
  const receipt=await saveVerifiedWave(bytes,destination,{kind:transport===postAzureOnce?'AZURE_REST':'LOCAL_MOCK_ONLY',voice:VOICE,format:FORMAT,scene:id,textSha256:sha256(Buffer.from(call.text)),approvalId:authorization.approvalId});
  entry.status='AUDIO_SAVED_VERIFIED';entry.sha256=receipt.sha256;
  call.status='AUDIO_SAVED_VERIFIED';call.audioVerified=true;call.sha256=receipt.sha256;call.audioPath=destination;
  await atomicJson(ledgerFile,ledger);
  return receipt;
 }catch(e){
  if(submitted){call.status='FAILED_OR_AMBIGUOUS_NO_RETRY';call.history.at(-1).status=call.status;await atomicJson(ledgerFile,ledger);}
  // Never return raw network errors potentially containing auth material.
  if(submitted){const error=Error('Request/receipt failed or ambiguous; attempt retained, no retry');error.safeCode=/^HTTP_[1-5][0-9]{2}$/.test(e.safeCode||'')?e.safeCode:'FAILED_OR_AMBIGUOUS_NO_RETRY';throw error;}
  throw e;
 }finally{
  await lock.close();await unlink(lockFile);
  if(reservationOwned)await unlink(destination+'.reservation').catch(e=>{if(e.code!=='ENOENT')throw e;});
 }
}

async function main(){
 const args=process.argv.slice(2);
 if(args.join(' ')==='--init-ledger'){console.log(JSON.stringify(await initializeRuntimeLedger()));return;}
 if(args.length===0||args.join(' ')==='--preflight'){
  const b=await readFile('briefs/marketing-video-04-approved.json');const d=JSON.parse(b);
  console.log(JSON.stringify({mode:'OFFLINE_NO_NETWORK',endpoint:ENDPOINT,format:FORMAT,voice:VOICE,briefSha256:sha256(b),characters:d.spokenSegments.reduce((n,s)=>n+Array.from(s.spoken).length,0),credentials:credentialReadiness(),liveAuthorization:'REQUIRED_SEPARATELY'},null,2));return;
 }
 // Only a future explicit owner-approved policy can unlock execution, never this preflight.
 if(args.length!==4||args[0]!=='--execute-one'||args[2]!=='--authorization')throw Error('Usage: --preflight OR --execute-one <scene> --authorization <owner-approved-policy.json>');
 const policy=JSON.parse(await readFile(args[3],'utf8'));
 const receipt=await executeOne({id:args[1],ledgerFile:'out/marketing04/ledger.json',briefFile:'briefs/marketing-video-04-approved.json',authorization:policy,destination:'out/marketing04/raw/'+args[1]+'.wav'});
 console.log(JSON.stringify(receipt,null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.error('STOPPED. No automatic retry. Inspect the ledger; do not print credentials.');process.exitCode=1;});
