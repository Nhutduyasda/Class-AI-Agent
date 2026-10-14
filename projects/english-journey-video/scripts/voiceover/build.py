"""Synthesize one narration plan; derive scenes/subtitles from real PCM durations."""
from __future__ import annotations
import argparse
import hashlib
import asyncio
import json
import math
import subprocess
import sys
import wave
from pathlib import Path

from providers import get_provider

RATE = 48000
SCENES = ['hook','before','teach','after','cta']

def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True)

def stamp(ms: float, separator=',') -> str:
    value = round(ms)
    hours, rest = divmod(value,3600000)
    minutes, rest = divmod(rest,60000)
    seconds, milliseconds = divmod(rest,1000)
    return f'{hours:02}:{minutes:02}:{seconds:02}{separator}{milliseconds:03}'

def make_pages(tokens):
    pages = []
    group = []
    def flush():
        nonlocal group
        if group:
            pages.append({'startMs':group[0]['startMs'],'endMs':group[-1]['endMs'],
                          'text':' '.join(t['text'] for t in group),'tokens':group})
            group = []
    for token in tokens:
        proposed = ' '.join(t['text'] for t in [*group,token])
        if group and (len(group) >= 6 or len(proposed) > 42 or token['segmentId'] != group[-1]['segmentId'] or token['startMs']-group[-1]['endMs'] > 450):
            flush()
        group.append(token)
        if token['text'].endswith(('.', '?', '!', ':')): flush()
    flush()
    return pages

async def build(plan_path: Path):
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    source = json.loads(Path(plan['sourceBrief']).read_text(encoding='utf-8'))
    if plan['fps'] != source['fps']: raise ValueError('FPS mismatch')
    if [s['scene'] for i,s in enumerate(plan['segments']) if not i or s['scene']!=plan['segments'][i-1]['scene']] != SCENES:
        raise ValueError('Narration must cover the five scenes once, in order')
    if any(s.get('approvedFact') and s['text'] != source['facts'][s['approvedFact']] for s in plan['segments']):
        raise ValueError('Spoken English differs from the approved fact')
    if not 35 <= plan['minDurationSeconds'] <= plan['maxDurationSeconds'] <= 45:
        raise ValueError('Voice pilot duration must stay within 35–45 seconds')
    provider = get_provider(plan['provider'])
    staging = Path('.cache/voiceover') / plan['id']
    staging.mkdir(parents=True,exist_ok=True)
    tokens, segments, scenes = [], [], []
    pcm = bytearray(b'\0\0' * round(plan['leadInSeconds']*RATE))
    cursor = len(pcm)//2
    fps = plan['fps']
    scene_start = 0
    for index, spec in enumerate(plan['segments']):
        print(f"Synthesizing {spec['id']} ({spec['voice']})",flush=True)
        result = await provider.synthesize(text=spec['text'],voice=spec['voice'],rate=spec['rate'],cache_dir=Path('.cache/tts'))
        decoded = staging / f"{spec['id']}.wav"
        run(['ffmpeg','-v','error','-y','-i',str(result.audio_path),'-ar',str(RATE),'-ac','1','-c:a','pcm_s16le',str(decoded)])
        with wave.open(str(decoded),'rb') as f:
            samples = f.getnframes()
            frames = f.readframes(samples)
        duration_ms = samples*1000/RATE
        if any(t['startMs']<0 or t['endMs']<=t['startMs'] or t['endMs']>duration_ms+35 for t in result.tokens):
            raise ValueError('Word boundary outside decoded audio')
        start_ms = cursor*1000/RATE
        pcm.extend(frames)
        cursor += samples
        segment_tokens = [{**t,'startMs':t['startMs']+start_ms,'endMs':t['endMs']+start_ms,
                           'segmentId':spec['id'],'scene':spec['scene']} for t in result.tokens]
        tokens.extend(segment_tokens)
        segments.append({**spec,'startMs':start_ms,'endMs':cursor*1000/RATE,
                         'speechEndMs':segment_tokens[-1]['endMs'],'sourceAudio':str(result.audio_path),
                         'durationMs':duration_ms})
        last_in_scene = index+1 == len(plan['segments']) or plan['segments'][index+1]['scene']!=spec['scene']
        if last_in_scene:
            pause = round(plan['sceneTailSeconds']*RATE)
            cursor += pause
            # Align scene endpoints upwards to video frames without cutting any PCM.
            end_frame = math.ceil(cursor*fps/RATE)
            aligned = round(end_frame*RATE/fps)
            pcm.extend(b'\0\0'*(pause+aligned-cursor))
            cursor = aligned
            scenes.append({'type':spec['scene'],'startFrame':scene_start,'endFrame':end_frame})
            scene_start = end_frame
        else:
            pause = round(plan['betweenSegmentsSeconds']*RATE)
            pcm.extend(b'\0\0'*pause)
            cursor += pause
    duration = cursor/RATE
    if not plan['minDurationSeconds'] <= duration <= plan['maxDurationSeconds']:
        raise ValueError(f'Audio-derived video duration {duration:.3f}s outside plan. Revise script; do not speed up/cut speech.')
    raw = staging / 'mix-raw.wav'
    with wave.open(str(raw),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm)
    # Two-pass loudness normalization, preserving timing and samples.
    measurement = run(['ffmpeg','-hide_banner','-i',str(raw),'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])
    metrics = json.loads(measurement.stderr[measurement.stderr.rfind('{'):])
    output = Path('public/voice') / plan['id']
    output.mkdir(parents=True,exist_ok=True)
    normalized = output / 'narration.wav'
    filter_ = (f"loudnorm=I=-16:TP=-1.5:LRA=7:measured_I={metrics['input_i']}:"
               f"measured_TP={metrics['input_tp']}:measured_LRA={metrics['input_lra']}:"
               f"measured_thresh={metrics['input_thresh']}:offset={metrics['target_offset']}:linear=true")
    run(['ffmpeg','-v','error','-y','-i',str(raw),'-af',filter_,'-ar',str(RATE),'-ac','1','-c:a','pcm_s16le',str(normalized)])
    with wave.open(str(normalized),'rb') as f:
        if f.getnframes()!=cursor: raise ValueError('Loudness normalization changed duration')
    pages = make_pages(tokens)
    manifest = {'id':plan['id'],'provider':plan['provider'],'fps':fps,'durationInFrames':scene_start,
                'durationSeconds':duration,'audioSrc':f'voice/{plan["id"]}/narration.wav',
                'sampleRate':RATE,'totalSamples':cursor,'scenes':scenes,'segments':segments,
                'tokens':tokens,'pages':pages,'sourceBrief':plan['sourceBrief'],
                'facts':source['facts'],'planSha256':hashlib.sha256(plan_path.read_bytes()).hexdigest(),
                'sourceBriefSha256':hashlib.sha256(Path(plan['sourceBrief']).read_bytes()).hexdigest(),
                'loudnessBeforeNormalization':metrics}
    (output/'props.json').write_text(json.dumps({'brief':source,'narration':manifest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    out = Path('out');out.mkdir(exist_ok=True)
    import shutil
    shutil.copyfile(normalized,out/f'{plan["id"]}.wav')
    run(['ffmpeg','-v','error','-y','-i',str(normalized),'-c:a','libmp3lame','-b:a','160k',str(out/f'{plan["id"]}.mp3')])
    shutil.copyfile(output/'manifest.json',out/f'{plan["id"]}.json')
    (out/f'{plan["id"]}.srt').write_text('\n'.join(f"{i+1}\n{stamp(p['startMs'])} --> {stamp(p['endMs'])}\n{p['text']}\n" for i,p in enumerate(pages)),encoding='utf-8')
    (out/f'{plan["id"]}.vtt').write_text('WEBVTT\n\n'+'\n'.join(f"{stamp(p['startMs'],'.')} --> {stamp(p['endMs'],'.')}\n{p['text']}\n" for p in pages),encoding='utf-8')
    transcript = '# Lesson 15 — voice transcript\n\n'
    for s in segments:
        transcript += f"## {s['scene']} / {s['id']} ({s['startMs']/1000:.3f}–{s['endMs']/1000:.3f}s)\n\n{s['text']}\n\nVoice: {s['voice']} · Rate: {s['rate']}\n\n"
    (out/f'{plan["id"]}-transcript.md').write_text(transcript,encoding='utf-8')
    print(f'Built {duration:.3f}s, {scene_start} frames, {len(tokens)} real word boundaries, {len(pages)} subtitle pages.',flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan',nargs='?',default='briefs/lesson15-voiceover.json')
    args = parser.parse_args()
    asyncio.run(build(Path(args.plan)))
