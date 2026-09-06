# M0 Proof Harness

**Specification:** UEB-SPEC-001  
**Harness:** M0-PROOF-HARNESS-001  
**Status:** Harness boundary only; UEB implementation is intentionally out of scope.

## Constitutional Boundary

This harness exists to independently verify the Unified Execution Boundary before protected application paths are migrated.

The harness MUST NOT:

- modify production, Supabase, Beta, or live databases;
- introduce SQL migrations;
- modify protected business/application paths;
- treat UEB self-reported context as proof;
- permit missing or conflicting actor context;
- use global/session identity as a fallback;
- treat admin or system identity as an implicit fallback;
- accept a direct protected DB path as conformant.

## Independent Oracle

A proof is valid only when its result can be established independently of the UEB's own context representation. The oracle records observable execution evidence and evaluates the expected security invariant.

Required evidence dimensions:

`Proof ID → Actor → Execution → Transaction → Stimulus → Expected → Observed → Isolation Scope → Result`

## Proof Classes

1. Structural
2. Behavioral
3. Negative
4. Isolation
5. Concurrency
6. Lifecycle
7. Bypass

## Required Negative Controls

The harness must deliberately exercise broken-boundary scenarios, including actor substitution, missing context, context conflict, context persistence after transaction end, pool leakage, unauthorized fallback, and direct protected DB bypass.

A harness that cannot fail when a boundary invariant is intentionally broken is not accepted as an independent proof harness.

## Promotion Rule

M0 promotion is blocked until P01–P25 are covered by executable evidence across all applicable proof classes and the False-Green Barrier passes. Any S4 constitutional breach is an immediate stop condition.

## Implementation Boundary

This directory is the dedicated M0 proof surface. UEB production integration remains outside this boundary until the harness has demonstrated that it can detect unconstitutional execution.
