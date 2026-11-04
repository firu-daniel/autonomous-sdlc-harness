#!/usr/bin/env bash
# gate-round-lib.sh — everything about a Run gates round that is not a particular
# gate: where its records go, how a gate line prints its duration, how a row is
# recorded, which units failed in the previous round, the focused-then-full
# driver that runs those first and stops early when they still fail, and the
# slowest-files section.
# Hand-written for this repository; not an `init` output.
#
# WHO SOURCES IT: `scripts/run-gates.sh` and `cli/test/gate-round-lib.test.mjs`,
# nothing else. It runs no gate and knows none by name: the caller supplies the
# unit function, the ordered unit ids and the configuration below, and owns
# every gate's command, its grading, its pass / fail tallies and its closing
# summary.
#
# PREREQUISITE. The sourcing script sources `scripts/lib/harness-run-lib.sh`
# first: `gr_init` validates the lane against that library's
# `HR_TEST_RUN_LABEL_PATTERN` and `HR_TEST_RUN_LOG_SUBDIR`, and this library
# defines no label pattern and no lane-directory name of its own. With either
# unset or empty, `gr_init` takes the no-record outcome rather than guess one.
#
# SOURCED, NEVER EXECUTED. It sets no shell option, so the sourcing script's
# shell is left exactly as found; it does need pathname expansion left on, for
# the previous-round glob. Bash 3.2. Every name is `gr_` / `GR_`, internal ones
# `gr__`. A duration is whole seconds, a difference of `$SECONDS`; nothing here
# calls `date` or `stat`, or parses `ls` output.
#
# THE RULE THIS LIBRARY EXISTS TO ENFORCE: a focused phase never ends a round
# any way but `fail`. The only `return 0` of `gr_run_round` is reached once
# every id the caller passed has run in the `full` phase or passed (`ok`) in the
# focused one, with every narrowed id run whole in `full`. It never writes
# outside `GR_LANE` or `<tmp_dir>`, never writes an absolute path into a record,
# and never reads a record of its own label as the previous one.
#
# CONFIGURATION, set by the caller before `gr_run_round`:
#   GR_PREREQUISITES      space-separated `<prereq>:<dep>,<dep>,…`; a dep in the
#                         focus set brings its prereq with it
#   GR_NARROWED_IDS       ids whose focused run takes test files (`GR_FOCUS_FILES`)
#   GR_TEST_FILE_PATTERN  an ERE every recorded test file must match
#   GR_TEST_ROOT          the repo-relative directory recorded files are relative to
#
# THE SEAM. `run-test-suite.sh` exports `RUN_TEST_SUITE_LABEL` and the
# repo-relative `RUN_TEST_SUITE_LOG_DIR` into each gate command. `gr_init` sets
# `GR_LABEL` and the absolute `GR_LANE` only when the label matches the label
# pattern and the directory is non-empty, not absolute, has no `.` / `..`
# segment, has the lane-directory name as its second-to-last segment and exists
# under `<repo_root>`. Otherwise both stay empty: no record is written, no
# previous round is read, and the test record goes under `<tmp_dir>`.
#
# THE RECORDS, in `GR_LANE`:
#   `<label>.gates.tsv` — first line `phase\tgate\tstatus\tseconds`; one row per
#     unit run, phase `focused`|`full`, status `ok`|`FAIL`|`BLOCKED`|`SKIPPED`,
#     seconds digits; last line `end\tcomplete` or `end\tstopped`.
#   `<label>.<phase>.tests.tsv` — owned by `scripts/lib/test-timing-reporter.mjs`
#     (its THE RECORD paragraph).
# A record that breaks its shape in any way, or names an id the caller did not
# pass or a file outside `GR_TEST_FILE_PATTERN`, is unreadable, and an
# unreadable previous record means the round runs in full.
#
# THE UNIT FUNCTION. Called as `<unit_fn> <id>`. It reads `GR_PHASE` and, for a
# narrowed id in the `focused` phase, `GR_FOCUS_FILES`; prints its own lines
# (through `gr_gate_line`); calls `gr_record <id> …` exactly once. Its exit
# status is ignored.
#
# REPRO — from the repository root, with `$t` a throwaway directory:
#   . scripts/lib/harness-run-lib.sh; . scripts/lib/gate-round-lib.sh
#   GR_NARROWED_IDS=4 GR_TEST_FILE_PATTERN='^test/[^/ ]+\.test\.mjs$' GR_TEST_ROOT=cli
#   u() { gr_gate_line ok "unit $1" 0; gr_record "$1" ok 0; }
#   gr_init "$PWD" "$t"; gr_run_round u 1 4   # no lane: both run, full phase
#   gr_gate_line FAIL x 3 'exit 1'            # ->   FAIL  x (exit 1, 3 s)
#   gr_slowest "$t/none.tsv" full             # -> == slowest test files: no per-file record (no record was written) ==

# gr_init <repo_root> <tmp_dir> — resolve the lane from the seam and reset the
# per-round state; always 0.
gr_init() {
  local root="${1-}" pattern="${HR_TEST_RUN_LABEL_PATTERN-}" subdir="${HR_TEST_RUN_LOG_SUBDIR-}"
  local label="${RUN_TEST_SUITE_LABEL-}" dir="${RUN_TEST_SUITE_LOG_DIR-}"
  local rest seg prev='' last=''
  GR_REPO_ROOT="$root"
  GR_TMP_DIR="${2-}"
  GR_LABEL=''
  GR_LANE=''
  GR_PHASE=full
  GR_PHASE_FAILED=0
  GR_PHASE_OK_IDS=''
  GR_PREV_LABEL=''
  GR_FOCUS_IDS=''
  GR_FOCUS_FILES=''
  [ -n "$pattern" ] && [ -n "$subdir" ] || return 0
  [ -n "$root" ] && [ -n "$label" ] && [ -n "$dir" ] || return 0
  [[ $label =~ $pattern ]] || return 0
  case "$dir" in /*) return 0 ;; esac
  rest="$dir"
  while [ -n "$rest" ]; do
    seg="${rest%%/*}"
    case "$rest" in
      */*) rest="${rest#*/}" ;;
      *) rest='' ;;
    esac
    case "$seg" in
      '') continue ;;
      . | ..) return 0 ;;
    esac
    prev="$last"
    last="$seg"
  done
  [ "$prev" = "$subdir" ] || return 0
  while case "$dir" in */) true ;; *) false ;; esac; do dir="${dir%/}"; done
  [ -d "$root/$dir" ] || return 0
  GR_LABEL="$label"
  GR_LANE="$root/$dir"
  return 0
}

# gr_gate_line <ok|FAIL|BLOCKED|SKIPPED> <name> <seconds> [<detail>] — print the
# gate's line; 1, printing nothing, for another status.
gr_gate_line() {
  local status="${1-}" name="${2-}" secs="${3-}" detail="${4-}"
  case "$status" in
    ok) printf '  ok    %s (%s s)\n' "$name" "$secs" ;;
    FAIL)
      if [ -n "$detail" ]; then
        printf '  FAIL  %s (%s, %s s)\n' "$name" "$detail" "$secs"
      else
        printf '  FAIL  %s (%s s)\n' "$name" "$secs"
      fi
      ;;
    BLOCKED) printf '  BLOCKED %s — %s (%s s)\n' "$name" "$detail" "$secs" ;;
    SKIPPED) printf '  SKIPPED %s — %s (%s s)\n' "$name" "$detail" "$secs" ;;
    *) return 1 ;;
  esac
}

# gr_record <id> <status> <seconds> — append the row when there is a lane, and
# track, for the current phase, whether any row was FAIL and which ids were ok.
gr_record() {
  local id="${1-}" status="${2-}" secs="${3-}"
  if [ -n "${GR_LANE-}" ]; then
    printf '%s\t%s\t%s\t%s\n' "$GR_PHASE" "$id" "$status" "$secs" >>"$GR_LANE/$GR_LABEL.gates.tsv"
  fi
  case "$status" in
    FAIL) GR_PHASE_FAILED=1 ;;
    ok) GR_PHASE_OK_IDS="$GR_PHASE_OK_IDS $id" ;;
  esac
  return 0
}

# gr_tests_destination — print the absolute test-record path for the current phase.
gr_tests_destination() {
  if [ -n "${GR_LANE-}" ]; then
    printf '%s/%s.%s.tests.tsv\n' "$GR_LANE" "$GR_LABEL" "$GR_PHASE"
  else
    printf '%s/%s.tests.tsv\n' "$GR_TMP_DIR" "$GR_PHASE"
  fi
}

# gr__tests_record_ok <file> — 0 when the per-file record is readable: exact
# header, last line `end`, every row five fields with a relative file matching
# GR_TEST_FILE_PATTERN, status pass|fail and numeric counts.
gr__tests_record_ok() {
  [ -f "${1-}" ] && [ -r "$1" ] || return 1
  [ -n "${GR_TEST_FILE_PATTERN-}" ] || return 1
  GR__PAT="$GR_TEST_FILE_PATTERN" awk -F'\t' '
    { line[NR] = $0 }
    END {
      if (NR < 2) exit 1
      if (line[1] != "file\tstatus\tseconds\ttests\tfailed") exit 1
      if (line[NR] != "end") exit 1
      pat = ENVIRON["GR__PAT"]
      for (i = 2; i < NR; i++) {
        if (split(line[i], f, "\t") != 5) exit 1
        if (f[1] !~ pat || f[1] ~ /^\// || f[1] ~ /(^|\/)\.\.?(\/|$)/ || f[1] ~ / /) exit 1
        if (f[2] != "pass" && f[2] != "fail") exit 1
        if (f[3] !~ /^[0-9]+(\.[0-9]+)?$/ || f[4] !~ /^[0-9]+$/ || f[5] !~ /^[0-9]+$/) exit 1
      }
      exit 0
    }' "$1" 2>/dev/null
}

# gr_slowest <tests_tsv> <phase> — print the slowest-files section; always 0.
gr_slowest() {
  local file="${1-}" phase="${2-}" tab=$'\t'
  if [ ! -e "$file" ]; then
    printf '== slowest test files: no per-file record (no record was written) ==\n'
    return 0
  fi
  if ! gr__tests_record_ok "$file"; then
    printf '== slowest test files: no per-file record (the record is unreadable) ==\n'
    return 0
  fi
  printf '== slowest test files (%s run of gate 4), by the sum of each file'"'"'s top-level test durations ==\n' "$phase"
  sed '1d;$d' "$file" | LC_ALL=C sort -t "$tab" -k3,3nr -k1,1 | head -n 10 |
    awk -F'\t' '{ printf "  %s s  %s  (%s tests, %s failed)\n", $3, $1, $4, $5 }'
  return 0
}

# gr__has <word> <space-separated list> — 0 when the word is in the list.
gr__has() {
  case " ${2-} " in *" ${1-} "*) return 0 ;; esac
  return 1
}

# gr__join <space-separated list> — print it joined with `, `, or `none` when empty.
gr__join() {
  local gr__w out=''
  for gr__w in ${1-}; do
    out="${out:+$out, }$gr__w"
  done
  printf '%s\n' "${out:-none}"
}

# gr_previous_focus_var <id>… — read the newest other round's record in the lane
# and set GR_PREV_LABEL, GR_FOCUS_IDS (caller's order) and GR_FOCUS_FILES; 0 only
# when GR_FOCUS_IDS is non-empty, else 1 with all three empty.
gr_previous_focus_var() {
  local ids="$*" own f newest='' base prev out phase fails id tests_file
  local focus='' files='' kept entry prereq deps dep changed
  GR_PREV_LABEL=''
  GR_FOCUS_IDS=''
  GR_FOCUS_FILES=''
  [ -n "${GR_LANE-}" ] && [ -n "$ids" ] || return 1
  own="$GR_LANE/$GR_LABEL.gates.tsv"
  for f in "$GR_LANE"/*.gates.tsv; do
    [ -f "$f" ] || continue
    [ "$f" = "$own" ] && continue
    if [ -z "$newest" ] || [ "$f" -nt "$newest" ]; then newest="$f"; fi
  done
  [ -n "$newest" ] && [ -r "$newest" ] || return 1
  base="${newest##*/}"
  prev="${base%.gates.tsv}"
  [[ $prev =~ ${HR_TEST_RUN_LABEL_PATTERN-^$} ]] || return 1
  out=$(GR__IDS="$ids" awk -F'\t' '
    { line[NR] = $0 }
    END {
      if (NR < 2) exit 1
      if (line[1] != "phase\tgate\tstatus\tseconds") exit 1
      if (line[NR] != "end\tcomplete" && line[NR] != "end\tstopped") exit 1
      ids = " " ENVIRON["GR__IDS"] " "
      hasfull = 0
      for (i = 2; i < NR; i++) {
        if (split(line[i], f, "\t") != 4) exit 1
        if (f[1] != "focused" && f[1] != "full") exit 1
        if (f[2] == "" || f[2] ~ / / || index(ids, " " f[2] " ") == 0) exit 1
        if (f[3] != "ok" && f[3] != "FAIL" && f[3] != "BLOCKED" && f[3] != "SKIPPED") exit 1
        if (f[4] !~ /^[0-9]+$/) exit 1
        if (f[1] == "full") hasfull = 1
      }
      phase = hasfull ? "full" : "focused"
      out = phase
      for (i = 2; i < NR; i++) {
        split(line[i], f, "\t")
        if (f[1] == phase && f[3] == "FAIL") out = out " " f[2]
      }
      print out
      exit 0
    }' "$newest" 2>/dev/null) || return 1
  phase="${out%% *}"
  case "$out" in
    *' '*) fails="${out#* }" ;;
    *) fails='' ;;
  esac
  [ -n "$fails" ] || return 1
  for id in $fails; do
    if gr__has "$id" "${GR_NARROWED_IDS-}"; then
      tests_file="$GR_LANE/$prev.$phase.tests.tsv"
      gr__tests_record_ok "$tests_file" || return 1
      out=$(awk -F'\t' 'NR > 1 && $2 == "fail" { print $1 }' "$tests_file") || return 1
      [ -n "$out" ] || return 1
      kept=''
      for f in $out; do
        if [ -f "$GR_REPO_ROOT/${GR_TEST_ROOT:+$GR_TEST_ROOT/}$f" ]; then
          kept="$kept $f"
          gr__has "$f" "$files" || files="$files $f"
        fi
      done
      [ -n "$kept" ] || continue
    fi
    focus="$focus $id"
  done
  changed=1
  while [ "$changed" = 1 ]; do
    changed=0
    for entry in ${GR_PREREQUISITES-}; do
      prereq="${entry%%:*}"
      deps="${entry#*:}"
      gr__has "$prereq" "$focus" && continue
      for dep in $(printf '%s\n' "$deps" | tr ',' ' '); do
        if gr__has "$dep" "$focus"; then
          focus="$focus $prereq"
          changed=1
          break
        fi
      done
    done
  done
  for id in "$@"; do
    gr__has "$id" "$focus" && GR_FOCUS_IDS="${GR_FOCUS_IDS:+$GR_FOCUS_IDS }$id"
  done
  [ -n "$GR_FOCUS_IDS" ] || return 1
  GR_PREV_LABEL="$prev"
  GR_FOCUS_FILES="${files# }"
  return 0
}

# gr__end <complete|stopped> — close this label's record when there is a lane.
gr__end() {
  if [ -n "${GR_LANE-}" ]; then
    printf 'end\t%s\n' "$1" >>"$GR_LANE/$GR_LABEL.gates.tsv"
  fi
}

# gr_run_round <unit_fn> <id>… — run one round: the previous round's failures
# first, stopping with 1 when one still fails, then everything else in full; 0
# when the round ran to completion.
gr_run_round() {
  local gr__fn="${1-}" gr__id gr__focused_ok=''
  shift
  if [ -n "${GR_LANE-}" ]; then
    printf 'phase\tgate\tstatus\tseconds\n' >"$GR_LANE/$GR_LABEL.gates.tsv"
  fi
  if gr_previous_focus_var "$@"; then
    GR_PHASE=focused
    GR_PHASE_FAILED=0
    GR_PHASE_OK_IDS=''
    printf 'run-gates: running first what failed in %s: gates %s; test files %s\n' \
      "$GR_PREV_LABEL" "$(gr__join "$GR_FOCUS_IDS")" "$(gr__join "$GR_FOCUS_FILES")"
    for gr__id in $GR_FOCUS_IDS; do
      "$gr__fn" "$gr__id" || true
    done
    if [ "$GR_PHASE_FAILED" = 1 ]; then
      printf 'run-gates: stopped early: ran only gates %s and test files %s, which failed in %s; every other gate and test file did not run, so this round cannot pass\n' \
        "$(gr__join "$GR_FOCUS_IDS")" "$(gr__join "$GR_FOCUS_FILES")" "$GR_PREV_LABEL"
      gr__end stopped
      return 1
    fi
    printf 'run-gates: everything that failed in %s passed; running every other gate and the whole suite\n' "$GR_PREV_LABEL"
    gr__focused_ok="$GR_PHASE_OK_IDS"
  fi
  GR_PHASE=full
  GR_PHASE_FAILED=0
  GR_PHASE_OK_IDS=''
  for gr__id in "$@"; do
    if gr__has "$gr__id" "$gr__focused_ok" && ! gr__has "$gr__id" "${GR_NARROWED_IDS-}"; then
      continue
    fi
    "$gr__fn" "$gr__id" || true
  done
  gr__end complete
  return 0
}
