"""Offline one-attempt guards. This script never calls Azure."""
import argparse,json,datetime,hashlib,shutil,subprocess,wave
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('action',choices=['mark','import']);p.add_argument('id');p.add_argument('download',nargs='?');args=p.parse_args()
root=Path('out/marketing03');f=root/'ledger.json';d=json.loads(f.read_text());s=next(x for x in d['calls'] if x['id']==args.id)
assert d['estimatedTotalUsd']<=d['limitUsd']
if args.action=='mark':
 assert s['attempts']==0,'Do not retry a paid request'
 s.update(attempts=1,status='SUBMISSION_ABOUT_TO_START',attemptUtc=datetime.datetime.now(datetime.timezone.utc).isoformat())
else:
 assert s['attempts']==1 and s['status'] in ['SUBMISSION_ABOUT_TO_START','DOWNLOAD_PATH_RETURNED_BUT_FILE_INACCESSIBLE']
 target=root/'raw'/(args.id+'.wav');assert not target.exists();shutil.copyfile(args.download,target)
 subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True)
 with wave.open(str(target)) as w:rate=w.getframerate();duration=w.getnframes()/rate;assert w.getsampwidth()==2 and w.getnchannels()==1
 s.update(status='DOWNLOADED_DECODED',audioPath=str(target),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),sampleRate=rate,durationSeconds=duration)
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');print(args.id,s['status'])
