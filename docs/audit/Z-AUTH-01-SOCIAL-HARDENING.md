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

`artifacts/mustasharek/hooks/useSocialAuth.ts` now requires the backend to verify the provider identity and issue the canonical JWT. Network failure, non-2xx responses, and successful responses without a server JWT are authentication failures.

### Provider-first account linking

`artifacts/api-server/src/controllers/auth.ts` now resolves social users in this order:

1. Match the authoritative `(provider, providerId)` pair.
2. If no provider identity exists, match the verified provider email as a secondary linking key.
3. Before linking a provider to an email-matched account, enforce `Role Mismatch Protection`.
4. Only after the role check succeeds is `authProvider/providerId` attached to the existing account.
5. If no provider or email match exists, create a new account only after mandatory terms consent.

Email is never the canonical social identity, and a role mismatch is rejected before provider mutation.

### Mandatory terms consent

New local and social registrations now require:

- `termsAccepted: true`
- `termsAcceptedAt` as an offset-aware ISO timestamp that is not materially in the future.

The API rejects missing/false consent for new registrations. Consent is recorded as a structured server audit log event (`terms_consent`) because this phase is explicitly prohibited from changing the database schema. Existing account logins do not require a new consent record merely to authenticate.

The mobile registration flows expose an explicit consent checkbox and send the timestamp captured at the moment the user accepts the terms. Social login also exposes the consent control on the login screen because a social login can create a new account when no existing identity is found.

## Lawyer verification boundary

The current application already captures a lawyer document locally in `lawyer-auth.tsx`, but the selected image is not yet transmitted to a secure backend storage/audit service. Therefore this branch does **not** pretend that document storage or fast-track verification is implemented.

The existing `pending` lawyer gate remains authoritative until a secure server-side document-storage contract is established.

## Language UX

The repository already contains `language-splash.tsx` with prominent Arabic/English selection before onboarding. No duplicate language control was introduced in this hardening commit. fileciteturn18file0

## Verification target

Before merge:

- Typecheck mobile and API server.
- Run the existing workspace tests/CI.
- Add/execute regression coverage for:
  - backend unavailable;
  - backend returns 4xx/5xx;
  - backend returns `ok: true` without JWT;
  - provider identity match;
  - email-link role mismatch;
  - existing local account linking;
  - Apple relay email;
  - missing/false terms consent;
  - invalid/future `termsAcceptedAt`;
  - valid consent on new client/lawyer registration.
