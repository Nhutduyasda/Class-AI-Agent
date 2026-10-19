// Reproduce Windows stdin early-close using synthetic offline PCM, not TTS.
import {execFileSync} from 'node:child_process';import {writeFile} from 'node:fs/promises';import {verifyWave} from '../bilingual/wave.mjs';
const seconds=15,b=Buffer.alloc(44+seconds*96000);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(48000,24);b.writeUInt32LE(96000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(seconds*96000,40);
const evidence={kind:'OFFLINE_SYNTHETIC_PCM_TRANSPORT_FIXTURE_NOT_VOICE',platform:process.platform,node:process.version,bytes:b.length,oldProbe:[],fixedProbe:null};
for(let i=0;i<3;i++){
 try{const r=JSON.parse(execFileSync('ffprobe',['-v','error','-f','wav','-i','pipe:0','-show_streams','-of','json'],{input:b,encoding:'utf8',timeout:10000}));evidence.oldProbe.push({status:0,code:null,validMetadata:r.streams[0].codec_name==='pcm_s16le'});}
 catch(e){let validMetadata=false;try{validMetadata=JSON.parse(e.stdout).streams[0].codec_name==='pcm_s16le';}catch{} evidence.oldProbe.push({status:Number.isInteger(e.status)?e.status:null,code:['EOF','EPIPE','ENOBUFS'].includes(e.code)?e.code:'OTHER',validMetadata});}
}
evidence.fixedProbe=verifyWave(b);await writeFile('docs/reviews/marketing05/recovery-01/offline-probe-reproduction.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
