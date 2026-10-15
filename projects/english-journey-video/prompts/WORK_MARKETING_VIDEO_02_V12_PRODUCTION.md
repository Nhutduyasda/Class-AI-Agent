# ChatGPT Work — Marketing Video 02 V1.2: Approved Nam Minh voice production and real MP4 render

You are continuing the **existing Work session** for English Journey Marketing Video 02. Owner has listened to and APPROVED both Azure Nam Minh samples (HOOK and DEMO) and explicitly requests that you **continue production now**.

## Repository and source of truth

- Repo: `Nhutduyasda/Class-AI-Agent`
- Branch: `feat/english-journey-marketing-video-02`
- PR #5: https://github.com/Nhutduyasda/Class-AI-Agent/pull/5
- Directory: `projects/english-journey-video/`
- Read `docs/MARKETING_VIDEO_02_V12_APPROVAL.md` and `briefs/marketing-video-02-approved.json` first.
- Read `docs/MARKETING_VIDEO_VOICE_PROFILE.md`, `docs/MARKETING_VIDEO_02_AZURE_SETUP.md`, `docs/reviews/marketing02/QA_REPORT.md`, `docs/MARKETING_VIDEO_02_QA.md` and previous video renderer/QA scripts.

## Owner feedback, revised gates

1. **HOOK and DEMO voice samples are APPROVED.** Do NOT ask the owner to audition those again unless the approved files are missing or demonstrably inconsistent.
2. Work is authorized to complete the remaining full Video 02 voiceover using paid **Azure Speech Standard S0**, exact voice `vi-VN-NamMinhNeural`, rate `+0%`, default pitch.
3. It may synthesize only what is needed for the current approved Marketing Video 02 voiceover, subject to reference usage budget **USD 0.05 before tax/FX/fees** and no automatic retries. This is not an Azure-side hard cap.
4. **The content and visuals of the current Video 02 are satisfactory.** Preserve six approved spoken segments, original visual design, storyboard, 1 CTA and correct `improve` illustration. Repair voice/audio timing only and perform necessary minimal subtitle/motion retiming.

## Production procedure — execute, do not merely outline

1. Fetch HEAD and inspect actual project state; preserve existing video assets and outputs. Confirm voice comes from the existing `english-journey-namminh` Speech service (`southeastasia`, Standard S0).
2. Locate both approved sample WAV files in the **existing Work deliverables/session**. Verify HOOK text = 82 approved characters and DEMO text = 188 approved characters, voice ID, clean audio, actual output sample rate, provenance. Reuse them *if verifiably exact*. If not accessible, stop and report precisely what files are needed; do NOT quietly regenerate samples or invent files.
3. Count the remaining four segments (`problem`, `solution`, `benefit`, `cta`) against the canonical JSON and show a per-call cost preflight. If all approved segments are 735 characters total and HOOK/DEMO (270) are reusable, the remaining quantity is 465 characters at approximately USD 0.006975 under the prior USD 15/million reference. Do not re-charge for samples unnecessarily.
4. Access the user's existing Azure Speech S0 resource through the **previously established secure Work authentication** or secure per-session secret mechanism. Never reveal, paste, log, store in GitHub, or request keys in conversation. If secure access is unavailable, pause for the user to complete secure authorization — never pretend that a credential exists.
5. Synthesize required remaining segments using Azure Nam Minh, default +0% speed/pitch. Preserve natural breaks and exact words. Attempt **at most one call per missing segment**. If an API call fails or is ambiguous, stop; do not auto-retry. Do not use Piper, Edge consumer TTS, mixed male/female voices or unsupported fallback.
6. Verify every generated WAV by decoding and acoustic checks. Produce a complete 6-segment Nam Minh voiceover. Normalize/rebuild mixes using existing Video 01/02 audio pipeline (48 kHz, approx -16 LUFS master, measured speech ducking). Preserve project-original music and SFX.
7. Recompute **actual audio-derived scene duration** and subtitle/motion cue times. Current `scripts/marketing02/build.py` still loads Piper and currently emits measured phrase cues; replace or create a **separate Azure V1.2 builder** rather than labeling Piper output as Azure. Do not invent word timestamps. Use actual Azure boundaries/verified alignment or genuine, manually checked phrase cues. Fix render/QA paths so the existing Piper V1 and all Video 01 outputs remain untouched.
8. Render a REAL separate file `out/marketing02/English-Journey-Marketing-02-V1.2-NamMinh.mp4`, 1080x1920, 30fps, H.264/AAC with narration/music/SFX, plus WAV voice, WAV mix, SRT/VTT, manifest, 6+ video-extracted proof frames.
9. Run existing Node/voice tests, TypeScript checking, real ffprobe/full audio/video decode, script/hash checks, loudness/peak and subtitle boundary tests on V1.2 (not merely Video 01 or Piper V1). Inspect the MP4 and **actually listen to its audio** if capable. Otherwise clearly label emotion/pronunciation/full listening as `BLOCKED`; never infer listening from a checksum or Whisper alone.
10. Provide an accessible V1.2 MP4 link or actual attached file, old vs new summary, exact Azure call count, reference charge, asset-license/provenance info and outstanding human review. Commit only reproducible source/docs/report without secrets or large generated media.

## Safety rules

- You have authorization for **the Video 02 full voiceover only**, not recurring paid generation.
- Do NOT create new Azure resources or subscriptions, charge unrelated services, retry paid calls automatically, or merge main.
- No TikTok publishing. The final V1.2 video requires owner's separate final approval.
- If missing sample WAVs, account authorization or reproducible audio timeline, report actual blocker and the single next action needed from owner.

**Success = real improved Marketing Video 02 V1.2 MP4 using Azure Nam Minh, unchanged approved words/visual message, accompanied by honest QA and a link the owner can watch.**
