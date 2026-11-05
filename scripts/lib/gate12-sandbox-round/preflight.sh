#!/usr/bin/env bash
# preflight.sh — the Gate 12 round driver's start-up refusals and its read of the Gate 12 repository's
# own harness.config.json (`g12_preflight`). scripts/gate12-sandbox-round.sh calls it before every
# --repo subcommand; nothing else in the driver may run first.
#
# THE REFUSALS, IN ORDER. Each prints one `g12_refuse` line naming its cause and makes g12_preflight
# return non-zero. Nothing is created on any refusal; the only change before the last check is the
# `git fetch origin` check 6 needs, which writes remote-tracking refs and nothing else.
#   1. The run library (scripts/lib/harness-run-lib.sh, beside this directory) cannot be read, or
#      git, gh or jq is not on PATH.
#   2. The working directory is not inside a git checkout (a bare `git rev-parse --show-toplevel`,
#      held in G12_ROOT); or that top level is this script's own (G12_SCRIPT_ROOT), compared
#      canonically; or it carries scripts/lib/gate12-sandbox-round/core.sh, so it is any checkout
#      of the repository that ships this driver.
#   3. G12_ROOT/harness.config.json is absent: not adopted.
#   4. The configuration read below cannot resolve a value, or its screen refuses one.
#   5. The raw `remote.origin.url` (the value the operator wrote, not `git remote get-url`) is not
#      https://github.com/<o>/<n>[.git] or git@github.com:<o>/<n>[.git], or its <o>/<n> is not
#      G12_REPO, compared case-insensitively.
#   6. origin's GitHub default branch (`gh repo view`, held in G12_GITHUB_DEFAULT) carries no
#      .github/workflows/harness-run.yml, or one without the step `Install the sandbox prerequisites`:
#      a workflow rendered before the sandbox series (docs/development.md, the round's step 5).
# A refusal raises 2. A failed gh or git call raises 3.
#
# THE CONFIGURATION READ. The values come from scripts/lib/harness-run-lib.sh's readers on G12_ROOT,
# so they resolve exactly as the Gate 12 repository's own outer-loop scripts resolve them; the one
# check added here refuses a value that carries `..` or starts with `/`:
#   G12_STATE_DIR       hr_state_dir
#   G12_SCRIPTS_DIR     hr_scripts_dir
#   G12_CONFIG_DEFAULT  hr_default_branch
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array, no ${var,,}.

G12_ROOT=""
G12_STATE_DIR=""
G12_SCRIPTS_DIR=""
G12_CONFIG_DEFAULT=""
G12_GITHUB_DEFAULT=""

g12_preflight_refuse() {
  g12_refuse "refusing to start: $*"
  g12_exit_raise 2
  return 2
}

g12_preflight_failed() {
  g12_refuse "$*"
  g12_exit_raise 3
  return 3
}

# g12_config_screen <key> <hr_ reader> <variable> — the library's value for <key>, screened.
g12_config_screen() {
  local key="$1" reader="$2" var="$3" config="$G12_ROOT/harness.config.json" value status
  value="$("$reader" "$G12_ROOT")"
  status=$?
  case "$status" in
    0) ;;
    1) g12_preflight_refuse "'$config' carries no .$key"; return ;;
    *) g12_preflight_refuse "'$config' could not be read for .$key: it is unreadable, is not one JSON object, or carries no .defaultBranch"; return ;;
  esac
  case "$value" in
    /*) g12_preflight_refuse "'$config' .$key '$value' starts with /"; return ;;
    *..*) g12_preflight_refuse "'$config' .$key '$value' carries .."; return ;;
  esac
  printf -v "$var" '%s' "$value"
}

g12_canonical_dir() {
  (cd -P "$1" 2>/dev/null && pwd -P)
}

g12_preflight() {
  local lib tool root_canon script_canon url slug lower_slug lower_repo workflow

  lib="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)/lib/harness-run-lib.sh"
  [ -r "$lib" ] || { g12_preflight_refuse "cannot read the run library at '$lib'"; return; }
  # shellcheck source=../harness-run-lib.sh
  . "$lib"

  for tool in git gh jq; do
    command -v "$tool" >/dev/null 2>&1 || { g12_preflight_refuse "$tool is not on PATH"; return; }
  done

  G12_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
  [ -n "$G12_ROOT" ] ||
    { g12_preflight_refuse "the working directory is not inside a git checkout; run it from the Gate 12 repository's root"; return; }
  if [ -n "${G12_SCRIPT_ROOT:-}" ]; then
    root_canon="$(g12_canonical_dir "$G12_ROOT")"
    script_canon="$(g12_canonical_dir "$G12_SCRIPT_ROOT")"
    if [ -n "$root_canon" ] && [ "$root_canon" = "$script_canon" ]; then
      g12_preflight_refuse "'$G12_ROOT' is the checkout this script sits in; run it from the Gate 12 repository, never here"
      return
    fi
  fi
  if [ -e "$G12_ROOT/scripts/lib/gate12-sandbox-round/core.sh" ]; then
    g12_preflight_refuse "'$G12_ROOT' carries scripts/lib/gate12-sandbox-round/: it is a checkout of the repository that ships this driver; run it from the Gate 12 repository, never there"
    return
  fi

  [ -f "$G12_ROOT/harness.config.json" ] ||
    { g12_preflight_refuse "'$G12_ROOT' is not adopted: it carries no harness.config.json"; return; }
  # Warmed unsubstituted so the three readers' subshells reuse one parse.
  hr_config_load "$G12_ROOT" || :
  g12_config_screen stateDir hr_state_dir G12_STATE_DIR || return
  g12_config_screen scriptsDir hr_scripts_dir G12_SCRIPTS_DIR || return
  g12_config_screen defaultBranch hr_default_branch G12_CONFIG_DEFAULT || return

  url="$(git -C "$G12_ROOT" config --get remote.origin.url)"
  case $? in
    0) ;;
    1) g12_preflight_refuse "'$G12_ROOT' has no remote.origin.url"; return ;;
    *) g12_preflight_failed "git config --get remote.origin.url failed in '$G12_ROOT'"; return ;;
  esac
  case "$url" in
    https://github.com/*) slug="${url#https://github.com/}" ;;
    git@github.com:*) slug="${url#git@github.com:}" ;;
    *) g12_preflight_refuse "remote.origin.url '$url' is not a github.com https or git@ URL"; return ;;
  esac
  slug="${slug%.git}"
  case "$slug" in
    */*/* | /* | */ | "") g12_preflight_refuse "remote.origin.url '$url' does not name <owner>/<name>"; return ;;
    */*) ;;
    *) g12_preflight_refuse "remote.origin.url '$url' does not name <owner>/<name>"; return ;;
  esac
  lower_slug="$(printf '%s' "$slug" | tr '[:upper:]' '[:lower:]')"
  lower_repo="$(printf '%s' "$G12_REPO" | tr '[:upper:]' '[:lower:]')"
  [ "$lower_slug" = "$lower_repo" ] ||
    { g12_preflight_refuse "origin is '$slug', not --repo '$G12_REPO'"; return; }

  git -C "$G12_ROOT" fetch --quiet origin ||
    { g12_preflight_failed "git fetch origin failed in '$G12_ROOT'"; return; }
  G12_GITHUB_DEFAULT="$(gh repo view "$G12_REPO" --json defaultBranchRef --jq .defaultBranchRef.name)" ||
    { g12_preflight_failed "gh repo view $G12_REPO failed"; return; }
  [ -n "$G12_GITHUB_DEFAULT" ] ||
    { g12_preflight_failed "gh repo view $G12_REPO printed no default branch"; return; }

  workflow="origin/$G12_GITHUB_DEFAULT:.github/workflows/harness-run.yml"
  git -C "$G12_ROOT" cat-file -e "$workflow" 2>/dev/null ||
    { g12_preflight_refuse "$workflow is absent: render it with init --upgrade-workflows at the sandbox-series version (docs/development.md, Gate 12 round step 5)"; return; }
  workflow="$(git -C "$G12_ROOT" show "$workflow")" ||
    { g12_preflight_failed "git show origin/$G12_GITHUB_DEFAULT:.github/workflows/harness-run.yml failed"; return; }
  case "$workflow" in
    *"Install the sandbox prerequisites"*) ;;
    *)
      g12_preflight_refuse "origin/$G12_GITHUB_DEFAULT's harness-run.yml has no step Install the sandbox prerequisites: it was rendered before the sandbox series (0.6.7 has neither it nor Sweep the sandbox placeholders); re-render it with init --upgrade-workflows (docs/development.md, Gate 12 round step 5)"
      return
      ;;
  esac
  return 0
}
