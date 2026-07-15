#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  printf 'Usage: %s <pattern> [path]\n' "$0" >&2
  exit 2
fi

pattern="$1"
scope="${2:-.}"
root="$(git rev-parse --show-toplevel)"
cd "$root"

rg -n --hidden \
  -g '!node_modules/**' -g '!.next/**' -g '!coverage/**' -g '!.artifacts/**' -g '!.git/**' \
  -- "$pattern" "$scope" | sed -n '1,200p'
