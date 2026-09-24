#!/usr/bin/env bash
# run-arm-a.sh — drive arm A of the docs-retrieval eval: navigation by a headless
# agent, one invocation per query, into a transcript
# `evals/docs-retrieval/arm-a/score-transcript.mjs` scores. Two variants:
# A-index (`--variant index`, the default) sends `agent-task.md`, pointed at the
# index named by `--index`; A-search (`--variant search`) sends
# `agent-task-search.md`, which names no index.
#
# HAND-RUN ONLY. Arm A needs a nested agent subprocess. The unattended permission
# profile carries no grant for the agent binary, and per that profile's own
# `_README` a tool call matching neither `allow` nor `deny` STALLS in print mode
# rather than prompting — so an unattended attempt hangs the run instead of
# reporting a refusal. The `scripts/scratch-run.sh` route to the same subprocess
# is technically open and is declined on purpose: it would put an unsupervised
# nested agent session, with its own auth and no token cap, inside an unattended
# run to take a measurement. So this file is run by an operator at a terminal and
# by nobody else. Do not add an agent grant to the profile and do not route this
# arm through `scratch-run.sh`.
#
# ONE STRUCTURAL PROPERTY KEEPS THAT HONEST AND IS WORTH KEEPING. This file sits
# OUTSIDE the configured `scriptsDir`, and the script-allowlist guard issues its
# automatic permit only for a command whose every `.sh` token resolves under that
# directory. So an agent invoking this file obtains no automatic permit and falls
# through to the permission system; the guard emits `allow` or nothing, so what
# that buys is the absence of a permit rather than a refusal. The prohibition
# above is what does the real work.
#
# THE FLAG SPELLINGS HERE are the documented print-mode surface; confirm them
# against the agent CLI's own `--help` before a run, and see
# `docs/retrieval-eval.md` for the procedure this file is the mechanism of.
#
# `--strict-mcp-config` is passed so the session loads no MCP server: a catalog
# that ships its own docs-search server would otherwise hand the agent a
# retrieval tool outside the read-only fence, and arm A would measure that tool
# instead of navigation.
#
# THE AGENT BINARY IS REACHED THROUGH `${HARNESS_AGENT_CLI:-claude}`, the one
# indirection `ARCHITECTURE.md` §4 records as the place the engine binary is
# chosen; §5 inventories its read sites.
#
# WHAT IT WRITES. One JSON object per line, appended to the output path as each
# query finishes, so a run interrupted at query seven keeps six records:
#
#   {"id":…,"query":…,"refs":[…],"durationMs":…,"usage":{…},"variant":…,"toolCalls":{…}}
#
# `refs` is the agent's answer split into lines, in the order it gave them, with
# nothing repaired — the single token `none` included, which is its abstention.
# `refs` and `usage` come from the stream's final `result` event; `usage` is that
# event's own usage block, verbatim. `durationMs` has WHOLE-SECOND resolution: the
# `bash` floor in this tree is 3.2 and BSD `date` has no sub-second format, and an
# agent turn is measured in seconds. `variant` is `index` or `search`.
# `toolCalls` counts the stream's `tool_use` blocks by tool name (`{}` when none):
# it is how a reader later tells whether A-index grepped instead of following the
# index, and whether any session used a tool outside the fence. Nothing else from
# the stream is kept — no tool input, which carries absolute paths.
#
# Usage: run-arm-a.sh [--variant index|search] [--index <path>] [--model <name>]
#                     <corpus-root> <query-set.jsonl> <out.jsonl>
#   --variant      `index` (default) or `search`
#   --index        the index A-index reads first, relative to <corpus-root>;
#                  default `docs/INDEX.md`; refused with `--variant search`
#   --model        passed to the agent as `--model`; omitted when not given
#   <corpus-root>  the directory holding the catalog's `docs/`; the agent's
#                  working directory, and what every `ref` is relative to
#   <query-set>    a labelled query set (`evals/docs-retrieval/queries/`)
#   <out>          the transcript to append to; created if absent
#
# Exit 64 on bad usage; 65 when the selected task file's token counts are wrong
# (`{{query}}` once in either file; `{{index}}` once in `agent-task.md`, never in
# `agent-task-search.md`); 66 on an unreadable input or, for A-index, a missing
# `<corpus-root>/<index>`; 69 when `jq` or the agent CLI is not on PATH. All of
# those are checked before any agent call.
#
# Requires `jq` 1.5 or newer, the floor `plugin/hooks/README.md` already sets.
#
# REPRO — what to check before spending tokens, none of which invokes the agent:
#
#   the task texts    grep -c '{{query}}' evals/docs-retrieval/arm-a/agent-task.md          -> 1
#                     grep -c '{{index}}' evals/docs-retrieval/arm-a/agent-task.md          -> 1
#                     grep -c '{{query}}' evals/docs-retrieval/arm-a/agent-task-search.md   -> 1
#                     grep -c '{{index}}' evals/docs-retrieval/arm-a/agent-task-search.md   -> 0
#   the query set     jq -r .id evals/docs-retrieval/queries/fixture-catalog.jsonl
#   the index         ls evals/docs-retrieval/corpora/fixture-catalog/docs/INDEX.md
#                     ls "$HARNESS_EVAL_CORPUS_ROOT/docs/expause-web/INDEX.md"
#   the scorer        bash scripts/scratch-run.sh <a launcher calling scoreTranscript
#                     on evals/docs-retrieval/arm-a/sample-transcript.json>
#
#   Then the run itself, from the repository root, by hand — the fixture:
#     bash evals/docs-retrieval/arm-a/run-arm-a.sh \
#       evals/docs-retrieval/corpora/fixture-catalog \
#       evals/docs-retrieval/queries/fixture-catalog.jsonl \
#       /tmp/arm-a-fixture-catalog.jsonl
#
#   the real catalog, A-index:
#     bash evals/docs-retrieval/arm-a/run-arm-a.sh --variant index \
#       --index docs/expause-web/INDEX.md --model opus \
#       "$HARNESS_EVAL_CORPUS_ROOT" \
#       evals/docs-retrieval/queries/gate10-catalog.jsonl \
#       harness-runs/scratch/arm-a/gate10-catalog/index-rep1.jsonl
#
#   the real catalog, A-search:
#     bash evals/docs-retrieval/arm-a/run-arm-a.sh --variant search --model opus \
#       "$HARNESS_EVAL_CORPUS_ROOT" \
#       evals/docs-retrieval/queries/gate10-catalog.jsonl \
#       harness-runs/scratch/arm-a/gate10-catalog/search-rep1.jsonl
#
#   and publication, which is the eval's own writer and never a hand edit:
#     bash scripts/run-gates.sh   # or the eval invoked with --out and --transcript

set -euo pipefail

AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"

# The read-only tool set, identical for both variants. `Read`, `Grep` and `Glob`
# are what navigating a catalog needs; granting no `Bash`, no `Write`, no `Edit`
# and no web tool is what keeps the run inside the corpus and off the network.
# Both lists are passed, because an allow list that a future default widens is
# not on its own a fence.
ALLOWED_TOOLS='Read Grep Glob'
DISALLOWED_TOOLS='Bash Write Edit MultiEdit NotebookEdit WebFetch WebSearch'

USAGE='usage: run-arm-a.sh [--variant index|search] [--index <path>] [--model <name>] <corpus-root> <query-set.jsonl> <out.jsonl>'

usage_error() {
  echo "run-arm-a.sh: $1" >&2
  echo "  $USAGE" >&2
  exit 64
}

variant='index'
index_path='docs/INDEX.md'
index_given=0
model=''

while [ "$#" -gt 0 ]; do
  case "$1" in
    --variant)
      [ "$#" -ge 2 ] || usage_error '--variant needs a value'
      variant="$2"
      shift 2
      ;;
    --index)
      [ "$#" -ge 2 ] || usage_error '--index needs a value'
      index_path="$2"
      index_given=1
      shift 2
      ;;
    --model)
      [ "$#" -ge 2 ] || usage_error '--model needs a value'
      model="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      usage_error "unknown option '$1'"
      ;;
    *)
      break
      ;;
  esac
done

case "$variant" in
  index | search) ;;
  *) usage_error "--variant must be 'index' or 'search', got '$variant'" ;;
esac
if [ "$variant" = 'search' ] && [ "$index_given" -eq 1 ]; then
  usage_error '--index is refused with --variant search, which names no index'
fi
if [ "$#" -ne 3 ]; then
  usage_error "expected 3 arguments, got $#"
fi

corpus_root="$1"
query_set="$2"
out_path="$3"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$variant" = 'index' ]; then
  task_file="$script_dir/agent-task.md"
  expected_index_tokens=1
else
  task_file="$script_dir/agent-task-search.md"
  expected_index_tokens=0
fi

for required in "$task_file" "$query_set"; do
  if [ ! -r "$required" ]; then
    echo "run-arm-a.sh: cannot read '$required'" >&2
    exit 66
  fi
done
if [ ! -d "$corpus_root" ]; then
  echo "run-arm-a.sh: '$corpus_root' is not a directory" >&2
  exit 66
fi

task_text="$(cat "$task_file")"

# Occurrences, not matching lines: two tokens on one line are two.
count_token() {
  local stripped="${task_text//"$1"/}"
  echo $(( (${#task_text} - ${#stripped}) / ${#1} ))
}
query_tokens="$(count_token '{{query}}')"
index_tokens="$(count_token '{{index}}')"
if [ "$query_tokens" -ne 1 ]; then
  echo "run-arm-a.sh: '$task_file' holds $query_tokens {{query}} tokens, expected 1" >&2
  exit 65
fi
if [ "$index_tokens" -ne "$expected_index_tokens" ]; then
  echo "run-arm-a.sh: '$task_file' holds $index_tokens {{index}} tokens, expected $expected_index_tokens" >&2
  exit 65
fi

if [ "$variant" = 'index' ] && [ ! -f "$corpus_root/$index_path" ]; then
  echo "run-arm-a.sh: the index '$index_path' does not exist under '$corpus_root'" >&2
  exit 66
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "run-arm-a.sh: jq is not on PATH" >&2
  exit 69
fi
if ! command -v "$AGENT_CLI" >/dev/null 2>&1; then
  echo "run-arm-a.sh: '$AGENT_CLI' is not on PATH (set HARNESS_AGENT_CLI to name it)" >&2
  exit 69
fi

corpus_root="$(cd "$corpus_root" && pwd -P)"

# `{{index}}` is substituted once, before the loop, so the query — substituted
# last — can never introduce a token that is then read as one.
task_text="${task_text//\{\{index\}\}/$index_path}"

model_args=()
if [ -n "$model" ]; then
  model_args=(--model "$model")
fi

# The output path is resolved BEFORE the agent's working directory changes, so a
# relative argument means what the operator typed it against.
out_dir="$(cd "$(dirname "$out_path")" && pwd -P)"
out_path="$out_dir/$(basename "$out_path")"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  id="$(printf '%s' "$line" | jq -r '.id')"
  query="$(printf '%s' "$line" | jq -r '.query')"

  # In bash's own replacement, so no query text is read as a pattern.
  prompt="${task_text//\{\{query\}\}/$query}"

  echo "run-arm-a.sh: $variant $id" >&2
  started="$(date +%s)"
  # The working directory is the corpus root, so every `ref` the agent writes is
  # relative to it — the same string `SearchHit.ref` renders for the other arms.
  # Its stdin is `/dev/null`: the loop's stdin is the query set, and a print-mode
  # invocation that drained it would eat every query after this one.
  stream="$(cd "$corpus_root" && "$AGENT_CLI" -p "$prompt" \
    --output-format stream-json --verbose \
    --allowed-tools "$ALLOWED_TOOLS" \
    --disallowed-tools "$DISALLOWED_TOOLS" \
    --strict-mcp-config \
    ${model_args[@]+"${model_args[@]}"} </dev/null)"
  elapsed_ms=$(( ( $(date +%s) - started ) * 1000 ))

  # One pass over the stream: the last `result` event, and the `tool_use` names
  # of every `assistant` event. Tool inputs are dropped here.
  summary="$(printf '%s\n' "$stream" | jq -s -c '
    {
      result: ((map(select(.type == "result")) | .[-1]) // {}),
      toolCalls: (
        [ .[] | select(.type == "assistant") | (.message.content // [])[]?
          | objects | select(.type == "tool_use") | .name ]
        | reduce .[] as $name ({}; .[$name] += 1)
      )
    }')"

  answer="$(printf '%s' "$summary" | jq -r '.result.result // ""')"
  usage="$(printf '%s' "$summary" | jq -c '.result.usage // null')"
  tool_calls="$(printf '%s' "$summary" | jq -c '.toolCalls')"
  refs="$(printf '%s' "$answer" | jq -R -s 'split("\n") | map(sub("^\\s+";"") | sub("\\s+$";"")) | map(select(. != ""))')"

  printf '%s\n' "$line" |
    jq -c --arg id "$id" \
      --argjson refs "$refs" \
      --argjson durationMs "$elapsed_ms" \
      --argjson usage "$usage" \
      --arg variant "$variant" \
      --argjson toolCalls "$tool_calls" \
      '{id: $id, query: .query, refs: $refs, durationMs: $durationMs, usage: $usage, variant: $variant, toolCalls: $toolCalls}' \
      >>"$out_path"
done <"$query_set"

echo "run-arm-a.sh: wrote $out_path" >&2
