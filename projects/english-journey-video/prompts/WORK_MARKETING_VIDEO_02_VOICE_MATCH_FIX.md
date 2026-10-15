# WORK — Voice-Match Repair for English Journey Marketing Video 02

You are the audio director, speech pipeline engineer and QA reviewer for the EXISTING English Journey Marketing Video 02 project.

## Repo / baseline
- Repository: `Nhutduyasda/Class-AI-Agent`
- Branch: `feat/english-journey-marketing-video-02`
- Draft PR: https://github.com/Nhutduyasda/Class-AI-Agent/pull/5
- Work folder: `projects/english-journey-video/`
- **Reference:** final owner-preferred Marketing Video 01 voice (Nam Minh revision), available in prior Work deliverables or reproducible from `scripts/marketing/build.py`.
- **Rejected revision:** Marketing Video 02 at `out/marketing02/English-Journey-Marketing-02.mp4` (in Work render/delivery artifacts, not necessarily committed to GitHub).

## Owner's feedback — priority
The **Video 02 content and visuals are already OK**. The voice does NOT match Video 01 and is unpleasant. **Do NOT redesign, rewrite, re-storyboard or re-render from scratch.** Focus on VO identity, naturalness, pronunciation, mixing and audio-timing dependent animation/subtitles only.

## Read first
- `docs/MARKETING_VIDEO_VOICE_PROFILE.md` — verified baseline configuration & commercial-rights stop gate
- `docs/MARKETING_VIDEO_01_RENDER_QA.md`
- `docs/MARKETING_VIDEO_01_PRODUCTION.md`
- `docs/reviews/marketing02/QA_REPORT.md`
- `docs/reviews/marketing02/RENDER.md`
- `assets/marketing-video-01-license-manifest.json`
- `assets/marketing-video-02-license-manifest.json`
- `scripts/marketing/build.py`, `scripts/marketing02/build.py`, `scripts/voiceover/providers.py`
- `briefs/marketing-video-02-approved.json` and the six-stage locked script
- Existing production QA and video review skills.

## Critical finding to verify, not assume
Video 01 used **edge-tts vi-VN-NamMinhNeural @ +0%**. Current Video 02 used **Piper vi_VN-vais1000-medium @ length_scale=2.0**, plus **en_US-ljspeech-medium** for its English example. This is not a voice identity match. Inspect current branch and actual generated manifest/audio to confirm and note any divergence.

## Deliverable 1 — Voice continuity audit
1. Obtain the *actual* Video 01 voice audio or its final MP4 from available artifacts. If unavailable, generate a clearly marked reproducible comparison sample from the original provider, subject to the allowed use and connectivity.
2. Obtain Video 02's rejected voice stem from Work artifacts if available. Do not claim comparisons based solely on metadata equal listening.
3. Write a voice-continuity comparison: provider/voice ID, effective speed, segmentation and pauses, pronunciation of "ChatGPT", "AI", "improve", the full English sentence, "BẮT ĐẦU", EQ/loudness and musical masking.
4. A real person or an actually audio-capable tool must listen; mark it BLOCKED if not possible.

## Deliverable 2 — Audition FIRST, no full video render before owner acceptance
1. Reuse the same actual voice identity and core audio production method as Marketing Video 01 wherever usage rights allow. Prefer `vi-VN-NamMinhNeural` at `+0%` as a *matching reference*, not a new voice.
2. Generate **two brief, separate audition WAV/MP3 files** using excerpts from Video 02's *approved words*: one for HOOK, one for DEMO/CTA or two subtle pacing variants of the same hook. No new spoken words or hallucinated dialogue.
3. Compare each audition side-by-side to an excerpt of Video 01. Avoid changes that make voice noticeably higher/lower, unnaturally slow, or robotic. Do not stretch synthesized audio as a shortcut. Adjust natural phrase boundaries and punctuation guidance if supported by the voice engine **without altering what is spoken**.
4. For the English example `I want to improve my English.`, try consistent narrator voice first if intelligible. If the native English voice is truly required, isolate that teaching example and audition its transition; do not insert an unapproved voice identity change.
5. Send the short samples to owner for selection. **Do not mark the voice approved or render a full replacement MP4 before hearing owner's choice.**

## Deliverable 3 — Only after owner approves audition
1. Regenerate full Video 02 narration with the chosen voice profile, using exact V1.1 spoken segments and zero script edits.
2. Recompute real PCM duration, spoken timing, scene transitions and caption pages; re-time visual animations minimally. Keep the full visual concept and existing SVG/Remotion implementation.
3. Keep a baseline backup (old VO + MP4). Export a distinctly named revision (e.g. `English-Journey-Marketing-02-VoiceMatch-V1.2.mp4`), not overwrite the original output or Video 01.
4. Rebuild music/SFX alignment and ducking to actual VO timing; check mono/mobile listening and no clicks or clipping.
5. Run technical QA, source text verification, frame proof checks and full audio listening if actually supported. Show both revision and baseline voice metadata and the selected profile in a provenance report.

## Commercial licensing and budget: MANDATORY
- Video 01 used consumer Edge TTS; commercial redistribution rights are unresolved. Do **not** assume it is commercially licensed just because Video 01 was delivered.
- Microsoft Azure TTS has an official `vi-VN-NamMinhNeural` voice, and Microsoft's paid-tier terms permit commercial use of prebuilt voice outputs. **Do not call Azure paid TTS or buy credits without owner's explicit cost approval.** A free-tier right to commercial use is not established here.
- If no rights-cleared matching voice can be used in current authorized constraints, report "VOICE RIGHTS / PROVIDER BLOCKED" with concrete options; **do not silently revert to Piper or another free voice**.
- No unauthorized voice cloning, third-party commercial assets, SeeCut code/assets, TikTok posting or main branch merge.

## Final report
Identify precisely why Video 02 differed from Video 01, real sample paths, listener feedback status, provider and cost/rights, suggested next step, and whether full video needs a timing-only rebuild. Never claim emotion, pronunciation, or voice-matching PASS without a real listening assessment.

**Success means the owner hears a matching, natural Video 02 voice — not merely that a technical render passes.**
