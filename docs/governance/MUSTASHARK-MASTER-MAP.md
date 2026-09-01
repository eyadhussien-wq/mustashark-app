# MUSTASHARK — MASTER MAP

**Status:** CANONICAL GOVERNANCE AUTHORITY — ADOPTED
**Adoption date:** 2026-08-25
**Scope:** governance, roadmap control, cross-map traceability, implementation closure, evidence requirements.

## 01 — Canonical operating hierarchy

The project adopts this hierarchy as the canonical operating model:

```text
                 MUSTASHARK-MASTER-MAP
                          │
                         MAP-X
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Architecture       Product/Lifecycle   Security
        │                 │                 │
     Design          Domain/Data/State    Auth/Privacy
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    Repository Code
                          │
                    CI / Evidence
                          │
                  CLOSED / VERIFIED
```

This hierarchy answers the project's primary control question: **where are we, where do we stand, what is proven, and what remains?**

## 02 — Authority hierarchy

`MUSTASHARK-MASTER-MAP` is the highest-level governance reference for the project.

`MAP-X` is the integration and control layer.

Detailed maps are authoritative for their own namespaces and provide implementation-level detail. They are linked through MAP-X and do not silently become competing master authorities.

Repository code is the actual implementation source. Presence of code is not proof of completion.

CI and other declared Evidence prove the state of implementation. `CLOSED / VERIFIED` is a controlled outcome, not an assumption.

## 03 — Separation of concerns

Governance is intentionally separated from runtime.

- Governance documents, registries, crosswalks and evidence records live under `docs/`.
- Runtime/application behavior remains under the application source trees.
- Governance artifacts MUST NOT be imported by runtime code, bundled into the application, or made runtime dependencies merely for traceability.
- A governance change is not a runtime change unless a separate implementation change explicitly modifies runtime code.

## 04 — Canonical roles

### MUSTASHARK-MASTER-MAP
The supreme control reference. It defines authority order, closure rules, and the non-negotiable requirement for traceability and evidence.

### MAP-X
The cross-map integration and control layer. It binds roadmap items to architecture, product/lifecycle, design, domain/data/state, security/auth/privacy, repository implementation, CI and verification.

### Architecture / Product-Lifecycle / Security
The primary structural branches of the operating hierarchy. Their detailed maps remain authoritative within their namespaces.

### Design / Domain-Data-State / Auth-Privacy
The principal detail layers underneath the corresponding branches and must remain traceable through MAP-X.

### Repository Code
The implementation source. Code proves what exists; it does not by itself prove that the work is verified or closed.

### CI / Evidence
The proof layer. Evidence may be reused when it remains valid for the exact implementation being closed; otherwise the affected verification must be refreshed.

### CLOSED / VERIFIED
The final controlled state, reached only when all applicable mapping, implementation, review, verification and evidence requirements are satisfied and recorded.

## 05 — Mandatory lifecycle

Every governed build item follows:

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

No stage may be skipped because a change appears small.

## 06 — Mandatory closure rule

> **No stage may be marked CLOSED / VERIFIED until it has been implemented, linked to the applicable maps, tested as applicable, evidenced, verified, and its closure has been recorded.**

A roadmap entry, documentation statement, passing local command, or code presence alone MUST NOT be treated as closure evidence.

Minimum closure record:

```text
Roadmap ID
→ MAP-X ID
→ applicable hierarchy/map mappings
→ repository files / commit
→ implementation status
→ applicable tests
→ security/review status
→ CI status
→ verification evidence
→ final diff audit
→ target-branch verification
→ closure record
```

Any missing required link or proof means `NOT READY FOR CLOSURE`.

## 07 — Evidence validity and reuse

The purpose of Evidence is to preserve verified project state and prevent unnecessary rework.

- **VALID → REUSE:** Existing evidence may be reused when it is traceable to the exact implementation/commit or an equivalent unchanged artifact and remains applicable to the closure decision.
- **STALE / INSUFFICIENT → REFRESH:** Only the affected verification must be refreshed when the existing evidence no longer proves the required state.
- **FAILED → BLOCK CLOSURE:** Failed evidence cannot be converted into PASS by inference or by ignoring the failure.

A newly adopted governance rule does not, by itself, invalidate previously valid evidence. A material implementation change, scope change, security concern, or evidence-expiry rule may require fresh verification.

## 08 — Authority resolution

When sources disagree, use this order unless a stronger governance/legal decision record explicitly overrides it:

1. Governance / legal-regulatory decision record
2. Financial/legal foundation for financial/legal behavior
3. Product lifecycle maps
4. Role architecture and product namespaces
5. Design foundation for visible presentation
6. Domain / Data / State / Security models
7. Repository implementation
8. Tests and runtime evidence

Historical maps are preserved as lineage; they are not silently rewritten into a new authority.

## 09 — MAP-X control contract

MAP-X is the mandatory integration layer for build work.

Every implementation item must resolve, as applicable, to:

`Roadmap → MAP-X → Architecture/Product-Lifecycle/Security → Design/Domain-Data-State/Auth-Privacy → Repository → Tests/CI → Evidence → Verify Main → Closure`

MAP-X identifiers are integration identifiers only and MUST NOT replace existing namespace identifiers.

## 10 — Detailed-map rule

A detailed map may define its own IDs, semantics and verification requirements. It must not silently become a competing master authority.

If two detailed maps conflict, the conflict is registered and resolved through governance/MAP-X; it is not resolved by silently editing one historical source.

## 11 — Evidence rule

Evidence must be specific enough to reproduce the closure decision. Depending on the stage, evidence may include:

- test output;
- typecheck/build output;
- security verification;
- API/integration/E2E results;
- concurrency/idempotency results;
- CI status;
- visual/accessibility/RTL verification;
- final diff audit;
- target-branch verification;
- runtime/preview proof.

`PASS` is not inferred from the absence of an error message. The actual result must be recorded.

## 12 — Governance registry

The canonical control set currently includes:

- `docs/governance/MUSTASHARK-MASTER-MAP.md`
- `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md`
- `docs/roadmap/ROADMAP-REGISTRY.md`
- `docs/roadmap/MASTER-AUDIT-MAP.md`
- `docs/roadmap/MASTER-ROADMAP.md` when present
- `docs/design/D02-SURFACE-MASTER-MAP.md` when present
- `docs/design/D02-ROADMAP-CROSSWALK.md`
- `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md`
- `docs/governance/legaltech-discovery-baseline-2026-09.md`
- `docs/governance/decision-log-2026-09.md`
- `docs/governance/neutral-core-construction-round6-2026-09.md`

The list is a governance registry, not a runtime dependency list.

## 13 — Adoption / change control

Any future change to the control model MUST:

1. identify the governing rule being changed;
2. preserve traceability to the prior decision;
3. update this Master Map when authority changes;
4. update MAP-X when cross-map behavior changes;
5. update detailed maps only within their namespaces;
6. provide evidence for implementation changes;
7. record closure only after verification.

No parallel "master" map may silently supersede this document.

## 14 — Current adoption statement

The project formally adopts the following operating model:

- `MUSTASHARK-MASTER-MAP` = highest governance reference.
- `MAP-X` = integration/control layer.
- Architecture / Product-Lifecycle / Security = primary structural branches.
- Design / Domain-Data-State / Auth-Privacy = detail layers.
- Repository Code = actual implementation.
- CI / Evidence = proof layer.
- `CLOSED / VERIFIED` = controlled final state.
- Valid Evidence may be reused when still applicable; stale or insufficient Evidence is refreshed only where needed.
- Governance remains separate from runtime.

## 15 — Current LegalTech construction gate

The project now formally records the following current state:

- `SECURITY HOLD = ACTIVE` for sensitive functions.
- `LEGAL / REGULATORY RESEARCH = ACTIVE`.
- `ZERO MUTATION = ACTIVE` for production, financial, regulatory and sensitive operational systems.
- `REVERSIBLE CONSTRUCTION = ALLOWED` only for the Neutral Core.
- `REGULATED / COMMERCIAL CORE = BLOCKED` until the applicable legal, tax, payment and professional-regulatory evidence is closed.
- `LEGAL OPERATING MODEL = PENDING`.
- `PRODUCTION COMMERCIAL ACTIVATION = BLOCKED`.

The Neutral Core may include identity, roles, client/lawyer workspaces, scheduling, documents, communications, notifications, matter/workflow foundations, audit/governance capabilities and neutral configurable abstractions. The presence of an abstraction is not authorization for a regulated transaction.

The blocked boundary includes professional-fee collection on behalf of lawyers, third-party fund custody/routing where authorization is required, escrow, split payments, automatic payouts, commission/revenue sharing, assumption-based tax/e-invoicing behavior, unvalidated regulated payment integrations, professional legal advice/representation by Mustasharek itself, and law-firm-specific hard-coding before the operating model is validated.

The governing Round 6 artifact is `docs/governance/neutral-core-construction-round6-2026-09.md` and the detailed discovery history is preserved in `docs/governance/legaltech-discovery-baseline-2026-09.md` and `docs/governance/decision-log-2026-09.md`.

**Runtime impact:** `NONE — GOVERNANCE/DOCUMENTATION ONLY`.
