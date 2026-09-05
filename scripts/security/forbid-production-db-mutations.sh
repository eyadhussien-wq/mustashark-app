#!/usr/bin/env bash
set -euo pipefail

# Emergency guard: protected CI/application paths must never contain commands
# that can destroy a production database. Test-only destructive SQL is allowed
# only when it is inside an explicitly isolated GitHub Actions workflow that
# declares a localhost PostgreSQL database whose name ends in _test. The
# production URL scan below remains independent and fail-closed.
scan_roots=(.github/workflows scripts artifacts lib)

# Keep this guard portable: the GitHub runner guarantees POSIX grep. Match SQL
# keywords case-sensitively so ordinary UI/code identifiers such as "truncate"
# do not become destructive-operation findings.
# shellcheck disable=SC2016
mutation_pattern='drizzle-kit[[:space:]]+drop|TRUNCATE([[:space:]]+(TABLE|[[:alnum:]_."`$]+))?|DROP[[:space:]]+(DATABASE|SCHEMA|TABLE)|ALTER[[:space:]]+TABLE[[:space:]]+.*DROP[[:space:]]+COLUMN|DELETE[[:space:]]+FROM[[:space:]]+[[:alnum:]_."`$]+'
isolated_test_db_pattern='postgresql://[^[:space:]@]+:[^[:space:]@]+@localhost:5432/[[:alnum:]_-]+_test(["[:space:]/]|$)'

mutation_out=$(mktemp)
mutation_err=$(mktemp)
url_out=$(mktemp)
url_err=$(mktemp)
trap 'rm -f "$mutation_out" "$mutation_err" "$url_out" "$url_err"' EXIT

set +e
grep -REn \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude='forbid-production-db-mutations.sh' \
  -e "$mutation_pattern" "${scan_roots[@]}" \
  >"$mutation_out" 2>"$mutation_err"
mutation_status=$?
set -e

case "$mutation_status" in
  0)
    # Destructive SQL is acceptable only in workflow files that explicitly
    # declare an isolated localhost *_test database. Application code, scripts,
    # libraries, and workflows without that declaration remain protected.
    mutation_violation=0
    while IFS= read -r match; do
      match_file=${match%%:*}
      if [[ "$match_file" == .github/workflows/* ]] && grep -Eq "$isolated_test_db_pattern" "$match_file"; then
        continue
      fi
      printf '%s\n' "$match"
      mutation_violation=1
    done <"$mutation_out"

    if [[ "$mutation_violation" -eq 1 ]]; then
      echo "ERROR: destructive database operation detected in protected CI/application paths." >&2
      echo "Production database destruction is forbidden during the emergency rescue." >&2
      exit 1
    fi
    ;;
  1)
    ;;
  *)
    cat "$mutation_err" >&2
    echo "ERROR: database mutation scan failed; refusing to pass closed." >&2
    exit 2
    ;;
esac

# Production DATABASE_URL must never be hard-coded or inherited through a
# production-named secret/variable in CI/security scripts. Test database
# mutation jobs must use an explicitly isolated test-only variable at the job boundary.
production_url_names='PRODUCTION_DATABASE_URL|DATABASE_URL_PRODUCTION|DB_URL_PRODUCTION'
production_url_assignment='(DATABASE_URL|DB_URL)[[:space:]]*[:=][[:space:]]*([^[:space:]]*[[:space:]]*)?(prod|production|heliumdb)'

set +e
grep -RniE \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude='forbid-production-db-mutations.sh' \
  -e "$production_url_names" \
  -e "$production_url_assignment" \
  .github/workflows scripts \
  >"$url_out" 2>"$url_err"
grep_status=$?
set -e

if [[ -s "$url_err" ]]; then
  cat "$url_err" >&2
  echo "ERROR: production DATABASE_URL scan failed; refusing to pass closed." >&2
  exit 2
fi

case "$grep_status" in
  0)
    cat "$url_out"
    echo "ERROR: production-like DATABASE_URL detected in CI/security scripts." >&2
    echo "CI and security checks must use an isolated test database." >&2
    exit 1
    ;;
  1)
    ;;
  *)
    echo "ERROR: production DATABASE_URL scan failed; refusing to pass closed." >&2
    exit 2
    ;;
esac

echo "Production DB mutation guard: PASS"
