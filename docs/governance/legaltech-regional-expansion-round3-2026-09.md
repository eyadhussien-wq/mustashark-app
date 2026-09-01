# Mustasharek LegalTech — Regional Expansion & Final Matrix

**Date:** 2026-09-01
**Branch:** `docs/legaltech-discovery-baseline-2026-09`
**Mode:** READ-ONLY RESEARCH
**Security Hold:** ACTIVE
**Zero Mutation:** ACTIVE for operational code, databases, production, and `main`
**Purpose:** Record Round 3 market benchmarking and regulatory anchors without converting market observations into legal approval.

## 1. Executive result

Round 3 confirms that Mustasharek's preferred engineering hypothesis — an independent technology company operating a platform while licensed legal professionals provide the professional service — has current market analogues in Jordan and the region.

This is **commercial/architectural evidence, not legal approval**.

The most relevant live examples reviewed are:
- Huqouk / منصة حقوق — Jordan
- Qada.ai — Jordan
- Mufead / مُفيد — Saudi Arabia
- Qanonline / منصة قانون — regional benchmark lead

## 2. Benchmark observations

### Huqouk — Jordan

The public site presents Huqouk as a digital legal platform that helps users request consultations, find lawyers, and follow legal services. Its public pages describe lawyer discovery, matching, in-platform payment, and documented communications. Its legal-consultation material states that the platform is not a law firm and that the legal relationship is with the licensed/accredited lawyer.

**Classification:** MARKET OBSERVATION.

**Not established:** official corporate registration, Bar approval, exact payment authorization, tax treatment, or regulator approval of the exact model.

### Qada.ai — Jordan

Qada.ai's published terms describe it as a technology platform, not a law firm. They describe registered lawyers as independent service providers and state that the legal relationship is directly between citizen and lawyer. Its lawyer-facing product also includes case proposals, client acquisition, profiles/reviews, and legal workflow tools.

**Classification:** MARKET OBSERVATION.

**Not established:** independent regulatory approval, tax treatment, payment structure, or legality of every feature.

### Mufead — Saudi Arabia

Mufead's public site states that customers submit legal requests and receive offers from licensed lawyers, then select according to price, rating, and experience. It expressly states that fees paid in the application are fees to the platform for connecting the customer with the lawyer, rather than the lawyer's professional fees. The site identifies Riyadh and displays a commercial-registration number.

**Classification:** MARKET OBSERVATION / FIRST-PARTY OPERATOR CLAIM.

**Important:** the displayed registration information was not independently verified against an authoritative Saudi registry during this round.

### Qanonline — regional lead

The public Qanonline site describes legal consultations and services through licensed lawyers, direct consultations, historical records, multiple payment options, and a lawyer-facing workflow for incoming client requests and service fees.

**Classification:** REGIONAL MARKET LEAD.

**Not established:** exact jurisdiction/entity/regulatory/payment structure.

## 3. Official regulatory anchors

### Jordan payment framework

Official Central Bank of Jordan material states that electronic payment/transfer services and operation/management of electronic payment systems are governed by a licensing framework. The licensing material also warns that the guide is for guidance and does not replace the governing payment system and instructions.

### Jordan national e-invoicing

The Income and Sales Tax Department publishes the National E-Invoicing System, joining/integration guidance, invoice-organization guidance, and a technical integration guide.

### Jordan personal data

The Ministry of Digital Economy and Entrepreneurship lists Personal Data Protection Law No. 24 of 2023 and related implementing instruments.

### Saudi professional licensing benchmark

The Saudi Ministry of Justice provides lawyer licensing and practitioner-verification services and distinguishes independent law offices and professional law firms.

## 4. Final comparison matrix

| Platform | Market | Model | Professional role | Fee/payment signal | Official verification obtained in Round 3 | Evidence class |
|---|---|---|---|---|---|---|
| Huqouk | Jordan | Legal platform / mediation | Licensed/accredited lawyer | In-platform payment/release language | No | MARKET OBSERVATION |
| Qada.ai | Jordan | LegalTech / AI + lawyer workflow | Independent lawyer relationship | Terms distinguish citizen-lawyer financial/contractual relationship | No | MARKET OBSERVATION |
| Mufead | Saudi Arabia | Lawyer-request marketplace | Licensed lawyer offers | Platform fee publicly distinguished from lawyer professional fee | No independent registry record obtained | MARKET OBSERVATION / FIRST-PARTY |
| Qanonline | Regional | Legal services marketplace | Licensed lawyers | Multiple payment options | No | REGIONAL MARKET LEAD |
| منصة محامي | Jurisdiction to verify | Lawyer-client matching | Lawyers | Insufficient evidence | No | SECONDARY MARKET LEAD |

## 5. What this means for Mustasharek

### Supported as an engineering hypothesis

- Independent technology entity owning the platform/IP.
- Separately verified licensed legal providers.
- Clear separation between platform functionality and professional legal judgment.
- Provider credential/verification as a distinct domain concept.
- Configurable payment, settlement, tax, invoice, and legal-provider roles.

### Still legally unresolved

- Whether the exact Jordanian company activity and marketplace model are permitted under the laws governing the legal profession.
- Whether and how a platform may advertise, market, match, or charge a fee around legal services.
- Whether any commission/share model is permitted and under what contractual form.
- Who is principal/agent/service provider in the customer contract.
- Who issues which invoice and how platform fees and professional fees are treated for Jordanian tax/e-invoicing purposes.
- Whether the proposed settlement flow constitutes a regulated payment activity or can be implemented through a licensed provider under a compliant merchant/marketplace arrangement.
- Allocation of professional, platform, data, consumer, refund, and payment liabilities.

## 6. Strategic conclusion

The market benchmark **strengthens the plausibility** of the Mustasharek architecture but does not certify it.

The correct next gate is not more code. It is a written Jordanian legal/regulatory/tax determination against Mustasharek's exact proposed operating model, supported where appropriate by official regulator confirmation and payment-provider documentation.

The benchmark must therefore remain classified as evidence for **design direction**, not evidence of **legal authorization**.

## 7. Gate status

- 🔒 `SECURITY HOLD: ACTIVE`
- 👁️ `READ-ONLY RESEARCH: ACTIVE`
- ⛔ `ZERO MUTATION: ACTIVE`
- 🚫 `EXECUTION GATE: CLOSED`
- 🟡 `LEGAL MODEL: PENDING`
- 🟡 `PAYMENT MODEL: PENDING`
- 🟡 `TAX/E-INVOICING MODEL: PENDING`
- 🟡 `PROFESSIONAL-REGULATION MODEL: PENDING`

**Final evidence rule:** Never convert a platform's public claim into “licensed”, “approved”, “legal”, “PSP”, “escrow”, or “tax-compliant” status without authoritative evidence establishing that specific fact.
