#!/usr/bin/env bash
# run-arm-a.sh — drive arm A of the docs-retrieval eval: index-first navigation
# by a headless agent, one invocation per query, into a transcript
# `evals/docs-retrieval/arm-a/score-transcript.mjs` scores.
#
# HAND-RUN ONLY, AND NOT RUN ON THE BRANCH THAT ADDED IT. Arm A needs a nested
# agent subprocess. The unattended permission profile carries no grant for the
# agent binary, and per that profile's own `_README` a tool call matching neither
# `allow` nor `deny` STALLS in print mode rather than prompting — so an
# unattended attempt hangs the run instead of reporting a refusal. The
# `scripts/scratch-run.sh` route to the same subprocess is technically open and
# is declined on purpose: it would put an unsupervised nested agent session, with
# its own auth and no token cap, inside an unattended run to take a measurement.
# So this file is run by an operator at a terminal and by nobody else. Do not add
# an agent grant to the profile and do not route this arm through
# `scratch-run.sh`.
#
# ONE STRUCTURAL PROPERTY KEEPS THAT HONEST AND IS WORTH KEEPING. This file sits
# OUTSIDE the configured `scriptsDir`, and the script-allowlist guard issues its
# automatic permit only for a command whose every `.sh` token resolves under that
# directory. So an agent invoking this file obtains no automatic permit and falls
# through to the permission system; the guard emits `allow` or nothing, so what
# that buys is the absence of a permit rather than a refusal. The prohibition
# above is what does the real work.
#
# THE FLAG SPELLINGS HERE HAVE NEVER BEEN EXERCISED BY THIS SCRIPT, because
# nothing has run it. They are the documented print-mode surface; confirm them
# against the agent CLI's own `--help` before the first run, and see
# `docs/retrieval-eval.md` for the procedure this file is the mechanism of.
#
# THE AGENT BINARY IS REACHED THROUGH `${HARNESS_AGENT_CLI:-claude}`, the one
# indirection `ARCHITECTURE.md` §4 records as the place the engine binary is
# chosen; §5 inventories its read sites.
#
# WHAT IT WRITES. One JSON object per line, appended to the output path as each
# query finishes, so a run interrupted at query seven keeps six records:
#
#   {"id":…,"query":…,"refs":[…],"durationMs":…,"usage":{…}}
#
# `refs` is the agent's answer split into lines, in the order it gave them, with
# nothing repaired — the single token `none` included, which is its abstention.
# `usage` is the result object's own usage block, verbatim. `durationMs` has
# WHOLE-SECOND resolution: the `bash` floor in this tree is 3.2 and BSD `date`
# has no sub-second format, and an agent turn is measured in seconds.
#
# Usage: run-arm-a.sh <corpus-root> <query-set.jsonl> <out.jsonl>
#   <corpus-root>  the directory holding the catalog's `docs/`; the agent's
#                  working directory, and what every `ref` is relative to
#   <query-set>    a labelled query set (`evals/docs-retrieval/queries/`)
#   <out>          the transcript to append to; created if absent
#
# Requires `jq` 1.5 or newer, the floor `plugin/hooks/README.md` already sets.
#
# REPRO — what to check before spending tokens, none of which invokes the agent:
#
#   the task text     grep -c '{{query}}' evals/docs-retrieval/arm-a/agent-task.md   -> 1
#   the query set     jq -r .id evals/docs-retrieval/queries/fixture-catalog.jsonl
#   the corpus root   ls evals/docs-retrieval/corpora/fixture-catalog/docs/INDEX.md
#   the scorer        bash scripts/scratch-run.sh <a launcher calling scoreTranscript
#                     on evals/docs-retrieval/arm-a/sample-transcript.json>
#
#   Then the run itself, from the repository root, by hand:
#     bash evals/docs-retrieval/arm-a/run-arm-a.sh \
#       evals/docs-retrieval/corpora/fixture-catalog \
#       evals/docs-retrieval/queries/fixture-catalog.jsonl \
#       /tmp/arm-a-fixture-catalog.jsonl
#
#   and publication, which is the eval's own writer and never a hand edit:
#     bash scripts/run-gates.sh   # or the eval invoked with --out and --transcript

set -euo pipefail

AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"

# The read-only tool set. `Read`, `Grep` and `Glob` are what navigating a catalog
# needs; granting no `Bash`, no `Write`, no `Edit` and no web tool is what keeps
# the run inside the corpus and off the network. Both lists are passed, because
# an allow list that a future default widens is not on its own a fence.
ALLOWED_TOOLS='Read Grep Glob'
DISALLOWED_TOOLS='Bash Write Edit MultiEdit NotebookEdit WebFetch WebSearch'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
task_file="$script_dir/agent-task.md"

if [ "$#" -ne 3 ]; then
  echo "run-arm-a.sh: expected 3 arguments, got $#" >&2
  echo "  usage: run-arm-a.sh <corpus-root> <query-set.jsonl> <out.jsonl>" >&2
  exit 64
fi

corpus_root="$1"
query_set="$2"
out_path="$3"

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
if ! command -v jq >/dev/null 2>&1; then
  echo "run-arm-a.sh: jq is not on PATH" >&2
  exit 69
fi
if ! command -v "$AGENT_CLI" >/dev/null 2>&1; then
  echo "run-arm-a.sh: '$AGENT_CLI' is not on PATH (set HARNESS_AGENT_CLI to name it)" >&2
  exit 69
fi

corpus_root="$(cd "$corpus_root" && pwd -P)"
task_text="$(cat "$task_file")"

# The output path is resolved BEFORE the agent's working directory changes, so a
# relative argument means what the operator typed it against.
out_dir="$(cd "$(dirname "$out_path")" && pwd -P)"
out_path="$out_dir/$(basename "$out_path")"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  id="$(printf '%s' "$line" | jq -r '.id')"
  query="$(printf '%s' "$line" | jq -r '.query')"

  # The one substitution, in bash's own replacement so no query text is read as
  # a pattern. `agent-task.md` states that `{{query}}` is its only token.
  prompt="${task_text//\{\{query\}\}/$query}"

  echo "run-arm-a.sh: $id" >&2
  started="$(date +%s)"
  # The working directory is the corpus root, so every `ref` the agent writes is
  # relative to it — the same string `SearchHit.ref` renders for the other arms.
  # Its stdin is `/dev/null`: the loop's stdin is the query set, and a print-mode
  # invocation that drained it would eat every query after this one.
  answer_json="$(cd "$corpus_root" && "$AGENT_CLI" -p "$prompt" \
    --output-format json \
    --allowed-tools "$ALLOWED_TOOLS" \
    --disallowed-tools "$DISALLOWED_TOOLS" </dev/null)"
  elapsed_ms=$(( ( $(date +%s) - started ) * 1000 ))

  answer="$(printf '%s' "$answer_json" | jq -r '.result // ""')"
  usage="$(printf '%s' "$answer_json" | jq -c '.usage // null')"
  refs="$(printf '%s' "$answer" | jq -R -s 'split("\n") | map(sub("^\\s+";"") | sub("\\s+$";"")) | map(select(. != ""))')"

  printf '%s\n' "$line" |
    jq -c --arg id "$id" \
      --argjson refs "$refs" \
      --argjson durationMs "$elapsed_ms" \
      --argjson usage "$usage" \
      '{id: $id, query: .query, refs: $refs, durationMs: $durationMs, usage: $usage}' \
      >>"$out_path"
done <"$query_set"

echo "run-arm-a.sh: wrote $out_path" >&2
