#!/usr/bin/env bash
# preflight.sh — the Gate 12 round driver's start-up refusals and its read of the Gate 12 repository's
# own harness.config.json (`g12_preflight`). scripts/gate12-sandbox-round.sh calls it before every
# --repo subcommand; nothing else in the driver may run first.
#
# THE REFUSALS, IN ORDER. Each prints one `g12_refuse` line naming its cause and makes g12_preflight
# return non-zero. Nothing is created on any refusal; the only change before the last check is the
# `git fetch origin` check 6 needs, which writes remote-tracking refs and nothing else.
#   1. git, gh or jq is not on PATH.
#   2. The working directory is not inside a git checkout (a bare `git rev-parse --show-toplevel`,
#      held in G12_ROOT), or that top level is this script's own (G12_SCRIPT_ROOT), compared
#      canonically: this refuses this repository and any copy carrying the script.
#   3. G12_ROOT/harness.config.json is absent or does not parse to an object: not adopted.
#   4. The configuration read below refuses a value.
#   5. The raw `remote.origin.url` (the value the operator wrote, not `git remote get-url`) is not
#      https://github.com/<o>/<n>[.git] or git@github.com:<o>/<n>[.git], or its <o>/<n> is not
#      G12_REPO, compared case-insensitively.
#   6. origin's GitHub default branch (`gh repo view`, held in G12_GITHUB_DEFAULT) carries no
#      .github/workflows/harness-run.yml, or one without the step `Install the sandbox prerequisites`:
#      a workflow rendered before the sandbox series (docs/development.md, the round's step 5).
# A refusal raises 2. A failed gh or git call raises 3.
#
# THE CONFIGURATION READ. Sets, with any trailing `/` stripped, and refuses a value that is not a
# string, is empty, carries `..` or starts with `/`:
#   G12_STATE_DIR       .stateDir, default sdlc-harness
#   G12_SCRIPTS_DIR     .scriptsDir, default scripts
#   G12_CONFIG_DEFAULT  .defaultBranch, which the schema requires, so no default
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

# g12_config_dir <key> <default, or empty for none> <variable> — one configuration value, validated.
g12_config_dir() {
  local key="$1" def="$2" var="$3" config="$G12_ROOT/harness.config.json" value kind
  kind="$(jq -r --arg k "$key" 'if has($k) then (.[$k] | type) else "absent" end' "$config")" ||
    { g12_preflight_refuse "'$config' could not be read for .$key"; return; }
  case "$kind" in
    absent)
      [ -n "$def" ] || { g12_preflight_refuse "'$config' carries no .$key"; return; }
      value="$def"
      ;;
    string)
      value="$(jq -r --arg k "$key" '.[$k]' "$config")" ||
        { g12_preflight_refuse "'$config' could not be read for .$key"; return; }
      ;;
    *)
      g12_preflight_refuse "'$config' .$key is a $kind, not a string"
      return
      ;;
  esac
  case "$value" in
    /*) g12_preflight_refuse "'$config' .$key '$value' starts with /"; return ;;
    *..*) g12_preflight_refuse "'$config' .$key '$value' carries .."; return ;;
  esac
  while [ "${value%/}" != "$value" ]; do
    value="${value%/}"
  done
  [ -n "$value" ] || { g12_preflight_refuse "'$config' .$key is empty"; return; }
  printf -v "$var" '%s' "$value"
}

g12_canonical_dir() {
  (cd -P "$1" 2>/dev/null && pwd -P)
}

g12_preflight() {
  local tool root_canon script_canon url slug lower_slug lower_repo workflow

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

  [ -f "$G12_ROOT/harness.config.json" ] ||
    { g12_preflight_refuse "'$G12_ROOT' is not adopted: it carries no harness.config.json"; return; }
  jq -e 'type == "object"' "$G12_ROOT/harness.config.json" >/dev/null 2>&1 ||
    { g12_preflight_refuse "'$G12_ROOT/harness.config.json' does not parse to a JSON object"; return; }

  g12_config_dir stateDir sdlc-harness G12_STATE_DIR || return
  g12_config_dir scriptsDir scripts G12_SCRIPTS_DIR || return
  g12_config_dir defaultBranch "" G12_CONFIG_DEFAULT || return

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
