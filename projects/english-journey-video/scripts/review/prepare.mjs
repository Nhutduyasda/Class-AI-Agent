// Requires Node 22+ and locally available FFmpeg/ffprobe. No API calls or uploads.
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {inspectProbe,inspectTimeline,evidenceTimes} from './review-utils.mjs';

function parseArgs(args) {
  const allowed=new Set(['candidate','baseline','timeline','brief','output']);
  const out={};
  for(let i=0;i<args.length;i+=2) {
    const a=args[i];
    if(!a?.startsWith('--') || !allowed.has(a.slice(2)) || !args[i+1] || args[i+1].startsWith('--')) throw new Error('Usage: --candidate path.mp4 [--baseline path.mp4] [--timeline path.json] [--brief path.json] [--output out/video-review]');
    if(out[a.slice(2)]) throw new Error('Duplicate option: '+a);
    out[a.slice(2)]=args[i+1];
  }
  if(!out.candidate) throw new Error('Provide --candidate <real.mp4>');
  if(out.brief && !out.timeline) throw new Error('Use --brief together with --timeline for approved copy checks');
  return out;
}
function command(name,args) {
  try {return execFileSync(name,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:12*1024*1024});}
  catch(err) {throw new Error(name+' failed: '+String(err.stderr||err.message).slice(0,1300));}
}
async function loadJson(path) {return path?JSON.parse(await readFile(resolve(path),'utf8')):null;}
async function verifyRealFile(path) {const s=await stat(path);if(!s.isFile() || s.size<1024)throw new Error('Missing/empty media: '+path);}
async function packageOne(label,file,dir,timeline,brief) {
  const full=resolve(file);
  await verifyRealFile(full);
  const probe=JSON.parse(command('ffprobe',['-v','error','-show_streams','-show_format','-of','json',full]));
  const technical=inspectProbe(probe);
  const timing=inspectTimeline(timeline,brief,technical.details.durationSeconds,technical.details.fps||30);
  const issues=[...technical.issues,...timing.issues];
  const mediaDir=join(dir,label);
  await mkdir(mediaDir,{recursive:true});
  const proofs=[];
  if(technical.details.durationSeconds>=1 && probe.streams?.some(s=>s.codec_type==='video')){
    for(const sample of evidenceTimes(timeline,technical.details.durationSeconds,technical.details.fps||30)){
      const image=join(mediaDir,sample.label+'.jpg');
      command('ffmpeg',['-y','-hide_banner','-loglevel','error','-ss',String(sample.timeSeconds),'-i',full,'-frames:v','1','-vf','scale=540:-2',image]);
      await verifyRealFile(image);
      proofs.push({...sample,path:image});
    }
  }
  const audioSamples=[];
  if(probe.streams?.some(s=>s.codec_type==='audio') && technical.details.durationSeconds>=1){
    for(const p of [{name:'opening-audio',start:0},{name:'closing-audio',start:Math.max(0,technical.details.durationSeconds-8)}]){
      const name=join(mediaDir,p.name+'.wav');
      command('ffmpeg',['-y','-hide_banner','-loglevel','error','-ss',String(p.start),'-t','8','-i',full,'-vn','-ac','1','-ar','16000',name]);
      await verifyRealFile(name);
      audioSamples.push({name:p.name,path:name});
    }
  }
  return {input:full,technical:technical.details,timelineStatus:timing.status,technicalStatus:issues.length?'FAIL':'PASS',issues,proofs,audioSamples,editorialStatus:'PENDING REAL VIEWING/LISTENING',publication:'NOT APPROVED'};
}
async function main(){
  const flags=parseArgs(process.argv.slice(2));
  const output=resolve(flags.output||'out/video-review');
  const timeline=await loadJson(flags.timeline),brief=await loadJson(flags.brief);
  await mkdir(output,{recursive:true});
  const candidate=await packageOne('candidate',flags.candidate,output,timeline,brief);
  const baseline=flags.baseline?await packageOne('baseline',flags.baseline,output,null,null):null;
  const report={generatedAt:new Date().toISOString(),candidate,baseline,comparisonStatus:'NOT REVIEWED',publication:'NOT APPROVED',notes:['Objective technical QA is NOT a human/editorial grade.','The reviewer must genuinely watch and listen to entire videos.','No AI or human preference has been inferred from probe metadata.']};
  await writeFile(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  if(baseline){
    const template={reviewer:'',firstPass:{order:['candidate','baseline'],preference:null,watchedEntireVideos:false,listenedToAudio:false,reason:'',evidence:[]},secondPass:{order:['baseline','candidate'],preference:null,watchedEntireVideos:false,listenedToAudio:false,reason:'',evidence:[]},ownerApproval:false};
    await writeFile(join(output,'pairwise-template.json'),JSON.stringify(template,null,2)+'\n');
  }
  console.log(JSON.stringify({report:join(output,'report.json'),candidateStatus:candidate.technicalStatus,baselineStatus:baseline?.technicalStatus??'NOT PROVIDED',candidateProofs:candidate.proofs.length,subjective:'PENDING REAL VIEWING/LISTENING'},null,2));
  if(candidate.technicalStatus!=='PASS'||(baseline&&baseline.technicalStatus!=='PASS')) process.exitCode=2;
}
main().catch(err=>{console.error('Review preparation BLOCKED:',err.message);process.exitCode=1;});
