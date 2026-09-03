# E01-C — Legal Data Isolation Audit

Date: 2026-09-03  
Branch: `security/e01-foundation-2026-09-03`

## Objective

Prove that legal data is isolated by object ownership and relationship membership, independently of route-level authentication. The audit covers legal-representation documents, cases/matters, hearings and document handover boundaries.

## Evidence inspected

### Legal-representation documents

- Document lookup is first resolved by `documentId`, then its `agreementId` is loaded from database state.
- Access is enforced against the parent agreement: clients must own the agreement and lawyers must be the agreement lawyer; admin is the explicit platform-wide exception.
- Upload permissions are role/type constrained: client may upload POA; lawyer may upload court proof/expert report; admin is allowed.
- Submit, review, verify, reject and supersede operations re-check agreement access before mutation.
- Submit additionally binds the actor to the original uploader unless the actor is admin.
- Listing is scoped by `agreementId` only after the agreement itself passes the actor access check.
- Superseded documents retain the same parent agreement and previous case linkage, preserving lineage rather than allowing caller-controlled reassignment.

Conclusion: no confirmed cross-agreement document access defect was proven in the inspected service.

### Cases / matters

Existing E01-A controller findings record that case creation verifies agreement actor ownership, confirmed agreement, active lawyer state and current professional verification. Case reads enforce owner/member/admin access and transitions enforce role-specific actor ownership.

Conclusion: existing evidence supports case-level isolation; targeted negative runtime coverage remains required before closure.

### Case hearings

Existing E01-A findings record that hearing mutations bind both `caseId` and `hearingId`, reads use case owner/member access, and writes are limited to the assigned lawyer/admin.

Conclusion: no confirmed cross-case hearing access defect was proven in the inspected evidence; negative cross-case tests remain required.

### Document handovers

Existing E01-A findings record ownership/document-case consistency checks, active case membership for recipients, owner/requester/recipient read boundaries, and restricted status/tracking operations. Delivery additionally re-checks recipient membership and OTP controls.

Conclusion: no confirmed cross-case or cross-recipient handover bypass was proven in the inspected evidence; negative runtime coverage remains required.

## Isolation invariants to prove with negative tests

1. Client A cannot read/list/download legal documents belonging to Client B's agreement.
2. Lawyer A cannot read/list/download legal documents belonging to Lawyer B's agreement.
3. Client/member of Case A cannot read or mutate Case B objects.
4. Lawyer assigned to Case A cannot mutate hearings/documents for Case B.
5. A document ID from Agreement B cannot be accepted under Agreement A through a caller-supplied parent identifier.
6. A handover recipient who is not an active member of the document's case is denied.
7. Wrong-role actors cannot perform legal-document workflow transitions.
8. Admin remains the intentional platform-wide exception and must not be confused with ordinary user access.
9. Returned legal data must be limited to the minimum object scope required by the endpoint; no unrelated user/legal records may leak through joins or DTOs.

## Runtime decision

No runtime patch is authorized from the current evidence. The inspected services demonstrate explicit parent-object authorization, but E01-C cannot be closed until negative runtime tests prove denial across unrelated agreements/cases/recipients and the complete document/handover surface is covered.

## Status

**IN PROGRESS — AUDIT BASELINE ESTABLISHED.**

Next execution step: implement or extend isolated negative authorization tests for the invariants above, run the security/typecheck gates, inspect the resulting evidence, then decide whether any code repair is actually required.
