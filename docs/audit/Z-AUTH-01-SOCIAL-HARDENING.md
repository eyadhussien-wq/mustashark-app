# Z-Auth-01 — Social Authentication Hardening

## Scope

This phase hardens the existing Google, Facebook, and Apple social-login flow without changing production database state.

## Non-negotiable rules

- No Supabase access or mutation.
- No changes to Migration 0015.
- No new migration in this phase.
- A provider token is never treated as an application session.
- The application session is valid only after `/auth/social` verifies the provider identity and returns a server-issued JWT.

## Implemented in this branch

### Fail-closed mobile social authentication

`artifacts/mustasharek/hooks/useSocialAuth.ts` now:

- requires `EXPO_PUBLIC_DOMAIN` before attempting social session creation;
- treats network failure as authentication failure;
- treats non-2xx backend responses as authentication failure;
- rejects a successful HTTP response that does not contain a valid server JWT;
- no longer returns a provider profile that can be consumed as an authenticated session without a backend-issued JWT;
- keeps Apple first-login email persistence only as an input to server verification, never as a replacement for Apple identity verification.

## Existing account-linking rule requiring the next backend patch

The current backend lookup combines `(provider, providerId)` and email in one `OR` query. The required hardening is:

1. Match `(provider, providerId)` first.
2. If no provider identity exists, allow email-based linking only when the verified provider email matches an existing account and the requested portal role matches the existing account role.
3. Reject role mismatch before changing `authProvider` or `providerId`.
4. Never use email alone as the canonical social identity.
5. Do not create a second account when a verified provider identity is already attached to the existing user.

This backend change must be made without a migration.

## Lawyer verification boundary

The current application already captures a lawyer document locally in `lawyer-auth.tsx`, but the selected image is not yet transmitted to a secure backend storage/audit service. Therefore this branch does **not** pretend that document storage or fast-track verification is implemented.

The next implementation must establish a server-side upload contract and audit trail using infrastructure already present in the repository. If that requires a schema/storage migration, it must be stopped and reviewed separately rather than bypassing the production-data safety rule.

Until that contract exists, the existing `pending` lawyer gate remains authoritative.

## Language UX

The repository already contains `language-splash.tsx` with prominent Arabic/English selection before onboarding. No duplicate language control was introduced in this hardening commit.

## Verification target

Before merge:

- Typecheck mobile and API server.
- Run the existing workspace tests/CI.
- Add/execute social-auth regression coverage for:
  - backend unavailable;
  - backend returns 4xx/5xx;
  - backend returns `ok: true` without JWT;
  - provider identity match;
  - email-link role mismatch;
  - existing local account linking;
  - Apple relay email.
