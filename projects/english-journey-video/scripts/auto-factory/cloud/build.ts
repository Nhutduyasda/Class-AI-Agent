// Secret-free build measurement; trust root and signatures must originate outside repository.
import { readdir, readFile, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { hash, sha, need } from './contracts.ts';
export const loadedRoot=resolve(import.meta.dirname,'../../..');
export async function captureCloudBuild(root=loadedRoot) {
  const files:{path:string;sha256:string}[]=[];
  async function walk(dir:string, prefix:string) {
    for(const name of (await readdir(dir)).sort()) {
      const absolute=join(dir,name),path=prefix+'/'+name,stat=await lstat(absolute);
      need(!stat.isSymbolicLink(),'BUILD_SYMLINK');
      if(stat.isDirectory()) await walk(absolute,path);
      else {need(stat.isFile(),'BUILD_FILE_TYPE');files.push({path,sha256:sha(await readFile(absolute))});}
    }
  }
  await walk(resolve(root,'scripts/auto-factory/cloud'),'scripts/auto-factory/cloud');
  for(const path of ['scripts/auto-factory/pilot/readiness.mjs','scripts/auto-factory/pilot/prepare.mjs','scripts/auto-factory/pilot/media.ts','scripts/bilingual/core.mjs','package.json','package-lock.json']) {
    need(!(await lstat(resolve(root,path))).isSymbolicLink(),'BUILD_SYMLINK');files.push({path,sha256:sha(await readFile(resolve(root,path)))});
  }
  await walk(resolve(root,'node_modules/zod'),'node_modules/zod');
  return {schemaVersion:1,nodeVersion:process.versions.node,nodeSha256:sha(await readFile(process.execPath)),files};
}
export async function verifyCloudBuild(expected:string,root=loadedRoot) {
  need(process.versions.node==='24.19.0','NODE_VERSION');
  need(hash(await captureCloudBuild(root))===expected && hash(await captureCloudBuild(loadedRoot))===expected,'REVIEWED_CLOUD_BUILD_MISMATCH');
}
