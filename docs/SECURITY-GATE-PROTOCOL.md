# Mustasharek — General Engineering & Security Gate Protocol

## Scope

This protocol applies across all stages of building, repairing, hardening, testing, and releasing Mustasharek. It is the repository change-control standard for security-sensitive and production-impacting work.

## Mandatory workflow

### 1. 🔎 Diagnosis — Assistant

- Inspect repository state, Git history, code, configuration, CI evidence, and relevant artifacts.
- Determine the root cause and distinguish evidence from assumptions.
- Do not propose a fix based only on an error message when repository evidence can establish the intended state.

### 2. 🧾 Proposed change — Assistant

Before any modification, present:

- Exact target branch.
- Exact file(s) to change.
- Exact proposed diff or precise line-level change.
- Why the change is required.
- Expected impact on runtime, database, dependencies, lockfiles, CI, and security gates.
- Any known risks or uncertainties.

### 3. 🛑 Approval gate — Owner

- Stop after presenting the proposed change.
- No change is executed until the repository owner gives explicit approval.
- Approval applies only to the stated scope. Any newly discovered material change requires a new approval.

### 4. 🛠️ Execution — Approved mechanism

- Execute only the approved change.
- Work only on the designated branch.
- Do not modify `main` directly for security-sensitive or production-impacting work.
- Do not introduce unrelated cleanup, refactoring, dependency upgrades, or generated changes.
- Do not regenerate `pnpm-lock.yaml` unless evidence proves it is required and the owner explicitly approves it.

### 5. 🔍 Post-change Diff Audit — Assistant

Immediately after execution:

- Inspect the actual resulting diff.
- Confirm it matches the approved diff.
- Check for unintended files, generated changes, secrets, credentials, environment values, or unrelated modifications.
- If the actual diff differs materially from the approved scope, stop and report FAIL/UNVERIFIED rather than proceeding.

### 6. 🧪 Verification — GitHub Actions

- Run or inspect the applicable GitHub Actions workflows.
- Verify the results belong to the intended commit and branch.
- Treat skipped, cancelled, stale, unrelated, or ambiguous checks as non-evidence of PASS.
- A green result from an unrelated commit or workflow does not close the gate.

### 7. 🔐 Security Gate — Assistant

The Assistant makes the final evidence-based PASS/FAIL/UNVERIFIED determination for the applicable gate.

- **PASS** only when the required evidence is present and consistent.
- **FAIL** when a required check fails or a security requirement is violated.
- **UNVERIFIED** when evidence is missing, stale, ambiguous, or incomplete.
- There is no default PASS.

### 8. 🚀 Merge to `main` — Owner approval

- No automatic merge is permitted.
- Merge into `main` requires explicit owner approval after the relevant gates are PASS.
- A passing CI run does not itself authorize a merge.

## Core rules

- GitHub is the authoritative repository source for committed code and CI evidence.
- Do not use Replit, local agents, or other tools as an alternative source of truth for repository state.
- Use repository history to recover intended configuration whenever possible.
- Preserve production safety: no unapproved production database changes, destructive operations, or secret exposure.
- Prefer the smallest reversible change that closes the demonstrated defect.
- Never infer closure from intent, tool output alone, or an unverified local result.
- When uncertainty appears, stop at the current gate and request/collect evidence before proceeding.

## Stage applicability

This protocol applies equally to:

- dependency and workspace configuration;
- authentication and authorization;
- database and migration work;
- API and business-logic changes;
- payment and financial flows;
- booking/state-machine behavior;
- mobile/web/admin functionality;
- CI/CD and deployment configuration;
- security evidence and audit documentation;
- production-readiness and release work.
