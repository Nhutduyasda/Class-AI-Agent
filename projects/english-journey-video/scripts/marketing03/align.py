"""Local ASR observations only, never synthesize. Retain exact-copy separately."""
from faster_whisper import WhisperModel
import json,subprocess,numpy as np
from pathlib import Path
m=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=6,download_root='.cache/marketing03/whisper',revision='536b0662742c02347bc0e980a01041f333bce120')
for f in Path('out/marketing03/raw').glob('*.wav'):
 out=f.with_suffix('.asr.json')
 if out.exists():continue
 a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-f','f32le','-ac','1','-ar','16000','-']),dtype=np.float32)
 seg,_=m.transcribe(a,language='vi',word_timestamps=True,beam_size=5,vad_filter=False,initial_prompt='ChatGPT, Error Log. Yesterday, I go to school. Yesterday, I went to school.')
 data=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'start':w.start,'end':w.end,'word':w.word,'probability':w.probability} for w in s.words or []]} for s in seg]
 out.write_text(json.dumps(data,ensure_ascii=False,indent=2));print(f.name,json.dumps(data,ensure_ascii=False),flush=True)
