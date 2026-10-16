# Video 03 V1.1 — Production checkpoint

Owner authorized production in the current chat on 2026-10-16, including Azure Speech S0 synthesis up to USD 0.05 before taxes/fees. This supersedes the brief’s historical production-waiting status, without modifying the immutable brief or publication approval.

HEAD inspected before work: ef2dad2c598f0da93d2f5b4bf048f23daa3b3d1c. PR #6 remains draft/open, stacked on Video 02. No Video 01/02 files changed.

## Verified

- Read canonical script, approved storyboard, QA, production prompt, AGENTS and video review pipeline in full.
- Read project story, short-form, shot planning, voiceover, emotional direction, caption, sound design, self-review, comparison and production QA skills.
- Current Speech Studio UI authenticated into english-journey-namminh (Southeast Asia, S0). No credentials extracted or stored.
- Supported voice: vi-VN-NamMinhNeural. Microsoft paid prebuilt neural output terms permit commercial use; URLs recorded below.
- Canonical six scenes: 61 / 148 / 131 / 216 / 176 / 114 characters, total 846. Azure Retail API returned USD 15 per 1M for Neural Text To Speech in southeastasia. Expected total USD 0.01269 before tax/fees, within USD 0.05.
- Prepared six exact SSML inputs; same Nam Minh, no rate/pitch overrides, no alternate English speaker.

## Actual synthesis and blocker

Only **one synthesis/export request** was submitted, for V03-A-HOOK-NamMinh-S0 (61 characters), with 48k WAV selected. Browser download event returned a path. The matching file was absent from the documented shared directory after a bounded five-second check; the browser-side file path was also inaccessible. No WAV header, duration, checksum or decode can be certified.

The current source’s Export history says “Can't find any audio.” No existing audio/video/download DOM element is present. No second Export, Play, synthesis retry or five remaining scene requests were performed.

Possible incurred reference charge: USD 0.000915; not an Azure invoice. The other five requests are not submitted. No MP4 exists; rendering/audio/subtitle/subjective QA remain BLOCKED or NOT RUN. Do not treat this checkpoint as a completed video.

## Safe continuation

Recover the original HOOK WAV if available without synthesis, validate it against the source and ledger, and restore a working supported file-transfer route before submitting the remaining five requests once each. Do not regenerate HOOK under the current one-attempt authorization. If recovery is impossible, a separate explicit owner approval is required for another HOOK request, only after file delivery is demonstrably working.

The isolated offline ledger guard records an attempt BEFORE submission. Do not reset its counter. Inputs are stored under briefs/marketing-video-03-ssml/. No word timestamps or audio-derived shotbook were fabricated while audio is unavailable.

## Sources

- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzure/allprograms
- https://azure.microsoft.com/en-us/pricing/details/speech/
- https://prices.azure.com/api/retail/prices?$filter=armRegionName%20eq%20%27southeastasia%27%20and%20contains(meterName,%20%27Neural%27)%20and%20priceType%20eq%20%27Consumption%27

No resource/subscription created, no secrets, no merge, no TikTok posting. Final publication remains NOT APPROVED.

## Offline verification actually run

TypeScript PASS; existing review tests 5/5, voice timing tests 6/6, Azure audition tests 4/4. Those are source/unit checks, not Video 03 media QA. Exact six SSML text/voice/character checks passed locally.

Remotion dependencies installed with npm ci. Automatic Chrome Headless Shell download timed out through the environment proxy; a working renderer browser is still required. No rendering attempted, no storyboard-derived fake audio timeline emitted.
