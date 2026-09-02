# Mustashark — Role Journey & Boundary Map V1

## Purpose

This document fixes the product relationship between the three application actors:

- Client
- Lawyer
- Admin

It is a product/UX governance document for the Safe Development Track. It does not grant backend authority, change database schemas, alter financial logic, or authorize production changes.

## Core principle

**One shared journey, three different views.**

The actors participate in the same legal-service lifecycle, but each sees only the surfaces and actions appropriate to their role.

```text
CLIENT
Discovery → Request → Proposal/Consultation → Case → Documents/Communication → Outcome

LAWYER
Requests → Review → Proposal/Consultation → Assigned Case → Client/Case Work → Outcome

ADMIN
Operations → Oversight → Verification/Moderation → Exceptions → Audit/Support
```

The relationship is shared, but authority is not shared.

## Role boundaries

| Area | Client | Lawyer | Admin |
|---|---|---|---|
| Discovery | Browse and choose | Professional profile/presentation | Operational visibility only |
| Service request | Create own request | Receive/review eligible requests | Monitor exceptions |
| Proposal | Receive and decide | Create within authorized workflow | Oversight, not substitution |
| Consultation | Attend/use own consultation | Deliver consultation | Operational support only |
| Active case | View own case and permitted data | Work assigned case | Controlled operational oversight |
| Documents | Upload/view permitted documents | View/work permitted case documents | Moderate/support where explicitly authorized |
| Communication | Communicate in permitted matter | Communicate with assigned client | Support/escalation only where authorized |
| Financial presentation | See own permitted financial state | See permitted matter-side state | Operational/reconciliation visibility where authorized |
| Account/security | Manage own account | Manage own professional account | Manage platform operations and controls |

## UX rules

1. A button must represent an action available to the current role.
2. A disabled button must communicate why an action is unavailable when that information is safe to expose.
3. UI state is presentation, not authorization.
4. The client must never see another client's private matter data.
5. The lawyer must never gain access merely because a client-facing route exists.
6. Admin surfaces must not become a hidden substitute for client/lawyer authority.
7. Financial/legal authority remains server-side and outside presentation components.
8. Sensitive state should be read from approved API contracts when connected; mock data may be used only for visual prototyping and must be unmistakable as non-authoritative.
9. Do not create parallel workflows when an existing route can represent the same lifecycle stage.

## Client Legal Hub

The Client Legal Hub is the client-side coordination surface, not a fourth role and not a new business workflow.

It should aggregate:

- current case state
- next action
- permitted documents
- timeline
- communication entry point
- links back into the existing Discovery, Request, and Active Case surfaces

The Hub must not invent routes, financial decisions, legal permissions, or backend state.

## Shared lifecycle mapping

```text
Discovery
  ↓
Service Request
  ↓
Lawyer review / proposal / consultation
  ↓
Client decision
  ↓
Active Case
  ↓
Case Workspace
  ↓
Documents + Timeline + Communication
  ↓
Outcome / closure
```

The same lifecycle is presented differently:

- Client: **What is happening to my matter? What do I need to do next?**
- Lawyer: **What work do I need to perform? What requires my action?**
- Admin: **What requires operational attention, verification, or escalation?**

## Security boundary

The product layer must preserve the following separation:

```text
UI
 ↓
Role-aware API Contract / DTO
 ↓
Server authorization
 ↓
Authoritative domain state
```

Never:

```text
UI → database schema → authority
```

This document therefore governs navigation and presentation only. It does not alter the P3.1-N security constitution or authorize remediation of the known package/schema boundary defect.

## Safe Development acceptance

A role-aware surface is ready for implementation when:

- its actor is explicitly identified;
- its purpose is mapped to the existing lifecycle;
- its routes are real and verified;
- its buttons/actions have a defined role boundary;
- no new authority is introduced in UI code;
- RTL/LTR and accessibility states are considered;
- D02/MAP-X placement is known before feature closure;
- typecheck/tests/CI remain the implementation gates.
