#!/usr/bin/env bash
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root"
failed=0

check_command() {
  if command -v "$1" >/dev/null 2>&1; then
    printf 'ok   %-12s %s\n' "$1" "$($1 --version 2>/dev/null | head -n 1)"
  else
    printf 'FAIL %-12s missing\n' "$1"
    failed=1
  fi
}

check_command git
check_command node
check_command npm
check_command rg

required_node="$(tr -d '[:space:]' < .nvmrc)"
if node - "$required_node" <<'NODE'
const required = process.argv[2].split('.').map(Number)
const current = process.versions.node.split('.').map(Number)
for (let index = 0; index < Math.max(required.length, current.length); index += 1) {
  const actual = current[index] ?? 0
  const minimum = required[index] ?? 0
  if (actual > minimum) process.exit(0)
  if (actual < minimum) process.exit(1)
}
process.exit(0)
NODE
then
  printf 'ok   %-12s %s or newer\n' 'node-range' "$required_node"
else
  printf 'FAIL %-12s requires %s or newer from .nvmrc\n' 'node-range' "$required_node"
  failed=1
fi

if [[ -d node_modules ]]; then
  printf 'ok   %-12s installed\n' 'dependencies'
else
  printf 'FAIL %-12s run npm ci\n' 'dependencies'
  failed=1
fi

if node -e "require.resolve('@playwright/test')" >/dev/null 2>&1; then
  printf 'ok   %-12s package installed\n' 'playwright'
else
  printf 'FAIL %-12s run npm ci\n' 'playwright'
  failed=1
fi

if node - <<'NODE' >/dev/null 2>&1
const fs = require('node:fs')
const { chromium } = require('@playwright/test')
fs.accessSync(chromium.executablePath(), fs.constants.X_OK)
NODE
then
  printf 'ok   %-12s chromium installed\n' 'browser'
else
  printf 'FAIL %-12s run: npx playwright install chromium\n' 'browser'
  failed=1
fi

if [[ -f .env.local ]]; then
  printf 'ok   %-12s present (values not inspected)\n' '.env.local'
else
  printf 'WARN %-12s create from .env.example with approved secrets\n' '.env.local'
fi

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi
