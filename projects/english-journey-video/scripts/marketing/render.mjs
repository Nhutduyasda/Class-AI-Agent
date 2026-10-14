import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const timeline=JSON.parse(await readFile('public/marketing/manifest.json','utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
if(hash(await readFile('scripts/marketing/build.py'))!==timeline.builderSha256 || hash(await readFile('briefs/marketing-video-01-approved.json'))!==timeline.briefSha256) throw new Error('Stale Marketing. Build audio again.');
const serveUrl=await bundle({entryPoint:path.resolve('src/marketing-index.tsx'),publicDir:path.resolve('public')});
const inputProps={timeline};const browserExecutable=process.env.CHROME_PATH||undefined;
const composition=await selectComposition({serveUrl,id:'EnglishJourneyMarketing01',inputProps,browserExecutable});
const proofFrames=timeline.scenes.flatMap(s=>s.type==='demo'?[['demo-before',s.startFrame+60],['demo-after',timeline.events.find(e=>e.kind==='complete').frame+30]]:[[s.type,s.startFrame+(s.type==='hook'?0:120)]]);
if(process.argv.includes('--proofs')){
 for(const [name,frame] of proofFrames){await renderStill({serveUrl,composition,inputProps,browserExecutable,frame,output:`out/marketing-layout-${name}.png`});console.log(`Proof ${name}: ${frame}`);}
}else{
 let last=-1;
 await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:'out/english-journey-marketing-video-01.mp4',codec:'h264',audioCodec:'aac',audioBitrate:'192k',pixelFormat:'yuv420p',crf:18,concurrency:2,onProgress:({progress})=>{const b=Math.floor(progress*10);if(b!==last){last=b;console.log(`Marketing render ${b*10}%`);}}});
 console.log('Marketing actual MP4 rendered. Human listening/approval remains pending.');
}
