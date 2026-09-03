# Mustashark — Safe Development Track V1 — 2026-09

## 1. Purpose

This document defines the product-development lane that can continue while the sovereign security/reference lane remains frozen.

**Base branch:** `safe-development-track-v1-2026-09`

**Pinned starting point:** `d860ef8e2330cbb3b99852e09d49c36d290787de`

This lane does **not** authorize:
- P3.1-J remediation or Resolver Proof.
- Changes to the security/reference branch.
- Production DB access or mutation.
- `main` changes.
- Migrations or schema/package-export remediation.
- Financial/Marketplace authority changes or execution.
- Any security bypass disguised as product work.

The governing rule is: **build the customer experience around contracts and mocks first; connect authoritative backend behavior only through a separately reviewed integration path.**

## 2. Operating model

```text
SAFE PRODUCT TRACK
UI / UX / Design System / Content / Mock Services / Pure Logic / Docs
        ↓
Contract-aware implementation
        ↓
Typecheck / isolated tests / visual QA
        ↓
Security boundary review when imports or APIs change
        ↓
PR / CI / review

SOVEREIGN SECURITY TRACK
P3.1-N / P3.1-J / Resolver / schema exports / migrations
        ↓
FROZEN — independent authorization required
```

## 3. Global product patterns worth bringing to Mustashark

The following ideas are inspired by capabilities visible in leading legal-tech products. They are **product inspirations, not copied implementations** and must be adapted to Jordan/Arab legal workflows and Mustashark's security model.

### A. Secure Client Legal Hub — priority P0

Inspired by the client-portal model used by Clio: a single place for case communications, documents, events, status and client actions. Clio currently emphasizes secure messaging/document sharing, case status, calendar events, invoices and mobile document capture. 

Mustashark version:
- My legal matters.
- Clear matter status timeline.
- Required client actions.
- Secure messages.
- Documents and document requests.
- Upcoming appointments/hearings when authoritative data exists.
- Notifications that explain **what changed and what the user should do next**.
- Arabic-first RTL with English support.

Safe first implementation: UI + mock state + documented DTOs only.

### B. Legal Intake Concierge — priority P0

Inspired by modern legal-service intake flows: turn a vague legal problem into a structured intake before the lawyer interaction.

Mustashark version:
- "What happened?"
- Matter category and subcategory.
- Location/jurisdiction.
- Urgency.
- Key dates.
- Parties involved.
- Optional document upload.
- Desired outcome.
- Smart summary for the lawyer, clearly labelled as a user-provided/AI-assisted summary rather than legal authority.

Security rule: intake UI must not infer authorization, ownership, payment status, or legal conclusions.

### C. Ask a Lawyer + Live Consultation — priority P0

Rocket Lawyer combines asynchronous questions with scheduled attorney consultations; its current product also exposes AI-assisted legal insights. 

Mustashark version:
- Ask a lawyer.
- Choose consultation mode.
- Suggested matter category.
- Attach supporting documents.
- Track request status.
- Schedule a live consultation when the authoritative scheduling service permits it.
- Post-consultation next-step summary.

The UI may simulate the lifecycle in mocks; real booking/payment authority remains backend-controlled.

### D. Lawyer Digital Office / N1 Command Center — priority P0

Build the lawyer experience as a professional operating console rather than a list of CRUD screens.

Core widgets:
- Today's agenda.
- New client requests.
- Active matters.
- Documents requiring review.
- Tasks and deadlines.
- Messages.
- Safety/verification alerts.
- Case activity.
- Workload overview.

This aligns with the existing N1/D02 roadmap while keeping financial authority outside the neutral UI layer.

### E. Matter Timeline / Case Command Center — priority P0

Inspired by legal practice-management systems that centralize contacts, documents, calendar events, notes, tasks and case status.

Mustashark version:
```text
Matter opened
→ Intake
→ Consultation
→ Documents
→ Lawyer actions
→ Client actions
→ Appointments
→ Court/legal milestones
→ Outcome / closure
```

Every event needs a visible state and source-of-truth label. The UI must never manufacture authoritative events.

### F. Smart Document Room — priority P0

Combine secure document exchange patterns with a polished document workspace:
- Scan from camera.
- Upload from device.
- PDF preview.
- Document classification suggestion.
- Required-document checklist.
- Version history presentation.
- Share/access state.
- "Action required" indicators.
- Court/client presentation mode.

Clio currently supports mobile scanning/upload and secure document sharing; Ironclad emphasizes document workflows, electronic acceptance, evidence/snapshots and obligation tracking. 

Mustashark differentiator: **document provenance and security state should be visible without exposing internal database structure.**

### G. Legal Deadline & Obligation Radar — priority P1

Inspired by legal calendaring and obligation-management products.

Features:
- Deadline cards.
- Upcoming legal tasks.
- Client action deadlines.
- Lawyer task ownership.
- Reminder preferences.
- Overdue/at-risk visual state.
- Matter-level obligation list.

Start with mock timelines and pure date/state functions; connect only to approved authoritative APIs later.

### H. AI Legal Copilot — priority P1, safety-sensitive

Global legal-tech products increasingly add AI-assisted legal questions, drafting and contract/document analysis. Rocket Lawyer currently markets Rocket Copilot; Ironclad offers AI-assisted contract workflows. 

Mustashark should differentiate by making AI **bounded and transparent**:
- Summarize uploaded material.
- Extract dates/entities/obligations for review.
- Generate questions for the lawyer.
- Explain legal terminology in plain Arabic.
- Compare document versions.
- Produce a consultation brief.
- Suggest missing information.

Hard boundaries:
- No autonomous legal representation.
- No authoritative case status.
- No financial authorization.
- No fabricated citations or legal sources.
- Show when output is AI-generated.
- Preserve lawyer/user authority over final decisions.

### I. Legal Document Builder + E-Sign — priority P1

Rocket Lawyer emphasizes personalized legal documents and e-signatures; Ironclad emphasizes contract generation, workflows and electronic acceptance. 

Mustashark opportunity:
- Guided templates.
- Arabic/English document generation.
- Version comparison.
- Review-before-sign step.
- Consent/e-sign presentation.
- Evidence/receipt presentation.
- Document vault.

Implementation must respect the existing Terms Consent and legal-representation architecture; do not introduce a parallel consent authority.

### J. Lawyer Discovery with Trust Signals — priority P1

Turn lawyer discovery into a trust-oriented marketplace experience without changing Marketplace authority:
- Verified status.
- Practice areas.
- Languages.
- Location/jurisdiction.
- Experience indicators.
- Availability presentation.
- Reviews where already supported.
- Clear distinction between verified facts and user-generated content.

Do not calculate, approve, settle or mutate marketplace/financial state in the client UI.

### K. Conflict / Safety Check UX — priority P1

Borrow the concept of conflict checking and risk flagging from legal practice-management products, but make Mustashark's implementation security-first:
- Potential conflict warning.
- Identity/verification warning.
- Missing document warning.
- Suspicious/inconsistent workflow warning.
- Escalate-to-admin state.

The UI presents a backend decision; it does not become the authority that makes the decision.

### L. Business Legal Center — priority P1

Rocket Lawyer demonstrates demand for business formation, compliance and recurring legal reminders. 

Mustashark opportunity for the Jordanian market:
- Company/legal setup guidance.
- Compliance calendar.
- Contract/document vault.
- Employment/legal document workflows.
- Trademark/IP journey.
- Lawyer handoff when professional advice is required.

Any jurisdiction-specific filing integration must be separately verified before implementation.

## 4. Mustashark differentiators

We should not attempt to become a clone of Clio/Rocket Lawyer/Ironclad. The stronger strategy is:

1. **Arabic-first legal UX** — RTL is native, not translated afterward.
2. **Lawyer + client + admin unified journey** — one lifecycle rather than disconnected tools.
3. **Trust-visible architecture** — verification, provenance, status and required actions are understandable to users.
4. **Secure legal workspace** — consultation, documents, tasks and communication converge around the matter.
5. **Bounded AI** — useful assistance without allowing AI to become legal/financial authority.
6. **Jordan-first, region-ready** — build jurisdiction-aware abstractions without inventing unsupported integrations.
7. **Security by product design** — client UI never becomes a backdoor into Financial/Marketplace authority.

## 5. Safe Product Development Inventory

| Priority | Workstream | Safe now? | First implementation |
|---|---|---:|---|
| P0 | Client Legal Hub | 🟢 | UI + mocks + states |
| P0 | Legal Intake Concierge | 🟢 | Form + validation + mock submission |
| P0 | Lawyer N1 Command Center | 🟢 | Dashboard shell + mock data |
| P0 | Matter Timeline | 🟢 | Pure state model + UI |
| P0 | Smart Document Room | 🟢 | UI + local/mock documents |
| P0 | Consultation journey | 🟡 | UI first; API contract check before integration |
| P1 | Deadline/Obligation Radar | 🟢 | Pure date/state logic + UI |
| P1 | Trust-oriented Lawyer Discovery | 🟡 | UI first; verify source/API before live data |
| P1 | Conflict/Safety UX | 🟢 | Presentation layer + mock decisions |
| P1 | AI Copilot shell | 🟢 | UX + provider-neutral interface; no authority |
| P1 | Document Builder UX | 🟢 | Template/editor prototype |
| P1 | Business Legal Center | 🟢 | Content/UX prototype |
| P2 | Real external filing integrations | 🔴 | Requires verified APIs and separate authorization |
| P2 | Financial/Marketplace changes | 🔴 | Frozen |
| P2 | DB/schema/export remediation | 🔴 | Frozen |

## 6. Engineering rules for every safe feature

1. UI consumes DTOs/contracts, not Drizzle tables.
2. Mock Services are explicitly named and cannot masquerade as production authority.
3. Financial/Marketplace fields are excluded by contract where not needed.
4. No client-side calculation becomes authoritative financial state.
5. No UI feature may import protected schema surfaces merely for convenience.
6. Prefer pure functions for state machines, formatting, filtering and date logic.
7. Every stateful surface covers: idle, loading, success, empty, error, disabled, pending, conflict and unauthorized where applicable.
8. Arabic/English, RTL/LTR, accessibility and mobile/tablet/desktop behavior are designed from the beginning.
9. Every user-facing feature receives D02 mapping and MAP-X placement before closure.
10. Any uncertain dependency is classified **UNKNOWN** and stopped for review rather than guessed.

## 7. First execution wave

The most productive first wave is:

```text
1. Client Legal Hub
2. Legal Intake Concierge
3. Matter Timeline
4. Smart Document Room
5. Lawyer N1 Command Center
6. Deadline / Obligation Radar
7. Trust-oriented Lawyer Discovery
8. AI Copilot UX shell
```

These create visible product value while avoiding the frozen security-remediation and financial-authority surfaces.

## 8. Definition of Done

A Safe Product feature is not complete merely because the screen renders.

```text
Idea
→ Product scope
→ X/Y/Z/W + lifecycle placement
→ MAP-X
→ D02
→ Repository path verified
→ Contract/mock boundary verified
→ UI states
→ RTL/LTR + accessibility
→ Pure/unit tests where applicable
→ Typecheck
→ Security boundary review
→ CI
→ PR review
→ Merge authorization
→ Verify Main
```

**Important:** this document itself does not authorize merging to `main`, Production access, migrations, or P3.1-J remediation.
