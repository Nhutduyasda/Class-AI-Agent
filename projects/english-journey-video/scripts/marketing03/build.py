"""Offline production from verified owner-provided Azure WAV. No synthesis calls."""
import json,math,hashlib,shutil,sys,wave
from pathlib import Path
import numpy as np
from scipy.signal import lfilter
sys.path.insert(0,str(Path.cwd()))
from scripts.v2.build import read_wav,write_wav,normalize,original_music,original_sfx,loudness,stamp
out=Path('out/marketing03');cache=Path('.cache/marketing03/mix');cache.mkdir(parents=True,exist_ok=True)
b=Path('briefs/marketing-video-03-approved.json').read_bytes();brief=json.loads(b);manifest=json.loads((out/'audio-manifest.json').read_text());assert hashlib.sha256(b).hexdigest()==manifest['briefSha256']
parts=[['Hôm qua ChatGPT vừa sửa lỗi này…','hôm nay bạn lại sai y chang?'],['Có bao giờ bạn nhờ ChatGPT','sửa một câu tiếng Anh,','thấy đáp án đúng rồi','chuyển ngay sang bài khác?','Nhưng đến khi tự đặt câu,','bạn lại mắc đúng lỗi cũ.'],['Mình nhận ra,','chỉ xem câu được sửa thì chưa đủ.','Giờ mỗi khi mắc lỗi,','mình hỏi AI vì sao mình sai,','rồi thử tự viết lại câu cho đúng.'],['Ví dụ, mình viết:','Yesterday, I go to school.','ChatGPT chỉ ra rằng vì có yesterday,','động từ go cần đổi thành went.','Câu đúng là:','Yesterday, I went to school.','Sau đó, mình thử đặt thêm câu khác','để luyện lại cấu trúc này.'],['Cuối buổi, mình ghi lỗi đó','vào Error Log.','Buổi học sau, mình gửi lại danh sách lỗi','và nhờ ChatGPT kiểm tra.','Như vậy, mình biết mình thường sai ở đâu','và cần luyện thêm phần nào.'],['Nếu bạn cũng hay được sửa rồi lại quên,','bình luận BẮT ĐẦU nhé!','Mình chia sẻ cách thiết lập ChatGPT','để học như vậy.']]
pauses=[.6,.8,.8,1.3,.9,2.0];cursor=0;pieces=[];scenes=[];pages=[];tokens=[];assets=[];markers={};segments=[]
for index,(s,phrases,tail) in enumerate(zip(brief['spokenSegments'],parts,pauses)):
 assert ' '.join(phrases)==s['spoken'];name=s['id'];f=out/'raw'/(name+'.wav');fm=next(x for x in manifest['files'] if x['scene']==name);assert hashlib.sha256(f.read_bytes()).hexdigest()==fm['sha256']
 raw=read_wav(f);obs=json.loads(f.with_suffix('.asr.json').read_text());words=[w for x in obs for w in x['words']];assert len(words)==len(s['spoken'].split())
 norm=cache/(name+'.wav');metrics=normalize(f,norm,-17);a=read_wav(norm);offset=cursor/48000;start=cursor//1600;ix=0
 for phrase in phrases:
  group=words[ix:ix+len(phrase.split())];ix+=len(group);begin=offset+group[0]['start'];end=offset+group[-1]['end'];assert end<=offset+len(raw)/48000
  token={'scene':name,'text':phrase,'startMs':begin*1000,'endMs':end*1000,'timingLevel':'ASR_OBSERVED_PHRASE','observedText':' '.join(w['word'].strip() for w in group)};tokens.append(token);pages.append(dict(token))
 if name=='demo':
  for key,wi in [('demo-explain',9),('demo-correct',23),('demo-practice',31)]:markers[key]=round((offset+words[wi]['start'])*30)
 if name=='benefit':markers['benefit-return']=round((offset+words[10]['start'])*30)
 pieces.append(a);cursor+=len(a);end=math.ceil((cursor/48000+tail)*30);pieces.append(np.zeros(end*1600-cursor));cursor=end*1600
 scenes.append({'type':name,'startFrame':start,'endFrame':end});segments.append({**s,'startMs':offset*1000,'endMs':cursor/48,'rawDurationSeconds':len(raw)/48000});assets.append({**fm,'normalization':metrics})
# Extend readable phrases across short intra-sentence gaps, without invented word times.
for i,p in enumerate(pages):
 scene=next(x for x in scenes if x['type']==p['scene']);nxt=pages[i+1]['startMs'] if i+1<len(pages) else scene['endFrame']/30*1000
 p['endMs']=min(max(p['endMs'],p['startMs']+900),nxt,scene['endFrame']/30*1000)
voice=np.concatenate(pieces);write_wav(cache/'voice.wav',voice)
write_wav(cache/'music-raw.wav',original_music(cursor,90));normalize(cache/'music-raw.wav',cache/'music.wav',-36);music=read_wav(cache/'music.wav');rms=np.sqrt(np.maximum(lfilter([1/960]*960,[1],voice**2),0));duck=1-.45*np.clip(rms/.05,0,1);music*=duck[:,None]
events=[{'kind':'bridge','frame':s['startFrame']} for s in scenes[1:]]+[{'kind':'complete','frame':markers['demo-correct']}]
sfx=original_sfx(cursor,events)*.3;stereo=voice[:,None]*np.array([.70710678,.70710678]);mix=stereo+music+sfx;write_wav(cache/'mix.wav',mix);metric=loudness(cache/'mix.wav');gain=min(10**((-16-float(metric['input_i']))/20),10**(-1.7/20)/np.max(np.abs(mix)))
for name,a in [('voiceover',stereo),('music',music),('sfx',sfx),('mix',mix)]:write_wav(out/(name+'.wav'),a*gain)
m={'version':'1.1','fps':30,'durationInFrames':cursor//1600,'durationSeconds':cursor/48000,'audioSrc':'marketing03/mix.wav','scenes':scenes,'segments':segments,'tokens':tokens,'pages':pages,'markers':markers,'events':events,'briefSha256':hashlib.sha256(b).hexdigest(),'assets':assets,'captionTiming':'Local faster-whisper small observed phrase endpoints, lexical positions checked equal counts; original approved copy retained. ASR substitutions in evidence. No synthetic word timestamps/karaoke. Human sync review pending.','mixMetrics':loudness(out/'mix.wav'),'voiceMetrics':loudness(out/'voiceover.wav'),'musicMetrics':loudness(out/'music.wav'),'cost':manifest['cost'],'subjectiveAudioQA':'BLOCKED_NO_DIRECT_LISTENING','publication':'NOT_APPROVED'}
public=Path('public/marketing03');public.mkdir(exist_ok=True);shutil.copy2(out/'mix.wav',public/'mix.wav')
for p in [out/'timeline.json',public/'manifest.json']:p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
for ext in ['srt','vtt']:
 text='WEBVTT\n\n' if ext=='vtt' else ''
 for i,p in enumerate(pages):text+=(f'{i+1}\n' if ext=='srt' else '')+f"{stamp(p['startMs'],'.' if ext=='vtt' else ',')} --> {stamp(p['endMs'],'.' if ext=='vtt' else ',')}\n{p['text']}\n\n"
 (out/('subtitles.'+ext)).write_text(text)
print(json.dumps({'duration':m['durationSeconds'],'scenes':scenes,'mix':m['mixMetrics'],'voice':m['voiceMetrics'],'music':m['musicMetrics']},indent=2))
