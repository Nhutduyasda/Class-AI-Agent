// Offline authentication contract. Never obtains credentials or makes network calls.
export const ENTRA_SCOPE='https://cognitiveservices.azure.com/.default';
const audience='https://cognitiveservices.azure.com';
const resourcePattern=/^\/subscriptions\/[0-9a-f-]{36}\/resourceGroups\/[\w.()-]+\/providers\/Microsoft\.CognitiveServices\/accounts\/english-journey-namminh$/i;
const secretNames=['SPEECH_KEY','SPEECH_STS_TOKEN','SPEECH_ENTRA_ACCESS_TOKEN','SPEECH_BEARER_TOKEN'];
function safeValue(value){return typeof value==='string'&&value.length>0&&value.length<20000&&!/[\s\x00-\x1f\x7f]/.test(value);}
function checked(env,now){
 const present=secretNames.filter(k=>Boolean(env[k]));
 if(present.length!==1)throw Error(present.length?'AMBIGUOUS_CREDENTIALS':'CREDENTIAL_MISSING');
 if(present[0]==='SPEECH_BEARER_TOKEN')throw Error('LEGACY_BEARER_TYPE_UNSPECIFIED');
 const mode=env.SPEECH_AUTH_MODE||(present[0]==='SPEECH_KEY'?'key':'');
 const expected={key:'SPEECH_KEY',sts:'SPEECH_STS_TOKEN',entra:'SPEECH_ENTRA_ACCESS_TOKEN'}[mode];
 if(!expected||present[0]!==expected)throw Error('AUTH_MODE_MISMATCH');
 const token=env[expected];if(!safeValue(token))throw Error('CREDENTIAL_FORMAT_INVALID');
 if(mode==='key')return {mode,headers:{'Ocp-Apim-Subscription-Key':token}};
 if(mode==='sts'){
  if(env.SPEECH_STS_ORIGIN!=='https://southeastasia.api.cognitive.microsoft.com')throw Error('STS_ORIGIN_MISMATCH');
  const expires=Date.parse(env.SPEECH_STS_EXPIRES_AT);
  if(!Number.isFinite(expires)||expires<=now+60000||expires>now+600000)throw Error('STS_EXPIRY_INVALID');
  return {mode,headers:{Authorization:'Bearer '+token}};
 }
 if(!resourcePattern.test(env.SPEECH_RESOURCE_ID||''))throw Error('ENTRA_RESOURCE_ID_INVALID');
 if(!/^[a-z0-9][a-z0-9-]*\.cognitiveservices\.azure\.com$/.test(env.SPEECH_CUSTOM_SUBDOMAIN||''))throw Error('ENTRA_CUSTOM_SUBDOMAIN_REQUIRED');
 let claims;
 try{const parts=token.split('.');if(parts.length!==3||parts.some(x=>!x))throw Error();claims=JSON.parse(Buffer.from(parts[1],'base64url'));}catch{throw Error('ENTRA_TOKEN_FORMAT_INVALID');}
 const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(!audiences.some(x=>x===audience||x===audience+'/'))throw Error('ENTRA_AUDIENCE_INVALID');
 if(!Number.isFinite(claims.exp)||claims.exp*1000<=now+60000||claims.nbf&&claims.nbf*1000>now+30000)throw Error('ENTRA_TOKEN_TIME_INVALID');
 // Decoding claims is a sanity check, NOT signature, RBAC or provider validation.
 return {mode,headers:{Authorization:'Bearer aad#'+env.SPEECH_RESOURCE_ID+'#'+token}};
}
export function credentialReadiness(env=process.env,now=Date.now()){
 const presence={keyPresent:Boolean(env.SPEECH_KEY),stsPresent:Boolean(env.SPEECH_STS_TOKEN),entraPresent:Boolean(env.SPEECH_ENTRA_ACCESS_TOKEN),bearerPresent:Boolean(env.SPEECH_BEARER_TOKEN)};
 try{const {mode}=checked(env,now);return {...presence,mode,ready:true,validation:'OFFLINE_FORMAT_ONLY',providerValidated:false,valuesLogged:false};}
 catch(e){return {...presence,mode:null,ready:false,reason:e.message,providerValidated:false,valuesLogged:false};}
}
// Keep returned headers in memory only. Never serialize this return value.
export function authenticationHeaders(env=process.env,now=Date.now()){return checked(env,now).headers;}
