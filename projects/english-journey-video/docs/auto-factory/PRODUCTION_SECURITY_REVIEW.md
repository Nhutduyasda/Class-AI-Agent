# Production security review — 2026-10-29

Decision: NO-GO. This is an implementation self-review, NOT independent security acceptance.

The new Git launcher uses Git-native NUL on Windows and /dev/null elsewhere. Both the ledger and checkout verifier share the same selector. Ledger subprocesses explicitly disable hooks; global/system configuration, inherited configuration injection, prompts and network protocols remain isolated. A real Git regression initializes/reads an isolated bare journal while an inherited malformed config and a failing local pre-push hook are present. Platform mapping is unit-tested; only Linux execution has occurred in this session.

The external instruction authorizes bounded implementation and conditionally authorizes V2 neutral6/dynamic6 with one attempt each, Azure USD0.03 / aggregate USD0.08. It does not establish independent executable review, current account liability, storage protection or a valid production signing/approval mechanism. Historical docs saying no pilot permission describe their earlier task and are superseded only within this instruction's conditional scope.

The script byte hash matches 04033938eb32dd5d2f72113863b89b87a8dac8fc4cbc3a694ba43c921abd5afc. The plan's canonical payload hash (excluding planSha256) is 8487406dca081a9ae91fe0bd9e1fe8602fe32f06e1b784edd3bc7b1a50a19b83; file bytes hash to 6836db73d76ba69f18c9bcac8ea725abef1f6eb3c0bd9e5b0553886c7cb045e8. The instruction labels the former a file hash. No source content was changed and no paid authority was inferred from this mismatch. A future execution record must identify both representations explicitly.

Real transport remains absent/disabled. No Credential Manager/DPAPI broker or production journal adapter is implemented or certified by this closeout. The existing adapter rejects production refs and real execution. A Windows-only credential implementation cannot receive runtime/security acceptance on this Linux host. No provider key was accessed. Do not inject one into the mock CLI or historical launchers to bypass this boundary.

Independent review must cover a future minimal fixed credential-bearing executable, OS identity/secret permissions, fixed resource/region/voices, external authenticated authorization with expiry and code/build/request hashes, sequential one-attempt dispatch, durable ledger/independent checkpoint, secret-redacted failure paths and provider response/receipt retention. Do not count this self-review as that acceptance. No production trust manifest is issued for the modified code.
