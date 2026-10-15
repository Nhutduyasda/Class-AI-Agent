# Azure paid Nam Minh voice — Video 02 setup

Status: PREPARED, NOT PURCHASED. Dry-run only until operator establishes paid S0 in Azure Portal and deliberately starts the two paid calls.

## First configure your OWN Azure account

1. Sign in to https://portal.azure.com and ensure you have an Azure subscription with billing enabled.
2. Search for Azure AI Speech / Speech service and choose Create. Choose a dedicated resource group for English Journey.
3. Select Region = Southeast Asia; region code southeastasia; Pricing tier = Standard S0 (paid), NOT Free F0. Pick a unique resource name and Review + Create. Verify you are creating only one Speech service resource.
4. Open that Speech resource > Keys and Endpoint. Never post KEY1, KEY2 or card numbers in ChatGPT, GitHub, screenshots or pull requests. Obtain the region and key only in a trusted execution environment.
5. Optional cost alerts in Azure Cost Management > Budgets (portal minimums apply). Budget alerts do NOT automatically stop service spending.
6. Check Microsoft Product Terms for commercial use of the paid tier's prebuilt neural voice outputs.

## Run two approved samples ONLY

From projects/english-journey-video with Node 22+:

    npm run azure:marketing02:estimate
    npm run test:azure:marketing02

These are offline and NEVER call Azure. They validate exact approved HOOK (82 chars) and DEMO (188 chars). Estimated request total: 270 chars * USD 15/million = USD 0.00405 before taxes, FX and any service markup. Only a reference; the real Azure bill may differ.

For Windows PowerShell, securely place key in temporary process environment without pasting it into a message or file:

    $env:SPEECH_REGION = 'southeastasia'
    $env:SPEECH_KEY = Read-Host 'Speech KEY1 (do not share)'
    npm run azure:marketing02:samples
    Remove-Item Env:SPEECH_KEY

The samples command requires both --execute and --confirm-standard-s0 internally, and writes only:
- out/marketing02/azure-namminh-auditions/A-HOOK-NamMinh-S0.wav
- out/marketing02/azure-namminh-auditions/B-DEMO-NamMinh-S0.wav

It uses vi-VN-NamMinhNeural, default speed/pitch (matching +0%), and 48 kHz mono 16-bit WAV. At most one request per missing file, no automatic retries; validates audio header; logs source hash and output hashes without printing keys. A failed/aborted Azure request might still be charged; inspect output and billing before any retry.

IMPORTANT: The USD 0.05 threshold in code checks ONLY the two planned textual requests at the quoted rate, not your Azure account or unforeseen cloud charges. Do not grant automated broad Azure resource management permissions.

## After samples

Stop. Send owner the two WAV samples and genuine Video 01 Nam Minh excerpt for direct listening. Only after owner approves, rerender a distinct Video 02 V1.2 using paid Azure Nam Minh, rebuild actual voice-driven timing, music mixing and subtitle cues. Keep approved copy, Video 01 and the existing Piper cut unchanged. No TikTok posting or merge.

Official references:
https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech
https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions
https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzure/allprograms
