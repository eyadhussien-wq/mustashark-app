# Mustasharek — Security & Entitlement Matrix

**Effective:** 2026-09-01  
**Construction branch:** `construction/lawyer-os-v1-p1-audit-2026-09`  
**Status:** `P3.1 — IN PROGRESS`  
**Security Hold:** `ACTIVE`

## 1. Purpose

This matrix defines the Neutral Core security boundary for Lawyer OS v1 and records the separation between:

1. **Authentication** — who is the actor?
2. **Authorization** — is the actor allowed to access this resource?
3. **Entitlement** — is the actor/workspace currently covered by the product plan?

These layers must never be treated as interchangeable.

> `ROLE ≠ AUTHORIZATION`  
> `ID ≠ AUTHORIZATION`  
> `NO RELATIONSHIP = NO ACCESS`  
> `AUTHORIZATION PASS + ENTITLEMENT FAIL ≠ SECURITY DENY`

This is an engineering/security policy, not legal or regulatory certification.

## 2. Neutral Core authorization invariants

- Authorization is resolved server-side from the authenticated actor and resource scope.
- A lawyer may access only clients and Matters explicitly owned/authorized through the Neutral Lawyer ↔ Client relationship boundary.
- A client may access only resources explicitly belonging to or shared with that client.
- A lawyer having the same client as another lawyer does **not** gain access to the other lawyer's Matters, Documents, Messages, or other scoped resources.
- Resource identifiers (`matterId`, `clientId`, `documentId`, etc.) never constitute authorization.
- Request-supplied `lawyerId` must never override the authenticated lawyer identity.
- Sensitive queries should enforce ownership/scope in the database query itself where practical.
- Admin/database privilege does not automatically grant confidential Matter access; privileged access requires an explicit approved policy/grant and audit trail.
- Archived relationships stop new access while preserving historical records according to retention policy.
- Inactive/deleted actors must not retain sensitive operational access merely because an existing JWT has not yet expired.
- Actor state is revalidated server-side; JWT validity alone is insufficient for continued authorization.

## 3. Authorization matrix

| ID | Scenario | Expected result |
|---|---|---|
| AUTHZ-01 | L1 requests a Matter owned by L2 | `DENY` — use `403` or `404` according to existence-disclosure policy |
| AUTHZ-02 | L2 has the same C1 but requests L1's Matter | `DENY` |
| AUTHZ-03 | C1 requests a Matter belonging to another client | `DENY` |
| AUTHZ-04 | C1 requests a Document outside the client's explicit scope | `DENY` |
| AUTHZ-05 | L1 requests a Client without an explicit Lawyer ↔ Client relationship | `DENY` |
| AUTHZ-06 | L1 owns 10 clients | only L1's authorized clients are returned |
| AUTHZ-07 | C1 is related to both L1 and L2 | each lawyer sees only their own authorized scope |
| AUTHZ-08 | L1 archives the relationship with C1 | new sensitive access stops; records are retained |
| AUTHZ-09 | Lawyer account becomes inactive | sensitive access stops |
| AUTHZ-10 | Client becomes inactive/deleted | access stops according to account/retention policy |
| AUTHZ-11 | Attacker tampers with `matterId` | cannot bypass scope authorization |
| AUTHZ-12 | Admin requests confidential Matter content | `DENY` unless an explicit privileged grant exists |
| AUTHZ-13 | Access is attempted using `clientId` alone | `DENY` |
| AUTHZ-14 | Client/request supplies a `lawyerId` | supplied value is not trusted for authorization |
| AUTHZ-15 | Authorization is stale after relationship archival | `DENY` |
| AUTHZ-16 | JWT remains valid after account suspension/deletion | `DENY` after server-side actor-state revalidation |
| AUTHZ-17 | Subscription expires while account remains active | apply SaaS entitlement policy; preserve identity/data and do not destructively delete records |
| AUTHZ-18 | Lawyer is security-authorized but entitlement is expired and attempts a covered mutation | `ENTITLEMENT DENY` — expose a stable `subscription_expired` error; HTTP `402 Payment Required` may be used as transport signaling, but the error code is the application contract |
| AUTHZ-19 | Lawyer's entitlement is expired and requests export of their authorized data | `ALLOW` — Post-Expiration Data Export remains available subject to normal authentication, authorization, scope, retention, and abuse controls |

### 3.1 403 vs 404

`DENY` is the semantic security result. The HTTP status is selected according to whether revealing resource existence is acceptable in that endpoint's threat model.

- Use `404` where hiding existence reduces information disclosure.
- Use `403` where the resource's existence may safely be disclosed and the distinction is useful to the client.
- Do not use `404` merely as a substitute for authorization design.

### 3.2 Existence and timing leakage

Security controls must avoid unnecessary existence leaks through status codes, response bodies, error wording, or materially different database paths.

Indexed and properly scoped queries improve stability and reduce avoidable timing differences, but indexes alone are not a complete timing-attack mitigation. Do not promise artificial constant response time unless a later threat-model decision requires it.

## 4. 30-Day Free Trial — Entitlement Policy

### 4.1 Product decision

Every eligible lawyer/workspace may receive an initial **30-day free trial** with the approved Lawyer OS v1 feature set.

The trial is a **time-based entitlement state**, not a payment flow.

### 4.2 State model

The target conceptual lifecycle is:

```text
TRIAL
  │
  ├── current_time < trial_ends_at
  │       → ENTITLED
  │
  └── current_time >= trial_ends_at
          → EXPIRED
```

The authoritative time comparison is server-side.

### 4.3 Boundary rules

- Trial status must not grant or bypass Authorization.
- Authorization must be evaluated before Entitlement for protected resources.
- Entitlement must not depend on Payment Gateway code during P3.1.
- No payment collection, invoice settlement, wallet, escrow, payout, commission, platform dues, or client-fund authority is introduced by this policy.
- `trial_ends_at` must be determined server-side; the client must not be trusted to calculate or extend it.
- The exact persistence model (lawyer-level vs workspace-level) remains **UNDECIDED pending inspection of the existing Subscription/Workspace architecture**.
- No migration is authorized merely to create these fields before the existing architecture is inspected.

### 4.4 Expiration behavior

Expiration changes **Entitlement**, not identity ownership or authorization relationships.

```text
Identity       → retained
Clients        → retained
Matters        → retained
Documents      → retained
Audit Logs     → retained
Export         → available subject to scope/policy
Entitlement   → EXPIRED
```

The post-expiration mutation policy is a SaaS product decision and may be refined in the commercial phase without deleting Neutral Core data.

## 5. Entitlement failure signaling

For an operation that is otherwise authorized but requires an active entitlement:

```text
Authentication PASS
        ↓
Authorization PASS
        ↓
Entitlement FAIL
        ↓
subscription_expired
```

Recommended application error code:

`subscription_expired`

`402 Payment Required` is an optional HTTP transport signal for this application-level condition. Frontend behavior must rely on the stable error code rather than assuming every future entitlement failure uses the same HTTP status.

This avoids conflating subscription state with RBAC/security denial.

## 6. Post-Expiration Data Export

**Policy:** A lawyer may export the data they are still authorized to access after entitlement expiration.

This is a Neutral Core trust/data-portability principle and is **not** a statement that Mustasharek is thereby legally certified or compliant with GDPR or any particular jurisdiction's law.

Export must remain:

- authenticated;
- lawyer-scoped;
- relationship/scope checked;
- protected against IDOR;
- auditable;
- independent of Marketplace, settlement, wallet, escrow, payout, commission, or client-fund state.

Example boundary:

```text
L1 owns C1 and C2
L2 owns C1

L1 expired
   ↓
L1 may export L1-authorized C1/C2 data
   ↓
L1 must NOT export L2's Matter/data merely because C1 is shared
```

## 7. Graceful Degradation

Subscription expiration must not cause destructive deletion of Neutral Core data.

The commercial policy may later define which actions become read-only or unavailable, but the system should preserve a safe path for:

- viewing information where policy permits;
- exporting authorized data;
- subscription renewal;
- account recovery;
- security/audit operations.

## 8. Security test requirements

P3.1-G must convert this matrix into automated authorization/IDOR evidence, including at minimum:

- cross-lawyer Matter access;
- same-client / different-lawyer isolation;
- client-to-other-client isolation;
- explicit Lawyer ↔ Client ownership requirement;
- `matterId` tampering;
- request-supplied `lawyerId` tampering;
- archived relationship denial;
- inactive actor denial despite otherwise-valid authentication material;
- expired entitlement signaling;
- post-expiration export allowed only within authorized scope.

Expected semantic assertions should use `DENY`/`ALLOW` where possible, with HTTP status assertions kept endpoint-specific.

## 9. Future extensibility

If a single Matter later requires multiple lawyers, introduce an explicit Matter Membership boundary rather than weakening Lawyer ↔ Client ownership.

Potential future shape:

```text
Firm (future)
  → Workspace
    → Members
      → Client Relationship
        → Matter Membership
          → Permissions
```

Firm/Multi-Lawyer collaboration is not introduced by this matrix.

## 10. Hard P3.1 blocks

```text
MARKETPLACE          = BLOCKED
COMMISSION           = BLOCKED
CLIENT_FUNDS         = BLOCKED
ESCROW               = BLOCKED
WALLET               = BLOCKED
SETTLEMENT           = BLOCKED
PAYOUT               = BLOCKED
PLATFORM_DUES        = BLOCKED
FINANCIAL_LEDGER     = BLOCKED
PAYMENT_COLLECTION   = BLOCKED
```

No trial or entitlement implementation may import or become an authority for these domains.

## 11. Governance status

This document records the approved security/entitlement policy. It does **not** authorize a database migration or entitlement middleware implementation yet.

Next controlled step:

1. Inspect the existing Subscription/Workspace architecture on the construction branch.
2. Determine whether an existing neutral ownership boundary can host entitlement state.
3. Choose the minimum safe persistence model based on evidence.
4. Only then consider implementation and tests.

`main` and Production remain untouched.
