#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

source ./scripts/codespaces-dev-env.sh

echo "[1/3] Starting isolated Codespaces PostgreSQL..."
docker compose -f docker-compose.codespaces.yml up -d postgres

echo "[2/3] Applying Drizzle schema to the isolated database..."
pnpm --filter @workspace/db push

echo "[3/3] Seeding development admin..."
pnpm --filter @workspace/scripts run seed-admin

echo ""
echo "✅ Codespaces database is ready."
echo "Admin: admin@mustashark.com"
echo "Development password: test1234"
echo ""
echo "For each terminal that runs the API, source:"
echo "  source ./scripts/codespaces-dev-env.sh"
echo ""
echo "Then start the API with:"
echo "  pnpm --filter @workspace/api-server dev"
