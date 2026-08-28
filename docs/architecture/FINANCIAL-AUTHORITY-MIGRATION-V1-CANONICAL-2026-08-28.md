# Mustasharek — Financial Authority Migration V1

**Status:** CANONICAL ARCHITECTURAL DECISION — ADOPTED
**Date:** 2026-08-28

## 1. Purpose

This document is the canonical V1 financial foundation for Mustasharek. It replaces legacy commercial-policy assumptions inside the financial core with one minimal domain rule:

> **Payment for Service**

The financial core records and protects financial facts. Commercial policies, penalties, time windows, forfeiture rules, and administrative discretionary decisions are outside this core unless separately approved and explicitly integrated.

## 2. Rights Protection

The design protects three parties simultaneously:

- **Client:** verified payment, correct entitlement/refund treatment, no duplicate charge, auditable balance.
- **Lawyer:** only verified earned entitlement can become payable; no unauthorized deduction or mutation.
- **Platform:** authoritative ledger, controlled settlement, reconciliation, and prevention of duplicate or fabricated financial events.

## 3. Authority Boundary

```text
Service
  ↓
Payment Obligation
  ↓
Provider Adapter (MyFatoorah)
  ↓
Verified Provider Event
  ↓
Financial Authority
  ↓
Ledger / Escrow Compatibility
  ↓
Settlement
  ↓
Reconciliation
```

No client UI, controller, webhook, wallet endpoint, or provider adapter may independently mutate financial truth outside the Financial Authority.

## 4. MyFatoorah Boundary

MyFatoorah is an external payment provider, not Mustasharek's financial authority.

Required controls:

- server-created payment requests;
- server-side amount/currency/reference validation;
- HTTPS;
- signed webhook verification where supported;
- provider status verification;
- duplicate webhook tolerance;
- provider transaction/reference persistence;
- no reliance on browser redirect as proof of payment.

Provider-specific identifiers remain integration data and do not replace the internal ledger identity.

## 5. Financial Truth

The internal Ledger is the authoritative accounting journal for Mustasharek financial facts.

Every posted financial event must have:

- unique identifier;
- actor/source;
- service/booking reference when applicable;
- amount;
- currency;
- event type and direction;
- idempotency key where applicable;
- correlation/reference identifier;
- timestamp;
- auditable metadata.

## 6. Atomicity

A financial state transition must be atomic. Partial states such as wallet updated without ledger entry, ledger posted without the corresponding protected business transition, or settlement recorded without its source fact are prohibited.

## 7. Idempotency

Repeated provider callbacks, retries, client retries, and administrative retries must not create duplicate financial effects.

Idempotency applies to:

- payment confirmation;
- escrow posting;
- refund;
- wallet credit/debit;
- payout request/record;
- settlement;
- reconciliation actions.

## 8. Concurrency

Financial mutations must use the existing transaction, locking, optimistic-version, and idempotency protections appropriate to the affected resource. A race must fail safely or converge to one financial result.

## 9. Cancellation / No-show / Payout

These operations are workflow events, not places to embed commercial policy.

The workflow determines an authorized service-state outcome. The Financial Authority then applies only the financial fact that is authorized by the current V1 model.

Legacy rules such as fixed cancellation windows, automatic penalties, forfeiture, or automatic platform-due collection are not part of Financial Authority V1.

## 10. Settlement

Internal settlement must distinguish:

- client entitlement;
- lawyer entitlement;
- platform entitlement;
- external provider/bank settlement status.

An internal payout record must never be represented as proof that an external bank/provider transfer succeeded unless external confirmation exists.

## 11. Reconciliation

Reconciliation must compare, where applicable:

```text
Provider
  ↔ Payment Record
  ↔ Escrow Compatibility Record
  ↔ Financial Ledger
  ↔ Client/ Lawyer Wallet
  ↔ Settlement/Payout
```

Any mismatch is a financial integrity exception requiring investigation; it must not be silently corrected by a normal request path.

## 12. Data Security

- Do not store payment-card data in Mustasharek unless a separately approved PCI-compliant architecture requires it.
- Secrets and provider credentials remain server-side.
- Logs must not expose payment secrets, authentication tokens, or unnecessary sensitive personal data.
- Financial records are access-controlled and auditable.
- Authorization is independent of authentication.

## 13. Legacy Policy Migration Rule

Legacy business-policy code may be removed from the financial authority when replaced by the V1 rule, but existing financial records must not be deleted or rewritten merely to make tests pass.

Historical compatibility structures, including escrow transaction history, remain available until reconciliation proves that migration is complete.

## 14. Gate Requirements

Financial Authority V1 cannot be marked GREEN until all of the following pass:

1. Typecheck.
2. Build.
3. Authentication and authorization tests.
4. MyFatoorah verification-boundary tests.
5. Payment E2E test.
6. Ledger integrity tests.
7. Wallet integrity tests.
8. Settlement tests.
9. Refund/cancellation tests.
10. No-show tests.
11. Payout tests.
12. Reconciliation tests.
13. Idempotency tests.
14. Concurrency tests.
15. Rollback/atomicity tests.
16. Sensitive-data/logging checks.
17. Full CI/Gate pass.

## 15. Synthetic Financial Scenario

Before production approval, execute only with synthetic identities and test money:

```text
Synthetic Client
  ↓ requests legal service
Payment Obligation created
  ↓
MyFatoorah test payment
  ↓
Provider payment verified
  ↓
Financial Authority posts payment
  ↓
Ledger + escrow-compatible record
  ↓
Service accepted/completed
  ↓
Authorized settlement
  ↓
Lawyer entitlement recorded
  ↓
Platform entitlement recorded
  ↓
Reconciliation = MATCH
  ↓
Replay same webhook/request
  ↓
No duplicate financial effect
```

The test is successful only when every financial balance and journal relationship matches and all negative/security cases pass.

## 16. Approval State

**Architecture:** ADOPTED.

**Implementation:** NOT GREEN until the complete Gate and synthetic E2E scenario pass on the same branch head.
