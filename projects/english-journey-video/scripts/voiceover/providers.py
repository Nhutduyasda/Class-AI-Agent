"""Replaceable TTS contract. Only the no-account Edge adapter is enabled."""
from __future__ import annotations
import asyncio
import hashlib
import json
import os
import re
import ssl
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

@dataclass
class SynthesisResult:
    audio_path: Path
    tokens: list[dict]
    provider: str
    voice: str
    rate: str

class TTSProvider(Protocol):
    async def synthesize(self, *, text: str, voice: str, rate: str, cache_dir: Path) -> SynthesisResult: ...

def attach_punctuation(text: str, boundaries: list[dict]) -> list[dict]:
    """Recover punctuation from authored text without changing provider timing."""
    positions = []
    cursor = 0
    for word in boundaries:
        match = re.search(re.escape(word['text']), text[cursor:], flags=re.IGNORECASE)
        if not match:
            raise ValueError(f"Provider token absent from transcript: {word['text']!r}")
        start = cursor + match.start()
        end = cursor + match.end()
        positions.append((start, end))
        cursor = end
    tokens = []
    for i, (word, (start, end)) in enumerate(zip(boundaries, positions)):
        next_start = positions[i + 1][0] if i + 1 < len(positions) else len(text)
        display = text[start:next_start].strip()
        if i == 0:
            display = text[:start] + display
        tokens.append({'text': display, 'startMs': word['offset'] / 10000,
                       'endMs': (word['offset'] + word['duration']) / 10000})
    if ' '.join(t['text'] for t in tokens) != text:
        raise ValueError('Word metadata does not fully cover the exact authored transcript')
    return tokens

class EdgeProvider:
    async def synthesize(self, *, text: str, voice: str, rate: str, cache_dir: Path) -> SynthesisResult:
        import edge_tts
        import edge_tts.communicate as communicate_module
        # Keep certificate verification ON; extend Edge's certifi trust with host CA.
        ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
        if ca:
            communicate_module._SSL_CTX.load_verify_locations(cafile=ca)
        key = hashlib.sha256(json.dumps(['edge',edge_tts.__version__,voice,rate,text],ensure_ascii=False).encode()).hexdigest()
        cache_dir.mkdir(parents=True, exist_ok=True)
        audio = cache_dir / f'{key}.mp3'
        metadata = cache_dir / f'{key}.json'
        if audio.is_file() and audio.stat().st_size > 0 and metadata.is_file():
            raw = json.loads(metadata.read_text(encoding='utf-8'))
            return SynthesisResult(audio, attach_punctuation(text,raw), 'edge', voice, rate)
        last_error = None
        for attempt in range(2):
            temporary = cache_dir / f'{key}.partial.mp3'
            boundaries = []
            try:
                stream = edge_tts.Communicate(text,voice=voice,rate=rate,boundary='WordBoundary',
                    proxy=os.environ.get('TTS_PROXY') or os.environ.get('HTTPS_PROXY') or None,
                    connect_timeout=15,receive_timeout=30)
                async with asyncio.timeout(50):
                    with temporary.open('wb') as target:
                        async for chunk in stream.stream():
                            if chunk['type'] == 'audio': target.write(chunk['data'])
                            elif chunk['type'] == 'WordBoundary': boundaries.append(chunk)
                if not boundaries or temporary.stat().st_size == 0:
                    raise ValueError('TTS returned missing audio or word boundaries')
                tokens = attach_punctuation(text,boundaries)
                temporary.replace(audio)
                metadata.write_text(json.dumps(boundaries,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                return SynthesisResult(audio,tokens,'edge',voice,rate)
            except Exception as error:
                temporary.unlink(missing_ok=True)
                last_error = error
                if attempt == 0: await asyncio.sleep(1)
        raise RuntimeError(f'Edge synthesis failed ({type(last_error).__name__}); no paid fallback was invoked') from last_error

# Future Azure/ElevenLabs adapters must implement TTSProvider, normalize their true
# word boundaries to this contract, and be explicitly authorized before enabling.
def get_provider(name: str) -> TTSProvider:
    if name == 'edge': return EdgeProvider()
    raise ValueError(f'Provider {name!r} is not enabled. No paid adapters are implemented or invoked.')
