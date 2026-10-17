import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {makePlan} from './core.mjs';
export async function preparePlan(briefPath,outputPath,mode) {
  const bytes=await readFile(briefPath),brief=JSON.parse(bytes);
  const profile=JSON.parse(await readFile('config/bilingual-voice.json','utf8'));
  const pricing=JSON.parse(await readFile('config/bilingual-neural-price.json','utf8'));
  const briefRelativePath=relative(process.cwd(),resolve(briefPath)).replaceAll('\\','/');
  if(!briefRelativePath.startsWith('briefs/')||briefRelativePath.includes('../'))throw Error('BRIEF_MUST_BE_UNDER_PROJECT_BRIEFS');
  const plan=makePlan(brief,bytes,profile,pricing,{mode:mode??profile.mode,briefRelativePath});
  await mkdir(dirname(resolve(outputPath)),{recursive:true});
  await writeFile(outputPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
  return plan;
}
async function main(){
  const [brief,output,mode]=process.argv.slice(2);
  if(!brief||!output)throw Error('Usage: node scripts/bilingual/plan.mjs <approved.json> <new-plan.json> [multivoice|split]');
  const plan=await preparePlan(brief,output,mode);
  console.log(JSON.stringify({mode:'OFFLINE_NO_TTS',productionId:plan.productionId,planSha256:plan.planSha256,requests:plan.requestCount,textCodepoints:plan.textCodepoints,billableCharacters:plan.billableCharacters,estimatedUsd:plan.estimatedUsd,languageWarnings:plan.warnings,liveSynthesisAllowed:false},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
