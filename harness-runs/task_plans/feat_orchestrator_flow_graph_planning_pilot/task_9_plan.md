### Task 9 — Rewrite the planning core around the walker

**Goal:** `plugin/instructions/task_plan_writing_instructions_core.md` stops stating the loop's routing in prose. In place of `## Loop`, `## UI-test-plan write loop` and the routing parts of `## Convergence` and `## Stop conditions`, it says: *call the walker, do what it prints, pass back the outcome*. Every rule that is not routing stays in prose, next to the node it governs:

- path-only discipline;
- the `## Questions` verbatim rule;
- the writer's `## Parity exclusions / deferrals` return;
- the dispatch discipline;
- the no-`mkdir -p` notes;
- the two disclosure lines;
- `## What you must NOT do`.

**Depends on:** Task 4 and Task 5. **Task 4** defines the walker's interface, restated here so this file stands alone:

- `bash <scripts_dir>/flow-walker.sh start --flow task_plan_writing --branch <branch> [--entry <plan_writer|ui_writer|convergence>] [--skipped <ids|none>]`
- `… next --flow task_plan_writing --branch <branch> --outcome <returned|PASS|FAIL|questions|no_ui|error|blocker|answered> [--findings <path>] [--skipped <ids|none>]`
- `… current --flow task_plan_writing --branch <branch>`

It prints either `action: dispatch` with `node:`, `agent:`, `prompt:`, `arg.iteration:`, `arg.findings_file:`, `skip:` / `ledger:` lines and `heartbeat: … (#<total_dispatches>)`; or `action: binding` with `binding: <ask|escalate|terminal_handoff>`, `node:`, then `agent:` / `resume:`, or `agent:` / `reason:` / `findings_file:` / `rounds:` / `evidence:` / `evidence.open:` / `summary:`, or `report: <key> <value>` lines. It refuses with exit 1 and a `flow-walker:` line. **Task 5** ships the walker into `<scripts_dir>` and grants it in the unattended profile.

**Where this task stops.** It edits the core only. The two forks that bind this core are **Task 10**'s. The commands and the flow overview that cite it are **Task 11**'s. The measured before/after size is recorded in `docs/` by **Task 16**, and this task measures the *after* only. Nothing in the dispatch blocks changes: their key names, order and wording are wire strings the six planning agents' `## Invocation contract` sections quote.

### Targets

- `plugin/instructions/task_plan_writing_instructions_core.md`

**Anchors that must survive byte-identical**, because the scope register's derivations reach citers of each of them:

- `## Setup (once per session)`, with steps 1–6 keeping their numbers: step 2 is cited by `plugin/instructions/plan_orchestration_instructions_autonomous.md` and `evals/plan-shape/scaffold.sh`, and step 4 by `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`;
- `## Safety contract — applies before EVERY Agent dispatch`;
- `## Loop`, with `### 1. Spawn \`task-plan-writer\``, `### 2. Business-parity review (plan-review mode)`, `### 3. Architecture review (plan-review mode)`, `### 4. Spawn \`task-plan-reviewer\`` and `### 5. Parse the reviewer's return`;
- `## UI-test-plan write loop`, with `### 1. Spawn \`ui-tests-plan-writer\``, `### 2. Spawn \`ui-tests-plan-reviewer\`` and `### 3. Parse the reviewer's return`;
- `## Convergence`, `## Stop conditions` and `## What you must NOT do`.

**Work:**

- [ ] **`## Resolved values`, `## Mode contract` and `## Setup`.**
  - Add a `<scripts_dir>` row (config value, `scriptsDir`) to the `## Resolved values` table.
  - In the `## Mode contract — bindings this file uses` table, keep the five bindings and reword the `Used at` cells to name the walker's `action: binding` lines. Keep the node sections as the sites, `## Loop` steps 1, 2, 3, 5 and `## UI-test-plan write loop` steps 1 and 3, so the forks' `Used at` / binding-row citations stay true. In the `<escalate>` row, change *"`## Stop conditions` entries 4–7"* to *"`## Stop conditions` entries 4–5"*, the range the collapse below leaves (see the `## Stop conditions` bullet). The `<ask>` row's *"`## Stop conditions` entry 3"* stays as written, because entry 3 is unchanged.
  - Append `## Setup` step **7** (never renumber steps 1–6): *start the walker*. Proceed fresh and extend give `--entry plan_writer`. Skip gives `--entry ui_writer`, or `--entry convergence` when the UI loop is also done or not run. This keeps the mode-free outcome-to-entry mapping for the `<existing_artifact_decision>` outcome of step 5, and for a fork's own resume rule that skips a loop.
  - Keep step 4's `.dispatch_counter` reset and `MAX_TOTAL_DISPATCHES = 40` sizing sentence unchanged. After this branch the iteration cap's **owner** is the graph's `counters.iteration.cap` (Task 1). Step 4's `iteration >= 5` / `caps at 5 revisions` phrases and the `## Safety contract` step 2 halt message's `5-revision caps` phrase are retained **descriptions** of that cap, never a second home. They stay byte-identical because step 4 is cited from `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` and the task prompt freezes the halt messages. **Task 13**'s `cap-matches-core` check holds them in agreement with the graph, extracting the integers from exactly those two anchors. So do not reword either phrase: a rewording that drops the integer fails that check on an empty extraction.
- [ ] **A new `## The walker — routing is its, judgement is yours` section**, placed before `## Safety contract`. It carries:
  - the three invocation forms, each spelled as one literal command free of `$(`, backticks, `|`, `<`, `>` and non-`${IDENT}` braces;
  - how to map an agent's return to `--outcome`:
    - a writer's `story_file` / `ui_test_index` return → `returned`;
    - `## Questions` → `questions`;
    - `verdict: PASS` / `verdict: FAIL` (with the reviewer's `findings_file:` as `--findings`);
    - `no_ui: true` → `no_ui`;
    - `error:` → `error`; `blocker:` → `blocker`;
  - the rule that `--skipped` is passed only when no flow-progress ledger exists, re-read at each call by the bounded extraction `plugin/instructions/run_mode_instructions.md` → `## The section contract` defines (the walker reads the ledger itself when one exists);
  - how to act on each `action:`;
  - that a non-zero exit is a blocker routed through `<escalate>` with the walker's `flow-walker:` line, including the case where the script is absent from an adoption that has not re-run `init`;
  - that an API-overloaded dispatch is not an outcome and is re-issued with `current`.

  State the split in one sentence: **the walker owns the next node, the counters, the cap and what escalates; the orchestrator owns dispatching, passing the verdict back, applying the bindings and composing prompts under the dispatch discipline, `context_notes:` included.**
- [ ] **`## Safety contract`.** Steps 1 (STOP), 2 (counter, with the *"two separate, plain commands exactly as written"* rule) and 4 (compose the prompt) stay verbatim. Step 3's heartbeat becomes *print the walker's `heartbeat:` value with `<total_dispatches>` replaced by the count step 2 persisted*. The per-agent heartbeat formats move to the graph, and step 3's example line is kept as an illustration. Add one sentence: a gate the walker skips never reaches this contract, because the walker prints no dispatch for it, which preserves *"make no dispatch, increment no counter, print no heartbeat"*.
- [ ] **`## Loop` and `## UI-test-plan write loop`.** Replace each preamble's counter, cap and `iteration:`-resolution prose with a pointer to the walker. Keep one sentence noting that `arg.iteration` is the per-folder next free index and not the loop counter. Each node section keeps its heading, its dispatch block verbatim (with `iteration: <iteration>` now filled from `arg.iteration:` and `<findings_file>` from `arg.findings_file:`) and its non-routing rules:
  - the writer's returned fields and its parity-section note;
  - the `## Questions` verbatim route and the do-not-invent rule;
  - the no-`mkdir -p` notes;
  - business parity's *"catch a deviation … before any code is written"* rationale;
  - the UI reviewer's validation list;
  - the `no_ui` and run-mode distinctness rule.

  Delete what the walker now owns:
  - every *"fall through to step N"*;
  - every *"increment `iteration`. If `>= 5`"*;
  - the gate-skip mechanics;
  - the loop-back sentences.

  Steps `### 5.` and UI `### 3.` shrink to: pass the verdict to the walker, and act on what it prints (including a `ledger:` line, which is the fork's to act on and a no-op where no ledger is kept). Where an `<escalate>` carries `evidence:` lines, keep the prose duty to also name the `## Scope register` rows **in dispute**. That is a judgement, so it stays here.
- [ ] **`## Convergence`, `## Stop conditions` and `## What you must NOT do`.**
  - `## Convergence`: replace the two-bullet convergence condition with *the walker printed `binding: <terminal_handoff>`*. Map its `report:` lines onto the existing fact list: `business_parity_review passed-by-exclusion` means disclosed, `skipped` means *reports none*, and `ui_test <passed|no_ui|qa-phase-off|run-mode-skipped>` selects exactly one of the four UI-test variants. Keep the dispatch-additions record step, the fact list and both `📌` disclosure lines verbatim.
  - `## Stop conditions`: keep the STOP and dispatch-cap entries verbatim, still plain report plus stop and never `<escalate>`. Collapse the three `iteration >= 5` entries (today's entries 4, 5 and 6) into one entry, *the walker printed `binding: <escalate>`*. Keep `## Questions` → `<ask>` and the `error:` / `blocker:` → `<escalate>` entry verbatim. The section then has **five** entries, in this order: 1 STOP file, 2 `MAX_TOTAL_DISPATCHES`, 3 `## Questions` → `<ask>`, 4 the walker's `binding: <escalate>`, 5 `error:` / `blocker:` → `<escalate>`. So the `<escalate>` entries are **4–5**, which is what the Mode-contract `<escalate>` cell above now cites and what **Task 10** writes into the autonomous fork's `<escalate>` row. Entries 1, 2 and 3 keep their numbers, so the autonomous fork's *"`## Stop conditions` entries 1 and 2"* and its `<ask>` row's *"`## Stop conditions` entry 3"* stay true. (`git grep -n "Stop conditions\` entr" -- plugin cli` finds no other citer of this core's entry numbers: the hits in `plan_orchestration_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md` cite other cores.)
  - `## What you must NOT do`: add three prohibitions: never choose the next step from anything but the walker's output; never edit `<state_dir>/.flow_walker_state`; never call `next` for a dispatch that did not return.

**Verification:**

- Measure the rewritten core with `wc -c plugin/instructions/task_plan_writing_instructions_core.md`, and record the figure and the exact output in this task's `**Deviations from plan:**` note if one is appended; otherwise **Task 16** re-runs it. The base is 38036 bytes, read from `wc -c` at this branch's planning.
- The routing prose is gone. `grep -nE 'iteration >= 5|fall through to step|loop back to' plugin/instructions/task_plan_writing_instructions_core.md` finds no hit outside three exempt places: the new walker section's own statement of what the walker owns, `## Setup` step 4's sizing sentence, and `## Safety contract` step 2's halt message. The last two are the retained descriptions of the graph's cap named above.
- The retained cap descriptions are intact and agree with the graph: `grep -nE 'caps at [0-9]+ revisions|[0-9]+-revision caps' plugin/instructions/task_plan_writing_instructions_core.md` hits step 4's line and the step 2 halt message, each carrying the same integer as `jq '.counters.iteration.cap' cli/templates/scripts/flows/task_plan_writing.graph.json`. (Task 13's `cap-matches-core` automates this later; this task does not depend on it.)
- The `## Stop conditions` entry range agrees with the cells that cite it. `awk '/^## Stop conditions/{f=1;next} /^## /{f=0} f && /^- /{n++} END{print n}' plugin/instructions/task_plan_writing_instructions_core.md` prints the section's entry count. `grep -n 'Stop conditions` entries' plugin/instructions/task_plan_writing_instructions_core.md` shows the Mode-contract `<escalate>` cell citing a range whose upper bound equals that count, and whose two entries are the ones reading `binding: <escalate>` and `error:` / `blocker:`. The `<ask>` cell's entry 3 is the `## Questions` entry. No cell cites an entry number above the count.
- The anchors survived. For each heading listed under **Anchors that must survive byte-identical**, `grep -nF` finds it. Re-run `grep -rn "task_plan_writing_instructions_core" plugin cli/templates` and check that every heading any hit names still exists.
- The non-routing rules survived. `grep -nF` finds each of: `Do not invent answers`, `do NOT \`mkdir -p\``, `## Parity exclusions / deferrals`, `Path-only`, `📌 Dispatch additions`, `📌 Run mode`, `Halted by STOP file`, and `Halted: exceeded MAX_TOTAL_DISPATCHES`.
- End to end: in a throwaway fixture wired by `init` (Task 5), follow the new `## The walker` section literally for a PASS-everywhere planning pass with stub returns. The commands issued are exactly the literal forms, and the resulting action sequence matches Task 6's case (1).
