# Production ledger recovery — 2026-10-29

Production status: NOT IMPLEMENTED / NO-GO. Existing isolated test-* Git ledger has mock recovery coverage; its refs are not production authority.

1. Stop the executor and prevent new dispatch. Preserve locks, journal, independent checkpoints, manifests, WAVs, receipts and quarantined responses. Do not delete/reset state or initialize a replacement journal.
2. Record the exact code/build/authorization identity and last acknowledged reservation and DISPATCHING events. A crash after DISPATCHING is potentially billed even when no response exists.
3. Verify retained checkpoint hashes and Git ancestry/hash-chain prefix against an independently held checkpoint. Missing, rewound, replaced or corrupt storage blocks recovery. Keep the outstanding reservation as possible liability.
4. Verify immutable backup manifest using its independently retained hash, then every file hash. Restore only to a new clean destination. A manifest cannot authorize its own replacement. Same physical disk directories do not establish independent retention.
5. Reconcile genuine provider usage/billing and any retained response for each stable attempt identity. Never infer NOT_SENT from timeout or reset run IDs. Append evidence-backed settlement through a separately reviewed production reconciliation adapter; none is enabled here.
6. Resume only after ambiguity, authorization, billing and storage prerequisites are independently resolved. No automatic retry or provider fallback. Never regenerate verified cached speech.

Mock tests exercise crashes, concurrency, rollback, corruption, unavailable storage, immutable retention and exact receipt reuse. They do not prove Windows power-loss behavior, real USB durability, Windows ACL confidentiality or production authority. Existing F: restore evidence reported by the owner has not been re-executed in this cloud session.
