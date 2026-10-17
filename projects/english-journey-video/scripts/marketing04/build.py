"""Offline only: align verified Azure WAV, mix original score, export captions/timeline."""
import json,math,hashlib,sys,re,subprocess,difflib,shutil
from pathlib import Path
import numpy as np
from scipy.signal import lfilter
from faster_whisper import WhisperModel
sys.path.insert(0,str(Path.cwd()))
from scripts.v2.build import read_wav,write_wav,normalize,original_music,original_sfx,loudness,stamp
def loudness(path):
    r=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'],check=True,capture_output=True,text=True)
    return json.JSONDecoder().raw_decode(r.stderr[r.stderr.rfind('{'):])[0]
def normalize(path,out,target):
    metric=loudness(path);a=read_wav(path);gain=min(10**((target-float(metric['input_i']))/20),10**(-1.5/20)/np.max(np.abs(a)))
    write_wav(out,a*gain)
    return {'input':metric,'gainDb':20*math.log10(gain),'output':loudness(out)}
root=Path.cwd();out=root/'out/marketing04';cache=root/'.cache/marketing04';cache.mkdir(parents=True,exist_ok=True)
briefBytes=(root/'briefs/marketing-video-04-approved.json').read_bytes();brief=json.loads(briefBytes)
manifest=json.loads((out/'audio-manifest.json').read_text(encoding='utf-8'));assert hashlib.sha256(briefBytes).hexdigest()==manifest['briefSha256']
model=WhisperModel(sys.argv[1],device='cpu',compute_type='int8',cpu_threads=6,local_files_only=True)
def norm(w):return ''.join(re.findall(r'\w+',w.lower()))
def align(expected,observed):
    # Lexical sequence alignment; retained times are observed audio endpoints.
    a=[norm(w) for w in expected];b=[norm(w['word']) for w in observed]
    n,m=len(a),len(b);d=np.zeros((n+1,m+1),dtype=int);d[:,0]=np.arange(n+1);d[0,:]=np.arange(m+1)
    for i in range(1,n+1):
        for j in range(1,m+1):d[i,j]=min(d[i-1,j]+1,d[i,j-1]+1,d[i-1,j-1]+(a[i-1]!=b[j-1]))
    result={};i,j=n,m
    while i or j:
        if i and j and d[i,j]==d[i-1,j-1]+(a[i-1]!=b[j-1]):result[i-1]=observed[j-1];i-=1;j-=1
        elif j and d[i,j]==d[i,j-1]+1:j-=1
        else:i-=1
    return result,float(d[n,m])/max(n,m)
pieces=[];scenes=[];pages=[];segments=[];assets=[];markers={};cursor=0;alignment=[]
for s in brief['spokenSegments']:
    name=s['id'];f=out/'raw'/(name+'.wav');fm=next(x for x in manifest['files'] if x['scene']==name)
    assert hashlib.sha256(f.read_bytes()).hexdigest()==fm['sha256']
    raw=read_wav(f);asr=f.with_suffix('.asr.json')
    if not asr.exists():
        pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-f','f32le','-ac','1','-ar','16000','-']),dtype=np.float32)
        chunks,_=model.transcribe(pcm,language='vi',word_timestamps=True,beam_size=5,vad_filter=False,condition_on_previous_text=False,temperature=0)
        observed=[{'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for c in chunks for w in (c.words or [])]
        asr.write_text(json.dumps(observed,ensure_ascii=False,indent=2),encoding='utf-8')
    observed=json.loads(asr.read_text(encoding='utf-8'));expected=s['spoken'].split();matched,error=align(expected,observed)
    if error>.45:raise ValueError('ASR_ALIGNMENT_REQUIRES_REVIEW '+name)
    normalization=normalize(f,cache/(name+'.wav'),-17);audio=read_wav(cache/(name+'.wav'));offset=cursor/48000;start=cursor//1600
    # Readable phrases retain exact approved copy; no interpolated word timestamps.
    groups=[];a=0
    for i,w in enumerate(expected):
        if i-a>=6 or re.search(r'[.!?;:,]$',w) or i==len(expected)-1:groups.append((a,i+1));a=i+1
    for a,b in groups:
        times=[matched[i] for i in range(a,b) if i in matched]
        if not times:raise ValueError('NO_OBSERVED_PHRASE_TIMING '+name)
        begin=offset+min(w['start'] for w in times);end=offset+max(w['end'] for w in times)
        pages.append({'scene':name,'text':' '.join(expected[a:b]),'startMs':begin*1000,'endMs':end*1000,'timingLevel':'ASR_OBSERVED_PHRASE'})
    if name=='demo':
        for key,needle in [('demo-the','The cat was sleeping.'),('demo-an','I ate an apple,')]:
            wi=s['spoken'][:s['spoken'].index(needle)].count(' ')
            if wi not in matched:raise ValueError('DEMO_TIMING_UNAVAILABLE')
            markers[key]=round((offset+matched[wi]['start'])*30)
    pieces.append(audio);cursor+=len(audio);end=math.ceil((cursor/48000+(.6 if name!='cta' else 1.6))*30);pieces.append(np.zeros(end*1600-cursor));cursor=end*1600
    scenes.append({'type':name,'startFrame':start,'endFrame':end});segments.append({**s,'startMs':offset*1000,'speechEndMs':(offset+len(raw)/48000)*1000,'endMs':cursor/48})
    assets.append({**fm,'normalization':normalization});alignment.append({'scene':name,'normalizedEditDistance':error,'expectedWords':len(expected),'observedWords':len(observed),'matchedWords':len(matched)})
for i,p in enumerate(pages):
    boundary=next(x['endFrame']/30*1000 for x in scenes if x['type']==p['scene'])
    nxt=pages[i+1]['startMs'] if i+1<len(pages) else boundary
    p['endMs']=min(max(p['endMs'],p['startMs']+650),nxt,boundary)
    assert p['endMs']>p['startMs']
voice=np.concatenate(pieces);write_wav(cache/'voice.wav',voice)
write_wav(cache/'music-raw.wav',original_music(cursor,86));normalize(cache/'music-raw.wav',cache/'music.wav',-36);music=read_wav(cache/'music.wav')
rms=np.sqrt(np.maximum(lfilter([1/960]*960,[1],voice**2),0));music*=(1-.45*np.clip(rms/.05,0,1))[:,None]
events=[{'kind':'bridge','frame':s['startFrame']} for s in scenes[1:]]+[{'kind':'complete','frame':v} for v in markers.values()]
sfx=original_sfx(cursor,events)*.25;stereo=voice[:,None]*np.array([.70710678,.70710678]);mix=stereo+music+sfx;write_wav(cache/'mix.wav',mix);metrics=loudness(cache/'mix.wav')
gain=min(10**((-16-float(metrics['input_i']))/20),10**(-1.7/20)/np.max(np.abs(mix)))
for name,a in [('voiceover',stereo),('music',music),('sfx',sfx),('mix',mix)]:write_wav(out/(name+'.wav'),a*gain)
m={'version':'1.1','fps':30,'durationInFrames':cursor//1600,'durationSeconds':cursor/48000,'audioSrc':'marketing04/mix.wav','scenes':scenes,'segments':segments,'tokens':pages,'pages':pages,'markers':markers,'events':events,'briefSha256':hashlib.sha256(briefBytes).hexdigest(),'assets':assets,'alignment':alignment,'captionTiming':'Local faster-whisper small observed phrase endpoints aligned lexically. Approved copy retained; no invented word times or karaoke. Human sync review pending.','mixMetrics':loudness(out/'mix.wav'),'cost':manifest['cost'],'subjectiveAudioQA':'BLOCKED_NO_DIRECT_LISTENING','publication':'NOT_APPROVED'}
public=root/'public/marketing04';public.mkdir(exist_ok=True);shutil.copy2(out/'mix.wav',public/'mix.wav')
for p in [out/'timeline.json',public/'manifest.json']:p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for ext in ['srt','vtt']:
    text='WEBVTT\n\n' if ext=='vtt' else ''
    for i,p in enumerate(pages):text+=(f'{i+1}\n' if ext=='srt' else '')+f"{stamp(p['startMs'],'.' if ext=='vtt' else ',')} --> {stamp(p['endMs'],'.' if ext=='vtt' else ',')}\n{p['text']}\n\n"
    (out/('subtitles.'+ext)).write_text(text,encoding='utf-8')
print(json.dumps({'duration':m['durationSeconds'],'alignment':alignment,'mix':m['mixMetrics']},indent=2),flush=True)
