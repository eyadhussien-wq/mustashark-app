# Mustasharek P1 — Repository Audit
## Lawyer OS v1 Construction Baseline — 2026-09

**Repository:** `eyadhussien-wq/mustashark-app`  
**Audited source:** `main` at commit `93378a1f72517ab3dedd0eef06499d4d8f4094ce`  
**Documentation branch:** `docs/legaltech-discovery-baseline-2026-09`  
**Engineering branch created for subsequent construction:** `construction/lawyer-os-v1-p1-audit-2026-09`  
**Status:** `P1 AUDIT — READ-ONLY FINDINGS RECORDED`  
**Runtime mutation during audit:** `NONE`

> This document is an engineering audit and governance record. It is not a legal, tax, banking, or professional-regulatory opinion.

## 1. Audit objective

Determine what already exists in the repository, separate reusable Neutral Core capabilities from model-dependent legacy behavior, and establish a controlled boundary before construction of `Mustasharek Lawyer OS v1`.

The audit follows the approved classifications:

`REUSE / HARDEN / ISOLATE / QUARANTINE / REPLACE / DEFER`

The audit does **not** delete or rewrite legacy functionality. Financial and marketplace behavior is identified first so it can be isolated safely on the engineering track.

## 2. Repository topology observed

The repository is a pnpm workspace with application packages under `artifacts/*`, shared libraries under `lib/*`, and scripts under `scripts`. The root build/typecheck commands are already centralized in `package.json`, while `pnpm-workspace.yaml` declares the workspace packages. 

Observed top-level/application surfaces include:

- `artifacts/admin-dashboard`
- `artifacts/api-server`
- `artifacts/mustasharek`
- shared `lib/*` packages
- `scripts`
- `.github/workflows`
- `docs`

Evidence: root workspace/build configuration and repository tree were inspected from the audited `main` commit.

## 3. High-confidence legacy financial/regulatory surface

### 3.1 Platform commission

`lib/db/src/schema/platformDues.ts` contains an explicit `PLATFORM_COMMISSION_RATE = "0.15"`, a `platform_dues` table, `grossAmount`, `commissionRate`, `commissionAmount`, and collection state. This is directly incompatible with the initial Lawyer SaaS commercial hypothesis and is therefore classified:

**Classification: `QUARANTINE`**

Evidence: `lib/db/src/schema/platformDues.ts` on `main`.

### 3.2 Representation / escrow / wallet financial domain

`lib/db/src/schema/representationFinance.ts` contains representation quotes, escrow funding modes, escrow accounts, escrow transactions, commission transaction types, commission tiers, lawyer wallets, wallet balances, wallet transactions, and payout-related fields.

**Classification: `QUARANTINE`**

This domain is not part of Lawyer OS v1 and must not be reachable from the Neutral Core runtime path.

### 3.3 Financial services and settlement controllers

The repository contains service/controller surfaces for milestone funding, release, refund and related financial state transitions. Search evidence also identifies explicit escrow, payout, commission and settlement behavior.

**Classification: `QUARANTINE / ISOLATE`**

The code may remain historically available, but no P2 Neutral Core import or route may depend on it.

### 3.4 Existing payment UI

`artifacts/mustasharek/app/payment.tsx` currently presents a consultation payment flow, collects card-form input in the UI, displays escrow language, advertises a 15% platform commission, and describes platform-held funds/release behavior.

**Classification: `QUARANTINE`**

This is a particularly important boundary finding because it is not merely a database artifact: the legacy financial model is visible in the client UI.

### 3.5 Lawyer wallet UI

`artifacts/mustasharek/app/(lawyer)/wallet.tsx` exists and the lawyer navigation includes a wallet surface.

**Classification: `QUARANTINE`**

The wallet must not be part of Lawyer OS v1 navigation or runtime behavior.

## 4. Identity and role model

`lib/db/src/schema/users.ts` currently defines:

- `client`
- `lawyer`
- `admin`

and includes account lifecycle state, authentication-provider state, deletion state, and professional/profile fields.

The same user table also currently contains `hourlyRate`, `rating`, and `reviewsCount`, which are marketplace/professional-discovery semantics rather than pure identity semantics.

**Classification: `HARDEN`**

Decision:

- Preserve the core identity model where it supports Lawyer OS.
- Preserve role separation and authorization boundaries.
- Do not treat `hourlyRate`, ranking/review concepts, or similar discovery semantics as part of the Neutral Core business model.
- Any marketplace meaning must remain behind the P5 decision gate.

This is an architectural hardening task, not an instruction to delete fields during P1.

## 5. Lawyer OS capability inventory

Existing project documentation already describes a lawyer digital-office direction including professional identity, digital law office, clients, documents/evidence, case/matter management, meetings/appointments and secure client communication.

**Classification: `REUSE / HARDEN / EXTEND` depending on the concrete runtime implementation found during P2 planning.**

The target Lawyer OS v1 capability set remains:

1. Identity / Authentication
2. Role-based authorization
3. Lawyer Workspace
4. Clients
5. Matters / Cases
6. Documents
7. Scheduling / Appointments
8. Secure Messaging
9. Notifications
10. Audit Logs
11. Data Export
12. SaaS subscription state abstraction

The audit does not assume that documentation means the runtime capability is complete. Runtime evidence must be verified feature-by-feature during P2.

## 6. Booking / consultation legacy surface

The current repository contains substantial booking/consultation functionality, including client-to-lawyer booking and state-machine logic. Some of this functionality is reusable as scheduling infrastructure, but existing booking flows are intertwined with payment and financial assumptions in parts of the codebase.

**Classification: `HARDEN / ISOLATE`**

Rule:

- Pure scheduling/availability primitives may be reused.
- Any booking path that assumes payment, escrow, commission, payout, platform-held funds, or professional-fee settlement is not Neutral Core.
- P2 must establish a clean scheduling boundary independent of financial state.

## 7. Financial UI and route quarantine rule

The audit found enough evidence to establish a mandatory quarantine target set:

- commission calculations and constants;
- `platform_dues` domain;
- representation-finance domain;
- escrow accounts/transactions;
- lawyer wallet and wallet transactions;
- professional-fee payout/release logic;
- legacy consultation payment screen;
- financial/settlement controller and service paths;
- any UI or route that represents platform collection of client professional fees.

**Classification: `QUARANTINE / ISOLATE`**

No new Neutral Core feature may import these modules.

## 8. UI freeze requirement

Legacy UI may remain in the historical source tree during migration, but it must not appear as an active Lawyer OS v1 commercial surface.

Required P2 treatment:

- remove from active Lawyer OS navigation, or
- place behind an explicit disabled feature gate, or
- move to a clearly isolated legacy/regulatory surface.

The product must not present:

- active escrow;
- platform commission;
- professional-fee collection;
- lawyer wallet/payout;
- revenue sharing;
- marketplace referral pricing;

as available Lawyer OS v1 features.

## 9. Data-export readiness

`Export → Lawyer` is a mandatory v1 architectural requirement.

P1 conclusion:

**Status: `REQUIRES IMPLEMENTATION / VERIFICATION`**

The repository audit did not establish sufficient evidence that a complete lawyer-owned export package already exists. P2 must therefore design and test an export boundary covering, subject to authorization and applicable retention rules:

- lawyer profile/workspace data;
- clients;
- matters/cases;
- documents and metadata;
- appointments;
- relevant communications;
- audit metadata where appropriate.

The export mechanism must not expose another user's data.

## 10. Security / authorization requirements carried into P2

The Neutral Core must use least privilege and explicit ownership checks.

Required P2 controls:

- authenticated access for protected resources;
- role-based authorization;
- lawyer-to-owned-client/matter boundaries;
- client-to-own-data boundaries;
- no generic platform staff access to case content merely because the database permits it;
- auditable sensitive actions;
- secure document access;
- no client/professional money mutation from Neutral Core modules.

## 11. CI and documentation observations

The repository contains extensive CI workflows for earlier booking, financial and security milestones. These workflows are historical implementation evidence and must not be interpreted as authorization to reactivate the associated model.

**Classification: `DEFER / PRESERVE`**

P2 should add or adapt CI checks specifically for Lawyer OS boundaries rather than deleting historical evidence.

## 12. P1 classification summary

| Surface | Classification | P2 treatment |
|---|---|---|
| Identity / auth foundation | `HARDEN` | Verify and reuse |
| Client/lawyer roles | `HARDEN` | Preserve strict separation |
| Lawyer workspace foundations | `REUSE / EXTEND` | Scope into Lawyer OS v1 |
| Scheduling / availability | `HARDEN / REUSE` | Separate from financial state |
| Documents / secure storage | `REUSE / HARDEN` | Verify ownership and access |
| Messaging | `REUSE / EXTEND` | Build secure lawyer-client channel |
| Notifications | `REUSE / EXTEND` | Keep neutral |
| Audit logs | `REUSE / HARDEN` | Security-critical |
| `platform_dues` / 15% commission | `QUARANTINE` | No Neutral Core imports |
| Representation finance | `QUARANTINE` | P5/P6 only |
| Escrow | `QUARANTINE` | P6 blocked |
| Lawyer wallet | `QUARANTINE` | P6 blocked |
| Payment/settlement UI | `QUARANTINE` | Remove from active v1 surface |
| Marketplace/ranking semantics | `ISOLATE / DEFER` | P5 gate |
| Tax/e-invoicing runtime | `DEFER` | P3 validation gate |
| Historical financial CI | `DEFER / PRESERVE` | Do not reactivate |
| Data export | `REQUIRES IMPLEMENTATION` | P2 mandatory |

## 13. P1 security conclusion

### Current risk posture

**The repository is not yet a clean Lawyer OS v1 codebase.** It contains significant legacy financial, escrow, commission, wallet and payment surfaces. This is not a failure of the project; it is precisely the reason P1 exists.

### Required architectural decision

Do **not** rewrite the entire repository.

Instead:

`KEEP VERIFIED CORE → HARDEN → ISOLATE LEGACY → QUARANTINE FINANCIAL MODEL → BUILD LAWYER OS v1`

This preserves prior engineering investment while preventing old assumptions from leaking into the new model.

## 14. P2 entry criteria

P2 may begin only with the following boundaries:

- Neutral Core has no runtime dependency on commission/escrow/wallet/settlement modules.
- Legacy payment and marketplace surfaces are not active Lawyer OS navigation.
- Identity/RBAC ownership boundaries are explicit.
- Data export is included in the v1 architecture.
- SaaS subscription is modeled as a separate commercial layer.
- Professional-fee collection remains blocked.
- Marketplace/referral activation remains blocked.
- Tax/e-invoicing runtime remains behind its validation gate.

## 15. Next controlled action

> **P2 — Mustasharek Lawyer OS v1 Architecture & Boundary Implementation**

First implementation slice:

`Identity/RBAC → Lawyer Workspace → Clients → Matters → Documents → Scheduling → Messaging → Notifications → Audit → Export`

No financial implementation is part of this slice.

## 16. Traceability

This audit is subordinate to:

1. `docs/governance/MUSTASHARK-MASTER-MAP.md`
2. `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md`
3. `docs/governance/legaltech-discovery-baseline-2026-09.md`
4. `docs/governance/MUSTASHAREK-ENGINEERING-GOVERNANCE-MASTER-MATRIX-2026-09.md`

It records the factual repository state used to enter P2 and prevents future discussions from restarting the repository analysis from zero.

**P1 status:** `AUDITED / FINDINGS RECORDED / P2 READY WITH BOUNDARIES`
