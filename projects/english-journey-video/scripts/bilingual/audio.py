"""Offline PCM assembly/mixing. Fixtures test DSP only, never pronunciation."""
import argparse,json,wave,hashlib,subprocess,math,re
from pathlib import Path
import numpy as np
SR=48000
def read_wav(file):
    with wave.open(str(file),'rb') as f:
        if f.getframerate()!=SR or f.getsampwidth()!=2:raise ValueError('PCM_48K_16_REQUIRED')
        a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float64)/32768
        return a if f.getnchannels()==1 else a.reshape(-1,f.getnchannels())
def write_wav(file,a):
    if np.max(np.abs(a))>=1:raise ValueError('CLIPPING_REFUSED')
    with wave.open(str(file),'wb') as f:
        f.setnchannels(1 if a.ndim==1 else a.shape[1]);f.setsampwidth(2);f.setframerate(SR);f.writeframes(np.round(a*32767).astype('<i2').tobytes())
def loudness(file):
    r=subprocess.run(['ffmpeg','-hide_banner','-f','wav','-i','pipe:0','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'],input=Path(file).read_bytes(),check=True,capture_output=True)
    stderr=r.stderr.decode('utf-8',errors='replace');return json.JSONDecoder().raw_decode(stderr[stderr.rfind('{'):])[0]
def normalized(a,file,target=-17):
    write_wav(file,a);m=loudness(file)
    if not math.isfinite(float(m['input_i'])):raise ValueError('SILENT_OR_INVALID_AUDIO')
    gain=min(10**((target-float(m['input_i']))/20),10**((-2-float(m['input_tp']))/20));result=a*gain;write_wav(file,result);return result,m
def safe_join(parts,gap_samples):
    output=[]
    for i,a in enumerate(parts):
        if i and gap_samples:
            # Fade only measured near-silence, never crop or overlap syllables.
            if np.max(np.abs(parts[i-1][-240:]))>.002 or np.max(np.abs(a[:240]))>.002:raise ValueError('JOIN_NEEDS_SILENCE_REVIEW_NO_RESYNTHESIS')
            output[-1][-240:]*=np.linspace(1,0,240);a=a.copy();a[:240]*=np.linspace(0,1,240);output.append(np.zeros(gap_samples))
        output.append(a.copy())
    return np.concatenate(output)
def main():
    p=argparse.ArgumentParser();p.add_argument('plan');p.add_argument('audio_dir');p.add_argument('--music');p.add_argument('--sfx');p.add_argument('--offline-fixture',action='store_true');args=p.parse_args()
    plan=json.loads(Path(args.plan).read_text(encoding='utf-8'));out=Path(args.audio_dir);m=json.loads((out/'timeline.json').read_text(encoding='utf-8'));ledger=json.loads((out/'ledger.json').read_text(encoding='utf-8'))
    kind='OFFLINE_FIXTURE_ONLY' if args.offline_fixture else 'AZURE_REST'
    if ledger['kind']!=kind or m['planSha256']!=plan['planSha256'] or ledger['planSha256']!=plan['planSha256']:raise ValueError('VERIFIED_REAL_AUDIO_REQUIRED')
    if args.offline_fixture and ('.cache' not in out.resolve().parts or m['timing']!='OFFLINE_TEST_FIXTURE_ONLY'):raise ValueError('FIXTURES_MUST_STAY_IN_CACHE')
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,79}',plan['productionId']) or any(not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,79}',r['id']) for r in plan['requests']):raise ValueError('UNSAFE_PLAN_PATH_IDS')
    pieces=[];metrics=[]
    for scene in m['scenes']:
        parts=[]
        for r in [r for r in plan['requests'] if r['scene']==scene['type']]:
            f=out/(r['id']+'.wav');c=next(c for c in ledger['calls'] if c['id']==r['id'])
            if c['status']!='VERIFIED' or hashlib.sha256(f.read_bytes()).hexdigest()!=c['sha256']:raise ValueError('AUDIO_HASH_MISMATCH')
            a=read_wav(f)
            if a.ndim!=1:raise ValueError('MONO_REQUIRED')
            b,metric=normalized(a,out/('normalized-'+r['id']+'.wav'));assert len(a)==len(b);parts.append(b);metrics.append({'requestId':r['id'],'before':metric})
        a=safe_join(parts,round(plan['profile']['splitGapMs']*48) if plan['mode']=='split' else 0)
        samples=(scene['endFrame']-scene['startFrame'])*1600
        if len(a)>samples:raise ValueError('TIMELINE_CUTS_SPEECH')
        pieces.extend([a,np.zeros(samples-len(a))])
    voice=np.concatenate(pieces);assert len(voice)==m['audioSamples']
    # Measured per-voice ranges allow gain balance without cuts, pitch or rate changes.
    envelope=np.ones(len(voice));voice_metrics=[]
    for i,span in enumerate(m['voiceSpans']):
        a,b=round(span['startMs']*48),round(span['endMs']*48)
        if b-a<SR*.4:continue  # LUFS is unreliable for a lone short article.
        adjusted,metric=normalized(voice[a:b],out/f'.measure-span-{i}.wav',-17)
        (out/f'.measure-span-{i}.wav').unlink()
        gain=min(2,max(.5,np.max(np.abs(adjusted))/max(np.max(np.abs(voice[a:b])),1e-12)))
        ramp=min(480,(b-a)//2);local=np.full(b-a,gain);local[:ramp]=np.linspace(1,gain,ramp);local[-ramp:]=np.linspace(gain,1,ramp);envelope[a:b]*=local
        voice_metrics.append({'voice':span['voice'],'startMs':span['startMs'],'endMs':span['endMs'],'gainDb':20*math.log10(gain),'measured':metric})
    voice*=envelope
    def track(file):
        if not file:return np.zeros((len(voice),2))
        a=read_wav(file)
        if a.ndim==1:a=np.column_stack([a,a])*.70710678
        if a.shape[1]!=2 or len(a)>len(voice):raise ValueError('TRACK_FORMAT_OR_DURATION_INVALID')
        a=np.pad(a,((0,len(voice)-len(a)),(0,0)));return a
    music=track(args.music);sfx=track(args.sfx)
    if args.music:music,_=normalized(music,out/'.music-measure.wav',-36);(out/'.music-measure.wav').unlink()
    if args.sfx:sfx,_=normalized(sfx,out/'.sfx-measure.wav',-36);(out/'.sfx-measure.wav').unlink()
    squares=np.r_[0,np.cumsum(voice**2)];rms=np.sqrt(np.maximum(0,(squares[960:]-squares[:-960])/960));rms=np.pad(rms,(959,0));music*=(1-.5*np.clip(rms/.05,0,1))[:,None]
    mix=voice[:,None]*np.array([.70710678,.70710678])+music+sfx;mix,before=normalized(mix,out/'.mix-measure.wav',-16);(out/'.mix-measure.wav').unlink();write_wav(out/'mix.wav',mix)
    after=loudness(out/'mix.wav')
    if abs(float(after['input_i'])+16)>1.5 or float(after['input_tp'])>-1.5:raise ValueError('FINAL_LOUDNESS_QA_FAILED')
    subprocess.run(['ffmpeg','-v','error','-xerror','-f','wav','-i','pipe:0','-f','null','-'],input=(out/'mix.wav').read_bytes(),check=True)
    if not args.offline_fixture:
        public=Path('public/bilingual')/plan['productionId'];public.mkdir(parents=True,exist_ok=True)
        (public/'mix.wav').write_bytes((out/'mix.wav').read_bytes());(public/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'mix-qa.json').write_text(json.dumps({'kind':kind,'samples':len(mix),'sampleRate':SR,'timeStretch':False,'pitchChange':False,'requestMetrics':metrics,'voiceMetrics':voice_metrics,'mixMetrics':after,'subjectiveQA':'BLOCKED_NEEDS_REAL_LISTENING'},indent=2),encoding='utf-8')
    print(json.dumps({'status':'OFFLINE_DSP_ONLY_NOT_VOICE' if args.offline_fixture else 'MIX_VERIFIED','durationSeconds':len(mix)/SR,'metrics':after}))
if __name__=='__main__':main()
