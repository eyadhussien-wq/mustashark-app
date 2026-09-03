# C3 — MUSTASHARK OPERATING FOUNDATION

**Status:** `OPEN / FOUNDATIONAL VERIFICATION`

## 00 — Purpose

C3 is the governance and evidence boundary between the existing Mustashark architecture and any future core service/financial implementation.

This document is **not** a legal opinion, licensing conclusion, regulatory classification, or implementation proof.

### Governing hierarchy

`Legal/Regulatory → Contractual → Service Operating Model → Financial/Accounting → Data → Security → Software → Runtime Proof`

Lower layers must not silently redefine unresolved assumptions in higher layers.

## 01 — Operating Model Premise

Architecturally, Mustashark is treated as a service/channel platform connecting a client seeking legal services with a licensed lawyer. This is a product architecture premise only.

The service relationship may progress through controlled stages:

1. discovery and professional matching;
2. consultation/advice;
3. memorandum and document services;
4. representation workflows;
5. POA/court-proof workflows;
6. explicitly scoped additional professional services.

Each stage requires its own service, contractual, consent, data, and financial semantics where applicable.

## 02 — Canonical Actors

| Actor | Architectural role |
|---|---|
| Client | Service seeker and applicable contracting party |
| Licensed Lawyer | Independent professional service provider |
| Replacement Lawyer | Possible successor provider subject to authority/consent |
| Mustashark | Platform/channel/orchestration layer |
| Payment Provider | External payment/settlement participant |

## 03 — C3 Foundation Map

```text
C3-01 Discovery / Client-Lawyer Channel
→ C3-02 Consultation Request & Professional Match
→ C3-03 Service Start / Scope Confirmation
→ C3-04 Service Expansion
→ C3-05 Representation / POA Path
→ C3-06 Service-Specific Contract & Consent
→ C3-07 Payment Provider Boundary
→ C3-08 Financial Ownership & Provenance
→ C3-09 Hold / Escrow Semantics
→ C3-10 Financial Lifecycle Integrity
→ C3-11 Settlement & Reconciliation
→ C3-12 Rights & Responsibility Matrix
→ C3-13 Data Protection / Confidentiality / Auditability
→ C3-14 Security / Concurrency / Resilience
→ C3-15 Final Foundation Evidence Gate
```

## 04 — Service & Contract Boundary

Before implementation closure, establish evidence for:

- requested service and scope;
- fee and currency;
- deliverable and start condition;
- lawyer responsibility;
- Mustashark responsibility;
- cancellation/refund rules;
- service expansion;
- representation/POA authority where applicable;
- replacement/transfer authority;
- applicable versioned consent and acceptance evidence.

A UI state such as `accepted` is not itself contractual or financial authority.

## 05 — Payment / Custody Boundary

The architecture must determine from actual behavior:

- who receives funds;
- who holds or controls funds;
- where funds reside;
- who initiates and executes refunds;
- who executes lawyer payouts;
- whether provider-native split settlement is available;
- whether Mustashark controls balances or merely records internal entitlements;
- whether any behavior creates payment, custody, transmission, payout, refund, or fund-redirection obligations.

A licensed payment provider does **not** automatically exempt Mustashark from obligations.

## 06 — Financial Ownership & Provenance

Every material monetary state must eventually be traceable through a complete evidence chain:

```text
Provider Transaction
→ Payment/Funding Record
→ Hold/Allocation
→ Release / Refund / Forfeit / Transfer
→ Lawyer / Client / Platform Entitlement
→ External Settlement
→ Reconciliation Evidence
```

Database naming alone must not determine the economic or regulatory meaning of a wallet, escrow, balance, due, or settlement record.

## 07 — Financial Lifecycle Coverage

The C3 audit boundary covers all paths capable of changing the same economic state:

- fund/deposit;
- milestone release;
- refund;
- cancellation;
- forfeit;
- transfer/no-show;
- allocation;
- dispute/resolution;
- commission/platform dues;
- client/lawyer wallet-like records;
- provider refunds/payouts;
- external settlement.

**Transfer No-show:** `RED / FINANCIAL + LEGAL RISK / DEEP VERIFICATION REQUIRED`.

No individual path may be declared safe while another path can mutate the same economic state.

## 08 — Reconciliation Authority

Internal state and external provider state must remain distinguishable.

```text
Provider State
    ↕
Provider Transaction / Refund / Settlement ID
    ↕
Mustashark Financial Record
    ↕
Internal Hold / Entitlement / Due State
```

Where applicable, payment confirmation should reconcile multiple evidence sources, including provider API verification, signed webhook evidence, unique provider transaction identifiers, amount/currency/beneficiary data, and reconciliation results.

An internal `refunded` state must never silently imply that an external refund succeeded.

## 09 — Incident State Machine

Reconciliation mismatches require deterministic, evidence-preserving handling.

```text
DETECTED
  ↓
VERIFIED
  ↓
RETRY | HOLD | BLOCK | INVESTIGATE
  ↓
RESOLVED
```

Each transition requires appropriate severity, authorization, audit evidence, and safe retry rules.

**No implementation is authorized by this document alone.**

## 10 — Rights & Responsibility Matrix

For each material lifecycle event, determine:

- who may initiate;
- who may approve;
- who controls the relevant resource;
- who bears the financial obligation;
- what contract/consent grants authority;
- what evidence is retained;
- what happens when an external operation fails or times out.

Canonical events: fund, release, refund, cancel, forfeit, transfer, no-show, dispute, representation expansion, memorandum/document service, final settlement.

## 11 — Data Protection / Confidentiality

Legal content, documents, professional communications, and financial information require explicit treatment of:

- least privilege;
- minimization and purpose limitation;
- retention/deletion;
- disclosure controls;
- cross-border transfer;
- confidentiality boundaries;
- financial-data protection;
- auditability without exposing secrets/tokens;
- incident evidence.

Applicable jurisdictional requirements must be established from the actual operating model.

## 12 — Security / Concurrency / Resilience

The verification boundary includes:

- transactional idempotency;
- authenticated provider/webhook evidence;
- replay protection;
- semantic uniqueness;
- lock ordering and deadlock prevention;
- race-condition testing;
- timeout/retry safety;
- external side-effect consistency;
- safe error handling and redaction;
- immutable financial audit evidence;
- fail-closed authorization;
- no DB-outage authentication fallback;
- production/preview separation.

## 13 — Owner / Entity / Jurisdiction Decisions

C3 does not prematurely select an operating entity, bank, provider, custody model, or jurisdiction.

Candidate structures include:

- Jordanian operating company + business banking;
- Qatar/US/other foreign entity + foreign business banking;
- personal-name operation where legally permitted.

Jordan and Qatar are planning priorities. Final selection requires legal/regulatory, banking, payment-provider, tax, privacy, consumer, professional-service, and operational evidence.

Expansion remains jurisdiction-by-jurisdiction:

`Jordan → Qatar → Egypt → Other Jurisdictions`

## 14 — C3-0 Assumption Freeze

Until evidence resolves the operating model:

- no new financial wallets;
- no new escrow semantics;
- no assumption that Mustashark is a payment provider or custodian;
- no production payment integration from assumptions;
- no schema design hard-coding unresolved custody/payment semantics;
- no financial-core refactor that hides unresolved behavior.

**Business development is not frozen; unresolved assumptions are frozen.**

## 15 — Reality Extraction

The required evidence artifact is `C3-GAP-REGISTER.md`.

It must extract current repository reality for:

- payment endpoints/providers;
- wallet-like tables and balances;
- escrow/hold states;
- payout/refund paths;
- platform dues/commission;
- webhooks and provider references;
- idempotency;
- audit events;
- settlement/reconciliation paths.

Extraction records facts and gaps. It does not authorize fixes.

## 16 — Non-Goals

During the C3 foundation stage:

- no blind schema changes;
- no arbitrary uniqueness constraints;
- no wallet redesign based on naming alone;
- no assumption that a DB escrow row is legal escrow;
- no automatic Transfer/Refund rewrite;
- no production payment integration based on guessed configuration;
- no PASS based solely on source inspection.

## 17 — Final Evidence Gate

C3 may only become `CLOSED / VERIFIED` when applicable evidence exists for:

- operating-model classification;
- contractual authority and consent;
- payment/custody classification;
- financial ownership/provenance;
- accounting semantics;
- external reconciliation;
- data protection/compliance;
- security controls;
- concurrency behavior;
- repository mapping;
- integration and regression tests;
- audit evidence;
- final review and target-branch verification.

**Current state:** `OPEN / NOT READY FOR CLOSURE`.
