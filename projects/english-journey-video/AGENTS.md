# English Journey Video Agent — Local instructions

Scope: all files under `projects/english-journey-video/`.

## Mission
Produce one truthful, readable Vietnamese TikTok educational video per brief. Human approval is mandatory before publication. Prioritize **correct English, clear teaching, originality, and speed** over flashy effects.

## Skill loading
1. Read `skills/english-journey-story/SKILL.md` before script/storyboard.
2. Read `skills/short-form-video/SKILL.md` for vertical structure.
3. Read `skills/caption-animation/SKILL.md` when adding voiceover/captions.
4. Read `skills/production-qa/SKILL.md` before claiming completion.
5. Read `skills/voiceover-production/SKILL.md` when producing spoken audio, word timestamps or a voiced export.
6. Consult vendored `references/` as needed; do not auto-run unknown code.

## Truth rules
- The brief holds exact user-provided text and the approved correction.
- If fixing an English grammar issue, do not make unrelated claims or invent additional mistakes.
- Do not portray generated UI as genuine chat screenshots.
- Disclose demonstrations/simulations when appropriate.
- Treat numeric 'retention benchmarks' in third-party skills as unverified heuristics, **not guaranteed outcomes**.

## Scope & cost
- Render one pilot. No batch runs, scraping, automated TikTok posting, analytics ingestion, or API spending.
- Use local/available tools. If no suitable Vietnamese TTS exists for free, use an honest captions-first silent version and report that voice was omitted. Never pretend the video has voiceover.
- Do not remove/modify existing repository files outside this folder.
- Submit code changes for review on a feature branch, not the default branch.


## Editorial and self-review upgrade (Marketing Video 01)
- Read skills/editorial-shot-planning/SKILL.md before building a storyboard from the immutable approved script.
- Read skills/video-self-review/SKILL.md for export evidence and technical vs human creative QA separation.
- Read skills/video-version-comparison/SKILL.md before comparing two genuinely rendered files.
- Use npm run test:review and npm run review:prepare after the existing render and QA commands.
- A review report is not an approval. Never claim voice emotion, retention, or subjective watch quality PASS from ffprobe, still frames or transcription alone.
- Do not import SeeCut source/code/assets: its PolyForm Noncommercial license is inappropriate for this commercial-intent workflow without additional permission.
- Preserve existing Remotion compositions, unchanged owner-approved marketing dialogue, no main merge, publishing or new paid services.

## Default bilingual voice for NEW marketing productions

- Read `docs/BILINGUAL_VOICE.md` and `config/bilingual-voice.json` before planning speech for a new approved marketing brief. Vietnamese uses Azure `vi-VN-NamMinhNeural`; English uses Azure `en-US-AndrewNeural`, default rate/pitch, existing southeastasia resource only. No consumer Edge/Piper or substitute voices in this workflow.
- Use `npm run voice:plan -- <approved-brief.json> <new-plan.json>`. Resolve any language warnings through exact character-offset pronunciation metadata in the NEW brief/production metadata; do not rewrite approved words or request another script approval merely to add metadata. Ambiguous names/acronyms must not be guessed as English.
- Use the shared `scripts/bilingual/Start-BilingualVoice.ps1` secure runner for a paid production only when that production prompt explicitly authorizes its own cost and request count. Compile that authorization into a new `BILINGUAL_V1` policy bound to the exact plan SHA. Never reuse Video 03/04 policies. A code/offline-only task grants no synthesis budget.
- Refresh the public price snapshot using `npm run voice:price` when needed; check both exact voices through the authenticated GET-only catalogue check before synthesis. The launcher uses one private hidden key prompt. No credential in Codex, source, arguments or logs.
- Multi-voice is the default, one request per scene. A failure or timeout stops the entire session without retry or automatic split fallback. Split mode requires a separately priced/authorized plan, not a hidden retry.
- Use verified WAV plus `align.py`, `voice:timeline`, and `audio.py` for actual observed timing, canonical subtitles and sample-based mixing. Future Remotion compositions can use `src/BilingualVoiceClock.ts`; never fabricate timings or use ASR text as approved copy.
- Existing Video 01–04 scripts, media, ledgers and render outputs are historical artifacts; do not migrate or rerender them unless explicitly requested. Subjective pronunciation/voice/emotion QA remains blocked until genuinely heard.
