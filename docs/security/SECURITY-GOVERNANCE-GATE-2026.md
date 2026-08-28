# Mustashark Security & Governance Gate — 2026

## Purpose

This document establishes the mandatory security and governance baseline for Mustashark before production release and before security-sensitive changes are promoted to `main`.

The goal is to protect client data, lawyer data, authentication/session data, consultation records, documents, and financial/payment information using a server-authoritative architecture and verifiable security controls.

## Governing principles

1. **Server is the source of truth.** The mobile/web client is an untrusted execution environment.
2. **Least privilege.** Authentication alone never grants access to an object or operation.
3. **Object-level authorization.** Every protected resource must verify ownership or an explicitly authorized relationship on the server.
4. **Data minimization.** Public/client DTOs expose only fields required for the feature.
5. **No sensitive business authority on the client.** Refunds, forfeitures, commissions, payouts, payment state, and other financial decisions are server-authoritative.
6. **Atomicity and idempotency.** Financial and other high-impact state transitions must be safe under retries and concurrency.
7. **Fail closed.** API failure must not silently activate demo/local production behavior or bypass authorization.
8. **Separation of environments.** Test/demo fixtures must never become a production source of truth.
9. **Auditability.** Security- and finance-sensitive actions must be traceable without logging secrets or unnecessary personal data.
10. **Evidence before approval.** A control is not considered verified solely because code appears to implement it; it must be supported by tests, CI evidence, or an explicit independent verification result.

## Security verification states

- **VERIFIED** — implemented and supported by a repeatable test/review result.
- **IMPLEMENTED / NOT YET PROVEN** — implementation exists but verification evidence is still required.
- **GAP** — missing, unsafe, or insufficient control requiring remediation.
- **NOT ASSESSED** — insufficient evidence to make a security claim.

## Mandatory security domains

### 1. Identity and authentication

- Verify tokens server-side.
- Re-check the account against the database where required.
- Reject deleted, suspended, terminated, or otherwise unauthorized accounts.
- Do not accept client-supplied authentication state as authoritative.
- Review token lifetime, refresh/revocation behavior, storage, and logout semantics.

### 2. Authorization

- Enforce role authorization server-side.
- Enforce object-level authorization for every client/lawyer/admin resource.
- Prevent BOLA/IDOR and privilege escalation.
- Never trust `userId`, `clientId`, `lawyerId`, `role`, ownership, or permission flags supplied by the client.
- Admin-only functionality must remain isolated from client/lawyer surfaces.

### 3. Client and lawyer data protection

- Use explicit public/client DTOs rather than returning complete user/database objects.
- Never expose password hashes, authentication secrets, internal security fields, or unrelated private attributes.
- Apply minimum necessary disclosure to client and lawyer profiles.
- Protect consultation subjects, descriptions, attachments, contact information, and other PII according to access policy.
- Do not treat local mobile storage as authoritative for protected data.

### 4. Financial and payment security

The following must be server-authoritative:

- consultation price
- payment state
- refund eligibility and amount
- forfeiture decisions
- platform commission
- lawyer earnings
- client credits
- wallet balances
- payout creation and settlement state

Requirements:

- Never trust financial values calculated or supplied by the client.
- Prevent double refund and double payout through idempotency/transactional safeguards.
- Use database transactions for multi-record financial state changes where required.
- Maintain auditable financial records.
- Do not store raw payment-card credentials in the application database unless explicitly required and separately approved under an appropriate compliance architecture.
- Prefer a PCI-compliant payment processor/tokenization architecture so Mustashark handles only the minimum payment information necessary.

### 5. Booking and consultation security

- Validate every state transition server-side.
- Verify actor, ownership, role, current state, and allowed transition.
- Protect against concurrent confirmation/cancellation/refund races.
- Attendance and no-show decisions must not be controlled solely by a mutable client timestamp.
- Meeting links must not be generated or trusted as an authorization mechanism by the client.

### 6. Mobile security

- Async/local storage is not a source of truth for authorization or financial state.
- Remove silent production fallbacks to sample/demo records.
- Minimize sensitive local persistence.
- Review JWT/session storage and device compromise assumptions.
- Never embed server secrets, signing keys, database credentials, or payment secrets in the mobile bundle.

### 7. API security

Every API surface must be reviewed for:

- authentication
- authorization
- object-level authorization
- input validation
- output/data minimization
- mass assignment/property-level authorization
- rate limiting where appropriate
- safe error responses
- CORS/security headers where applicable
- endpoint inventory and removal of obsolete/debug endpoints
- SSRF risk for user-controlled URLs
- secure handling of uploaded files

### 8. Secrets and cryptography

- Secrets belong in managed server-side secret configuration, never source control.
- Passwords must use an approved password hashing scheme; never plaintext or reversible encryption.
- TLS must protect network traffic in production.
- Review JWT signing configuration, key management, rotation, and algorithm restrictions.
- Do not log tokens, passwords, payment credentials, or sensitive personal data.

### 9. Logging, monitoring, and audit

Security-sensitive events should be observable without exposing secrets or excessive PII, including:

- authentication failures/successes as appropriate
- authorization failures
- account status changes
- privileged actions
- booking state changes
- refund/payout events
- dispute events
- security-relevant configuration changes

Logs must avoid credentials, bearer tokens, password hashes, and raw payment-card data.

### 10. Secure development and supply chain

- Security-sensitive changes must be isolated on reviewable branches.
- CI must run typecheck/build/tests/security tests before promotion.
- Dependency changes require review.
- Do not disable security tests merely to make CI green.
- Demo/test fixtures must be isolated from production behavior.
- Production release requires review of the security gate status.

## Mandatory Security Gate for `main`

A security-sensitive change may be promoted only after:

`Review → Implement → Security Test → CI → Verification → Approval`

The gate must include, as applicable:

- unauthorized access tests
- wrong-role tests
- BOLA/IDOR tests
- sensitive-field leakage tests
- input validation tests
- financial manipulation tests
- duplicate refund/payout tests
- concurrency/race tests
- demo fallback tests
- typecheck/build
- relevant integration/contract tests

## Current high-priority remediation queue

1. Move Lawyer Discovery to an authenticated, server-authoritative API with an explicit safe DTO.
2. Remove/contain production reliance on `SAMPLE_LAWYERS` and other demo fixtures.
3. Remove financial authority from client-side `DataContext` and make server/database state authoritative.
4. Protect refund, cancellation, no-show, wallet, commission, and payout transitions with server-side authorization, transactions, and idempotency.
5. Review mobile persistence of JWT/session and sensitive application data.
6. Add regression tests for BOLA/IDOR, sensitive-field exposure, financial tampering, and duplicate financial operations.
7. Perform an independent security assessment/penetration test before real-money production launch.

## External security baseline

The project uses OWASP Application Security Verification Standard (ASVS) as a security verification baseline and OWASP API Security Top 10 as an API threat checklist. These are reference frameworks; passing this repository gate does not by itself constitute regulatory certification or PCI DSS compliance.

## Important assurance boundary

This document is a governance and engineering control baseline. It is **not** a legal certification, PCI DSS attestation, penetration-test report, or guarantee that the system is free of vulnerabilities. Production security claims require evidence from code review, automated tests, infrastructure verification, and—before high-risk launch—independent security assessment.
