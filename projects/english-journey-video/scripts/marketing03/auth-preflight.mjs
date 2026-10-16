// No fetch, SDK, subprocess or audio generation. Safe to run without approval.
import {credentialReadiness} from './auth.mjs';
const credential=credentialReadiness();
console.log(JSON.stringify({credential,restAuthenticationReadiness:'BLOCKED',reason:credential.ready?'LOCAL_FORMAT_CHECK_ONLY_PROVIDER_AUTH_UNVERIFIED':'SECURE_CREDENTIAL_NOT_AVAILABLE',networkRequests:0,azureTtsRequests:0},null,2));
