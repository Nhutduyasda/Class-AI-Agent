// New cloud journal; the Gate2 OFFLINE_SIMULATION_ONLY authority is untouched.
import { z } from 'zod';
import { need, hash, sha, type GrantType } from './contracts.ts';
import { type Store, type Versioned, putExact } from './store.ts';
const hex=z.string().regex(/^[a-f0-9]{64}$/);
const Event=z.strictObject({kind:z.enum(['RESERVED','DISPATCHING','RETAINED']),requestId:z.string(),at:z.iso.datetime(),maximumMicrousd:z.number().int().positive(),artifactSha256:hex.nullable(),previous:hex,hash:hex});
const Journal=z.strictObject({schemaVersion:z.literal(1),scope:z.literal('CLOUD_PILOT_V1'),productionId:z.literal('video06-v2-audition'),grantHash:hex,events:z.array(Event).max(36)});
const Anchor=z.strictObject({schemaVersion:z.literal(1),grantHash:hex,revision:z.number().int().min(0).max(36),headHash:hex});
export type JournalType=z.infer<typeof Journal>;
export type State={journal:JournalType; version:string; anchorVersion:string; head:string};
const KEY='video06-v2/journal.json', CHECKPOINT='video06-v2/checkpoint.json';
const encode=(v:unknown)=>Buffer.from(JSON.stringify(v)+'\n');
export class CloudLedger {
  readonly primary:Store; readonly anchor:Store; readonly grant:GrantType;
  constructor(primary:Store,anchor:Store,grant:GrantType) {
    this.primary=primary;this.anchor=anchor;this.grant=grant;
    need(primary.id===grant.primaryStoreId && anchor.id===grant.anchorStoreId && primary.id!==anchor.id,'INDEPENDENT_STORES_REQUIRED');
    if(primary.id.startsWith('github:') && anchor.id.startsWith('github:')) need(primary.id.split(':')[1]!==anchor.id.split(':')[1],'INDEPENDENT_REPOSITORIES_REQUIRED');
  }
  replay(raw:unknown) {
    const j=Journal.parse(raw); need(j.grantHash===hash(this.grant),'JOURNAL_AUTHORITY_MISMATCH');
    let prev=hash({schemaVersion:1,grantHash:j.grantHash,productionId:j.productionId});
    const states=new Map<string,z.infer<typeof Event>>();let reserved=0;
    for(const e of j.events) {
      const {hash:claimed,...payload}=e; need(e.previous===prev && hash(payload)===claimed,'JOURNAL_CHAIN');
      const q=this.grant.quotes.find(q=>q.id===e.requestId);need(q && q.maximumTaxInclusiveMicrousd===e.maximumMicrousd,'JOURNAL_QUOTE');
      const prior=states.get(e.requestId);
      need(e.kind==='RESERVED' ? !prior : e.kind==='DISPATCHING' ? prior?.kind==='RESERVED' : prior?.kind==='DISPATCHING','INVALID_TRANSITION');
      need((e.kind==='RETAINED') === (e.artifactSha256!==null),'JOURNAL_ARTIFACT');
      // Sequential pilot: unresolved earlier attempts cannot be bypassed with another request ID.
      if(e.kind==='RESERVED') {need([...states.values()].every(s=>s.kind==='RETAINED'),'GLOBAL_AMBIGUITY_LATCH'); reserved+=e.maximumMicrousd;}
      states.set(e.requestId,e);prev=claimed;
    }
    need(reserved<=this.grant.azureMaxMicrousd && reserved<=this.grant.aggregateMaxMicrousd && reserved+this.grant.openingLiabilities<=this.grant.productionMicrousd,'JOURNAL_BUDGET');
    return {j,head:prev,states,reserved};
  }
  async initialize() {
    need(await this.primary.read(KEY)===null && await this.anchor.read(CHECKPOINT)===null,'EXISTING_AUTHORITY_NO_RESET');
    const journal:JournalType={schemaVersion:1,scope:'CLOUD_PILOT_V1',productionId:'video06-v2-audition',grantHash:hash(this.grant),events:[]};
    const replay=this.replay(journal);await this.primary.create(KEY,encode(journal));
    await putExact(this.anchor,`video06-v2/journals/${replay.head}.json`,encode(journal));
    await this.anchor.create(CHECKPOINT,encode({schemaVersion:1,grantHash:journal.grantHash,revision:0,headHash:replay.head}));
    return this.read();
  }
  async read():Promise<State> {
    // Inspect every immutable Git snapshot since each externally pinned root.
    // A fast-forward commit restoring BOTH current files is still a history regression.
    const journalHistory=await this.primary.history(KEY),anchorHistory=await this.anchor.history(CHECKPOINT);
    let priorJournal:JournalType|undefined,priorAnchor:z.infer<typeof Anchor>|undefined;
    for(const entry of journalHistory) {
      if(!entry){need(!priorJournal,'JOURNAL_HISTORY_DELETED');continue;}
      const current=this.replay(JSON.parse(entry.bytes.toString())).j;
      if(priorJournal) need(current.events.length>=priorJournal.events.length && hash(current.events.slice(0,priorJournal.events.length))===hash(priorJournal.events),'JOURNAL_HISTORY_REWOUND');
      priorJournal=current;
    }
    for(const entry of anchorHistory) {
      if(!entry){need(!priorAnchor,'CHECKPOINT_HISTORY_DELETED');continue;}
      const current=Anchor.parse(JSON.parse(entry.bytes.toString()));need(current.grantHash===hash(this.grant),'CHECKPOINT_AUTHORITY');
      if(priorAnchor) need(current.revision>=priorAnchor.revision && (current.revision!==priorAnchor.revision || current.headHash===priorAnchor.headHash),'CHECKPOINT_HISTORY_REWOUND');
      priorAnchor=current;
    }
    const p=await this.primary.read(KEY),a=await this.anchor.read(CHECKPOINT);need(p && a,'PRODUCTION_AUTHORITY_MISSING');
    need(journalHistory.at(-1)?.bytes.equals(p.bytes) && anchorHistory.at(-1)?.bytes.equals(a.bytes),'HISTORY_CHANGED_DURING_READ');
    const {j,head}=this.replay(JSON.parse(p.bytes.toString())),checkpoint=Anchor.parse(JSON.parse(a.bytes.toString()));
    need(checkpoint.grantHash===j.grantHash && checkpoint.revision===j.events.length && checkpoint.headHash===head,'CHECKPOINT_DIVERGED_RECONCILE');
    const backup=await this.anchor.read(`video06-v2/journals/${head}.json`);need(backup && backup.bytes.equals(p.bytes),'JOURNAL_BACKUP_MISSING_OR_CHANGED');
    return {journal:j,version:p.version,anchorVersion:a.version,head};
  }
  async append(before:State,kind:z.infer<typeof Event>['kind'],requestId:string,at:string,artifactSha256:string|null=null) {
    const q=this.grant.quotes.find(q=>q.id===requestId);need(q,'UNAPPROVED_REQUEST');
    const payload={kind,requestId,at,maximumMicrousd:q.maximumTaxInclusiveMicrousd,artifactSha256,previous:before.head};
    const journal={...before.journal,events:[...before.journal.events,{...payload,hash:hash(payload)}]}; const projected=this.replay(journal);
    await this.primary.replace(KEY,before.version,encode(journal));
    await putExact(this.anchor,`video06-v2/journals/${projected.head}.json`,encode(journal));
    // Acknowledgement in a different remote repository precedes any provider dispatch.
    await this.anchor.replace(CHECKPOINT,before.anchorVersion,encode({schemaVersion:1,grantHash:journal.grantHash,revision:journal.events.length,headHash:projected.head}));
    const actual=await this.read();need(actual.head===projected.head,'DURABLE_ACK_UNCERTAIN');return actual;
  }
  async retain(requestId:string,receipt:Buffer) {
    const digest=hash({receiptSha256:(await import('./contracts.ts')).sha(receipt)});
    const key=`video06-v2/receipts/${requestId}.json`;
    await putExact(this.primary,key,receipt);await putExact(this.anchor,key,receipt);
    const p=await this.primary.read(key),a=await this.anchor.read(key);need(p && a && p.bytes.equals(receipt) && a.bytes.equals(receipt),'MEDIA_BACKUP_ACK');
    return digest;
  }
  async exportRecovery(independentlyRetainedCheckpointSha256:string) {
    need(/^[a-f0-9]{64}$/.test(independentlyRetainedCheckpointSha256),'INDEPENDENT_CHECKPOINT_HASH_REQUIRED');
    const retained=await this.anchor.read(CHECKPOINT);need(retained && sha(retained.bytes)===independentlyRetainedCheckpointSha256,'RECOVERY_CHECKPOINT_HASH');
    const checkpoint=Anchor.parse(JSON.parse(retained.bytes.toString()));need(checkpoint.grantHash===hash(this.grant),'RECOVERY_AUTHORITY');
    const backup=await this.anchor.read(`video06-v2/journals/${checkpoint.headHash}.json`);need(backup,'RECOVERY_JOURNAL_MISSING');
    const replay=this.replay(JSON.parse(backup.bytes.toString()));need(replay.head===checkpoint.headHash && replay.j.events.length===checkpoint.revision,'RECOVERY_JOURNAL_HASH');
    const files:{key:string;bytes:Buffer}[]=[{key:KEY,bytes:backup.bytes},{key:CHECKPOINT,bytes:retained.bytes}];
    for(const event of replay.states.values()) if(event.kind==='RETAINED') {
      const key=`video06-v2/receipts/${event.requestId}.json`,receipt=await this.anchor.read(key);
      need(receipt && hash({receiptSha256:sha(receipt.bytes)})===event.artifactSha256,'RECOVERY_RECEIPT_HASH');files.push({key,bytes:receipt.bytes});
    }
    return {kind:'VERIFIED_BACKUP_EXPORT_NOT_SPENDING_AUTHORITY',files,manifest:files.map(f=>({key:f.key,sha256:sha(f.bytes)}))};
  }
  async cached(requestId:string,expectedHash:string) {
    const key=`video06-v2/receipts/${requestId}.json`,p=await this.primary.read(key),a=await this.anchor.read(key);
    need(p && a && p.bytes.equals(a.bytes),'RECEIPT_OR_BACKUP_MISSING');
    need(hash({receiptSha256:(await import('./contracts.ts')).sha(p.bytes)})===expectedHash,'RECEIPT_TAMPER');return p.bytes;
  }
}
