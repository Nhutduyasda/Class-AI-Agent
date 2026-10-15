import os from 'node:os';
// Work sandbox may deny interface enumeration; use local loopback for render server.
try { os.networkInterfaces(); } catch { os.networkInterfaces=()=>({lo:[{address:'127.0.0.1',family:'IPv4',internal:true,netmask:'255.0.0.0',mac:'00:00:00:00:00:00',cidr:'127.0.0.1/8'}]}); }
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const timeline=JSON.parse(await readFile('public/marketing02/manifest.json','utf8'));
const briefBytes=await readFile('briefs/marketing-video-02-approved.json');
if(createHash('sha256').update(briefBytes).digest('hex')!==timeline.briefSha256)throw new Error('Approved brief changed; rebuild Video 02.');
for(const s of JSON.parse(briefBytes).spokenSegments){if(timeline.tokens.filter(t=>t.scene===s.id).map(t=>t.text).join(' ')!==s.spoken)throw new Error('Narration differs from locked copy: '+s.id);}
const serveUrl=await bundle({entryPoint:path.resolve('src/marketing02-index.tsx'),publicDir:path.resolve('public')});
const inputProps={timeline};const composition=await selectComposition({serveUrl,id:'EnglishJourneyMarketing02',inputProps});
await mkdir('out/marketing02/proofs',{recursive:true});
if(process.argv.includes('--proofs')){
 const frames=[['opening',0],['hook-2-5',75],...timeline.scenes.map(s=>[s.type,Math.floor((s.startFrame+s.endFrame)/2)]),['ending',timeline.durationInFrames-1]];
 for(const [name,frame] of frames){await renderStill({serveUrl,composition,inputProps,frame,output:`out/marketing02/proofs/${name}.png`});console.log(name,frame);}
}else{
 let last=-1;await renderMedia({serveUrl,composition,inputProps,outputLocation:'out/marketing02/English-Journey-Marketing-02.mp4',codec:'h264',audioCodec:'aac',audioBitrate:'192k',pixelFormat:'yuv420p',crf:18,concurrency:2,onProgress:({progress})=>{const n=Math.floor(progress*10);if(n!==last){console.log(`Render ${n*10}%`);last=n;}}});
}
