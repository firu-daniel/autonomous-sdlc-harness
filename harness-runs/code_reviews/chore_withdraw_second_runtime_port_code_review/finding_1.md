### 1. The cost figures' read command prints every session of a run, not the planning-only ones the table reports

**File:** `docs/second-runtime-port-decision.md` (`## 4. Cost: the port moves billing onto the API and saves nothing`, the paragraph opening **Where every figure comes from.**): "The figures were read on 2026-09-24, one session log at a time, with:" and the fenced `jq -c 'select(.type=="result") | .total_cost_usd' …` command under it.

**Problem.** `.claude/context/conventions.md` → `## Documents of record` says *"A measured fact states what was measured, the command and the exact message"*. The command this paragraph gives does not reproduce the figures in the table:

- **The log is per run, not per session.** `harness-runs/autonomous_logs/<run>.stream.jsonl` is one file per run. It holds a `result` envelope for **every** session of that run. So "one session log at a time" misstates what was read.
- **The command selects no sessions.** Run as written, it prints every session's cost, planning, implementation and review alike. On 2026-09-24 that was ten values for `feat_docs_retrieval_eval` (the record's two, plus 26.34, 121.54 and a 15.66 repeated six times). For `feat_docs_catalog_retrieval` it was seven values, where the record has three.
- **The selection happened in a step the record does not state.** A session was kept only if every agent it dispatched was a planning agent. A reader who re-runs the command cannot tell which of the printed values are the table's, and summing them gives a far larger "planning phase".

Every figure in the table is right. The selector below, run against the local logs, returns exactly the record's figures for each run: 20.85 and 28.18; 28.65; 41.66; 38.91, 35.77 and 3.91. It orders them by session id, not by run order.

**Fix.** In that paragraph, replace the sentence "The figures were read on 2026-09-24, one session log at a time, with:" and its fenced block with the text and block below. Leave the rest of the paragraph and the table unchanged.

````markdown
Each run's log holds one `result` envelope per session. The figures were read on 2026-09-24, one run log at a time. The command keeps a session only when it dispatched at least one agent and every agent it dispatched was a planning writer or reviewer. It then prints that session's `total_cost_usd`:

```
jq -s -c 'group_by(.session_id) | map({cost: ([.[] | select(.type=="result") | .total_cost_usd] | first), agents: ([.[] | select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .input.subagent_type? // empty] | unique)}) | map(select(.cost != null and .agents != [] and all(.agents[]; test("(task-plan|ui-tests-plan)-(writer|reviewer)$|(architecture|business-parity)-reviewer$")))) | map(.cost)' harness-runs/autonomous_logs/<run>.stream.jsonl
```
````

- [ ] Replace the sentence and the fenced command as above.
- [ ] Leave the `**The figures cannot be re-checked from a clone.**` paragraph that follows unchanged.
