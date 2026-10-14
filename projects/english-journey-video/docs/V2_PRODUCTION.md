# Lesson 15 V2 — production and review

Core message: **AI sửa và giải thích; mình hiểu rồi viết lại.** V2 is a new story/animation composition, not V1 with a soundtrack pasted over it. It uses the genuine Lesson 15 mistake and approved retry unchanged.

## Build and render

Requirements: Node.js 24+, Python 3.11+, FFmpeg/ffprobe, Chromium (Remotion can download it).

```bash
cd projects/english-journey-video
npm ci
python3 -m pip install -r requirements-v2.txt
npx remotion browser ensure
npm run build:v2
npm run typecheck
npm run proofs:v2
npm run render:v2
npm run qa:v2
```

Windows: use `py -m pip install -r requirements-v2.txt` and `py scripts/v2/build.py` if `python3` is not on PATH. Both FFmpeg binaries must be available on PATH. On this host, an external temporary Node preload handles a denied network-interface enumeration syscall; ordinary developer machines do not need it.

The builder supplies real props; do not render the empty Studio defaults as production. It exports a sample-derived 90 BPM/30 FPS timeline and validates the 32–39 second budget. Scene ends follow the complete outgoing audio, then snap forward to the next 20-frame beat. The full corrected sentence gets a ten-second scene, with more than seven seconds after the final reveal.

## Story and motion

- Opening: the actual BEFORE sentence is already visible below “Một câu thôi. Sai mấy chỗ?” within frame zero.
- Mistakes: strike through each misspelling; reveal `t` in `supermarket` and `r` in `yesterday` on colored chips, with soft original chimes.
- Bridge: `and` drops into a physical connecting arc between `went` (đã đi) and `bought` (đã mua); the reveal lands at/after the actual spoken “và”, on the next beat.
- Retry: reveal time placement, the connector and added dinner context, then hold the approved full sentence.
- Payoff: explain that AI correction is followed by understanding and rewriting; ask one warm question.

The dark green/mint identity remains, with warm paper, original pencil vectors, ink marks and frame-driven typography. No fabricated chat screenshot, AI response, testimonial, TOEIC result or fluency promise is used. The two intentionally wrong word fragments in the mistakes scene are visibly marked as errors being edited.

The author-controlled caption clauses preserve semantic units such as “siêu thị hôm qua” and “cho bữa tối”. Clause boundaries come from real TTS words. Captions can linger briefly through silence for reading; active words still use their real `[startMs,endMs)` boundaries. No timestamps are evenly fabricated.

## Voice audition and human replacement

`out/v2-audition-A.wav`: HoaiMy; `out/v2-audition-B.wav`: NamMinh. Both include the same hook and reveal. There was no genuine listening comparison in this agent runtime, which rejects audio input. **No audition is declared a natural-performance winner.** B is used provisionally in the technical review render; this does not certify improvement over V1's robotic voice. No unsupported emotion tags, voice cloning or speech stretching are used.

The read-aloud script/performance directions are in the production plan and `out/v2-read-aloud-script.md`. To use a consented human recording, fill `assets/v2-human-recording-manifest.example.json` with one audio file per authored line and real word alignment for that exact recording, then:

```bash
python3 scripts/v2/build.py --human-manifest path/to/filled-manifest.json
npm run proofs:v2
npm run render:v2
npm run qa:v2
```

Declare consent, preserve the transcript, and supply actual `{text,startMs,endMs}` tokens from an available aligner/transcriber. The importer rejects missing segments or token text that differs. This workflow is implemented; no human WAV was supplied/ingested for this pilot. Paid or alternative TTS requires separate approval and a clear commercial license. Edge consumer voice usage rights for commercial publication are not claimed.

## Original music and sound mix

`assets/music-license-manifest.json` records source/provenance. The bed is newly synthesized locally from sine/harmonic pads, plucks, gentle bass pulses and a deterministic note pattern. Chimes/whoosh use original sine/seeded filtered noise. No third-party song, sample, MIDI file, watermark or paid generation is imported.

Tempo is 90 BPM. Music has a 350ms entrance and 700ms ending fade. A deterministic speech envelope ducks the bed by up to 4.4dB (20ms attack/280ms release); source stems remain separate. A conservative linear master gain targets approximately -16 LUFS without retiming or changing speech. Quantitative levels are starting-point evidence, not a claim that the mix feels right to a listener.

Outputs: `lesson15-writing-retry-v2.mp4`, `v2-voice.wav`, `v2-music.wav`, `v2-sfx.wav`, `v2-mix.wav`, auditions, SRT/VTT, timeline, read-aloud script and five final-export PNGs. Generated audio/manifests/MP4 stay out of Git; source and provenance are committed on the V2 branch.

## Optional independent machine recognition

```bash
python3 -m pip install -r requirements-asr.txt
HF_HUB_DISABLE_XET=1 python3 scripts/v2/qa.py --asr
```

Windows PowerShell: set `$env:HF_HUB_DISABLE_XET='1'` before the ASR command if needed. This checks each spoken line in the final speech+music export with a free local Whisper model, with no expected-transcript prompt. ASR does not certify natural emotion, musical taste or comprehension after one viewing.

## Acceptance

See `docs/V2_QA_REPORT.md` and `docs/V2_ACCEPTANCE.md`. Until a human hears both auditions/full export, rates all six human dimensions at least 4/5, and confirms publication voice rights, the status is **NOT APPROVED**. No auto-post or main merge is implemented.
