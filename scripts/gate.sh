#!/usr/bin/env bash
# Quality gate: lint, typecheck, tests, then a production build.
# Exits 0 only if every step succeeds; prints which step failed otherwise.
set -euo pipefail

cd "$(dirname "$0")/.."

current_step=""
on_error() {
  echo
  echo "✗ gate.sh failed at step: ${current_step}"
  exit 1
}
trap on_error ERR

current_step="lint"
npm run lint

current_step="typecheck"
npm run typecheck

current_step="test"
npm test -- --run

current_step="build"
npm run build

trap - ERR
echo
echo "✓ gate.sh passed (lint, typecheck, test, build)"
