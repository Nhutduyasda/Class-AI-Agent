"""Offline Azure V1.2 assembly. Never synthesizes or makes network requests.
Input: six immutable Azure WAVs + local Whisper word observations.
Timing: authored phrase ranges use observed ASR word endpoints, never uniform spacing.
"""
import sys,json,math,hashlib,shutil,wave
from pathlib import Path
sys.path.insert(0,str(Path.cwd()))
import numpy as np
from scipy.signal import lfilter
from scripts.v2.build import write_wav,read_wav,normalize,original_music,original_sfx,loudness,SR,stamp,command
out=Path('out/marketing02/azure-v12');out.mkdir(parents=True,exist_ok=True)
cache=Path('.cache/marketing02-v12');cache.mkdir(parents=True,exist_ok=True)
source=Path('briefs/marketing-video-02-approved.json');brief=json.loads(source.read_text())
ledger=json.loads((out/'ledger.json').read_text())
assert all(x['attempts']==1 and x['status']=='GENERATED_DOWNLOADED_DECODED' for x in ledger['newPlan'])
assert ledger['allKnownReferenceUsd']<=ledger['limitUsd']
files=['A-HOOK-NamMinh-S0.wav','C-PROBLEM-NamMinh-S0-V12.wav','D-SOLUTION-NamMinh-S0-V12.wav','B-DEMO-NamMinh-S0.wav','E-BENEFIT-NamMinh-S0-V12.wav','F-CTA-NamMinh-S0-V12.wav']
phrases=[
['Học 10 từ tiếng Anh hôm nay…','vài ngày sau quên gần hết?','Bạn có đang như vậy không?'],
['Bạn học nghĩa của từ,','ghi vào vở, đọc lại vài lần.','Nhưng đến khi cần đặt câu,','bạn lại chẳng biết dùng từ đó như thế nào.'],
['Vậy thử đổi cách học xem!','Thay vì chỉ nhờ ChatGPT giải nghĩa,','mình dùng AI để luyện cách sử dụng','từ vựng ngay trong câu.'],
['Ví dụ với từ improve,','nghĩa là cải thiện.','AI không chỉ giải thích,','mà còn yêu cầu mình tự đặt câu.','Mình viết:','I want to improve my English.','Sau đó, AI kiểm tra','và giúp mình sửa nếu có lỗi.'],
['Những từ chưa nhớ, mình lưu lại','để buổi sau nhờ AI kiểm tra tiếp.','Như vậy, mình biết cần ôn từ nào','thay vì cứ học thêm từ mới.'],
['Muốn biết cách mình thiết lập ChatGPT','để học như vậy?','Bình luận BẮT ĐẦU,','mình chia sẻ cách làm nhé!']]
pieces=[];cursor=0;scenes=[];segments=[];pages=[];tokens=[];assets=[]
for line,parts,name in zip(brief['spokenSegments'],phrases,files):
 assert ' '.join(parts)==line['spoken']
 f=out/name;sha=hashlib.sha256(f.read_bytes()).hexdigest()
 expected=ledger['reusedDemoSha256'] if line['id']=='demo' else next(x['sha256'] for x in ledger['newPlan'] if x['id']==line['id'])
 assert sha==expected, 'Raw Azure audio changed'
 with wave.open(str(f)) as w: raw_duration=w.getnframes()/w.getframerate();raw_rate=w.getframerate()
 pcm=cache/(line['id']+'-48.wav');command(['ffmpeg','-v','error','-y','-i',str(f),'-ar',str(SR),'-ac','1',str(pcm)])
 normalized=cache/(line['id']+'-norm.wav');metrics=normalize(pcm,normalized,-17);a=read_wav(normalized)
 obs=json.loads(f.with_suffix('.asr.json').read_text());words=[w for s in obs for w in s['words']]
 # These six observations have the same lexical token count as the approved input.
 # Keep original captions; ASR substitutions remain in evidence and require listening.
 assert len(words)==len(line['spoken'].split()), (name,len(words),len(line['spoken'].split()))
 start=cursor//1600;offset=cursor/SR;ix=0
 for i,text in enumerate(parts):
  group=words[ix:ix+len(text.split())];ix+=len(group)
  begin=(offset+group[0]['start'])*1000;end=(offset+group[-1]['end'])*1000
  assert 0<=group[0]['start']<group[-1]['end']<=raw_duration
  token={'text':text,'startMs':begin,'endMs':end,'scene':line['id'],'segmentId':f"{line['id']}-{i}",'timingLevel':'ASR-observed-phrase','observedText':' '.join(w['word'].strip() for w in group),'sourceStartSeconds':group[0]['start'],'sourceEndSeconds':group[-1]['end']}
  tokens.append(token);pages.append({**token,'tokens':[token]})
 pieces.append(a);cursor+=len(a)
 # Preserve natural source pauses, then hold existing visuals; no time/pitch stretch.
 end=math.ceil((cursor/SR+(2.1 if line['id']=='cta' else .8))*30)
 pieces.append(np.zeros(end*1600-cursor));cursor=end*1600
 scenes.append({'type':line['id'],'startFrame':start,'endFrame':end})
 segments.append({**line,'startMs':start/30*1000,'endMs':end/30*1000,'audioDurationSeconds':raw_duration})
 assets.append({'scene':line['id'],'file':name,'sha256':sha,'sourceSampleRate':raw_rate,'durationSeconds':raw_duration,'normalization':metrics,'provenance':'Approved recovered sample; unchanged bytes' if line['id']=='demo' else 'Azure Speech Studio S0 export, one synthesis request'})
 print(line['id'],raw_duration,'scene',round((end-start)/30,3),flush=True)
vo=np.concatenate(pieces);write_wav(cache/'voice.wav',vo)
write_wav(cache/'music-raw.wav',original_music(cursor,90));normalize(cache/'music-raw.wav',cache/'music.wav',-36);music=read_wav(cache/'music.wav')
rms=np.sqrt(np.maximum(lfilter([1/960]*960,[1],vo**2),0));gain=1-.4*np.clip(rms/.05,0,1);music*=gain[:,None]
events=[{'kind':'bridge','frame':s['startFrame']} for s in scenes[1:]]
events.append({'kind':'complete','frame':round(next(t['startMs'] for t in tokens if t['text']=='Sau đó, AI kiểm tra')*.03)})
sfx=original_sfx(cursor,events)*.35;stereo=vo[:,None]*np.array([.70710678]*2);mix=stereo+music+sfx
write_wav(cache/'mix.wav',mix);metric=loudness(cache/'mix.wav');master=min(10**((-16-float(metric['input_i']))/20),10**(-1.5/20)/np.max(np.abs(mix)))
for n,a in [('voice',stereo),('music',music),('sfx',sfx),('mix',mix)]:write_wav(out/f'{n}.wav',a*master)
m={'version':'1.2','fps':30,'durationInFrames':cursor//1600,'durationSeconds':cursor/SR,'audioSrc':'marketing02-v12/mix.wav','scenes':scenes,'segments':segments,'tokens':tokens,'pages':pages,'events':events,'voice':'Azure Speech Standard S0 vi-VN-NamMinhNeural','rate':'+0%','pitch':'default','captionTiming':'Phrase endpoints observed by local faster-whisper small; approved text retained. No interpolated word times or karaoke. Subjective alignment/pronunciation requires owner listening.','assets':assets,'briefSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'visualSourceSha256':hashlib.sha256(Path('src/Marketing02.tsx').read_bytes()).hexdigest(),'mixMetrics':loudness(out/'mix.wav'),'voiceMetrics':loudness(out/'voice.wav'),'musicMetrics':loudness(out/'music.wav'),'ducking':{'minGain':float(gain.min()),'maxGain':float(gain.max()),'meanGain':float(gain.mean())},'synthesisCost':ledger}
public=Path('public/marketing02-v12');public.mkdir(exist_ok=True);shutil.copyfile(out/'mix.wav',public/'mix.wav')
for p in [public/'manifest.json',out/'timeline.json']:p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
for ext in ['srt','vtt']:
 text='WEBVTT\n\n' if ext=='vtt' else ''
 for i,p in enumerate(pages):text+=(f'{i+1}\n' if ext=='srt' else '')+f"{stamp(p['startMs'],'.' if ext=='vtt' else ',')} --> {stamp(p['endMs'],'.' if ext=='vtt' else ',')}\n{p['text']}\n\n"
 (out/f'subtitles.{ext}').write_text(text)
print('DURATION',m['durationSeconds'],flush=True)
