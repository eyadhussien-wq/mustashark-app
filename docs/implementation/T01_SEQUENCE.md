# T01 Implementation Sequence

1. T01-01 — Create request
2. T01-02 — Lawyer review and offer
3. T01-03 — Accept offer and start service
4. T01-04 — Documents and reuse
5. T01-05 — Payment and proof workflow (implemented in existing PRs; do not duplicate)
6. T01-06 — Agency / document handover and delivery
7. T01 integration review
8. Real Preview
9. Full typecheck and tests
10. CI green
11. CodeRabbit review and resolution of actionable security findings
12. Final PR review and T01 closure

Cross-cutting requirements before Phase 3:

- Server-authoritative authorization and financial rules.
- Admin dashboard integration and permissions for every applicable workflow.
- Mock payment support for end-to-end testing without real funds.
- Local/international payment architecture reserved for HyperPay, Jordanian provider, Western Union, and PayPal as previously approved; Stripe is not the current foundation.
- 15% platform commission.
- Settlement default: 14 days from service completion, configurable by admin, with dispute/hold support.
- Lawyer pricing: current bar-card tier, then years of experience, then service factors.
- Lawyer specialization granularity, including litigation specialties and investment-law services.
- No destructive/reset/seed/migration operations against `heliumdb` during development.
- Production migrations must be tested on an isolated database first.
