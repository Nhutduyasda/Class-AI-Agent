import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {compareTwoPasses} from './review-utils.mjs';

function flags(argv){
 const o={};
 for(let i=0;i<argv.length;i+=2) {
   if(!['--input','--output'].includes(argv[i]) || !argv[i+1] || argv[i+1].startsWith('--'))throw Error('Usage: --input pairwise.json [--output comparison.json]');
   if(o[argv[i]])throw Error('Duplicate option');
   o[argv[i]]=argv[i+1];
 }
 if(!o['--input'])throw Error('Missing --input');
 return o;
}
async function main(){
 const args=flags(process.argv.slice(2));
 const data=JSON.parse(await readFile(resolve(args['--input']),'utf8'));
 const result=compareTwoPasses(data);
 const report={...result,comparisonType:'reverse-order human/video-native review',publication:'NOT APPROVED — owner must approve explicitly',ownerApproval:Boolean(data.ownerApproval===true),warning:'Reviewer declarations and observations are user-provided; the script does not watch videos.'};
 const path=resolve(args['--output']||'out/video-review/comparison.json');
 await mkdir(dirname(path),{recursive:true});
 await writeFile(path,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(result.status!=='CONSENSUS')process.exitCode=2;
}
main().catch(e=>{console.error('Comparison BLOCKED:',e.message);process.exitCode=1;});
