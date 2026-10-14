"""Optional local ASR of FINAL-export PCM. This does not replace listening QA."""
import argparse
import difflib
import json
import re
import subprocess
import unicodedata
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

def normalized(text):
    return ' '.join(re.findall(r'\w+',unicodedata.normalize('NFC',text.lower())))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model',default='base')
    parser.add_argument('--models-dir',default='.cache/asr-models')
    args=parser.parse_args()
    manifest=json.loads(Path('public/voice/lesson15-writing-retry-voice/manifest.json').read_text())
    final=Path('out')/f"{manifest['id']}.mp4"
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(final),'-vn','-ar','16000','-ac','1','-f','f32le','-'])
    pcm=np.frombuffer(raw,dtype=np.float32)
    model=WhisperModel(args.model,device='cpu',compute_type='int8',cpu_threads=2,download_root=args.models_dir)
    results=[]
    for segment in manifest['segments']:
        start=round(segment['startMs']*16)
        end=round(segment['endMs']*16)
        chunks,info=model.transcribe(pcm[start:end],language='vi' if segment['language']=='vi-VN' else 'en',beam_size=5,
                                     condition_on_previous_text=False,temperature=0)
        text=' '.join(chunk.text.strip() for chunk in chunks)
        # No initial_prompt/expected transcript supplied to recognition.
        results.append({'segment':segment['id'],'language':segment['language'],'expected':segment['text'],
                        'recognized':text,'similarity':difflib.SequenceMatcher(None,normalized(segment['text']),normalized(text)).ratio()})
        print(f"{segment['id']}: {text}",flush=True)
    report={'model':args.model,'input':str(final),'purpose':'Independent machine intelligibility check, NOT a human/agent listening pass',
            'results':results}
    Path('out/voice-asr-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('ASR check complete. Listening QA remains separate.',flush=True)

if __name__=='__main__':main()
