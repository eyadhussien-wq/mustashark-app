# Release-Gate Dependency Map

**Status:** SECURITY HOLD ACTIVE | READ-ONLY | ZERO MUTATION

## Causal chain

`Business / Legal Model`  
→ `Contracts & Roles`  
→ `Tax / Invoicing Model`  
→ `Payment / Settlement Model`  
→ `External Integrations`  
→ `Operational Evidence`  
→ `Release-Bound QA`  
→ `Production Gate`

This is a dependency model, not a statement that every link is legally mandatory in this exact form.

## Classification

### A. Technical Gaps

Items that can ultimately be resolved by engineering after the governing model is approved:

- configurable legal-provider/entity concepts;
- provider adapters;
- payment and settlement interfaces after the approved payment model exists;
- invoice integration after the approved tax/invoicing model exists;
- release-bound tests and verification;
- observability, resilience, performance and security evidence implementation where authorized.

### B. Business / Legal Dependencies

These require decisions or validation outside engineering:

- corporate/legal entity and permitted corporate activities;
- relationship between platform, client, law firm and individual lawyer;
- professional responsibility and permitted advertising/marketing model;
- fee/commission structure and any professional-fee sharing restrictions;
- tax characterization and invoicing responsibility;
- payment collection/settlement authority and provider structure;
- privacy/confidentiality allocation;
- consumer terms, refunds and disputes.

### C. Operational Evidence Gaps

These require real environment evidence rather than source-code claims:

- production observability and alerting;
- DR/restore drills and measured RTO/RPO;
- load/performance benchmarks;
- production security/privacy evidence and external assessment where required;
- final release candidate verification.

## Gate rule

No technical implementation may silently choose an unresolved business/legal answer. Engineering should consume an approved operating model rather than invent one.

## Current gate

🔒 `SECURITY HOLD: ACTIVE`  
👁️ `READ-ONLY: ACTIVE`  
⛔ `ZERO MUTATION: ACTIVE`
