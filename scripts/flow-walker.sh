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
#   bash <scripts_dir>/flow-walker.sh next    --flow <flow> --branch <branch> --outcome <outcome> [--findings <path>] [--skipped <ids|none>]
#   bash <scripts_dir>/flow-walker.sh current --flow <flow> --branch <branch>
#
#   `current` is read-only: it re-prints the saved pending action byte for
#   byte, and is how a planning (re-)entry finds a saved walk to continue. Its
#   output names the saved `awaiting`: `action: dispatch` is `dispatch`,
#   `binding: <ask>` is `answer`, any other `binding:` (`<escalate>`,
#   `<terminal_handoff>`) is `done` — a finished walk, re-printed but continued
#   by nothing: `next` refuses it with exit 1.
#
#   <outcome>  a key of the pending node's `outcomes`, or `answered` while an
#              `<ask>` is pending. `FAIL` requires `--findings`; so do `PASS`
#              and `FAIL` at a round gate — a node some `round` node lists in
#              its `gates` — whose reviewer writes a file every round.
#   --findings the reviewer's findings_file; it may not carry a tab.
#   --skipped  the run mode's skipped ids; read only when no flow-progress
#              ledger exists, and re-read on every arrival at a gated node.
#   The graph is `<this script's dir>/flows/<flow>.graph.json`, formatVersion
#   2; the root is a bare `git rev-parse --show-toplevel` in the working
#   directory.
#
# ROUNDS — a `round` node dispatches nothing. Every gate it lists runs every
# round, a gate's PASS and FAIL alike routing on; arriving at the round node
# closes the round: FAIL when a gate recorded FAIL this round (a skipped gate
# counts as passed), else PASS, followed through the node's `outcomes` as an
# agent's outcome is. Two numbers are kept apart: the loop COUNTER
# (`counter.<name>`, the heartbeat's `{iteration}`) alone drives the cap and
# the review mode; the ROUND NUMBER names the round files, is the same index
# in every gate's folder, and carries on across the branch's planning history.
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
#   binding   action: binding / binding: <name> / node: / then
#             <ask>               agent: / resume: <node>
#             <escalate>          agent: (none when node: is a round node) /
#                                 reason: <cap|error|blocker>, and for a cap:
#                                 findings_file: per file of the closing round /
#                                 rounds: <node> <its folder's FAIL files> (a
#                                 node recorded `skipped` omitted) / evidence
#                                 lines / summary: ({cap}; {open_gates} the
#                                 closing round's FAIL gates, `, `-joined)
#             <terminal_handoff>  report: <key> <value> per recorded key
#             then its skip: / round: / ledger: lines.
#
# EXIT CODES
#
#   0  an action was printed (and, for start / next, the state written)
#   1  refusal: bad usage, undeclared outcome, `next` before `start`, `current`
#      with no walk saved (a re-entry's "no saved walk"), a flow or
#      branch other than the state's, unknown flow, a formatVersion other than
#      2, FAIL without --findings, PASS or FAIL at a round gate without
#      --findings, no run-mode record, an unresolvable phase flag
#   2  the configuration, the graph or the state file cannot be resolved or
#      written, the round evidence cannot be read, or lib/harness-run-lib.sh
#      predates this walker
#   Every non-zero exit prints one `flow-walker: <cause>` line on stderr and
#   leaves the state file byte-identical.
#
# STATE — `<state_dir>/.flow_walker_state`, machine-local, flat `key=value`
# lines: flow, branch, the pending node, `awaiting` (dispatch / answer / done),
# `counter.<name>`, `round.number`, the open round's `round.verdict.<gate>` and
# `round.findings.<gate>`, `revision_findings` (the closed round's files,
# TAB-joined; `ui_review`'s FAIL stores one), the prompt variants, the
# recorded `report.<key>` values, the nodes skipped as `skipped`, and the
# pending action's printed lines (`out=`), which `current` re-prints
# unchanged. Only `start` overwrites it, and every `start` sets every counter
# to 0 — a fresh write, an extend, an extend after a cap park and a skip past
# a loop alike; only a re-entry that continues a saved walk (`current`, then
# `next` or a re-dispatch of the printed action) carries the counter, the
# prompt variants and the round's records across a session boundary.
# `round.number` is never the counter: `start` reads it off the round files
# through `fw_round_evidence` when the entry is a round's writer (the next
# round) or one of its gates (the round on disk, continued at its first
# missing gate when every earlier gate reads a verdict and no plan change
# postdates it, else restarted at its first gate; a complete round with a
# FAIL is closed, or moved past when its revision note exists), and is 0 for
# any other entry or with no round file on disk. A complete all-PASS round is
# reviewed again: convergence is never inferred from files. The state is a
# position, never a phase record: the flow-progress ledger stays the only
# durable record. Replaced by temp file and `mv`.
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
#     -> dispatch business_parity_review, arg.iteration: 0, arg.review_mode: full
#   ... next ... --outcome PASS --findings b0.md --skipped none -> architecture_review, arg.iteration: 0
#   ... next ... --outcome PASS --findings a0.md --skipped none -> plan_review, arg.iteration: 0
#   ... next ... --outcome PASS --findings p0.md --skipped none
#     -> round: 0 PASS, ledger: P1, ui_writer, prompt: initial
#   ... next ... --outcome returned --skipped none -> ui_review
#   ... next ... --outcome PASS --skipped none   -> binding: <terminal_handoff>,
#                                                  four report: lines, ledger: P2
#   ... next ... --outcome PASS   -> exit 1: the walk has finished
#   A FAIL round: start again, `returned`, `PASS --findings b0.md`, then
#   ... next ... --outcome FAIL --findings a0.md --skipped none -> plan_review, arg.iteration: 0
#   ... next ... --outcome PASS --findings p0.md --skipped none
#     -> round: 0 FAIL, plan_writer, prompt: revision, arg.iteration: 1,
#        arg.findings_file: b0.md / a0.md / p0.md, heartbeat iter 1

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
while [ "$#" -gt 0 ]; do
  flag="$1"
  case "$CMD:$flag" in
    *:--flow|*:--branch|start:--entry|start:--skipped|next:--skipped|next:--outcome|next:--findings) ;;
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
[ "$GV" = 2 ] || refuse "graph $GRAPH_FILE has formatVersion '$GV'; this walker reads 2"
g_need flow
[ "$GV" = "$A_FLOW" ] || fault "graph $GRAPH_FILE declares flow '$GV', not '$A_FLOW'"

# --- The state store (newline-joined `key=value`) ----------------------------

ST_LINES="$NL"
OUT=""
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
  local dir tmp line
  dir="${STATE_FILE%/*}"
  [ -d "$dir" ] || mkdir -p "$dir" || fault "cannot create $dir"
  tmp="$STATE_FILE.tmp.$$"
  {
    printf '%s' "${ST_LINES#"$NL"}"
    while IFS= read -r line; do
      if [ -n "$line" ]; then printf 'out=%s\n' "$line"; fi
    done <<EOF
$OUT
EOF
  } > "$tmp" 2>/dev/null || { rm -f "$tmp"; fault "cannot write $tmp"; }
  mv -f "$tmp" "$STATE_FILE" 2>/dev/null || { rm -f "$tmp"; fault "cannot replace $STATE_FILE"; }
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

render_dispatch() {
  local node="$1" variant="$2" agent idx hb count
  g_need "nodes.$node.agent"
  agent="$GV"
  OUT="action: dispatch${NL}node: $node${NL}agent: $agent$NL"
  st_set node "$node"
  st_set awaiting dispatch
  st_set resume ""
  st_set prompt ""
  if g_get "nodes.$node.prompts.0"; then
    [ -n "$variant" ] || variant=initial
    case "$variant" in
      initial|revision) ;;
      *) fault "graph gives '$node' the unknown prompt variant '$variant'" ;;
    esac
    OUT="${OUT}prompt: $variant$NL"
    st_set prompt "$variant"
    st_set "prompt.$node" "$variant"
  else
    variant=""
  fi
  if round_of_writer "$node"; then
    st_num round.number
    OUT="${OUT}arg.iteration: $SV$NL"
  fi
  if [ "$variant" = revision ]; then
    st_get revision_findings
    [ -n "$SV" ] || fault "a revision of '$node' is due and no findings file is recorded"
    list_lines "arg.findings_file: " "$SV"
    OUT="$OUT$LL"
  fi
  if round_of_gate "$node"; then
    st_num round.number
    OUT="${OUT}arg.iteration: $SV$NL"
    g_need "nodes.$RN.counter"
    st_num "counter.$GV"
    count="$SV"
    g_need "nodes.$RN.convergingFrom"
    case "$GV" in
      ''|*[!0-9]*) fault "graph gives round node '$RN' the non-numeric convergingFrom '$GV'" ;;
    esac
    if [ "$count" -lt "$GV" ]; then
      OUT="${OUT}arg.review_mode: full$NL"
    else
      OUT="${OUT}arg.review_mode: converging$NL"
    fi
  elif g_get "nodes.$node.findingsFolder"; then
    render_path "$GV"
    idx="$(fw_next_review_index "$ROOT/$SUBST")"
    OUT="${OUT}arg.iteration: $idx$NL"
  fi
  OUT="$OUT$PASS"
  g_need "nodes.$node.heartbeat"
  st_get counter.iteration
  subst "$GV" "{iteration}" "$SV"
  hb="$SUBST"
  OUT="${OUT}heartbeat: $hb  (#<total_dispatches>)$NL"
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
        close_round "$node"
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

# A round node dispatches nothing: it routes on the verdicts its gates recorded
# this round (a gate the walk skipped recorded none and counts as passed),
# hands the round's findings files to the revision, and clears the round.
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
  done
  [ "$i" -gt 0 ] || fault "round node '$rn' lists no gates"
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

# Set the round number and START_NODE for a `start` whose entry <entry> is
# round node <rn>'s writer (<role> `writer`) or one of its gates (`gate`),
# from the round files on disk. Never touches a counter, and never infers
# convergence: a round whose files all read PASS is reviewed again.
start_round() {
  local rn="$1" role="$2" entry="$3" i=0 k=2 g ev status line rest
  local r="" note="" plan="" ng=0 j m=-1 unread=0 failed=0 first ok
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
    if [ "$role" = gate ]; then
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
  g_need "nodes.$rn.gates.0"
  first="$GV"
  st_set round.number "$r"
  j=0
  while [ "$j" -lt "$ng" ]; do
    case "${FW_GV[$j]}" in
      missing) [ "$m" -ge 0 ] || m="$j" ;;
      unreadable) unread=1 ;;
      FAIL) failed=1 ;;
    esac
    j=$((j + 1))
  done
  if [ "$m" -ge 0 ]; then
    # Continue at the first missing gate only when every gate before it reads
    # a verdict and no plan change postdates the round's files.
    ok=0
    [ "$plan" = not-newer ] || ok=1
    j=0
    while [ "$ok" -eq 0 ] && [ "$j" -lt "$m" ]; do
      case "${FW_GV[$j]}" in
        PASS|FAIL) ;;
        *) ok=1 ;;
      esac
      j=$((j + 1))
    done
    if [ "$ok" -eq 0 ]; then
      start_record "$m"
      START_NODE="${FW_GN[$m]}"
    else
      START_NODE="$first"
    fi
    return 0
  fi
  if [ "$unread" -eq 1 ] || [ "$failed" -eq 0 ]; then
    START_NODE="$first"
  elif [ "$note" = present ]; then
    st_set round.number "$((r + 1))"
    START_NODE="$first"
  else
    start_record "$ng"
    START_NODE="$rn"
  fi
}

# Record the verdicts and files of the first <n> gates start_round read, each
# file repo-relative as render_path gives it.
start_record() {
  local n="$1" j=0
  while [ "$j" -lt "$n" ]; do
    st_set "round.verdict.${FW_GN[$j]}" "${FW_GV[$j]}"
    st_set "round.findings.${FW_GN[$j]}" "${FW_GF[$j]#"$ROOT/"}"
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
    if round_of_writer "$entry"; then
      start_round "$RN" writer "$entry"
    elif round_of_gate "$entry"; then
      start_round "$RN" gate "$entry"
    fi
    arrive "$START_NODE" initial
    save_state
    ;;
  next)
    load_state
    st_get node
    node="$SV"
    st_get awaiting
    case "$SV" in
      done)
        refuse "the walk finished at '$node'; no outcome is pending (run 'start' to walk again)"
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
        fault "$STATE_FILE carries an unknown awaiting value '$SV'"
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
