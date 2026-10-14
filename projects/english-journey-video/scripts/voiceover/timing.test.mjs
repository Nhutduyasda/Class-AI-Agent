import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateVoiceManifest} from './validate.mjs';
import {pageAt,voiceSceneAt} from '../../src/voice.ts';

const brief = {facts:{original:'Wrong example',revised:'Correct example.'}};
function fixture() {
  const scenes=['hook','before','teach','after','cta'].map((type,i)=>({type,startFrame:i*240,endFrame:(i+1)*240}));
  const segments=scenes.map((s,i)=>({id:s.type,scene:s.type,text:'Clear speech.',startMs:i*8000+100,endMs:i*8000+2000,speechEndMs:i*8000+1800}));
  const tokens=segments.map(s=>({text:s.text,startMs:s.startMs+100,endMs:s.speechEndMs,segmentId:s.id,scene:s.scene}));
  return {fps:30,durationSeconds:40,durationInFrames:1200,totalSamples:1920000,sampleRate:48000,scenes,segments,tokens,facts:brief.facts,pages:tokens.map(t=>({startMs:t.startMs,endMs:t.endMs,text:t.text,tokens:[t]}))};
}
test('one audio clock keeps a phrase in its outgoing scene and preserves all words',()=>assert.equal(validateVoiceManifest(fixture(),brief),true));
test('reject a scene that changes before the outgoing audio finishes',()=>{
  const m=fixture();m.segments[0].endMs=8100;assert.throws(()=>validateVoiceManifest(m,brief),/Scene cuts/);
});
test('reject subtitles that omit a spoken token',()=>{
  const m=fixture();m.pages.pop();assert.throws(()=>validateVoiceManifest(m,brief),/lost or invented/);
});
test('reject accidental edits to verified English',()=>{
  const m=fixture();m.facts={...m.facts,revised:'Unapproved sentence.'};assert.throws(()=>validateVoiceManifest(m,brief));
});
test('caption time is end-exclusive; interphrase silence has no invented active word',()=>{
  const m=fixture();assert.ok(pageAt(m,200));assert.ok(pageAt(m,1799));assert.equal(pageAt(m,1800),undefined);assert.equal(pageAt(m,2100),undefined);
});
test('scene switch happens on the first frame of the next scene',()=>{
  const m=fixture();assert.equal(voiceSceneAt(m,239).type,'hook');assert.equal(voiceSceneAt(m,240).type,'before');assert.equal(voiceSceneAt(m,1199).type,'cta');
});
