#!/usr/bin/env bash
# state.sh — the Gate 12 round driver's one state file, which every subcommand reads and writes, and
# the one derivation of its scratch root. It reads G12_ROOT and G12_STATE_DIR, which g12_preflight
# sets, and G12_REPO.
#
# The file lives in the Gate 12 repository, at <stateDir>/scratch/gate12-sandbox-round/state.json,
# which that repository's managed ignore block ignores by its contents. Every other path under the
# scratch root (runs/<id>/..., evidence/<row>.log) is built on g12_scratch_dir, never on the literal.
#
#   g12_scratch_dir                       prints $G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round
#   g12_state_path                        prints $(g12_scratch_dir)/state.json
#   g12_state_init                        creates the directory and the initial file when it is absent
#   g12_state_get <filter> [jq args]...   jq -r over the file
#   g12_state_update <program> [jq args]... rewrites the file through a mktemp sibling and mv
# Each returns 1 after a g12_refuse line on a missing file, a failed jq or write, or a file whose
# `repo` is not G12_REPO, and raises no exit code: the caller picks it.
#
# THE KEY SHAPES.
#   schema          1
#   repo            <owner>/<name>; a file whose repo is not G12_REPO is refused
#   default_branch  the GitHub default branch recorded before the default-branch leg changed it, or null
#   branches[]      {name, row, arm, commit}
#   runs[]          {row, arm, branch, run_id, dispatched_at[, stall_values_unconfirmed]}
#                   stall_values_unconfirmed: boolean, read as false when absent; written only by the
#                   default-branch leg, on the JS3 entry, when its wait for the run to start times out
#   tokens          keyed by row
#   other_branch    the branch the default-branch leg pushed, or null
#   variables       keyed by name, each {present, value, restored}
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

g12_scratch_dir() {
  printf '%s\n' "$G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round"
}

g12_state_path() {
  printf '%s/state.json\n' "$(g12_scratch_dir)"
}

g12_state_repo_check() {
  local path="$1" repo
  repo="$(jq -r '.repo // empty' "$path" 2>/dev/null)" ||
    { g12_refuse "state file '$path' does not parse"; return 1; }
  [ "$repo" = "$G12_REPO" ] ||
    { g12_refuse "state file '$path' belongs to '$repo', not --repo '$G12_REPO'"; return 1; }
}

# g12_state_write <path> <jq args>... — jq's output into a mktemp sibling, then mv over <path>.
g12_state_write() {
  local path="$1" dir tmp
  shift
  dir="${path%/*}"
  tmp="$(mktemp "$dir/state.json.XXXXXX")" ||
    { g12_refuse "could not create a temporary file in '$dir'"; return 1; }
  if ! jq "$@" >"$tmp"; then
    rm -f "$tmp"
    g12_refuse "jq failed writing state file '$path'"
    return 1
  fi
  # The program must leave the file this repository's: a rewrite of .repo is refused too.
  if ! g12_state_repo_check "$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  mv -f "$tmp" "$path" ||
    { rm -f "$tmp"; g12_refuse "could not move the new state file over '$path'"; return 1; }
}

g12_state_init() {
  local dir path
  dir="$(g12_scratch_dir)"
  path="$(g12_state_path)"
  if [ -f "$path" ]; then
    g12_state_repo_check "$path"
    return
  fi
  mkdir -p "$dir" || { g12_refuse "could not create '$dir'"; return 1; }
  g12_state_write "$path" -n --arg repo "$G12_REPO" \
    '{schema: 1, repo: $repo, default_branch: null, branches: [], runs: [], tokens: {},
      other_branch: null, variables: {}}'
}

g12_state_get() {
  local filter="${1:-}" path
  shift
  path="$(g12_state_path)"
  [ -f "$path" ] || { g12_refuse "state file '$path' is absent"; return 1; }
  jq -r "$@" "$filter" "$path" || { g12_refuse "jq failed reading state file '$path'"; return 1; }
}

g12_state_update() {
  local program="${1:-}" path
  shift
  path="$(g12_state_path)"
  [ -f "$path" ] || { g12_refuse "state file '$path' is absent"; return 1; }
  g12_state_repo_check "$path" || return 1
  g12_state_write "$path" "$@" "$program" "$path"
}
