import {renderStill} from '@remotion/renderer';
import {prepare} from './shared.mjs';
const settings = await prepare();
for (const [name,frame] of [['hook',settings.narration ? Math.round(settings.narration.tokens[0].startMs * .03) + 2 : 0],['middle',settings.narration ? Math.round((settings.narration.tokens.find(t=>t.segmentId==='teach-vi').startMs+100)*.03) : 450],['end',settings.composition.durationInFrames-1],['before',settings.narration ? settings.narration.scenes[1].startFrame + 60 : 180],['after',settings.narration ? Math.round(settings.narration.tokens.find(t=>t.segmentId==='after-en').startMs*.03)+50 : 660]]) {
  await renderStill({serveUrl:settings.serveUrl,composition:settings.composition,inputProps:settings.inputProps,browserExecutable:settings.browserExecutable,output:`out/layout-${settings.narration ? 'voice-' : ''}${name}.png`,frame});
  console.log(`Layout proof: ${name}, frame ${frame}`);
}
