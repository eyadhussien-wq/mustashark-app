---
name: Account status lifecycle
description: How user account status transitions are enforced in the Mustasharek admin dashboard, and why the matrix is server-side.
---

Users have an `accountStatus` field: `pending`, `active`, `suspended`, `terminated`, `rejected`, `blocked` (+ `statusReason`). Admin dashboard exposes lawyer approve/reject/suspend/reactivate/terminate and client block/unblock.

Transitions are validated server-side in `applyUserStatus` (api-server `controllers/adminData.ts`) against a fixed matrix:
- pending → active | rejected
- active → suspended | terminated | blocked
- suspended → active | terminated
- blocked → active
- terminated → (terminal)
- rejected → (terminal)

Invalid transitions return **409** `invalid_status_transition`. Same-status no-ops are allowed.

**Why:** enum-only validation let any admin reactivate a terminated/rejected account, contradicting the UI's "permanent" wording. The matrix makes termination/rejection genuinely terminal regardless of caller (UI or raw API).

**How to apply:** when adding a new status or action, update BOTH the matrix and the relevant zod schema (`lawyerStatusSchema` / `clientStatusSchema`) and the OpenAPI `UpdateLawyerStatusInput` / `UpdateClientStatusInput` enums, then re-run codegen. Clients intentionally only support active/blocked — do not re-add `suspended` to the client input without a product reason.
