# English Journey Video Agent — Local instructions

Scope: all files under `projects/english-journey-video/`.

## Mission
Produce one truthful, readable Vietnamese TikTok educational video per brief. Human approval is mandatory before publication. Prioritize **correct English, clear teaching, originality, and speed** over flashy effects.

## Skill loading
1. Read `skills/english-journey-story/SKILL.md` before script/storyboard.
2. Read `skills/short-form-video/SKILL.md` for vertical structure.
3. Read `skills/caption-animation/SKILL.md` when adding voiceover/captions.
4. Read `skills/production-qa/SKILL.md` before claiming completion.
5. Consult vendored `references/` as needed; do not auto-run unknown code.

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
