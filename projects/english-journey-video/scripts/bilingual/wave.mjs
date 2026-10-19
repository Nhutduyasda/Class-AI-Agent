import {readFile,mkdir,open,link,unlink,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {inspectWave} from '../marketing03/direct-audio.mjs';
import {digest} from './core.mjs';
import {PipelineFailure,syncStage} from './diagnostics.mjs';
// Retain the existing strict RIFF verifier; decode file bytes over stdin so FFmpeg
// does not depend on MAX_PATH support for deeply nested Windows project paths.
export function verifyWave(bytes){
  const info=syncStage('WAV_STRUCTURE',()=>inspectWave(bytes));
  syncStage('WAV_DECODE',()=>execFileSync('ffmpeg',['-v','error','-xerror','-f','wav','-i','pipe:0','-f','null','-'],{input:bytes,stdio:['pipe','pipe','pipe'],timeout:30000}));
  // Force ffprobe to consume the whole stdin stream. Without -count_frames it
  // can exit after the header; Node's Windows synchronous pipe writer then
  // reports EOF even with exit status 0 and valid probe JSON for longer WAVs.
  const probe=syncStage('WAV_PROBE',()=>JSON.parse(execFileSync('ffprobe',['-v','error','-f','wav','-i','pipe:0','-count_frames','-show_streams','-of','json'],{input:bytes,encoding:'utf8',timeout:30000})));
  if(probe.streams.length!==1||probe.streams[0].codec_name!=='pcm_s16le'||probe.streams[0].sample_rate!=='48000'||probe.streams[0].channels!==1)throw new PipelineFailure('WAV_PROBE');
  return info;
}
export async function saveVerifiedWave(bytes,destination,provenance){
  // Never persist an arbitrary HTTP body; quarantine RIFF/WAVE audio only.
  if(bytes.length<12||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')verifyWave(bytes);
  const dest=resolve(destination);try{await mkdir(dirname(dest),{recursive:true});}catch(e){throw new PipelineFailure('FILE_CREATE',e);}
  const temp=dest+'.pending-'+randomUUID(),evidence=temp+'.provenance.json';let complete=false,stage='FILE_CREATE';
  try{
    const file=await open(temp,'wx',0o600);try{stage='FILE_WRITE';await file.writeFile(bytes);await file.sync();}finally{await file.close();}
    // Preserve received audio and its exact request linkage before any decoder
    // can fail. This is a quarantine artifact, never a verified production WAV.
    stage='RESPONSE_PERSIST';await writeFile(evidence,JSON.stringify({kind:'UNVALIDATED_AUDIO_RESPONSE',sha256:digest(bytes),provenance,receivedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx',mode:0o600});
    const info=verifyWave(bytes);
    stage='FILE_READBACK';
    if(verifyWave(await readFile(temp)).sha256!==info.sha256)throw Error('WAV_READBACK_MISMATCH');
    stage='FILE_COMMIT';await link(temp,dest);
    const receipt={...info,provenance,fullDecode:'PASS',readBack:'PASS',verifiedAt:new Date().toISOString()};
    stage='RECEIPT_WRITE';await writeFile(dest+'.receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});complete=true;return receipt;
  }catch(e){if(e instanceof PipelineFailure)throw e;throw new PipelineFailure(stage,e);}
  finally{
    // Future response artifacts survive a local failure for evidence-based recovery.
    // On a completed receipt the exclusive pending link is no longer needed.
    if(complete)for(const file of [temp,evidence])await unlink(file).catch(e=>{if(e.code!=='ENOENT')throw new PipelineFailure('FILE_COMMIT',e);});
  }
}
