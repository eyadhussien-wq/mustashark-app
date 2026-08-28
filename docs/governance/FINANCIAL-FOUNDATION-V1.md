# MUSTASHARK — V1 FINANCIAL FOUNDATION & POLICY SEPARATION

**Status:** ADOPTED GOVERNANCE BASELINE — V1
**Scope:** financial integrity, security, governance, data protection and separation of business policy from foundational controls.
**Runtime impact of this document:** NONE. This is a governance specification; runtime changes require separate implementation work.

## 01 — Core decision

For the first safe production-ready version of Mustashark, foundational security, integrity and governance controls are mandatory. Product-specific commercial policies are NOT treated as immutable technical requirements at this stage.

The system must therefore distinguish:

- **Foundation:** controls required for trustworthy operation regardless of later business policy.
- **Policy:** configurable rules chosen by Mustashark product/legal/operations governance and allowed to evolve after V1.
- **Legacy/Demo:** local, sample, simulated or historical behavior that must not silently become production authority.

## 02 — V1 Foundation — mandatory

### Security
- Server-side authentication and authorization for sensitive operations.
- Deny-by-default access boundaries.
- Ownership/scope checks for client, lawyer and admin data.
- No trust in client-supplied financial or authorization decisions.
- Secrets, tokens and sensitive data must not be exposed in logs or client storage unnecessarily.

### Data integrity
- Database/backend is the authoritative source of truth.
- Atomic transactions for multi-record state changes.
- Concurrency/race protection where state or money can be changed.
- Idempotency for retriable sensitive operations.
- Valid state transitions only.
- Safe failure/retry behavior.

### Financial integrity
- Money-changing decisions are server-authoritative.
- Financial effects must have a transaction boundary.
- Monetary values must be derived/validated server-side.
- A client application must not directly mutate authoritative balances.
- Refund, settlement, entitlement and payout effects must be traceable.
- Financial records must support reconciliation and audit.
- Duplicate financial effects must be prevented.
- External payment-provider effects must be treated as side effects requiring explicit proof/reconciliation.

### Governance/audit
Every material financial event should be attributable and auditable through, as applicable:

`actor → action → booking/entity → amount → currency → reason/context → timestamp → transaction/reference → idempotency reference → resulting state`

Audit evidence must be sufficient to reconstruct why a financial state exists. Code presence alone is not proof of closure.

### Privacy/data protection
- Collect only data required for the service.
- Enforce role and ownership boundaries.
- Avoid unnecessary duplication of sensitive legal/financial data.
- Protect legal consultation and document confidentiality.
- Do not expose personal/banking information through client-visible APIs without an explicit authorization basis.

## 03 — Financial architecture principle

The preferred conceptual separation is:

```text
Client / Lawyer UI
       ↓
Authenticated API
       ↓
Authorization + State Validation
       ↓
Financial Service / Transaction Boundary
       ↓
Authoritative Database / Ledger
       ↓
External Provider (when applicable)
       ↓
Reconciliation + Audit Evidence
```

The UI may display financial state and request an operation. It is not the financial authority.

## 04 — Wallet principle

Internal wallet/balance records must be treated conservatively as **ledger/entitlement state** unless and until the legal, regulatory and payment-provider model explicitly establishes otherwise.

For V1:

- Mobile/local storage must not be the authoritative wallet.
- Client credits/refunds must originate from an authorized server-side financial event.
- Lawyer entitlement must originate from authoritative server-side settlement rules.
- Balances should be derivable/auditable from financial events.
- Any cached/display balance is non-authoritative.

## 05 — Refund principle

V1 must support a safe financial refund mechanism without hard-coding Mustashark-specific commercial policy unless that policy has been separately approved.

A refund operation must provide, as applicable:

- authenticated actor/context;
- authorization;
- eligible source transaction/entity;
- amount and currency validation;
- transaction atomicity;
- idempotency;
- duplicate-effect prevention;
- audit event;
- reconciliation reference;
- explicit resulting state.

Whether a refund is 100%, partial, time-limited, discretionary or subject to administration is **Policy**, not Foundation.

## 06 — Cancellation / no-show / dispute principle

The technical foundation must safely represent these outcomes and prevent unauthorized or repeated financial effects.

The exact commercial/legal consequence of:

- cancellation;
- lawyer no-show;
- client no-show;
- dispute;
- service failure;
- late cancellation;
- administrative intervention

is intentionally classified as **Policy / Governance decision**, not as an immutable V1 rule.

The system must not silently infer that a historical demo rule is the final Mustashark policy.

## 07 — Lawyer earnings and payout principle

V1 must establish a secure entitlement/settlement foundation before real payout rails are enabled.

Required foundation:

- authoritative earning events;
- explicit gross/net/fee representation where applicable;
- deterministic calculation inputs;
- transaction-safe settlement state;
- payout eligibility state;
- idempotent payout initiation;
- payout provider reference when an external provider is used;
- reconciliation status;
- audit trail;
- prevention of duplicate payout effects.

The exact commission percentage, payout schedule, hold period, release policy and forfeiture rules are **Policy** and must remain configurable/governed separately.

## 08 — Separation from current local/demo behavior

Known client-side/local financial behavior in `artifacts/mustasharek/contexts/DataContext.tsx` is classified as an implementation concern requiring migration toward the authoritative backend, not as the canonical financial authority.

Functions involving local refund, wallet, no-show or payout state must not be treated as proof that the V1 financial foundation is complete.

Existing safe backend cancellation behavior may be reused where it satisfies the Foundation controls. Reuse is preferred over reconstruction, subject to verification.

## 09 — Policy layer — deferred after V1 foundation

The following are intentionally deferred until the first safe V1 is established and the product/legal/operational policy is explicitly approved:

- 24-hour objection/refund windows;
- percentage or fixed penalties;
- no-show commercial penalties;
- exact refund percentages and eligibility windows;
- administrative discretionary settlement rules;
- lawyer payout schedule;
- final commission/tax policy;
- forfeiture rules;
- dispute-resolution timelines and sanctions;
- replacement-lawyer commercial consequences;
- other Mustashark-specific business rules.

Deferred does not mean forgotten: these rules must later be implemented as governed policy over the secure foundation.

## 10 — Classification rule for repository audit

Every relevant implementation must be classified as:

| Classification | Meaning | V1 treatment |
|---|---|---|
| FOUNDATION | Security/integrity/governance invariant | Must preserve/verify |
| POLICY | Mustashark-specific business/legal/operational rule | Do not hard-code as immutable foundation |
| LEGACY/DEMO | Sample/local/simulated/historical behavior | Must not be production authority |
| UNKNOWN | Classification cannot yet be proven | Block closure until classified |

## 11 — V1 Financial Closure Gate

The financial foundation is not `CLOSED / VERIFIED` until the applicable implementation proves:

1. Server authority.
2. Authentication and authorization.
3. Ownership/scope enforcement.
4. State validation.
5. Atomic transaction boundaries.
6. Concurrency/race protection.
7. Idempotency and retry safety.
8. Duplicate financial-effect prevention.
9. Authoritative ledger/entitlement representation.
10. Auditability and reconciliation references.
11. Safe handling of external provider side effects.
12. No client/local storage as financial source of truth.
13. Relevant tests, CI evidence and final verification.

## 12 — Governance rule

No business policy may weaken a Foundation control.

A future policy change may alter **what outcome is allowed**, but may not bypass authorization, transaction integrity, idempotency, auditability, privacy, reconciliation or other mandatory Foundation controls.

## 13 — Traceability

This specification is governed through:

`MUSTASHARK-MASTER-MAP → MAP-X → C3 Financial/Legal Foundation → Repository → Tests/CI → Evidence → Verify Main`

It supplements existing governance maps and does not create a competing master authority.

**Adoption:** `V1 FOUNDATION / POLICY SEPARATION — APPROVED`
**Business-policy status:** `DEFERRED / CONFIGURABLE AFTER V1`
**Runtime status:** `NO RUNTIME CHANGE IN THIS COMMIT`
