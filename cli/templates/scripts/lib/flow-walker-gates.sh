#!/usr/bin/env bash
# flow-walker-gates.sh — the mechanical answers the flow walker needs at a
# gate, each defined once: the next free `review_<n>` index in a findings
# folder, that folder's round count, the run mode's skipped ids, whether a
# `phases.*` flag is on, and the escalation evidence a story index or UI-test
# index carries.
#
# IT ANSWERS AND NEVER DECIDES. Which node comes next, whether a counter hit
# its cap and what the walker prints are the walker's. Nothing here writes
# anything — not even the walker's state file — and the findings-folder
# functions list names only and open no file.
#
# SOURCED, NEVER EXECUTED, AND IT SOURCES NOTHING. It sets no shell option, so
# the sourcing script's shell is left exactly as found. `fw_phase_on` calls
# `hr_phase_enabled`, so the caller sources `lib/harness-run-lib.sh` first.
#
# BASH 3.2 AND JQ 1.5 ARE THE FLOORS, as in `lib/harness-run-lib.sh`: no
# associative array, no array-reading builtin, no `${x,,}` / `${x^^}`, no `local -n`.
# Nothing here calls `jq` directly.
#
# NAMING AND STATUSES. Every function is prefixed `fw_` and touches no variable
# outside a `local`. Statuses follow `lib/harness-run-lib.sh`: 0 yes / answered,
# 1 no / not set, 2 unresolvable — and a caller that treats 2 as 1 acts on a
# record it could not read.
#
# REPRO — reproduce any answer by hand, against a throwaway fixture:
#
#   root=$(mktemp -d); git -C "$root" init -q
#   printf '{"defaultBranch":"main","stateDir":"sdlc-harness/","phases":{"qa":true}}' > "$root/harness.config.json"
#   . <repo>/<scripts_dir>/lib/harness-run-lib.sh
#   . <repo>/<scripts_dir>/lib/flow-walker-gates.sh
#
#   review index      mkdir "$root/f"; : > "$root/f/review_0.md"; : > "$root/f/review_3.md"
#                     fw_next_review_index "$root/f"   -> 4   (a gap is never back-filled)
#                     fw_round_count "$root/f"         -> 2
#                     fw_next_review_index "$root/nope"; fw_round_count "$root/nope"  -> 0, 0
#   run mode          fw_run_mode_skipped "$root" sdlc-harness/ feat_x none      -> none
#                     fw_run_mode_skipped "$root" sdlc-harness/ feat_x ''; echo $?  -> 1, prints nothing
#                     mkdir -p "$root/sdlc-harness/flow_progress"
#                     printf '## Run mode\n- skipped: parity, qa\n' > "$root/sdlc-harness/flow_progress/feat_x_progress.md"
#                     fw_run_mode_skipped "$root" sdlc-harness/ feat_x none      -> parity, qa   (the ledger wins)
#                     fw_id_in_list qa 'parity, qa'; echo $?   -> 0
#                     fw_id_in_list qa none; echo $?           -> 1
#   phase flag        fw_phase_on "$root" qa; echo $?     -> 0
#                     fw_phase_on "$root" docs; echo $?   -> 1
#                     fw_phase_on "$root" bogus; echo $?  -> 2
#   index evidence    printf '## Rejected findings\n- **3** (rejected round 1; rebutted round 2 — call stands) — r\n- **5** (rejected round 2) — r\n## Scope register\n' > "$root/i.md"
#                     fw_index_evidence "$root/i.md"
#                     -> evidence: <root>/i.md ## Rejected findings
#                        evidence.open: - **5** (rejected round 2) — r
#                        evidence: <root>/i.md ## Scope register
#                     fw_index_evidence "$root/absent.md"  -> prints nothing

# Print one past the highest <n> among entries named exactly `review_<n>.md`,
# or 0 when the folder is absent or holds none. `ls`, not a glob, so a caller
# running with pathname expansion off gets the same answer.
fw_next_review_index() {
  local folder="${1-}" name n max=-1
  [ -d "$folder" ] || { printf '0\n'; return 0; }
  ls -1 -- "$folder" 2>/dev/null | {
    while IFS= read -r name; do
      case "$name" in
        review_*.md) ;;
        *) continue ;;
      esac
      n="${name#review_}"
      n="${n%.md}"
      case "$n" in
        ''|*[!0-9]*) continue ;;
      esac
      n=$((10#$n))
      [ "$n" -gt "$max" ] && max="$n"
    done
    printf '%s\n' "$((max + 1))"
  }
  return 0
}

# Print how many entries start with `review_` — the core's
# `ls <findings_folder> | grep -c '^review_'`, not the highest index.
fw_round_count() {
  local folder="${1-}" name count=0
  [ -d "$folder" ] || { printf '0\n'; return 0; }
  ls -1 -- "$folder" 2>/dev/null | {
    while IFS= read -r name; do
      case "$name" in
        review_*) count=$((count + 1)) ;;
      esac
    done
    printf '%s\n' "$count"
  }
  return 0
}

# Print the run mode's skipped ids (comma-separated, or `none`). A ledger at
# `<state_dir>/flow_progress/<branch>_progress.md` is the record and its
# `## Run mode` block's `- skipped: ` line wins over <flag_value>
# (`run_mode_instructions.md` → `## The durable record`, **Tie-break**).
# Returns 2 when the ledger exists but carries no such line; returns 1 when
# there is no ledger and <flag_value> is empty — there is no default.
fw_run_mode_skipped() {
  local root="${1-}" state_dir="${2-}" branch="${3-}" flag="${4-}" ledger value
  state_dir="${state_dir%/}"
  ledger="$root/$state_dir/flow_progress/${branch}_progress.md"
  if [ -f "$ledger" ]; then
    value=$(awk '
      /^## / { in_rm = ($0 ~ /^## Run mode[ \t\r]*$/); next }
      in_rm && /^- skipped: / { v = substr($0, 12); sub(/[ \t\r]+$/, "", v); print v; exit }
    ' "$ledger" 2>/dev/null)
    [ -n "$value" ] || return 2
    printf '%s\n' "$value"
    return 0
  fi
  [ -n "$flag" ] || return 1
  printf '%s\n' "$flag"
  return 0
}

# Exit 0 when <id> is a member of <csv>, 1 otherwise. `none` is the empty set;
# whitespace around each member is ignored.
fw_id_in_list() {
  local id="${1-}" rest="${2-}" item
  [ -n "$id" ] || return 1
  while [ -n "$rest" ]; do
    item="${rest%%,*}"
    case "$rest" in
      *,*) rest="${rest#*,}" ;;
      *) rest='' ;;
    esac
    item="${item#"${item%%[![:space:]]*}"}"
    item="${item%"${item##*[![:space:]]}"}"
    [ "$item" = none ] && continue
    [ "$item" = "$id" ] && return 0
  done
  return 1
}

# Pass `hr_phase_enabled`'s 0 / 1 / 2 through unchanged.
fw_phase_on() {
  hr_phase_enabled "${1-}" "${2-}"
}

# Print the escalation evidence an index carries, or nothing when the file is
# absent. `call stands` marks a rebutted entry (`task-plan-writer.md` →
# `## Revision mode`); every other `- ` entry under `## Rejected findings` is
# open. Which `## Scope register` rows are in dispute is judgement and stays
# with the orchestrator — only the heading's presence is reported.
fw_index_evidence() {
  local index="${1-}"
  [ -f "$index" ] || return 0
  FW_INDEX="$index" awk '
    /^## / {
      h = $0; sub(/[ \t\r]+$/, "", h); in_rj = 0
      if (h == "## Rejected findings") {
        if (!rj) print "evidence: " ENVIRON["FW_INDEX"] " ## Rejected findings"
        rj = 1; in_rj = 1
      } else if (h == "## Scope register") {
        sr = 1
      }
      next
    }
    in_rj && /^- / { if (index($0, "call stands") == 0) print "evidence.open: " $0 }
    END { if (sr) print "evidence: " ENVIRON["FW_INDEX"] " ## Scope register" }
  ' "$index"
}
