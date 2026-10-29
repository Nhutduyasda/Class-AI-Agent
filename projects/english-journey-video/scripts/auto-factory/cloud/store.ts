// Remote conditional store. No SDK, shell, install, renderer or dynamic endpoint.
import { createHash } from 'node:crypto';
import { need, sha } from './contracts.ts';
export type Versioned = { version: string; bytes: Buffer };
export interface Store {
  readonly id: string;
  read(key: string): Promise<Versioned | null>;
  history(key: string): Promise<(Versioned | null)[]>;
  create(key: string, bytes: Buffer): Promise<Versioned>;
  replace(key: string, version: string, bytes: Buffer): Promise<Versioned>;
}
const keyCheck = (key: string) => need(/^[a-z0-9][a-z0-9/-]{0,180}\.json$/.test(key) && !key.includes('..'), 'STORE_KEY');
const gitBlob = (bytes: Buffer) => createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
export class GitHubPrivateStore implements Store {
  readonly id: string;
  #token: string;
  #base: string;
  #branch: string;
  #commits:string[];
  #pending:Promise<string[]>|undefined;
  #cache=new Map<string,Versioned|null>();
  constructor(repository: string, branch: string, rootCommit:string, token: string) {
    need(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) && /^[a-z][a-z0-9-]{0,62}$/.test(branch), 'STORE_TARGET');
    need(token.length > 0 && /^[a-f0-9]{40}$/.test(rootCommit), 'STORE_CREDENTIAL_AND_ROOT_REQUIRED');
    this.#commits=[rootCommit];
    this.id = `github:${repository}:${branch}:${rootCommit}`; this.#base=`https://api.github.com/repos/${repository}`;
    this.#branch=branch; this.#token=token;
  }
  async #call(path: string, method='GET', body?: unknown, absent=false): Promise<any> {
    try {
      const r=await fetch(this.#base+path,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{
        Authorization:`Bearer ${this.#token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
        ...(body ? {'Content-Type':'application/json'} : {}),
      },...(body ? {body:JSON.stringify(body)} : {})});
      if(absent && r.status===404) return null;
      need(r.ok,'STORE_HTTP'); let text='';need(r.body,'STORE_RESPONSE_BODY');for await(const part of r.body as any){text+=Buffer.from(part).toString('utf8');need(text.length<=24*1024*1024,'STORE_RESPONSE_LIMIT');}
      return JSON.parse(text);
    } catch { throw Error('REMOTE_STORE_UNAVAILABLE_OR_CONFLICT'); }
  }
  async #private() {
    const repo=await this.#call(''); need(repo.private===true,'PRIVATE_REPOSITORY_REQUIRED');
    const branch=await this.#call(`/branches/${this.#branch}`); need(branch.protected===true,'PROTECTED_STATE_BRANCH_REQUIRED');
    const p=await this.#call(`/branches/${this.#branch}/protection`);
    need(p.allow_force_pushes?.enabled===false && p.allow_deletions?.enabled===false && p.enforce_admins?.enabled===true,'STATE_PROTECTION_INSUFFICIENT');
    need(/^[a-f0-9]{40}$/.test(branch.commit?.sha),'STATE_COMMIT');return branch.commit.sha as string;
  }
  async #lineage():Promise<string[]> {
    if(this.#pending) return this.#pending;
    const operation=(async()=>{
      const head=await this.#private(),base=this.#commits.at(-1)!;
      if(head!==base) {
        const comparison=await this.#call(`/compare/${base}...${head}`);
        need(comparison.status==='ahead' && comparison.behind_by===0 && comparison.commits?.length===comparison.total_commits && comparison.total_commits<=250,'STATE_HISTORY_INCOMPLETE_OR_REWOUND');
        let parent=base; const next:string[]=[];
        for(const commit of comparison.commits) {need(commit.parents?.length===1 && commit.parents[0].sha===parent && /^[a-f0-9]{40}$/.test(commit.sha),'STATE_HISTORY_NOT_LINEAR');parent=commit.sha;next.push(parent);}
        need(parent===head,'STATE_HISTORY_HEAD');this.#commits.push(...next);
      }
      return [...this.#commits];
    })();
    this.#pending=operation;
    try{return await operation;}finally{this.#pending=undefined;}
  }
  async #at(key:string,commit:string):Promise<Versioned|null> {
    const cacheKey=commit+':'+key;if(this.#cache.has(cacheKey))return this.#cache.get(cacheKey)!;
    let x=await this.#call(`/contents/${key}?ref=${commit}`,'GET',undefined,true);
    if(!x) {this.#cache.set(cacheKey,null);return null;}
    need(x.type==='file' && /^[a-f0-9]{40}$/.test(x.sha) && x.size<=12*1024*1024,'STORE_CONTENT');
    const expected=x.sha;
    if(x.encoding!=='base64') x=await this.#call(`/git/blobs/${expected}`);
    need(x.encoding==='base64' && typeof x.content==='string','STORE_BLOB_ENCODING');
    const bytes=Buffer.from(x.content.replace(/\s/g,''),'base64');need(bytes.length<=12*1024*1024 && gitBlob(bytes)===expected,'STORE_CONTENT_HASH');
    const value={version:expected,bytes};this.#cache.set(cacheKey,value);return value;
  }
  async read(key:string):Promise<Versioned|null> {keyCheck(key);return this.#at(key,(await this.#lineage()).at(-1)!);}
  async history(key:string):Promise<(Versioned|null)[]> {
    keyCheck(key);const values:(Versioned|null)[]=[];
    for(const commit of await this.#lineage()) values.push(await this.#at(key,commit));
    return values;
  }
  async #write(key:string, bytes:Buffer, version?:string) {
    keyCheck(key); need(bytes.length<=12*1024*1024,'STORE_OBJECT_LIMIT'); await this.#private();
    // Contents API conditions update on the exact previous blob SHA; never force, retry or create a ref.
    await this.#call(`/contents/${key}`,'PUT',{message:'Factory immutable evidence/state update',branch:this.#branch,content:bytes.toString('base64'),...(version?{sha:version}:{})});
    const saved=await this.read(key); need(saved && sha(saved.bytes)===sha(bytes),'STORE_ACK_UNCERTAIN'); return saved;
  }
  create(key:string, bytes:Buffer) { return this.#write(key,bytes); }
  replace(key:string, version:string, bytes:Buffer) { need(/^[a-f0-9]{40}$/.test(version),'STORE_VERSION'); return this.#write(key,bytes,version); }
}
export async function putExact(store:Store,key:string,bytes:Buffer) {
  const old=await store.read(key); if(old) {need(old.bytes.equals(bytes),'IMMUTABLE_OBJECT_CHANGED'); return old;}
  return store.create(key,bytes);
}
