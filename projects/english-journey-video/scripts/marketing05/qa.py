"""Offline objective QA and actual-MP4 evidence. No listening claims."""
import json,hashlib,subprocess,sys,shutil,math
from pathlib import Path
import numpy as np
from scipy.signal import correlate,correlation_lags
sys.path.insert(0,str(Path.cwd()))
from scripts.marketing05.build import verify_sources,sha,load,dump,OUT,OLD,NEW,ROOT
from scripts.bilingual.audio import loudness
plan,assembly=verify_sources();m=load(OUT/'timeline.json');brief=load(ROOT/'briefs/marketing-video-05-approved.json');video=OUT/'English-Journey-Marketing-05-V1.1-Bilingual.mp4'
def run(args):return subprocess.run(args,capture_output=True,check=True,text=True)
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio');checks={}
checks['format']=v['width']==1080 and v['height']==1920 and v['r_frame_rate']=='30/1' and v['codec_name']=='h264' and a['codec_name']=='aac'
checks['duration']=abs(float(probe['format']['duration'])-m['durationSeconds'])<.1
run(['ffmpeg','-v','error','-xerror','-i',str(video),'-f','null','-']);checks['fullDecode']=True
checks['sixContinuousScenes']=len(m['scenes'])==6 and m['scenes'][0]['startFrame']==0 and all(m['scenes'][i]['endFrame']==m['scenes'][i+1]['startFrame'] for i in range(5)) and m['scenes'][-1]['endFrame']==m['durationInFrames']
checks['approvedCopy']=all(' '.join(p['text'] for p in m['pages'] if p['scene']==s['id'])==s['spoken'] for s in brief['spokenSegments'])
checks['subtitleTiming']=all(0<=p['startMs']<p['endMs']<=m['durationSeconds']*1000+.001 for p in m['pages']) and all(m['pages'][i]['endMs']<=m['pages'][i+1]['startMs']+.001 for i in range(len(m['pages'])-1))
checks['uncutSpeech']=all(s['speechEndMs']<=s['endMs'] for s in m['segments'])
checks['demoRevealOrder']=m['markers']['hint']<m['markers']['strike']<m['markers']['correct']<m['markers']['practice']
checks['correctSentenceReadingTime']=(m['markers']['practice']-m['markers']['correct'])/30>=1.2
checks['practiceSentenceReadingTime']=(m['scenes'][3]['endFrame']-m['markers']['practice'])/30>=1.2
old=load(OLD/'ledger.json');previous=load(ROOT/'out/bilingual/marketing-video-05-recovery-01/ledger.json');new=load(NEW/'ledger.json')
checks['spendingHistoryPreserved']=old['requestsSubmitted']==2 and previous['requestsSubmitted']==1 and new['requestsSubmitted']==5 and all(c['attempts']==1 and c['status']=='VERIFIED' for c in new['calls']) and new['reservedUsd']<=.02
checks['sixRealVerifiedWavs']=len(assembly['files'])==6 and all(sha(OUT/'raw'/(f['id']+'.wav'))==f['sha256'] for f in assembly['files'])
measurement=run(['ffmpeg','-hide_banner','-i',str(video),'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-']);metric=json.JSONDecoder().raw_decode(measurement.stderr[measurement.stderr.rfind('{'):])[0]
checks['loudness']=abs(float(metric['input_i'])+16)<=1.5;checks['truePeak']=float(metric['input_tp'])<=-1.5
def pcm(f):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-ac','1','-ar','4000','-f','f32le','-']),dtype=np.float32)
x,y=pcm(video),pcm(OUT/'mix.wav');n=min(len(x),len(y));xc,yc=x[:n],y[:n];corr=correlate(xc,yc,method='fft');lags=correlation_lags(n,n);mask=np.abs(lags)<=600;lag=int(lags[mask][np.argmax(corr[mask])]);
if lag>=0:left,right=yc[:n-lag],xc[lag:]
else:left,right=yc[-lag:],xc[:n+lag]
score=float(np.corrcoef(left,right)[0,1]);checks['muxAudioSync']=abs(lag)/4000<=1/30 and score>.97 and abs(len(x)-len(y))/4000<.06
checks['voiceRoutingMetadata']=all(s['voice']==plan['profile']['voices'][s['language']] for r in plan['requests'] for s in r['spans'])
checks['submittedSsmlExactCopy']=True # verify_sources validated every retained receipt against canonical request text/SSML hashes.
proofs=OUT/'proofs';proofs.mkdir(exist_ok=True);evidence=[]
frames=[('opening',0),('hook-1s',30),('hook-2.5s',75)]+[(s['type'],(s['startFrame']+s['endFrame'])//2) for s in m['scenes']]+[(k+'-before',max(0,f-1)) for k,f in m['markers'].items()]+[(k+'-after',min(m['durationInFrames']-1,f+20)) for k,f in m['markers'].items()]+[('ending',m['durationInFrames']-1)]
for name,frame in frames:
    dest=proofs/(name+'.png');run(['ffmpeg','-y','-v','error','-ss',str(frame/30),'-i',str(video),'-frames:v','1',str(dest)]);evidence.append({'name':name,'frame':frame,'seconds':frame/30,'file':dest.name})
observations=load(OUT/'observations.json');scene_offsets={s['id']:s['startMs'] for s in m['segments']}
listening_flags=[{'scene':o['requestId'],'seconds':(scene_offsets[o['requestId']]+o['startMs'])/1000,'canonical':o['canonicalText'],'observedAsr':o['observedText'],'matchRatio':o['lexicalMatchRatio']} for o in observations if o['lexicalMatchRatio']<1]
report={'technicalStatus':'PASS' if all(checks.values()) else 'FAIL','checks':checks,'probe':probe,'loudness':metric,'muxLagMs':lag/4,'waveformCorrelation':score,'evidence':evidence,'sha256':sha(video),'assembly':assembly,'captionTiming':'Dual local VI/EN ASR observed phrase endpoints; no interpolated word timestamps. Canonical copy retained.','listeningFlags':listening_flags,'subjectiveListening':'NOT_VERIFIED','audibleWordForWordCopy':'NEEDS_LISTENING_NOT_CERTIFIED_BY_ASR','subjectiveFullMotionViewing':'NOT_VERIFIED','visualProofInspection':'PENDING','publication':'NOT_POSTED_OWNER_REVIEW_REQUIRED'};dump(OUT/'QA_REPORT.json',report)
text='# Video 05 V1.1 — final technical QA\n\nTechnical: **'+report['technicalStatus']+'**\n\n'+'\n'.join('- '+k+': '+('PASS' if val else 'FAIL') for k,val in checks.items())
text+=f"\n\nDuration {m['durationSeconds']:.3f}s; 1080 x 1920, 30fps, H.264/AAC. Loudness {metric['input_i']} LUFS; true peak {metric['input_tp']} dBTP. Mux lag {lag/4}ms; waveform correlation {score:.5f}.\n\nSix real WAVs, original HOOK retained. Separate ledgers contain 2 original attempts, 1 failed recovery-01 attempt and 5 authorized recovery-02 attempts: 8 total submissions, 6 retained WAVs, no automatic retries. Reference reserved cost USD {assembly['combinedReferenceUsd']:.6f}; not an invoice. Original ambiguous PROBLEM billing is unknown; recovery-01 returned HTTP 200 and failed local WAV_PROBE.\n\nCanonical subtitles use observed audio endpoints; no ASR rewriting. Subjective pronunciation, voice naturalness, emotion, music balance and full-motion review are NOT VERIFIED; voice routing metadata and technical metrics do not certify these. Stills are a separate visual inspection. No main merge or TikTok posting.\n\nMP4 SHA-256: `{report['sha256']}`\n"
if listening_flags:text+='\n## Listening checkpoints\n\nASR substitutions are not proof of an audible narration error. Check these against the real export; captions retain approved copy.\n\n'+'\n'.join(f"- {x['seconds']:.3f}s: canonical `{x['canonical']}`; ASR observed `{x['observedAsr']}`." for x in listening_flags)+'\n'
(OUT/'QA_REPORT.md').write_text(text,encoding='utf-8');print(json.dumps({'status':report['technicalStatus'],'checks':checks,'duration':m['durationSeconds'],'lagMs':lag/4,'correlation':score}),flush=True)
if not all(checks.values()):sys.exit(1)
