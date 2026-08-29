# S02-08 — Admin Monitoring & Intervention

Date: 2026-08-29
Status: IMPLEMENTATION — FOUNDATION

## Repository authority

`mustashark-app` is the sole engineering repository for the platform. The former `mustashark-appadmin` repository is not part of the application architecture.

## Administrative boundary

All administrative intervention must flow through:

`Admin API → RBAC + active status → Canonical Case Service → validated state transition / intervention → atomic DB transaction + row locking → immutable audit event → response`

Direct mutation of case, financial, identity, or audit tables from an administrative controller is prohibited.

## Audit invariants

`admin_audit_logs` is append-only. Database triggers reject UPDATE and DELETE operations. The audit INSERT must execute inside the same transaction as the business intervention so a failed intervention cannot leave a successful-looking audit event, and a failed audit insert prevents the intervention from committing.

## Intervention scope

Allowed operations must be explicitly enumerated by the canonical service and validated against the current state. Monitoring is read-only. State changes, dispute decisions, and exceptional overrides require authenticated active-admin authorization, a declared reason, before/after state, and an immutable audit event.

Financial values must not be rewritten through an administrative convenience endpoint. Financial dispute resolution must use the canonical financial authority and transaction boundaries already established by the platform.

## Reporting scope

S02-08 reporting is read-only and derives directly from canonical database state. It covers case lifecycle, financial/commission state, disputes and intervention history, and operational lawyer metrics. Reports must not become an alternate write path.

## Current implementation step

The first database hardening step is migration `0015_s02_08_admin_audit_immutability.sql`. The remaining intervention/reporting services must be implemented only after their exact existing routes, authorization middleware, canonical case transition service, and transaction primitives are verified against this branch.
