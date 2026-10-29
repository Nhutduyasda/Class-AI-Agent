import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fixture,NOW} from './fixtures.ts';
import {simulation} from './executor.ts';
import {sha,safeEnv} from './trust.ts';
const f=await fixture(),out=resolve('out/auto-factory-local-preflight');await mkdir(out,{recursive:true});
try{await simulation(f.c,'initialize',{now:NOW});const first=await simulation(f.c,'run',{now:NOW}),resume=await simulation(f.c,'run',{now:NOW});const journal=execFileSync(f.c.tools.git,['--git-dir',f.c.remote,'show','refs/heads/test-local-video06:ledger.json'],{encoding:'utf8',env:safeEnv()}),checkpoint=await readFile(join(f.c.anchor,'mock-checkpoint.json'),'utf8');await writeFile(join(out,'mock-journal.json'),journal);await writeFile(join(out,'mock-checkpoint.json'),checkpoint);await writeFile(join(out,'summary.json'),JSON.stringify({kind:'MOCK_ONLY_LOCAL_GIT_EVIDENCE',codeSha:f.b.codeSha,journalSha256:sha(journal),checkpointSha256:sha(checkpoint),first:{newMockCalls:first.newMockCalls,revision:first.revision,projection:first.projection},resume:{newMockCalls:resume.newMockCalls,cached:resume.cached},physicalIndependence:'NOT_VERIFIED_SAME_LINUX_TEST_FILESYSTEM',productionLedger:'BLOCKED',paidExecutionAllowed:false},null,2)+'\n');console.log(out);}finally{await rm(f.home,{recursive:true,force:true});}
