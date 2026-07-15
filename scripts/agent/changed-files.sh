#!/usr/bin/env bash
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

printf '%s\n' '== Diff stat =='
git diff --stat
git diff --cached --stat

printf '\n%s\n' '== Changed tracked files =='
{ git diff --name-status; git diff --cached --name-status; } | sort -u | sed -n '1,200p'

printf '\n%s\n' '== Untracked files =='
git ls-files --others --exclude-standard | sed -n '1,200p'
