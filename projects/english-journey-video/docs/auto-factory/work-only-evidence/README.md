# Work-only evidence, 2026-10-29

These files contain no real provider credentials or account identifiers. No actual Azure synthesis occurred.

- cloud-tests.log:30/30 new cloud tests, Node24.19.0/Linux. State ports are in-memory; HTTP is fake. This is NOT hosted/private-storage acceptance.
- regressions.log:109/109 existing Gate1/2/local/Git-isolation/security tests, real local Git transaction/crash tests on Linux; no Windows claim.
- independent-review.log:7/7 independently executed focused regressions (overlap with cloud30), bound source hashes in WORK_ONLY_INDEPENDENT_REVIEW.md.
- cloud-mock-summary.json:12 first-run fake requests,0 resumed,12 verified cached receipts,36 events. Fixture quotes/keys/evidence/signatures are explicitly synthetic, not current prices, approved owner identities or genuine WAVs.
- account-observations.json:sanitized read-only portal/GitHub observations. Original account/billing IDs, personal identifiers and financial documents are not committed. Browser account access is not an approved API secret channel.
- project-typecheck.log and cloud-typecheck.log:empty output with exit0 denotes compiler success, not omitted tests.

Executed from projects/english-journey-video using a process-local Node24.19.0 executable:

```sh
node --test scripts/auto-factory/cloud/cloud.test.ts
node --test scripts/auto-factory/local/*.test.ts scripts/auto-factory/control/control.test.ts scripts/auto-factory/engine.test.ts scripts/auto-factory/hardening.test.ts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --esModuleInterop --skipLibCheck scripts/auto-factory/cloud/*.ts
```

Git2.51.1 and FFmpeg6.1.1 remain existing local fixture tools; no reinstall, global PATH change, CI run, cloud provisioning or schedule. The previously verified browser archive was reused for existing hardening tests. Unchanged renderer/dashboard suites were not broadly repeated; their earlier baseline remains identified separately. No historical media or expired price evidence was manufactured.

Published implementation4d5a1e813c659bd7545b084d13e8d91a5dbf53f1 matches the tested complete Git tree23f94bebc9ca0d6f3833d2a85ad20b7ade192c6b. This is not a signed production execution image or host acceptance.
