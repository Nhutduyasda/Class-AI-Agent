import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFps,inspectProbe,inspectTimeline,evidenceTimes,compareTwoPasses} from './review-utils.mjs';
const probe={format:{duration:'65.3'},streams:[{codec_type:'video',codec_name:'h264',width:1080,height:1920,avg_frame_rate:'30/1'},{codec_type:'audio',codec_name:'aac',sample_rate:'48000'}]};
test('30 fps metadata and real AAC video pass technical probe',()=>{
 assert.equal(parseFps('30000/1001').toFixed(3),'29.970');
 assert.deepEqual(inspectProbe(probe).issues,[]);
});
test('missing voice fails rather than pretending delivery is complete',()=>{
 assert.ok(inspectProbe({...probe,streams:probe.streams.slice(0,1)}).issues.some(x=>x.includes('Audio')));
});
test('scene copy must remain exactly owner approved',()=>{
 const scenes=[{type:'hook',startFrame:0,endFrame:30},{type:'cta',startFrame:30,endFrame:60}];
 const timeline={durationInFrames:60,scenes,tokens:[{scene:'hook',text:'Hello'},{scene:'cta',text:'BẮT ĐẦU'}],facts:{original:'x',correction:'y'}};
 const brief={spokenSegments:[{id:'hook',spoken:'Hello'},{id:'cta',spoken:'BẮT ĐẦU'}],approvedEvidence:{original:'x',correction:'y'}};
 assert.equal(inspectTimeline(timeline,brief,2).status,'PASS');
 assert.ok(inspectTimeline(timeline,{...brief,spokenSegments:[{id:'hook',spoken:'Goodbye'},brief.spokenSegments[1]]},2).issues.some(x=>x.includes('Approved words')));
});
test('opening timestamps and stages are included for cold-viewer review',()=>{
 const samples=evidenceTimes({scenes:[{type:'hook',startFrame:0,endFrame:120},{type:'cta',startFrame:120,endFrame:210}]},7);
 assert.ok(samples.some(x=>x.label==='hook-2-5-seconds'));
 assert.ok(samples.some(x=>x.label==='scene-cta'));
});
const pass=(order,preference)=>({order,preference,watchedEntireVideos:true,listenedToAudio:true,reason:'Clearer opening and better narration',evidence:[{timeSec:2.3,observation:'The problem is explicit'}]});
test('two valid reversed comparisons are necessary to declare a winner',()=>{
 const sheet={firstPass:pass(['candidate','baseline'],'candidate'),secondPass:pass(['baseline','candidate'],'candidate')};
 assert.deepEqual(compareTwoPasses(sheet).winner,'candidate');
 assert.equal(compareTwoPasses({...sheet,secondPass:pass(['baseline','candidate'],'baseline')}).status,'INCONCLUSIVE');
 assert.equal(compareTwoPasses({...sheet,secondPass:pass(['candidate','baseline'],'candidate')}).status,'INVALID');
 assert.equal(compareTwoPasses({...sheet,firstPass:{...sheet.firstPass,listenedToAudio:false}}).status,'INCOMPLETE');
});
