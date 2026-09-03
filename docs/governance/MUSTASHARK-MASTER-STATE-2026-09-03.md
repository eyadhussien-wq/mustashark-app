# MUSTASHARK — MASTER STATE REGISTER

**Status:** CANONICAL CURRENT-STATE REGISTER
**Date:** 2026-09-03
**Authority:** `docs/governance/MUSTASHARK-MASTER-MAP.md`
**Execution branch:** `security/e01-foundation-2026-09-03`
**Target:** one final PR → `main`

## 1. Operating Rule — Single Linear Execution

Mustashark security/product consolidation is now governed by one linear execution path:

`MAIN → security/e01-foundation-2026-09-03 → E01-A → E01-B → E01-C → E01-D → E01-E → FINAL SECURITY GATE → ONE PR → MAIN`

The E01 packages are **logical work packages / sequential commits**, not child branches and not separate PRs.

### Absolute controls

- **One active E01 branch only:** `security/e01-foundation-2026-09-03`
- **No child branches for E01.**
- **No separate PR per E01 package.**
- **No direct edits to `main` during E01.**
- **No force-reset of the E01 branch.** Existing E01 work must be preserved.
- **No production database mutation.**
- **No destructive migration.**
- **No speculative security rewrite.**
- Every package closes only with evidence: code review, tests, typecheck, CI, security gate where applicable, and final main verification.

## 2. Current Git State

### `main`

Current canonical product baseline: `da6a90606176d986b63a03a84d9e3f0348130706`.

The older Capability Inventory baseline recorded elsewhere (`93378a1f72517ab3dedd0eef06499d4d8f4094ce`) is historical and must not be treated as the current `main` head.

### E01 branch

Current E01 branch head: `df6547385f6ea343201ad5cc60cfad66a42df134`.

The branch contains the E01 security foundation work already performed, including recent OAuth concurrency hardening and Security Gate test cleanup.

### Divergence status

The E01 branch was created from an earlier `main` baseline and is currently divergent from current `main`. It is **94 commits ahead and 3 commits behind** relative to the current comparison baseline.

This divergence is a reconciliation task, not permission to erase E01 history.

**Required handling:** reconcile current `main` into the existing E01 branch carefully, preserve E01 work, resolve only real overlapping changes, then continue the E01 sequence on the same branch.

## 3. E01 Security Foundation State

| Package | Status | Rule |
|---|---|---|
| **E01-A — Auth/Authz + IDOR/BOLA** | **CLOSED** | Do not reopen completed discovery unless new evidence requires it. |
| **E01-B — Lawyer Verification** | **READY FOR SECURITY GATE** | Close only after the Security Gate passes and evidence is recorded. |
| **E01-C — Documents/Cases Isolation** | **IMPLEMENTED / PENDING GATE** | Verify object-level authorization, private access, ownership/membership and IDOR/BOLA denial. |
| **E01-D — Terms/Privacy** | **IMPLEMENTED / PENDING GATE** | Verify versioned consent, server enforcement, privacy boundaries and auditability. |
| **E01-E — Final Gate** | **NOT STARTED** | Final typecheck/tests/CI/diff audit/main verification after A-D are closed. |

## 4. E01 Closure Contract

### E01-A — Authentication & Authorization

Required closure evidence is already recorded in the E01 audit chain. The closed package covers route inventory, authentication enforcement, authorization checks, negative authorization, cross-resource isolation, nonexistent-resource non-leakage, isolated test DB use, typecheck, production safety and main protection.

### E01-B — Lawyer Professional Verification

The implementation must maintain:

- practice-card requirement;
- server-derived SHA-256 evidence;
- provider boundary that fails closed;
- lifecycle states: pending / verifying / approved / rejected / exception / expired / suspended / revoked;
- rejection and resubmission;
- stale-session DB-backed entitlement checks;
- atomic verification + account update;
- exception-only admin review;
- audit logging;
- no fabricated JBA/MOJ automation;
- Security Gate evidence before closure.

### E01-C — Documents & Cases

Prove object-level ownership/participant authorization, private storage/access, secure read/download/mutation boundaries, sensitive metadata protection, case ownership/membership separation, hearing membership inheritance, transition authorization and cross-user/cross-tenant IDOR/BOLA denial.

### E01-D — Terms & Privacy

Terms Consent is separate from legal-representation Agreements. Consent is versioned, immutable/auditable and enforced server-side for governed actions. Privacy review must cover object-level access, sensitive fields, least privilege, cross-user isolation, admin exception boundaries and audit logging.

### E01-E — Final Security Gate

Final gate requires:

`Typecheck → Tests → Security Gate → CI → Diff Audit → Main Verification → Closure Record`

Only after E01-E passes is E01 authorized for one final PR into `main`.

## 5. Next Execution Order

Do not skip or reorder the following sequence:

1. **Reconcile E01 branch with current `main`** without resetting or deleting E01 work.
2. **Run E01-B Security Gate** and close E01-B only on passing evidence.
3. Complete/verify **E01-C** and close it with isolation evidence.
4. Complete/verify **E01-D** and close it with consent/privacy evidence.
5. Execute **E01-E Final Security Gate**.
6. Perform final diff audit and verify current `main` compatibility.
7. Open **one PR only** from `security/e01-foundation-2026-09-03` to `main`.
8. Merge only after all required checks are green.
9. Verify `main` after merge.
10. Only then begin **E02 Financial Authority**.

## 6. Downstream Roadmap Lock

The post-E01 sequence remains:

`E01 Security Foundation → E02 Financial Authority → E03 Provider Payment → E04 Escrow/Wallet/Settlement → E05 Reconciliation → E06 Marketplace → E07 Consultation/Communication → E08 Documents/Cases/Representation → E09 Legal Services Catalog → E10 Lawyer Digital Office → E11 Lawyer SaaS → E12 Tasks/Workflow → E13 Trust/Admin → E14 Product E2E/Release Gate`

**Financial work is blocked until E01 is closed.**

The Lawyer SaaS product rule remains:

`Verified Lawyer → 30-Day Free Trial → 50 JOD/month → Renewal / Expiry → Entitlement Enforcement`

The subscription entitlement remains conceptually separate from client service money and lawyer earned service entitlements.

## 7. Anti-Drift Rule

This register exists to prevent repeated discovery, branch proliferation, accidental reopening of closed work, loss of prior decisions and roadmap drift.

When a future session asks "where are we?", use this register together with the canonical Master Map and the E01 security audit document before starting new discovery.

Historical maps and documents remain preserved. They are not competing execution authorities. Current execution state is governed by this register and the canonical Master Map.
