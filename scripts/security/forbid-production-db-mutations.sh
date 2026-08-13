#!/usr/bin/env bash
set -euo pipefail

# Emergency guard: protected CI/application paths must never contain commands
# that can destroy a production database. Test-only schema setup (for example
# drizzle-kit push against localhost) is allowed; the production URL scan below
# prevents that setup from being redirected to a production-named database.
scan_roots=(.github/workflows scripts artifacts lib)

# This is intentionally a literal regex string; no shell interpolation is desired.
# shellcheck disable=SC2016
mutation_pattern='(drizzle-kit[[:space:]]+drop|TRUNCATE([[:space:]]+(TABLE|[[:alnum:]_."`$]+))?|DROP[[:space:]]+(DATABASE|SCHEMA|TABLE)|ALTER[[:space:]]+TABLE[[:space:]]+[^;]+[[:space:]]+DROP[[:space:]]+COLUMN|DELETE[[:space:]]+FROM[[:space:]]+[[:alnum:]_."`$]+)'

mutation_out=$(mktemp)
mutation_err=$(mktemp)
url_out=$(mktemp)
url_err=$(mktemp)
trap 'rm -f "$mutation_out" "$mutation_err" "$url_out" "$url_err"' EXIT

set +e
rg -n -i -U \
  --hidden \
  --glob '!node_modules/**' \
  --glob '!dist/**' \
  --glob '!.git/**' \
  --glob '!scripts/security/forbid-production-db-mutations.sh' \
  "$mutation_pattern" "${scan_roots[@]}" \
  >"$mutation_out" 2>"$mutation_err"
mutation_status=$?
set -e

case "$mutation_status" in
  0)
    cat "$mutation_out"
    echo "ERROR: destructive database operation detected in protected CI/application paths." >&2
    echo "Production database destruction is forbidden during the emergency rescue." >&2
    exit 1
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
# Keep these patterns deliberately simple: the shell script should parse them safely,
# while grep handles the case-insensitive textual matching.
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
