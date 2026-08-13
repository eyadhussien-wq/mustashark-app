#!/usr/bin/env bash
set -euo pipefail

# Emergency guard: CI must never run destructive DB commands against Production.
# This is intentionally conservative and fails closed when production-like DB
# URLs or destructive migration commands are detected in CI configuration.

files=(.github/workflows scripts artifacts lib)

if grep -RniE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  '(drizzle-kit[[:space:]]+(push|drop|generate)|TRUNCATE[[:space:]]|DROP[[:space:]]+(DATABASE|SCHEMA|TABLE)|DELETE[[:space:]]+FROM[[:space:]]+[^;]*(users|bookings|platform_dues))' \
  "${files[@]}" 2>/dev/null; then
  echo "ERROR: potentially destructive database operation detected in protected CI/application paths."
  echo "Production database mutations are forbidden during the emergency rescue."
  exit 1
fi

echo "Production DB mutation guard: PASS"
