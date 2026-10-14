# Marketing Video 01 — reproducible production

The approved JSON is the only narration source. This new composition preserves V1/V2. Six scene boundaries follow full, untrimmed 48 kHz recordings and round upward to the 90 BPM beat grid (20 frames). Demo AFTER holds at least seven seconds. No speech acceleration, time stretching or copy edits.

```bash
cd projects/english-journey-video
npm ci
python3 -m pip install -r requirements-v2.txt
npx remotion browser ensure
npm run build:marketing
npm run typecheck
npm run proofs:marketing
npm run render:marketing
npm run qa:marketing
```

Requires Node, Python, FFmpeg/ffprobe and Edge network access. CHROME_PATH optionally selects a browser. On this restricted host only, the existing scratch preload handles denied Node networkInterfaces; normal machines do not require it. Generated public/marketing and out assets are ignored; synthesis caches exact text/voice/rate/version. Renderer rejects changed brief/builder hashes until audio is rebuilt.

## Voice direction and selection

Two real hook+problem takes: A HoaiMy, B NamMinh, both +0% rate. Nam Minh is selected by the owner after reviewing the HoaiMy export. This is an owner-requested voice change, not an agent listening score. New performance acceptance remains pending. Hook: curious question, emphasize “mất gốc”, pause at ellipsis. Problem: relatable uncertainty, no sales shouting. Solution: clarity and gentle optimism. Demo: patient explanatory tone, emphasize spelling and connector. Benefit: reassuring. CTA: warm invitation, clearly pronounce BẮT ĐẦU. These are performance directions for a reviewer or consented human recording; consumer Edge does not expose reliable emotion controls. No claim that directions were realized.

Provider is reusable scripts/voiceover/providers.py. No paid provider or voice cloning is enabled. No English example sentence is narrated; the locked mixed-language terms remain unchanged. Human listening must check ChatGPT, English Journey, AI, Reading, Vocabulary and “and”. New consented human recordings or an explicitly authorized licensed provider must retain the same transcript and real word alignment, then regenerate timing.

## Sound

Original deterministic synthesized sine-harmonic pad/pluck/bass music at 90 BPM; no borrowed song, imported sample or third-party soundtrack. New score generated for this timeline using scripts/v2/build.py DSP. Speech first, music initially −36 LUFS, envelope ducks up to 4.4 dB with 20 ms attack / 280 ms release. Score fades 350 / 700 ms. Meaningful soft spelling chime, connector whoosh and completion chime only. Equal-power stereo voice and separate stems share a master gain; their sum reproduces the mix. Final target −16 LUFS, conservative peak.

## Visual scope

Vector illustrations are original code, not stock footage or ChatGPT screenshots. Grammar/Vocabulary/Speaking scatter around an uncertain learner; steps organize into a learning path. Authentic Lesson 15 highlights spelling and missing and. Error Log explicitly records the same mistakes for next-session review; no automatic cross-chat persistence claim. Subtitle pages use real Edge word timestamps, fit at most two lines, and occupy the safe band above platform UI. Publication remains NOT APPROVED pending the owner's final review and voice rights.
