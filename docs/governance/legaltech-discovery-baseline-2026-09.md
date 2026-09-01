# Mustasharek LegalTech Discovery Baseline

**Date:** 2026-09-01  
**Status:** SECURITY HOLD ACTIVE | READ-ONLY | ZERO MUTATION  
**Branch:** `docs/legaltech-discovery-baseline-2026-09`

## Purpose

This document preserves the discovery and governance conclusions reached before the next execution gate. It is a historical engineering baseline, not a legal opinion, regulatory approval, tax ruling, or certification of production readiness.

## Evidence classification

- **CONFIRMED OFFICIAL EVIDENCE** — supported by an identified competent authority/source and preserved with its citation when formally verified.
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

## Critical unresolved questions

- Is the proposed technology-platform/marketplace activity permissible under the Jordanian legal-profession framework and applicable Bar rules?
- Who is legally contracted with the client for the professional service?
- What are the permitted limits of platform marketing, lead generation, commissions, and fee arrangements?
- Who is the service provider and invoice issuer?
- What is the legally and tax-accounting appropriate treatment of platform fees and professional fees?
- May the platform collect or route funds for third parties, and under what licensed/payment-provider structure?
- What privacy, confidentiality, data-processing, retention, and cross-border hosting requirements apply?
- What consumer, refund, dispute, and liability rules apply?

## Golden rule

The project must not use terms such as **Escrow**, **PSP**, **tax treatment**, or **legal intermediary** as established legal facts unless the relevant competent authority or qualified Jordanian counsel has confirmed the exact model.
