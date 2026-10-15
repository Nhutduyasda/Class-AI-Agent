#!/usr/bin/env node
// English Journey Video 02 - paid S0 Nam Minh auditions only.
// Dry-run by default. No payment, Azure resource creation, retries or upload to Git.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

export const VOICE='vi-VN-NamMinhNeural';
export const PRICE_PER_MILLION_USD=15; // Reference quote, not invoice
export const MAX_QUOTED_USD=0.05;
export const MAX_TEXT_CHARS=300;
export const OUTPUT_FORMAT='riff-48khz-16bit-mono-pcm';
export function countText(text){return Array.from(text).length;}
export function getPlan(brief){
  if(brief?.approval?.status!=='OWNER_APPROVED_V1_1'||brief?.approval?.spokenCopyLocked!==true)throw new Error('Locked V1.1 brief required');
  const entries=[['A-HOOK','hook'],['B-DEMO','demo']].map(([id,segment])=>{
    const text=brief.spokenSegments?.find(x=>x.id===segment)?.spoken;
    if(!text)throw new Error('Approved speech missing for '+segment);
    return {id,text,characters:countText(text),file:id+'-NamMinh-S0.wav'};
  });
  const characters=entries.reduce((sum,x)=>sum+x.characters,0);
  const estimatedUSD=characters*PRICE_PER_MILLION_USD/1_000_000;
  if(characters>MAX_TEXT_CHARS||estimatedUSD>MAX_QUOTED_USD)throw new Error('Local price estimate guard FAILED');
  return {entries,characters,estimatedUSD};
}
export function ssml(text){
  const escaped=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  // Default rate and pitch, same intent as +0% in Video 01.
  return '<speak version="1.0" xml:lang="vi-VN"><voice name="'+VOICE+'">'+escaped+'</voice></speak>';
}
export function isPcmWave48kMono(raw){
  const b=Buffer.from(raw);
  return b.length>=44 && b.toString('ascii',0,4)==='RIFF' &&
    b.toString('ascii',8,12)==='WAVE' && b.readUInt16LE(22)===1 &&
    b.readUInt32LE(24)===48000 && b.readUInt16LE(34)===16;
}
async function fileExistsAndValid(file){
  let bytes;
  try{bytes=await readFile(file);}catch(e){if(e.code==='ENOENT')return false;throw e;}
  if(!isPcmWave48kMono(bytes))throw new Error('Output exists but is not valid PCM WAV: '+file);
  return true;
}
async function run(){
  const args=process.argv.slice(2);
  const allowed=new Set(['--execute','--confirm-standard-s0']);
  if(args.some(a=>!allowed.has(a)) || args.length!==new Set(args).size)throw new Error('Unexpected args');
  const execute=args.includes('--execute');
  if(execute!==args.includes('--confirm-standard-s0'))throw new Error('Execution requires both --execute and --confirm-standard-s0');
  const raw=await readFile(resolve('briefs/marketing-video-02-approved.json'));
  const plan=getPlan(JSON.parse(raw.toString('utf8')));
  const briefSha256=createHash('sha256').update(raw).digest('hex');
  console.log(JSON.stringify({mode:execute?'PAID_EXECUTION':'DRY_RUN_NO_NETWORK',voice:VOICE,format:OUTPUT_FORMAT,
    samples:plan.entries.map(({id,file,characters})=>({id,file,characters})),
    totalCharacters:plan.characters,referenceUSD:plan.estimatedUSD,
    maximumReferenceEstimateUSD:MAX_QUOTED_USD,
    warning:'Budget guard is local estimate only, NOT an Azure spending limit. No automatic retries.'},null,2));
  if(!execute)return;
  const key=process.env.SPEECH_KEY,region=process.env.SPEECH_REGION;
  if(!key||!region)throw new Error('Missing private SPEECH_KEY or SPEECH_REGION; do not paste keys into chat');
  if(!/^[a-z0-9]+$/.test(region))throw new Error('Invalid region');
  // The user must confirm their resource really is Standard S0 in Azure Portal.
  const out=resolve('out/marketing02/azure-namminh-auditions');
  await mkdir(out,{recursive:true});
  const audit={voice:VOICE,region,briefSha256,standardS0ConfirmedByOperator:true,
    maximumRequests:2,samples:[]};
  for(const entry of plan.entries){
    const dest=join(out,entry.file);
    if(await fileExistsAndValid(dest)){
      console.log('Skipped existing valid sample, no Azure request: '+dest);
      audit.samples.push({id:entry.id,status:'EXISTING',file:dest});
      continue;
    }
    // Exactly one POST per missing sample. A failed request may still be billable.
    const response=await fetch('https://'+region+'.tts.speech.microsoft.com/cognitiveservices/v1',{
      method:'POST',
      headers:{
        'Ocp-Apim-Subscription-Key':key,
        'Content-Type':'application/ssml+xml',
        'X-Microsoft-OutputFormat':OUTPUT_FORMAT,
        'User-Agent':'EnglishJourneyVideo02VoiceAudition/1.0'
      },
      body:ssml(entry.text),signal:AbortSignal.timeout(30000)
    });
    if(!response.ok)throw new Error('Azure HTTP '+response.status+'; no retry performed');
    const audio=Buffer.from(await response.arrayBuffer());
    if(!isPcmWave48kMono(audio))throw new Error('Azure reply did not contain 48k mono PCM WAV; no retry');
    await writeFile(dest,audio,{flag:'wx'});
    const receipt={id:entry.id,status:'GENERATED',characters:entry.characters,file:dest,
      bytes:audio.length,sha256:createHash('sha256').update(audio).digest('hex')};
    audit.samples.push(receipt);
    await writeFile(join(out,'audit.json'),JSON.stringify(audit,null,2)+'\n');
    console.log('Created sample: '+dest);
  }
  console.log('Two samples only. Stop for OWNER LISTENING approval before full voiceover.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  run().catch(e=>{console.error('STOPPED:',e.message);process.exitCode=1;});
