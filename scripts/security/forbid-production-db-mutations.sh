#!/usr/bin/env bash
set -euo pipefail

# Emergency guard: CI must never run destructive DB commands against Production.
# This guard intentionally focuses on destructive commands and explicit
# production DATABASE_URL usage; schema generation itself is not destructive.

files=(.github/workflows scripts artifacts lib)

if grep -RniE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  '(drizzle-kit[[:space:]]+(push|drop)|TRUNCATE[[:space:]]|DROP[[:space:]]+(DATABASE|SCHEMA|TABLE)|DELETE[[:space:]]+FROM[[:space:]]+[^;]*(users|bookings|platform_dues))' \
  "${files[@]}" 2>/dev/null; then
  echo "ERROR: potentially destructive database operation detected in protected CI/application paths."
  echo "Production database mutations are forbidden during the emergency rescue."
  exit 1
fi

if grep -RniE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  '(DATABASE_URL[[:space:]]*[:=][[:space:]]*["'"']?[^[:space:]"'"']*(heliumdb|production)|DATABASE_URL[[:space:]]*=[^$\n]*(prod|production|heliumdb))' \
  .github/workflows scripts 2>/dev/null; then
  echo "ERROR: production-like DATABASE_URL detected in CI/security scripts."
  echo "CI and security checks must use an isolated test database."
  exit 1
fi

echo "Production DB mutation guard: PASS"
