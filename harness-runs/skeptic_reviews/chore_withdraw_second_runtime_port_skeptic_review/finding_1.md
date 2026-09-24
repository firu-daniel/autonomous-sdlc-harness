### 1. The per-phase cost totals leave out the session in which each run's planning loop converged

**File:** `docs/second-runtime-port-decision.md` (`## 4. Cost: the port moves billing onto the API and saves nothing`, the paragraph opening **One planning phase on Opus comes to roughly $30–80.**): "A phase is the sum of one run's planning-only sessions: 28.65, 41.66, 49.03 (28.18 + 20.85) and 78.59 (3.91 + 38.91 + 35.77)."

**Problem.** The record presents each run's sum of planning-only sessions as the cost of *one planning phase*. In all four runs, though, the planning loop did not finish inside those sessions. Its last writer and reviewer rounds ran in the next session, which went on to dispatch `layer-implementer`. The record's own selector drops any session that dispatched a non-planning agent, so those final rounds are in none of the four sums. Each "phase" figure is therefore a lower bound, but the paragraph states it as the phase's cost. A reader who reopens the port and uses these figures to estimate what a planning phase would cost on API billing gets a number that is too low. The error runs in the direction that favours the withdrawal, so the decision itself stands.

**Proof.** The dispatch order per session was read with `jq -r 'select(.type=="assistant") | .session_id[0:8] as $s | .message.content[]? | select(.type=="tool_use" and .input.subagent_type?) | "\($s) \(.input.subagent_type)"' harness-runs/autonomous_logs/<run>.stream.jsonl | uniq -c`. Costs are each session's `result` envelope's `total_cost_usd`. Read on 2026-09-24:

- `feat_docs_retrieval_eval`: the planning-only sessions `7debe33b` (28.18) and `14862e29` (20.85) are followed by `72ce7b5f` (26.34). That session dispatches `task-plan-writer`, `task-plan-reviewer`, `task-plan-writer` and `task-plan-reviewer`, and only then its first `layer-implementer`.
- `feat_arm_a_real_catalog_measurement`: `6c940ce8` (28.65) is followed by `65e75b86` (34.04), which dispatches `task-plan-writer`, `architecture-reviewer` and `task-plan-reviewer` before its first `layer-implementer`.
- `chore_plugin_prefix_command_sweep`: `e3397183` (41.66) is followed by `833dde8c` (68.35), which dispatches `task-plan-writer`, `architecture-reviewer` and `task-plan-reviewer` before its first `layer-implementer`.
- `feat_docs_catalog_retrieval`: `dc92d302` (3.91), `12252f46` (38.91) and `a157ec5c` (35.77) are followed by `460d2d58` (159.72), which opens with a `task-plan-writer` dispatch before its first `layer-implementer`.

A `result` envelope carries one `total_cost_usd` per session, so the planning share of those mixed sessions cannot be split out from the envelope. That is why the fix states a lower bound rather than a corrected figure.

**Fix.** In that paragraph, directly after the sentence "A phase is the sum of one run's planning-only sessions: 28.65, 41.66, 49.03 (28.18 + 20.85) and 78.59 (3.91 + 38.91 + 35.77).", insert the sentence below. Leave every figure, the "$30–80" range, the table and the command unchanged.

```markdown
Each sum is a lower bound: in all four runs the planning loop's last dispatches ran in the next session, which went on to dispatch `layer-implementer`, so the command above drops it, and a `result` envelope carries one cost per session, so its planning share cannot be split out.
```
