# Legacy Financial / Marketplace Quarantine

This directory is the explicit boundary for legacy model-dependent surfaces that are not part of `Mustasharek Lawyer OS v1`.

## Quarantine scope

The construction track must not activate or import legacy functionality involving:

- platform commission / revenue sharing;
- professional-fee collection;
- escrow;
- client/professional funds held by the platform;
- lawyer wallet / payout / settlement;
- split payments;
- marketplace referral/lead pricing;
- legacy consultation payment UI.

Historical implementations remain traceable in Git history and on the baseline source commit. They are not evidence of authorization for the new model.

## P2 rule

A new Neutral Core module must not import from this quarantine boundary.

Any future reactivation requires a separate decision record, regulatory validation, architecture review, and an explicit phase/gate transition.

**Status:** `QUARANTINE ACTIVE`
