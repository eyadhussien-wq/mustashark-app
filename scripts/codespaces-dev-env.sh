#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="postgresql://mustashark:mustashark_dev@127.0.0.1:5432/mustashark_dev"
export SESSION_SECRET="mustashark-codespaces-dev-only-secret"
export NODE_ENV="development"

# Expo mobile uses this value to reach the Codespaces API over HTTPS.
# The 8081 port itself must be made public in the Codespaces port settings.
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  export EXPO_PUBLIC_DOMAIN="${CODESPACE_NAME}-8081.app.github.dev"
fi

printf 'DATABASE_URL=%s\n' "$DATABASE_URL"
printf 'NODE_ENV=%s\n' "$NODE_ENV"
if [[ -n "${EXPO_PUBLIC_DOMAIN:-}" ]]; then
  printf 'EXPO_PUBLIC_DOMAIN=%s\n' "$EXPO_PUBLIC_DOMAIN"
fi
printf 'Environment loaded for this shell only.\n'
