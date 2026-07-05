---
name: Auth architecture (demo vs DB)
description: Why the app has two disconnected auth sources and how to seed/guard roles consistently.
---

# Auth: AsyncStorage demo login vs Postgres users table

The mobile app's email/password login is **AsyncStorage-based (demo)** via
`contexts/AuthContext.tsx` `SAMPLE_USERS`. A separate Postgres `users` table
also exists (`lib/db/src/schema/users.ts`, role enum includes `client`,
`lawyer`, `admin`) but is only written by social-auth flows and seed scripts —
the demo email/password login does **not** read from it.

**Consequence:** these are two disconnected sources of truth. To make a new
role/user fully usable you must seed it in **both** places, or it will only work
in one path:
- App demo login → add to `SAMPLE_USERS` in `AuthContext.tsx`.
- Backend/DB access → seed via a script (see `scripts/src/seed-admin.ts`, which
  upserts with `.onConflictDoUpdate({ target: usersTable.email })` and hashes the
  password as `scrypt$<salt>$<hash>` using `node:crypto` — no bcrypt dep needed).

**Why:** the product is still demo-stage; the user explicitly wanted a DB-seeded
admin AND an inspectable dashboard, so dual-seeding is intentional, not a bug.
If login ever moves to real backend verification, collapse to the DB as the
single source and drop `SAMPLE_USERS`.

## Route guards for role-gated groups
Expo Router groups do not enforce roles by themselves. Guard at the group
`_layout.tsx`: read `useAuth()`, `return null` while `isLoading`, redirect to
`/auth/login` if no user, and redirect to `/` if `user.role` is wrong. The
`(admin)` group does this — mirror it for any future role-gated group.
