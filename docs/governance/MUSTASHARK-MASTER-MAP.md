# MUSTASHARK — MASTER MAP

**Status:** CANONICAL GOVERNANCE AUTHORITY — ADOPTED
**Adoption date:** 2026-08-25
**Scope:** governance, roadmap control, cross-map traceability, implementation closure, evidence requirements.

## 01 — Authority hierarchy

`MUSTASHARK-MASTER-MAP` is the highest-level governance reference for the project.

```text
MUSTASHARK-MASTER-MAP  ← highest governance authority
        ↓
      MAP-X             ← integration / control layer
        ↓
Detailed maps            ← authoritative detail by namespace
        ↓
Repository code           ← actual implementation
        ↓
Evidence                  ← mandatory proof of closure
```

The Master Map governs **how work is controlled and closed**. It does not replace the technical authority of a detailed map inside its own namespace.

## 02 — Separation of concerns

Governance is intentionally separated from runtime.

- Governance documents, registries, crosswalks and evidence records live under `docs/`.
- Runtime/application behavior remains under the application source trees.
- Governance artifacts MUST NOT be imported by runtime code, bundled into the application, or made runtime dependencies merely for traceability.
- A governance change is not a runtime change unless a separate implementation change explicitly modifies runtime code.

## 03 — Canonical roles

### MUSTASHARK-MASTER-MAP
The supreme control reference. It defines authority order, closure rules, and the non-negotiable requirement for traceability and evidence.

### MAP-X
The cross-map integration and control layer. It binds roadmap items to roles, lifecycles, design, domain/data/state/security, repository implementation, tests and verification.

### Detailed maps
Detailed maps remain authoritative for their own namespaces and provide the implementation-level detail. They must be linked through MAP-X rather than becoming competing master authorities.

### Code
The repository is the implementation source. Presence of code is not proof of completion.

### Evidence
Tests, CI, security review, diff audit, runtime/preview verification and other declared proof constitute the closure evidence.

## 04 — Mandatory lifecycle

Every governed build item follows:

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

No stage may be skipped because a change appears small.

## 05 — Mandatory closure rule

> **No stage may be marked CLOSED / VERIFIED until it has been implemented, linked to the applicable maps, tested, evidenced, and its closure has been recorded.**

A roadmap entry, documentation statement, passing local command, or code presence alone MUST NOT be treated as closure evidence.

Minimum closure record:

```text
Roadmap ID
→ MAP-X ID
→ applicable role/lifecycle/design mappings
→ repository files
→ implementation status
→ tests
→ security/review status
→ CI status
→ verification evidence
→ final diff audit
→ target-branch verification
→ closure record
```

Any missing required link or proof means `NOT READY FOR CLOSURE`.

## 06 — Authority resolution

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

## 07 — MAP-X control contract

MAP-X is the mandatory integration layer for build work.

Every implementation item must resolve, as applicable, to:

`Roadmap → MAP-X → Role → Lifecycle → Design → Domain/Data/State → Security/Privacy → Repository → Tests/CI → Evidence → Verify Main`

MAP-X identifiers are integration identifiers only and MUST NOT replace existing namespace identifiers.

## 08 — Detailed-map rule

A detailed map may define its own IDs, semantics and verification requirements. It must not silently become a competing master authority.

If two detailed maps conflict, the conflict is registered and resolved through governance/MAP-X; it is not resolved by silently editing one historical source.

## 09 — Evidence rule

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

## 10 — Governance registry

The canonical control set currently includes:

- `docs/governance/MUSTASHARK-MASTER-MAP.md`
- `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md`
- `docs/roadmap/ROADMAP-REGISTRY.md`
- `docs/roadmap/MASTER-AUDIT-MAP.md`
- `docs/roadmap/MASTER-ROADMAP.md` when present
- `docs/design/D02-SURFACE-MASTER-MAP.md` when present
- `docs/design/D02-ROADMAP-CROSSWALK.md`
- `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md`

The list is a governance registry, not a runtime dependency list.

## 11 — Adoption / change control

Any future change to the control model MUST:

1. identify the governing rule being changed;
2. preserve traceability to the prior decision;
3. update this Master Map when authority changes;
4. update MAP-X when cross-map behavior changes;
5. update detailed maps only within their namespaces;
6. provide evidence for implementation changes;
7. record closure only after verification.

No parallel "master" map may silently supersede this document.

## 12 — Current adoption statement

The project formally adopts the following operating model:

- `MUSTASHARK-MASTER-MAP` = highest governance reference.
- `MAP-X` = integration/control layer.
- Detailed maps = sources of namespace detail.
- Code = actual implementation.
- Evidence = mandatory closure condition.
- Governance remains separate from runtime.

**Governance state:** `ADOPTED`
**Runtime impact:** `NONE — DOCUMENTATION / GOVERNANCE ONLY`
