"""Download only public Piper models, pinned to the production upstream revision."""
import subprocess,hashlib,json
from pathlib import Path
root=Path('.cache/piper');root.mkdir(parents=True,exist_ok=True)
revision='c10ece1aade47bb51c153c893d14e5bf8e5b7117'
manifest=json.loads(Path('assets/marketing-video-02-license-manifest.json').read_text())
for lang,relative in [('vi','vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium'),('en','en/en_US/ljspeech/medium/en_US-ljspeech-medium')]:
 for ext in ['.onnx','.onnx.json']:
  target=root/f'{lang}{ext}'
  if not target.exists():
   temporary=target.with_suffix(target.suffix+'.partial')
   subprocess.run(['curl','--fail','--location','--max-time','180','--output',str(temporary),f'https://huggingface.co/rhasspy/piper-voices/resolve/{revision}/{relative}{ext}'],check=True)
   temporary.replace(target)
 assert hashlib.sha256((root/f'{lang}.onnx').read_bytes()).hexdigest()==manifest['voice'][lang+'ModelSha256'],'Model hash mismatch'
print('Model bytes verified; see attribution and publication caveat in assets/.')
