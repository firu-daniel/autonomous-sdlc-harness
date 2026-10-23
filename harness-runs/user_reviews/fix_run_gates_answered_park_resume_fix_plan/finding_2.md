### 2. The `<park_answer_lookup>` row in `mode_contract.md` restates rules other files own

**File:** `plugin/instructions/mode_contract.md` (`## Binding vocabulary`, the `<park_answer_lookup>` row) — "Distinct from `<escalate>`, which halts the flow: this binding is read on **re-entry**"

**Problem.** The branch added this row (+208 words to the file). Besides the binding's definition and its "Exists because" justification, which is this table's column format, the row carries two pieces of prose the agent does not act on here:

- "this binding is read on **re-entry**, by the round resolution that decides whether a parked round's answer is still to be acted on". This narrates G.0, which `plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` owns.
- "It names where an answer is found, never what it says: the orchestrator passes the paths on and never opens the files." The core's `### G.2 Write and review the test fix plan` already owns this ("You never open a question or answer file and never act on its content").

This goes against `.claude/context/plugin.md` → `## Writing agent prose` ("Each rule is stated once", "Drop rationale the agent does not act on").

**Fix.** Replace the whole row with the following, which keeps the definition, the `none` value, rule (1) and the rule (4) justification:

```
| `<park_answer_lookup>` | The procedure that yields a Phase G park's complete question/answer pairs for a given `<test_fix_plan_path>` — the command that finds the question files naming that index, plus the rule for when a printed question file has its answer — or the explicit value `none`, for a flow whose `<escalate>` writes no answer file. `none` is a value the fork states, never an absence the core fills in (rule (1)). Read on **re-entry**; unlike `<escalate>`, it never halts the flow. | Every fork over a core that declares it — the cores that run `## Phase G — Run gates`, directly or by reference. Exists because `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` must find an answered park's answer file, and where it sits (`<state_dir>/clarifications/<branch>/…`, written only by the autonomous forks' clarification channel) is a mode-specific path rule (4) bars a core from naming. A flow whose `<escalate>` writes no answer file binds `none`. |
```

Keep the cited anchor `### G.0 Resolve the round` byte-identical. No test quotes this row.
