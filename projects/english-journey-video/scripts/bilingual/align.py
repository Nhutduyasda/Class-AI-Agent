"""Offline observed timestamps for exact approved text; no TTS or text replacement."""
import argparse,json,re,hashlib,subprocess
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel

def lexical_align(expected,observed):
    norm=lambda x: ''.join(re.findall(r'\w+',x.lower()))
    a=[norm(w) for w in expected];b=[norm(w['word']) for w in observed];n,m=len(a),len(b)
    d=np.zeros((n+1,m+1),dtype=int);d[:,0]=np.arange(n+1);d[0,:]=np.arange(m+1)
    for i in range(1,n+1):
        for j in range(1,m+1):d[i,j]=min(d[i-1,j]+1,d[i,j-1]+1,d[i-1,j-1]+(a[i-1]!=b[j-1]))
    result={};i,j=n,m
    while i or j:
        if i and j and d[i,j]==d[i-1,j-1]+(a[i-1]!=b[j-1]):result[i-1]=observed[j-1];i-=1;j-=1
        elif j and d[i,j]==d[i,j-1]+1:j-=1
        else:i-=1
    if len(result)!=n or d[n,m]/max(n,m,1)>.4:raise ValueError('ALIGNMENT_REVIEW_REQUIRED_NO_INVENTED_TIMES')
    return result,float(d[n,m])/max(n,m,1)

def main():
    p=argparse.ArgumentParser();p.add_argument('plan');p.add_argument('audio_dir');p.add_argument('--model',required=True);args=p.parse_args()
    plan=json.loads(Path(args.plan).read_text(encoding='utf-8'));folder=Path(args.audio_dir);ledger=json.loads((folder/'ledger.json').read_text(encoding='utf-8'))
    if ledger['kind']!='AZURE_REST' or ledger['planSha256']!=plan['planSha256']:raise ValueError('REAL_VERIFIED_AZURE_AUDIO_REQUIRED')
    model=WhisperModel(args.model,device='cpu',compute_type='int8',cpu_threads=6,local_files_only=True);results=[];reviews=[]
    for request in plan['requests']:
        file=folder/(request['id']+'.wav');sha=hashlib.sha256(file.read_bytes()).hexdigest();call=next(c for c in ledger['calls'] if c['id']==request['id'])
        if call['status']!='VERIFIED' or call['sha256']!=sha:raise ValueError('AUDIO_HASH_MISMATCH')
        evidence=folder/(request['id']+'.observed.json')
        if evidence.exists():
            cached=json.loads(evidence.read_text(encoding='utf-8'))
            if cached['audioSha256']!=sha:raise ValueError('STALE_ASR_EVIDENCE')
            words=cached['words']
        else:
            raw=subprocess.check_output(['ffmpeg','-v','error','-f','wav','-i','pipe:0','-ac','1','-ar','16000','-f','f32le','-'],input=file.read_bytes())
            language='en' if all(s['language']=='en-US' or not re.search(r'\w',s['text']) for s in request['spans']) else 'vi'
            chunks,_=model.transcribe(np.frombuffer(raw,dtype=np.float32),language=language,word_timestamps=True,beam_size=5,vad_filter=False,temperature=0,condition_on_previous_text=False)
            words=[{'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for chunk in chunks for w in (chunk.words or [])]
            evidence.write_text(json.dumps({'audioSha256':sha,'language':language,'words':words},ensure_ascii=False,indent=2),encoding='utf-8')
        expected=list(re.finditer(r'\S+',request['text']));mapping,error=lexical_align([m[0] for m in expected],words);evidence_hash=hashlib.sha256(evidence.read_bytes()).hexdigest()
        for i,match in enumerate(expected):
            w=mapping[i];results.append({'requestId':request['id'],'audioSha256':sha,'evidenceSha256':evidence_hash,'kind':'LOCAL_ASR_OBSERVED','textStart':match.start(),'textEnd':match.end(),'canonicalText':match[0],'observedText':w['word'],'startMs':w['start']*1000,'endMs':w['end']*1000})
        reviews.append({'requestId':request['id'],'editDistance':error,'humanPronunciationAndSync':'BLOCKED_NEEDS_LISTENING'})
    (folder/'observations.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    (folder/'alignment-review.json').write_text(json.dumps(reviews,indent=2),encoding='utf-8');print(json.dumps({'requestsAligned':len(reviews),'observations':len(results),'subjectiveQA':'BLOCKED'}))
if __name__=='__main__':main()
