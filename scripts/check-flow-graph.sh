#!/usr/bin/env bash
# check-flow-graph.sh — fail when a flow graph breaks a property its JSON Schema cannot express, or
# disagrees with the plugin documents it names. Hand-written for this repository, like
# check-llms-txt.sh; not an `init` output. Shape is `npm run validate:flow-graph`'s job and is
# assumed here, not checked.
#
# THE CONTRACT. Each line below is one check id and its definition; `--negatives` reads the ids off
# these lines, so a check added here without a fixture fails there.
#   1. reachable-from-start — every node is reached from `start` over outcome `to` edges, `skip[].to`
#      and `<ask>` `resume`.
#   2. reaches-terminal — from every node, some path over those same edges reaches a `terminal` node
#      or a node with a binding edge `<escalate>`, an `onCap` `<escalate>` included.
#   3. fail-cycle-capped — for every `FAIL` edge u → v carrying no `increment` of a counter with a
#      `cap`, u is not reachable from v once every capped-incrementing edge and every binding edge is
#      removed. The `<ask>` resume loop is exempt: MAX_TOTAL_DISPATCHES bounds it, not a counter.
#   4. run-mode-id-known — every `skip[].runModeId` is a `| `<id>` |` row of run_mode_instructions.md →
#      `## The closed directive set — the only four things a run mode may switch off`.
#   5. ledger-id-known — every edge `ledger` value is a `- [ ] <ID>.` entry of the task-engine template
#      in autonomous_pause_and_ledger.md → `### 1.3 Templates`, between `**Task engine**` and
#      `**User-review engine**`.
#   6. findings-folder-in-core — every `findingsFolder`, `{state_dir}` / `{branch}` written back as
#      `<state_dir>` / `<branch>`, is a backticked path in the flow core's `## Setup (once per session)`
#      step 2 table.
#   7. cap-matches-core — `counters.iteration.cap` equals every integer the flow core states in its
#      `## Setup (once per session)` step-4 `MAX_TOTAL_DISPATCHES = ` line (`iteration >= <N>`,
#      `caps at <N> revisions`) and in its `## Safety contract — applies before EVERY Agent dispatch`
#      step-2 halt line (`<N>-revision caps`); each of those three phrases must yield a value.
# An owner document, section or phrase that yields nothing is a finding, never an empty pass.
#
# Usage: check-flow-graph.sh [<graph>]
#          <graph>  repo-relative; default cli/templates/scripts/flows/task_plan_writing.graph.json
#        check-flow-graph.sh --negatives
#          every schemas/flow-graph-check/flow-graph-check-<check-id>.json must fail with <check-id>,
#          and every contract id must have such a file
# Exit: 0 clean · 1 one or more findings, each on stderr as
#       `check-flow-graph: <graph> — <check-id>: <detail>`, all reported · 2 bad usage
set -uo pipefail

usage() {
  echo "  usage: check-flow-graph.sh [<graph>] | check-flow-graph.sh --negatives" >&2
  exit 2
}
if [ $# -gt 1 ]; then
  echo "check-flow-graph: expected at most one argument" >&2
  usage
fi
mode=graph
graph="cli/templates/scripts/flows/task_plan_writing.graph.json"
case "${1:-}" in
  --negatives) mode=negatives ;;
  -*) echo "check-flow-graph: unknown option '$1'" >&2; usage ;;
  "") ;;
  *) graph="$1" ;;
esac

self="${BASH_SOURCE[0]}"
script_dir="$(cd "$(dirname "$self")" && pwd)"
self="$script_dir/${self##*/}"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "check-flow-graph: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "check-flow-graph: jq is not on PATH" >&2
  exit 1
fi

run_mode_doc="plugin/instructions/run_mode_instructions.md"
ledger_doc="plugin/instructions/autonomous_pause_and_ledger.md"
fixture_dir="schemas/flow-graph-check"

# Flow → core. Held here, not in the graph, so a file shipped to adopters never names a plugin/ path.
core_for_flow() {
  case "$1" in
    task_plan_writing) echo "plugin/instructions/task_plan_writing_instructions_core.md" ;;
    *) return 1 ;;
  esac
}

# Lines after the first line starting with $2, up to (excluding) the next line starting with $3.
between() {
  local text="$1" start="$2" stop="$3" on=0 line
  while IFS= read -r line || [ -n "$line" ]; do
    if [ "$on" -eq 0 ]; then
      [ "${line#"$start"}" != "$line" ] && on=1
      continue
    fi
    [ "${line#"$stop"}" != "$line" ] && break
    printf '%s\n' "$line"
  done <<<"$text"
}

read_doc() {
  [ -f "$1" ] && printf '%s\n' "$(<"$1")"
}

# --- graph checks, one `<check-id>\t<detail>` line per finding --------------------------------------
graph_jq='
def closure($edges):
  def grow: . as $s | ([$edges[] | select(.from as $f | $s | any(. == $f)) | .to] + $s | unique);
  unique | until(grow == .; grow);

(.nodes // {}) as $nodes
| (.start // "") as $start
| [ $nodes | to_entries[] | .key as $u | .value as $n
    | ( ($n.outcomes // {}) | to_entries[] | .key as $o | .value as $e
        | if ($e | has("to")) then {from: $u, to: $e.to, outcome: $o, increment: ($e.increment // null), binding: false}
          elif ($e.binding == "<ask>" and ($e | has("resume"))) then {from: $u, to: $e.resume, outcome: $o, increment: null, binding: true}
          else empty end ),
      ( ($n.skip // [])[] | {from: $u, to: .to, outcome: "skip", increment: null, binding: false} ) ] as $E
| [ (.counters // {}) | to_entries[] | select(.value | has("cap")) | .key ] as $capped
| ([$start] | closure($E)) as $R
| ( [ $nodes | to_entries[]
      | select(.value.kind == "terminal"
               or ([(.value.outcomes // {})[] | select(.binding == "<escalate>" or .onCap.binding == "<escalate>")] | length > 0))
      | .key ]
    | closure($E | map({from: .to, to: .from})) ) as $G
| [ $E[] | select((.binding | not) and ((.increment != null and ((.increment as $i | $capped | index([$i])) != null)) | not)) ] as $F
| ( ($nodes | keys[] | select(. as $k | $R | index([$k]) | not)
      | "reachable-from-start\tnode `\(.)` is not reached from start `\($start)`"),
    ($nodes | keys[] | select(. as $k | $G | index([$k]) | not)
      | "reaches-terminal\tnode `\(.)` reaches no terminal node and no <escalate> binding"),
    ($E[] | select(.outcome == "FAIL" and (.binding | not))
      | select((.increment != null and ((.increment as $i | $capped | index([$i])) != null)) | not)
      | . as $e | select([$e.to] | closure($F) | index([$e.from]) != null)
      | "fail-cycle-capped\tFAIL edge `\($e.from)` -> `\($e.to)` increments no capped counter, and `\($e.to)` reaches `\($e.from)` again") )
'

# Globals the owner-document reads fill once; each check reads them per graph.
run_mode_ids=""
ledger_ids=""

load_owner_docs() {
  local text row
  text="$(between "$(read_doc "$run_mode_doc")" "## The closed directive set — the only four things a run mode may switch off" "## ")"
  while IFS= read -r row; do
    [[ $row =~ ^\|\ \`([^\`]+)\`\ \| ]] && run_mode_ids+="${BASH_REMATCH[1]}"$'\n'
  done <<<"$text"

  text="$(between "$(read_doc "$ledger_doc")" "### 1.3 Templates" "### ")"
  text="$(between "$text" "**Task engine**" "**User-review engine**")"
  while IFS= read -r row; do
    [[ $row =~ ^-\ \[\ \]\ ([A-Za-z0-9.]+)\.[[:space:]] ]] && ledger_ids+="${BASH_REMATCH[1]}"$'\n'
  done <<<"$text"
}

in_list() {
  local needle="$1" list="$2" item
  while IFS= read -r item; do
    [ -n "$item" ] && [ "$item" = "$needle" ] && return 0
  done <<<"$list"
  return 1
}

# Prints `<check-id>\t<detail>` per finding for graph $1.
run_checks() {
  local g="$1" out flow core core_text setup table step4 halt cap value id f n src pat text found
  if [ ! -f "$g" ]; then
    printf 'graph\tfile not found\n'
    return
  fi
  if ! out="$(jq -r "$graph_jq" "$g" 2>&1)"; then
    printf 'graph\tjq could not evaluate the graph: %s\n' "$out"
    return
  fi
  [ -n "$out" ] && printf '%s\n' "$out"

  if [ -z "$run_mode_ids" ]; then
    printf 'run-mode-id-known\t%s yields no closed-set ids; refusing to pass without them\n' "$run_mode_doc"
  else
    while IFS= read -r id; do
      [ -z "$id" ] && continue
      in_list "$id" "$run_mode_ids" || printf 'run-mode-id-known\trunModeId \x27%s\x27 is not in the closed set of %s\n' "$id" "$run_mode_doc"
    done <<<"$(jq -r '.nodes[]? | .skip[]? | .runModeId // empty' "$g")"
  fi

  if [ -z "$ledger_ids" ]; then
    printf 'ledger-id-known\t%s yields no task-engine ledger ids; refusing to pass without them\n' "$ledger_doc"
  else
    while IFS= read -r id; do
      [ -z "$id" ] && continue
      in_list "$id" "$ledger_ids" || printf 'ledger-id-known\tledger \x27%s\x27 is not a task-engine entry of %s\n' "$id" "$ledger_doc"
    done <<<"$(jq -r '.nodes[]? | .outcomes[]? | .ledger // empty' "$g")"
  fi

  flow="$(jq -r '.flow // empty' "$g")"
  if ! core="$(core_for_flow "$flow")"; then
    printf 'findings-folder-in-core\tflow \x27%s\x27 has no core in this script\x27s flow table\n' "$flow"
    printf 'cap-matches-core\tflow \x27%s\x27 has no core in this script\x27s flow table\n' "$flow"
    return
  fi
  core_text="$(read_doc "$core")"
  setup="$(between "$core_text" "## Setup (once per session)" "## ")"

  table="$(between "$setup" "2. **Paths.**" "3. ")"
  if [ -z "$(grep -o '`[^`]*`' <<<"$table")" ]; then
    printf 'findings-folder-in-core\t%s ## Setup step 2 table yields no backticked path; refusing to pass without it\n' "$core"
  else
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      grep -qF "\`$f\`" <<<"$table" || printf 'findings-folder-in-core\tfindingsFolder \x27%s\x27 is not in %s ## Setup step 2 table\n' "$f" "$core"
    done <<<"$(jq -r '.nodes[]? | .findingsFolder // empty | gsub("\\{state_dir\\}"; "<state_dir>") | gsub("\\{branch\\}"; "<branch>")' "$g")"
  fi

  cap="$(jq -r '.counters.iteration.cap // empty' "$g")"
  if [ -z "$cap" ]; then
    printf 'cap-matches-core\tgraph has no counters.iteration.cap\n'
    return
  fi
  step4="$(grep -F 'MAX_TOTAL_DISPATCHES = ' <<<"$setup")"
  halt="$(grep -F 'Halted: exceeded MAX_TOTAL_DISPATCHES' <<<"$(between "$core_text" "## Safety contract — applies before EVERY Agent dispatch" "## ")")"
  # anchor label | source text | grep -o pattern | sed to the integer
  while IFS='|' read -r n src pat; do
    case "$src" in step4) text="$step4" ;; halt) text="$halt" ;; esac
    found=0
    while IFS= read -r value; do
      [ -z "$value" ] && continue
      found=1
      value="$(sed 's/[^0-9]//g' <<<"$value")"
      [ "$value" = "$cap" ] || printf 'cap-matches-core\tgraph cap %s, core states %s at %s\n' "$cap" "$value" "$n"
    done <<<"$(grep -oE "$pat" <<<"$text")"
    [ "$found" -eq 1 ] || printf 'cap-matches-core\t%s yields no value in %s; refusing to pass without it\n' "$n" "$core"
  done <<'ANCHORS'
## Setup step 4 `iteration >= <N>`|step4|`iteration >= [0-9]+`
## Setup step 4 `caps at <N> revisions`|step4|caps at [0-9]+ revisions
## Safety contract step 2 `<N>-revision caps`|halt|[0-9]+-revision caps
ANCHORS
}

load_owner_docs

if [ "$mode" = graph ]; then
  findings=0
  while IFS=$'\t' read -r id detail; do
    [ -z "$id" ] && continue
    echo "check-flow-graph: $graph — $id: $detail" >&2
    findings=$((findings + 1))
  done <<<"$(run_checks "$graph")"
  [ "$findings" -eq 0 ] && exit 0
  exit 1
fi

# --- --negatives ---------------------------------------------------------------------------------
findings=0
negative() {
  echo "check-flow-graph: $1 — negatives: $2" >&2
  findings=$((findings + 1))
}

contract_ids=""
in_contract=0
while IFS= read -r line; do
  if [ "$in_contract" -eq 0 ]; then
    [ "${line#"# THE CONTRACT."}" != "$line" ] && in_contract=1
    continue
  fi
  [ "${line#"#"}" = "$line" ] && break
  [[ $line =~ ^#\ +[0-9]+\.\ ([a-z-]+)\ — ]] && contract_ids+="${BASH_REMATCH[1]}"$'\n'
done <"$self"
if [ -z "$contract_ids" ]; then
  negative "$self" "THE CONTRACT yields no check ids; refusing to pass without them"
fi

fixtures_seen=""
shopt -s nullglob
for fixture in "$fixture_dir"/flow-graph-check-*.json; do
  base="${fixture##*/}"
  want="${base#flow-graph-check-}"
  want="${want%.json}"
  fixtures_seen+="$want"$'\n'
  if ! in_list "$want" "$contract_ids"; then
    negative "$fixture" "'${want}' is not a check id in THE CONTRACT"
    continue
  fi
  got=""
  while IFS=$'\t' read -r id detail; do
    [ -n "$id" ] && got+="$id"$'\n'
  done <<<"$(run_checks "$fixture")"
  if [ -z "$got" ]; then
    negative "$fixture" "passes every check; it must fail '${want}'"
  elif ! in_list "$want" "$got"; then
    negative "$fixture" "fails only on ${got//$'\n'/ }— not on '${want}'"
  fi
done
shopt -u nullglob

while IFS= read -r id; do
  [ -z "$id" ] && continue
  in_list "$id" "$fixtures_seen" || negative "$fixture_dir" "check id '${id}' has no fixture flow-graph-check-${id}.json"
done <<<"$contract_ids"

[ "$findings" -eq 0 ] && exit 0
exit 1
