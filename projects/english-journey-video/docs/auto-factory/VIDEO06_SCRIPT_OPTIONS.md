# Video06 — owner script options (neither approved)

Recommendation: V2 for the proposed visual experiment. Its mistake/correction pair communicates the problem before narration finishes; this is an editorial hypothesis, not measured retention. V1 remains byte-identical for comparison. Both are illustrative A1 examples, not an actual learner quote. VOICE_ONLY / minh-main; no face asset is needed.

| Aspect | V1 | V2 |
|---|---|---|
| Frame zero | Nói mình đói thế nào? | I hungry ❌ |
| Correction | Next example scene; exact frame unknown | I am hungry ✓ at proposed frame15 (0.5s), retained thereafter |
| Hook | Translation warning/question | Missing-one-word error/correction |
| Explanation | Longer wording preserved for comparison | Scoped to this exact sentence; no universal adjective rule |
| English errors | Practice options visual-only | Hook error and practice error visual-only |
| Timing | 20–35s target, not audio-measured | Same target; proposed1.5s practice hold, unverified |

V2 intentionally speaks “Trong câu này, cần thêm từ được tô sáng, ngay sau chủ ngữ.” instead of inserting English tokens into Vietnamese narration. The visual explanation still explicitly shows “sau I cần có am trước hungry” and highlights am. Correct English sentences alone use Andrew; wrong options are never sent for synthesis. Neither claim guarantees learning or viewer retention.

## V1

| Beat | Exact canonical speech | Voice |
|---|---|---|
| hook | Muốn nói mình đói? Đừng dịch từng chữ từ tiếng Việt. | Nam Minh |
| example | I am hungry. | Andrew |
| explain | Câu này nghĩa là: Tôi đói. Khi nói mình đang đói, nhớ có động từ trước tính từ. | Nam Minh |
| practice | Thử nhé: muốn nói tôi mệt, bạn chọn câu nào? | Nam Minh |
| answer | I am tired. | Andrew |
| close | Đáp án B. Giờ thử nói lại cả câu nhé. | Nam Minh |

Full storyboard/language spans/request SSML: `briefs/auto-factory/video06-v1-readiness.json`.

| Identity | SHA-256 |
|---|---|
| scriptFileSha256 | `79926b5736c3e2f1317205ff127e3b29547f35a2885bc7332675fec524b77d86` |
| canonicalScriptSha256 | `58d5903df88578545b5fa27ec5ecd52563866e31e48a144042c67d301e8359d6` |
| canonicalSpeechSha256 | `eece36372b1aa318eb1320f4d441bfb94fa9bfc5d59e2dd3b12f874de4975645` |
| planSha256 | `61a4625fcef334ae6f314155105df4cd53bf56e5f740afd7dfefec049d3fc8a6` |
| planFileSha256 | `f6b064b993bb5860542360f02e44ff8e82a805a177a3ea346e4aca6300fd37e3` |

## V2

| Beat | Exact canonical speech | Voice |
|---|---|---|
| hook | Câu này sai vì thiếu đúng một từ! | Nam Minh |
| example | I am hungry. | Andrew |
| explain | Trong câu này, cần thêm từ được tô sáng, ngay sau chủ ngữ. | Nam Minh |
| practice | Giờ thử nhé: muốn nói tôi mệt, bạn chọn câu nào? | Nam Minh |
| answer | I am tired. | Andrew |
| close | Chọn B. Thử nói lại câu đúng nhé! | Nam Minh |

Full storyboard/language spans/request SSML: `briefs/auto-factory/video06-v2-readiness.json`.

| Identity | SHA-256 |
|---|---|
| scriptFileSha256 | `04033938eb32dd5d2f72113863b89b87a8dac8fc4cbc3a694ba43c921abd5afc` |
| canonicalScriptSha256 | `01ff54a573fd28ba3909557bd34049cd4878f9a0e5470be3fa0a8c36faa7c440` |
| canonicalSpeechSha256 | `add63b4b00f0305ee658445820e625975bce21c9519471a44fd36946a7b7da56` |
| planSha256 | `8487406dca081a9ae91fe0bd9e1fe8602fe32f06e1b784edd3bc7b1a50a19b83` |
| planFileSha256 | `6836db73d76ba69f18c9bcac8ea725abef1f6eb3c0bd9e5b0553886c7cb045e8` |

## Audition costs — proposals only

| Candidate / voice direction | Requests | Conservative billable characters | Reference USD |
|---|---:|---:|---:|
| V1 / neutral | 6 | 535 | 0.008025 |
| V1 / dynamic | 6 | 538 | 0.008070 |
| V1 A+B total | 12 | 1073 | 0.016095 |
| V2 / neutral | 6 | 495 | 0.007425 |
| V2 / dynamic | 6 | 498 | 0.007470 |
| V2 A+B total | 12 | 993 | 0.014895 |
| Both candidates, all four auditions | 24 | 2066 | 0.030990 |

Reference only: existing public USD15/million snapshot; account price/tax/outstanding charges unverified. No fresh account pricing was obtained. Evidence expiry stays2026-10-22 00:00UTC (07:00 Vietnam); refresh before any future execution. All four auditions already exceed the proposed Azure USD0.03 ceiling before tax. Selecting one script does not authorize its A/B requests. Selected WAVs may later be reused without production re-synthesis; any new request requires separately bounded approval. No LLM/avatar/hosting service is proposed. Aggregate per-video ceiling USD0.08 and reserve USD2 remain policy, not invoice guarantees.

## Caption / reveal / review plan

At frame0 V2 shows an illustrative wrong sentence with a cross; do not put that wrong text in spoken captions. Reveal the full correct sentence at proposed frame15 and highlight am without pretending to have word alignment. Keep it visible through Andrew’s example and the Vietnamese explanation. Practice shows A/B with neither choice marked, then wait for the proposed1.5s hold after the complete Vietnamese question. The answer scene reveals B with its correct English narration. Compute every speech/scene/caption boundary from verified WAV samples later; the current P1 renderer does not consume this new storyboard, so no V2 render or measured timing PASS is claimed. Avoid an added global pause that would double-count the provider trailing break and import gap.

Creative-review checklist is embedded in both readiness plans. Owner checks frame-zero legibility, explanation scope, visual-only errors, enough practice time, caption safe areas, natural Vietnamese, English pronunciation, pauses and useful payoff. Actual duration and emotional/creative quality remain UNVERIFIED.
