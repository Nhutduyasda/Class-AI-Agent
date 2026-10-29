# Work-only cloud boundary — independent source review

Date: 2026-10-29. Reviewer: separate Work review agent, not the implementation agent. Scope: new `scripts/auto-factory/cloud/` source and targeted credential-free regressions. This is an independent code review, NOT owner authorization, external identity verification, provider-account acceptance or a production security certification.

Decision: source preparation reviewed; production remains **NO-GO**. No actual credential was accessed, no Azure request was sent, and no hosted runner/private remote store was exercised by this review.

## Findings resolved in the reviewed delta

- The initial journal accepted a rollback of BOTH current journal and checkpoint to mutually consistent genesis bytes. The reviewer reproduced revision2 becoming accepted revision0 using ordinary conditional replacements, without ref force-push. Current code traverses per-file immutable Git history from externally pinned roots, validates append-only journal prefixes and monotonic checkpoints, and rejects this fast-forward content restoration.
- Checkpoint hashes alone could not restore a lost primary journal. Current code retains full immutable journal snapshots in the independent store before checkpoint acknowledgement and provides hash-pinned recovery export; this does not silently create new spending authority.
- The credential boundary initially accepted arbitrary SSML with a self-consistent hash and a declared allowed voice. Current speech transport validates the exact12-entry ID/hash/voice/language allowlist before credential lookup. Records and array are frozen. A corrected regression uses raw SSML SHA256, not the canonical-JSON helper.
- The original Contents reader would reject valid receipts larger than1MB. Current adapter retrieves their Git blob by expected SHA and verifies blob content hash. GitHub's official Contents documentation describes the >1MB encoding limitation: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28 .
- A hung credential supplier could hold the coordinator indefinitely. Current parent uses a bounded lookup, handles late-returned buffers, and clears credential buffers on failure. Broker key/temporary buffer cleanup occurs in finally paths.
- A generic protected=true flag is no longer sufficient: current adapter also requires no force-push, no deletion, and admin enforcement. This is still not evidence that actual production repositories meet those requirements.

## Independent checks executed

Node24.19.0 on Linux. Focused delta regressions: **7/7 PASS**: dual rollback; unauthorized self-consistent SSML; hung supplier; swapped voice/ID; oversized secret buffer wiping; >1MB verified blob; insufficient branch protection. Test log: `work-only-evidence/independent-review.log`. These are isolated in-memory/fake-HTTP contract tests and a credential-free child-process failure test, not hosted/private-storage or provider acceptance.

## Remaining activation requirements

- A separately controlled trusted host bootstrap must authenticate and pin external owner/reviewer keys, grant, production store identities/genesis roots, system clock and the concrete provider adapter. The exported coordinator's injected ports/clock are test seams; they cannot be accepted as caller-controlled production authority.
- The raw speech broker restricts content but does not itself prove signed dispatch or one-attempt accounting. The trusted host must release its key only through the reviewed coordinator after durable reservation/DISPATCHING acknowledgements. No bootstrap satisfying that requirement is configured or accepted here.
- Hashing writable source after module load is not immutable execution. Require verified-before-load read-only code/dependencies/runtime and a reviewed OS credential-isolation mechanism. A child process using the same UID and inherited filesystem access is not an OS sandbox or least-privilege proof.
- Actual private store access, constrained writers, independent administrative/failure domains, durable recovery and provider quota/retention limits remain unverified. Two writable repositories on one provider are not, by themselves, proof of an independent failure domain.
- Actual Azure subscription/resource binding, supported secure credential connection, account balance/liabilities, current tax-inclusive prices, voice availability and genuine owner/reviewer authentication remain unverified. Signatures over fixture evidence hashes do not supply those facts.

No new substantive flaw was demonstrated in the reviewed delta's deterministic journal/broker contract paths under the documented trusted-host assumptions. This conclusion does not relax any remaining production blocker, authorize Azure, or mark Gate3/Video06 production PASS. Owner listening/creative review cannot occur until authentic media exists.

## Reviewed source identity

The following digests bind this review to exact file bytes; any credential-bearing/source/dependency change requires affected review and tests again.

```json
[
  {
    "path": "scripts/auto-factory/cloud/broker.ts",
    "sha256": "ea442e75e44012179019933eaa61a37f07e3853a728c5e84f0c1c80b13092896"
  },
  {
    "path": "scripts/auto-factory/cloud/build.ts",
    "sha256": "ddf92e860d5ef783f7836e9b6665008e81be1185c1c5a64a4d3dcb53b5515081"
  },
  {
    "path": "scripts/auto-factory/cloud/cloud.test.ts",
    "sha256": "6225f4dae45d23f6d5371845bd28e1837a12f28cf1e4674935d4e5f7a97c14cb"
  },
  {
    "path": "scripts/auto-factory/cloud/contracts.ts",
    "sha256": "64e19e0d0da3428526a1483f4b3a9cc7db7c908e4cfe053985a9b822f9a387f5"
  },
  {
    "path": "scripts/auto-factory/cloud/executor.ts",
    "sha256": "36a7779c194192860b4383f67fd61658095aeff79557d94643b586d77e443f68"
  },
  {
    "path": "scripts/auto-factory/cloud/isolated-speech.ts",
    "sha256": "984a82e1e69105e66743083c2d3384618eea590f5b48e17a30e1182908492a45"
  },
  {
    "path": "scripts/auto-factory/cloud/ledger.ts",
    "sha256": "53a8ed444874c85044b35fcc20295892d5489bd510c68393364467fb5b0fe28c"
  },
  {
    "path": "scripts/auto-factory/cloud/request-allowlist.ts",
    "sha256": "20ba09d3fe3b2f8e0e63eba572341b45346c58c3e557d724dbe3859f17f0fcef"
  },
  {
    "path": "scripts/auto-factory/cloud/speech.ts",
    "sha256": "48face5f00355155e2d4d871af5310e05f01729d3b82d085491378a45afc3307"
  },
  {
    "path": "scripts/auto-factory/cloud/store.ts",
    "sha256": "48d6811428c4678e0d3952b8c5cf5e63a3948a472ef2fbc8554e144369271c61"
  }
]
```
