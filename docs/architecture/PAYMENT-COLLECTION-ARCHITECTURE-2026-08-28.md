# Mustasharek — Payment & Collection Architecture

**Date:** 2026-08-28  
**Status:** CANONICAL STRATEGIC DECISION — ADOPTED  
**Scope:** Payment, collection, installment plans, external/manual transfers, escrow state, provider integration, and future settlement architecture.

## 1. Core Principle

Mustasharek is not building a simple "payment button". It is building a **Payment & Collection Architecture** capable of supporting multiple service types, customers, lawyers, payment methods, installment plans, and future commercial agreements without coupling the legal-service lifecycle to one payment provider.

The legal service is the business object. The payment plan defines the financial obligations. The payment method defines how an obligation is collected. Every successfully verified collection enters the same internal financial authority and escrow state machine.

## 2. Canonical Architecture

```text
Legal Service / Representation
            │
            ▼
       Payment Plan
            │
      ┌─────┼─────────┐
      │     │         │
   30%      40%       30%
      │     │         │
      └─────┼─────────┘
            ▼
       Payment Obligation
            │
       Payment Method
            │
    ┌───────┼──────────────┐
    │       │              │
 Online    WU          Bank/Other
    │       │              │
MyFatoorah Proof/Review    ...
    │       │              │
    └───────┼──────────────┘
            ▼
     Internal Financial Core
            │
      ┌─────┴─────┐
      ▼           ▼
 paymentStatus escrowStatus
   = paid        = held
            │
            ▼
   Future Settlement Layer
```

## 3. Payment Provider Strategy

### First provider: MyFatoorah

MyFatoorah is the first electronic payment provider targeted for launch.

Initial launch market:

- **Jordan**
- Commercial entity assumption: a Jordanian law office or Jordanian IT/technology company, subject to final legal/regulatory and provider onboarding requirements.
- Initial currency: **JOD**.

Future market:

- **Qatar**
- Currency: **QAR**.

The application must treat MyFatoorah as a **provider adapter**, not as the financial authority of Mustasharek.

Provider-specific IDs, invoices, transaction references and webhook data belong at the integration boundary. They must not become the authoritative source of the legal-service state.

## 4. Payment Success Rule

For Mustasharek's internal financial model:

> **Verified successful payment immediately results in `paymentStatus = paid` and `escrowStatus = held` inside Mustasharek's domain.**

`held` describes the **internal entitlement/escrow state** of the service and must not be interpreted as a statement that MyFatoorah, a bank, or another external institution has legally or physically placed the funds into a Mustasharek-controlled escrow account.

External settlement, payout, custody, banking, and contractual allocation are a separate future layer.

## 5. External Settlement Is Deliberately Separated

The following are NOT part of the meaning of internal `escrowStatus = held`:

- bank custody;
- payment-provider settlement;
- lawyer payout;
- law-office payout;
- Mustasharek commission settlement;
- tax settlement;
- reconciliation with the commercial bank account;
- contractual revenue sharing.

These will be governed separately after the commercial, contractual, legal, banking, and regulatory model is finalized.

This separation allows different agreements with different law offices and technology partners without redesigning the Payment Core.

## 6. Multiple Collection Channels

Mustasharek must support more than electronic card payment.

### A. Electronic payment

Example:

```text
Client → MyFatoorah → Verified payment → Internal Payment → paid + held
```

The client interface must never be the final financial authority. The server must verify the provider result and apply the state transition atomically.

### B. External/manual transfer — Western Union example

A client may be unable to pay electronically.

Expected flow:

```text
Client selects transfer
        ↓
Receives transfer instructions
        ↓
Makes Western Union transfer
        ↓
Uploads transfer proof/image
        ↓
Admin/lawyer review according to permissions
        ↓
Proof approved
        ↓
Internal Payment recorded
        ↓
paid + held
```

The WU proof is evidence of an external transfer. It is not itself the authoritative financial state. Approval must pass through the same protected internal financial transition used by other collection methods.

This existing payment-proof capability should be reused/extended where sufficient; it must not be duplicated merely because MyFatoorah is being introduced.

## 7. Installment Plans

Payment method and payment plan are separate concepts.

A lawyer may configure a service payment plan such as:

```text
Total = 10,000 JOD

Installment 1 = 30% = 3,000 JOD
Installment 2 = 40% = 4,000 JOD
Installment 3 = 30% = 3,000 JOD
```

Other valid plans may include, for example:

```text
50% + 50%
20% + 30% + 50%
25% + 25% + 50%
```

The system must not hard-code a single installment pattern.

Each installment is a distinct **payment obligation** that may be collected through an available payment method.

## 8. Milestone-Linked Installments

Installments may later be associated with service/case milestones or contractual events.

Examples:

```text
30% → service/representation start
40% → agreed legal milestone
30% → agreed completion milestone
```

The exact trigger semantics must be defined by the applicable service contract and commercial rules before implementation.

## 9. Unified Internal Financial Authority

All collection methods must converge into one internal financial core.

```text
MyFatoorah ─────┐
Western Union ──┤
Bank Transfer ──┤──→ Internal Payment Authority
Manual Payment ─┤             │
Future Provider ┘             ▼
                       paid + held
```

There must be no separate financial state machine for each provider.

## 10. Idempotency and Concurrency

Every provider callback or manual approval must be safe against duplication and race conditions.

Required principles:

- provider callbacks are idempotent;
- duplicate webhook delivery cannot create duplicate financial effects;
- amount must be verified server-side;
- currency must be verified server-side;
- internal booking/service reference must be verified;
- provider transaction/reference must be tracked where applicable;
- financial transitions must occur atomically;
- existing row-lock/version/concurrency protections must be reused where applicable;
- frontend success screens never authorize payment state by themselves.

## 11. MyFatoorah Integration Boundary

The intended electronic flow is:

```text
Client
  ↓
Mustasharek API
  ↓
Create payment request
  ↓
MyFatoorah
  ↓
Client checkout
  ↓
Provider result / webhook
  ↓
Signature verification
  ↓
Provider payment-detail verification
  ↓
Amount/currency/reference validation
  ↓
Atomic internal financial transition
  ↓
paymentStatus = paid
escrowStatus = held
```

Provider-specific behavior remains isolated behind the integration boundary.

## 12. Existing Capability Reuse Rule

Before creating a new financial table, service, endpoint, or state machine, the implementation must audit and reuse existing valid capabilities.

Known existing financial capabilities include payment-proof handling and internal booking financial states. Existing logic must be extended when it is architecturally suitable rather than duplicated.

The target principle is:

> **Reuse → Extend → Build New only when demonstrably necessary.**

## 13. Booking/Service Schema Protection

The existing legal-service/booking financial state remains authoritative for the current lifecycle.

No schema redesign is authorized merely because MyFatoorah is being introduced.

Any future schema change must first demonstrate that the existing structures cannot safely represent the new capability and must define the minimum required change.

Production state machines must not be duplicated inside provider-specific tables.

## 14. Jordan First, Qatar Ready

Launch architecture is Jordan-first:

```text
JO
JOD
MyFatoorah
```

The architecture must remain extensible to:

```text
QA
QAR
MyFatoorah
```

Country-specific provider configuration, credentials, currency, settlement and legal/regulatory requirements must remain configuration/integration concerns rather than being hard-coded into core legal-service state logic.

## 15. Future Commercial Agreements

The architecture intentionally leaves room for different contractual arrangements with:

- individual lawyers;
- law offices;
- law firms;
- technology companies;
- other approved commercial partners.

Future rules may include:

- Mustasharek commission;
- lawyer/law-office share;
- taxes;
- payout timing;
- release conditions;
- refunds;
- forfeiture;
- disputes;
- no-show handling;
- reconciliation;
- contractual exceptions.

These must be implemented as explicit, auditable rules rather than hidden inside payment-provider code.

## 16. Service-Type Independence

Payment architecture must support different Mustasharek services, including but not limited to:

- legal consultation;
- lawyer representation / power of attorney services;
- case/matter services;
- future legal service offerings.

A service determines the applicable commercial/payment plan. The payment provider is only one collection mechanism.

## 17. Security and Trust Boundaries

Financial authority remains server-side.

The following are never trusted as financial authority:

- frontend payment-success state;
- client-submitted amount;
- client-submitted payment status;
- provider redirect alone;
- uploaded transfer proof alone;
- lawyer UI alone.

All financially material transitions require server-side authorization, validation, idempotency and auditability.

## 18. Implementation Sequence

The implementation sequence is deliberately incremental:

```text
1. Audit existing financial/payment capabilities
2. Define Payment & Collection domain boundary
3. Define payment obligation / installment model
4. Define provider adapter contract
5. Integrate MyFatoorah for Jordan
6. Implement verified webhook path
7. Reuse/extend existing payment-proof path for external transfers
8. Connect all methods to one internal financial authority
9. Add installment-plan behavior
10. Add service/milestone payment triggers
11. Add reconciliation/settlement layer
12. Add Qatar configuration and provider validation
13. Production security/compliance review
```

No step should introduce unnecessary parallel financial authorities.

## 19. Governance

This document is an architectural decision record and strategy baseline. It does not claim that every capability listed above is already implemented.

Implementation completion still requires the project's normal governance path:

```text
DISCOVER
→ CLASSIFY
→ MAP
→ IMPLEMENT
→ TYPECHECK
→ TEST
→ SECURITY REVIEW
→ CI
→ PR
→ REVIEW
→ MERGE
→ VERIFY MAIN
→ CLOSED / VERIFIED
```

## 20. Non-Negotiable Decisions

1. **Mustasharek is building a Payment & Collection Architecture, not a single payment button.**
2. **MyFatoorah is the first electronic provider, beginning with Jordan/JOD.**
3. **Western Union/manual transfer is a supported collection channel for clients who cannot pay electronically.**
4. **Transfer proof is evidence, not financial authority.**
5. **Installment plans are configurable and independent from payment method.**
6. **A verified successful collection enters Mustasharek's internal state as `paid + held`.**
7. **Internal `held` does not claim external legal/banking custody.**
8. **External settlement/payout/commission/tax/reconciliation is a separate layer.**
9. **All collection methods converge into one internal financial authority.**
10. **Existing financial/payment capabilities must be reused or extended before new structures are created.**
11. **Provider-specific details must remain behind an integration boundary.**
12. **Jordan is first; Qatar remains an explicit future expansion target.**
13. **No unnecessary changes to production state machines or schema are permitted.**
14. **All financial transitions require server-side verification, atomicity and idempotency.**
15. **Future commercial agreements with lawyers/law offices/technology partners must be supported without redesigning the Payment Core.**

**Canonical baseline date: 2026-08-28.**
