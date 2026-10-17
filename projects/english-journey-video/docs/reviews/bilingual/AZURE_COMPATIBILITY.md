# Azure compatibility — 17 October 2026

## Confirmed from official sources / public catalogue

- Microsoft documents multiple `<voice>` elements, including different languages, within one SSML document: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice . Default strategy: one compact multi-voice request per scene.
- Exact voice `en-US-AndrewNeural` is listed as a standard male en-US voice (not Andrew HD, Multilingual or MultiTalker): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts . Existing `vi-VN-NamMinhNeural` remains the main voice.
- Southeast Asia real-time endpoint and authenticated regional voice enumeration are documented: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech . Implementation uses regional HTTPS REST, explicit voice names and fixed RIFF PCM output.
- Billing includes optional SSML markup except speak/voice tags, spaces and punctuation; Han counts double: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech#pricing-note . Phoneme pronunciation metadata is therefore included in estimates.
- Public retail GET returned USD 15 / 1M characters for Southeast Asia, meter `S1 Neural Text To Speech Characters`, meter ID `0f98e708-a16c-407b-8089-a0ed9e14ab49`. Evidence in `config/bilingual-neural-price.json`; public source https://prices.azure.com/api/retail/prices ; query `armRegionName eq 'southeastasia' and contains(productName, 'Speech')`. No subscription/key was used for this query. Public meter S1 label does not verify the owner's resource SKU/contract. No Azure resource/subscription was created.

## Not yet verified live

Authenticated voice-list check against the owner's key: **PENDING**. No key was requested during this offline upgrade. The secure Windows launcher can perform this GET without TTS. A successful regional GET using the owner-entered key verifies voice availability for that key/region; it does not independently prove the Azure ARM resource name. The owner must enter the key of the specified existing resource.

One real mixed Nam Minh/Andrew SSML response, exact boundary pauses and isolated article phonemes: **BLOCKED — new synthesis cost not authorized**. Documented syntax and offline XML/unit checks are not an acoustic compatibility certification. In particular, no pronunciation sample or naturalness score has been fabricated.

Multi-voice preferred path is implemented. Split WAV strategy is also implemented/plannable, but is not an automatic retry after a failed multi-voice request. It requires a new cost plan and explicit permission, preserving the failed ledger.

## Proposed single sample — approval not granted

Plan: `sample-plan.json`; SSML: `sample.ssml`; disabled policy template: `sample-authorization.NOT-APPROVED.json`.

- One request, containing all four required English examples plus the Vietnamese introduction/context.
- 184 canonical Unicode code points; 225 billable-envelope characters including 41 optional phoneme-markup characters.
- USD 0.003375 estimate at the verified public retail rate; proposed authorization cap USD 0.005 before tax/fees, exactly **1 request**, **no retry**.
- Before synthesis: fresh authenticated catalogue check must find both exact voices, price/policy/hash checks must pass, and the owner must grant this new cost explicitly. Video 03/04 budgets are rejected.
- If the sample fails or its status is ambiguous: stop; never call the split strategy with this approval.

Upgrade-session real TTS submissions: **0**. New TTS charge incurred by this task: **0**. Voice quality and complete mixed-language timing remain untested live.
