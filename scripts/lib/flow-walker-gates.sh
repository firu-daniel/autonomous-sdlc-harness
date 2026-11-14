#!/usr/bin/env bash
# flow-walker-gates.sh — the mechanical answers the flow walker needs at a
# gate, each defined once: the next free `review_<n>` index in a findings
# folder, a round file's verdict, a folder's count
# of `FAIL` round files, a plan-review round's evidence, the run mode's skipped
# ids, whether a `phases.*` flag is on, and the escalation evidence a story
# index or UI-test index carries.
#
# IT ANSWERS AND NEVER DECIDES. Which node comes next, whether a counter hit
# its cap, which round a resume re-enters and what the walker prints are the
# walker's; round evidence is an answer, the round decision is not. Nothing
# here writes anything — not even the walker's state file. The findings-folder
# functions list names only and open no file, except `fw_review_verdict` and
# `fw_fail_count`, which read a round file's verdict line and nothing else
# from it. The verdict line contract is
# `plugin/instructions/plan_review_rounds.md` → `## The round file`: exactly
# one line `verdict: PASS` or `verdict: FAIL`.
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
#   printf '{"defaultBranch":"main","stateDir":"devscene/","phases":{"qa":true}}' > "$root/devscene.config.json"
#   . <repo>/<scripts_dir>/lib/harness-run-lib.sh
#   . <repo>/<scripts_dir>/lib/flow-walker-gates.sh
#
#   review index      mkdir "$root/f"; : > "$root/f/review_0.md"; : > "$root/f/review_3.md"
#                     fw_next_review_index "$root/f"   -> 4   (a gap is never back-filled)
#                     fw_next_review_index "$root/nope"  -> 0
#   round verdicts    mkdir "$root/g"; printf 'verdict: FAIL\n' > "$root/g/review_0.md"; : > "$root/plan.md"
#                     git -C "$root" add g/review_0.md plan.md
#                     git -C "$root" -c user.name=r -c user.email=r@r commit -qm r
#                     fw_review_verdict "$root/g/review_0.md"           -> FAIL
#                     fw_review_verdict "$root/f/review_0.md"; echo $?  -> 1, prints nothing
#                     fw_fail_count "$root/g"; fw_fail_count "$root/nope"   -> 1, 0
#   round evidence    fw_round_evidence "$root" "$root/n_{round}.md" "$root/plan.md" -- a="$root/g" b="$root/h"
#                     -> round: 0
#                        gate: a FAIL <root>/g/review_0.md
#                        gate: b missing <root>/h/review_0.md
#                        note: absent
#                        plan: not-newer
#                     : > "$root/n_1.md"; printf 'x\n' >> "$root/plan.md"; (the same call)
#                     -> ... note: present / plan: newer
#                     fw_round_evidence "$root" "$root/n_{round}.md" "$root/plan.md" -- b="$root/h"
#                     -> round: none / note: absent / plan: unknown
#   run mode          fw_run_mode_skipped "$root" devscene/ feat_x none      -> none
#                     fw_run_mode_skipped "$root" devscene/ feat_x ''; echo $?  -> 1, prints nothing
#                     mkdir -p "$root/devscene/flow_progress"
#                     printf '## Run mode\n- skipped: parity, qa\n' > "$root/devscene/flow_progress/feat_x_progress.md"
#                     fw_run_mode_skipped "$root" devscene/ feat_x none      -> parity, qa   (the ledger wins)
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

# Print `PASS` or `FAIL` when <file> carries exactly one line that is
# byte-exactly `verdict: PASS` or `verdict: FAIL` (a trailing CR tolerated);
# print nothing and return 1 when it is absent, carries none, or carries more.
fw_review_verdict() {
  local file="${1-}" v
  [ -f "$file" ] || return 1
  v=$(awk '
    { l = $0; sub(/\r$/, "", l) }
    l == "verdict: PASS" || l == "verdict: FAIL" { n++; v = substr(l, 10) }
    END { if (n == 1) print v }
  ' "$file" 2>/dev/null)
  [ -n "$v" ] || return 1
  printf '%s\n' "$v"
  return 0
}

# Print how many `review_<n>.md` entries `fw_review_verdict` reads as `FAIL`,
# or 0 when the folder is absent. Not a count of files: a `PASS` round writes
# a file too.
fw_fail_count() {
  local folder="${1-}" name n count=0
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
      [ "$(fw_review_verdict "$folder/$name")" = FAIL ] && count=$((count + 1))
    done
    printf '%s\n' "$count"
  }
  return 0
}

# fw_round_evidence <root> <note_template> <plan_path>... -- <node>=<folder>...
# Every path absolute; <note_template> carries the literal `{round}`; the pairs
# are the gates the caller names, in gate order. Prints, in this order:
#   round: <R> | round: none   R = the highest <n> among the folders' review_<n>.md
#   gate: <node> <PASS|FAIL|missing|unreadable> <folder>/review_<R>.md   one per pair
#   note: present | absent     <note_template> with {round} = R+1
#   plan: not-newer | newer | unknown
# `round: none` is followed by `note: absent` and `plan: unknown` only. `plan:`
# is judged against the first pair whose round-R file exists: `unknown` when
# none does or that file has no commit; `newer` when a commit after the file's
# last one, or an uncommitted or untracked change, touches a plan path.
# Returns 2, printing no `plan:` line, when `git` cannot answer in <root>, and 2
# with nothing printed when the arguments carry no `--` or a pair no `=`.
fw_round_evidence() {
  local root="${1-}" note="${2-}" plans pairs np=0 nq=0 i pair node folder
  local r=-1 n file v first='' c out
  [ "$#" -ge 2 ] || return 2
  shift 2
  plans=()
  pairs=()
  while [ "$#" -gt 0 ] && [ "$1" != -- ]; do
    plans[$np]="$1"; np=$((np + 1)); shift
  done
  [ "$#" -gt 0 ] || return 2
  shift
  while [ "$#" -gt 0 ]; do
    case "$1" in
      *=*) ;;
      *) return 2 ;;
    esac
    pairs[$nq]="$1"; nq=$((nq + 1)); shift
  done
  i=0
  while [ "$i" -lt "$nq" ]; do
    pair="${pairs[$i]}"
    n=$(fw_next_review_index "${pair#*=}")
    [ $((n - 1)) -gt "$r" ] && r=$((n - 1))
    i=$((i + 1))
  done
  if [ "$r" -lt 0 ]; then
    printf 'round: none\nnote: absent\nplan: unknown\n'
    return 0
  fi
  printf 'round: %s\n' "$r"
  i=0
  while [ "$i" -lt "$nq" ]; do
    pair="${pairs[$i]}"
    node="${pair%%=*}"
    folder="${pair#*=}"
    file="$folder/review_$r.md"
    if [ ! -e "$file" ]; then
      v=missing
    else
      [ -n "$first" ] || first="$file"
      v=$(fw_review_verdict "$file") || v=unreadable
    fi
    printf 'gate: %s %s %s\n' "$node" "$v" "$file"
    i=$((i + 1))
  done
  case "$note" in
    *'{round}'*) note="${note%%\{round\}*}$((r + 1))${note#*\{round\}}" ;;
  esac
  if [ -e "$note" ]; then printf 'note: present\n'; else printf 'note: absent\n'; fi
  [ -n "$first" ] || { printf 'plan: unknown\n'; return 0; }
  git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 2
  git -C "$root" rev-parse --verify -q HEAD >/dev/null 2>&1 || { printf 'plan: unknown\n'; return 0; }
  c=$(git -C "$root" rev-list -1 HEAD -- "$first" 2>/dev/null) || return 2
  [ -n "$c" ] || { printf 'plan: unknown\n'; return 0; }
  [ "$np" -gt 0 ] || { printf 'plan: not-newer\n'; return 0; }
  out=$(git -C "$root" rev-list "$c..HEAD" -- "${plans[@]}" 2>/dev/null) || return 2
  if [ -z "$out" ]; then
    out=$(git -C "$root" --no-optional-locks status --porcelain -- "${plans[@]}" 2>/dev/null) || return 2
  fi
  if [ -n "$out" ]; then printf 'plan: newer\n'; else printf 'plan: not-newer\n'; fi
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
