#!/usr/bin/env bash
# plant.sh — round step 7's mechanics: build each throwaway branch by plumbing on the GitHub default
# branch's tip, record it, push it, dispatch its job through the Gate 12 repository's own
# remote-run.sh, and record the run ID. What each branch carries is g12_plant_files's (plants.sh).
#
# It changes, in the Gate 12 repository only: local refs refs/heads/gate12_*, the same branches on
# origin, and the state file's branches[] and runs[]. It deletes nothing it created; teardown does.
# The checkout's own index, HEAD and working tree are never touched.
#
#   g12_branch_build <branch> <dir>
#       Writes objects only: a prompt commit on origin/$G12_GITHUB_DEFAULT placing <dir>/task_prompt.md
#       at $G12_STATE_DIR/task_prompts/<branch>_task_prompt.md, then, unless <dir>/manifest has no
#       entry, a plant commit of its `<mode>\t<repo-relative path>\t<file under dir>` lines (mode
#       100644, 100755 or 120000; a 120000 file's bytes are the link target, verbatim). The plant
#       subject's row and arm are read back off the branch name g12_plant_cmd builds. Prints the tip
#       commit; creates no ref. Runs in a subshell, so its temporary index is removed on every exit
#       and it raises no exit code: the caller raises 3.
#   g12_branch_push <row> <arm> <branch> <commit>
#       The one producer of a branches[] entry: refuses an existing local ref, records the entry, then
#       creates the ref (dropping the entry if that fails) and pushes. Raises 3 on any failure.
#   g12_dispatch <row> <arm> <branch>
#       remote-run.sh dispatch <branch> --engine task, then the run-ID lookup; appends runs[] and sets
#       G12_DISPATCHED_RUN_ID (empty when not found). Raises 3 on a failed dispatch or lookup.
#   g12_plant_cmd
#       The `plant` subcommand: every selected plant-route row's arms; a selected row of another route
#       is printed as not this subcommand's. Stdout: `planted <row> <arm> <branch> run <id|null>`.
#
# Test seams, read from the environment:
#   G12_RUN_LOOKUP_TRIES       run-ID lookups before giving up, default 10
#   G12_RUN_LOOKUP_DELAY_SECS  seconds between lookups, default 3
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array, no ${var,,}.

G12_DISPATCHED_RUN_ID=""

# g12_manifest_safe <name> — a repo-relative or dir-relative name: not empty, not absolute, no `..`.
g12_manifest_safe() {
  case "$1" in
    "" | /* | .. | ../* | */.. | */../*) return 1 ;;
  esac
}

g12_branch_build() (
  branch="${1:-}"
  dir="${2:-}"
  idx=""
  trap '[ -z "$idx" ] || rm -f "$idx"' EXIT
  git_root() { git -C "$G12_ROOT" "$@"; }
  git_idx() { GIT_INDEX_FILE="$idx" git -C "$G12_ROOT" "$@"; }

  [ -n "$branch" ] && [ -n "$dir" ] || { g12_refuse "g12_branch_build needs <branch> <dir>"; exit 1; }
  [ -f "$dir/task_prompt.md" ] || { g12_refuse "g12_branch_build: '$dir/task_prompt.md' is absent"; exit 1; }
  [ -f "$dir/manifest" ] || { g12_refuse "g12_branch_build: '$dir/manifest' is absent"; exit 1; }

  base="$(git_root rev-parse --verify --quiet "refs/remotes/origin/$G12_GITHUB_DEFAULT^{commit}")" ||
    { g12_refuse "origin/$G12_GITHUB_DEFAULT does not resolve to a commit in '$G12_ROOT'"; exit 1; }
  idx="$(mktemp "${TMPDIR:-/tmp}/gate12-index.XXXXXX")" ||
    { g12_refuse "could not create a temporary index file"; exit 1; }
  git_idx read-tree "$base" || { g12_refuse "git read-tree $base failed"; exit 1; }

  prompt_path="$G12_STATE_DIR/task_prompts/${branch}_task_prompt.md"
  blob="$(git_root hash-object -w --stdin <"$dir/task_prompt.md")" &&
    git_idx update-index --add --cacheinfo "100644,$blob,$prompt_path" &&
    tree="$(git_idx write-tree)" &&
    tip="$(git_root commit-tree "$tree" -p "$base" -m "chore: add task prompt for $branch")" ||
    { g12_refuse "could not build the prompt commit for $branch"; exit 1; }

  entries=0
  while IFS=$'\t' read -r mode path file || [ -n "$mode" ]; do
    [ -n "$mode$path$file" ] || continue
    case "$mode" in
      100644 | 100755 | 120000) ;;
      *) g12_refuse "$dir/manifest: mode '$mode' for '$path' is not 100644, 100755 or 120000"; exit 1 ;;
    esac
    g12_manifest_safe "$path" && g12_manifest_safe "$file" ||
      { g12_refuse "$dir/manifest: '$path' / '$file' is empty, absolute or carries .."; exit 1; }
    [ -f "$dir/$file" ] || { g12_refuse "$dir/manifest: '$dir/$file' is not a file"; exit 1; }
    blob="$(git_root hash-object -w --stdin <"$dir/$file")" &&
      git_idx update-index --add --cacheinfo "$mode,$blob,$path" ||
      { g12_refuse "could not place '$path' for $branch"; exit 1; }
    entries=$((entries + 1))
  done <"$dir/manifest"

  if [ "$entries" -gt 0 ]; then
    # The name is gate12_<row lower-case>_<arm>_<stamp>; an arm carries no `_`.
    rest="${branch#gate12_}"
    row="${rest%%_*}"
    rest="${rest#*_}"
    arm="${rest%_*}"
    if [ "$rest" = "${branch#gate12_}" ] || [ -z "$row" ] || [ -z "$arm" ] || [ "$arm" = "$rest" ]; then
      g12_refuse "g12_branch_build: '$branch' is not gate12_<row>_<arm>_<stamp>, so the plant commit has no subject"
      exit 1
    fi
    row="$(printf '%s' "$row" | tr '[:lower:]' '[:upper:]')"
    tree="$(git_idx write-tree)" &&
      tip="$(git_root commit-tree "$tree" -p "$tip" -m "chore: Plant $row $arm for Gate 12")" ||
      { g12_refuse "could not build the plant commit for $branch"; exit 1; }
  fi
  printf '%s\n' "$tip"
)

g12_branch_push() {
  local row="${1:-}" arm="${2:-}" branch="${3:-}" commit="${4:-}"
  if git -C "$G12_ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
    g12_refuse "refs/heads/$branch already exists in '$G12_ROOT': it is not this run's, so it is not recorded or pushed"
    g12_exit_raise 3
    return 3
  fi
  if ! g12_state_update '.branches += [{name: $name, row: $row, arm: $arm, commit: $commit}]' \
    --arg name "$branch" --arg row "$row" --arg arm "$arm" --arg commit "$commit"; then
    g12_refuse "could not record $branch in the state file; nothing was created"
    g12_exit_raise 3
    return 3
  fi
  if ! git -C "$G12_ROOT" update-ref "refs/heads/$branch" "$commit" ""; then
    g12_refuse "git update-ref refs/heads/$branch failed"
    if ! g12_state_update '.branches |= map(select(.name != $name))' --arg name "$branch"; then
      g12_refuse "could not remove $branch from the state file's branches[]; no such ref was created, so remove that entry by hand"
      g12_exit_raise 5
    fi
    g12_exit_raise 3
    return 3
  fi
  if ! git -C "$G12_ROOT" push --no-verify origin "refs/heads/$branch:refs/heads/$branch"; then
    g12_refuse "git push of $branch failed; it stays recorded for teardown and is not dispatched"
    g12_exit_raise 3
    return 3
  fi
}

g12_dispatch() {
  local row="${1:-}" arm="${2:-}" branch="${3:-}"
  local tries="${G12_RUN_LOOKUP_TRIES:-10}" delay="${G12_RUN_LOOKUP_DELAY_SECS:-3}"
  local at n=0 json id="" lookup
  G12_DISPATCHED_RUN_ID=""
  case "$tries" in "" | 0* | *[!0-9]*) g12_refuse "G12_RUN_LOOKUP_TRIES '$tries' is not a positive integer"; g12_exit_raise 1; return 1 ;; esac
  case "$delay" in "" | *[!0-9]*) g12_refuse "G12_RUN_LOOKUP_DELAY_SECS '$delay' is not a whole number"; g12_exit_raise 1; return 1 ;; esac

  at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  # remote-run.sh's own narration goes to stderr: stdout carries the subcommand's result lines only.
  if ! (cd "$G12_ROOT" && bash "$G12_ROOT/$G12_SCRIPTS_DIR/remote-run.sh" dispatch "$branch" --engine task) >&2; then
    g12_refuse "remote-run.sh dispatch $branch --engine task failed; $branch stays recorded for teardown"
    g12_exit_raise 3
    return 3
  fi

  lookup="gh run list --repo $G12_REPO --workflow harness-run.yml --branch $branch --json databaseId,createdAt,displayTitle --limit 20"
  while [ "$n" -lt "$tries" ]; do
    n=$((n + 1))
    if json="$(gh run list --repo "$G12_REPO" --workflow harness-run.yml --branch "$branch" \
      --json databaseId,createdAt,displayTitle --limit 20)"; then
      # The title is harness-run.yml's run-name, `harness <action> <branch>`.
      id="$(jq -r --arg t "harness run $branch" \
        '[.[] | select(.displayTitle == $t)] | sort_by(.createdAt) | last | .databaseId // empty' <<<"$json")" || id=""
      case "$id" in "" | *[!0-9]*) id="" ;; *) break ;; esac
    fi
    [ "$n" -ge "$tries" ] || sleep "$delay"
  done

  if ! g12_state_update '.runs += [{row: $row, arm: $arm, branch: $branch, run_id: $id, dispatched_at: $at}]' \
    --arg row "$row" --arg arm "$arm" --arg branch "$branch" --argjson id "${id:-null}" --arg at "$at"; then
    g12_refuse "could not record the run of $branch in the state file; find it with: $lookup"
    g12_exit_raise 3
    return 3
  fi
  if [ -z "$id" ]; then
    g12_refuse "no run titled 'harness run $branch' after $tries lookups, recorded as run_id null; find it with: $lookup"
    g12_exit_raise 3
    return 3
  fi
  G12_DISPATCHED_RUN_ID="$id"
}

# g12_plant_dir_remove <dir> — the files g12_plant_files wrote, by name, then the directory.
g12_plant_dir_remove() {
  local dir="$1" mode path file
  if [ -f "$dir/manifest" ]; then
    while IFS=$'\t' read -r mode path file || [ -n "$mode" ]; do
      if [ -n "$file" ] && g12_manifest_safe "$file"; then
        rm -f "$dir/$file"
      fi
    done <"$dir/manifest"
  fi
  rm -f "$dir/manifest" "$dir/task_prompt.md"
  rmdir "$dir" 2>/dev/null || {
    g12_refuse "the temporary plant directory '$dir' was left behind: it holds a file the manifest does not name"
    g12_exit_raise 5
  }
}

g12_plant_arm() {
  local row="$1" arm="$2" recorded lower branch dir commit status=0
  recorded="$(g12_state_get '[.branches[] | select(.row == $row and .arm == $arm) | .name] | first // empty' \
    --arg row "$row" --arg arm "$arm")" || { g12_exit_raise 3; return 3; }
  if [ -n "$recorded" ]; then
    g12_refuse "$row $arm is already planted as $recorded; run teardown before planting it again"
    g12_exit_raise 2
    return 2
  fi
  lower="$(printf '%s' "$row" | tr '[:upper:]' '[:lower:]')"
  branch="gate12_${lower}_${arm}_$(date -u +%Y%m%d%H%M%S)"
  dir="$(mktemp -d "${TMPDIR:-/tmp}/gate12-plant.XXXXXX")" ||
    { g12_refuse "could not create a temporary plant directory"; g12_exit_raise 3; return 3; }

  if ! g12_plant_files "$row" "$arm" "$branch" "$dir"; then
    g12_refuse "g12_plant_files refused $row $arm; nothing was planted for it"
    g12_exit_raise 2
    status=2
  elif ! commit="$(g12_branch_build "$branch" "$dir")"; then
    g12_exit_raise 3
    status=3
  fi
  g12_plant_dir_remove "$dir"
  [ "$status" -eq 0 ] || return "$status"

  g12_branch_push "$row" "$arm" "$branch" "$commit" || return
  g12_dispatch "$row" "$arm" "$branch"
  status=$?
  # The branch is pushed and recorded whether or not its run was found.
  printf 'planted %s %s %s run %s\n' "$row" "$arm" "$branch" "${G12_DISPATCHED_RUN_ID:-null}"
  return "$status"
}

g12_plant_cmd() {
  local rows row route arm arms
  g12_need g12_plant_files
  g12_state_init || { g12_exit_raise 3; return 3; }
  rows="$G12_ROWS_SELECTED"
  [ -n "$rows" ] || rows="$(g12_row_names)"
  for row in $rows; do
    route="$(g12_row_field "$row" 3)" || continue
    if [ "$route" != plant ]; then
      # Every row is walked when none is selected; only a row named by --row is reported.
      [ -z "$G12_ROWS_SELECTED" ] ||
        printf 'not planted %s: its route is %s, not plant: %s\n' "$row" "$route" "$(g12_row_field "$row" 5)"
      continue
    fi
    arms="$(g12_row_arms "$row")"
    for arm in $arms; do
      g12_plant_arm "$row" "$arm"
    done
  done
}
