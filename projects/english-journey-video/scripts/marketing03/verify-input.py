"""Verify owner audio ZIP without executing contents, extracting paths or contacting Azure."""
import hashlib,json,subprocess,sys,wave,zipfile,io
from pathlib import Path
archive=Path(sys.argv[1]);dest=Path('out/marketing03/raw');dest.mkdir(parents=True,exist_ok=True)
briefBytes=Path('briefs/marketing-video-03-approved.json').read_bytes();brief=json.loads(briefBytes)
with zipfile.ZipFile(archive) as z:
 assert len(z.infolist())<=40 and sum(x.file_size for x in z.infolist())<100_000_000
 assert len(z.namelist())==len(set(z.namelist()))
 assert all(Path(x).name==x and not x.startswith('.') for x in z.namelist())
 m=json.loads(z.read('audio-manifest.json'));ledger=json.loads(z.read('ledger.json'));assert m['briefSha256']==hashlib.sha256(briefBytes).hexdigest();assert len(m['files'])==6
 results=[]
 for s,f in zip(brief['spokenSegments'],m['files']):
  assert f['scene']==s['id'];assert f['voice']=='vi-VN-NamMinhNeural' and f['region']=='southeastasia' and f['rate']=='+0%' and f['pitch']=='default'
  raw=z.read(f['file']);r=json.loads(z.read(f['file']+'.receipt.json'));digest=hashlib.sha256(raw).hexdigest();assert digest==f['sha256']==r['sha256'];assert r['provenance']['kind']=='AZURE_REST';assert r['provenance']['textSha256']==hashlib.sha256(s['spoken'].encode()).hexdigest()
  call=next(x for x in ledger['calls'] if x['id']==s['id']);assert call['text']==s['spoken'];assert call['attempts']==(2 if s['id']=='hook' else 1)
  with wave.open(io.BytesIO(raw)) as w:assert (w.getframerate(),w.getnchannels(),w.getsampwidth())==(48000,1,2);duration=w.getnframes()/48000
  subprocess.run(['ffmpeg','-v','error','-xerror','-i','pipe:0','-f','null','-'],input=raw,check=True,capture_output=True)
  target=dest/f['file']
  if target.exists():assert target.read_bytes()==raw
  else:target.write_bytes(raw)
  results.append({'scene':s['id'],'sha256':digest,'durationSeconds':duration,'decode':'PASS','textHash':'PASS'})
 Path('out/marketing03/audio-manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
 Path('out/marketing03/windows-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2))
 Path('out/marketing03/input-verification.json').write_text(json.dumps({'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':results,'provenance':'Owner-supplied Azure REST receipts/manifest; not provider-signed or independently server-attested','newAzureRequests':0},indent=2))
print('PASS: six verified WAV, exact-copy text hashes, no network requests')
