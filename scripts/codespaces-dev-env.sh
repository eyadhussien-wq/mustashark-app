#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="postgresql://mustashark:mustashark_dev@127.0.0.1:5432/mustashark_dev"
export JWT_SECRET="mustashark-codespaces-dev-only-secret"
export NODE_ENV="development"

printf 'DATABASE_URL=%s\n' "$DATABASE_URL"
printf 'NODE_ENV=%s\n' "$NODE_ENV"
printf 'Environment loaded for this shell only.\n'
