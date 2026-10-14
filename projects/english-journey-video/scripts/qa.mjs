import {execFileSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const brief = JSON.parse(readFileSync(process.argv[2] ?? 'briefs/pilot-lesson15.json','utf8'));
const file = `out/${brief.outputName}`;
const probe = JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
const video = probe.streams.find(s=>s.codec_type==='video');
assert.equal(video.width,1080); assert.equal(video.height,1920);
assert.equal(video.avg_frame_rate,'30/1'); assert.equal(video.nb_read_frames,String(brief.targetDurationSeconds*30));
assert.ok(Math.abs(Number(probe.format.duration)-brief.targetDurationSeconds)<.05);
assert.equal(video.pix_fmt,'yuv420p');
assert.ok(!probe.streams.some(s=>s.codec_type==='audio'),'This pilot is explicitly silent');
execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'pipe'});
// Proofs are decoded FROM the final MP4, rather than substituted renderer stills.
for(const [name,frame] of [['hook',0],['middle',Math.floor(brief.targetDurationSeconds*15)],['end',brief.targetDurationSeconds*30-1],['before',Math.floor((brief.beats[1].start+2)*30)],['after',Math.floor((brief.beats[3].start+4)*30)]]) {
  execFileSync('ffmpeg',['-v','error','-y','-i',file,'-vf',`select=eq(n\\,${frame})`,'-frames:v','1',`out/proof-${name}.png`]);
}
writeFileSync('out/ffprobe.json',JSON.stringify(probe,null,2)+'\n');
const time = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(Math.floor(s)%60).padStart(2,'0')},000`;
const cues = brief.beats.map(b=>({...b,text:b.type==='before'?`BEFORE: ${brief.facts.original}`:b.type==='after'?`AFTER: ${brief.facts.revised}`:b.text}));
writeFileSync(`out/${brief.id}.srt`,cues.map((b,i)=>`${i+1}\n${time(b.start)} --> ${time(b.end)}\n${b.text}\n`).join('\n'));
console.log(`PASS: ${video.width}x${video.height}, ${video.avg_frame_rate} FPS, ${probe.format.duration}s, ${video.nb_read_frames} decoded frames, ${probe.format.size} bytes. Full decode clean. Silent captions-only.`);
