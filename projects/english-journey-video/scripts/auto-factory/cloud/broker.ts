// Fixed child entrypoint. No CLI/environment secret. This is not a standalone paid runner.
import { createReadStream } from 'node:fs';
import { AzureSpeech, assertSpeechScope } from './speech.ts';
async function readFd(fd:number,max:number) {
  const parts:Buffer[]=[];let length=0;const stream=createReadStream('',{fd,autoClose:false});
  try {for await(const chunk of stream){const b=Buffer.from(chunk);parts.push(b);length+=b.length;if(length>max)throw Error();}return Buffer.concat(parts);}
  finally {for(const part of parts)part.fill(0);}
}
let keyBytes:Buffer|undefined;
try {
  const input=await readFd(0,8192),request=JSON.parse(input.toString());
  if(!request || Object.keys(request).sort().join(',')!=='id,language,ssml,ssmlSha256,voice') throw Error();
  assertSpeechScope(request);keyBytes=await readFd(3,512);
  const transport=new AzureSpeech(async()=>keyBytes!.toString('utf8'));
  const result=await transport.send(request);
  process.stdout.write(JSON.stringify({...result,wav:result.wav.toString('base64')}));
} catch {process.stderr.write('SPEECH_OUTCOME_UNCERTAIN_NO_RETRY\n');process.exitCode=1;}
finally {keyBytes?.fill(0);}
