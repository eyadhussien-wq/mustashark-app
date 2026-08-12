#!/bin/bash
set -e

# Merges must never mutate Production data automatically.
# Database schema changes are reviewed and applied explicitly after CI passes.
pnpm install --frozen-lockfile
pnpm run typecheck
