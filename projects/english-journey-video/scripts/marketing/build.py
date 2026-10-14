"""Locked-script production. Reuses the provider and original DSP, never retimes speech."""
import sys, asyncio, json, math, hashlib, shutil
from pathlib import Path
sys.path.insert(0,str(Path.cwd()))
from scripts.v2.build import synth, write_wav, read_wav, normalize, loudness, original_music, original_sfx, SR, stamp
import numpy as np
from scipy.signal import lfilter

async def main():
    source=Path('briefs/marketing-video-01-approved.json'); brief=json.loads(source.read_text())
    cache=Path('.cache/marketing'); cache.mkdir(parents=True,exist_ok=True)
    out=Path('out'); out.mkdir(exist_ok=True)
    voice='vi-VN-HoaiMyNeural'
    for name,v in [('A',voice),('B','vi-VN-NamMinhNeural')]:
        clips=[]
        for line in brief['spokenSegments'][:2]:
            a,_=await synth({'id':line['id'],'text':line['spoken'],'rate':'+0%'},v,cache)
            clips.extend([a,np.zeros(int(.25*SR))])
        raw=cache/f'audition-{name}.wav';write_wav(raw,np.concatenate(clips));normalize(raw,out/f'marketing-audition-{name}.wav',-16)
        print('Audition',name,'generated; selection listening BLOCKED',flush=True)
    pieces=[];cursor=0;scenes=[];tokens=[];segments=[]
    for line in brief['spokenSegments']:
        start_frame=cursor//1600
        a,words=await synth({'id':line['id'],'text':line['spoken'],'rate':'+0%'},voice,cache)
        offset=cursor/SR*1000
        shifted=[{**t,'startMs':t['startMs']+offset,'endMs':t['endMs']+offset,'scene':line['id'],'segmentId':line['id']} for t in words]
        tokens.extend(shifted);pieces.append(a);cursor+=len(a)
        segments.append({**line,'startMs':offset,'endMs':cursor/SR*1000})
        desired=cursor/SR+.35
        if line['id']=='demo':
            reveal=next(t['startMs']/1000 for t in shifted if t['text'].lower().startswith('sau'))
            desired=max(desired,reveal+7)
        end=math.ceil(desired*30/20)*20
        pieces.append(np.zeros(end*1600-cursor));cursor=end*1600
        scenes.append({'type':line['id'],'startFrame':start_frame,'endFrame':end})
        print(line['id'],round(len(a)/SR,2),'seconds',flush=True)
    raw=cache/'voice-raw.wav';write_wav(raw,np.concatenate(pieces));normalize(raw,cache/'voice.wav',-16);vo=read_wav(cache/'voice.wav')
    write_wav(cache/'music-raw.wav',original_music(cursor,90));normalize(cache/'music-raw.wav',cache/'music.wav',-36);music=read_wav(cache/'music.wav')
    rms=np.sqrt(np.maximum(lfilter([1/960]*960,[1],vo**2),0));target=1-.4*np.clip(rms/.05,0,1);gain=np.empty(cursor);state=1.
    for i,v in enumerate(target):
        alpha=math.exp(-1/(SR*(.02 if v<state else .28)));state=alpha*state+(1-alpha)*v;gain[i]=state
    music*=gain[:,None]
    demo=next(s for s in scenes if s['type']=='demo')
    def anchor(prefix,fallback):
        return round(next((t['startMs']*.03 for t in tokens if t['scene']=='demo' and t['text'].lower().startswith(prefix)),demo['startFrame']+fallback))
    events=[{'kind':'spell','frame':anchor('chính',180)}, {'kind':'bridge','frame':anchor('and',250)}, {'kind':'complete','frame':anchor('sau',300)}]
    sfx=original_sfx(cursor,events);stereo=vo[:,None]*np.array([2**-.5]*2);mixed=stereo+music+sfx
    write_wav(cache/'mix.wav',mixed);metric=loudness(cache/'mix.wav');master=min(10**((-16-float(metric['input_i']))/20),10**(-1.5/20)/np.max(np.abs(mixed)))
    for name,a in [('voice',stereo),('music',music),('sfx',sfx),('mix',mixed)]:write_wav(out/f'marketing-{name}.wav',a*master)
    pages=[]
    for scene in scenes:
        words=[t for t in tokens if t['scene']==scene['type']];groups=[];group=[]
        for t in words:
            if group and (len(' '.join(w['text'] for w in group+[t]))>47 or len(group)>=8):groups.append(group);group=[]
            group.append(t)
            if t['text'].endswith(('.', '?', '…', ':', ',')) and len(group)>=3:groups.append(group);group=[]
        if group:groups.append(group)
        for i,g in enumerate(groups):
            end=groups[i+1][0]['startMs'] if i+1<len(groups) else scene['endFrame']/30*1000
            pages.append({'startMs':g[0]['startMs'],'endMs':end,'text':' '.join(w['text'] for w in g),'tokens':g})
    m={'fps':30,'durationInFrames':cursor//1600,'durationSeconds':cursor/SR,'audioSrc':'marketing/mix.wav','scenes':scenes,'segments':segments,'tokens':tokens,'pages':pages,'events':events,'facts':brief['approvedEvidence'],'voice':voice,'voiceSelection':'PROVISIONAL; listening BLOCKED','briefSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'builderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'mixMetrics':loudness(out/'marketing-mix.wav'),'voiceMetrics':loudness(out/'marketing-voice.wav'),'musicMetrics':loudness(out/'marketing-music.wav')}
    public=Path('public/marketing');public.mkdir(exist_ok=True);shutil.copyfile(out/'marketing-mix.wav',public/'mix.wav')
    for p in [public/'manifest.json',out/'marketing-timeline.json']:p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
    for ext in ['srt','vtt']:
        text='WEBVTT\n\n' if ext=='vtt' else ''
        for i,p in enumerate(pages):text+=(f'{i+1}\n' if ext=='srt' else '')+f"{stamp(p['startMs'],'.' if ext=='vtt' else ',')} --> {stamp(p['endMs'],'.' if ext=='vtt' else ',')}\n{p['text']}\n\n"
        (out/f'marketing-subtitles.{ext}').write_text(text)
    (out/'marketing-transcript.md').write_text('# Approved transcript — unchanged\n\n'+'\n\n'.join(s['spoken'] for s in segments))
    print('ACTUAL DURATION',cursor/SR,flush=True)
if __name__=='__main__':asyncio.run(main())
