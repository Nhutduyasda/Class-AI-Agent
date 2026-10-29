// Portable coordinator. Not a host credential/bootstrap authorization mechanism.
import { authorize, approvedInputs, need, hash, sha, type Envelope, type Trust } from './contracts.ts';
import { CloudLedger } from './ledger.ts';
import { type Store } from './store.ts';
import { type Speech } from './speech.ts';
import { wave } from '../pilot/media.ts';
import { verifyCloudBuild } from './build.ts';
export async function cloudPilot(options:{root:string; envelope:Envelope; trust:Trust; primary:Store; anchor:Store; speech:Speech; now:()=>string}) {
  await verifyCloudBuild(options.trust.buildSha256,options.root);
  const requests=await approvedInputs(options.root), {envelope,trust,primary,anchor,speech,now}=options;
  const grant=authorize(envelope,trust,requests,now()),ledger=new CloudLedger(primary,anchor,grant);
  let state=await ledger.read();let newRequests=0,cached=0;
  for(const request of requests) {
    authorize(envelope,trust,requests,now()); // recheck expiry/price before each request
    state=await ledger.read();const replay=ledger.replay(state.journal),prior=replay.states.get(request.id);
    if(prior?.kind==='RETAINED') {await ledger.cached(request.id,prior.artifactSha256!);cached++;continue;}
    need(!prior && [...replay.states.values()].every(e=>e.kind==='RETAINED'),'RECONCILIATION_REQUIRED_NO_RETRY');
    state=await ledger.append(state,'RESERVED',request.id,now());
    state=await ledger.append(state,'DISPATCHING',request.id,now());
    authorize(envelope,trust,requests,now());
    await verifyCloudBuild(trust.buildSha256,options.root);
    // Concrete production host must bind this port to the reviewed isolated Azure broker.
    // This source does not claim that the host/credential isolation is configured.
    let result;try {newRequests++;result=await speech.send(request);} catch {throw Error('PROVIDER_OUTCOME_UNCERTAIN_NO_RETRY');}
    need(result.ssmlSha256===request.ssmlSha256 && result.voice===request.voice && result.providerRequestId.length>=8,'RESPONSE_PROVENANCE_MISMATCH');
    wave(result.wav);
    const receipt=Buffer.from(JSON.stringify({schemaVersion:1,kind:'RETAINED_HTTP_RESPONSE_NOT_INVOICE',productionId:grant.productionId,
      requestId:request.id,ssmlSha256:request.ssmlSha256,voice:request.voice,language:request.language,
      wavSha256:sha(result.wav),wavBase64:result.wav.toString('base64'),providerRequestId:result.providerRequestId,
      receivedAt:result.receivedAt,maximumTaxInclusiveMicrousd:grant.quotes.find(q=>q.id===request.id)!.maximumTaxInclusiveMicrousd,
      actualBilledMicrousd:null,grantHash:hash(grant),provenance:result.provenance})+'\n');
    const receiptHash=await ledger.retain(request.id,receipt);
    state=await ledger.append(state,'RETAINED',request.id,now(),receiptHash);
  }
  return {productionId:grant.productionId,newRequests,cached,revision:state.journal.events.length,
    maximumOutstandingLiabilityMicrousd:ledger.replay(state.journal).reserved,confirmedInvoiceMicrousd:null,
    technicalProduction:'NOT_EVALUATED',ownerCreativeReview:'PENDING'};
}
