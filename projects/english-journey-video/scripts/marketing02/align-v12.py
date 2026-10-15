from faster_whisper import WhisperModel
import subprocess,json,numpy as np,wave
from pathlib import Path
p=Path('out/marketing02/azure-v12')
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--model',required=True,help='Existing local faster-whisper small model directory; no download')
args=parser.parse_args()
m=WhisperModel(args.model,device='cpu',compute_type='int8',cpu_threads=6,local_files_only=True)
for f in sorted(p.glob('*.wav')):
 out=p/(f.stem+'.asr.json')
 if out.exists():continue
 a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-f','f32le','-ac','1','-ar','16000','-']),dtype=np.float32)
 seg,info=m.transcribe(a,language='vi',word_timestamps=True,beam_size=5,vad_filter=False,initial_prompt='English Journey, ChatGPT, AI, improve. I want to improve my English.')
 data=[dict(start=s.start,end=s.end,text=s.text,words=[dict(start=w.start,end=w.end,word=w.word,probability=w.probability) for w in (s.words or [])]) for s in seg]
 out.write_text(json.dumps(data,ensure_ascii=False,indent=2));print(f.name,json.dumps(data,ensure_ascii=False),flush=True)
