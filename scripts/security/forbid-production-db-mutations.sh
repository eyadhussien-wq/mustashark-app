#!/usr/bin/env bash
set -euo pipefail

# Emergency guard: protected CI/application paths must never contain commands
# that can mutate or destroy a production database. The scan is conservative,
# covers multiline SQL, and excludes this guard so its own patterns do not trip it.
scan_roots=(.github/workflows scripts artifacts lib)

mutation_pattern='(drizzle-kit[[:space:]]+(push|drop)|TRUNCATE([[:space:]]+(TABLE|[[:alnum:]_."`$]+))?|DROP[[:space:]]+(DATABASE|SCHEMA|TABLE)|ALTER[[:space:]]+TABLE[[:space:]]+[^;]+[[:space:]]+DROP[[:space:]]+COLUMN|DELETE[[:space:]]+FROM[[:space:]]+[[:alnum:]_."`$]+)'

set +e
rg -n -i -U \
  --hidden \
  --glob '!node_modules/**' \
  --glob '!dist/**' \
  --glob '!.git/**' \
  --glob '!scripts/security/forbid-production-db-mutations.sh' \
  "$mutation_pattern" "${scan_roots[@]}" \
  > /tmp/mustashark-db-mutation-scan.out \
  2> /tmp/mustashark-db-mutation-scan.err
mutation_status=$?
set -e

case "$mutation_status" in
  0)
    cat /tmp/mustashark-db-mutation-scan.out
    echo "ERROR: potentially destructive database operation detected in protected CI/application paths." >&2
    echo "Production database mutations are forbidden during the emergency rescue." >&2
    exit 1
    ;;
  1)
    ;;
  *)
    cat /tmp/mustashark-db-mutation-scan.err >&2
    echo "ERROR: database mutation scan failed; refusing to pass closed." >&2
    exit 2
    ;;
esac

# Production DATABASE_URL must never be hard-coded or inherited through a
# production-named secret/variable in CI/security scripts. Test database
# mutation jobs must use an explicitly isolated test-only variable at the job boundary.
production_url_pattern='(PRODUCTION_DATABASE_URL|DATABASE_URL_PRODUCTION|DB_URL_PRODUCTION|(DATABASE_URL|DB_URL)[[:space:]]*[:=][[:space:]]*["'"']?[^[:space:]"'"']*(prod|production|heliumdb))'

set +e
grep -RniE \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude='forbid-production-db-mutations.sh' \
  "$production_url_pattern" .github/workflows scripts \
  >/tmp/mustashark-production-url-scan.out \
  2>/tmp/mustashark-production-url-scan.err
grep_status=$?
set -e

if [[ -s /tmp/mustashark-production-url-scan.err ]]; then
  cat /tmp/mustashark-production-url-scan.err >&2
  echo "ERROR: production DATABASE_URL scan failed; refusing to pass closed." >&2
  exit 2
fi

case "$grep_status" in
  0)
    cat /tmp/mustashark-production-url-scan.out
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

rm -f /tmp/mustashark-db-mutation-scan.out /tmp/mustashark-db-mutation-scan.err \
  /tmp/mustashark-production-url-scan.out /tmp/mustashark-production-url-scan.err

echo "Production DB mutation guard: PASS"
