"""Verify the actual V2 MP4, stems, technical sync and final-export voice intelligibility."""
import argparse, hashlib, json, re, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.signal import correlate,correlation_lags


def run(args):return subprocess.run(args,check=True,capture_output=True,text=True)

def measure(path):
    r=run(['ffmpeg','-hide_banner','-i',str(path),'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])
    return json.loads(r.stderr[r.stderr.rfind('{'):])

def decode(path):
    data=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vn','-ar','16000','-ac','1','-f','f32le','-'])
    return np.frombuffer(data,dtype='<f4')

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--asr',action='store_true');parser.add_argument('--models-dir',default='.cache/asr-models');args=parser.parse_args()
    m=json.loads(Path('public/v2/manifest.json').read_text());brief=json.loads(Path('briefs/pilot-lesson15.json').read_text())
    file=Path('out/lesson15-writing-retry-v2.mp4')
    probe=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(file)]).stdout)
    video=next(s for s in probe['streams'] if s['codec_type']=='video');audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
    assert (video['width'],video['height'],video['avg_frame_rate'],video['codec_name'],video['pix_fmt'])==(1080,1920,'30/1','h264','yuv420p')
    assert audio['codec_name']=='aac' and int(audio['sample_rate'])==48000
    assert int(video['nb_read_frames'])==m['durationInFrames']
    assert 32<=float(probe['format']['duration'])<=39.05
    assert abs(float(probe['format']['duration'])-m['durationSeconds'])<.05
    assert m['facts']['original']==brief['facts']['original'] and m['facts']['revised']==brief['facts']['revised']
    assert m['bpm']==90 and m['framesPerBeat']==20
    assert m['scenes'][0]['startFrame']==0 and m['scenes'][-1]['endFrame']==m['durationInFrames']
    for i,s in enumerate(m['scenes']):
        if i:assert s['startFrame']==m['scenes'][i-1]['endFrame']
        assert s['endFrame']%20==0
        for segment in (x for x in m['segments'] if x['scene']==s['type']):
            assert segment['startMs']+0.001>=s['startFrame']/30*1000
            assert segment['endMs']<=s['endFrame']/30*1000+.001
            words=[t for t in m['tokens'] if t['segmentId']==segment['id']]
            assert ' '.join(t['text'] for t in words)==segment['text']
    assert [t for p in m['pages'] for t in p['tokens']]==m['tokens']
    ready=m['scenes'][3]['startFrame']+78
    full_hold=(m['scenes'][3]['endFrame']-ready)/30
    assert full_hold>=7, 'Complete sentence not held long enough'
    run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'])
    loud=measure(file);assert -18<=float(loud['input_i'])<=-14 and float(loud['input_tp'])<=-.5
    source=decode('out/v2-mix.wav');export=decode(file);length=min(len(source),len(export));a=source[:length];b=export[:length]
    values=correlate(b,a,method='fft');lags=correlation_lags(length,length);allowed=abs(lags)<1600
    lag=int(lags[allowed][np.argmax(values[allowed])]);assert abs(lag)<=533
    if lag>=0:x=a[:length-lag];y=b[lag:]
    else:x=a[-lag:];y=b[:length+lag]
    corr=float(np.corrcoef(x,y)[0,1]);assert corr>.98
    # Verify music/SFX are IN the actual export via independent stem projection.
    voice=decode('out/v2-voice.wav')[:length];music=decode('out/v2-music.wav')[:length];sfx=decode('out/v2-sfx.wav')[:length]
    assert np.sqrt(np.mean(music**2))>0 and np.sqrt(np.mean(sfx**2))>0
    stems=np.column_stack([voice,music,sfx]);coeff=np.linalg.lstsq(stems,b,rcond=None)[0]
    assert np.max(abs(coeff-1))<.12, f'Missing or wrong stem in final encode: {coeff}'
    proof=[('opening',10),('mistakes',m['events'][1]['frame']+20),('bridge',next(e['frame'] for e in m['events'] if e['kind']=='bridge')+30),('fullfix',m['scenes'][3]['startFrame']+100),('cta',m['scenes'][4]['startFrame']+70)]
    for name,frame in proof:
        run(['ffmpeg','-v','error','-y','-i',str(file),'-vf',f'select=eq(n\\,{frame})','-frames:v','1',f'out/v2-proof-{name}.png'])
    report={'technicalStatus':'PASS','publishStatus':'NOT_APPROVED','humanListening':'BLOCKED; this agent runtime does not support audio input',
            'auditionWinner':'NOT_SELECTED_BY_LISTENING; B used provisionally','probe':probe,'loudness':loud,
            'sourceMixCorrelation':corr,'muxLagMs':lag/16,'stemCoefficients':dict(zip(['voice','music','sfx'],map(float,coeff))),
            'fullCorrectSentenceHoldSeconds':full_hold,'proofFrames':dict(proof),'finalExportSha256':hashlib.sha256(file.read_bytes()).hexdigest(),
            'auditionHashes':{name:hashlib.sha256(Path(f'out/v2-audition-{name}.wav').read_bytes()).hexdigest() for name in ['A','B']},
            'voiceMetrics':measure('out/v2-voice.wav'),'musicMetrics':measure('out/v2-music.wav'),'sfxMetrics':measure('out/v2-sfx.wav')}
    if args.asr:
        from faster_whisper import WhisperModel
        model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=2,download_root=args.models_dir)
        asr=[]
        for segment in m['segments']:
            samples=b[round(segment['startMs']*16):round(segment['endMs']*16)]
            chunks,_=model.transcribe(samples,language='vi',beam_size=5,condition_on_previous_text=False,temperature=0)
            text=' '.join(c.text.strip() for c in chunks);asr.append({'segment':segment['id'],'expected':segment['text'],'recognized':text});print(segment['id'],text,flush=True)
        report['asr']={'purpose':'Independent recognition from final speech+music mix, not a listening/emotion assessment','segments':asr}
    Path('out/v2-technical-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(f"TECHNICAL PASS: {probe['format']['duration']}s, {video['nb_read_frames']} frames, AAC speech+music+SFX verified. NOT_APPROVED pending human listening.",flush=True)

if __name__=='__main__':main()
