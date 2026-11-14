#!/usr/bin/env bash
# flow-walker.sh — the next step of a declared flow, read off its graph instead
# of worked out from prose: given the flow, the branch and the outcome of the
# node that just ran, print the next action in one fixed form.
#
# THE WALKER ROUTES; THE ORCHESTRATOR JUDGES. It owns the next node, the shared
# counter and its cap, both skip semantics, the round number, each reviewer's
# `iteration:` and review-mode arguments and the escalation payload, and it
# rejects an outcome the pending node does not declare. Which outcome a return
# carries, and what a binding resolves to, stay the orchestrator's.
#
# THE SAFETY CONTRACT IS DELIBERATELY NOT THE WALKER'S. The STOP check, the
# `.dispatch_counter` increment, the PAUSE check and the halt messages stay
# orchestrator steps, so the heartbeat carries the literal slot
# `(#<total_dispatches>)` for the orchestrator to fill. A binding is printed by
# NAME and never resolved; no dispatch prompt is composed — only the values the
# core's dispatch block lacks (`arg.iteration`, `arg.review_mode`,
# `arg.findings_file`) and the prompt variant.
#
# USAGE — each call one literal command from the repository root:
#
#   bash <scripts_dir>/flow-walker.sh start   --flow <flow> --branch <branch> [--entry <node>] [--skipped <ids|none>]
#   bash <scripts_dir>/flow-walker.sh next    --flow <flow> --branch <branch> --outcome <outcome> [--node <node>] [--findings <path>] [--skipped <ids|none>]
#   bash <scripts_dir>/flow-walker.sh current --flow <flow> --branch <branch>
#
#   `current` is read-only and takes no lock: it re-prints the saved pending
#   action byte for byte, and is how a planning (re-)entry finds a saved walk
#   to continue. Its output names the saved `awaiting`: one `action: dispatch`
#   block of a non-gate node is `dispatch`; gate blocks are `set`;
#   `binding: <ask>` is `answer`, any other `binding:` (`<escalate>`,
#   `<terminal_handoff>`) is `done` — a finished walk, re-printed but continued
#   by nothing: `next` refuses it with exit 1.
#
#   <outcome>  a key of the pending node's `outcomes` (of the `--node` gate
#              while a set is pending), or `answered` while an `<ask>` is
#              pending. `FAIL` requires `--findings`; so do `PASS` and `FAIL`
#              at a round gate — a node some `round` node lists in its
#              `gates` — whose reviewer writes a file every round.
#   --node     the node the outcome is for, `[a-z0-9_]` only. Required while a
#              set is pending, naming a gate of the set with no recorded
#              outcome; otherwise optional and, when given, the pending node.
#   --findings the reviewer's findings_file; it may not carry a tab.
#   --skipped  the run mode's skipped ids; read only when no flow-progress
#              ledger exists, and re-read on every arrival at a gated node.
#   The graph is `<this script's dir>/flows/<flow>.graph.json`, formatVersion
#   3; the root is a bare `git rev-parse --show-toplevel` in the working
#   directory.
#
# ROUNDS — a `round` node dispatches nothing. Arriving at it (the writer's
# outcome, or a `start`) OPENS the round: each gate's skip constructs are
# evaluated in `gates` order before anything is printed, and every gate not
# skipped is due, all dispatched at once as one SET. Each gate's outcome is
# recorded by its own `next --node <gate>`, in any order; until the last one
# the walker prints `wait`. The last outcome is the JOIN: when any gate's
# outcome was `error` or `blocker` (HELD, not routed when recorded), the
# first held gate's binding is printed and the round is not closed; otherwise
# the round closes FAIL when a gate recorded FAIL (a skipped gate counts as
# passed), else PASS — with every gate skipped, at once on arrival — followed
# through the node's `outcomes` as an agent's outcome is. A round closes only
# at the join or at `start`'s complete-round rule. Two numbers are kept apart:
# the loop COUNTER (`counter.<name>`, the heartbeat's `{iteration}`) alone
# drives the cap and the review mode; the ROUND NUMBER names the round files,
# is the same index in every gate's folder, and carries on across the branch's
# planning history.
#
# OUTPUT — stdout, `key: value` lines, in this order:
#
#   dispatch  action: dispatch / node: / agent: / prompt: (writer nodes) /
#             arg.iteration: (a round's writer, either variant: the round
#             number the write feeds) / arg.findings_file: (with `prompt:
#             revision`: one line per findings file of the closed round, in
#             `gates` order; `ui_writer`'s one) / arg.iteration: (a round gate:
#             the round number; any other reviewer: the next free index in its
#             findings folder) / arg.review_mode: full|converging (a round
#             gate: `full` while the counter is below the round node's
#             `convergingFrom`) / skip: <node> <skipped|passed-by-exclusion>,
#             round: <n> <PASS|FAIL> (<n> the round it closed) and ledger: <id>
#             lines for what the walk passed through /
#             heartbeat: <template, {iteration} = the counter>  (#<total_dispatches>)
#   set       one dispatch block per due gate, in `gates` order, back to back;
#             the passed-through skip: / round: / ledger: lines in the first
#             block only. A set of one gate is a single dispatch block.
#   wait      action: wait / node: <round> / recorded: <gate> <outcome> /
#             pending: <gate> per gate still out, in `gates` order
#   binding   action: binding / binding: <name> / node: / then
#             <ask>               agent: / resume: <node>
#             <escalate>          agent: (none when node: is a round node) /
#                                 reason: <cap|error|blocker>, and for a cap:
#                                 findings_file: per file of the closing round /
#                                 rounds: <node> <its folder's FAIL files> (a
#                                 node recorded `skipped` omitted) / evidence
#                                 lines / summary: ({cap}; {open_gates} the
#                                 closing round's FAIL gates, `, `-joined);
#                                 at a join with a held outcome, node: and
#                                 agent: are the first held gate's in `gates`
#                                 order, reason: its outcome, then held: <gate>
#                                 <outcome> per held gate, and no round: line
#             <terminal_handoff>  report: <key> <value> per recorded key
#             then its skip: / round: / ledger: lines.
#
# EXIT CODES
#
#   0  an action was printed (and, for start / next, the state written)
#   1  refusal: bad usage, undeclared outcome, `next` before `start`, `current`
#      with no walk saved (a re-entry's "no saved walk"), a flow or
#      branch other than the state's, unknown flow, a formatVersion other than
#      3, FAIL without --findings, PASS or FAIL at a round gate without
#      --findings, no run-mode record, an unresolvable phase flag, a `--node`
#      other than the pending node; while a set is pending: no `--node`, a
#      `--node` that is not a pending gate of the round, a second outcome for
#      one gate
#   2  the configuration, the graph or the state file cannot be resolved or
#      written (a graph entering at a round's gate included), the round
#      evidence cannot be read, lib/harness-run-lib.sh predates this walker,
#      or the lock was held for over 120 s — once no flow-walker.sh call is
#      running, remove the lock directory with `rmdir`, then run `current`
#   Every non-zero exit prints one `flow-walker: <cause>` line on stderr and
#   leaves the state file byte-identical.
#
# STATE — `<state_dir>/.flow_walker_state`, machine-local, flat `key=value`
# lines: flow, branch, the pending node (the round node while a set is
# pending), `awaiting` (dispatch / set / answer / done), `counter.<name>`,
# `round.number`, the open round's `round.verdict.<gate>` and
# `round.findings.<gate>`, a gate's held `error` / `blocker` as
# `round.held.<gate>`, the set's gates (`set.gates`) and its first block's
# passed-through lines (`set.pass`), `revision_findings` (the closed round's
# files, TAB-joined; `ui_review`'s FAIL stores one), the prompt variants, the
# recorded `report.<key>` values, the nodes skipped as `skipped`, and the
# pending action's printed lines (`out=`), which `current` re-prints
# unchanged — while a set is pending, the blocks of the gates with no recorded
# outcome, the first carrying the fan-out's passed-through lines. Only `start`
# overwrites it, and every `start` sets every counter to 0 — a fresh write, an
# extend, an extend after a cap park and a skip past a loop alike; only a
# re-entry that continues a saved walk (`current`, then `next` or a
# re-dispatch of the printed action) carries the counter, the prompt variants
# and the round's records across a session boundary. `round.number` is never
# the counter: `start` reads it off the round files through
# `fw_round_evidence` when the entry is a round's writer (the next round) or
# the round node itself, and is 0 for any other entry or with no round file
# on disk. At a round node: no round file opens round 0's whole set; a round
# with files missing whose evidence is consistent — no present gate reads
# `unreadable`, and `plan:` is `not-newer` — records the present gates'
# verdicts and files and opens the set with only the gates whose file is
# `missing`; any other incomplete round opens the whole set at that round. A
# complete round that is unreadable or has no FAIL opens the whole set at
# that round; a FAIL with the next revision note on disk opens the next
# round's whole set; a FAIL without it records every verdict and closes the
# round. A complete all-PASS round is reviewed again: convergence is never
# inferred from files. The state is a position, never a phase record: the
# flow-progress ledger stays the only durable record. Replaced by temp file
# and `mv`.
#
# CONCURRENCY — `start` and `next` hold the lock directory
# `<state_dir>/.flow_walker_state.lock` from before the state is read to after
# it is replaced, so a set's gates may be recorded by simultaneous calls and
# exactly one of them prints the round's result. It is taken with `mkdir`,
# retried every 0.1 s, removed once as stale when older than a minute, given
# up after 120 s (exit 2), always left empty, and released on every exit path
# by the call that took it. `current` takes none: the state is replaced by
# `mv`, so a read is never torn.
#
# BASH 3.2 AND JQ 1.5 ARE THE FLOORS: no associative array and no array-reading
# builtin. The graph is flattened by one `jq` per call.
#
# REPRO — in a throwaway fixture, never in a checkout:
#
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x
#   printf '%s' '{"defaultBranch":"main","stateDir":"devscene/","phases":{"parity":true,"qa":true}}' > "$d/devscene.config.json"
#   mkdir -p "$d/s/lib" "$d/s/flows"
#   cp <scripts_dir>/flow-walker.sh "$d/s/"
#   cp <scripts_dir>/lib/harness-run-lib.sh <scripts_dir>/lib/flow-walker-gates.sh "$d/s/lib/"
#   cp <scripts_dir>/flows/task_plan_writing.graph.json "$d/s/flows/"
#   cd "$d"
#   bash s/flow-walker.sh start --flow task_plan_writing --branch feat_x --skipped none
#     -> dispatch plan_writer, prompt: initial, arg.iteration: 0
#   ... next --flow task_plan_writing --branch feat_x --outcome returned --skipped none
#     -> three blocks: business_parity_review, architecture_review, plan_review,
#        each arg.iteration: 0, arg.review_mode: full
#   ... next ... --node plan_review --outcome PASS --findings p0.md --skipped none
#     -> wait, recorded: plan_review PASS, pending: business_parity_review /
#        architecture_review
#   ... next ... --node business_parity_review --outcome PASS --findings b0.md --skipped none
#     -> wait, pending: architecture_review
#   ... next ... --node architecture_review --outcome PASS --findings a0.md --skipped none
#     -> round: 0 PASS, ledger: P1, ui_writer, prompt: initial
#   ... next ... --outcome returned --skipped none -> ui_review
#   ... next ... --outcome PASS --skipped none   -> binding: <terminal_handoff>,
#                                                  four report: lines, ledger: P2
#   ... next ... --outcome PASS   -> exit 1: the walk has finished
#   A FAIL round: start again, `returned`, then the three gates in any order,
#   b0.md and p0.md PASS and `--node architecture_review --outcome FAIL
#   --findings a0.md`; the last call
#     -> round: 0 FAIL, plan_writer, prompt: revision, arg.iteration: 1,
#        arg.findings_file: b0.md / a0.md / p0.md, heartbeat iter 1
#   A held round: start again, `returned`, `--node architecture_review
#   --outcome error`, then the other two PASS; the last call
#     -> binding: <escalate>, node: architecture_review, reason: error,
#        held: architecture_review error, no round: line

set -uo pipefail

fw_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
for fw_lib in "$fw_dir/lib/harness-run-lib.sh" "$fw_dir/lib/flow-walker-gates.sh"; do
  if [ ! -r "$fw_lib" ]; then
    printf 'flow-walker: cannot read %s\n' "$fw_lib" >&2
    exit 2
  fi
  # shellcheck source=/dev/null
  . "$fw_lib"
done
# An older `init` keeps an existing lib/harness-run-lib.sh (create-if-absent), and one written
# before this walker shipped lacks the phase reader every `skipped` gate calls.
if ! declare -F hr_phase_enabled >/dev/null; then
  printf 'flow-walker: %s predates this walker (it defines no hr_phase_enabled): delete that file and re-run devscene init, which writes the current copy\n' "$fw_dir/lib/harness-run-lib.sh" >&2
  exit 2
fi

NL='
'
TAB=$'\t'

refuse() {
  printf 'flow-walker: %s\n' "$1" >&2
  exit 1
}

fault() {
  printf 'flow-walker: %s\n' "$1" >&2
  exit 2
}

# Every lookup below sets a global rather than printing, because `refuse` and
# `fault` inside a `$(…)` would exit the subshell only.

# --- Arguments ------------------------------------------------------------

[ "$#" -gt 0 ] || refuse "missing subcommand: start, next or current"
CMD="$1"
shift
case "$CMD" in
  start|next|current) ;;
  *) refuse "unknown subcommand '$CMD': expected start, next or current" ;;
esac

A_FLOW=""
A_BRANCH=""
A_ENTRY=""
A_SKIPPED=""
A_OUTCOME=""
A_FINDINGS=""
A_NODE=""
while [ "$#" -gt 0 ]; do
  flag="$1"
  case "$CMD:$flag" in
    *:--flow|*:--branch|start:--entry|start:--skipped|next:--skipped|next:--outcome|next:--findings|next:--node) ;;
    *) refuse "'$flag' is not a flag of '$CMD'" ;;
  esac
  [ "$#" -ge 2 ] || refuse "$flag requires a value"
  value="$2"
  shift 2
  case "$value" in
    *"$NL"*) refuse "the value of $flag carries a newline" ;;
  esac
  # The state keeps the revision's findings files TAB-joined.
  case "$flag:$value" in
    --findings:*"$TAB"*) refuse "the value of $flag carries a tab" ;;
  esac
  case "$flag" in
    --flow) A_FLOW="$value" ;;
    --branch) A_BRANCH="$value" ;;
    --entry) A_ENTRY="$value" ;;
    --skipped) A_SKIPPED="$value" ;;
    --outcome) A_OUTCOME="$value" ;;
    --findings) A_FINDINGS="$value" ;;
    --node)
      case "$value" in
        ''|*[!a-z0-9_]*) refuse "'$value' is not a node name" ;;
      esac
      A_NODE="$value"
      ;;
  esac
done

[ -n "$A_FLOW" ] || refuse "missing required flag --flow"
[ -n "$A_BRANCH" ] || refuse "missing required flag --branch"
if [ "$CMD" = next ]; then
  [ -n "$A_OUTCOME" ] || refuse "missing required flag --outcome"
  case "$A_OUTCOME" in
    *[!A-Za-z0-9_]*) refuse "outcome '$A_OUTCOME' is not an outcome name" ;;
  esac
  if [ "$A_OUTCOME" = FAIL ] && [ -z "$A_FINDINGS" ]; then
    refuse "outcome FAIL requires --findings with the reviewer's findings_file"
  fi
fi
case "$A_FLOW" in
  *[!a-z0-9_]*) refuse "unknown flow '$A_FLOW'" ;;
esac

# --- Configuration ----------------------------------------------------------

ROOT="$(hr_repo_root)" || fault "not inside a git repository"
hr_config_load "$ROOT"
case "$?" in
  0) ;;
  1) fault "no devscene.config.json at $ROOT" ;;
  *) fault "cannot resolve $ROOT/devscene.config.json (invalid JSON, no defaultBranch, or jq missing or older than 1.5)" ;;
esac
STATE_DIR="$(hr_state_dir "$ROOT")" || fault "cannot resolve stateDir from $ROOT/devscene.config.json"
STATE_FILE="$ROOT/$STATE_DIR/.flow_walker_state"

# --- The graph --------------------------------------------------------------

GRAPH_FILE="$fw_dir/flows/$A_FLOW.graph.json"
[ -f "$GRAPH_FILE" ] || refuse "unknown flow '$A_FLOW': no $GRAPH_FILE"
hr_have_jq || fault "jq is not on PATH"

# One line per scalar: `<dotted path>\t<value>`, array indices as path segments.
G_RAW="$(jq -r 'paths(scalars) as $p | [($p | map(tostring) | join(".")), (getpath($p) | tostring)] | @tsv' "$GRAPH_FILE" 2>/dev/null)" \
  || fault "cannot parse $GRAPH_FILE"
G_LINES="$NL$G_RAW$NL"

# Set GV to the graph value at <path>; return 1 when absent.
g_get() {
  local key="$1" rest
  GV=""
  case "$G_LINES" in
    *"$NL$key$TAB"*) ;;
    *) return 1 ;;
  esac
  rest="${G_LINES#*"$NL$key$TAB"}"
  rest="${rest%%"$NL"*}"
  hr_tsv_unescape_var "$rest"
  GV="$HR_CFG_VALUE"
  return 0
}

g_need() {
  g_get "$1" || fault "graph $GRAPH_FILE has no '$1'"
}

g_has_prefix() {
  case "$G_LINES" in
    *"$NL$1"*) return 0 ;;
  esac
  return 1
}

# Set RN to the round node whose <field> (`gates` or `writer`) names <node>;
# return 1 when none does. Which nodes are gates is read off the graph only.
g_round_of() {
  local field="$1" node="$2" line rn
  RN=""
  while IFS= read -r line; do
    case "$line" in
      nodes.*."$field".*"$TAB$node"|nodes.*."$field$TAB$node") ;;
      *) continue ;;
    esac
    [ "${line##*"$TAB"}" = "$node" ] || continue
    rn="${line#nodes.}"
    rn="${rn%%."$field"*}"
    g_get "nodes.$rn.kind" || continue
    [ "$GV" = round ] || continue
    RN="$rn"
    return 0
  done <<EOF
$G_LINES
EOF
  return 1
}

round_of_gate() { g_round_of gates "$1"; }
round_of_writer() { g_round_of writer "$1"; }

g_get formatVersion || refuse "graph $GRAPH_FILE carries no formatVersion"
[ "$GV" = 3 ] || refuse "graph $GRAPH_FILE has formatVersion '$GV'; this walker reads 3"
g_need flow
[ "$GV" = "$A_FLOW" ] || fault "graph $GRAPH_FILE declares flow '$GV', not '$A_FLOW'"

# --- The state store (newline-joined `key=value`) ----------------------------

ST_LINES="$NL"
OUT=""
# The pending action `current` re-prints, when it is not what this call prints
# (a `wait` saves the set's remaining blocks).
SAVE_OUT=""
PASS=""
OPEN_GATES=""

st_get() {
  local key="$1" rest
  SV=""
  case "$ST_LINES" in
    *"$NL$key="*) ;;
    *) return 1 ;;
  esac
  rest="${ST_LINES#*"$NL$key="}"
  SV="${rest%%"$NL"*}"
  return 0
}

st_unset() {
  local key="$1" line out="$NL"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    case "$line" in
      "$key="*) continue ;;
    esac
    out="$out$line$NL"
  done <<EOF
$ST_LINES
EOF
  ST_LINES="$out"
}

st_set() {
  st_unset "$1"
  ST_LINES="$ST_LINES$1=$2$NL"
}

# Set SV to the numeric state value at <key>; fault when it is not one.
st_num() {
  st_get "$1"
  case "$SV" in
    ''|*[!0-9]*) fault "$STATE_FILE carries no numeric $1" ;;
  esac
}

# Set LL to one `<prefix><item>` line per item of the TAB-joined <list>.
list_lines() {
  local prefix="$1" rest="$2" item
  LL=""
  while [ -n "$rest" ]; do
    item="${rest%%"$TAB"*}"
    case "$rest" in
      *"$TAB"*) rest="${rest#*"$TAB"}" ;;
      *) rest="" ;;
    esac
    LL="$LL$prefix$item$NL"
  done
}

load_state() {
  local line
  [ -f "$STATE_FILE" ] || refuse "no walk in progress at $STATE_FILE: run 'start' first"
  [ -r "$STATE_FILE" ] || fault "cannot read $STATE_FILE"
  while IFS= read -r line; do
    case "$line" in
      out=*) OUT="$OUT${line#out=}$NL" ;;
      *=*) ST_LINES="$ST_LINES$line$NL" ;;
    esac
  done < "$STATE_FILE"
  st_get flow || fault "$STATE_FILE carries no flow"
  [ "$SV" = "$A_FLOW" ] || refuse "the walk in progress is flow '$SV', not '$A_FLOW'"
  st_get branch || fault "$STATE_FILE carries no branch"
  [ "$SV" = "$A_BRANCH" ] || refuse "the walk in progress is for branch '$SV', not '$A_BRANCH'"
  [ -n "$OUT" ] || fault "$STATE_FILE carries no pending action"
}

save_state() {
  local dir tmp line saved="$OUT"
  [ -z "$SAVE_OUT" ] || saved="$SAVE_OUT"
  dir="${STATE_FILE%/*}"
  [ -d "$dir" ] || mkdir -p "$dir" || fault "cannot create $dir"
  tmp="$STATE_FILE.tmp.$$"
  {
    printf '%s' "${ST_LINES#"$NL"}"
    while IFS= read -r line; do
      if [ -n "$line" ]; then printf 'out=%s\n' "$line"; fi
    done <<EOF
$saved
EOF
  } > "$tmp" 2>/dev/null || { rm -f "$tmp"; fault "cannot write $tmp"; }
  mv -f "$tmp" "$STATE_FILE" 2>/dev/null || { rm -f "$tmp"; fault "cannot replace $STATE_FILE"; }
}

# --- The lock (start and next only) -------------------------------------------

LOCK="$STATE_FILE.lock"
LOCK_HELD=0

lock_release() {
  if [ "$LOCK_HELD" -eq 1 ]; then
    rmdir "$LOCK" 2>/dev/null
    LOCK_HELD=0
  fi
}

# `mkdir` is the atomic test-and-set; the directory stays empty so `git status`
# never lists it. A lock older than a minute is removed once per call.
lock_take() {
  local dir="${STATE_FILE%/*}" tries=0 stale=0
  [ -d "$dir" ] || mkdir -p "$dir" 2>/dev/null || fault "cannot create $dir"
  trap 'lock_release' EXIT
  trap 'exit 129' HUP
  trap 'exit 130' INT
  trap 'exit 143' TERM
  while :; do
    if mkdir "$LOCK" 2>/dev/null; then
      LOCK_HELD=1
      return 0
    fi
    if [ ! -d "$LOCK" ]; then
      # Released between the two tests, or not creatable at all.
      mkdir "$LOCK" 2>/dev/null && { LOCK_HELD=1; return 0; }
      [ -d "$LOCK" ] || fault "cannot create $LOCK"
    fi
    if [ "$stale" -eq 0 ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +1 2>/dev/null)" ]; then
      stale=1
      rmdir "$LOCK" 2>/dev/null
      continue
    fi
    [ "$tries" -lt 1200 ] \
      || fault "cannot lock $LOCK: held for over 120 s; once no flow-walker.sh call is running, remove $LOCK with rmdir, then run flow-walker.sh current"
    sleep 0.1
    tries=$((tries + 1))
  done
}

# --- Rendering helpers ------------------------------------------------------

# SUBST = <string> with every literal <pattern> replaced by <replacement>.
subst() {
  local s="$1" pat="$2" rep="$3" out=""
  while :; do
    case "$s" in
      *"$pat"*)
        out="$out${s%%"$pat"*}$rep"
        s="${s#*"$pat"}"
        ;;
      *) break ;;
    esac
  done
  SUBST="$out$s"
}

# SUBST = <template> with {state_dir} and {branch} rendered, repo-relative,
# and {round} rendered only when a <round> is given.
render_path() {
  subst "$1" "{state_dir}" "$STATE_DIR"
  subst "$SUBST" "{branch}" "$A_BRANCH"
  if [ "$#" -ge 2 ]; then subst "$SUBST" "{round}" "$2"; fi
}

record_reports() {
  local prefix="$1.report." line key
  while IFS= read -r line; do
    case "$line" in
      "$prefix"*)
        key="${line#"$prefix"}"
        key="${key%%"$TAB"*}"
        hr_tsv_unescape_var "${line#*"$TAB"}"
        st_set "report.$key" "$HR_CFG_VALUE"
        ;;
    esac
  done <<EOF
$G_LINES
EOF
}

add_skipped_node() {
  st_get skipped_nodes
  fw_id_in_list "$1" "$SV" && return 0
  if [ -n "$SV" ]; then st_set skipped_nodes "$SV,$1"; else st_set skipped_nodes "$1"; fi
}

# Set BLOCK to <node>'s dispatch block, <pass> as its passed-through lines, and
# BLOCK_VARIANT to the prompt variant it carries. Writes no state.
render_block() {
  local node="$1" variant="$2" pass="$3" agent idx hb count
  g_need "nodes.$node.agent"
  agent="$GV"
  BLOCK="action: dispatch${NL}node: $node${NL}agent: $agent$NL"
  if g_get "nodes.$node.prompts.0"; then
    [ -n "$variant" ] || variant=initial
    case "$variant" in
      initial|revision) ;;
      *) fault "graph gives '$node' the unknown prompt variant '$variant'" ;;
    esac
    BLOCK="${BLOCK}prompt: $variant$NL"
  else
    variant=""
  fi
  BLOCK_VARIANT="$variant"
  if round_of_writer "$node"; then
    st_num round.number
    BLOCK="${BLOCK}arg.iteration: $SV$NL"
  fi
  if [ "$variant" = revision ]; then
    st_get revision_findings
    [ -n "$SV" ] || fault "a revision of '$node' is due and no findings file is recorded"
    list_lines "arg.findings_file: " "$SV"
    BLOCK="$BLOCK$LL"
  fi
  if round_of_gate "$node"; then
    st_num round.number
    BLOCK="${BLOCK}arg.iteration: $SV$NL"
    g_need "nodes.$RN.counter"
    st_num "counter.$GV"
    count="$SV"
    g_need "nodes.$RN.convergingFrom"
    case "$GV" in
      ''|*[!0-9]*) fault "graph gives round node '$RN' the non-numeric convergingFrom '$GV'" ;;
    esac
    if [ "$count" -lt "$GV" ]; then
      BLOCK="${BLOCK}arg.review_mode: full$NL"
    else
      BLOCK="${BLOCK}arg.review_mode: converging$NL"
    fi
  elif g_get "nodes.$node.findingsFolder"; then
    render_path "$GV"
    idx="$(fw_next_review_index "$ROOT/$SUBST")"
    BLOCK="${BLOCK}arg.iteration: $idx$NL"
  fi
  BLOCK="$BLOCK$pass"
  g_need "nodes.$node.heartbeat"
  st_get counter.iteration
  subst "$GV" "{iteration}" "$SV"
  hb="$SUBST"
  BLOCK="${BLOCK}heartbeat: $hb  (#<total_dispatches>)$NL"
}

render_dispatch() {
  local node="$1"
  render_block "$node" "$2" "$PASS"
  OUT="$BLOCK"
  st_set node "$node"
  st_set awaiting dispatch
  st_set resume ""
  st_set prompt ""
  if [ -n "$BLOCK_VARIANT" ]; then
    st_set prompt "$BLOCK_VARIANT"
    st_set "prompt.$node" "$BLOCK_VARIANT"
  fi
}

# Exit 0 when gate <g> has an outcome recorded this round (a verdict or a held
# outcome).
gate_recorded() {
  if st_get "round.verdict.$1" && [ -n "$SV" ]; then return 0; fi
  if st_get "round.held.$1" && [ -n "$SV" ]; then return 0; fi
  return 1
}

# Set OUT to the blocks of round <rn>'s set gates with no recorded outcome, in
# `gates` order, the first carrying the fan-out's passed-through lines. Set
# SET_PENDING to those gates, one `pending: <gate>` line each.
render_set() {
  local rn="$1" i=0 g gates pass
  st_get set.gates
  gates="$SV"
  st_get set.pass
  list_lines "" "$SV"
  pass="$LL"
  OUT=""
  SET_PENDING=""
  while g_get "nodes.$rn.gates.$i"; do
    g="$GV"
    i=$((i + 1))
    fw_id_in_list "$g" "$gates" || continue
    gate_recorded "$g" && continue
    render_block "$g" "" "$pass"
    OUT="$OUT$BLOCK"
    pass=""
    SET_PENDING="${SET_PENDING}pending: $g$NL"
  done
}

render_terminal() {
  local node="$1" i=0 key
  g_need "nodes.$node.binding"
  OUT="action: binding${NL}binding: $GV${NL}node: $node$NL"
  while g_get "reports.$i"; do
    key="$GV"
    if st_get "report.$key"; then
      OUT="${OUT}report: $key $SV$NL"
    fi
    i=$((i + 1))
  done
  OUT="$OUT$PASS"
  st_set node "$node"
  st_set awaiting done
}

# Print the binding at graph path <prefix> reached from <node>. <cap> is the
# cap that fired, for a cap escalation.
take_binding() {
  local prefix="$1" node="$2" cap="${3-}" binding reason i=0 r count ev
  g_need "$prefix.binding"
  binding="$GV"
  OUT="action: binding${NL}binding: $binding${NL}node: $node$NL"
  # A round node has no agent, so its escalation prints no `agent:` line.
  if g_get "nodes.$node.agent"; then
    OUT="${OUT}agent: $GV$NL"
  else
    g_get "nodes.$node.kind"
    [ "$GV" = round ] || fault "graph $GRAPH_FILE has no 'nodes.$node.agent'"
  fi
  st_set node "$node"
  case "$binding" in
    "<ask>")
      g_need "$prefix.resume"
      OUT="${OUT}resume: $GV$NL"
      st_set resume "$GV"
      st_set awaiting answer
      ;;
    "<escalate>")
      g_need "$prefix.reason"
      reason="$GV"
      OUT="${OUT}reason: $reason$NL"
      if [ "$reason" = cap ]; then
        st_get revision_findings
        list_lines "findings_file: " "$SV"
        OUT="$OUT$LL"
        st_get skipped_nodes
        local skipped="$SV"
        while g_get "$prefix.roundCounts.$i"; do
          r="$GV"
          i=$((i + 1))
          fw_id_in_list "$r" "$skipped" && continue
          g_need "nodes.$r.findingsFolder"
          render_path "$GV"
          count="$(fw_fail_count "$ROOT/$SUBST")"
          OUT="${OUT}rounds: $r $count$NL"
        done
        if g_get "$prefix.evidence"; then
          g_need "paths.$GV"
          render_path "$GV"
          ev="$(fw_index_evidence "$ROOT/$SUBST")"
          [ -z "$ev" ] || OUT="$OUT$ev$NL"
        fi
        if g_get "$prefix.summary"; then
          subst "$GV" "{cap}" "$cap"
          subst "$SUBST" "{open_gates}" "$OPEN_GATES"
          OUT="${OUT}summary: $SUBST$NL"
        fi
      fi
      st_set awaiting done
      ;;
    *) fault "graph binding '$binding' at '$prefix' is not <ask> or <escalate>" ;;
  esac
  OUT="$OUT$PASS"
}

# --- Transitions ------------------------------------------------------------

# Evaluate <node>'s skip constructs in order: SKIP_APPLIED is `skipped`,
# `passed-by-exclusion` or empty, SKIP_INDEX the construct that applied.
eval_skip() {
  local node="$1" i=0 construct phase id list status
  SKIP_APPLIED=""
  while [ -z "$SKIP_APPLIED" ] && g_get "nodes.$node.skip.$i.construct"; do
    construct="$GV"
    case "$construct" in
      skipped)
        g_need "nodes.$node.skip.$i.phase"
        phase="$GV"
        fw_phase_on "$ROOT" "$phase"
        status=$?
        case "$status" in
          0) ;;
          1) SKIP_APPLIED=skipped ;;
          *) refuse "cannot resolve phases.$phase in $ROOT/devscene.config.json" ;;
        esac
        ;;
      passedByExclusion)
        g_need "nodes.$node.skip.$i.runModeId"
        id="$GV"
        list="$(fw_run_mode_skipped "$ROOT" "$STATE_DIR" "$A_BRANCH" "$A_SKIPPED")"
        status=$?
        case "$status" in
          0) if fw_id_in_list "$id" "$list"; then SKIP_APPLIED=passed-by-exclusion; fi ;;
          1) refuse "no run-mode record: no flow-progress ledger for '$A_BRANCH' and no --skipped" ;;
          *) refuse "the flow-progress ledger for '$A_BRANCH' has no '- skipped:' line under '## Run mode'" ;;
        esac
        ;;
      *) fault "node '$node' has unknown skip construct '$construct'" ;;
    esac
    [ -n "$SKIP_APPLIED" ] || i=$((i + 1))
  done
  SKIP_INDEX="$i"
}

# Move to <node>, passing its skip gates, and render what is reached.
arrive() {
  local node="$1" variant="$2" steps=0 i applied
  while :; do
    steps=$((steps + 1))
    [ "$steps" -le 64 ] || fault "graph loops through skip gates at '$node'"
    g_get "nodes.$node.kind" || fault "graph has no node '$node'"
    case "$GV" in
      terminal)
        render_terminal "$node"
        return 0
        ;;
      round)
        open_round "$node" ""
        return 0
        ;;
      dispatch) ;;
      *) fault "node '$node' has unknown kind '$GV'" ;;
    esac
    eval_skip "$node"
    applied="$SKIP_APPLIED"
    i="$SKIP_INDEX"
    if [ -z "$applied" ]; then
      render_dispatch "$node" "$variant"
      return 0
    fi
    record_reports "nodes.$node.skip.$i"
    PASS="${PASS}skip: $node $applied$NL"
    [ "$applied" != skipped ] || add_skipped_node "$node"
    g_need "nodes.$node.skip.$i.to"
    node="$GV"
  done
}

# Open round <rn>: evaluate every gate's skip constructs in `gates` order (a
# skipped gate is in no block, and its `to` is not followed), then print one
# block per due gate — every unskipped gate, or with <only> (comma-joined) just
# those — and await the set. No gate due closes the round at once.
open_round() {
  local rn="$1" only="$2" i=0 g due="" applied
  while g_get "nodes.$rn.gates.$i"; do
    g="$GV"
    i=$((i + 1))
    eval_skip "$g"
    applied="$SKIP_APPLIED"
    if [ -n "$applied" ]; then
      record_reports "nodes.$g.skip.$SKIP_INDEX"
      PASS="${PASS}skip: $g $applied$NL"
      [ "$applied" != skipped ] || add_skipped_node "$g"
      continue
    fi
    if [ -n "$only" ] && ! fw_id_in_list "$g" "$only"; then continue; fi
    due="${due:+$due,}$g"
  done
  [ "$i" -gt 0 ] || fault "round node '$rn' lists no gates"
  if [ -z "$due" ]; then
    close_round "$rn"
    return 0
  fi
  st_set node "$rn"
  st_set awaiting set
  st_set resume ""
  st_set prompt ""
  st_set set.gates "$due"
  subst "${PASS%"$NL"}" "$NL" "$TAB"
  st_set set.pass "$SUBST"
  render_set "$rn"
}

# Record <outcome> for gate <g> of the set pending at round <rn>, then print
# `wait`, or at the set's last outcome, the join.
record_in_set() {
  local rn="$1" g="$A_NODE" n edge i=0 h first="" fo="" held=""
  [ -n "$g" ] || refuse "a round's set is pending at '$rn': name the gate with --node"
  st_num round.number
  n="$SV"
  st_get set.gates
  fw_id_in_list "$g" "$SV" || refuse "'$g' is not pending in round $n"
  gate_recorded "$g" && refuse "an outcome for '$g' is already recorded in round $n"
  edge="nodes.$g.outcomes.$A_OUTCOME"
  g_has_prefix "$edge." || refuse "outcome '$A_OUTCOME' is not declared by node '$g'"
  case "$A_OUTCOME" in
    PASS|FAIL)
      [ -n "$A_FINDINGS" ] \
        || refuse "outcome $A_OUTCOME at round gate '$g' requires --findings with the reviewer's findings_file"
      st_set "round.verdict.$g" "$A_OUTCOME"
      st_set "round.findings.$g" "$A_FINDINGS"
      record_reports "$edge"
      ;;
    *)
      g_get "$edge.binding" || fault "graph gives round gate '$g' the outcome '$A_OUTCOME', neither a verdict nor a binding"
      st_set "round.held.$g" "$A_OUTCOME"
      ;;
  esac
  render_set "$rn"
  if [ -n "$SET_PENDING" ]; then
    SAVE_OUT="$OUT"
    OUT="action: wait${NL}node: $rn${NL}recorded: $g $A_OUTCOME$NL$SET_PENDING"
    return 0
  fi
  # The join. A held outcome stops the round: no `round:` line, no counter move.
  while g_get "nodes.$rn.gates.$i"; do
    i=$((i + 1))
    st_get "round.held.$GV"
    [ -n "$SV" ] || continue
    held="${held}held: $GV $SV$NL"
    if [ -z "$first" ]; then first="$GV"; fo="$SV"; fi
  done
  if [ -z "$first" ]; then
    close_round "$rn"
    return 0
  fi
  g_need "nodes.$first.outcomes.$fo.binding"
  h="$GV"
  g_need "nodes.$first.agent"
  OUT="action: binding${NL}binding: $h${NL}node: $first${NL}agent: $GV${NL}reason: $fo$NL$held"
  st_set node "$first"
  st_set awaiting done
}

# A round node dispatches nothing: at the join it routes on the verdicts its
# gates recorded this round (a gate the walk skipped recorded none and counts
# as passed), hands the round's findings files to the revision, and clears the
# round.
close_round() {
  local rn="$1" i=0 g outcome=PASS list="" open=""
  while g_get "nodes.$rn.gates.$i"; do
    g="$GV"
    i=$((i + 1))
    st_get "round.verdict.$g"
    if [ "$SV" = FAIL ]; then
      outcome=FAIL
      open="${open:+$open, }$g"
    fi
    st_get "round.findings.$g"
    [ -z "$SV" ] || list="${list:+$list$TAB}$SV"
    st_unset "round.verdict.$g"
    st_unset "round.findings.$g"
    st_unset "round.held.$g"
  done
  [ "$i" -gt 0 ] || fault "round node '$rn' lists no gates"
  st_unset set.gates
  st_unset set.pass
  st_num round.number
  PASS="${PASS}round: $SV $outcome$NL"
  st_set revision_findings "$list"
  OPEN_GATES="$open"
  g_has_prefix "nodes.$rn.outcomes.$outcome." || fault "round node '$rn' declares no $outcome outcome"
  if [ "$outcome" = FAIL ]; then
    follow_edge "nodes.$rn.outcomes.$outcome" "$rn" advance
  else
    follow_edge "nodes.$rn.outcomes.$outcome" "$rn"
  fi
}

# Follow <edge> out of <node>. <advance>, given by a round's FAIL, moves the
# round number on when the edge does not escalate.
follow_edge() {
  local edge="$1" node="$2" advance="${3-}" counter cap n variant=initial
  if g_get "$edge.binding"; then
    take_binding "$edge" "$node"
    return 0
  fi
  if g_get "$edge.reset"; then
    st_set "counter.$GV" 0
  fi
  if g_get "$edge.increment"; then
    counter="$GV"
    st_get "counter.$counter"
    case "$SV" in
      ''|*[!0-9]*) fault "$STATE_FILE carries no numeric counter.$counter" ;;
    esac
    n=$((SV + 1))
    st_set "counter.$counter" "$n"
    g_need "counters.$counter.cap"
    cap="$GV"
    if [ "$n" -ge "$cap" ]; then
      g_get "$edge.onCap.binding" || fault "edge '$edge' reaches its cap with no onCap"
      take_binding "$edge.onCap" "$node" "$cap"
      return 0
    fi
  fi
  if [ -n "$advance" ]; then
    st_num round.number
    st_set round.number "$((SV + 1))"
  fi
  record_reports "$edge"
  if g_get "$edge.ledger"; then
    PASS="${PASS}ledger: $GV$NL"
  fi
  if g_get "$edge.prompt"; then variant="$GV"; fi
  g_need "$edge.to"
  arrive "$GV" "$variant"
}

# Set the round number, START_NODE and START_MODE (`arrive`, `subset` with
# START_ONLY the gates to open, or `close`) for a `start` whose entry <entry>
# is round node <rn>'s writer (<role> `writer`) or <rn> itself (`set`), from
# the round files on disk. Never touches a counter, and never infers
# convergence: a round whose files all read PASS is reviewed again.
start_round() {
  local rn="$1" role="$2" entry="$3" i=0 k=2 g ev status line rest
  local r="" note="" plan="" ng=0 j missing="" unread=0 failed=0
  FW_ARGS=("$ROOT" "")
  if g_get "nodes.$rn.revisionNote"; then
    g_need "paths.$GV"
    render_path "$GV"
    FW_ARGS[1]="$ROOT/$SUBST"
  fi
  while g_get "nodes.$rn.plan.$i"; do
    g_need "paths.$GV"
    render_path "$GV"
    FW_ARGS[$k]="$ROOT/$SUBST"
    k=$((k + 1))
    i=$((i + 1))
  done
  FW_ARGS[$k]="--"
  k=$((k + 1))
  i=0
  while g_get "nodes.$rn.gates.$i"; do
    g="$GV"
    i=$((i + 1))
    if [ "$role" = set ]; then
      eval_skip "$g"
      [ -z "$SKIP_APPLIED" ] || continue
    fi
    g_need "nodes.$g.findingsFolder"
    render_path "$GV"
    FW_ARGS[$k]="$g=$ROOT/${SUBST%/}"
    k=$((k + 1))
  done
  ev="$(fw_round_evidence "${FW_ARGS[@]}")"
  status=$?
  [ "$status" -eq 0 ] || fault "cannot read the round evidence of '$rn': git cannot answer in $ROOT"
  while IFS= read -r line; do
    case "$line" in
      "round: "*) r="${line#round: }" ;;
      "note: "*) note="${line#note: }" ;;
      "plan: "*) plan="${line#plan: }" ;;
      "gate: "*)
        rest="${line#gate: }"
        FW_GN[$ng]="${rest%% *}"
        rest="${rest#* }"
        FW_GV[$ng]="${rest%% *}"
        FW_GF[$ng]="${rest#* }"
        ng=$((ng + 1))
        ;;
    esac
  done <<EOF
$ev
EOF
  START_NODE="$entry"
  START_MODE=arrive
  if [ "$r" = none ]; then
    st_set round.number 0
    return 0
  fi
  case "$r" in
    ''|*[!0-9]*) fault "the round evidence of '$rn' carries no round" ;;
  esac
  if [ "$role" = writer ]; then
    st_set round.number "$((r + 1))"
    return 0
  fi
  st_set round.number "$r"
  j=0
  while [ "$j" -lt "$ng" ]; do
    case "${FW_GV[$j]}" in
      missing) missing="${missing:+$missing,}${FW_GN[$j]}" ;;
      unreadable) unread=1 ;;
      FAIL) failed=1 ;;
    esac
    j=$((j + 1))
  done
  if [ -n "$missing" ]; then
    # Open only the missing gates when the evidence is consistent: no present
    # gate unreadable, and no plan change postdates the round's files.
    if [ "$unread" -eq 0 ] && [ "$plan" = not-newer ]; then
      start_record "$ng"
      START_MODE=subset
      START_ONLY="$missing"
    fi
    return 0
  fi
  if [ "$unread" -eq 1 ] || [ "$failed" -eq 0 ]; then
    :
  elif [ "$note" = present ]; then
    st_set round.number "$((r + 1))"
  else
    start_record "$ng"
    START_MODE=close
  fi
}

# Record the verdict and file of each of the <n> gates start_round read that
# carries one, each file repo-relative as render_path gives it.
start_record() {
  local n="$1" j=0
  while [ "$j" -lt "$n" ]; do
    case "${FW_GV[$j]}" in
      PASS|FAIL)
        st_set "round.verdict.${FW_GN[$j]}" "${FW_GV[$j]}"
        st_set "round.findings.${FW_GN[$j]}" "${FW_GF[$j]#"$ROOT/"}"
        ;;
    esac
    j=$((j + 1))
  done
}

# --- Subcommands ------------------------------------------------------------

case "$CMD" in
  start)
    g_need start
    entry="$GV"
    if [ -n "$A_ENTRY" ]; then
      i=0
      found=1
      while g_get "entries.$i"; do
        if [ "$GV" = "$A_ENTRY" ]; then found=0; fi
        i=$((i + 1))
      done
      [ "$found" -eq 0 ] || refuse "'$A_ENTRY' is not an entry of flow '$A_FLOW'"
      entry="$A_ENTRY"
    fi
    lock_take
    st_set flow "$A_FLOW"
    st_set branch "$A_BRANCH"
    while IFS= read -r line; do
      case "$line" in
        counters.*.cap"$TAB"*)
          name="${line#counters.}"
          name="${name%%.cap"$TAB"*}"
          st_set "counter.$name" 0
          ;;
      esac
    done <<EOF
$G_LINES
EOF
    st_set revision_findings ""
    st_set skipped_nodes ""
    st_set round.number 0
    START_NODE="$entry"
    START_MODE=arrive
    if round_of_writer "$entry"; then
      start_round "$RN" writer "$entry"
    elif g_get "nodes.$entry.kind" && [ "$GV" = round ]; then
      start_round "$entry" set "$entry"
    elif round_of_gate "$entry"; then
      fault "graph $GRAPH_FILE enters at '$entry', a gate of round '$RN': a round's gates are entered through '$RN'"
    fi
    case "$START_MODE" in
      subset) open_round "$START_NODE" "$START_ONLY" ;;
      close) close_round "$START_NODE" ;;
      *) arrive "$START_NODE" initial ;;
    esac
    save_state
    ;;
  next)
    lock_take
    load_state
    st_get node
    node="$SV"
    st_get awaiting
    awaiting="$SV"
    if [ "$awaiting" != set ] && [ "$awaiting" != done ] && [ -n "$A_NODE" ] && [ "$A_NODE" != "$node" ]; then
      refuse "'$A_NODE' is not pending: the pending node is '$node'"
    fi
    case "$awaiting" in
      done)
        refuse "the walk finished at '$node'; no outcome is pending (run 'start' to walk again)"
        ;;
      set)
        record_in_set "$node"
        ;;
      answer)
        [ "$A_OUTCOME" = answered ] \
          || refuse "outcome '$A_OUTCOME' is not declared while an <ask> is pending at '$node'; only 'answered' is"
        [ -z "$A_FINDINGS" ] || st_set revision_findings "$A_FINDINGS"
        st_get resume
        resume="$SV"
        [ -n "$resume" ] || fault "$STATE_FILE carries no resume node"
        st_get "prompt.$resume"
        arrive "$resume" "$SV"
        ;;
      dispatch)
        g_has_prefix "nodes.$node.outcomes.$A_OUTCOME." \
          || refuse "outcome '$A_OUTCOME' is not declared by node '$node'"
        case "$A_OUTCOME" in
          PASS|FAIL) round_of_gate "$node" && gate=1 || gate=0 ;;
          *) gate=0 ;;
        esac
        if [ "$gate" -eq 1 ]; then
          [ -n "$A_FINDINGS" ] \
            || refuse "outcome $A_OUTCOME at round gate '$node' requires --findings with the reviewer's findings_file"
          st_set "round.verdict.$node" "$A_OUTCOME"
          st_set "round.findings.$node" "$A_FINDINGS"
        elif [ -n "$A_FINDINGS" ]; then
          st_set revision_findings "$A_FINDINGS"
        fi
        follow_edge "nodes.$node.outcomes.$A_OUTCOME" "$node"
        ;;
      *)
        fault "$STATE_FILE carries an unknown awaiting value '$awaiting'"
        ;;
    esac
    save_state
    ;;
  current)
    load_state
    ;;
esac

printf '%s' "$OUT"
exit 0
