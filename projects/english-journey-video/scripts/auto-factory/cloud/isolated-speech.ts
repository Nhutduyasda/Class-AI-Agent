import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type { Request } from './contracts.ts';
import type { Speech, SpeechResult } from './speech.ts';
export class IsolatedAzureSpeech implements Speech {
  #credential:()=>Promise<Buffer>;
  constructor(credential:()=>Promise<Buffer>) {this.#credential=credential;}
  async send(request:Request):Promise<SpeechResult> {
    // The reviewed cloud host must call only through cloudPilot after remote acknowledgements.
    const child=spawn(process.execPath,[resolve(import.meta.dirname,'broker.ts')],{
      env:{...(process.env.SystemRoot?{SystemRoot:process.env.SystemRoot}:{})},stdio:['pipe','pipe','pipe','pipe'],
    });
    const secretPipe=child.stdio[3] as import('node:stream').Writable;
    let credentialBytes:Buffer|undefined;
    try {
      const completion=new Promise<string>((accept,reject)=>{
        let output='';const timer=setTimeout(()=>{child.kill();reject(Error('SPEECH_OUTCOME_UNCERTAIN_NO_RETRY'));},70000);
        child.on('error',()=>{clearTimeout(timer);reject(Error('SPEECH_OUTCOME_UNCERTAIN_NO_RETRY'));});
        child.stdout!.on('data',chunk=>{output+=chunk.toString();if(output.length>8*1024*1024){child.kill();}});
        child.stderr!.resume();child.on('close',code=>{clearTimeout(timer);code===0?accept(output):reject(Error('SPEECH_OUTCOME_UNCERTAIN_NO_RETRY'));});
        child.stdin!.on('error',()=>{});secretPipe.on('error',()=>{});
      });
      void completion.catch(()=>{});
      child.stdin!.end(JSON.stringify(request));
      let key:Buffer;let expired=false;let supplierTimer:ReturnType<typeof setTimeout>|undefined;
      const supplied=Promise.resolve().then(()=>this.#credential());void supplied.then(value=>{if(expired && Buffer.isBuffer(value))value.fill(0);},()=>{});
      try {key=await Promise.race([supplied,new Promise<Buffer>((_,reject)=>{supplierTimer=setTimeout(()=>{expired=true;reject(Error('CREDENTIAL_LOOKUP_TIMEOUT'));},5000);})]);credentialBytes=key;if(!Buffer.isBuffer(key)||key.length===0||key.length>512)throw Error('CREDENTIAL_FORMAT');}catch {secretPipe.end();child.kill();await completion.catch(()=>{});throw Error('SPEECH_OUTCOME_UNCERTAIN_NO_RETRY');}finally{if(supplierTimer)clearTimeout(supplierTimer);}
      try {await new Promise<void>((done,fail)=>{secretPipe.end(key,(error?:Error|null)=>error?fail(Error('SPEECH_PIPE_FAILED')):done());});}finally {key.fill(0);}
      const raw=JSON.parse(await completion);return {...raw,wav:Buffer.from(raw.wav,'base64')};
    } catch {child.kill();throw Error('SPEECH_OUTCOME_UNCERTAIN_NO_RETRY');}finally {if(Buffer.isBuffer(credentialBytes))credentialBytes.fill(0);}
  }
}
