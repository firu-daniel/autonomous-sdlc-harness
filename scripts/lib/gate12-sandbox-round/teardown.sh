#!/usr/bin/env bash
# teardown.sh — the `teardown` subcommand: delete every branch the state file records, on origin and
# locally, then confirm that the GitHub default branch and the repository variables are the recorded
# ones.
#
# It deletes, in the Gate 12 repository only, each name in the state's branches[] and its
# other_branch: refs/heads/<name> on origin when ls-remote lists it, and the local ref when it exists.
# It never deletes a branch the state does not record, whatever its name looks like
# (harness-runs/lessons.md -> "never removes one it did not create"), nor the recorded default
# branch, nor the live GitHub default; it never deletes the repository, and it leaves runs[], tokens
# and the scratch directory in place: `grade` re-reads them, and round step 10's reset to the seed,
# by hand, removes them.
#
# It confirms rather than restores: the default-branch leg owns the restore (g12_db_restore), so a
# default branch or a variable found unrestored here means that restore failed, and teardown names
# the command that finishes it instead of changing GitHub a second time.
#
#   g12_teardown_cmd
#       Stdout: `deleted <name>` per removed name, then
#       `teardown: <n> branch(es) deleted; default branch <name> confirmed`, where the tail reads
#       `default branch <live> unchanged (none recorded)` when the default-branch leg recorded none and
#       `default branch <live> not confirmed (recorded <name>)` on a mismatch.
#
# A name whose deletion fails stays in the state, its hand command goes to stderr, and 5 is raised;
# so do an unconfirmed default branch and a variable recorded `restored: false`. A failed read of the
# state file, or of the default branch, raises 3.
#
# SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`.
# Bash 3.2 is the floor (macOS /bin/bash): no associative array.

# g12_td_hand <command>... — a step left undone: name the command that finishes it, raise 5.
g12_td_hand() {
  local cmd
  printf -v cmd '%q ' "$@"
  g12_refuse "teardown left a step undone; finish it by hand with: ${cmd% }"
  g12_exit_raise 5
}

# g12_td_branch <name> <protected names, space-separated> — status 0 when the name is gone from
# origin, from refs/heads and from the state.
g12_td_branch() {
  local name="$1" keep="$2" listed failed=0
  case " $keep " in
    *" $name "*)
      g12_refuse "$name is recorded for teardown but is the default branch; restore the default branch, then run teardown again"
      g12_exit_raise 5
      return 1
      ;;
  esac
  if listed="$(git -C "$G12_ROOT" ls-remote --heads origin "refs/heads/$name")"; then
    if [ -n "$listed" ] &&
      ! git -C "$G12_ROOT" push --no-verify origin --delete "$name" >&2; then
      g12_td_hand git -C "$G12_ROOT" push --no-verify origin --delete "$name"
      failed=1
    fi
  else
    g12_refuse "git ls-remote --heads origin refs/heads/$name failed in '$G12_ROOT'"
    g12_td_hand git -C "$G12_ROOT" push --no-verify origin --delete "$name"
    failed=1
  fi
  if git -C "$G12_ROOT" show-ref --verify --quiet "refs/heads/$name" &&
    ! git -C "$G12_ROOT" update-ref -d "refs/heads/$name"; then
    g12_td_hand git -C "$G12_ROOT" update-ref -d "refs/heads/$name"
    failed=1
  fi
  [ "$failed" -eq 0 ] || return 1
  if ! g12_state_update '.branches |= map(select(.name != $n))
      | if .other_branch == $n then .other_branch = null else . end' --arg n "$name"; then
    g12_refuse "$name is deleted but still recorded in the state file; remove its entry by hand"
    g12_exit_raise 5
    return 1
  fi
  printf 'deleted %s\n' "$name"
}

g12_teardown_cmd() {
  local recorded live tail names name keep vars n=0 present value
  g12_need g12_state_path g12_state_repo_check g12_state_get g12_state_update
  if [ ! -f "$(g12_state_path)" ]; then
    g12_refuse "no state file at '$(g12_state_path)': nothing is recorded, so nothing is deleted"
  else
    g12_state_repo_check "$(g12_state_path)" || { g12_exit_raise 3; return 3; }
  fi

  recorded=""
  if [ -f "$(g12_state_path)" ]; then
    recorded="$(g12_state_get '.default_branch // empty')" || { g12_exit_raise 3; return 3; }
  fi
  if ! live="$(gh repo view "$G12_REPO" --json defaultBranchRef --jq .defaultBranchRef.name)" || [ -z "$live" ]; then
    g12_refuse "gh repo view $G12_REPO did not print the default branch; nothing is deleted"
    g12_exit_raise 3
    return 3
  fi
  if [ -z "$recorded" ]; then
    tail="default branch $live unchanged (none recorded)"
  elif [ "$recorded" = "$live" ]; then
    tail="default branch $live confirmed"
  else
    g12_refuse "the GitHub default branch is $live, not the recorded $recorded"
    g12_td_hand gh repo edit "$G12_REPO" --default-branch "$recorded"
    tail="default branch $live not confirmed (recorded $recorded)"
  fi

  if [ -f "$(g12_state_path)" ]; then
    vars="$(g12_state_get '.variables // {} | to_entries[] | select(.value.restored == false)
      | [.key, (.value.present | tostring), (.value.value // "")] | @tsv')" || { g12_exit_raise 3; return 3; }
    while IFS=$'\t' read -r name present value; do
      [ -n "$name" ] || continue
      g12_refuse "repository variable $name is recorded restored: false"
      if [ "$present" = true ]; then
        g12_td_hand gh variable set "$name" --repo "$G12_REPO" --body "$value"
      else
        g12_td_hand gh variable delete "$name" --repo "$G12_REPO"
      fi
    done <<<"$vars"

    names="$(g12_state_get '[.branches[].name, (.other_branch // empty)]
      | map(select(type == "string" and . != "")) | unique | .[]')" || { g12_exit_raise 3; return 3; }
    keep="$live${recorded:+ $recorded}"
    while IFS= read -r name; do
      [ -n "$name" ] || continue
      if g12_td_branch "$name" "$keep"; then
        n=$((n + 1))
      fi
    done <<<"$names"
  fi

  printf 'teardown: %s branch(es) deleted; %s\n' "$n" "$tail"
}
