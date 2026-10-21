# Ledger recovery — Gate 2 offline adapter

The production engine remains unchanged. Control code lives in src/auto-factory/control. Gate 2's Git transport accepts a local bare repository and refs/heads/test-* only; HTTPS/SSH/production refs are rejected. There is no production factory-ledger branch. Every test uses a newly created temporary repository. No application Git history is rewritten to test recovery.

## Authority and persistence

The remote bare Git ref is the shared transaction authority. A ledger.json snapshot contains an immutable policy plus versioned events. Each event has a stable production ID in its payload, a unique event ID, expected sequential revision, previous event hash, canonical SHA-256 and timestamp. Attempt IDs derive from policy hash + production ID + request ID, independent of workflow run ID. Plan, content hash, policy hash, code SHA, request IDs and request ceilings cannot change during a rerun. Each service shares the same production allocation.

The writer fetches and validates the authoritative journal, replays deterministic transitions and checks its independently retained high-water anchor. It writes a new blob/tree/commit with the observed head as parent, then performs a non-force Git push. Two sibling commits cannot both advance the same ref: one succeeds; the other must stop and reload. No paid simulation is dispatched on a conflict or uncertain acknowledgement. After push, the writer fetches again, checks the exact event prefix and confirms its accepted commit is an ancestor of the readback head. A later legitimate append does not invalidate an earlier acknowledged transaction.

Scheduled reservations and dispatch must occur on the plan's actual Asia/Ho_Chi_Minh local date. A backdated/future scheduled plan cannot create a catch-up burst; crossing midnight before dispatch blocks it. ON_DEMAND product approvals do not claim or inherit scheduled English slots.

A separately retained per-writer checkpoint pins commit SHA, revision, event hash and policy hash. Successful reads also advance that checkpoint, not only writes. Its update uses an exclusive lock, unique temporary file, file sync, rename and readback. Concurrent/stale checkpoint writes fail closed. Missing checkpoint is not silently reconstructed from the remote. A fresh runner needs the retained checkpoint; losing both the authoritative history and all trusted anchors cannot be repaired by an application assertion.

This is logical append-only behavior enforced by this adapter. An administrator can still destroy a bare repository or a future GitHub branch; local tests do not establish remote protection. Git storage/filesystem durability beyond acknowledged writes and recovery from actual hardware power loss are not certified. The hosted store, protections and independent anchor retention remain unconfigured.

## Lifecycle and interruption handling

PLANNED → VALIDATED → AUTHORIZED establishes an immutable approved plan. Per-request work then follows RESERVED → DISPATCHING → VERIFIED. Explicit alternatives are FAILED_BEFORE_DISPATCH, AMBIGUOUS_PAID, RECONCILIATION_REQUIRED and BLOCKED. The shared renderer's old offline states are separate; these are request/budget authority states, not permission to publish.

| Interruption | Durable evidence | Recovery behavior |
|---|---|---|
| Before reservation | No attempt exists | Reuse the same approved production/request IDs; no paid attempt occurred. |
| After reservation / before dispatch | RESERVED exists | Do not automatically send on restart. Record RECONCILIATION_REQUIRED; retain the reservation. |
| After dispatch marker, before transport | DISPATCHING exists | Conservatively uncertain; never automatically send again. |
| Timeout / missing receipt / crash after response | DISPATCHING or AMBIGUOUS_PAID | Global paid latch blocks additional dispatches; preserve reserved exposure. |
| Commit accepted but acknowledgement lost | The remote may contain the event | No outbound mock until readback succeeds. Restart reads history and blocks any uncertain attempt. |
| VERIFIED | Artifact/receipt hashes and mock billing evidence | Return cached verification with no new provider call, including after a new workflow run ID. |
| Storage unavailable, hash mismatch, missing ref or rewind | Authority cannot be established | Stop. Never seed a new zero-spend journal. |

Offline preparation may resume PLANNED/VALIDATED without creating a second plan. Offline render retries can use existing verified media through the Gate 1B credential-free renderer; they never cause a new provider request here.

## Reconciliation

Reconciliation is an explicit append-only owner decision with approval ID, evidence SHA and confirmed amount. It does not edit earlier attempts or make their IDs reusable. CONFIRMED_CHARGE records liability and leaves that production blocked. PROVEN_NOT_SENT can release only an attempt with no durable dispatch marker and a zero charge. Once a dispatch marker exists, absence of a provider receipt is not evidence that nothing was sent or billed.

These owner IDs and billing receipts are MOCK simulation attestations, not signed real authorizations or provider invoices. A future production implementation must obtain them from an independently protected owner-controlled authority. The policy and readback mechanisms alone do not establish the identity of a human approver.

Keep raw received media quarantined outside credential logs; retain its hash and evidence linkage. Do not release uncertain money based on an HTTP error, rerun button or manually deleted lock. If a confirmed amount exceeds its quote, record the full amount and stop further spending when per-video or aggregate limits fail. An application guard cannot undo a provider bill.

## Operational repair order

1. Disable future production authority; no active production workflow exists in Gate 2.
2. Preserve remote objects, journal, all independently retained checkpoints and diagnostics.
3. Identify the last accepted commit/event and compare ancestry and chain prefixes.
4. Restore a missing checkpoint only from an already trusted owner-held copy. Never accept a new baseline solely because its JSON hashes are internally consistent.
5. Append evidence-backed reconciliation or keep the system blocked. Do not retry or regenerate the uncertain request automatically.
6. Verify replay, balances and no-retry behavior before any later separately authorized pilot.

Stale checkpoint locks require verifying that the original writer is dead and preserving the checkpoint before removal; they are never cleared automatically. No repair command in Gate 2 changes hosted refs or protections.
