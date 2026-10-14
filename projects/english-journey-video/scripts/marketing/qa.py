"""Probe the actual encode, exact copy, real timing, decoded audio and separate stems."""
import sys,json,subprocess,hashlib
from pathlib import Path
sys.path.insert(0,str(Path.cwd()))
from scripts.v2.build import loudness,read_wav,SR
import numpy as np
from scipy.signal import correlate

def run(a):return subprocess.run(a,check=True,capture_output=True)
def main():
    out=Path('out');video=out/'english-journey-marketing-video-01.mp4';m=json.loads((out/'marketing-timeline.json').read_text());b=json.loads(Path('briefs/marketing-video-01-approved.json').read_text())
    probe=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(video)]).stdout)
    v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
    assert (v['width'],v['height'],v['r_frame_rate'],v['codec_name'],a['codec_name'])==(1080,1920,'30/1','h264','aac')
    assert int(v['nb_read_frames'])==m['durationInFrames']
    assert [s['type'] for s in m['scenes']]==[s['id'] for s in b['spokenSegments']]
    for s in b['spokenSegments']:
        ts=[t for t in m['tokens'] if t['scene']==s['id']];assert ' '.join(t['text'] for t in ts)==s['spoken']
        scene=next(x for x in m['scenes'] if x['type']==s['id']);segment=next(x for x in m['segments'] if x['id']==s['id']);assert segment['endMs']<=scene['endFrame']/30*1000
        assert all(t['startMs']<t['endMs']<=segment['endMs']+30 for t in ts)
    assert m['facts']['original']==b['approvedEvidence']['original'] and m['facts']['correction']==b['approvedEvidence']['correction']
    assert [t for p in m['pages'] for t in p['tokens']]==m['tokens']
    assert all(len(p['text'])<=47 for p in m['pages'])
    raw=run(['ffmpeg','-v','error','-i',str(video),'-f','f32le','-ar',str(SR),'-ac','2','-']).stdout
    decoded=np.frombuffer(raw,dtype='<f4').reshape(-1,2);source=read_wav(out/'marketing-mix.wav');n=min(len(source),len(decoded));corr=float(np.corrcoef(source[:n,0],decoded[:n,0])[0,1])
    def mono(path):
        return np.frombuffer(run(['ffmpeg','-v','error','-i',str(path),'-vn','-ar','16000','-ac','1','-f','f32le','-']).stdout,dtype='<f4')
    export=mono(video);reference=mono(out/'marketing-mix.wav');length=min(len(export),len(reference))
    values=correlate(export[:length],reference[:length],method='fft');center=length-1
    lag=int(np.argmax(values[center-1600:center+1601])-1600);assert abs(lag)<=16
    stems=np.column_stack([mono(out/f'marketing-{name}.wav')[:length] for name in ['voice','music','sfx']]);coeff=np.linalg.lstsq(stems,export[:length],rcond=None)[0]
    # AAC psychoacoustic encoding may attenuate tiny SFX; 12% tolerance also used by V2 QA.
    print('Source/export correlation, lag, stem coefficients:',corr,lag/16,coeff,flush=True)
    assert corr>.99 and np.all(np.abs(coeff-1)<.12)
    metrics=loudness(video);assert float(metrics['input_tp'])<=-1.0
    proofs=[]
    for s in m['scenes']:
        frames=[('demo-before',s['startFrame']+60),('demo-after',next(e['frame'] for e in m['events'] if e['kind']=='complete')+30)] if s['type']=='demo' else [(s['type'],s['startFrame']+(0 if s['type']=='hook' else 120))]
        for name,f in frames:
            dest=out/f'marketing-proof-{name}.png';run(['ffmpeg','-v','error','-y','-i',str(video),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(dest)]);proofs.append({'name':name,'frame':f,'path':str(dest)})
    report={'technical':'PASS','publication':'NOT APPROVED','listening':'BLOCKED — audio perception unavailable; ASR is not listening','format':probe,'runtimeSeconds':m['durationSeconds'],'durationTarget':'NOT MET; locked script retained at +0% speech rate','loudness':metrics,'sourceExportCorrelation':corr,'muxLagMs':lag/16,'stemCoefficientTolerance':0.12,'stemCoefficients':dict(zip(['voice','music','sfx'],coeff.tolist())),'copyLock':'PASS — exact approved token reconstruction and stage order','proofs':proofs,'sha256':hashlib.sha256(video.read_bytes()).hexdigest()}
    (out/'marketing-technical-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['technical','runtimeSeconds','loudness','sourceExportCorrelation','stemCoefficients']},indent=2))
if __name__=='__main__':main()
