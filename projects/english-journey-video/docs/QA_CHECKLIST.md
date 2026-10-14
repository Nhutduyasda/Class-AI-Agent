# Pilot acceptance criteria

- [ ] The skill files and lesson brief were actually read before editing.
- [ ] One output MP4 is rendered (not a screenshot/GIF substituted for video).
- [ ] MP4 has 1080x1920 portrait resolution, ~30s and 30fps.
- [ ] Original sentence exactly matches `briefs/pilot-lesson15.json`.
- [ ] Corrected sentence exactly matches brief.
- [ ] Vietnamese accents render correctly and text is readable on a phone.
- [ ] BEFORE errors are intentionally shown only in BEFORE.
- [ ] No unrelated personal info, fabricated UI, copyrighted music or paid external API used.
- [ ] At least three proof stills inspected and MP4 probed with ffprobe.
- [ ] If no voiceover, omission is explicitly disclosed (do not fake).
- [ ] Source/code, render command, duration, known limitations and QA status are documented.
- [ ] Owner reviews video before posting; no auto-upload.

## Voice upgrade acceptance criteria

- [ ] HoaiMy Vietnamese narration and a native English voice synthesized as real audio.
- [ ] All subtitle words use actual provider/aligner boundaries; no even splitting.
- [ ] Scene changes occur after the outgoing narration finishes.
- [ ] Export is 35–45 seconds, 1080×1920, 30 FPS, with a playable audio stream.
- [ ] Loudness and true peak measured; source/export audio timing compared.
- [ ] Exact final-export speech independently checked and pronunciation listened to.
- [ ] Listening status explicitly reported; no PASS if that check is unavailable.
- [ ] Audio, transcript, subtitle, QA and reproducible source delivered.
