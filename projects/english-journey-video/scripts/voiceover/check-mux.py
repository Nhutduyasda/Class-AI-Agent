"""Compare final-export audio clock and waveform with the source narration."""
import json
import subprocess
from pathlib import Path
import numpy as np
from scipy.signal import correlate, correlation_lags

def decode(path):
    data=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vn','-ar','16000','-ac','1','-f','f32le','-'])
    return np.frombuffer(data,dtype=np.float32)

m=json.loads(Path('public/voice/lesson15-writing-retry-voice/manifest.json').read_text())
source=decode(Path('public')/m['audioSrc'])
final=decode(Path('out')/f"{m['id']}.mp4")
length=min(len(source),len(final))
a=source[:length];b=final[:length]
values=correlate(b,a,method='fft')
lags=correlation_lags(len(b),len(a))
allowed=np.abs(lags)<=1600
lag=int(lags[allowed][np.argmax(values[allowed])])
if lag>=0:
    x=a[:length-lag];y=b[lag:]
else:
    x=a[-lag:];y=b[:length+lag]
score=float(np.corrcoef(x,y)[0,1])
assert abs(lag)<=533, f'Audio clock drift exceeds one video frame: {lag/16}ms'
assert score>.97,f'Muxed audio differs from narration ({score})'
assert abs(len(source)-len(final))/16000 < .05, 'Audio length changed by more than 50ms'
result={'lagSamplesAt16kHz':lag,'lagMs':lag/16,'waveformCorrelation':score,
        'sourceDurationSeconds':len(source)/16000,'decodedExportDurationSeconds':len(final)/16000,
        'status':'PASS: original narration retained with no meaningful timing drift',
        'listeningStatus':'Not a listening assessment'}
Path('out/voice-mux-qa.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
