#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

source ./scripts/codespaces-dev-env.sh

echo "[1/4] Starting isolated Codespaces PostgreSQL..."
docker compose -f docker-compose.codespaces.yml up -d postgres

echo "[2/4] Applying Drizzle schema to the isolated database..."
pnpm --filter @workspace/db push

echo "[3/4] Seeding development admin..."
pnpm --filter @workspace/scripts run seed-admin

echo "[4/4] Seeding lifecycle test accounts..."
pnpm --filter @workspace/scripts run seed-test-users

echo ""
echo "✅ Codespaces database is ready."
echo "Admin: admin@mustashark.com"
echo "Test lawyer: testlawyer@mustashark.com (pending)"
echo "Test client: testclient@mustasharak.com (active)"
echo "Development password for test accounts: test1234"
echo ""
echo "For each terminal that runs the API, source:"
echo "  source ./scripts/codespaces-dev-env.sh"
echo ""
echo "Then start the API with:"
echo "  pnpm --filter @workspace/api-server dev"
