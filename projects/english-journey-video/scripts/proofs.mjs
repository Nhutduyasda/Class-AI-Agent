import {renderStill} from '@remotion/renderer';
import {prepare} from './shared.mjs';
const settings = await prepare();
for (const [name,frame] of [['hook',0],['middle',450],['end',settings.composition.durationInFrames-1],['before',180],['after',660]]) {
  await renderStill({serveUrl:settings.serveUrl,composition:settings.composition,inputProps:settings.inputProps,browserExecutable:settings.browserExecutable,output:`out/layout-${name}.png`,frame});
  console.log(`Layout proof: ${name}, frame ${frame}`);
}
