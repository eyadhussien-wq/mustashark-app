# Gate #2 — Extended Financial Business Matrix v1.0

Status: **design + validation matrix only**. Financial Gate remains BLOCKED.

## Objective

Extend Gate #2 validation from isolated Guard A/B races to production-shaped backend business flows without touching `main` or Production.

Every scenario must execute against the isolated PostgreSQL database and must preserve the same financial invariants:

- authoritative amounts come from server-side financial state;
- Guard A protects escrow capacity;
- Guard B protects milestone causal conservation;
- all financial writes remain one atomic transaction;
- idempotency serializes requests and replays the persisted terminal result;
- wallet mutation cannot occur on a losing/rolled-back path;
- ledger evidence and balance mutations commit or roll back together;
- no demo/local authentication fallback is permitted in Gate #2.

## Matrix

| Flow | Preconditions | Financial actions | Concurrency / fault cases | Required evidence |
|---|---|---|---|---|
| Legal consultation | approved lawyer + active client | booking → payment/funding → allocation → settlement | duplicate booking/payment, same-milestone allocation race, rollback after allocation | exactly-once financial initialization; no over-allocation; no wallet mutation on loser |
| Legal memo | approved lawyer + active client | quote/escrow → milestone allocation → proof/release → settlement | Release ↔ Refund; Dispute ↔ Release; retry after rollback | Guard A/B decisions, escrow conservation, terminal idempotent replay |
| Quote with installments | approved lawyer + active client | authoritative quote → initial 30% installment → remaining installments → milestone settlement | partial payment, delayed installment, duplicate installment, concurrent settlement | installment totals reconcile to quote; no double funding/release; remaining balance is exact |
| Multi-milestone representation | approved lawyer + active client | escrow → milestone allocation → proof → release | 32/64/128 concurrent requests against same and different milestones | no invariant drift; deterministic lock behavior; bounded contention |
| Dispute + release | approved lawyer + active client | dispute state + release decision | concurrent dispute/release and retry | exactly one terminal financial outcome; no contradictory wallet/ledger entries |
| Failure/rollback | valid funded transaction | fail at each critical write boundary | injected failure before/after each financial write | all-or-nothing persistence; no orphan wallet/ledger/escrow state |

## Installment rule

The existing representation-finance contract currently exposes a **30/40/30** milestone generator. The extended test must not silently reinterpret that as an arbitrary “30% upfront + installments” model. Before asserting installment-specific behavior, the implementation must identify the authoritative production installment rule and test that exact rule.

## Authentication provenance

Gate #2 CI must run with:

`NODE_ENV=production`

`MUSTASHAREK_DEMO_AUTH_ENABLED=false`

The client and lawyer identities are created through the real `/api/auth/local-auth` registration path. The lawyer must remain blocked while pending and may authenticate only after the canonical `admin@mustashark.com` reviewer approves the professional verification record.

## Stress policy

Stress is progressive, not decorative:

1. baseline deterministic scenarios;
2. 32-way concurrency;
3. 64-way concurrency;
4. 128-way concurrency only after 32 and 64 remain green.

Any red result stops escalation and requires root-cause classification before another stress level is attempted.

## Gate decision rule

This matrix is **evidence-complete only when every applicable scenario has a direct test result**. A green TypeScript check or a green harness process alone is not sufficient evidence for Financial Gate closure.
