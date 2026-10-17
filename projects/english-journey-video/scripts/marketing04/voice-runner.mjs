import {readFile,writeFile,mkdir,open,unlink,copyFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {executeOne,inspectWave,sha256,atomicJson,credentialReadiness} from './direct-audio.mjs';
const here=dirname(fileURLToPath(import.meta.url));
export const ids=['hook','problem','solution','demo','benefit','cta'];
export async function plan(root){
 const briefFile=join(root,'briefs/marketing-video-04-approved.json'),bytes=await readFile(briefFile),brief=JSON.parse(bytes),p=JSON.parse(await readFile(join(here,'authorization.json')));
 if(sha256(bytes)!==p.briefSha256||!p.liveSynthesisAllowed||p.limitUsd!==.05||p.pricePerMillionUsd!==15||JSON.stringify(p.maxAttempts)!==JSON.stringify(Object.fromEntries(ids.map(id=>[id,1])))||Date.parse(p.expiresAt)<=Date.now())throw Error('INVALID_POLICY');
 if(JSON.stringify(brief.spokenSegments.map(s=>s.id))!==JSON.stringify(ids))throw Error('INVALID_SCENES');
 const characters=brief.spokenSegments.reduce((n,s)=>n+Array.from(s.spoken).length,0),cost=characters*15/1e6;
 if(cost>p.limitUsd)throw Error('BUDGET_EXCEEDED');
 return {briefFile,brief,p,characters,estimatedUsd:cost,briefSha256:sha256(bytes)};
}
async function main(){
 const [mode,rootArg,deliveryArg]=process.argv.slice(2),root=resolve(rootArg),delivery=resolve(deliveryArg),a=await plan(root);
 if(mode==='--plan'){console.log(JSON.stringify({requests:6,characters:a.characters,estimatedUsd:a.estimatedUsd,limitUsd:.05}));return;}
 if(mode!=='--run'||!credentialReadiness().ready)throw Error('PRIVATE_KEY_REQUIRED');
 const out=join(root,'out/marketing04'),raw=join(out,'raw');await mkdir(raw,{recursive:true});await mkdir(delivery,{recursive:true});
 const session=await open(join(out,'session.lock'),'wx');
 try{
  // Exclusive creation means any second invocation stops before sending a request.
  const ledger={video:'04',resource:a.p.resource,region:a.p.region,voice:a.p.voice,briefSha256:a.briefSha256,limitUsd:.05,pricePerMillionUsd:15,synthesisRequestsSubmitted:0,knownReferenceChargeUsd:0,calls:a.brief.spokenSegments.map(s=>({...s,text:s.spoken,characters:Array.from(s.spoken).length,estimatedUsd:Array.from(s.spoken).length*15/1e6,attempts:0,status:'NOT_SUBMITTED'}))};
  const ledgerFile=join(out,'ledger.json');await writeFile(ledgerFile,JSON.stringify(ledger,null,2),{flag:'wx'});
  const files=[];
  for(const id of ids){const receipt=await executeOne({id,ledgerFile,briefFile:a.briefFile,authorization:a.p,destination:join(raw,id+'.wav')});files.push({scene:id,...receipt});await copyFile(join(raw,id+'.wav'),join(delivery,id+'.wav'));}
  await atomicJson(join(out,'audio-manifest.json'),{briefSha256:a.briefSha256,files,cost:{requests:6,estimatedUsd:a.estimatedUsd,limitUsd:.05,priceBasis:'15 USD per million characters reference; not invoice'}});
  await copyFile(join(out,'audio-manifest.json'),join(delivery,'audio-manifest.json'));await copyFile(ledgerFile,join(delivery,'azure-ledger.json'));
  console.log(JSON.stringify({status:'ALL_AUDIO_SAVED_VERIFIED',files:6,estimatedUsd:a.estimatedUsd}));
 }finally{delete process.env.SPEECH_KEY;await session.close();await unlink(join(out,'session.lock'));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{delete process.env.SPEECH_KEY;console.log(JSON.stringify({status:'STOPPED_NO_RETRY',code:'INSPECT_LEDGER_DO_NOT_RESYNTHESIZE'}));process.exitCode=1;});
