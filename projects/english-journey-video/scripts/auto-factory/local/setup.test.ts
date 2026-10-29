import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {readFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fixture} from './fixtures.ts';
import {safeEnv} from './trust.ts';
test('credential-free setup and mock CLI initialize against a clean isolated checkout',async()=>{const f=await fixture();try{const work=join(f.home,'cli-work');const args=[join(import.meta.dirname,'setup.ts'),f.c.root,join(f.home,'cli-media'),join(f.home,'cli-backup'),join(f.home,'cli-anchor'),work,f.c.tools.git,f.c.tools.ffmpeg];const config=execFileSync(process.execPath,args,{encoding:'utf8',env:safeEnv()}).trim();assert.equal(config,join(work,'mock-config.json'));const a=JSON.parse(await readFile(join(work,'mock-authorization.json'),'utf8'));assert.equal(a.scope,'MOCK_ONLY_NOT_OWNER_APPROVAL');assert.equal(a.paidExecutionAllowed,false);assert.equal(a.maxRequests,12);const output=JSON.parse(execFileSync(process.execPath,[join(import.meta.dirname,'cli.ts'),'initialize-mock',config],{encoding:'utf8',env:safeEnv()}));assert.equal(output.newMockCalls,0);assert.equal(output.paidExecutionAllowed,false);assert.throws(()=>execFileSync(process.execPath,args,{stdio:'pipe',env:safeEnv()}));}finally{await rm(f.home,{recursive:true,force:true});}});
