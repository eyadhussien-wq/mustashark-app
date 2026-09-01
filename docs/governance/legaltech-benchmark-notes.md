# Jordan LegalTech Benchmark Notes

**Research round:** 2026-09-01
**Status:** READ-ONLY MARKET RESEARCH — NOT LEGAL APPROVAL
**Evidence class:** MARKET OBSERVATION unless an official source is explicitly identified.

## Purpose

Record public-market examples so future work can distinguish real-world operating patterns from legal approval. An operator's own terms, marketing, or app-store description proves what the operator publicly represents; it does not independently prove licensing, Bar approval, tax treatment, payment authorization, or legality of the same model for Mustasharek.

## Round 3 / Regional Expansion Update

### Huqouk / منصة حقوق — Jordan

The current public site describes Huqouk as a Jordanian digital legal platform for consultations and legal services. It publicly presents lawyer discovery, lawyer matching, in-platform payment, and documented communications. Its public legal-consultation material says the platform is not a law firm and that the legal relationship is between the client and the licensed/accredited lawyer.

Sources:
- https://www.huqouk.com/
- https://www.huqouk.com/lawyers/
- https://www.huqouk.com/legal-consultation

**Evidence:** MARKET OBSERVATION. The public material does not independently establish the underlying corporate registration, Bar approval, payment authorization, or tax treatment.

### Qada.ai — Jordan

Qada.ai publicly describes itself as a technology platform rather than a law firm. Its terms state that registered lawyers are independent service providers and that the legal relationship is directly between citizen and lawyer. Its lawyer-facing material describes verified lawyers, available cases, proposals, client acquisition, profiles/reviews, and legal-workflow tooling.

Sources:
- https://qada.ai/terms
- https://qada.ai/for-lawyers
- https://qada.ai/
- https://qada.ai/about

**Evidence:** MARKET OBSERVATION. This is a strong architecture benchmark but not proof of the legality or tax/payment treatment of any specific feature.

### Mufead / مُفيد — Saudi Arabia

The public Mufead site states that customers submit legal requests and receive offers from licensed lawyers, then choose based on price, rating, and experience. It explicitly says that fees paid inside the app are fees to Mufead for connecting the customer with the lawyer, rather than the lawyer's professional fees. The site identifies Riyadh and displays a commercial-registration number.

Source:
- https://www.mufead.com/

**Evidence:** MARKET OBSERVATION / FIRST-PARTY OPERATOR CLAIM. The displayed registration information was not independently verified against an authoritative Saudi registry during this round, so it must not be treated as registry evidence.

### Qanonline / منصة قانون — regional benchmark lead

The public Qanonline site describes legal consultations and services delivered through licensed lawyers, direct consultations, historical service records, multiple payment options, and a lawyer-facing workflow where lawyers can receive client requests and determine service fees.

Source:
- https://www.qanonline.com/

**Evidence:** REGIONAL MARKET LEAD. Exact jurisdiction, legal entity, payment structure, and regulatory status were not independently verified in this round.

## Official regulatory anchors

### Jordan — payment

The Central Bank of Jordan's official licensing material states that electronic payment/transfer services and operation/management of electronic payment systems are subject to the applicable licensing framework. The licensing guide expressly says it is for guidance and cannot replace the applicable payment and electronic-money-transfer system and instructions.

Sources:
- https://www.cbj.gov.jo/ebv4.0/root_storage/ar/eb_list_page/دليل_الحصول_على_الترخيص_لمزاولة_أنشطة_خدمات_الدفع_والتحويل_الإلكتروني_للاموال.pdf
- https://www.cbj.gov.jo/ebv4.0/root_storage/ar/eb_list_page/4e13f7f5-8bad-413a-8840-f576c24c2eb5.pdf

### Jordan — national e-invoicing

The Income and Sales Tax Department currently publishes the National E-Invoicing System, the 2023 invoicing regulation, joining/integration guidance, invoice-organization guidance, and a technical integration guide.

Sources:
- https://istd.gov.jo/AR/Pages/نظام_الفوترة_الوطني
- https://istd.gov.jo/AR/List/الادلة_الارشادية_لنظام_الفوترة_الوطني

### Jordan — personal data

The Ministry of Digital Economy and Entrepreneurship's legislation listing identifies Personal Data Protection Law No. 24 of 2023 and related implementing instruments. This is directly relevant because a legal platform handles identity, communications, matter files, and potentially sensitive personal data.

Source:
- https://modee.gov.jo/AR/List/القوانين_والأنظمة_و_التعليمات_الصادرة_بمقتضاه

### Saudi Arabia — professional licensing benchmark

The Saudi Ministry of Justice provides an electronic service for lawyer licensing and a practitioner directory/verification service. Its current services page also distinguishes independent law offices and professional law firms.

Sources:
- https://www.moj.gov.sa/ar/eServices/pages/842b98bd-020f-4f2b-ac7d-1f6dd75bfd8e.aspx
- https://www.moj.gov.sa/ar/Ministry/Departments/Mohammah/Pages/Services.aspx

**Benchmark value:** professional eligibility can be represented as a separately verifiable provider credential; platform registration should not be treated as a substitute for professional licensing.

## Final comparison matrix — Round 3

| Platform | Jurisdiction | Operating pattern | Professional relationship publicly described | Payment/fee signal | Independent official entity/regulatory verification in this round | Evidence |
|---|---|---|---|---|---|---|
| Huqouk | Jordan | Digital legal platform / mediation | Client connects with licensed/accredited lawyer; platform says it is not a law firm | In-platform payment and release language | Not obtained | MARKET OBSERVATION |
| Qada.ai | Jordan | LegalTech / AI + lawyer marketplace/workflow | Platform + independent lawyer relationship | Public terms place legal/financial relationship between citizen and lawyer | Not obtained | MARKET OBSERVATION |
| Mufead | Saudi Arabia | Lawyer-request marketplace | Licensed lawyers make offers; customer selects | Public site says in-app fee is platform fee for connection | Operator displays CR data; independent registry record not obtained | MARKET OBSERVATION / FIRST-PARTY |
| Qanonline | Regional / jurisdiction to verify | Legal consultation/services marketplace | Licensed lawyers | Multiple payment options | Not obtained | REGIONAL MARKET LEAD |
| منصة محامي | Jurisdiction to verify | Lawyer-client matching/workflow | Public app listing describes legal matching/services | Not sufficiently verified | Not obtained | SECONDARY MARKET LEAD |

## Mustasharek-specific conclusions

1. The proposed architecture — **independent technology company + separately licensed legal professionals** — is commercially plausible and has current market analogues, especially Huqouk and Qada.ai in Jordan and Mufead in Saudi Arabia.
2. The strongest common pattern is separation of the platform's technology role from the professional lawyer's role. This remains a **market pattern**, not a Jordanian legal approval.
3. Mufead is particularly useful for benchmarking the fee-label question because its own site explicitly distinguishes platform fees from lawyer professional fees. This does not establish the same tax or payment treatment for Mustasharek in Jordan.
4. Lawyer licensing/verification should be modeled as an independent provider credential rather than inferred from the platform company's registration.
5. No benchmark found in this round proves that a Jordanian technology company may lawfully market, facilitate, contract for, collect, settle, or charge commissions around legal services under Mustasharek's exact model.
6. No benchmark found in this round proves PSP licensing, escrow authorization, tax treatment, or Bar approval merely from public claims such as “safe payment”, “licensed lawyers”, “mediation”, or “platform”.

## Round 3 decision state

**Architecture hypothesis:** INTACT — independent Jordanian technology company remains the preferred engineering hypothesis.

**Legal status:** UNRESOLVED — market benchmarks are not legal opinions.

**Payment status:** UNRESOLVED — exact settlement structure requires Jordanian payment-framework validation and provider confirmation.

**Tax/e-invoicing status:** UNRESOLVED — principal/agent, supplier, fee, invoice, and tax treatment must follow the final contractual model.

**Professional-regulation status:** UNRESOLVED — lawyer eligibility and platform/profession boundaries require Jordanian counsel/regulatory confirmation.

**Data/privacy status:** PENDING COUNSEL / COMPLIANCE MAPPING.

**Execution Gate:** CLOSED.

**Security Hold:** ACTIVE.

**Read-Only Research:** ACTIVE.

**Zero Mutation:** ACTIVE for operational code, databases, production, and main.

**Research state:** ROUND 3 / REGIONAL EXPANSION COMPLETE FOR THIS SEARCH PASS — final legal/entity/payment/tax verification remains open.
