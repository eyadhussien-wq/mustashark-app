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
