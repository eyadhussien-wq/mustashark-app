# Mustasharek LegalTech Discovery Baseline

**Date:** 2026-09-01  
**Status:** SECURITY HOLD ACTIVE | READ-ONLY | ZERO MUTATION  
**Branch:** `docs/legaltech-discovery-baseline-2026-09`

## Purpose

This document preserves the discovery and governance conclusions reached before the next execution gate. It is a historical engineering baseline, not a legal opinion, regulatory approval, tax ruling, or certification of production readiness.

## Evidence classification

- **CONFIRMED OFFICIAL EVIDENCE** — supported by an identified competent authority/source and preserved with its citation/link.
- **MARKET OBSERVATION** — observed from public market examples; not proof of legality or regulatory approval.
- **ENGINEERING HYPOTHESIS** — architectural preference awaiting legal/business validation.
- **LEGAL QUESTION — UNRESOLVED** — requires competent Jordanian legal advice or an official determination.
- **REQUIRES JORDANIAN COUNSEL OPINION** — cannot safely be decided by engineering alone.

## Discovery baseline

The nine readiness evidence contracts were reviewed conservatively. The recurring distinction was maintained between internal engineering foundations and external operational/legal evidence.

1. **Architecture / engineering foundation:** substantially established, subject to normal release-bound verification.
2. **External integrations:** incomplete where provider, contractual, or regulatory dependencies remain open.
3. **Health / liveness:** health/CI evidence is not equivalent to production observability, metrics, alerting, or SLO evidence.
4. **Resilience / recovery:** idempotency, retry safety, transaction/concurrency foundations may exist without proving DR restore drills, RTO, or RPO.
5. **Performance QA:** concurrency correctness is not a load/performance benchmark; P95/P99, throughput, and resource limits require separate evidence.
6. **Security / privacy:** security controls in code do not by themselves constitute a production security assessment, privacy compliance certification, or penetration test.
7. **Compliance:** technical privacy/security controls do not by themselves prove corporate, tax, professional-regulatory, or other external compliance.
8. **Final production QA:** final approval is release-bound and cannot be granted from a different revision or while material release conditions remain unresolved.
9. **Overall readiness:** the matrix remains conservatively **PENDING** until external evidence and dependencies are closed.

## Governance decision

`SECURITY HOLD: ACTIVE`  
`READ-ONLY: ACTIVE`  
`ZERO MUTATION: ACTIVE`

No operational code, production database, financial implementation, tax implementation, or external payment integration is authorized by this baseline.

## Current strategic hypothesis

A **Jordanian independent technology company** owning the Mustasharek platform/IP, with licensed legal professionals providing the professional legal service, remains the preferred architecture hypothesis. It is **not** yet an approved legal structure.

The platform should remain **generic/configurable** and should not be hard-coded to a specific law firm, tax identity, payment provider, or commercial partner before those matters are legally and commercially resolved.

## Market Benchmark — Round 1 update (2026-09-01)

Read-only public research identified current Jordan-market LegalTech examples that materially resemble parts of the proposed architecture.

### Huqouk / منصة حقوق

Huqouk publicly presents itself as a digital legal platform in Jordan. Its public legal-consultation terms describe it as a **digital legal mediation platform**, not a law firm, and describe the legal relationship as being between clients and accredited lawyers. The terms also state that communications, agreement, payment, and service-related document exchange for relationships initiated through the platform remain within the platform.

Sources:
- https://www.huqouk.com/
- https://www.huqouk.com/lawyers/
- https://www.huqouk.com/legal-consultation

**Classification:** `MARKET OBSERVATION`.

### Qada.ai

Qada.ai publicly describes itself as a technology platform rather than a law firm. Its published terms state that registered lawyers are independent service providers and that the legal relationship is directly between citizen and lawyer. Its lawyer-facing material describes verification using Jordan Bar credentials and lawyer/client matching workflows.

Sources:
- https://qada.ai/terms
- https://qada.ai/for-lawyers
- https://qada.ai/how-it-works

**Classification:** `MARKET OBSERVATION`.

### Mufead / مُفيد

Public website and app-store material describes a platform through which users submit legal requests and receive offers from licensed lawyers. The reviewed public material does not independently establish the operator's Jordan corporate, tax, payment, or regulatory structure.

Sources:
- https://www.mufead.com/
- https://play.google.com/store/apps/details?id=com.elmam.mufead&hl=ar

**Classification:** `MARKET OBSERVATION` / verification pending.

### Benchmark conclusion

These examples strengthen the **market plausibility** of a technology-platform/independent-lawyer model. They do **not** establish that Mustasharek is legally approved, nor do they establish the legality of any particular payment, tax, commission, advertising, or professional-regulatory arrangement.

## Official regulatory evidence captured in Round 1

### Payment / settlement

Central Bank of Jordan official licensing material states that electronic payment/transfer services and operation/management of electronic payment systems are subject to the applicable licensing framework and describes substantial requirements for licensed payment companies.

Sources:
- https://www.cbj.gov.jo/ebv4.0/root_storage/ar/eb_list_page/دليل_الحصول_على_الترخيص_لمزاولة_أنشطة_خدمات_الدفع_والتحويل_الإلكتروني_للاموال.pdf
- https://www.cbj.gov.jo/ebv4.0/root_storage/ar/eb_list_page/4e13f7f5-8bad-413a-8840-f576c24c2eb5.pdf

**Confirmed:** a technology-company registration must not be treated as equivalent to a payment-service authorization.

**Unresolved:** whether Mustasharek's intended payment/settlement flow falls inside or outside a regulated activity and what provider structure is appropriate.

### National e-invoicing

The Income and Sales Tax Department currently publishes the National E-Invoicing System, the 2023 invoicing regulation, joining/integration guidance, invoice-organization guidance, and a technical integration guide.

Sources:
- https://istd.gov.jo/AR/Pages/نظام_الفوترة_الوطني
- https://istd.gov.jo/AR/List/الادلة_الارشادية_لنظام_الفوترة_الوطني
- https://istd.gov.jo/AR/List/للانضمام_الى_نظام_الفوترة_الوطني

**Confirmed:** the national e-invoicing framework and implementation guidance exist.

**Unresolved:** who should be the supplier/invoice issuer in Mustasharek's final business model and how platform fees and professional fees are treated.

### Personal-data protection

The Ministry of Digital Economy and Entrepreneurship's current legislation listing identifies Personal Data Protection Law No. 24 of 2023 and related 2025 implementing instruments.

Source:
- https://modee.gov.jo/AR/List/القوانين_والأنظمة_و_التعليمات_الصادرة_بمقتضاه

**Confirmed:** a current Jordanian personal-data protection framework exists.

**Unresolved:** Mustasharek's precise controller/processor roles, legal bases, confidentiality obligations, retention, disclosure, and any cross-border processing/hosting requirements.

## Critical unresolved questions

- Is the proposed technology-platform/marketplace activity permissible under the Jordanian legal-profession framework and applicable Bar rules?
- Who is legally contracted with the client for the professional service?
- What are the permitted limits of platform marketing, lead generation, commissions, and fee arrangements?
- Who is the service provider and invoice issuer?
- What is the legally and tax-accounting appropriate treatment of platform fees and professional fees?
- May the platform collect or route funds for third parties, and under what licensed/payment-provider structure?
- What privacy, confidentiality, data-processing, retention, and cross-border hosting requirements apply?
- What consumer, refund, dispute, and liability rules apply?
- What exact wording and contractual allocation of responsibility is enforceable, and what cannot be achieved merely through a checkbox or disclaimer?

## Golden rule

The project must not use terms such as **Escrow**, **PSP**, **tax treatment**, or **legal intermediary** as established legal facts unless the relevant competent authority or qualified Jordanian counsel has confirmed the exact model.

## Research state

**BENCHMARK ROUND 1 COMPLETE.** The first market/regulatory evidence pass is now recorded. The next read-only research task is deeper entity/registry verification and regulator-specific evidence for the shortlisted Jordanian market examples, followed by formal preparation of the Legal & Regulatory Questions for Jordanian counsel and tax advisers.

## Round 4 — Legal Boundary & Operating Model Analysis (2026-09-01)

Round 4 converts the SaaS/Marketplace discussion into a **Legal Boundary Map**. The purpose is to distinguish platform technology functions from professional legal services, payment/settlement functions, tax/invoicing functions, and data/confidentiality obligations. This is an engineering/governance hypothesis record, not a legal approval.

### Operating-model hypotheses

**Model A — Marketplace / Technology Intermediary**  
Client ↔ Licensed Lawyer, with Mustasharek providing technology, discovery, scheduling, communications and related platform services.

**Model B — Lawyer SaaS**  
Mustasharek provides practice-management SaaS to licensed lawyers/law firms; the lawyer independently contracts with and serves clients.

**Model C — SaaS + Marketplace**  
Mustasharek provides lawyer-facing practice-management SaaS plus a client-facing discovery/booking layer connecting clients to licensed lawyers.

All three remain hypotheses requiring Jordanian legal, tax and regulatory validation.

### Legal Boundary Map — working classification

Potential platform functions, subject to counsel validation:

- software infrastructure and hosting;
- identity/account workflows;
- appointment scheduling;
- secure document transport/storage;
- lawyer practice-management workspaces;
- communications infrastructure;
- notifications and workflow automation;
- operational reporting;
- SaaS subscriptions to professional users;
- technical support and platform administration.

Activities that must **not** be assumed permissible merely from a technology/SaaS label:

- providing legal advice in the platform's own professional capacity;
- legal representation or advocacy;
- professional judgment on behalf of the lawyer;
- unauthorized practice of the legal profession;
- custody/routing of client or third-party funds where licensing or authorization is required;
- asserting a particular tax treatment solely by contract wording;
- guaranteeing correctness of professional legal work;
- assuming regulatory permission merely because a technology company is incorporated.

### Substance-over-label rule

The words **SaaS**, **Marketplace**, **Technology Provider**, **Intermediary**, or **Escrow** do not themselves establish legal status. The actual contracts, money flow, operational conduct, professional activity and representations must be assessed.

### Client relationship test

The final operating model must explicitly resolve:

1. Who contracts with the client for legal services?
2. Who is the professional service provider?
3. Who determines professional scope?
4. Who determines professional fees?
5. Who issues the professional invoice/receipt?
6. Who bears professional responsibility for advice and professional errors?
7. What exactly is Mustasharek's role in acquiring and facilitating the relationship?
8. Can platform administration be performed without exercising professional judgment?
9. What, if any, recommendation or matching function can legally be performed by the platform?

### Liability allocation — A/B/C/D

- **A — Professional Liability:** professional advice/execution is intended to remain with the licensed lawyer/service provider, subject to mandatory law and professional rules. Additional direct platform liability remains unresolved.
- **B — Platform Liability:** Mustasharek remains responsible for obligations arising from its own technology, representations, security commitments and contractual duties. A disclaimer cannot erase non-excludable legal liability.
- **C — Data Liability:** Mustasharek must establish its roles and obligations under Jordanian personal-data law and professional confidentiality requirements, including lawful bases, retention, disclosure, incidents and cross-border processing where applicable.
- **D — Payment Liability:** the payment and settlement model must be mapped to the actual licensed payment provider and contractual flow; the regulatory status of collection, routing, split settlement, refunds and third-party payouts remains unresolved.

### Payment boundary

The working architectural term remains **Payment / Settlement Flow**. The term **Escrow** is not adopted as a legal or technical conclusion. The eventual model must identify the payer, supplier/merchant role where applicable, payment provider, settlement structure, professional entitlement, platform fee, refunds, reconciliation, disputes/chargebacks and regulatory basis.

### Tax and invoicing boundary

No assumption is made that Mustasharek is taxable only on a platform commission. The final model must determine principal/agent characterization, supplier identity, consideration, third-party collections, invoice issuer, platform-fee treatment, professional-fee treatment, applicable taxes and national e-invoicing obligations from the actual arrangement.

### Partner sequencing

A law-firm partnership is not automatically the correct source of independent regulatory validation. Preferred sequence:

1. Jordanian counsel with relevant corporate/technology/legal-profession knowledge validates the operating model.
2. Jordanian tax/accounting adviser validates tax and invoicing treatment.
3. Payment/financial-regulatory specialist or licensed provider validates the money flow where necessary.
4. Only then should a law-firm/provider-network partnership be finalized.

### Liability disclaimer rule

A Terms-of-Use checkbox or disclaimer is a documentation mechanism for an allocation that the law permits; it is not a mechanism for creating immunity that Jordanian law does not recognize. The final wording must be counsel-reviewed and must accurately describe both professional-provider responsibility and platform responsibility.

### Round 4 decision register

| Decision | Status |
|---|---|
| Independent Jordanian technology company | **ENGINEERING / BUSINESS HYPOTHESIS** |
| Marketplace model | **HYPOTHESIS — LEGAL VALIDATION REQUIRED** |
| Lawyer SaaS model | **HYPOTHESIS — LEGAL VALIDATION REQUIRED** |
| SaaS + Marketplace | **HYPOTHESIS — LEGAL VALIDATION REQUIRED** |
| Mustasharek intended as non-law-firm technology platform | **INTENDED OPERATING PRINCIPLE — COUNSEL VALIDATION REQUIRED** |
| Licensed lawyer as professional service provider | **INTENDED MODEL — COUNSEL VALIDATION REQUIRED** |
| Tax only on platform commission | **UNRESOLVED — DO NOT ASSUME** |
| Split settlement permitted | **UNRESOLVED — DO NOT ASSUME** |
| Escrow structure permitted | **UNRESOLVED — DO NOT ASSUME** |
| Liability disclaimer fully excludes platform liability | **UNRESOLVED — DO NOT ASSUME** |

### Round 4 execution-gate impact

Round 4 does **not** open the Execution Gate. No production financial implementation, payment-provider integration, tax/e-invoicing implementation based on assumptions, law-firm-specific hard-coding, production database mutation, `main` changes, production-infrastructure changes, or implementation of unvalidated contractual/legal claims is authorized.

**Round 4 artifact:** `docs/governance/legal-boundary-operating-model-round4-2026-09.md`

**Round 4 status:** `RECORDED — READ-ONLY GOVERNANCE / ARCHITECTURE HYPOTHESIS`.

## Current governance state

`SECURITY HOLD: ACTIVE`  
`READ-ONLY RESEARCH: ACTIVE`  
`ZERO MUTATION: ACTIVE`  
`EXECUTION GATE: CLOSED`
