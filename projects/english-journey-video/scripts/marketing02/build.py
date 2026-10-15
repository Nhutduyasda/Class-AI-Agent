"""Video 02 only: local Piper, measured phrase cues, existing original DSP."""
import sys,json,math,hashlib,shutil,wave,re
from pathlib import Path
sys.path.insert(0,str(Path.cwd()))
import numpy as np
from scipy.signal import lfilter
from piper import PiperVoice,SynthesisConfig
from scripts.v2.build import write_wav,read_wav,normalize,original_music,original_sfx,loudness,SR,stamp,command
out=Path('out/marketing02');out.mkdir(parents=True,exist_ok=True)
cache=Path('.cache/marketing02');cache.mkdir(parents=True,exist_ok=True)
source=Path('briefs/marketing-video-02-approved.json');brief=json.loads(source.read_text())
# Semantic, authored phrase boundaries. No invented evenly spaced word timestamps.
phrases=[
['Học 10 từ tiếng Anh hôm nay…','vài ngày sau quên gần hết?','Bạn có đang như vậy không?'],
['Bạn học nghĩa của từ,','ghi vào vở, đọc lại vài lần.','Nhưng đến khi cần đặt câu,','bạn lại chẳng biết dùng từ đó như thế nào.'],
['Vậy thử đổi cách học xem!','Thay vì chỉ nhờ ChatGPT giải nghĩa,','mình dùng AI để luyện cách sử dụng','từ vựng ngay trong câu.'],
['Ví dụ với từ improve,','nghĩa là cải thiện.','AI không chỉ giải thích,','mà còn yêu cầu mình tự đặt câu.','Mình viết:','I want to improve my English.','Sau đó, AI kiểm tra','và giúp mình sửa nếu có lỗi.'],
['Những từ chưa nhớ, mình lưu lại','để buổi sau nhờ AI kiểm tra tiếp.','Như vậy, mình biết cần ôn từ nào','thay vì cứ học thêm từ mới.'],
['Muốn biết cách mình thiết lập ChatGPT','để học như vậy?','Bình luận BẮT ĐẦU,','mình chia sẻ cách làm nhé!']]
voices={k:PiperVoice.load(f'.cache/piper/{k}.onnx') for k in ['vi','en']}
def synth(text,lang,scale=1.18):
 pronunciation=text.replace('ChatGPT','chát gi pi ti').replace('AI','ây ai').replace('BẮT ĐẦU','bắt đầu') if lang=='vi' else text
 key=hashlib.sha256(f'{lang}:{scale}:{pronunciation}'.encode()).hexdigest();p=cache/f'{key}.wav'
 if not p.exists():
  with wave.open(str(p),'wb') as f:voices[lang].synthesize_wav(pronunciation,f,SynthesisConfig(length_scale=scale))
 pcm=cache/f'{key}-48.wav'
 command(['ffmpeg','-v','error','-y','-i',str(p),'-ar',str(SR),'-ac','1',str(pcm)])
 return read_wav(pcm)
pieces=[];cursor=0;scenes=[];segments=[];pages=[];tokens=[]
for line,parts in zip(brief['spokenSegments'],phrases):
 assert ' '.join(parts)==line['spoken']
 start=cursor//1600
 for i,text in enumerate(parts):
  lang='en' if text=='I want to improve my English.' else 'vi'
  # Local native English voice for the full example; exact written copy is preserved.
  a=synth(text,lang,2.0 if lang=='vi' else 1.10)
  if text=='Ví dụ với từ improve,':
   a=np.concatenate([synth('Ví dụ với từ','vi',2.0),np.zeros(round(.08*SR)),synth('improve,','en',1.10)])
  begin=cursor/SR*1000;pieces.append(a);cursor+=len(a)
  token={'text':text,'startMs':begin,'endMs':cursor/SR*1000,'scene':line['id'],'segmentId':f"{line['id']}-{i}",'timingLevel':'measured-phrase'}
  tokens.append(token);pages.append({**token,'tokens':[token]})
  pieces.append(np.zeros(round(.12*SR)));cursor+=round(.12*SR)
 end=math.ceil((cursor/SR+.40)*30);pieces.append(np.zeros(end*1600-cursor));cursor=end*1600
 scenes.append({'type':line['id'],'startFrame':start,'endFrame':end})
 segments.append({**line,'startMs':start/30*1000,'endMs':end/30*1000})
 print(line['id'],round((end-start)/30,2),flush=True)
raw=cache/'raw.wav';write_wav(raw,np.concatenate(pieces));normalize(raw,cache/'voice.wav',-16);vo=read_wav(cache/'voice.wav')
write_wav(cache/'music-raw.wav',original_music(cursor,90));normalize(cache/'music-raw.wav',cache/'music.wav',-36);music=read_wav(cache/'music.wav')
rms=np.sqrt(np.maximum(lfilter([1/960]*960,[1],vo**2),0));gain=1-.4*np.clip(rms/.05,0,1);music*=gain[:,None]
events=[{'kind':'bridge','frame':s['startFrame']} for s in scenes[1:]]
events.append({'kind':'complete','frame':round(next(t['startMs'] for t in tokens if t['text']=='Sau đó, AI kiểm tra')*.03)})
sfx=original_sfx(cursor,events)*.35;stereo=vo[:,None]*np.array([.70710678]*2);mix=stereo+music+sfx
write_wav(cache/'mix.wav',mix);metric=loudness(cache/'mix.wav');master=min(10**((-16-float(metric['input_i']))/20),10**(-1.5/20)/np.max(np.abs(mix)))
for n,a in [('voice',stereo),('music',music),('sfx',sfx),('mix',mix)]:write_wav(out/f'{n}.wav',a*master)
m={'fps':30,'durationInFrames':cursor//1600,'durationSeconds':cursor/SR,'audioSrc':'marketing02/mix.wav','scenes':scenes,'segments':segments,'tokens':tokens,'pages':pages,'events':events,'voice':'Piper vi_VN-vais1000-medium; English example en_US-ljspeech-medium','captionTiming':'Measured synthesized phrase audio; no word-level alignment or karaoke claim','briefSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'mixMetrics':loudness(out/'mix.wav'),'voiceMetrics':loudness(out/'voice.wav'),'musicMetrics':loudness(out/'music.wav')}
public=Path('public/marketing02');public.mkdir(exist_ok=True);shutil.copyfile(out/'mix.wav',public/'mix.wav')
for p in [public/'manifest.json',out/'timeline.json']:p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
for ext in ['srt','vtt']:
 text='WEBVTT\n\n' if ext=='vtt' else ''
 for i,p in enumerate(pages):text+=(f'{i+1}\n' if ext=='srt' else '')+f"{stamp(p['startMs'],'.' if ext=='vtt' else ',')} --> {stamp(p['endMs'],'.' if ext=='vtt' else ',')}\n{p['text']}\n\n"
 (out/f'subtitles.{ext}').write_text(text)
print('DURATION',m['durationSeconds'],flush=True)
