import {execFileSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
import {validateVoiceManifest} from './voiceover/validate.mjs';
import assert from 'node:assert/strict';
const manifest = JSON.parse(readFileSync('public/voice/lesson15-writing-retry-voice/manifest.json','utf8'));
const brief = JSON.parse(readFileSync(manifest.sourceBrief,'utf8'));
validateVoiceManifest(manifest,brief);
const file = `out/${manifest.id}.mp4`;
const probe = JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
const video = probe.streams.find(s=>s.codec_type==='video');
const audio = probe.streams.find(s=>s.codec_type==='audio');
assert.ok(audio,'Missing audio stream');assert.equal(audio.codec_name,'aac');
assert.equal(video.width,1080);assert.equal(video.height,1920);assert.equal(video.avg_frame_rate,'30/1');
assert.equal(Number(video.nb_read_frames),manifest.durationInFrames);assert.equal(video.pix_fmt,'yuv420p');
assert.ok(Math.abs(Number(probe.format.duration)-manifest.durationSeconds)<.05);
assert.ok(Math.abs(Number(audio.duration)-manifest.durationSeconds)<.05,'Audio ends early or extends past video');
execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'pipe'});
const {spawnSync} = await import('node:child_process');
const measured=spawnSync('ffmpeg',['-hide_banner','-i',file,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'],{encoding:'utf8'});
assert.equal(measured.status,0);
const loudness=JSON.parse(measured.stderr.slice(measured.stderr.lastIndexOf('{')));
assert.ok(Number(loudness.input_i)>=-18 && Number(loudness.input_i)<=-14,`Loudness ${loudness.input_i}`);
assert.ok(Number(loudness.input_tp)<=-.5,`Peak ${loudness.input_tp}`);
execFileSync('ffmpeg',['-v','error','-y','-i',file,'-vn','-ar','48000','-ac','1','-c:a','pcm_s16le',`out/${manifest.id}-decoded.wav`]);
const times = [['hook',Math.floor((manifest.tokens[0].startMs+100)*.03)],
  ['middle',Math.floor((manifest.tokens.find(t=>t.segmentId==='teach-vi').startMs+100)*.03)],
  ['after',Math.floor((manifest.tokens.find(t=>t.segmentId==='after-en').startMs+600)*.03)],
  ['spoken-end',Math.floor((manifest.tokens.at(-1).startMs+80)*.03)],['end',manifest.durationInFrames-1]];
for(const [name,frame] of times) {
  execFileSync('ffmpeg',['-v','error','-y','-i',file,'-vf',`select=eq(n\\,${frame})`,'-frames:v','1',`out/proof-voice-${name}.png`]);
}
const result={technicalStatus:'PASS',listeningStatus:'BLOCKED: this agent runtime does not support audio input',
  probe,loudness,wordBoundaries:manifest.tokens.length,subtitlePages:manifest.pages.length,
  decodedFrames:Number(video.nb_read_frames),proofFrames:Object.fromEntries(times)};
writeFileSync('out/voice-technical-qa.json',JSON.stringify(result,null,2)+'\n');
console.log(`TECHNICAL PASS: ${video.width}x${video.height}, 30 FPS, ${probe.format.duration}s, ${video.nb_read_frames} frames, AAC ${audio.sample_rate} Hz, ${loudness.input_i} LUFS, ${loudness.input_tp} dBTP. Listening gate remains BLOCKED.`);
