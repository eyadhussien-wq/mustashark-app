# مستشارك — Mustasharek

منصة استشارات قانونية أونلاين تربط العملاء بمحامين مرخصين في قطر والأردن.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) — `artifacts/mustasharek/`
- API: Express 5 — `artifacts/api-server/`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- State: AsyncStorage (local), React Context
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mustasharek/` — Expo mobile app
- `artifacts/admin-dashboard/` — React + Vite web admin dashboard (served at `/admin/`)
- `artifacts/api-server/` — Express API (admin auth + data endpoints under `/api/admin/*`)
- `artifacts/mustasharek/app/` — All screens (Expo Router file-based)
- `artifacts/mustasharek/contexts/AuthContext.tsx` — Auth state + user management
- `artifacts/mustasharek/contexts/DataContext.tsx` — Lawyers list + consultations
- `artifacts/mustasharek/constants/colors.ts` — Design tokens (navy + gold palette)
- `lib/api-spec/openapi.yaml` — API contract (source of truth)

## Architecture decisions

- Two user roles: `client` and `lawyer`, stored in AsyncStorage and persisted across sessions.
- License verification is format-based (QAT-XXXXX or JOR-XXXXX) with a simulated async check — ready to connect to a real government API later.
- Sample lawyers are seeded in DataContext and merged with any newly registered lawyers from AsyncStorage.
- Navigation uses separate `(client)` and `(lawyer)` tab groups, with the root `index.tsx` acting as a router redirect based on user role.
- The app is RTL-friendly — Arabic text uses `textAlign: "right"` throughout.

## Product

- **عميل (Client):** Browse lawyers, filter by country (Qatar/Jordan) and specialization, book consultations with date/time/type selection.
- **محامٍ (Lawyer):** Register with license number verification, manage availability, view/accept/reject consultation requests, dashboard with stats.
- **مدير (Admin):** Dedicated **web** dashboard (`artifacts/admin-dashboard/`, served at `/admin/`) — NOT a mobile tab. Server-side login against a DB admin user (JWT bearer + scrypt), KPIs (lawyers/clients/consultations), revenue split by country, consultation status breakdown, plus lawyers/clients/consultations/offices management and a dues report with manual collection and a debt kill-switch (auto-suspend offices over threshold).
- Demo login (mobile): `ahmed@example.com` / `123456` (client), `fatima@example.com` / `123456` (lawyer). Admin web dashboard: `admin@mustashark.com` / `test1234`.

## User preferences

- Arabic-first UI with RTL support.
- Start with Qatar and Jordan, then expand.
- License verification by number (format check), not manual review.
- Mobile app first, web app to follow.

## Gotchas

- The `(tabs)` group is kept as a stub redirect — do NOT add real screens there. Use `(client)` and `(lawyer)` groups instead.
- Arabic text may appear faint in web preview screenshots — this is a web rendering artifact. Test on native (Expo Go) for truth.
- License format: Qatar = `QAT-XXXXX` or 5-8 digits. Jordan = `JOR-XXXXX` or 5-8 digits.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
