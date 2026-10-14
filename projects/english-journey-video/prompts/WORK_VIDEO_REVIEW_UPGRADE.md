# ChatGPT Work — English Journey reviewer loop, first trial

You are continuing an EXISTING repository, not rebuilding the project.

Repository: Nhutduyasda/Class-AI-Agent
Branch: feat/english-journey-video-review-loop
Scope: projects/english-journey-video/

Objective: inspect the current real Marketing Video 01 MP4, create an editorial shotbook, test the new review utilities and make **one focused improved cut** while protecting the approved marketing copy.

1. Fetch the real branch HEAD. Read AGENTS.md, docs/MARKETING_VIDEO_01_APPROVED_SCRIPT.md, briefs/marketing-video-01-approved.json, docs/VIDEO_REVIEW_PIPELINE.md, docs/VIDEO_REVIEW_ACCEPTANCE.md and the three new skills (editorial-shot-planning, video-self-review, video-version-comparison).
2. Preserve all V1, V2 and marketing compositions. Do not merge, post or change any project outside this folder.
3. Locate the previous MP4 from the existing Work environment or reproduce it using npm ci, npm run build:marketing, npm run render:marketing and npm run qa:marketing. Do not claim an MP4 exists unless verified. Save the original output separately as baseline, and do not invent download links.
4. npm run test:review then npm run review:prepare with a real candidate and (when available) baseline. Inspect opening, 1s, 2.5s, all six scene images and listen to the actual video if the environment permits. If full playback/listening is impossible, mark subjective checks BLOCKED, do not assert emotional/marketing quality.
5. Write a shotbook grounded in exact approved narration and audio timing. Fix the 1–2 largest observable issues only: opening context, motion serving meaning, story clarity, visual readability, voice/music balance if genuinely measurable/listenable. No script rewrite.
6. Render a distinct revision MP4; keep the original unchanged. Rerun existing marketing QA (adapting output paths if necessary without disabling safeguards) and prepare packages for both versions. Include real file locations or actual accessible links only.
7. For subjective pairwise evaluation, use a real video-capable reviewer or human. Do NOT fill the worksheet with fabricated preferences. If reviewed, compare twice in reverse order, enter timestamped evidence, then run review:compare. If not, leave the comparison INCOMPLETE.
8. Submit source and reports to this branch for owner review. Output: baseline and candidate MP4 (if rendered), proof images, 2 audio clips per version, technical report, shotbook, diff summary, real review findings or BLOCKED status.

Definition of done: objective tests PASS, actual candidate MP4 rendered and inspected, editor's changes documented, and subjective/publishing gate explicitly PENDING HUMAN APPROVAL. Do not quietly use paid APIs or third-party noncommercial SeeCut material.
