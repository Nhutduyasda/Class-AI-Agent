# Auto Video Factory — Multi-mode and expressive voice extension

Status: REQUIREMENTS ADDENDUM following Gate 0; design only. Owner request received 2026-10-21. This document changes the target scope without authorizing paid calls, platform logins, scraping, API access, deployment, auto-publishing, secret creation or merging.

## Decision and boundary

Keep ONE reusable media production engine with TWO typed modes:
- `ENGLISH_LEARNING`: scheduled short lessons, 20–35s experiment after observed weak first-second retention on earlier videos; lesson integrity and explicit bilingual spans remain mandatory.
- `PRODUCT_SHOWCASE`: on-demand Shopee/TikTok Shop product link as a reference, source-evidence verification, factual promotional/explainer video (20–45s initially), product-media licensing, human review. Do not label as personal/hands-on 'review', unboxing or testing unless owner actually tested the item and provides evidence.

A link by itself is NOT guaranteed to yield product details, prices, images or commission links. An unsupported provider, access restriction or missing provenance must result in `NEEDS_OWNER_INPUT`, not fabricated facts or bypasses.

## Shared pipeline

`ContentModeRouter → (LearningTopicProvider | ProductSourceAdapter) → ClaimAndScriptValidator → VoiceDirectionPlanner → SpeechProvider → CaptionTimeline → GenericRemotionRenderer → TechnicalQA + EditorialQA → ReviewQueue`

Shared core owns strict versioned records, budget & authorization, immutable provenance, job/attempt identities, voice presets, asset manifests, real audio timing and the absence of publication credentials. Mode-specific plugins only supply factual inputs, templates and mode validation. An offline `ContentMode` tagged union rejects unknown modes and mismatched payloads.

Proposed typed payloads:
- `LearningBrief{mode:'ENGLISH_LEARNING',level,topicId,objective,exampleSentences,templateId}`
- `ProductRequest{mode:'PRODUCT_SHOWCASE',platform:'SHOPEE'|'TIKTOK_SHOP',inputUrl,requestedAngle,claimedHandsOn:boolean}`
- `ProductFacts{productId,platform,canonicalUrl,name,shop,variants[],priceSnapshot?,currency?,stockSnapshot?,descriptionClaims[],attributes[],fieldEvidence[],capturedAt,expiresAt,sourceAccessType,affiliateLink?}`
- `ProductAsset{assetId,mediaKind,sha256,source,rightsBasis,authorizedUseScope,expiresAt?,attribution?,reviewed:boolean}`
- `VoiceDirectionProfile{presetId,locale,voiceName,speechRate,ssmlPauses[],emphasisRanges[],toneNotes,prosodySupportedEvidence,sourceReferenceId?}`
- `ScriptClaim{claimId,text,evidenceIds[],type:'PRODUCT_FACT'|'QUALIFIED_OPINION'|'ILLUSTRATIVE',verified:boolean}`

Every nontrivial product claim requires a specific evidence ID, source, timestamp and freshness rule; never invent discounts, inventory, specifications, performance, experience, star ratings, number sold or product benefits. Price is optional; only show an exact price if fresh and verifiable at render/owner-review time. If product information lacks sufficient evidence, block generation or ask user to supply screenshots/specifications. Never assert 'I tried it', 'I tested it', 'this product will cure...' without verifiable owner evidence. Any actual affiliate promotion must follow applicable platform and local advertising/disclosure requirements.

## Product intake adapters

Official, explicitly authorized APIs are preferred. Verify permitted data scope and owner role independently for each platform before production:
- Shopee: investigate authorized Open Platform/Shopee Affiliate access; account approval cannot be assumed. Public Shopee Affiliate terms restrict automated scraping of product data/media. Do NOT implement headless-browser circumvention, private/unofficial endpoints, captcha bypass, session-cookie export or harvested credentials.
- TikTok Shop: investigate Partner/Affiliate Creator/Seller Open APIs and onboarding/permission scope. TikTok research access is not a general-purpose storefront API. Creator, seller and partner authorization are not interchangeable.
- A `MANUAL_PROVIDED_EVIDENCE` adapter accepts owner-provided licensed images/screenshots, product name, specs, seller link and optional current price with evidence; flag manual provenance and require review.
- URL intake is untrusted. Reject unsupported domains/schemes, URL shortener loops and private/network-local targets; normalize to explicit allowlisted platform URLs with constrained redirects and timeouts. Never allow the URL to select a request endpoint, execute JS or access local files. Scraped/embedded page scripts are not trusted instructions.

Before publishing commercial product content, confirm media rights, claim substantiation, owner review, affiliate disclosure where applicable and product/price freshness. Product-showcase mode has NO auto-publishing.

## Voice and editing direction, reference video

Owner provided a reference MP4; measured file is ~111.826s, 576×1024, 30fps H.264 video with AAC stereo 44.1kHz; visual sample shows filmed laptop/software demonstrations with an outlined headline and rapid highlighted subtitles. Do not infer that the voice is available to license, identify its speaker or clone/copy a recognizable person's timbre. Focus on transferable qualities: short spoken sentences, immediate hook, natural pauses, clear emphasis on benefits, variable cadence, audible punctuation, highlighted action words and scene changes synchronized to speech.

Profiles:
- `learning-clear`: concise warm Vietnamese lead, slower English examples with `en-US-AndrewNeural`, deliberate time to read the example.
- `review-energetic`: engaging but credible Vietnamese narration, fast hook then moderate measured explanation, controlled pauses at feature/price/CTA, no hype beyond evidence.
- `neutral-fallback`: existing `vi-VN-NamMinhNeural` and Andrew unchanged.

Azure `vi-VN-NamMinhNeural` and `vi-VN-HoaiMyNeural` standard voices are documented but the current voice support list does NOT enumerate expressive speaking styles for them; never assume `mstts:express-as style='cheerful'` is supported. First evaluate script writing, punctuation, safe SSML breaks and prosody within supported constraints; verify API capability and real speech subjectively before claiming expressive voice. Alternative paid voice providers or new voice tiers require separate license, privacy, pricing and owner approval. Never clone the example narrator without their explicit rights/consent. Speaker preference is a configurable profile, not hardcoded globally.

Audio acceptance requires side-by-side blind owner listening against Video 05 and the reference's broad delivery characteristics (not same identity). Score 1–5 on hook impact, natural Vietnamese, pronunciation, emotional variation, intonation, transitions, pacing and ad credibility. Technical waveform/LUFS checks alone cannot declare a voice engaging.

## Editorial experimentation

After 2 prior videos showed 2.8s/6.5s average watch and first-second drop-off (owner-supplied TikTok Studio evidence), default English content to hook visible at frame 0, useful result in first ~2–5 seconds, one teaching point and 20–35 seconds. These are experimental targets, not guaranteed platform thresholds. Support optional 6-scene historical format separately; do not overwrite old videos.

Product showcases should present 1 tangible use case + 2–3 sourced differentiators + any documented limitation + CTA. Do not rely on fake stock footage implying personal testing. Manual review is mandatory for price/claims/disclosures.

## Scope sequencing and acceptance

Gate 1: implement ONLY offline typed mode contracts, two deterministic mode fixtures (including Shopee/TikTok platform enum), product source and rights evidence validator, voice direction presets/planner with NO live synthesis, generic input-driven render and regressions. Produce one clearly marked synthetic short sample per mode if deterministic offline render is available. Do not read a live product URL or change Gate 0 spending/security restrictions.

Gate 2–4: retain the original durable security, paid pilot and English scheduling gates. Add a small voice audition as a separately approved paid subgate (budget and number of requests set later), with no surprise speaker/model/provider change. Product mode remains manual/offline until access approval.

Gate 5 (NEW): product-intake feasibility: official API/account authorization and media rights audit, domain allowlists, Shopee and TikTok Shop adapter tests with approved fixtures, manual fallback, timestamped field-level evidence, intake failure behavior, no unsupported scraping. An official API that cannot be authorized remains NOT SUPPORTED; no mock-as-live claims.

Gate 6 (NEW): one owner-approved real product-video pilot, claims/legal/voice/rights review, retained evidence/media and cost accounting; production enabling separately approved. No silent changes to English scheduled policy; no shared spend without explicit split/allocation.

Do not modify scripts/artifacts of historical Videos 01–05, original PR #1–#9, default branch, scheduled production or credentials. Gate 0 remains design only; do not begin Gate 1 or Gates 5–6 as part of this addendum.
