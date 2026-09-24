### Task 1 — Declare the task-plan-writing flow graph beside the walker

**Goal:** Write the planning loop's routing as data: `cli/templates/scripts/flows/task_plan_writing.graph.json`, the one graph this pilot declares. It covers the task-plan loop, the UI-test-plan loop and convergence, as `plugin/instructions/task_plan_writing_instructions_core.md` states them at the base of this branch. It changes none of that routing.

**Where this task stops.** This task writes the graph file and nothing that reads it. The walker that walks it is **Task 4**, the table row that ships it to an adopter is **Task 5**, and the JSON schema that formalises this format is **Task 12**. The dispatch blocks (the `key: value` lines each agent receives) are **not** in the graph: they stay in the core, which **Task 9** rewrites. The graph holds the routing and the values the walker has to resolve. Say so in the file's own `description` field.

### Targets

- `cli/templates/scripts/flows/task_plan_writing.graph.json` (new). The directory is new too, and it sits under the `scripts/` template home (`.claude/context/cli.md` → *One template subdirectory per adopter-side home*).

**The format this file is written in.** This is the contract that Tasks 3, 4, 12 and 13 consume. Each of them restates the part it uses.

- Top level: `formatVersion` (integer `1`), `flow` (`"task_plan_writing"`, equal to the file stem), `description`, `start` (the node id a fresh walk begins at), `entries` (the node ids `start --entry` may name), `counters`, `paths`, `reports`, `nodes`. There is no `$schema` key: the file is copied into an adopter's `scriptsDir`, where a relative schema pointer resolves to nothing.
- `counters`: `{ "iteration": { "cap": 5 } }`. Every counter starts at 0 on `start`.
- `paths`: the templates the escalation payload names, `{ "story_index": "{state_dir}/story_plans/{branch}_story_plan.md", "ui_test_index": "{state_dir}/ui_test_plans/{branch}_ui_test_plan.md" }`. The placeholders are `{state_dir}` and `{branch}` only.
- `reports`: the ordered keys a terminal binding prints: `["business_parity_review", "architecture_review", "plan_review", "ui_test"]`.
- A **dispatch node** has `kind: "dispatch"`, `agent`, `heartbeat` (a template carrying `{iteration}`), optional `prompts` (the writer nodes: `["initial", "revision"]`), optional `findingsFolder` (the reviewer nodes: a `{state_dir}` / `{branch}` template ending in `/`), an optional ordered `skip` array, and `outcomes`.
- A **terminal node** has `kind: "terminal"` and `binding` (`"<terminal_handoff>"`).
- **The two skip semantics are two constructs, and they are never one construct with a flag.** `{ "construct": "skipped", "phase": "<parity|qa|docs>", "to": "<node>", "report": { … } }` is gated on a `harness.config.json` `phases.*` flag being `false`. It records **no pass**. `{ "construct": "passedByExclusion", "runModeId": "<parity|architecture|qa|docs>", "to": "<node>", "report": { … } }` is gated on a run-mode skipped id. It falls through exactly as a PASS does, and it is disclosed. The array is evaluated **in order**, and the first entry that applies wins.
- **Outcome vocabulary:** `returned` (a writer's normal return), `PASS`, `FAIL`, `questions`, `no_ui`, `error`, `blocker`. A node declares only the outcomes its agent can return.
- **An ordinary edge** is `{ "to": "<node>", "increment"?: "<counter>", "reset"?: "<counter>", "prompt"?: "<variant>", "ledger"?: "<id>", "report"?: { "<report key>": "<value>" }, "onCap"?: <binding edge> }`. `onCap` is required when `increment` is present. It is taken instead of `to` when the incremented counter is `>= cap`.
- **A binding edge** is `{ "binding": "<ask>" | "<escalate>", … }`. An `<ask>` edge carries `resume` (the node re-dispatched once an answer comes back). An `<escalate>` edge carries `reason` (`cap`, `error` or `blocker`). A cap escalation also carries `summary` (a sentence carrying `{cap}`), optional `roundCounts` (the ordered node ids whose `findingsFolder` rounds are counted) and optional `evidence` (a `paths` key).

**Work:**

- [ ] Write the task-plan loop nodes `plan_writer` → `business_parity_review` → `architecture_review` → `plan_review`. They are the core's `## Loop` steps 1–5.
  - `plan_writer`: `returned` → `business_parity_review`; `questions` → `<ask>` resuming `plan_writer`; `error` / `blocker` → `<escalate>`.
  - Each reviewer: `PASS` → the next gate, reporting its own key `passed`. `FAIL` → `plan_writer` with `increment: "iteration"` and `prompt: "revision"`, and an `onCap` `<escalate>` whose `summary` is the core's own sentence: `the plan loop reached its {cap}-revision cap; the <business-parity|architecture|plan-review> gate was open when it fired`. It also carries `roundCounts: ["business_parity_review", "architecture_review", "plan_review"]` and `evidence: "story_index"`. `error` / `blocker` → `<escalate>`.
  - `plan_review` `PASS` → `ui_writer`, with `reset: "iteration"` and `ledger: "P1"`.
- [ ] Declare the two plan-gate skips in the core's **textual order**.
  - `business_parity_review` gets `skip: [passedByExclusion runModeId "parity", then skipped phase "parity"]`. Both go to `architecture_review` and report `passed-by-exclusion` / `skipped`. The order is the core's: step 2's run-mode gate reads *"Before anything else in this step"*, so it comes before the `phases.parity` sentence.
  - `architecture_review` gets `skip: [passedByExclusion runModeId "architecture"]`, going to `plan_review`. The configuration schema declares no architecture flag (`plugin/instructions/autonomous_pause_and_ledger.md` §1.3 item 2), so this gate has no `skipped` construct.
- [ ] Write the UI-test loop nodes `ui_writer` → `ui_review`, and the terminal `convergence` (`binding: "<terminal_handoff>"`).
  - `ui_writer` gets `skip: [skipped phase "qa" → convergence, report ui_test "qa-phase-off"; then passedByExclusion runModeId "qa" → convergence, report ui_test "run-mode-skipped"]`. The config check comes first because the core's loop-level *"Skip this loop unless `phases.qa` is `true`"* precedes its step-1 run-mode gate.
  - `ui_writer` outcomes: `returned` → `ui_review`; `no_ui` → `convergence` with `ledger: "P2"` and report ui_test `no_ui`; `questions` → `<ask>` resuming `ui_writer`; `error` / `blocker` → `<escalate>`.
  - `ui_review` outcomes: `PASS` → `convergence` with `ledger: "P2"` and report ui_test `passed`. `FAIL` → `ui_writer` with the `revision` prompt and an `onCap` whose summary is `{cap} UI-test-plan-review iterations did not converge`, with `evidence: "ui_test_index"` and **no** `roundCounts`: the core's UI step 3 names none.
- [ ] Copy the six heartbeat templates from the core **verbatim**, with `{iteration}` where the core writes `<i>`:
  - `[plan-write · iter {iteration}] → task-plan-writer`
  - `[plan-write · parity · iter {iteration}] → business-parity-reviewer`
  - `[plan-write · arch · iter {iteration}] → architecture-reviewer`
  - `[plan-write · iter {iteration}] → task-plan-reviewer` (the Safety contract's generic form, because step 4 names none of its own)
  - `[ui-test-write · iter {iteration}] → ui-tests-plan-writer`
  - `[ui-test-write · iter {iteration}] → ui-tests-plan-reviewer`

  Then copy the four `findingsFolder` templates from the core's `## Setup` step 2 table, with `<state_dir>` / `<branch>` written as `{state_dir}` / `{branch}`: `task_plan_reviews`, `business_parity_reviews`, `architecture_reviews`, `ui_test_plan_reviews`.
- [ ] Set `entries: ["plan_writer", "ui_writer", "convergence"]`. These are the three re-entry points the core's `## Setup` step 5 outcomes and the autonomous fork's resume-from-ledger can land on. Set `start: "plan_writer"`.

**Verification:**

- `jq -e . cli/templates/scripts/flows/task_plan_writing.graph.json` exits 0. The file carries no `$schema` key, no `{{` token (it is copied verbatim, never rendered) and no adopter value (`.claude/context/conventions.md` → `## Configuration is the source of truth`).
- Every heartbeat, summary sentence and findings-folder template is a byte-for-byte substring of the base-commit core once `{iteration}` / `{cap}` / `{state_dir}` / `{branch}` are read back as `<i>` / `5` / `<state_dir>` / `<branch>`. Check each by `grep -F` against `git show <merge-base>:plugin/instructions/task_plan_writing_instructions_core.md`. The expected sequences in Tasks 6 and 7 come from that same text, so a paraphrase here fails there.
- The skip orders match the core's textual order for both loops, as argued above.

**Deviations from plan:** The substring check passes for 12 of the 14 templates. It fails for 2: the `plan_writer` and `plan_review` heartbeats (`[plan-write · iter {iteration}] → task-plan-writer` / `→ task-plan-reviewer`). The base core never writes either one out. Both come from the Safety contract's generic `[plan-write · iter <i>] → <agent_name>`, with the agent name filled in, which is what this plan specifies. So those two rest on the generic form being a substring (it is, `## Safety contract` step 3), and there is no verbatim match to check them against. Implemented as the plan specifies. **Task 12**'s schema validates this file, and **Task 13**'s checker runs its seven static checks over it, one of which (`cap-matches-core`) requires this file's `counters.iteration.cap` to equal the cap the core's `## Setup` step 4 and `## Safety contract` step 2 still state.
