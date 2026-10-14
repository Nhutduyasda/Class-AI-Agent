import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const timeline=JSON.parse(await readFile('public/v2/manifest.json','utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
if(hash(await readFile('scripts/v2/build.py'))!==timeline.builderSha256 || hash(await readFile('briefs/lesson15-v2-production.json'))!==timeline.planSha256 || hash(await readFile('briefs/pilot-lesson15.json'))!==timeline.sourceBriefSha256) throw new Error('Stale V2. Build audio again.');
const serveUrl=await bundle({entryPoint:path.resolve('src/v2-index.tsx'),publicDir:path.resolve('public')});
const inputProps={timeline};const browserExecutable=process.env.CHROME_PATH||undefined;
const composition=await selectComposition({serveUrl,id:'EnglishJourneyV2',inputProps,browserExecutable});
const proofFrames=[['opening',10],['mistakes',timeline.events.filter(e=>e.kind==='spell')[1].frame+20],['bridge',timeline.events.find(e=>e.kind==='bridge').frame+30],['fullfix',timeline.scenes[3].startFrame+100],['cta',timeline.scenes[4].startFrame+50]];
if(process.argv.includes('--proofs')){
 for(const [name,frame] of proofFrames){await renderStill({serveUrl,composition,inputProps,browserExecutable,frame,output:`out/v2-layout-${name}.png`});console.log(`Proof ${name}: ${frame}`);}
}else{
 let last=-1;
 await renderMedia({serveUrl,composition,inputProps,browserExecutable,outputLocation:'out/lesson15-writing-retry-v2.mp4',codec:'h264',audioCodec:'aac',audioBitrate:'192k',pixelFormat:'yuv420p',crf:18,concurrency:2,onProgress:({progress})=>{const b=Math.floor(progress*10);if(b!==last){last=b;console.log(`V2 render ${b*10}%`);}}});
 console.log('V2 actual MP4 rendered. Human listening/approval remains pending.');
}
