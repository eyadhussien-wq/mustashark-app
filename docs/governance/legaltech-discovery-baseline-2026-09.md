# Mustasharek LegalTech Discovery Baseline

**Date:** 2026-09-01  
**Status:** SECURITY HOLD ACTIVE | READ-ONLY RESEARCH ACTIVE | ZERO MUTATION FOR SENSITIVE/RUNTIME SYSTEMS  
**Branch:** `docs/legaltech-discovery-baseline-2026-09`

## Purpose

This document preserves the discovery, market, regulatory, architectural and governance conclusions reached before the next execution gate. It is a historical engineering baseline and decision record, not a legal opinion, regulatory approval, tax ruling, payment authorization, or certification of production readiness.

## Evidence classification

- **CONFIRMED OFFICIAL EVIDENCE** — supported by an identified competent authority/source.
- **MARKET OBSERVATION** — observed from public market examples; not proof of legality or regulatory approval.
- **ENGINEERING HYPOTHESIS** — architectural/business preference awaiting legal and commercial validation.
- **LEGAL QUESTION — UNRESOLVED** — requires competent Jordanian legal advice or an official determination.
- **REQUIRES JORDANIAN COUNSEL OPINION** — cannot safely be decided by engineering alone.

## Historical discovery and decisions preserved

The project has completed read-only discovery rounds covering: Jordanian LegalTech market benchmarking; first-party/entity verification attempts; regional comparison including Saudi examples; Legal Boundary and Operating Model analysis; Regulatory Evidence and Legal Model Validation; Evidence Hierarchy; Legal Authority Matrix; Registration-vs-Permission distinction; Liability Test A/B/C/D; Client & Data Ownership Test; Exit/Failure Scenario Test; Minimum-Risk Launch Model A→B→C; and Model C (SaaS + Marketplace) as the preferred long-term business hypothesis.

These rounds are recorded in the detailed governance artifacts under `docs/governance/`. Market examples remain `MARKET OBSERVATION` and never constitute legal approval.

## Core governance rules

`SECURITY HOLD: ACTIVE`  
`READ-ONLY LEGAL/REGULATORY RESEARCH: ACTIVE`  
`ZERO MUTATION: ACTIVE` for production, financial, regulatory and sensitive operational systems.

Governance documentation commits on this dedicated branch are permitted because they preserve decision history and do not alter runtime behavior.

No production database mutation, financial implementation, live payment integration, tax implementation based on assumption, or commercial activation is authorized by this baseline.

## Strategic hypothesis — entity and operating model

A **Jordanian independent technology company** owning the Mustasharek platform/IP, with licensed legal professionals providing professional services, remains the preferred architecture hypothesis. It is not an approved legal structure or corporate-registration instruction.

The platform should remain generic/configurable and should not be hard-coded to a specific law firm, tax identity, payment provider, or commercial partner before those matters are legally and commercially resolved.

## Market benchmark — key preserved findings

**Huqouk / منصة حقوق:** public material presents a digital legal platform and describes a relationship between clients and accredited lawyers; treated strictly as `MARKET OBSERVATION`.

**Qada.ai:** public material describes a technology platform, independent lawyer service providers and lawyer/client workflows; treated strictly as `MARKET OBSERVATION`.

**Mufead / مُفيد:** public material describes legal-request and lawyer-offer functionality; operator/legal-entity/payment/tax structure was not independently established in the reviewed evidence and remains verification-bound. Regional classification is retained as comparative market evidence.

Benchmark conclusion: these examples support market plausibility of technology-platform/legal-provider models but do not prove that Mustasharek may copy their operating, payment, commission, tax or professional arrangements.

## Regulatory evidence — key preserved findings

### Payment / settlement

Official Central Bank of Jordan material establishes that relevant electronic payment/transfer and payment-system activities operate under a licensing/regulatory framework. Therefore technology-company registration must not be treated as equivalent to payment-service authorization.

**Unresolved:** the exact legal characterization and permitted provider structure for Mustasharek's future collection, routing, settlement, refund, payout or split-payment flow.

### National e-invoicing

Official Income and Sales Tax Department material establishes the National E-Invoicing System and related guidance.

**Unresolved:** supplier/invoice issuer and treatment of professional/platform fees under the final operating model.

### Personal-data protection

Official Ministry of Digital Economy and Entrepreneurship material identifies Jordan's Personal Data Protection Law No. 24 of 2023 and related implementing instruments.

**Unresolved:** Mustasharek's exact controller/processor roles, lawful bases, confidentiality, retention, disclosure, incidents and cross-border processing/hosting requirements.

## Round 4 — Legal Boundary & Operating Model

Three operating hypotheses remain distinct:

- **Model A — Lawyer SaaS:** practice-management technology for licensed lawyers/law firms; lawyer independently provides professional services.
- **Model B — Discovery / connection layer:** client discovery/connection and related platform capabilities, subject to professional/advertising/referral validation.
- **Model C — SaaS + Marketplace:** lawyer-facing SaaS plus client-facing discovery/booking layer. This is the preferred long-term business hypothesis, not legal approval.

### Substance-over-label rule

`SaaS`, `Marketplace`, `Technology Provider`, `Intermediary` and `Escrow` are not legal safe harbors by themselves. Actual contracts, money flow, professional activity, operational conduct and representations control the analysis.

### Liability A/B/C/D

- **A — Professional Liability:** intended to remain with the licensed lawyer/service provider for professional legal work, subject to mandatory law and professional rules.
- **B — Platform Liability:** Mustasharek remains responsible for its own technology, representations, security commitments and contractual duties; disclaimers cannot erase non-excludable liability.
- **C — Data Liability:** roles and duties must be established under the applicable data-protection and professional-confidentiality framework.
- **D — Payment Liability:** collection, routing, settlement, refunds, payouts and reconciliation remain subject to the actual licensed payment structure and are not assumed permissible.

### Liability Test

The legal review must explicitly determine whether and under what circumstances a client harmed by professional legal advice can pursue Mustasharek, the lawyer, or both, and which responsibilities can lawfully be allocated by contract. A checkbox is not treated as an immunity mechanism.

### Contractual flexibility

Contract clauses may document a lawful allocation of responsibility, but cannot create immunity that mandatory law does not provide. Final wording requires qualified Jordanian counsel.

## Round 5 — Jordan Regulatory Evidence & Legal Model Validation

Round 5 established the following mandatory controls:

1. **Regulatory Decision Tree:** classify material activities as `ALLOWED`, `REQUIRES APPROVAL / SPECIFIC STRUCTURE`, or `PROHIBITED / NOT TO IMPLEMENT` based on evidence, not engineering assumption.
2. **Legal Authority Matrix:** direct corporate, professional, payment, tax, data and consumer questions to the competent authority/framework.
3. **No Single Advisor Can Authorize the Whole Model:** critical domains require the appropriate specialist opinion.
4. **Registration vs Permission:** incorporation does not prove permission for professional, intermediary, payment or financial activity.
5. **Client & Data Ownership Test:** resolve contracting party, matter-data control, access, portability, retention, deletion, provider exit, controller/processor roles and confidentiality.
6. **Exit / Failure Scenario Test:** resolve provider exit/suspension, client withdrawal, disputes, payment-provider failure, refunds, chargebacks, document access, outages and data incidents.
7. **Minimum-Risk Launch:** staged hypothesis `A — Lawyer SaaS → B — Discovery/Connection → C — SaaS + Marketplace`.
8. **Evidence Hierarchy:** official evidence and specialist opinions outrank market observation and engineering hypotheses.

## Round 6 — Neutral Core Construction

**Current status:** `ACTIVE — NEUTRAL CORE CONSTRUCTION ALLOWED / REGULATED CORE BLOCKED`

Round 6 is the current engineering execution direction. It keeps development moving while preserving reversibility and the legal/commercial gates.

### Neutral Core — permitted construction scope

- identity/authentication foundations;
- client accounts and profiles;
- lawyer accounts/profiles and professional-status fields;
- role-based authorization and ownership boundaries;
- lawyer digital-office workspace;
- client workspace;
- scheduling and availability;
- secure document handling;
- secure client-lawyer communications;
- notifications/workflow events;
- matter/case workspace foundations that do not make Mustasharek the professional provider;
- CRM/workflow organization;
- audit logs;
- administrative governance;
- generic provider/fee/settlement abstractions with no live regulated transaction;
- typecheck, tests, security checks, CI and non-production verification.

### Regulated / commercial core — blocked

- professional-fee collection on behalf of lawyers;
- custody/routing of client or third-party funds where authorization is required;
- escrow;
- split payments;
- automatic payouts;
- commission/revenue sharing;
- production tax/e-invoicing behavior based on assumptions;
- live regulated payment integration without validated structure;
- professional legal advice or representation by Mustasharek itself;
- law-firm-specific hard-coding before operating-model decision;
- reliance on a disclaimer/checkbox as immunity;
- commercial Production activation of unresolved flows.

### Reversible architecture rule

The Neutral Core must support more than one future operating model without destructive rewrite. Neutral abstractions may exist in code, but their presence is not permission to activate regulated behavior.

## New strategic decision — Lawyer OS v1

Following the latest founder/engineering decision, the **near-term construction target is now Model A / Lawyer SaaS as a product hypothesis**, not the immediate implementation of the broader Model C marketplace.

The working product identity is:

> **Mustasharek Lawyer OS v1 — a lawyer-facing practice-management SaaS with secure client communication capabilities, designed as a neutral technology product and initially separated from professional-fee collection, fee sharing, escrow, split settlement and platform commission.**

A fixed subscription such as **50 JOD/month** is retained as a commercial hypothesis only. The amount, tax treatment, invoicing requirements, payment-provider structure and final contractual wording remain subject to validation.

### Non-negotiable product boundary

The product must not rely on the following propositions as legal protection:

- "SaaS means automatically legal";
- "a fixed fee means no regulation applies";
- "a disclaimer eliminates liability";
- "a checkbox transfers all responsibility";
- "a competitor does it, therefore Mustasharek may do it".

Instead, the actual product, contracts, marketing, money flow, data architecture and operational conduct must remain consistent with the validated operating model.

### Initial money-flow hypothesis

For the first SaaS model, the conceptual commercial relationship is:

`Lawyer → Mustasharek`

for software access.

The professional legal relationship is kept conceptually separate:

`Client ↔ Licensed Lawyer`

No professional-fee collection, client-fund custody, split settlement, escrow, commission or revenue sharing is part of the initial Neutral Core build.

## Three-layer construction boundary

```text
A. NEUTRAL CORE                         OPEN FOR CONSTRUCTION
   Identity / Auth / RBAC
   Lawyer OS / Clients / Matters
   Documents / Scheduling
   Messaging / Notifications
   Audit / Security

B. COMMERCIAL SaaS                     ISOLATED / VALIDATION PENDING
   Subscription plan
   Subscription lifecycle
   Billing abstraction
   Invoice integration boundary

C. REGULATED / MODEL-DEPENDENT         BLOCKED
   Marketplace / referral
   Professional-fee collection
   Split settlement / payouts
   Commission / revenue sharing
   Escrow / wallet
   Other regulated money flows
```

## Repository execution rule — never return to zero

The project now adopts a formal execution matrix:

`docs/governance/MUSTASHAREK-ENGINEERING-GOVERNANCE-MASTER-MATRIX-2026-09.md`

The matrix is subordinate to `MUSTASHARK-MASTER-MAP` and MAP-X and is the operational bridge between the historical discovery baseline and construction.

Every future implementation item must first identify its phase and gate. Historical discovery must not be reopened as if it were new work. A change in business model must create a new decision record and impact analysis rather than rewriting history.

## Immediate engineering sequence

1. **P1 — Neutral Core Repository Audit:** inventory the current repository and classify existing components as `REUSE / HARDEN / ISOLATE / QUARANTINE / REPLACE / DEFER`.
2. Map existing functionality to Neutral Core / Commercial SaaS / Regulated boundaries.
3. Identify and quarantine legacy financial assumptions such as commission, split payment, escrow, client funds, professional-fee collection and automatic payouts.
4. Identify security and authorization gaps in the Neutral Core.
5. Produce a small reversible implementation backlog for Lawyer OS v1.
6. Implement only approved Neutral Core items.
7. Keep SaaS billing isolated until tax/payment validation is complete.
8. Run typecheck, tests, security checks and CI for every governed implementation.
9. Preserve evidence and update the governance records for every material decision.

## Decision preservation — never return to zero

Every material discussion, research conclusion, rejected assumption, unresolved question and approved engineering direction must be preserved in Git with its evidence classification and date. Future sessions must start from this baseline, the Master Map, MAP-X, the Decision Log, the Round 6 artifact and the Engineering & Governance Master Matrix rather than recreating the reasoning from memory.

## Current governance state

`SECURITY HOLD: ACTIVE`  
`READ-ONLY LEGAL/REGULATORY RESEARCH: ACTIVE`  
`ZERO MUTATION: ACTIVE FOR SENSITIVE/RUNTIME SYSTEMS`  
`REVERSIBLE CONSTRUCTION: ALLOWED FOR NEUTRAL CORE`  
`LAWYER OS V1: ACTIVE CONSTRUCTION TARGET`  
`LEGAL OPERATING MODEL: PENDING`  
`FINANCIAL / PROFESSIONAL-FEE IMPLEMENTATION: BLOCKED`  
`MARKETPLACE / REFERRAL ACTIVATION: BLOCKED`  
`TAX / E-INVOICING IMPLEMENTATION: BLOCKED PENDING VALIDATION`  
`PRODUCTION COMMERCIAL ACTIVATION: BLOCKED`  
`EXECUTION GATE: CLOSED FOR REGULATED/UNVALIDATED COMMERCIAL FUNCTIONS`

**Round 6 artifact:** `docs/governance/neutral-core-construction-round6-2026-09.md`  
**Master execution matrix:** `docs/governance/MUSTASHAREK-ENGINEERING-GOVERNANCE-MASTER-MATRIX-2026-09.md`

**Baseline rule:** Build `Mustasharek Lawyer OS v1`; keep model-dependent, professional-regulatory, financial and tax-sensitive behavior isolated or blocked; continue legal/regulatory evidence in parallel; make material decisions reversible until validated; never return to zero.