import {renderMedia} from '@remotion/renderer';
import {prepare} from './shared.mjs';
const settings = await prepare();
let lastBucket = -1;
await renderMedia({serveUrl:settings.serveUrl,composition:settings.composition,inputProps:settings.inputProps,browserExecutable:settings.browserExecutable,outputLocation:`out/${settings.outputName}`,codec:'h264',pixelFormat:'yuv420p',crf:18,concurrency:2,onProgress:({progress})=>{const bucket = Math.floor(progress * 10); if(bucket !== lastBucket) { lastBucket = bucket; console.log(`Render ${bucket * 10}%`); }}});
console.log(`MP4 render completed (${settings.narration ? 'voice + synchronized captions' : 'silent captions-only'}).`);
