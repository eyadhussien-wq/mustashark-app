# Security Gate Protocol

## Purpose

This protocol governs security-sensitive changes in the Mustasharek repository.

## Roles and gates

1. **Diagnosis — Assistant**: establish the root cause from repository evidence, CI evidence, and Git history.
2. **Decision — Assistant + Owner approval**: no security-sensitive change is executed without explicit owner approval after the proposed diff and rationale are presented.
3. **Execution — Approved mechanism**: apply only the approved, narrowly scoped change on the designated branch. No unrelated files or regeneration steps are allowed.
4. **Diff review — Assistant**: review the resulting diff independently; implementation claims are not treated as evidence.
5. **Testing — GitHub Actions**: CI is the automated verification authority. A passing result must correspond to the intended commit/branch.
6. **Security Gate — Assistant**: determine PASS/FAIL from the collected evidence. No PASS by default and no inference from unrelated green checks.
7. **Merge — Repository owner**: merging into `main` requires explicit owner approval. No automatic merge is permitted.

## Change-control rules

- Never modify `main` directly for a security-sensitive fix.
- Do not regenerate `pnpm-lock.yaml` unless the evidence proves regeneration is required and the owner explicitly approves it.
- Do not use guessed configuration as a fix when repository history can establish the intended configuration.
- Before execution, report the exact files, exact intended changes, rationale, expected lockfile impact, and risk.
- After execution, verify the exact diff and run the applicable CI/security gates before declaring closure.
- Rejected, failed, or ambiguous evidence leaves the gate **UNVERIFIED**, not PASS.
