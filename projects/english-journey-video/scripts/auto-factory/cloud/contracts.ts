// Portable cloud boundary. No credentials or production authority are created here.
import { z } from 'zod';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { canonical } from '../pilot/readiness.mjs';
export const sha = (v: string | Buffer) => createHash('sha256').update(v).digest('hex');
export const hash = (v: unknown) => sha(canonical(v));
export function need(v: unknown, code: string): asserts v { if (!v) throw Error(code); }
const hex = z.string().regex(/^[a-f0-9]{64}$/);
export const IDENTITIES = Object.freeze({
  scriptBytes: '04033938eb32dd5d2f72113863b89b87a8dac8fc4cbc3a694ba43c921abd5afc',
  planPayload: '8487406dca081a9ae91fe0bd9e1fe8602fe32f06e1b784edd3bc7b1a50a19b83',
  planBytes: '6836db73d76ba69f18c9bcac8ea725abef1f6eb3c0bd9e5b0553886c7cb045e8',
});
export async function approvedInputs(root: string) {
  const script = await readFile(resolve(root, 'briefs/english-video-06-candidate-v2.json'));
  const planBytes = await readFile(resolve(root, 'briefs/auto-factory/video06-v2-readiness.json'));
  need(sha(script) === IDENTITIES.scriptBytes && sha(planBytes) === IDENTITIES.planBytes, 'CONTENT_BYTES_MISMATCH');
  const plan = JSON.parse(planBytes.toString()); const { planSha256, ...payload } = plan;
  need(planSha256 === IDENTITIES.planPayload && hash(payload) === IDENTITIES.planPayload, 'PLAN_PAYLOAD_MISMATCH');
  const requests = plan.audition.variants.flatMap((v: any) => v.requests.map((r: any) => ({
    id: `${v.variant}-${r.id}`, ssml: r.ssml, ssmlSha256: r.ssmlSha256, voice: r.voice, language: r.language,
  })));
  need(requests.length === 12 && new Set(requests.map((r: any) => r.id)).size === 12, 'REQUEST_COUNT');
  for (const r of requests) need(sha(r.ssml) === r.ssmlSha256 && ['vi-VN-NamMinhNeural','en-US-AndrewNeural'].includes(r.voice), 'SSML_MISMATCH');
  return requests as Request[];
}
export type Request = { id: string; ssml: string; ssmlSha256: string; voice: string; language: string };
export const Grant = z.strictObject({
  schemaVersion: z.literal(1), scope: z.literal('VIDEO06_V2_CLOUD_PILOT'), productionId: z.literal('video06-v2-audition'),
  // No caller-selected rerun ID/epoch; one immutable pilot identity in durable state.
  scriptBytes: z.literal(IDENTITIES.scriptBytes), planPayload: z.literal(IDENTITIES.planPayload), planBytes: z.literal(IDENTITIES.planBytes),
  buildSha256: hex, resource: z.literal('english-journey-namminh'), region: z.literal('southeastasia'),
  issuedAt: z.iso.datetime(), expiresAt: z.iso.datetime(), pricingExpiresAt: z.iso.datetime(),
  accountEvidenceSha256: hex, pricingTaxEvidenceSha256: hex, storageEvidenceSha256: hex, securityReviewSha256: hex,
  primaryStoreId: z.string().min(1).max(200), anchorStoreId: z.string().min(1).max(200),
  openingLiabilities: z.number().int().nonnegative().max(8000000),
  totalMicrousd: z.literal(10000000), productionMicrousd: z.literal(8000000), reserveMicrousd: z.literal(2000000),
  azureMaxMicrousd: z.literal(30000), aggregateMaxMicrousd: z.literal(80000), maxAttempts: z.literal(1),
  quotes: z.array(z.strictObject({ id: z.string(), ssmlSha256: hex, maximumTaxInclusiveMicrousd: z.number().int().positive().max(30000) })).length(12),
});
export type GrantType = z.infer<typeof Grant>;
export type Trust = { ownerPublicKey: string; reviewerPublicKey: string; buildSha256: string; primaryStoreId: string; anchorStoreId: string };
export type Envelope = { grant: unknown; ownerSignature: string; reviewerSignature: string };
export function authorize(raw: Envelope, trust: Trust, requests: Request[], now: string): GrantType {
  try {
    const grant = Grant.parse(raw.grant), bytes = Buffer.from(canonical(grant));
    const owner = createPublicKey(trust.ownerPublicKey), reviewer = createPublicKey(trust.reviewerPublicKey);
    need(owner.asymmetricKeyType === 'ed25519' && reviewer.asymmetricKeyType === 'ed25519', 'SIGNING_KEYS');
    need(!owner.export({type:'spki',format:'der'}).equals(reviewer.export({type:'spki',format:'der'})), 'INDEPENDENT_REVIEWER_REQUIRED');
    need(verify(null, bytes, owner, Buffer.from(raw.ownerSignature,'base64')) && verify(null, bytes, reviewer, Buffer.from(raw.reviewerSignature,'base64')), 'SIGNATURE_REQUIRED');
    const at = Date.parse(now), issued = Date.parse(grant.issuedAt), end = Date.parse(grant.expiresAt);
    need(Number.isFinite(at) && issued <= at && at < end && end - issued <= 15*60*1000 && at < Date.parse(grant.pricingExpiresAt), 'AUTHORIZATION_EXPIRED');
    need(grant.buildSha256 === trust.buildSha256 && grant.primaryStoreId === trust.primaryStoreId && grant.anchorStoreId === trust.anchorStoreId && grant.primaryStoreId !== grant.anchorStoreId, 'TRUST_BINDING');
    need(new Set(grant.quotes.map(q=>q.id)).size === 12 && requests.length === 12, 'REQUEST_SCOPE');
    for (const r of requests) need(grant.quotes.some(q=>q.id===r.id && q.ssmlSha256===r.ssmlSha256), 'REQUEST_SCOPE');
    const exposure = grant.quotes.reduce((n,q)=>n+q.maximumTaxInclusiveMicrousd,0);
    need(exposure <= grant.azureMaxMicrousd && exposure <= grant.aggregateMaxMicrousd && exposure+grant.openingLiabilities <= grant.productionMicrousd, 'BUDGET_BLOCKED');
    return grant;
  } catch { throw Error('CLOUD_AUTHORIZATION_REJECTED'); }
}
