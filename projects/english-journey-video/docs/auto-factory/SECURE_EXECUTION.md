# Secure execution boundary — Gate 2

## Implemented boundary

Only OFFLINE_SIMULATION_ONLY policies are accepted. The executor uses module-created, frozen mock adapters for MOCK_LLM and MOCK_AZURE_SPEECH; an arbitrary object exposing the same kind/send shape is rejected. Adapter identity is checked before even reading untrusted properties/getters. These APIs accept parsed JSON data, not arbitrary JavaScript as a sandbox. REAL_PROVIDER_DISABLED always rejects. No Azure/LLM HTTP transport, SDK client, credential loader or external marketplace fetch exists in this layer. Mock calls accept only attempt ID and input SHA, never raw marketplace content, script-generated commands, arbitrary endpoints or executable refs. Input records use strict schemas and exact plan/policy/code hashes.

Fake canary credentials are in-memory test values only. Transport errors and malformed receipts become allowlisted diagnostic codes; raw exceptions, request bodies and canary values are not included in journal events, receipts or diagnostics. Git child environments contain only process-launch prerequisites and explicit Git configuration that disables global/system configuration and interactive authentication; only the file transport is enabled. These are trusted locally created test repositories, not arbitrary user-supplied Git remotes/hooks. Renderer and product validation modules receive no credentials and are not imported by the control executor.

All adapters are mock-only. Fixture approval IDs and code SHA equality are consistency checks, not cryptographic evidence that GitHub ran the approved code or that a real owner approved a charge. The mock clock is injected for deterministic replay. No hosted credential or trusted clock claim is made.

## Read-only GitHub configuration audit (2026-10-21)

Connected GitHub repository metadata confirms public Nhutduyasda/Class-AI-Agent, default branch main, and admin/push permission for the connection. Permission to administer is not proof that protection is configured. Public REST inspection returned:

| Endpoint / object | Observed result | Consequence |
|---|---|---|
| branches/main | HTTP 200, protected=false; required status checks off | Not a trusted production execution branch. |
| branches/feat%2Fenglish-journey-auto-video-factory | HTTP 200, protected=false | Feature PR code must not receive production credentials. |
| environments | HTTP 200, total_count=0 | No deployment branch restrictions/reviewers can be assumed. |
| rulesets | HTTP 200, empty list | No public ruleset protection observed. |
| branches/main/protection | HTTP 401 without credential access | Detailed authenticated settings not verified; no token was read or requested. |

The GitHub connector also confirmed PR #10 remains Draft, based on feat/english-journey-marketing-video-05. No protection, environment, secret, schedule or ledger branch was created/modified. Exact audit observations are in gate2-evidence/github-configuration.json. Private/administrative policy beyond these visible results remains unverified. HOSTED_PRODUCTION_NO_GO applies even if local tests pass.

## Proposed future Actions architecture — not deployed

There is no example executable workflow in .github in this change. The following design is disabled/non-production documentation only.

| Stage | Allowed authority | Required trust check |
|---|---|---|
| Offline build/test | contents:read, no secrets | Untrusted PR/fork may run only secretless tests; no privileged cache writes. |
| Trusted policy validation | read protected policy/approval | Approved clean immutable commit SHA, matching policy hash, modes, service maxima, price expiry, clock and real opening liabilities. |
| Durable reservation | narrow ledger-ref write capability | Protected journal, independent durable anchor, CAS, exact readback; no arbitrary repository administration. |
| Minimal provider step | one approved service credential | Reviewed immutable executor, bounded data, exact attempt marker and input hash; no installs, renderers, arbitrary code/URLs or raw error logs. |
| Credential-free render | verified media only | File hashes/rights, canonical captions, no provider or ledger-write secret. |
| QA / owner-review queue | artifact/index write only | Correct fixture/production status, human review pending, no publishing credentials. |

Future protected production environments should allow only an owner-approved protected execution branch; the current feature branch and untrusted pull_request_target checkouts must never receive secrets. Dependencies and Actions must be pinned to reviewed lockfile/full immutable Action SHAs. Install/build before injecting credentials; verify exact checkout HEAD and a clean worktree immediately before the minimal credential step. Repository files edited in a PR cannot self-approve their own authorization. The owner-controlled authorization store, protected branch/environment restrictions, no-bypass settings and token scope must be verified against the repository's actual plan/configuration, not assumed from names.

Proposed future secret names are AZURE_SPEECH_KEY and optional LLM_API_KEY after provider/model approval. They would be injected into the narrow service process without arguments, source files, logs, prompts or artifacts; no daily Windows key prompt is required by that design. Gate 2 does not read, create, rotate, test or request those secrets. Provider credentials must not be accessible to Git reservation, rendering, product intake, package lifecycle hooks or generated code. Keep cloud/provider spending controls separate from application limits.

Scheduling remains disabled. Maximum one SCHEDULED English Learning production per Asia/Ho_Chi_Minh date is an accounting invariant, not an active cron. Product Showcase is ON_DEMAND_ONLY and needs its own exact plan approval; it cannot borrow English scheduling authority. A production control-plane workflow would need separate owner approval and verified default-branch behavior. No publication component is proposed here.
