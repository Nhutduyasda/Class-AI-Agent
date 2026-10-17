import {readFile,mkdir,open,link,unlink,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {inspectWave} from '../marketing03/direct-audio.mjs';
// Retain the existing strict RIFF verifier; decode file bytes over stdin so FFmpeg
// does not depend on MAX_PATH support for deeply nested Windows project paths.
export function verifyWave(bytes){
  const info=inspectWave(bytes);
  execFileSync('ffmpeg',['-v','error','-xerror','-f','wav','-i','pipe:0','-f','null','-'],{input:bytes,stdio:['pipe','pipe','pipe'],timeout:30000});
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-f','wav','-i','pipe:0','-show_streams','-of','json'],{input:bytes,encoding:'utf8',timeout:10000}));
  if(probe.streams.length!==1||probe.streams[0].codec_name!=='pcm_s16le'||probe.streams[0].sample_rate!=='48000'||probe.streams[0].channels!==1)throw Error('WAV_DECODER_FORMAT_MISMATCH');
  return info;
}
export async function saveVerifiedWave(bytes,destination,provenance){
  const info=verifyWave(bytes),dest=resolve(destination);await mkdir(dirname(dest),{recursive:true});
  const temp=dest+'.pending-'+randomUUID();let committed=false;
  try{
    const file=await open(temp,'wx',0o600);try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}
    if(verifyWave(await readFile(temp)).sha256!==info.sha256)throw Error('WAV_READBACK_MISMATCH');
    await link(temp,dest);committed=true;
    const receipt={...info,provenance,fullDecode:'PASS',readBack:'PASS',verifiedAt:new Date().toISOString()};
    await writeFile(dest+'.receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});return receipt;
  }catch(e){if(committed)throw Error('WAV_SAVED_RECEIPT_FAILED_NO_RESYNTHESIS');throw e;}
  finally{await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}
