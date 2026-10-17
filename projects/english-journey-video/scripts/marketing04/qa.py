"""Objective export QA. No paid services or synthesis."""
import json,subprocess,hashlib,shutil,sys
from pathlib import Path
import numpy as np
from scipy.signal import correlate,correlation_lags
out=Path('out/marketing04');video=out/'English-Journey-Marketing-04-V1.1-NamMinh.mp4';m=json.loads((out/'timeline.json').read_text(encoding='utf-8'));brief=json.loads(Path('briefs/marketing-video-04-approved.json').read_text(encoding='utf-8'))
def run(args):return subprocess.run(args,capture_output=True,check=True,text=True)
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
checks={}
checks['format']=v['width']==1080 and v['height']==1920 and v['r_frame_rate']=='30/1' and v['codec_name']=='h264' and a['codec_name']=='aac'
checks['duration']=abs(float(probe['format']['duration'])-m['durationSeconds'])<.1
run(['ffmpeg','-v','error','-xerror','-i',str(video),'-f','null','-']);checks['fullDecode']=True
checks['sixScenes']=len(m['scenes'])==6 and [s['type'] for s in m['scenes']]==[s['id'] for s in brief['spokenSegments']]
checks['approvedCopy']=all(' '.join(p['text'] for p in m['pages'] if p['scene']==s['id'])==s['spoken'] for s in brief['spokenSegments'])
checks['subtitleTiming']=all(0<=p['startMs']<p['endMs']<=m['durationSeconds']*1000+.001 for p in m['pages']) and all(m['pages'][i]['endMs']<=m['pages'][i+1]['startMs']+.001 for i in range(len(m['pages'])-1))
checks['uncutSpeech']=all(s['speechEndMs']<=s['endMs'] for s in m['segments'])
ledger=json.loads((out/'ledger.json').read_text(encoding='utf-8'));checks['singleAzureAttempts']=ledger['synthesisRequestsSubmitted']==6 and all(c['attempts']==1 and c['status']=='AUDIO_SAVED_VERIFIED' for c in ledger['calls']) and ledger['knownReferenceChargeUsd']<=.05
for c in ledger['calls']:
    f=out/'raw'/(c['id']+'.wav');checks['sha256_'+c['id']]=hashlib.sha256(f.read_bytes()).hexdigest()==c['sha256'];run(['ffmpeg','-v','error','-xerror','-i',str(f),'-f','null','-'])
r=run(['ffmpeg','-hide_banner','-i',str(video),'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-']);loudness=json.JSONDecoder().raw_decode(r.stderr[r.stderr.rfind('{'):])[0]
checks['loudness']=abs(float(loudness['input_i'])+16)<=1.5;checks['truePeak']=float(loudness['input_tp'])<=-1
def pcm(f):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-t','20','-ac','1','-ar','1000','-f','f32le','-']),dtype=np.float32)
x,y=pcm(video),pcm(out/'mix.wav');corr=correlate(x,y,method='fft');lags=correlation_lags(len(x),len(y));mask=np.abs(lags)<=150;lag=int(lags[mask][np.argmax(corr[mask])]);checks['muxAudioSync']=abs(lag)<=40
proofs=out/'proofs';proofs.mkdir(exist_ok=True)
times=[('opening',0),('hook-2.5',2.5),('demo-a',m['scenes'][3]['startFrame']/30+2)]+[(s['type'],(s['startFrame']+s['endFrame'])/60) for s in m['scenes']]+[(k,v/30+1) for k,v in m['markers'].items()]+[('ending',m['durationSeconds']-.2)]
evidence=[]
for name,t in times:
    f=proofs/(name+'.png');run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1',str(f)]);evidence.append({'name':name,'seconds':t,'file':str(f)})
report={'technicalStatus':'PASS' if all(checks.values()) else 'FAIL','checks':checks,'probe':probe,'loudness':loudness,'muxLagMs':lag,'evidence':evidence,'captionMethod':m['captionTiming'],'alignment':m['alignment'],'subjectiveVideoQA':'BLOCKED_NO_FULL_MOTION_VIEWING','subjectiveAudioQA':'BLOCKED_NO_DIRECT_LISTENING','publication':'OWNER_DECIDES_NOT_POSTED','azure':{'requests':6,'estimatedUsd':ledger['knownReferenceChargeUsd'],'limitUsd':.05},'sha256':hashlib.sha256(video.read_bytes()).hexdigest()}
(out/'QA_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
text='# Video 04 V1.1 — QA\n\nTechnical: **'+report['technicalStatus']+'**\n\n'
text+='\n'.join('- '+k+': '+('PASS' if v else 'FAIL') for k,v in checks.items())
text+=f"\n\nDuration: {m['durationSeconds']:.3f}s. H.264/AAC, 1080×1920, 30 FPS.\nIntegrated loudness: {loudness['input_i']} LUFS. True peak: {loudness['input_tp']} dBTP. Mux lag: {lag}ms.\n\nAzure: 6 requests, one per scene, reference USD {ledger['knownReferenceChargeUsd']:.6f}; budget USD 0.05. No retry. Reference price is not an Azure invoice.\n\nCaptions: {m['captionTiming']}\n\nSubjective listening/pronunciation/music/emotion: **BLOCKED — needs owner review**. Full-motion subjective viewing: **BLOCKED**. Stills inspected separately. Technical checks do not certify retention or persuasion.\n\nNot merged, not posted to TikTok.\n\nMP4 SHA-256: `{report['sha256']}`\n"
(out/'QA_REPORT.md').write_text(text,encoding='utf-8')
delivery=Path(sys.argv[1]);delivery.mkdir(exist_ok=True,parents=True)
for name in [video.name,'subtitles.srt','subtitles.vtt','QA_REPORT.json','QA_REPORT.md','timeline.json','voiceover.wav','music.wav','sfx.wav','mix.wav','audio-manifest.json']:
    shutil.copy2(out/name,delivery/name)
shutil.copytree(proofs,delivery/'proofs',dirs_exist_ok=True)
for f in (out/'raw').glob('*.receipt.json'):shutil.copy2(f,delivery/f.name)
print(json.dumps({'technicalStatus':report['technicalStatus'],'checks':checks,'loudness':loudness,'muxLagMs':lag},indent=2))
if not all(checks.values()):sys.exit(1)
