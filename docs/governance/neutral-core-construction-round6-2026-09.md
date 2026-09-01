# Mustasharek — Round 6 Neutral Core Construction

**Date:** 2026-09-01  
**Branch:** `docs/legaltech-discovery-baseline-2026-09`  
**Status:** GOVERNANCE / ARCHITECTURE BASELINE — RECORDED

## 1. Purpose

Round 6 converts the prior LegalTech discovery and governance decisions into a reversible engineering construction track. The objective is to keep development moving without prematurely selecting or implementing an unresolved legal, tax, professional-regulatory, or financial operating model.

This document is an engineering/governance decision record. It is not a Jordanian legal opinion, tax opinion, regulatory approval, payment authorization, or statement that any operating model is legally permissible.

## 2. Canonical project state

- `SECURITY HOLD: ACTIVE`
- `READ-ONLY LEGAL/REGULATORY RESEARCH: ACTIVE`
- `ZERO MUTATION: ACTIVE` for production, financial, regulatory and operationally sensitive changes
- `REVERSIBLE CONSTRUCTION: ALLOWED` for the Neutral Core only
- `LEGAL OPERATING MODEL: PENDING`
- `FINANCIAL / PAYMENT IMPLEMENTATION: BLOCKED`
- `TAX / E-INVOICING IMPLEMENTATION: BLOCKED pending validated model`
- `PRODUCTION COMMERCIAL ACTIVATION: BLOCKED`
- `MAIN: NO GOVERNANCE-DRIVEN CHANGES AUTHORIZED`

Documentation commits on this dedicated governance branch are explicitly permitted because they preserve the project's decision history and do not alter runtime behavior.

## 3. The Neutral Core principle

Mustasharek will be built as a neutral technology engine that can support more than one eventual operating model without requiring a destructive rewrite.

The current engineering hypothesis is:

> Mustasharek provides technology infrastructure for digital interaction between clients and licensed legal professionals, including lawyer-facing practice-management capabilities. The final legal and commercial model remains pending competent Jordanian validation.

The code must not encode the unresolved conclusion that Mustasharek is a law firm, legal representative, payment intermediary, escrow operator, tax principal, or fee-sharing entity.

## 4. Reversible architecture rule

The system should be designed so that future legal decisions can activate, constrain, or replace regulated/commercial modules without changing the Neutral Core's identity, security, data ownership boundaries, or core workflows.

Preferred abstractions include neutral concepts such as:

- `LegalProvider`
- `Client`
- `ProfessionalMatter`
- `Appointment`
- `Document`
- `Conversation`
- `ProfessionalFee`
- `PlatformFee`
- `Payment`
- `Settlement`

The presence of an abstraction does not authorize its commercial use. Regulated concepts remain disabled until the relevant decision record is closed.

## 5. Construction Track — permitted scope

The following are suitable candidates for implementation or hardening, subject to normal security and release controls:

1. Identity and authentication foundations.
2. Client accounts and profiles.
3. Lawyer accounts, profiles and professional-status fields where appropriate.
4. Role-based authorization and ownership boundaries.
5. Lawyer workspace / digital-office foundations.
6. Client workspace foundations.
7. Appointment scheduling and availability management.
8. Secure document upload, storage, access control and lifecycle management.
9. Secure client-lawyer communications infrastructure.
10. Notifications and workflow events.
11. Matter/case workspace foundations that do not make the platform the legal service provider.
12. CRM/workflow organization.
13. Audit logging and security traceability.
14. Administrative governance controls.
15. Generic/configurable provider, fee and settlement interfaces with no live regulated transaction.
16. Automated tests, typechecking, security checks, CI and non-production verification.

## 6. Regulated / commercial core — blocked scope

The following must remain disabled or non-operational until the appropriate legal, tax and payment evidence is closed:

- collecting professional fees on behalf of lawyers;
- holding client/third-party funds;
- escrow functionality;
- split-payment execution;
- automatic lawyer payouts;
- platform commission collection;
- revenue/fee sharing;
- tax characterization implemented as an engineering assumption;
- production tax/e-invoicing behavior tied to an unresolved principal/agent model;
- regulated payment-provider integration selected on the basis of an unverified assumption;
- professional legal advice by Mustasharek itself;
- legal representation by Mustasharek;
- automated professional judgment or legal decisions presented as the platform's own service;
- law-firm-specific hard-coding before the operating model is decided;
- claims that a disclaimer or checkbox eliminates platform liability;
- commercial Production activation of unresolved flows.

## 7. Boundary map

```text
                         MUSTASHAREK
                              |
             +----------------+----------------+
             |                                 |
        NEUTRAL CORE                      REGULATED CORE
             |                                 |
           OPEN                              BLOCKED
             |                                 |
   Identity / Roles                    Money collection
   Profiles                            Settlement / payout
   Scheduling                          Escrow
   Documents                           Commission
   Messaging                           Fee sharing
   CRM / Workspace                     Tax implementation
   Notifications                       Regulated payment flow
   Audit / Governance                  Unvalidated legal claims
```

The boundary is a governance control, not a claim about what Jordanian law ultimately permits.

## 8. Legal Boundary Map — mandatory tests

Before a regulated function is activated, the decision record must resolve, as applicable:

1. Who contracts with the client for the legal service?
2. Who is the licensed professional service provider?
3. Who determines the professional scope and professional judgment?
4. Who determines professional fees?
5. Who issues the applicable invoice/receipt?
6. Who receives and settles professional funds?
7. What is Mustasharek's contractual role?
8. Is any matching/recommendation function permissible and under what conditions?
9. What professional liability remains with the lawyer and what platform liability remains with Mustasharek?
10. What data-controller/processor and confidentiality roles apply?
11. What consumer, refund, dispute and complaint obligations apply?
12. What payment and settlement permissions are required?
13. What tax and e-invoicing treatment follows from the actual contracts and money flow?

## 9. Liability architecture A/B/C/D

### A — Professional Liability

The intended allocation is that the licensed lawyer/service provider bears responsibility for professional legal advice and execution, subject to mandatory law and professional rules. This is an intended model, not a legal conclusion.

### B — Platform Liability

Mustasharek remains responsible for its own technology, contractual promises, representations, security commitments and other obligations imposed by applicable law. A disclaimer cannot be treated as an automatic immunity mechanism.

### C — Data Liability

Data roles, confidentiality, lawful processing, retention, disclosure, incident handling and cross-border processing must be established against the applicable Jordanian data-protection and professional-confidentiality framework.

### D — Payment Liability

Collection, routing, settlement, refunds, chargebacks, payouts and reconciliation remain blocked until the exact legal/payment structure and licensed-provider responsibilities are validated.

## 10. Evidence classification

Every important legal/business conclusion must retain one of the following states:

- `CONFIRMED OFFICIAL EVIDENCE`
- `MARKET OBSERVATION`
- `ENGINEERING HYPOTHESIS`
- `LEGAL QUESTION — UNRESOLVED`
- `REQUIRES JORDANIAN COUNSEL OPINION`

Market examples such as Huqouk, Qada.ai and Mufead are benchmarking evidence only. Their existence or public claims do not prove that Mustasharek may copy their operating model.

## 11. Regulatory chain

The project's minimum regulatory evidence chain remains:

`Corporate Entity / Activities`
→ `Jordanian Legal Profession / Bar Framework`
→ `Tax / Invoicing`
→ `Payment / Settlement Regulation`
→ `Personal Data Protection / Confidentiality`
→ `Consumer / Contract / Dispute Rules`
→ `Qualified Counsel Opinions`
→ `Operating Model Decision`
→ `Technical Constraints`
→ `Implementation`

No single adviser is assumed to authorize the entire model.

## 12. Minimum-Risk Launch Model

The project retains the staged hypothesis:

- **Model A — Lawyer SaaS:** lowest initial coupling to marketplace/payment complexity; lawyer independently provides professional services.
- **Model B — Discovery / connection layer:** client discovery and connection capabilities, subject to professional/advertising/referral validation.
- **Model C — SaaS + Marketplace:** preferred long-term business hypothesis, but not legally adopted until the relevant evidence and counsel opinions are complete.

This sequence is a risk-management hypothesis, not a legal ranking.

## 13. Client & Data Ownership Test

The eventual model must explicitly establish:

- contracting party for professional services;
- ownership/control and access rights over matter data;
- lawyer/client access after account closure;
- portability and export;
- retention and deletion;
- treatment of data when a lawyer leaves the platform;
- platform access required for security and compliance;
- processor/controller responsibilities;
- confidentiality obligations.

No engineering shortcut should silently decide these legal questions.

## 14. Exit / failure scenarios

The architecture must eventually specify safe handling for:

- lawyer account closure or suspension;
- lawyer professional-status change;
- client withdrawal;
- dispute over professional fees;
- payment-provider failure or account freeze;
- refund request;
- chargeback/dispute;
- document access after provider exit;
- platform outage;
- data incident;
- legal/regulatory model change.

Until the applicable operating decision is closed, the financial consequences of these scenarios remain non-operational.

## 15. Legal Decision Record gate

A regulated feature may move from `BLOCKED` toward implementation only when a Legal Decision Record identifies:

- the exact business function;
- the responsible legal/regulatory authority;
- authoritative evidence;
- counsel opinion where required;
- tax/payment implications where applicable;
- contractual allocation;
- data implications;
- implementation constraints;
- verification requirements;
- the approved scope and explicit exclusions.

The engineering team must not convert an unresolved question into a production default.

## 16. Immediate engineering sequence

The next engineering activity is not a speculative rewrite. It is a repository audit followed by a scoped implementation plan:

1. Inventory current application surfaces and packages.
2. Identify existing authentication/identity, client, lawyer, scheduling, documents, messaging, matter and admin capabilities.
3. Identify all existing financial/payment/tax/commission code and mark it against the blocked boundary.
4. Map existing code to the Neutral Core / Regulated Core boundary.
5. Reuse existing verified components rather than rebuilding them.
6. Identify security or authorization gaps in the Neutral Core.
7. Produce a small, reversible implementation backlog.
8. Implement only approved Neutral Core items.
9. Run typecheck/tests/security checks and record evidence.
10. Update this governance branch whenever a material architectural/legal assumption changes.

## 17. Non-negotiable protection for the founder

No architecture can guarantee that the founder has zero legal liability. The defensible objective is to ensure that:

`Lawful Entity + Permitted Activities + Valid Contracts + Correct Professional Structure + Correct Payment/Tax Treatment + Data Compliance + Actual Operational Conduct + Technical Enforcement`

remain aligned.

The platform must never rely on the proposition that a Terms-of-Use checkbox, disclaimer, company label, or SaaS label creates immunity that applicable law does not provide.

## 18. Round 6 acceptance

Round 6 is accepted as the current engineering direction:

> **Build the Neutral Core; keep regulated/commercial behavior blocked; continue the Legal/Regulatory Evidence Track in parallel; make every material decision reversible until validated.**

**Round 6 status:** `ACTIVE — NEUTRAL CORE CONSTRUCTION / REGULATED CORE BLOCKED`

**Runtime change from this document:** `NONE`

**Required next evidence:** repository audit and implementation map before material Neutral Core code changes.