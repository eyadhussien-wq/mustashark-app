# Mustasharek — Round 4: Legal Boundary & Operating Model Analysis

**Date:** 2026-09-01  
**Status:** SECURITY HOLD ACTIVE | READ-ONLY RESEARCH | ZERO MUTATION  
**Branch:** `docs/legaltech-discovery-baseline-2026-09`

> **Scope notice:** This document is a discovery and architecture record. It is not a legal opinion, regulatory approval, tax ruling, Bar authorization, payment license, or production authorization.

## 1. Purpose

Round 4 converts the earlier SaaS/Marketplace discussion into a **Legal Boundary Map**. The objective is not to declare the preferred model legal, but to identify the exact activities that require validation before the business model or technical implementation is approved.

## 2. Current operating-model hypotheses

### Model A — Marketplace / Technology Intermediary

Client ↔ Licensed Lawyer  
Mustasharek = technology, discovery, scheduling, communication and other platform services.

**Hypothesis:** strongest separation between platform technology and professional legal service, subject to Jordanian legal-profession, advertising, consumer, tax and payment validation.

### Model B — Lawyer SaaS

Licensed Lawyer/Law Firm ↔ Mustasharek SaaS  
Mustasharek provides practice-management software; the lawyer independently contracts with and serves clients.

**Hypothesis:** potentially the cleanest technology-service boundary if the platform does not itself perform regulated professional functions. Still requires validation of data, confidentiality, advertising, payment and any client-facing functionality.

### Model C — SaaS + Marketplace

Mustasharek provides lawyer-facing practice-management SaaS **and** a client-facing discovery/booking layer connecting clients to licensed lawyers.

**Hypothesis:** potentially the strongest commercial model, but also the model requiring the most careful boundary analysis because the platform participates in both professional-workflow infrastructure and customer acquisition.

## 3. Legal Boundary Map

The following are **questions/controls**, not conclusions.

### Platform may potentially provide

- Software infrastructure and hosting.
- User account and identity workflows.
- Appointment scheduling and availability management.
- Secure document transport/storage subject to data-protection and confidentiality requirements.
- Case/workspace administration software for the lawyer.
- Communications infrastructure.
- Technical notifications and workflow automation.
- Reporting and operational dashboards.
- Subscription/SaaS services to professional users.
- Technical support and platform administration.

### Platform must not be assumed to provide without explicit legal validation

- Legal advice or legal opinions in its own name.
- Legal representation or advocacy.
- Professional legal judgment on behalf of a lawyer.
- Unauthorized practice of the legal profession.
- Binding professional decisions that belong to the licensed lawyer.
- Client-money custody or third-party settlement activity where licensing/authorization may be required.
- Tax treatment merely by contractual label.
- A guarantee that a lawyer's professional work is correct.
- Any regulatory permission merely because the company is incorporated as a technology company.

## 4. Substance-over-label rule

Using labels such as **SaaS**, **Marketplace**, **Technology Provider**, **Intermediary**, or **Escrow** does not itself determine legal status. The final assessment must follow the actual contractual, financial, operational and professional conduct of the parties.

Accordingly, no architecture label in this document is an approval.

## 5. Client relationship test

The final model must explicitly answer:

1. Who contracts with the client for legal services?
2. Who is the professional service provider?
3. Who determines the professional scope of work?
4. Who determines the professional fee?
5. Who issues the professional invoice/receipt?
6. Who is responsible for professional advice and professional errors?
7. What role does Mustasharek play in acquiring, routing or facilitating the client relationship?
8. Can Mustasharek terminate or restrict a professional account for platform reasons without exercising professional judgment?
9. Does the platform ever make a professional recommendation to a client, and on what legally permissible basis?

## 6. Liability allocation — A/B/C/D

### A — Professional Liability

Primary professional responsibility should be assessed against the licensed lawyer/service provider, subject to mandatory Jordanian law and professional rules.

**Unresolved:** whether any platform activity creates additional direct liability despite contractual allocation.

### B — Platform Liability

Mustasharek remains responsible for obligations arising from its own technology, representations, security commitments, consumer-facing promises and contractual duties.

**Rule:** a disclaimer cannot erase liability that cannot legally be excluded.

### C — Data Liability

Mustasharek must establish its actual role(s) under Jordanian personal-data law and any professional confidentiality requirements.

**Unresolved:** controller/processor allocation, lawful bases, retention, deletion, disclosure, incident handling, cross-border processing/hosting, and access controls.

### D — Payment Liability

Payment and settlement responsibilities must be mapped to the actual licensed payment provider and contractual flow.

**Unresolved:** whether any proposed collection, routing, split settlement, refunds, balances or third-party payouts constitute regulated activity or require a specific licensed structure.

## 7. Payment boundary

Do not use **Escrow** as an established design decision.

The working architectural term remains:

`Payment / Settlement Flow`

The final model must identify:

- payer;
- merchant/supplier of record, if applicable;
- payment service provider;
- settlement account structure;
- professional entitlement;
- platform fee;
- refund authority;
- reconciliation responsibility;
- chargeback/dispute responsibility;
- applicable licensing/contractual basis.

No production payment implementation is authorized by this document.

## 8. Tax and invoicing boundary

No assumption is made that Mustasharek is taxed only on a platform commission.

The final tax model must be determined from the actual legal and commercial arrangement, including:

- principal vs agent characterization;
- supplier/service-provider identity;
- contractual consideration;
- collection for third parties;
- invoice issuer;
- platform-fee treatment;
- professional-fee treatment;
- VAT/sales-tax implications where applicable;
- income-tax treatment;
- national e-invoicing obligations.

## 9. Partner / law-firm boundary

A law-firm partner is not automatically the correct source of independent regulatory validation.

Recommended sequencing remains:

1. Jordanian counsel with relevant corporate/technology/legal-profession knowledge validates the business model.
2. Jordanian tax/accounting adviser validates the tax and invoicing model.
3. Payment/financial-regulatory specialist or licensed provider validates the money flow where needed.
4. Only then should Mustasharek finalize a law-firm/provider-network commercial partnership.

## 10. Legal validation evidence standard

A future approval should not rely on a generic statement such as “the application is legal.”

The evidence package should identify:

- exact business activities;
- exact corporate purposes/objects;
- exact client relationship;
- exact professional relationship;
- exact money flow;
- exact tax/invoicing treatment;
- exact data roles;
- exact contractual liability allocation;
- applicable statutes/regulations/rules;
- source authority or written professional opinion;
- assumptions and limitations;
- date and jurisdiction of the opinion.

## 11. Important correction to the “liability disclaimer” idea

A registration checkbox or Terms-of-Use clause should **document** an enforceable allocation of responsibilities; it must not be treated as a mechanism for creating immunity that Jordanian law does not recognize.

The platform may state that the licensed lawyer is responsible for professional advice where legally appropriate, but the wording must be validated and must not misrepresent the platform's own responsibilities.

## 12. Decision status

| Decision | Status |
|---|---|
| Independent Jordanian technology company | **ENGINEERING / BUSINESS HYPOTHESIS** |
| Marketplace model | **HYPOTHESIS — LEGAL VALIDATION REQUIRED** |
| Lawyer SaaS model | **HYPOTHESIS — LEGAL VALIDATION REQUIRED** |
| SaaS + Marketplace | **HYPOTHESIS — LEGAL VALIDATION REQUIRED** |
| Mustasharek is not a law firm | **INTENDED OPERATING PRINCIPLE — COUNSEL VALIDATION REQUIRED** |
| Lawyer is professional service provider | **INTENDED MODEL — COUNSEL VALIDATION REQUIRED** |
| Platform commission taxed only on commission | **UNRESOLVED — DO NOT ASSUME** |
| Split settlement is permitted | **UNRESOLVED — DO NOT ASSUME** |
| Escrow structure is permitted | **UNRESOLVED — DO NOT ASSUME** |
| Liability disclaimer fully excludes platform liability | **UNRESOLVED — DO NOT ASSUME** |

## 13. Execution Gate impact

Round 4 does **not** open the Execution Gate.

The following remain prohibited under the current hold:

- production financial implementation;
- payment-provider integration;
- tax/e-invoicing implementation based on assumptions;
- law-firm-specific hard-coding;
- production database mutation;
- changes to `main`;
- changes to production infrastructure;
- implementation of contractual/legal claims before counsel validation.

## 14. Next evidence gate

The next step is to convert this boundary map into a **Jordanian Legal & Regulatory Questions v1** package and obtain written professional validation against the actual proposed operating model.

The benchmarked market examples remain evidence of **market practice only**, not evidence of legal permission.

## 15. Final governance statement

**SECURITY HOLD: ACTIVE**  
**READ-ONLY RESEARCH: ACTIVE**  
**ZERO MUTATION: ACTIVE**  
**EXECUTION GATE: CLOSED**

Round 4 is therefore recorded as a governance and architecture artifact only. It authorizes no operational implementation.
