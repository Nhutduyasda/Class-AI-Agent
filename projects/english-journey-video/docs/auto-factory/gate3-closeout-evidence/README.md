# Closeout evidence

All provider requests here are mock-only. No credentials, invoices or authentic WAVs are included. Synthetic accounting is not provider billing. core-tests.log used Node24.19.0; other prior/build/render/browser commands generally used Node24.22.1. Tools: Git2.51.1, FFmpeg6.1.1, Chromium157.0.8080.0 (existing pinned archive hash verified by setup-browser.mjs). No production build manifest or Windows proof is issued.

Core command (from projects/english-journey-video):

```sh
node --test scripts/auto-factory/local/*.test.ts scripts/auto-factory/control/control.test.ts scripts/auto-factory/engine.test.ts scripts/auto-factory/hardening.test.ts scripts/auto-factory/pilot/readiness.test.mjs scripts/auto-factory/pilot/pilot.test.ts scripts/bilingual/bilingual.test.mjs
node scripts/auto-factory/local/evidence.ts
```

For the first command and mock evidence, node was the process-local npm-installed24.19.0 executable, not host24.22.1. Tests use a fixed historical mock clock and price fixtures; this never extends real authorization or price validity. First12/resume0 is retained in summary.json, with journal/checkpoint hashes. codeSha values inside those files identify disposable clean mock fixture commits, not the production PR identity.

Fresh fixture setup before dependent tests:

```sh
node scripts/marketing03/setup-browser.mjs --install
# Point the project's local Remotion browser-cache path at the verified existing installation.
node scripts/auto-factory/run.ts
node scripts/auto-factory/remotion.ts
node scripts/auto-factory/pilot/render-v2.ts
node --test scripts/auto-factory/render.test.ts scripts/auto-factory/remotion.test.ts scripts/auto-factory/pilot/v2.test.ts
node --test scripts/auto-factory/hardening.test.ts
npm run typecheck
node node_modules/typescript/bin/tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --esModuleInterop --skipLibCheck scripts/auto-factory/local/*.ts
```

Dashboard (from dashboard): npm ci --ignore-scripts --no-audit --no-fund, npm test, npm run build, npm run test:browser. Browser runner starts loopback-only test servers and shuts them down. Browser log reports desktop/mobile flow outcomes, not a numeric unit-test count. Three actual fixture videos and V2 synthetic render were fully decoded; none are genuine production speech. Full exported media remains ignored local test output, not private production evidence.

Initial combined run:170/172; subsequent hardening18/18 resolves its browser setup failure. Prior93-test group retains2 expired-price failures; historical discovery retains4 missing-media failures. Do not sum overlapping groups. Full historical success was not achieved. No dates, receipts or original historical assets were fabricated.
