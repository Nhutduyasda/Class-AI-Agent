# Marketing Video 01

New locked-script marketing composition: see [production commands](docs/MARKETING_VIDEO_01_PRODUCTION.md) and [render acceptance](docs/MARKETING_VIDEO_01_RENDER_QA.md). Main output: `out/english-journey-marketing-video-01.mp4`. Natural-rate runtime 66 seconds; approved narration unchanged. NOT APPROVED until human voice/music/editorial review and voice rights clearance.

# English Journey — Lesson 15 V2

The V2 remake uses a fresh personal story, animated spelling edits/connector bridge, two voice auditions, locally synthesized original music/SFX, and speech-synchronized captions. Start with [V2 production](docs/V2_PRODUCTION.md) for build/render commands, provenance, human-voice import and acceptance limits.

**V2 remains NOT APPROVED until human listening, naturalness/comprehension scoring and publication voice rights are cleared.** A technical encode is not a human quality rating.

---

# English Journey — Lesson 15 video pipeline

Extend the existing text-led Remotion/React pilot with natural TTS narration and true word-timed subtitles. The original dark green/mint design and exact approved English BEFORE/AFTER strings remain intact. No paid service, account signup, background music, stock footage or posting integration is used.

## Voice version: regenerate and render

Requirements: Node.js 24+ (tested 24.19.0), npm, Python 3.11+ (tested 3.12), and FFmpeg/ffprobe on PATH. Edge synthesis requires Internet access. An installed browser can be selected with `CHROME_PATH`; otherwise Remotion downloads its browser during setup.

```bash
cd projects/english-journey-video
npm ci
python3 -m pip install -r requirements-voice.txt
npx remotion browser ensure
npm run tts
npm run typecheck
npm run test:voice
npm run proofs:voice
npm run render:voice
npm run qa:voice
```

On Windows, use `py -m pip install -r requirements-voice.txt` and `py scripts/voiceover/build.py` in place of the Python setup and `npm run tts` if `python3` is not on PATH. Install FFmpeg and ensure both `ffmpeg` and `ffprobe` work in the terminal before running the build.

The main output is `out/lesson15-writing-retry-voice.mp4`. The same build exports standalone `.wav` and `.mp3`, `.srt`, `.vtt`, `-transcript.md`, and a JSON timeline. Generated assets remain ignored in Git. Run synthesis again after changing narration: rendering rejects a manifest whose plan/source-brief hash is stale.

To preview the generated voice props in Studio:

```bash
npx remotion studio src/index.tsx --props=public/voice/lesson15-writing-retry-voice/props.json
```

## Narration and timing

`briefs/lesson15-voiceover.json` contains eight segments grouped into the original five scenes. Vietnamese uses `vi-VN-HoaiMyNeural` at -5%; English vocabulary uses `en-US-JennyNeural` at -5%, and the approved English sentence uses that English voice at -20% for a steadier learner-friendly pace. BEFORE spelling errors are displayed but not read as valid vocabulary. The AFTER explanation distinguishes time placement from added dinner context.

`npm run tts` requests real MP3 audio plus Edge word boundaries. It decodes each clip to 48 kHz mono PCM, measures its sample count, adds short pauses, and rounds scene endpoints upward to video frames. It does not trim words, overlap narration, invent word times, or stretch speech to fit. It fails if the audio-derived duration is outside 35–45 seconds. The rendered pilot is about 41.57 seconds.

Two-pass loudness normalization targets -16 LUFS and limits peaks without changing sample count. Word boundaries are shifted only by each segment's exact position in the PCM mix. The same timed phrase pages drive SRT/VTT and Remotion's active-word highlight. Changes remain frame-driven, with the original restrained scene entrance and safe caption area.

## Provider replacement boundary

- `scripts/voiceover/providers.py`: `TTSProvider` protocol and `SynthesisResult`, an Edge adapter, exact transcript-to-boundary validation, cached synthesis and bounded retries.
- `scripts/voiceover/build.py`: PCM mix, measured timing, normalized narration, scenes, subtitle paging and exports.
- `scripts/voiceover/validate.mjs`: rejects clipped speech, scene gaps/overlaps, lost subtitle tokens and altered approved English.
- `src/voice.ts` and `src/VoiceCaptions.tsx`: schema, scene/page lookup and active-word rendering.
- Existing `src/Video.tsx`, `src/index.tsx`, and production scripts accept optional narration; the silent composition remains available.
- `skills/voiceover-production/SKILL.md`: production and verification workflow for future Agents.

Azure AI Speech or ElevenLabs can later implement the same provider contract. Their output must include actual word offsets in the returned audio's timebase. They are **not implemented/enabled**, and no paid fallback is invoked. Owner authorization is required before enabling a paid adapter. TLS verification remains enabled; optional `TTS_PROXY`, `HTTPS_PROXY`, `SSL_CERT_FILE` or `REQUESTS_CA_BUNDLE` are read from the host without logging secret values.

## QA

`npm run qa:voice` probes the real MP4, requires an AAC stream, checks frames/duration/format/loudness/peak, fully decodes the export, and extracts proof PNGs from the actual MP4. `npm run test:voice` exercises clipping, word-loss, unapproved-English and timeline-boundary failures.

Optional local machine checks:

```bash
python3 -m pip install -r requirements-asr.txt
python3 scripts/voiceover/check-mux.py
HF_HUB_DISABLE_XET=1 python3 scripts/voiceover/asr-check.py --model small
```

The mux check compares the source waveform with the decoded final MP4 and reports timing drift. ASR uses a free local multilingual Whisper model and processes each segment from the **final MP4**, with no reference-transcript prompt. It provides evidence of speech intelligibility; it does not replace listening or judge how natural a voice sounds. Initial model downloads can take time. Windows PowerShell: set `$env:HF_HUB_DISABLE_XET='1'` before the ASR command if needed.

See `docs/VOICE_QA_REPORT.md` for measured results and listening status. **The current agent runtime rejects audio input; direct listening/pronunciation QA is therefore pending owner review, not marked PASS.** Do not declare full production acceptance or post to TikTok until that gate is cleared.

## Original silent pilot

The verified silent render remains `out/lesson15-writing-retry.mp4` with its original brief `briefs/pilot-lesson15.json`. Run `npm run proofs`, `npm run render`, and `npm run qa` to reproduce it. `docs/PILOT_QA_REPORT.md` documents that earlier export. The voice plan is separate, so the original approved brief is unchanged.

For another lesson, author a new brief and narration plan, update teaching copy for that lesson, and adapt the manifest path used by the voice commands. The provider/mix/caption machinery is reusable; the Lesson 15 lesson text and current CLI defaults are intentionally specific. This is not an automatic grammar checker.

## Host note and scope

On this ChatGPT host, Node's network-interface enumeration was denied. Rendering used a temporary preload outside the repository that returns loopback only when that system call fails. Normal developer machines do not require it. No dependency source was patched. The browser and model downloads are runtime dependencies, not product assets.

Only files inside `projects/english-journey-video/` are changed. Source belongs on `feat/english-journey-video-agent-pilot`. Outputs are delivered separately, not committed as binaries. No main merge or TikTok publishing occurs.

## Licenses

All original project skills were read; the added voiceover skill is project-owned. Vendored short-form/caption references retain their MIT license in `third_party/`. Bundled DejaVu Sans retains `public/fonts/LICENSE.txt`. No remote fonts or copyright-restricted soundtrack are used.
