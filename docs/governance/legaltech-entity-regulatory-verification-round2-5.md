# Mustasharek LegalTech Entity & Regulatory Verification — Round 2.5

**Research date:** 2026-09-01  
**Status:** READ-ONLY MARKET / ENTITY RESEARCH — NOT LEGAL APPROVAL  
**Branch:** `docs/legaltech-discovery-baseline-2026-09`  
**Security:** SECURITY HOLD ACTIVE | ZERO MUTATION ACTIVE  

## 1. Purpose

This round attempts to move from public product/marketing observations to first-party and official evidence about the legal entities operating comparable Jordan-market LegalTech platforms.

The governing evidence rule remains strict:

- A platform's own website proves what the operator publicly represents about itself.
- An official registry record is required before recording a corporate fact such as legal name, company number, shareholders, registered purposes, or legal status.
- A payment-provider claim is not evidence of payment licensing or regulatory authorization.
- A disclaimer is not proof that the underlying legal allocation is enforceable.
- Market existence is not regulatory approval for Mustasharek.

## 2. Huqouk / منصة حقوق — first-party evidence

### Confirmed from the operator's public website

Huqouk publicly presents itself as a Jordan-focused digital legal platform. It describes a workflow in which a user describes a legal problem, receives diagnosis/routing, is matched with a lawyer, pays through platform channels, and continues the matter inside the platform.

The platform states that the final legal opinion comes from a licensed lawyer and explicitly says that Huqouk is not a law firm. Its public terms also describe the platform as a digital legal mediation platform connecting clients with accredited lawyers.

Its current public pages additionally state that lawyers are reviewed before public appearance, that the platform has an internal lawyer directory, and that communications and documents are maintained inside the platform.

**Evidence class:** `MARKET OBSERVATION — FIRST-PARTY OPERATOR CLAIM`

### Important financial observation

Huqouk's public site currently advertises payment inside the platform and describes a guarantee/hold model in which payment is released after completion according to platform policy. It also lists Click/CliQ, PayPal, and Visa/Mastercard as payment channels.

**Evidence class:** `MARKET OBSERVATION — FIRST-PARTY OPERATOR CLAIM`

**Do not infer:** PSP licensing, escrow authorization, bank-account structure, split settlement, tax treatment, or ownership of client funds. None of those facts was independently established in this round.

### Corporate identity result

No independently verified corporate registration number, national company number, legal company name, shareholder list, registered purposes, or official corporate-status record for the operator behind Huqouk was obtained from the public first-party pages reviewed in this round.

**Status:** `UNVERIFIED`

This is **not** evidence that no registered entity exists. It means only that the relevant corporate identity has not yet been established from an authoritative registry record.

## 3. Qada.ai — first-party evidence

### Confirmed from the operator's public website

Qada.ai's terms state that it is a technology platform rather than a law firm, that registered lawyers are independent service providers, that the legal relationship is directly between citizen and lawyer, and that financial or contractual agreements are between those parties.

The terms also state that lawyers using the platform must be registered with the Jordan Bar Association and licensed to practice.

Qada's public materials state that the business was founded in Amman in 2024 and present a Jordan-focused LegalTech/AI product. Its lawyer-facing materials describe verified lawyer profiles, client acquisition, case proposals, reviews, and legal-practice tooling.

**Evidence class:** `MARKET OBSERVATION — FIRST-PARTY OPERATOR CLAIM`

### Financial-model observation

The published Qada terms explicitly place the legal relationship and financial/contractual agreements between citizen and lawyer. This makes Qada particularly relevant as an architectural benchmark for separating the technology platform from the professional service relationship.

**Evidence class:** `MARKET OBSERVATION — FIRST-PARTY OPERATOR CLAIM`

**Do not infer:** that this wording proves a particular tax treatment, payment authorization, Bar approval of the commercial model, corporate registration, or enforceability of every disclaimer.

### Corporate identity result

The public Qada.ai pages reviewed identify Amman/Jordan and provide platform contact information, but no independently verified Jordanian corporate registration number, national company number, shareholder list, registered purposes, or official corporate-status record was obtained in this round.

**Status:** `UNVERIFIED`

## 4. Mufead — scope correction

Mufead is a useful marketplace benchmark because its public site describes matching users with licensed lawyers, lawyer offers, pricing, secure communication, and in-app payment language. However, the currently accessible first-party site identifies its contact location as Riyadh, Saudi Arabia and displays a Saudi commercial-registration number.

Therefore Mufead should **not** be treated as a Jordanian entity benchmark in the current Evidence Register.

**Evidence class:** `MARKET OBSERVATION — NON-JORDANIAN / COMPARATIVE ONLY`

This correction supersedes any earlier assumption that Mufead itself was a Jordanian operator.

## 5. Official Jordan registry evidence

The Companies Control Department (CCD) officially provides electronic company-inquiry services including search by company name, partner name, economic purpose/code, trade name, national establishment number, and company number/type. CCD also provides a legal-status inquiry service using the national number.

Sources:
- CCD — Electronic Inquiry Services
- CCD — Company Inquiry
- CCD — Legal Status Inquiry

The official registry is therefore the correct evidence source for Round 2.5 corporate verification.

**Current finding:** the public web/indexed sources available in this research round did not yield a verifiable CCD record tying Huqouk or Qada.ai to a specific Jordanian legal entity. The CCD portal should be queried directly by exact legal/trade name once the operator discloses that name, or through a formal information request where necessary.

**Evidence class:** `CONFIRMED OFFICIAL EVIDENCE` for the existence and function of the registry service; `UNVERIFIED` for the specific comparable entities.

## 6. Official-regulatory interpretation boundary

The existence of a registered technology company would establish corporate registration only. It would not, by itself, establish:

1. permission to practice the legal profession;
2. permission for the company to provide legal advice or representation;
3. permission to collect or settle third-party professional fees;
4. payment-service authorization;
5. tax treatment of gross customer payments versus platform revenue;
6. e-invoicing responsibility; or
7. compliance with professional advertising/fee-sharing rules.

Those questions remain separate regulatory gates.

## 7. Benchmark implications for Mustasharek

The evidence now supports a narrower and stronger architectural hypothesis:

> `Jordanian Technology Entity + Technology Platform + Independently Licensed Legal Professionals`

is a **credible market architecture**, because current Jordan-market platforms publicly describe a separation between the technology platform and the licensed legal professional relationship.

However, the evidence does **not** yet establish that this exact model is legally approved for Mustasharek.

For Mustasharek, the next legal validation should therefore test the exact proposed facts:

- who contracts with the client;
- who provides the legal service;
- who sets professional fees;
- who issues the legal-service invoice/receipt;
- whether the platform receives professional fees or only its own fee;
- whether the platform acts as agent, intermediary, principal, or another legally defined capacity;
- how payment settlement occurs;
- who bears professional liability;
- what marketing and lawyer-acquisition activities the platform may perform; and
- whether any fee-sharing, referral, commission, or client-solicitation arrangement is permitted under the applicable professional rules.

## 8. Evidence classification snapshot

| Finding | Classification | Status |
|---|---|---|
| Huqouk publicly operates a Jordan-focused LegalTech platform connecting users with lawyers | Market Observation / First-Party | Confirmed as operator claim |
| Huqouk publicly says it is not a law firm | Market Observation / First-Party | Confirmed as published representation |
| Huqouk publicly advertises platform payment/hold workflow | Market Observation / First-Party | Confirmed as published representation |
| Huqouk corporate legal identity | Entity Evidence | `UNVERIFIED` |
| Huqouk payment/PSP/escrow authorization | Regulatory Evidence | `UNVERIFIED` |
| Qada.ai publicly says it is a technology platform, not a law firm | Market Observation / First-Party | Confirmed as published representation |
| Qada.ai publicly says lawyers are independent service providers | Market Observation / First-Party | Confirmed as published representation |
| Qada.ai corporate legal identity | Entity Evidence | `UNVERIFIED` |
| Qada.ai payment/tax/Bar regulatory authorization | Regulatory Evidence | `UNVERIFIED` |
| Mufead is a Jordanian operator | Market Observation | **Not supported; current first-party site indicates Saudi Arabia** |
| CCD provides official company/entity inquiry mechanisms | Confirmed Official Evidence | Confirmed |
| Technology-company registration alone establishes full LegalTech legality | Legal Conclusion | **False / not established** |

## 9. Round 2.5 conclusion

Round 2.5 materially improves the evidence quality but does not yet close the entity-verification gate.

The strongest current conclusion is:

**Market precedent exists. Exact Jordanian corporate/regulatory status of the benchmark operators remains unverified. The Mustasharek legal model remains an open dependency requiring Jordanian counsel and, where relevant, tax/payment-regulatory confirmation.**

No production code, financial implementation, database schema, payment integration, tax implementation, or `main` branch was modified as part of this round.

## Sources

- Huqouk: https://www.huqouk.com/
- Huqouk legal consultation / terms content: https://www.huqouk.com/legal-consultation
- Qada.ai terms: https://qada.ai/terms
- Qada.ai about: https://qada.ai/about
- Qada.ai lawyer platform: https://qada.ai/for-lawyers
- Mufead: https://www.mufead.com/
- Jordan Companies Control Department — electronic inquiry services: https://www.ccd.gov.jo/AR/List/خدمات_الاستعلام_الإلكتروني
- Jordan Companies Control Department — company inquiry: https://ccd.gov.jo/AR/Pages/استعلام_الشركات
- Jordan Companies Control Department — legal status inquiry: https://ccd.gov.jo/AR/NewsDetails/اطلاق_خدمة_استعلام_جديدة_وهي__الاستعلام_عن_الوضع_القانوني_للشركة
