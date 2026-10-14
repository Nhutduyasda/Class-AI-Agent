"""Build V2 auditions, real voice timing, original score/SFX and a ducked stereo mix."""
from __future__ import annotations
import argparse, asyncio, hashlib, json, math, shutil, subprocess, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import lfilter

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'voiceover'))
from providers import get_provider
from build import make_pages, stamp

SR=48000
BUILDER_HASH=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()

def command(args):
    return subprocess.run(args,check=True,capture_output=True,text=True)

def write_wav(path,data):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    channels=1 if data.ndim==1 else data.shape[1]
    with wave.open(str(path),'wb') as f:
        f.setnchannels(channels);f.setsampwidth(2);f.setframerate(SR)
        f.writeframes((np.clip(data,-.999,.999)*32767).astype('<i2').tobytes())

def read_wav(path):
    with wave.open(str(path),'rb') as f:
        channels=f.getnchannels();n=f.getnframes()
        if f.getframerate()!=SR or f.getsampwidth()!=2:raise ValueError('Unexpected PCM format')
        a=np.frombuffer(f.readframes(n),dtype='<i2').astype(np.float64)/32768
    return a if channels==1 else a.reshape(-1,channels)

def loudness(path):
    r=command(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])
    return json.loads(r.stderr[r.stderr.rfind('{'):])

def normalize(path,out,target):
    m=loudness(path)
    a=read_wav(path);gain=10**((target-float(m['input_i']))/20)
    if np.max(np.abs(a))*gain>10**(-1.5/20):gain=10**(-1.5/20)/np.max(np.abs(a))
    write_wav(out,a*gain)
    return {'input':m,'gainDb':20*math.log10(gain),'output':loudness(out)}

def add(target,clip,at):
    start=round(at*SR);end=min(len(target),start+len(clip))
    if start<0 or start>=len(target):return
    target[start:end]+=clip[:end-start]

def midi(n):return 440*2**((n-69)/12)

def note(freq,duration,pan=0,kind='pluck'):
    t=np.arange(round(duration*SR))/SR
    attack=np.minimum(t/.018,1)
    if kind=='pad':
        env=attack*np.minimum((duration-t)/.3,1)
        s=(np.sin(2*np.pi*freq*t)+.15*np.sin(2*np.pi*freq*2*t))*.08*env
    else:
        env=attack*np.exp(-t*2.5)*np.minimum((duration-t)/.08,1)
        s=(np.sin(2*np.pi*freq*t)+.23*np.sin(2*np.pi*freq*2*t)+.08*np.sin(2*np.pi*freq*3*t))*.16*env
    return s[:,None]*np.array([math.sqrt((1-pan)/2),math.sqrt((1+pan)/2)])[None,:]

def original_music(length,bpm):
    duration=length/SR;beat=60/bpm
    bed=np.zeros((length,2),dtype=np.float64)
    # Common harmony only; original project-generated pattern, no tune/sample imports.
    chords=[[57,60,64,71],[53,57,60,64],[60,64,67,74],[55,59,62,69]]
    for bar in range(math.ceil(duration/(4*beat))):
        base=bar*4*beat;chord=chords[bar%len(chords)]
        for j,pitch in enumerate(chord):add(bed,note(midi(pitch),4*beat+.15,(-.25 if j%2 else .25),'pad'),base)
        # Sparse new arpeggio; one soft pluck on every other beat, not busy melody.
        for slot in [0,2,3.5]:
            pitch=chord[(bar*3+int(slot))%len(chord)]+12
            add(bed,note(midi(pitch),1.1,(-.4 if bar%2 else .4)),base+slot*beat)
        add(bed,note(midi(chord[0]-12),2.2,0),base)
        for slot in [0,2]:
            t=np.arange(int(.16*SR))/SR
            kick=np.sin(2*np.pi*(70*t-65*t*t))*np.exp(-t*32)*np.minimum(t/.006,1)*.08
            add(bed,np.column_stack([kick,kick])*.707,base+slot*beat)
    t=np.arange(length)/SR
    fades=np.minimum(t/.35,1)*np.minimum((duration-t)/.7,1)
    return bed*fades[:,None]

def original_sfx(length,events):
    track=np.zeros((length,2))
    rng=np.random.default_rng(1515)
    for event in events:
        if event['kind']=='bridge':
            t=np.arange(int(.28*SR))/SR
            noise=lfilter([1,-1],[1,-.65],rng.normal(0,1,len(t)))
            sound=noise*np.sin(np.pi*t/.28)**2*.012
        else:
            t=np.arange(int(.24*SR))/SR
            freq=720 if event['kind']=='spell' else 930
            sound=(np.sin(2*np.pi*freq*t)+.3*np.sin(2*np.pi*freq*1.5*t))*np.exp(-t*18)*np.minimum(t/.01,1)*.065
        add(track,np.column_stack([sound,sound])*.707,event['frame']/30)
    return track

def v2_pages(tokens,scenes,segments):
    # Author readable clause boundaries; use ONLY real provider word times.
    groups=[]
    for segment in segments:
        words=[t for t in tokens if t['segmentId']==segment['id']]
        cursor=0
        for part in segment['captionParts']:
            count=len(part.split());group=words[cursor:cursor+count];cursor+=count
            if ' '.join(t['text'] for t in group)!=part or len(part)>64:
                raise ValueError('Caption clause differs from spoken words or is too long')
            groups.append(group)
        if cursor!=len(words):raise ValueError('Caption clauses do not cover every word')
    pages=[]
    for i,g in enumerate(groups):
        start=g[0]['startMs'];spoken_end=g[-1]['endMs']
        scene_end=next(s['endFrame']/30*1000 for s in scenes if s['type']==g[0]['scene'])
        next_start=groups[i+1][0]['startMs'] if i+1<len(groups) else scene_end
        end=min(max(spoken_end,start+1000),next_start,scene_end)
        pages.append({'startMs':start,'endMs':end,'speechEndMs':spoken_end,'text':' '.join(t['text'] for t in g),'tokens':g})
    return pages

async def synth(spec,voice,cache):
    result=await get_provider('edge').synthesize(text=spec['text'],voice=voice,rate=spec['rate'],cache_dir=Path('.cache/tts'))
    pcm=cache/f"{spec['id']}-{voice}.wav"
    command(['ffmpeg','-v','error','-y','-i',str(result.audio_path),'-ar',str(SR),'-ac','1','-c:a','pcm_s16le',str(pcm)])
    return read_wav(pcm),result.tokens

async def build(human_manifest=None):
    plan_path=Path('briefs/lesson15-v2-production.json');plan=json.loads(plan_path.read_text())
    if plan['bpm']!=90 or plan['fps']!=30:raise ValueError('This production uses a 90 BPM / 30 FPS grid; adapt timing before changing it.')
    brief=json.loads(Path(plan['sourceBrief']).read_text());fps=plan['fps'];frames_per_beat=60/plan['bpm']*fps
    cache=Path('.cache/v2');cache.mkdir(parents=True,exist_ok=True);out=Path('out');out.mkdir(exist_ok=True)
    if human_manifest:
        human=json.loads(Path(human_manifest).read_text())
        if not human.get('consentToUseRecording'):raise ValueError('Human-recording consent must be declared')
    else:human=None
    # Two honest TTS auditions, same hook/reveal, no unverified "winner" score.
    for audition in plan['auditions']:
        audio=[]
        for scene_index,line_index in [(0,0),(4,0)]:
            line={**plan['scenes'][scene_index]['lines'][line_index],'rate':audition['rate']}
            pcm,_=await synth(line,audition['voice'],cache)
            audio.extend([pcm,np.zeros(round(.3*SR))])
        raw=cache/f"audition-{audition['id']}-raw.wav";write_wav(raw,np.concatenate(audio))
        normalize(raw,out/f"v2-audition-{audition['id']}.wav",-16)
        print(f"Audition {audition['id']} generated; listening not performed by agent.",flush=True)
    pieces=[];cursor=round(.08*SR);pieces.append(np.zeros(cursor));scene_start=0
    scenes=[];segments=[];tokens=[]
    for scene in plan['scenes']:
        for index,line in enumerate(scene['lines']):
            print('Narration:',line['id'],flush=True)
            if human:
                spec=next((s for s in human['segments'] if s['id']==line['id']),None)
                if spec is None:raise ValueError(f'Missing human audio for {line["id"]}')
                decoded=cache/f"human-{line['id']}.wav"
                command(['ffmpeg','-v','error','-y','-i',spec['audioPath'],'-ar',str(SR),'-ac','1','-c:a','pcm_s16le',str(decoded)])
                pcm=read_wav(decoded);word_tokens=spec['tokens']
                if ' '.join(t['text'] for t in word_tokens)!=line['text']:raise ValueError('Human alignment differs from transcript')
            else:pcm,word_tokens=await synth(line,plan['provisionalVoice'],cache)
            start=cursor/SR*1000
            if not word_tokens or word_tokens[-1]['endMs']>len(pcm)/SR*1000+30:raise ValueError('Invalid audio boundary')
            shifted=[{**t,'startMs':t['startMs']+start,'endMs':t['endMs']+start,'segmentId':line['id'],'scene':scene['id']} for t in word_tokens]
            tokens.extend(shifted);pieces.append(pcm);cursor+=len(pcm)
            segments.append({**line,'scene':scene['id'],'startMs':start,'endMs':cursor/SR*1000,'speechEndMs':shifted[-1]['endMs']})
            if index<len(scene['lines'])-1:
                silence=np.zeros(round(.16*SR));pieces.append(silence);cursor+=len(silence)
        # Hold the finished sentence; snap scene ends AFTER full outgoing audio.
        min_end=scene_start/fps+scene['minimumSeconds']
        desired=max(cursor/SR+.18,min_end)
        end_frame=math.ceil(desired*fps/frames_per_beat)*round(frames_per_beat)
        samples=round(end_frame/fps*SR);pieces.append(np.zeros(samples-cursor));cursor=samples
        scenes.append({'type':scene['id'],'startFrame':scene_start,'endFrame':end_frame});scene_start=end_frame
    duration=cursor/SR
    if not plan['durationMin']<=duration<=plan['durationMax']:raise ValueError(f'Duration {duration}s; revise narration instead of stretching it.')
    raw_voice=cache/'voice-raw.wav';write_wav(raw_voice,np.concatenate(pieces))
    voice_metrics=normalize(raw_voice,out/'v2-voice.wav',-16);voice=read_wav(out/'v2-voice.wav')
    events=[{'kind':'spell','frame':scenes[1]['startFrame']+20}, {'kind':'spell','frame':scenes[1]['startFrame']+80},
            {'kind':'bridge','frame':math.ceil(next(t['startMs'] for t in tokens if t['segmentId']=='connector' and t['text'].lower().startswith('và'))*.03/frames_per_beat)*round(frames_per_beat)}, {'kind':'complete','frame':scenes[3]['startFrame']+40}]
    score=original_music(cursor,plan['bpm']);write_wav(cache/'music-raw.wav',score)
    normalize(cache/'music-raw.wav',cache/'music-base.wav',-36)
    music=read_wav(cache/'music-base.wav')
    # Deterministic speech envelope: attack 20ms, release 280ms; <=4.4dB duck.
    square=lfilter([1/960]*960,[1],voice**2);rms=np.sqrt(np.maximum(square,0))
    target=1-.4*np.clip(rms/.05,0,1);gain=np.empty(cursor);state=1.0
    for i,v in enumerate(target):
        alpha=math.exp(-1/(SR*(.02 if v<state else .28)))
        state=alpha*state+(1-alpha)*v;gain[i]=state
    music*=gain[:,None]
    sfx=original_sfx(cursor,events)
    mixed=voice[:,None]*np.array([.70710678,.70710678])+music+sfx
    raw_mix=cache/'mix-raw.wav';write_wav(raw_mix,mixed)
    metrics=loudness(raw_mix);master=10**((-16-float(metrics['input_i']))/20)
    master=min(master,10**(-1.5/20)/np.max(np.abs(mixed)))
    write_wav(out/'v2-voice.wav',voice[:,None]*np.array([.70710678,.70710678])*master)
    write_wav(out/'v2-music.wav',music*master)
    write_wav(out/'v2-sfx.wav',sfx*master)
    write_wav(out/'v2-mix.wav',mixed*master)
    public=Path('public/v2');public.mkdir(parents=True,exist_ok=True);shutil.copyfile(out/'v2-mix.wav',public/'mix.wav')
    pages=v2_pages(tokens,scenes,segments)
    manifest={'id':plan['id'],'fps':fps,'durationInFrames':scene_start,'durationSeconds':duration,
              'audioSrc':'v2/mix.wav','facts':brief['facts'],'scenes':scenes,'segments':segments,'tokens':tokens,'pages':pages,
              'events':events,'bpm':plan['bpm'],'framesPerBeat':frames_per_beat,'beatOneOffsetFrames':0,
              'planSha256':hashlib.sha256(plan_path.read_bytes()).hexdigest(),'builderSha256':BUILDER_HASH,
              'sourceBriefSha256':hashlib.sha256(Path(plan['sourceBrief']).read_bytes()).hexdigest(),
              'voice':plan['provisionalVoice'] if not human else 'consented human recording',
              'voiceSelectionStatus':plan['voiceSelectionStatus'] if not human else 'HUMAN_RECORDING_PENDING_LISTENING',
              'voiceMetrics':voice_metrics,'mixMetrics':loudness(out/'v2-mix.wav'),
              'musicMetrics':loudness(out/'v2-music.wav'),'sfxMetrics':loudness(out/'v2-sfx.wav'),
              'ducking':{'attackMs':20,'releaseMs':280,'maximumReductionDb':-20*math.log10(.6)}}
    (public/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    shutil.copyfile(public/'manifest.json',out/'v2-timeline.json')
    for ext in ['srt','vtt']:
        text=('WEBVTT\n\n' if ext=='vtt' else '')
        for i,p in enumerate(pages):text+=(f'{i+1}\n' if ext=='srt' else '')+f"{stamp(p['startMs'],'.' if ext=='vtt' else ',')} --> {stamp(p['endMs'],'.' if ext=='vtt' else ',')}\n{p['text']}\n\n"
        (out/f'v2-subtitles.{ext}').write_text(text)
    transcript='# V2 — lời đọc và hướng dẫn biểu diễn\n\n'
    for s in segments:transcript+=f"## {s['scene']} · {s['startMs']/1000:.3f}–{s['endMs']/1000:.3f}s\n\n{s['text']}\n\nDirection: {s['intent']}\n\n"
    (out/'v2-read-aloud-script.md').write_text(transcript)
    license_={'music':{'title':'English Journey — Paper & Progress','creator':'Original project algorithmic synthesis',
               'source':'scripts/v2/build.py:original_music','bpm':plan['bpm'],'thirdPartyMusic':False,'borrowedMelody':False,'importedSamples':False,
               'method':'Original sine-harmonic pads/plucks, common chord tones, bass pulses; deterministic pattern. No stock song.'},
               'sfx':{'source':'scripts/v2/build.py:original_sfx','method':'Original sine chimes and seeded filtered noise; no imported samples'},
               'voice':{'provider':'Microsoft Edge consumer read-aloud via edge-tts','usage':'Review-only technical TTS auditions; no identity cloning',
               'commercialRightsStatus':'NOT_VERIFIED; do not represent an Edge audition as a commercially licensed voice asset. Use a consented human recording or an approved licensed provider before publication.'},
               'font':{'name':'DejaVu Sans','licenseFile':'public/fonts/LICENSE.txt'},'paidCalls':0}
    Path('assets/music-license-manifest.json').write_text(json.dumps(license_,ensure_ascii=False,indent=2)+'\n')
    print(f'V2 mix built: {duration:.3f}s, {scene_start} frames, {len(tokens)} real word boundaries.',flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--human-manifest');a=p.parse_args();asyncio.run(build(a.human_manifest))
