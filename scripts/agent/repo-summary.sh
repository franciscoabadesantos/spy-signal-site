#!/usr/bin/env bash
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

printf '%s\n' '== Git =='
git status --short --branch | sed -n '1,80p'

printf '\n%s\n' '== Runtime =='
printf 'node %s | npm %s\n' "$(node --version 2>/dev/null || printf 'missing')" "$(npm --version 2>/dev/null || printf 'missing')"
sed -n '/"scripts"[[:space:]]*:/,/^[[:space:]]*},/p' package.json | sed -n '1,40p'

printf '\n%s\n' '== Source files by top-level area =='
rg --files \
  -g '!node_modules/**' -g '!.next/**' -g '!coverage/**' -g '!.artifacts/**' \
  | awk -F/ '{ count[$1]++ } END { for (path in count) print count[path], path }' \
  | sort -nr | sed -n '1,40p'

printf '\n%s\n' '== App entry points =='
find app -type f \( -name 'page.tsx' -o -name 'route.ts' -o -name 'layout.tsx' -o -name 'loading.tsx' -o -name 'error.tsx' \) \
  | sort | sed -n '1,120p'
