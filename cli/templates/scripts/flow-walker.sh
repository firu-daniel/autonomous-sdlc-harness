#!/usr/bin/env bash
# flow-walker.sh — the next step of a declared flow, read off its graph instead
# of worked out from prose: given the flow, the branch and the outcome of the
# node that just ran, print the next action in one fixed form.
#
# THE WALKER ROUTES; THE ORCHESTRATOR JUDGES. It owns the next node, the shared
# counter and its cap, both skip semantics, each reviewer's `iteration:`
# argument and the escalation payload, and it rejects an outcome the pending
# node does not declare. Which outcome a return carries, and what a binding
# resolves to, stay the orchestrator's.
#
# THE SAFETY CONTRACT IS DELIBERATELY NOT THE WALKER'S. The STOP check, the
# `.dispatch_counter` increment, the PAUSE check and the halt messages stay
# orchestrator steps, so the heartbeat carries the literal slot
# `(#<total_dispatches>)` for the orchestrator to fill. A binding is printed by
# NAME and never resolved; no dispatch prompt is composed — only the values the
# core's dispatch block lacks (`arg.iteration`, `arg.findings_file`) and the
# prompt variant.
#
# USAGE — each call one literal command from the repository root:
#
#   bash <scripts_dir>/flow-walker.sh start   --flow <flow> --branch <branch> [--entry <node>] [--skipped <ids|none>]
#   bash <scripts_dir>/flow-walker.sh next    --flow <flow> --branch <branch> --outcome <outcome> [--findings <path>] [--skipped <ids|none>]
#   bash <scripts_dir>/flow-walker.sh current --flow <flow> --branch <branch>
#
#   <outcome>  a key of the pending node's `outcomes`, or `answered` while an
#              `<ask>` is pending. `FAIL` requires `--findings`.
#   --skipped  the run mode's skipped ids; read only when no flow-progress
#              ledger exists, and re-read on every arrival at a gated node.
#   The graph is `<this script's dir>/flows/<flow>.graph.json`; the root is a
#   bare `git rev-parse --show-toplevel` in the working directory.
#
# OUTPUT — stdout, `key: value` lines, in this order:
#
#   dispatch  action: dispatch / node: / agent: / prompt: (writer nodes) /
#             arg.iteration: (reviewer nodes: the next free index in the node's
#             findings folder, never the counter) / arg.findings_file: (with
#             `prompt: revision`) / skip: <node> <skipped|passed-by-exclusion>
#             and ledger: <id> lines for what the walk passed through /
#             heartbeat: <template, {iteration} = the counter>  (#<total_dispatches>)
#   binding   action: binding / binding: <name> / node: / then
#             <ask>               agent: / resume: <node>
#             <escalate>          agent: / reason: <cap|error|blocker>, and for
#                                 a cap: findings_file: / rounds: <node> <count>
#                                 (a node recorded `skipped` omitted) / evidence
#                                 lines / summary:
#             <terminal_handoff>  report: <key> <value> per recorded key
#             then its skip: / ledger: lines.
#
# EXIT CODES
#
#   0  an action was printed (and, for start / next, the state written)
#   1  refusal: bad usage, undeclared outcome, `next` before `start`, a flow or
#      branch other than the state's, unknown flow, formatVersion not 1, FAIL
#      without --findings, no run-mode record, an unresolvable phase flag
#   2  the configuration, the graph or the state file cannot be resolved or
#      written, or lib/harness-run-lib.sh predates this walker
#   Every non-zero exit prints one `flow-walker: <cause>` line on stderr and
#   leaves the state file byte-identical.
#
# STATE — `<state_dir>/.flow_walker_state`, machine-local, flat `key=value`
# lines: flow, branch, the pending node, `awaiting` (dispatch / answer / done),
# `counter.<name>`, the prompt variants, the last findings file, the recorded
# `report.<key>` values, the nodes skipped as `skipped`, and the pending
# action's printed lines (`out=`), which `current` re-prints unchanged. `start`
# overwrites it and resets every counter to 0. Replaced by temp file and `mv`.
#
# BASH 3.2 AND JQ 1.5 ARE THE FLOORS: no associative array and no array-reading
# builtin. The graph is flattened by one `jq` per call.
#
# REPRO — one PASS-everywhere walk in a throwaway fixture:
#
#   d=$(mktemp -d); git -C "$d" init -q -b feat_x
#   printf '%s' '{"defaultBranch":"main","stateDir":"sdlc-harness/","phases":{"parity":true,"qa":true}}' > "$d/harness.config.json"
#   mkdir -p "$d/s/lib" "$d/s/flows"
#   cp <scripts_dir>/flow-walker.sh "$d/s/"
#   cp <scripts_dir>/lib/harness-run-lib.sh <scripts_dir>/lib/flow-walker-gates.sh "$d/s/lib/"
#   cp <scripts_dir>/flows/task_plan_writing.graph.json "$d/s/flows/"
#   cd "$d"
#   bash s/flow-walker.sh start --flow task_plan_writing --branch feat_x --skipped none
#     -> dispatch plan_writer, prompt: initial
#   ... next --flow task_plan_writing --branch feat_x --outcome returned --skipped none
#     -> dispatch business_parity_review, arg.iteration: 0
#   ... next ... --outcome PASS --skipped none   -> architecture_review, arg.iteration: 0
#   ... next ... --outcome PASS --skipped none   -> plan_review, arg.iteration: 0
#   ... next ... --outcome PASS --skipped none   -> ledger: P1, ui_writer, prompt: initial
#   ... next ... --outcome returned --skipped none -> ui_review
#   ... next ... --outcome PASS --skipped none   -> binding: <terminal_handoff>,
#                                                  four report: lines, ledger: P2
#   ... next ... --outcome PASS   -> exit 1: the walk has finished

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
  printf 'flow-walker: %s predates this walker (it defines no hr_phase_enabled): delete that file and re-run autonomous-sdlc-harness init, which writes the current copy\n' "$fw_dir/lib/harness-run-lib.sh" >&2
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
  1) fault "no harness.config.json at $ROOT" ;;
  *) fault "cannot resolve $ROOT/harness.config.json (invalid JSON, no defaultBranch, or jq missing or older than 1.5)" ;;
esac
STATE_DIR="$(hr_state_dir "$ROOT")" || fault "cannot resolve stateDir from $ROOT/harness.config.json"
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

g_get formatVersion || refuse "graph $GRAPH_FILE carries no formatVersion"
[ "$GV" = 1 ] || refuse "graph $GRAPH_FILE has formatVersion '$GV'; this walker reads 1"
g_need flow
[ "$GV" = "$A_FLOW" ] || fault "graph $GRAPH_FILE declares flow '$GV', not '$A_FLOW'"

# --- The state store (newline-joined `key=value`) ----------------------------

ST_LINES="$NL"
OUT=""
PASS=""

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

st_set() {
  local key="$1" val="$2" line out="$NL"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    case "$line" in
      "$key="*) continue ;;
    esac
    out="$out$line$NL"
  done <<EOF
$ST_LINES
EOF
  ST_LINES="$out$key=$val$NL"
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

# SUBST = <template> with {state_dir} and {branch} rendered, repo-relative.
render_path() {
  subst "$1" "{state_dir}" "$STATE_DIR"
  subst "$SUBST" "{branch}" "$A_BRANCH"
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
  local node="$1" variant="$2" agent idx hb
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
    if [ "$variant" = revision ]; then
      st_get findings_file
      [ -n "$SV" ] || fault "a revision of '$node' is due and no findings file is recorded"
      OUT="${OUT}arg.findings_file: $SV$NL"
    fi
  fi
  if g_get "nodes.$node.findingsFolder"; then
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
  local prefix="$1" node="$2" cap="${3-}" binding agent reason i=0 r count ev
  g_need "$prefix.binding"
  binding="$GV"
  g_need "nodes.$node.agent"
  agent="$GV"
  OUT="action: binding${NL}binding: $binding${NL}node: $node${NL}agent: $agent$NL"
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
        st_get findings_file
        OUT="${OUT}findings_file: $SV$NL"
        st_get skipped_nodes
        local skipped="$SV"
        while g_get "$prefix.roundCounts.$i"; do
          r="$GV"
          i=$((i + 1))
          fw_id_in_list "$r" "$skipped" && continue
          g_need "nodes.$r.findingsFolder"
          render_path "$GV"
          count="$(fw_round_count "$ROOT/$SUBST")"
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

# Move to <node>, passing its skip gates, and render what is reached.
arrive() {
  local node="$1" variant="$2" steps=0 i applied construct phase id list status
  while :; do
    steps=$((steps + 1))
    [ "$steps" -le 64 ] || fault "graph loops through skip gates at '$node'"
    g_get "nodes.$node.kind" || fault "graph has no node '$node'"
    case "$GV" in
      terminal)
        render_terminal "$node"
        return 0
        ;;
      dispatch) ;;
      *) fault "node '$node' has unknown kind '$GV'" ;;
    esac
    applied=""
    i=0
    while [ -z "$applied" ] && g_get "nodes.$node.skip.$i.construct"; do
      construct="$GV"
      case "$construct" in
        skipped)
          g_need "nodes.$node.skip.$i.phase"
          phase="$GV"
          fw_phase_on "$ROOT" "$phase"
          status=$?
          case "$status" in
            0) ;;
            1) applied=skipped ;;
            *) refuse "cannot resolve phases.$phase in $ROOT/harness.config.json" ;;
          esac
          ;;
        passedByExclusion)
          g_need "nodes.$node.skip.$i.runModeId"
          id="$GV"
          list="$(fw_run_mode_skipped "$ROOT" "$STATE_DIR" "$A_BRANCH" "$A_SKIPPED")"
          status=$?
          case "$status" in
            0) if fw_id_in_list "$id" "$list"; then applied=passed-by-exclusion; fi ;;
            1) refuse "no run-mode record: no flow-progress ledger for '$A_BRANCH' and no --skipped" ;;
            *) refuse "the flow-progress ledger for '$A_BRANCH' has no '- skipped:' line under '## Run mode'" ;;
          esac
          ;;
        *) fault "node '$node' has unknown skip construct '$construct'" ;;
      esac
      [ -n "$applied" ] || i=$((i + 1))
    done
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

follow_edge() {
  local edge="$1" node="$2" counter cap n variant=initial
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
  record_reports "$edge"
  if g_get "$edge.ledger"; then
    PASS="${PASS}ledger: $GV$NL"
  fi
  if g_get "$edge.prompt"; then variant="$GV"; fi
  g_need "$edge.to"
  arrive "$GV" "$variant"
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
    st_set findings_file ""
    st_set skipped_nodes ""
    arrive "$entry" initial
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
        [ -z "$A_FINDINGS" ] || st_set findings_file "$A_FINDINGS"
        st_get resume
        resume="$SV"
        [ -n "$resume" ] || fault "$STATE_FILE carries no resume node"
        st_get "prompt.$resume"
        arrive "$resume" "$SV"
        ;;
      dispatch)
        g_has_prefix "nodes.$node.outcomes.$A_OUTCOME." \
          || refuse "outcome '$A_OUTCOME' is not declared by node '$node'"
        [ -z "$A_FINDINGS" ] || st_set findings_file "$A_FINDINGS"
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
