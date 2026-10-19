// Only allowlisted metadata crosses the private runner boundary. Never retain
// messages, URLs, headers, response bodies, stacks, credentials or arbitrary codes.
const stages=new Set(['HTTP_SEND','HTTP_STATUS','HTTP_STREAM','WAV_STRUCTURE','WAV_DECODE','WAV_PROBE','FILE_CREATE','FILE_WRITE','FILE_READBACK','FILE_COMMIT','RECEIPT_WRITE','RECEIPT_COMMIT','RESPONSE_PERSIST','TRANSPORT','UNKNOWN']);
const codes=new Set(['EOF','EPERM','EACCES','ENOENT','EEXIST','ENOSPC','EIO','ETIMEDOUT','ECONNRESET','ENOTFOUND','EPIPE','ENOBUFS','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT']);
export class PipelineFailure extends Error {
 constructor(stage,error,{httpStatus,requestId}={}){
  super('PIPELINE_FAILED_NO_RETRY');this.name='PipelineFailure';
  const d={stage:stages.has(stage)?stage:'UNKNOWN',errorType:['AbortError','TimeoutError','TypeError','SyntaxError'].includes(error?.name)?error.name:'Error'};
  const code=error?.code??error?.cause?.code;if(codes.has(code))d.code=code;
  if(Number.isInteger(httpStatus)&&httpStatus>=100&&httpStatus<=599)d.httpStatus=httpStatus;
  if(typeof requestId==='string'&&/^(?:[a-f\d]{32}|[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12})$/i.test(requestId))d.requestId=requestId;
  this.diagnostic=Object.freeze(d);
 }
}
export function safeFailure(error,stage='UNKNOWN'){
 if(error instanceof PipelineFailure)return {...error.diagnostic};
 return {...new PipelineFailure(stage,error).diagnostic};
}
export function syncStage(stage,fn,context){try{return fn();}catch(e){throw new PipelineFailure(stage,e,context);}}
