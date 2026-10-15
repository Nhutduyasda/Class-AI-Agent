"""Objective Video 02 checks. Never certifies subjective voice quality."""
import json,subprocess,hashlib
from pathlib import Path
from scripts.v2.build import loudness
out=Path('out/marketing02');m=json.loads((out/'timeline.json').read_text());b=Path('briefs/marketing-video-02-approved.json');brief=json.loads(b.read_text());mp4=out/'English-Journey-Marketing-02.mp4'
def cmd(a):return subprocess.run(a,check=True,capture_output=True,text=True)
probe=json.loads(cmd(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(mp4)]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['codec_name'],v['avg_frame_rate'],a['codec_name'])==(1080,1920,'h264','30/1','aac')
assert abs(float(probe['format']['duration'])-m['durationSeconds'])<.1
assert m['briefSha256']==hashlib.sha256(b.read_bytes()).hexdigest()
assert [s['type'] for s in m['scenes']]==[s['id'] for s in brief['spokenSegments']]
for s in brief['spokenSegments']:
 assert ' '.join(t['text'] for t in m['tokens'] if t['scene']==s['id'])==s['spoken']
 scene=next(x for x in m['scenes'] if x['type']==s['id'])
 assert all(scene['startFrame']/30*1000<=t['startMs']<t['endMs']<=scene['endFrame']/30*1000 for t in m['tokens'] if t['scene']==s['id'])
cmd(['ffmpeg','-v','error','-i',str(mp4),'-f','null','-'])
l=loudness(mp4);assert float(l['input_tp'])<=-1.0
result={'status':'TECHNICAL_PASS','duration':probe['format']['duration'],'video':{k:v[k] for k in ['width','height','codec_name','avg_frame_rate','nb_frames']},'audio':{k:a[k] for k in ['codec_name','sample_rate','channels']},'fullDecode':'PASS','exactAuthoredCopy':'PASS; verifies synthesis input and captions, not acoustic recognition','phraseCues':'measured PCM; word-level karaoke not implemented','loudness':l,'subjectiveListening':'BLOCKED; no full audiovisual listening tool','publication':'NOT APPROVED','sha256':hashlib.sha256(mp4.read_bytes()).hexdigest()}
(out/'technical-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
