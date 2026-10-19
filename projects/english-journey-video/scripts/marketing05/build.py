"""Offline Video 05 adapter: verify mixed-origin WAVs, observe timing, mix audio.

No synthesis/network code. Original and recovery spending ledgers stay separate.
"""
import argparse,json,hashlib,subprocess,sys,re,math,shutil
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path.cwd()))
from scripts.bilingual.audio import read_wav,write_wav,normalized,loudness
from scripts.marketing05.observed import align_phrases
from scripts.v2.build import original_music,original_sfx

ROOT=Path.cwd(); OUT=ROOT/'out/marketing05-production'; OLD=ROOT/'out/bilingual/marketing-video-05'; NEW=ROOT/'out/bilingual/marketing-video-05-recovery-02'
PLAN=ROOT/'docs/reviews/marketing05/ssml-plan.json'; RECOVERY=ROOT/'docs/reviews/marketing05/recovery-02'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
load=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
def dump(p,obj):Path(p).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def immutable_copy(src,dest):
    if dest.exists():
        if sha(src)!=sha(dest):raise ValueError('EXISTING_AUDIO_DIFFERS_DO_NOT_OVERWRITE')
    else:shutil.copy2(src,dest)
def verify_sources():
    plan=load(PLAN);recovery=load(RECOVERY/'recovery-plan.json');new_plan=load(RECOVERY/'ssml-plan.json');old=load(OLD/'ledger.json');new=load(NEW/'ledger.json');new_auth=load(NEW/'authorization.json')
    assert sha(OLD/'ledger.json')==recovery['oldLedgerSha256'] and sha(OLD/'authorization.json')==recovery['oldAuthorizationSha256']
    assert sha(ROOT/'out/bilingual/marketing-video-05-recovery-01/ledger.json')==recovery['previousRecoveryLedgerSha256'] and sha(ROOT/'out/bilingual/marketing-video-05-recovery-01/authorization.json')==recovery['previousRecoveryAuthorizationSha256']
    assert old['calls'][1]['status']=='FAILED_OR_AMBIGUOUS_NO_RETRY' and old['requestsSubmitted']==2
    assert new['kind']=='AZURE_REST' and new['planSha256']==new_plan['planSha256']==recovery['newPlanSha256']
    assert new_auth['planSha256']==new_plan['planSha256'] and new_auth['additionalProblemAttemptExplicitlyApproved'] is True and new_auth['limitUsd']==.02
    assert new['requestsSubmitted']==5 and len(new['calls'])==5 and all(c['status']=='VERIFIED' and c['attempts']==1 and c['approvalId']==new_auth['approvalId'] for c in new['calls'])
    assert new['reservedUsd']<=.02 and sha(ROOT/'briefs/marketing-video-05-approved.json')==plan['briefSha256']
    (OUT/'raw').mkdir(parents=True,exist_ok=True);files=[]
    for req in plan['requests']:
        folder,ledger,origin_plan=(OLD,old,plan) if req['id']=='hook' else (NEW,new,new_plan)
        call=next(c for c in ledger['calls'] if c['id']==req['id']);origin_request=next(r for r in origin_plan['requests'] if r['id']==req['id'])
        file=folder/(req['id']+'.wav');receipt_file=folder/(req['id']+'.wav.receipt.json');receipt=load(receipt_file)
        assert origin_request['ssmlSha256']==req['ssmlSha256'] and origin_request['text']==req['text']
        assert call['status']=='VERIFIED' and call['sha256']==sha(file)==receipt['sha256']
        p=receipt['provenance'];assert p['kind']=='AZURE_REST' and p['planSha256']==origin_plan['planSha256'] and p['ssmlSha256']==req['ssmlSha256'] and p['textSha256']==hashlib.sha256(req['text'].encode()).hexdigest()
        a=read_wav(file);assert a.ndim==1
        subprocess.run(['ffmpeg','-v','error','-xerror','-f','wav','-i','pipe:0','-f','null','-'],input=file.read_bytes(),check=True)
        immutable_copy(file,OUT/'raw'/file.name);immutable_copy(receipt_file,OUT/'raw'/receipt_file.name)
        files.append({'id':req['id'],'sourceFile':file.relative_to(ROOT).as_posix(),'receiptFile':receipt_file.relative_to(ROOT).as_posix(),'originPlanSha256':origin_plan['planSha256'],'originLedgerSha256':sha(folder/'ledger.json'),'ssmlSha256':req['ssmlSha256'],'sha256':sha(file),'samples':len(a),'sampleRate':48000,'kind':'AZURE_REST','assemblyPlanSha256':plan['planSha256']})
    assembly={'kind':'VERIFIED_AUDIO_ASSEMBLY_NOT_SPENDING_LEDGER','assemblyPlanSha256':plan['planSha256'],'files':files,'oldLedgerSha256':sha(OLD/'ledger.json'),'previousRecoveryLedgerSha256':recovery['previousRecoveryLedgerSha256'],'recoveryLedgerSha256':sha(NEW/'ledger.json'),'historicalReservedUsd':recovery['historicalReservedUsd'],'recoveryReservedUsd':new['reservedUsd'],'combinedReferenceUsd':round(recovery['historicalReservedUsd']+new['reservedUsd'],6),'invoiceVerified':False}
    dump(OUT/'audio-assembly.json',assembly);return plan,assembly
def observe(model_path):
    from faster_whisper import WhisperModel
    plan,assembly=verify_sources();model=WhisperModel(model_path,device='cpu',compute_type='int8',cpu_threads=6,local_files_only=True);results=[];reviews=[]
    for req in plan['requests']:
        file=OUT/'raw'/(req['id']+'.wav');evidence=OUT/(req['id']+'.bilingual-observed.json');h=sha(file)
        if evidence.exists():
            cached=load(evidence);assert cached['audioSha256']==h;words=cached['words']
        else:
            pcm=subprocess.check_output(['ffmpeg','-v','error','-f','wav','-i','pipe:0','-ac','1','-ar','16000','-f','f32le','-'],input=file.read_bytes())
            # Recognition context only: clean presentation quotation marks so
            # Whisper does not repeat curly quotes. Canonical copy is unchanged.
            prompt=re.sub('[‘’“”]','',req['text']).replace('…','. ')
            chunks,_=model.transcribe(np.frombuffer(pcm,dtype=np.float32),language='en',initial_prompt=prompt,word_timestamps=True,beam_size=5,vad_filter=False,temperature=0,condition_on_previous_text=False)
            words=[{'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for chunk in chunks for w in (chunk.words or [])]
            dump(evidence,{'audioSha256':h,'kind':'LOCAL_ASR_OBSERVED','recognitionLanguage':'en','bilingualContextFromCanonicalWords':True,'words':words})
        vi_evidence=OUT/(req['id']+'.vi-observed.json')
        if vi_evidence.exists():
            vi_cached=load(vi_evidence);assert vi_cached['audioSha256']==h;vi_words=vi_cached['words']
        else:
            pcm=subprocess.check_output(['ffmpeg','-v','error','-f','wav','-i','pipe:0','-ac','1','-ar','16000','-f','f32le','-'],input=file.read_bytes())
            prompt=re.sub('[‘’“”]','',req['text']).replace('…','. ')
            chunks,_=model.transcribe(np.frombuffer(pcm,dtype=np.float32),language='vi',initial_prompt=prompt,word_timestamps=True,beam_size=5,vad_filter=False,temperature=0,condition_on_previous_text=False)
            vi_words=[{'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for chunk in chunks for w in(chunk.words or [])];dump(vi_evidence,{'audioSha256':h,'kind':'LOCAL_ASR_OBSERVED','recognitionLanguage':'vi','words':vi_words})
        cues=[req['text'].index(x) for x in ['Agree là động từ hay tính từ?','không cần thêm am','I agree’','I agree with you'] if x in req['text']] if req['id']=='demo' else []
        expected,groups=align_phrases(req['text'],req['spans'],{'en':words,'vi':vi_words},cues)
        for g in groups:
            start,end=expected[g['first']].start(),expected[g['last']].end()
            results.append({'requestId':req['id'],'audioSha256':h,'evidenceSha256':sha(evidence if g['source']=='en' else vi_evidence),'kind':'LOCAL_ASR_OBSERVED','timingLevel':'OBSERVED_PHRASE','recognitionLanguage':g['source'],'textStart':start,'textEnd':end,'canonicalText':req['text'][start:end],'observedText':' '.join(g['words']),'lexicalMatchRatio':g['exactRatio'],'startMs':g['start']*1000,'endMs':g['end']*1000})
        reviews.append({'scene':req['id'],'canonicalWords':len(expected),'observedWordsEn':len(words),'observedWordsVi':len(vi_words),'phraseIntervals':len(groups),'minimumPhraseMatchRatio':min(g['exactRatio'] for g in groups),'humanPronunciationAndSync':'NEEDS_LISTENING'})
        print('Observed '+req['id']+' '+str(len(expected))+' words',flush=True)
    dump(OUT/'observations.json',results);dump(OUT/'alignment-review.json',reviews)
def mix():
    plan,assembly=verify_sources();m=load(OUT/'timeline.json');assert m['planSha256']==plan['planSha256'];pieces=[];metrics=[]
    for scene in m['scenes']:
        a=read_wav(OUT/'raw'/(scene['type']+'.wav'));b,metric=normalized(a,OUT/('normalized-'+scene['type']+'.wav'),-17)
        samples=(scene['endFrame']-scene['startFrame'])*1600;assert samples>=len(b)
        pieces.extend([b,np.zeros(samples-len(b))]);metrics.append({'scene':scene['type'],'before':metric,'samples':len(b)})
    voice=np.concatenate(pieces);assert len(voice)==m['audioSamples'];envelope=np.ones(len(voice));voice_metrics=[]
    for i,span in enumerate(m['voiceSpans']):
        a,b=round(span['startMs']*48),round(span['endMs']*48)
        if b-a<19200:continue
        temp=OUT/('.voice-measure-'+str(i)+'.wav');adjusted,metric=normalized(voice[a:b],temp,-17);temp.unlink()
        gain=min(2,max(.5,np.max(np.abs(adjusted))/max(np.max(np.abs(voice[a:b])),1e-12)))
        ramp=min(480,(b-a)//2);local=np.full(b-a,gain);local[:ramp]=np.linspace(1,gain,ramp);local[-ramp:]=np.linspace(gain,1,ramp);envelope[a:b]*=local
        voice_metrics.append({'voice':span['voice'],'startMs':span['startMs'],'endMs':span['endMs'],'gainDb':20*math.log10(gain)})
    voice*=envelope;stereo=voice[:,None]*np.array([.70710678,.70710678])
    raw_music=original_music(len(voice),86);music,_=normalized(raw_music,OUT/'music-normalized.wav',-36)
    squares=np.r_[0,np.cumsum(voice**2)];rms=np.sqrt(np.maximum(0,(squares[960:]-squares[:-960])/960));rms=np.pad(rms,(959,0));music*=(1-.5*np.clip(rms/.05,0,1))[:,None]
    events=[{'kind':'bridge','frame':s['startFrame']} for s in m['scenes'][1:]]+[{'kind':'complete','frame':m['markers']['correct']}]
    sfx=original_sfx(len(voice),events)*.18;raw_mix=stereo+music+sfx;audio,before=normalized(raw_mix,OUT/'mix.wav',-16)
    gain=np.max(np.abs(audio))/max(np.max(np.abs(raw_mix)),1e-12)
    for name,data in [('voiceover',stereo),('music',music),('sfx',sfx)]:write_wav(OUT/(name+'.wav'),data*gain)
    after=loudness(OUT/'mix.wav');assert abs(float(after['input_i'])+16)<=1.5 and float(after['input_tp'])<=-1.5
    public=ROOT/'public/marketing05';public.mkdir(exist_ok=True,parents=True);shutil.copy2(OUT/'mix.wav',public/'mix.wav');dump(public/'manifest.json',m)
    dump(OUT/'mix-qa.json',{'samples':len(audio),'sampleRate':48000,'timeStretch':False,'pitchChange':False,'requestMetrics':metrics,'voiceMetrics':voice_metrics,'mixMetrics':after,'subjectiveListening':'NOT_VERIFIED'})
    print(json.dumps({'durationSeconds':len(audio)/48000,'loudness':after}),flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--model');p.add_argument('--mix',action='store_true');args=p.parse_args()
    if args.mix:mix()
    elif args.model:observe(args.model)
    else:verify_sources()
