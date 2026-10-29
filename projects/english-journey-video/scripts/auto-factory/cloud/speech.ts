// Fixed transport for a future reviewed isolated credential process. No executable CLI.
// No imports of Git, npm, shell, renderer, owner home or environment credential lookup.
import { createHash } from 'node:crypto';
import { REQUEST_ALLOWLIST } from './request-allowlist.ts';
import type { Request } from './contracts.ts';
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
function need(v:unknown, code:string):asserts v {if(!v) throw Error(code);}
export function assertSpeechScope(request:Request) {need(REQUEST_ALLOWLIST.some(r=>r.id===request.id && r.ssmlSha256===request.ssmlSha256 && r.voice===request.voice && r.language===request.language) && sha(request.ssml)===request.ssmlSha256,'SPEECH_SCOPE');}
export const ENDPOINT='https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1';
export type SpeechResult={wav:Buffer; providerRequestId:string; receivedAt:string; ssmlSha256:string; voice:string; provenance:'AZURE_HTTPS_RESPONSE_NOT_BILLING_RECEIPT'};
export interface Speech { send(request:Request):Promise<SpeechResult>; }
export class AzureSpeech implements Speech {
  #credential:()=>Promise<string>;
  // Supplier must be bound by a separately reviewed secure host bootstrap, never a PR/env/config value.
  constructor(credential:()=>Promise<string>) { this.#credential=credential; }
  async send(request:Request):Promise<SpeechResult> {
    assertSpeechScope(request);
    try {
      const key=await this.#credential();need(key.length>0 && key.length<=512 && !/[\r\n]/.test(key),'CREDENTIAL_INVALID');
      const result=await fetch(ENDPOINT,{method:'POST',redirect:'error',signal:AbortSignal.timeout(60000),headers:{
        'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'riff-48khz-16bit-mono-pcm','User-Agent':'EnglishJourney-ReviewedCloudPilot',
      },body:request.ssml});
      need(result.ok && /^(audio\/|application\/octet-stream)/i.test(result.headers.get('content-type')??''),'SPEECH_RESPONSE');
      const parts:Buffer[]=[];let size=0;need(result.body,'SPEECH_BODY');
      for await(const chunk of result.body as any) {size+=chunk.length;need(size<=4*1024*1024,'SPEECH_SIZE');parts.push(Buffer.from(chunk));}
      const wav=Buffer.concat(parts);need(wav.length>=44 && wav.toString('ascii',0,4)==='RIFF' && wav.toString('ascii',8,12)==='WAVE' && wav.readUInt32LE(4)+8===wav.length,'SPEECH_WAV');
      const providerRequestId=result.headers.get('x-requestid')??result.headers.get('x-ms-request-id')??'';
      need(/^[A-Za-z0-9-]{8,128}$/.test(providerRequestId),'PROVIDER_RECEIPT_MISSING');
      return {wav,providerRequestId,receivedAt:new Date().toISOString(),ssmlSha256:request.ssmlSha256,voice:request.voice,provenance:'AZURE_HTTPS_RESPONSE_NOT_BILLING_RECEIPT'};
    } catch { throw Error('SPEECH_OUTCOME_UNCERTAIN_NO_RETRY'); }
  }
}
