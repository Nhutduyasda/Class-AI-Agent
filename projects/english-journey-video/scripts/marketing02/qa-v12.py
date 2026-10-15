"""Technical checks for the actual separate Azure V1.2 export; no listening claim."""
import json,subprocess,hashlib,wave,sys
from pathlib import Path
import numpy as np
from scripts.v2.build import loudness
out=Path('out/marketing02/azure-v12');m=json.loads((out/'timeline.json').read_text());b=Path('briefs/marketing-video-02-approved.json');brief=json.loads(b.read_text());mp4=out.parent/'English-Journey-Marketing-02-V1.2-NamMinh.mp4'
def cmd(a):return subprocess.run(a,check=True,capture_output=True,text=True)
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
probe=json.loads(cmd(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(mp4)]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['codec_name'],v['avg_frame_rate'],a['codec_name'],a['sample_rate'],a['channels'])==(1080,1920,'h264','30/1','aac','48000',2)
assert abs(float(probe['format']['duration'])-m['durationSeconds'])<.1
assert int(v['nb_frames'])==m['durationInFrames']
assert m['briefSha256']==digest(b)
assert [s['type'] for s in m['scenes']]==[s['id'] for s in brief['spokenSegments']]
for s in brief['spokenSegments']:
 assert ' '.join(t['text'] for t in m['tokens'] if t['scene']==s['id'])==s['spoken']
 scene=next(x for x in m['scenes'] if x['type']==s['id'])
 assert all(scene['startFrame']/30*1000<=t['startMs']<t['endMs']<=scene['endFrame']/30*1000 for t in m['tokens'] if t['scene']==s['id'])
for p,q in zip(m['pages'],m['pages'][1:]):assert p['endMs']<=q['startMs']+.001
assert all(len(p['text'])<=64 for p in m['pages'])
assert all(p['text'] in (out/'subtitles.srt').read_text() and p['text'] in (out/'subtitles.vtt').read_text() for p in m['pages'])
assert m['visualSourceSha256']==digest('src/Marketing02.tsx')
baseline=subprocess.check_output(['git','show','60957b9912e6f19087126ac7b6a4d84eef4e1b60:projects/english-journey-video/src/Marketing02.tsx'])
assert hashlib.sha256(baseline).hexdigest()==m['visualSourceSha256']
assert m['voice']=='Azure Speech Standard S0 vi-VN-NamMinhNeural'
assert m['synthesisCost']['allKnownReferenceUsd']<=.05
assert sum(x['attempts'] for x in m['synthesisCost']['newPlan'])==5
rawchecks=[]
for asset in m['assets']:
 f=out/asset['file'];assert digest(f)==asset['sha256'];cmd(['ffmpeg','-v','error','-i',str(f),'-f','null','-'])
 rawchecks.append({'scene':asset['scene'],'sha256':asset['sha256'],'durationSeconds':asset['durationSeconds'],'sourceSampleRate':asset['sourceSampleRate'],'decode':'PASS'})
assert next(x['sha256'] for x in rawchecks if x['scene']=='demo')=='6bc9bca6f5ca8a8e7e86248a4d9b45057a3491f5e1b5b9ce0f68eafacba72cc4'
cmd(['ffmpeg','-v','error','-i',str(mp4),'-f','null','-'])
l=loudness(mp4);assert float(l['input_tp'])<=-1.0;assert -17<=float(l['input_i'])<=-15
stems={n:loudness(out/(n+'.wav')) for n in ['voice','music','sfx','mix']}
assert float(stems['voice']['input_i'])-float(stems['music']['input_i'])>=15
motion=[]
for t in [0,2,28,37,53]:
 arr=[]
 for offset in [0,.5]:
  data=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t+offset),'-i',str(mp4),'-frames:v','1','-vf','scale=108:192','-f','rawvideo','-pix_fmt','rgb24','-']);arr.append(np.frombuffer(data,dtype=np.uint8).astype(float))
 delta=float(np.mean(np.abs(arr[0]-arr[1])));motion.append({'startSeconds':t,'halfSecondMeanPixelChange':delta});assert delta>0
result={'status':'TECHNICAL_PASS','durationSeconds':float(probe['format']['duration']),'video':{k:v[k] for k in ['width','height','codec_name','avg_frame_rate','nb_frames']},'audio':{k:a[k] for k in ['codec_name','sample_rate','channels']},'fullDecode':'PASS','exactAuthoredCopy':'PASS (input and caption text; not acoustic certification)','originalVisualSource':'BYTE_IDENTICAL','demoReusedUnchanged':'PASS','rawAudio':rawchecks,'phraseCues':'ASR observed endpoints; no uniform word interpolation','loudness':l,'stems':stems,'motionEvidence':motion,'subjectiveListening':'BLOCKED: cannot listen to full audiovisual export in current tools','pronunciationAndEmotion':'OWNER_REVIEW_REQUIRED; ASR contains substitutions including ChatGPT and mixed English','publication':'NOT APPROVED','newSynthesisRequests':5,'knownPriorSampleRequests':2,'referenceTotalUsd':.012255,'sha256':digest(mp4),'bytes':mp4.stat().st_size}
(out/'technical-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
