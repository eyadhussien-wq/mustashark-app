# Mustasharek Governance Decision Log — 2026-09

## Locked decisions / working hypotheses

### D1 — Independent technology company
**Decision class:** ENGINEERING HYPOTHESIS  
Preferred architecture: an independent Jordanian technology company owns the platform, software and IP while licensed legal professionals provide professional services.  
**Not yet:** legal approval or final corporate registration decision.

### D2 — Generic / configurable entity
**Decision class:** ENGINEERING HYPOTHESIS  
Keep legal entity, provider, tax identity, invoice issuer, payment provider and settlement concepts configurable rather than hard-coded to an unresolved commercial partner.

### D3 — No premature Escrow designation
**Decision class:** GOVERNANCE RULE  
Use `Payment / Settlement Flow` as the neutral architecture term until counsel and the relevant financial/payment framework confirm the legally appropriate structure.

### D4 — No assumed tax characterization
**Decision class:** GOVERNANCE RULE  
Do not assume that the platform is taxed only on a commission merely because the platform intends to retain a commission. Tax treatment depends on the actual legal, contractual, invoicing and accounting characterization.

### D5 — No liability-by-checkbox assumption
**Decision class:** GOVERNANCE RULE  
A terms-of-use clause or onboarding checkbox cannot by itself eliminate liability that applicable law assigns to the platform. Responsibility allocation must be legally valid and accurately reflected in contracts and disclosures.

### D6 — Legal model before financial implementation
**Decision class:** GATE  
No final tax, invoicing, collection, split-settlement, payout, or professional-fee implementation should be selected from engineering assumptions alone.

### D7 — Model C preferred long-term hypothesis
**Decision class:** ENGINEERING / BUSINESS HYPOTHESIS  
`SaaS + Marketplace` is the preferred long-term product hypothesis because it combines lawyer practice-management infrastructure with client discovery/connection. It remains subject to Jordanian legal, professional, tax, payment, data and consumer validation and is not approved for commercial activation.

### D8 — Neutral Core construction
**Decision class:** ENGINEERING EXECUTION DIRECTION  
The Neutral Core may be built and hardened on reversible architecture while regulated/commercial functions remain blocked. Permitted scope includes identity, roles, client/lawyer workspaces, scheduling, documents, communications, notifications, matter/workflow foundations, audit and governance capabilities, plus neutral/configurable abstractions with no live regulated transaction.

### D9 — Regulated Core remains blocked
**Decision class:** SECURITY / COMPLIANCE GATE  
Professional-fee collection, third-party fund custody/routing where authorization is required, escrow, split payments, automatic payouts, commission/revenue sharing, assumption-based tax/e-invoicing behavior, unvalidated payment integrations, professional legal advice/representation by Mustasharek, and commercial Production activation remain blocked.

### D10 — Reversible architecture / no destructive commitment
**Decision class:** GOVERNANCE RULE  
The system must not hard-code an unresolved legal operating model. Material business/legal decisions must remain reversible until supported by evidence and the appropriate specialist opinion.

### D11 — Never-return-to-zero documentation rule
**Decision class:** GOVERNANCE RULE  
Every material discussion, research finding, rejected assumption, unresolved question and approved engineering direction must be preserved in Git. Future work must start from the latest baseline and decision log rather than recreating prior reasoning from memory.

## Required legal/regulatory tests preserved

- Regulatory Decision Tree: `ALLOWED / REQUIRES APPROVAL / PROHIBITED`.
- Legal Authority Matrix.
- No Single Advisor Can Authorize the Whole Model.
- Registration vs Permission test.
- Client & Data Ownership Test.
- Exit / Failure Scenario Test.
- Liability Test and A/B/C/D responsibility architecture.
- Contractual Flexibility rule: contracts document lawful allocation; they do not create immunity that law does not provide.
- Evidence Hierarchy: official evidence and specialist opinions outrank market observation and engineering hypothesis.

## Proposed validation sequence

`Jordan Legal & Regulatory Model`  
→ `Commercial Contracts`  
→ `Tax / Invoicing Opinion`  
→ `Payment / Settlement Validation`  
→ `Privacy / Consumer Review`  
→ `Technical Contract`  
→ `Implementation`  
→ `Testing`  
→ `Production QA`

## Parallel execution model

### Construction Track
`OPEN` only for Neutral Core, reversible and non-regulated engineering.

### Legal / Evidence Track
`ACTIVE` for Jordanian regulatory research, entity verification, evidence register, benchmark updates and preparation for specialist counsel.

### Compliance / Financial Track
`BLOCKED` for live collection, settlement, payouts, commission, escrow, tax implementation and unresolved regulated integrations.

## Current security state

`SECURITY HOLD: ACTIVE`  
`READ-ONLY LEGAL/REGULATORY RESEARCH: ACTIVE`  
`ZERO MUTATION: ACTIVE FOR SENSITIVE/RUNTIME/PRODUCTION SYSTEMS`  
`REVERSIBLE CONSTRUCTION: ALLOWED FOR NEUTRAL CORE`  
`LEGAL OPERATING MODEL: PENDING`  
`FINANCIAL / PAYMENT IMPLEMENTATION: BLOCKED`  
`TAX / E-INVOICING IMPLEMENTATION: BLOCKED PENDING VALIDATION`  
`PRODUCTION COMMERCIAL ACTIVATION: BLOCKED`

## Round 6 reference

`docs/governance/neutral-core-construction-round6-2026-09.md`

Round 6 is the current engineering direction: **build the Neutral Core, keep the Regulated Core blocked, continue legal/regulatory evidence in parallel, and preserve reversibility.**

This log intentionally records uncertainty. Unresolved matters remain unresolved until supported by authoritative evidence or qualified Jordanian counsel.
