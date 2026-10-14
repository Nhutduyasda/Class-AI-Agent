import {renderMedia} from '@remotion/renderer';
import {prepare} from './shared.mjs';
const settings = await prepare();
let lastBucket = -1;
await renderMedia({serveUrl:settings.serveUrl,composition:settings.composition,inputProps:settings.inputProps,browserExecutable:settings.browserExecutable,outputLocation:`out/${settings.brief.outputName}`,codec:'h264',pixelFormat:'yuv420p',crf:18,concurrency:2,onProgress:({progress})=>{const bucket = Math.floor(progress * 10); if(bucket !== lastBucket) { lastBucket = bucket; console.log(`Render ${bucket * 10}%`); }}});
console.log('\nMP4 render completed (silent captions-only).');
