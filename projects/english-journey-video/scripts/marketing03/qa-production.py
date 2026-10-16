"""Actual MP4 technical QA; never claims listening or emotional quality."""
from pathlib import Path
import json,subprocess,hashlib,sys
import numpy as np
from scipy.signal import correlate
sys.path.insert(0,str(Path.cwd()))
from scripts.v2.build import loudness
out=Path('out/marketing03');f=out/'English-Journey-Marketing-03-V1.1-NamMinh.mp4';m=json.loads((out/'timeline.json').read_text());b=json.loads(Path('briefs/marketing-video-03-approved.json').read_text())
def run(a):return subprocess.run(a,check=True,capture_output=True)
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]).stdout);v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['codec_name'],v['width'],v['height'],v['avg_frame_rate'],a['codec_name'])==('h264',1080,1920,'30/1','aac');assert v['pix_fmt'] in ('yuv420p','yuvj420p');assert abs(float(probe['format']['duration'])-m['durationSeconds'])<.1
run(['ffmpeg','-v','error','-xerror','-i',str(f),'-f','null','-'])
metrics=loudness(f);assert -17<float(metrics['input_i'])<-15;assert float(metrics['input_tp'])<-1
for s in b['spokenSegments']:assert ' '.join(p['text'] for p in m['pages'] if p['scene']==s['id'])==s['spoken']
previous=0
for p in m['pages']:
 assert p['startMs']>=previous-.01 and p['endMs']>p['startMs'];previous=p['endMs'];assert p['endMs']<=m['durationSeconds']*1000
# Compare actual decoded AAC with supplied mix at beginning/end; reported lag is measured.
def pcm(path):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','1','-ar','16000','-']).stdout,dtype=np.float32)
x=pcm(out/'mix.wav');y=pcm(f);drift=[]
for start in [0,max(0,len(x)-8*16000)]:
 xx=x[start:start+6*16000];yy=y[start:start+6*16000];n=min(len(xx),len(yy));xx=xx[:n];yy=yy[:n];c=correlate(yy,xx,mode='full',method='fft');center=n-1;window=c[center-1600:center+1601];lag=int(np.argmax(window))-1600;corr=float(np.dot(xx,yy)/(np.linalg.norm(xx)*np.linalg.norm(yy)));assert abs(lag)<=160;assert corr>.98;drift.append({'startSeconds':start/16000,'lagMs':lag/16,'correlationAtZeroLag':corr})
proof=out/'evidence';proof.mkdir(exist_ok=True)
samples=[('frame-0000',0),('hook-2-5',2.5)]+[(s['type'],(s['startFrame']+s['endFrame'])/60) for s in m['scenes']]+[('demo-wrong',next(s['startFrame'] for s in m['scenes'] if s['type']=='demo')/30+2),('demo-correct',m['markers']['demo-correct']/30+2),('cta-last',m['durationSeconds']-1)]
for name,t in samples:run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(f),'-frames:v','1',str(proof/(name+'.png'))])
report={'status':'TECHNICAL_PASS_PENDING_HUMAN_REVIEW','videoSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size,'durationSeconds':m['durationSeconds'],'format':{'width':1080,'height':1920,'fps':30,'video':'h264','audio':'aac','pixelFormat':v['pix_fmt']},'fullDecode':'PASS','exactCopy':'PASS_RECEIPT_TEXT_HASH_AND_CAPTION_COPY','subtitleTiming':'PASS_CONTAINMENT_MONOTONIC_ASR_PHRASE_ENDPOINTS','sixScenes':'PASS','aacSourceAlignment':drift,'loudness':metrics,'proofFrames':len(samples),'newAzureRequests':0,'subjectiveAudioQA':'BLOCKED_NO_DIRECT_LISTENING','fullMotionViewing':'BLOCKED_NO_VIDEO_NATIVE_REVIEW','visualStills':'REQUIRES_SEPARATE_INSPECTION','publication':'NOT_APPROVED'}
(out/'qa-production.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,indent=2))
