#!/usr/bin/env bash
set -euo pipefail

# Emergency guard: protected CI/application paths must never contain commands
# that can mutate or destroy a production database. The scan is intentionally
# conservative and understands SQL keywords separated by whitespace/newlines.
files=(.github/workflows scripts artifacts lib)

mutation_pattern='(drizzle-kit[[:space:]]+(push|drop)|TRUNCATE([[:space:]]+(TABLE|[[:alnum:]_."`$]+))?|DROP[[:space:]]+(DATABASE|SCHEMA|TABLE)|ALTER[[:space:]]+TABLE[[:space:]]+[^;]+[[:space:]]+DROP[[:space:]]+COLUMN|DELETE[[:space:]]+FROM[[:space:]]+[[:alnum:]_."`$]+)'

set +e
MUTATION_PATTERN="$mutation_pattern" perl -0ne 'if (/$ENV{MUTATION_PATTERN}/is) { print "$ARGV: prohibited database mutation pattern detected\n"; $found=1 } END { exit($found ? 0 : 1) }' "${files[@]}"
scan_status=$?
set -e
case "$scan_status" in
  0)
    echo "ERROR: potentially destructive database operation detected in protected CI/application paths."
    echo "Production database mutations are forbidden during the emergency rescue."
    exit 1
    ;;
  1) ;;
  *)
    echo "ERROR: database mutation scan failed; refusing to pass closed."
    exit 2
    ;;
esac

# Production DATABASE_URL must never be hard-coded or inherited through a
# production-named secret/variable in CI/security scripts. Any future test-DB
# mutation job must use an explicitly test-only variable at its job boundary.
production_url_pattern='(PRODUCTION_DATABASE_URL|DATABASE_URL_PRODUCTION|(?:DATABASE_URL|DB_URL)[[:space:]]*[:=][[:space:]]*["'"']?[^[:space:]"'"']*(prod|production|heliumdb))'
scan_output=$(mktemp)
scan_error=$(mktemp)
trap 'rm -f "$scan_output" "$scan_error"' EXIT

set +e
grep -RniE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  "$production_url_pattern" .github/workflows scripts >"$scan_output" 2>"$scan_error"
grep_status=$?
set -e

if [[ -s "$scan_error" ]]; then
  cat "$scan_error" >&2
  echo "ERROR: production DATABASE_URL scan failed; refusing to pass closed." >&2
  exit 2
fi
if [[ "$grep_status" -eq 0 ]]; then
  cat "$scan_output"
  echo "ERROR: production-like DATABASE_URL detected in CI/security scripts."
  echo "CI and security checks must use an isolated test database."
  exit 1
elif [[ "$grep_status" -ne 1 ]]; then
  echo "ERROR: production DATABASE_URL scan failed; refusing to pass closed."
  exit 2
fi

echo "Production DB mutation guard: PASS"
