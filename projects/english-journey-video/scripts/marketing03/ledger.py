"""Offline recovery import only. Never sends requests or resets attempt history.
Manual mark is disabled: future paid execution must use the guarded direct receiver.
"""
import argparse,datetime,hashlib,json,os,subprocess,tempfile,wave
from pathlib import Path


def atomic_json(path,data):
    fd,name=tempfile.mkstemp(prefix=path.name+'.pending-',dir=path.parent)
    try:
        with os.fdopen(fd,'w') as f:
            json.dump(data,f,ensure_ascii=False,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
        os.replace(name,path)
    finally:
        Path(name).unlink(missing_ok=True)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['mark','import']);parser.add_argument('id');parser.add_argument('download',nargs='?');args=parser.parse_args()
    if args.action=='mark':raise ValueError('Manual marking disabled. Use direct-audio.mjs only after separate owner authorization.')
    if not args.download:raise ValueError('Existing local WAV path required; never regenerate for recovery')
    root=Path('out/marketing03');ledger=root/'ledger.json'
    lock=Path(str(ledger)+'.lock');fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    temporary=None
    try:
        d=json.loads(ledger.read_text());s=next(x for x in d['calls'] if x['id']==args.id)
        if s['attempts']<1:raise ValueError('No recorded Azure attempt to recover')
        target=root/'raw'/(s['id']+'.wav');target.parent.mkdir(parents=True,exist_ok=True)
        receipt=Path(str(target)+'.receipt.json')
        if target.exists() or receipt.exists():raise ValueError('Output exists; verify/recover it, never overwrite')
        source=Path(args.download);raw=source.read_bytes()
        if len(raw)>60_000_000:raise ValueError('Audio exceeds limit')
        with wave.open(str(source),'rb') as w:
            if (w.getframerate(),w.getnchannels(),w.getsampwidth(),w.getcomptype())!=(48000,1,2,'NONE'):raise ValueError('Expected PCM 48kHz mono 16-bit')
            frames=w.getnframes()
            if frames<4800 or frames>120*48000 or len(w.readframes(frames))!=frames*2:raise ValueError('Empty, truncated or overlong audio')
        temp_fd,name=tempfile.mkstemp(prefix=s['id']+'.pending-',dir=target.parent);temporary=Path(name)
        with os.fdopen(temp_fd,'wb') as f:f.write(raw);f.flush();os.fsync(f.fileno())
        subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(temporary),'-f','null','-'],check=True,capture_output=True,timeout=30)
        digest=hashlib.sha256(temporary.read_bytes()).hexdigest()
        os.link(temporary,target)  # exclusive publication after header/decode/readback
        info={'sha256':digest,'bytes':len(raw),'sampleRate':48000,'channels':1,'bitsPerSample':16,'durationSeconds':frames/48000,'fullDecode':'PASS','sourceProvenance':'PENDING_SEPARATE_VERIFICATION','importedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
        with receipt.open('x') as f:json.dump(info,f,indent=2);f.write('\n')
        # Preserve previous status and all historical attempts; technical import is not voice certification.
        s.setdefault('recoveryHistory',[]).append({'previousStatus':s.get('status'),**info})
        s.update(status='WAV_DECODED_PROVENANCE_PENDING',audioPath=str(target),audioVerified=False,technicalAudioVerified=True,sha256=digest,sampleRate=48000,durationSeconds=frames/48000)
        atomic_json(ledger,d);print(args.id,s['status'])
    finally:
        if temporary:temporary.unlink(missing_ok=True)
        os.close(fd);lock.unlink()

if __name__=='__main__':
    try:main()
    except (ValueError,OSError,subprocess.SubprocessError,wave.Error,EOFError,StopIteration) as e:
        raise SystemExit('Recovery import stopped; no synthesis/retry performed: '+type(e).__name__)
