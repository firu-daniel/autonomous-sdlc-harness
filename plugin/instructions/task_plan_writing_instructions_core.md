# Task-plan writing loop — core (mode-free)

You are the **orchestrator** for the task-plan writing phase. Your job is to dispatch the `task-plan-writer`, `business-parity-reviewer`, `architecture-reviewer`, and `task-plan-reviewer` agents through one or more iterations, then hand the converged plan off. You do NOT draft the plan yourself and you do NOT review it yourself.

Context discipline applies just like in implementation: do not read findings files, do not echo agent output back verbatim. Pass paths between agents and summarize at the end.

> **You were dispatched via a mode fork — read that fork's binding table too.** This file supplies no mode-specific values.

---

## Resolved values

**Three vocabularies of `<…>` name appear in this file, and they resolve from three different places.** Mode-contract **bindings** (`## Mode contract — bindings this file uses`, immediately below) resolve from the binding table of the fork you were dispatched via. Ordinary **path placeholders** (`<branch>`, `<prompt_path>`) resolve from `## Setup` in this file, which is this family's entry core. The tokens in the table below are neither: they resolve from the runtime or from the adopting repository's `harness.config.json`, are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`; when it is `false` this flow's parity gate does not run and neither token is dereferenced. |
| `<layer_names>` | config value | `layers[].name` — the values a readiness entry's `_(layer: …)_` tag carries, which is what `## Setup` step 5 reads back off an existing story index. **No substitution of the names themselves**: the configured names travel through this flow unchanged. `general` is one of the `layers[]` rows a generated config emits (`{ "name": "general", "path": ".", "conventions": … }`), not an entry beside the array. |

---

## Mode contract — bindings this file uses

The names below are Mode-contract **bindings**: this core states behaviour, and the fork you were dispatched via carries the values inline. `mode_contract.md` owns the mechanism and the full vocabulary. **None of these has a default here — an unbound binding is a stop condition** (mechanism rule (1)): halt and report rather than guessing a value.

The `Used at` column is load-bearing, not documentation. All five bindings below are consumed by sections **every** flow over this core executes, so a fork over this core must bind all five.

| Binding | Used at | Meaning (short) |
|---|---|---|
| `<escalate>` | `## Setup` step 2 (task prompt missing); the `iteration >= 5` stops in `## Loop` steps 2, 3 and 5 and in `## UI-test-plan write loop` step 3; `## Stop conditions` entries 4–7 | This flow's path for halting and reporting an **agent/flow blocker**. Never used for a `<state_dir>/STOP` halt or the dispatch-cap halt — see `## Setup` step 3 and `## Safety contract`. |
| `<ask>` | `## Loop` step 1 and `## UI-test-plan write loop` step 1 (a writer returns `## Questions`); `## Stop conditions` entry 3 | This flow's clarification path — what to do when the flow **needs an answer before it can continue**. Distinct from `<escalate>`: an answer can bring the flow back. |
| `<terminal_handoff>` | `## Convergence` | What happens when both loops converge — present-and-stop, or emit-a-summary-and-fall-through. |
| `<existing_artifact_decision>` | `## Setup` step 5 | How this flow decides what to do when a story index already exists on (re-)entry. |
| `<reentry_command>` | `## Setup` step 3 (STOP soft-fail at launch); `## Safety contract` step 1 (pre-dispatch STOP check) | The command named in a halt message ("… re-run X to continue"). |

Every **other** `<…>` name in this file is **not** a binding. `<branch>` and `<prompt_path>` are **path placeholders** and resolve from `## Setup` below; an unresolved one means you arrived here without reading that Setup, and is not a stop condition (`${CLAUDE_PLUGIN_ROOT}/instructions/mode_contract.md` → `### Bindings vs. path placeholders`). The rest are neither kind: `<state_dir>`, `<parity_vocabulary>`, `<reference_impl>` and `<layer_names>` are **config values** declared in `## Resolved values` above, and `<findings_file>`, `<total_dispatches>`, `<agent_name>` and the counters `<i>` / `<iteration>` / `<N>` are bound below, at their point of use.

---

## Setup (once per session)

1. **Determine branch:** `git branch --show-current` → `<branch>`.
2. **Paths.** Every path this flow reads or writes:

   | Artifact | Path |
   |---|---|
   | Task prompt (`<prompt_path>`) | `<state_dir>/task_prompts/<branch>_task_prompt.md` (must exist; if it is missing, halt and report the blocker via `<escalate>`) |
   | Story index output | `<state_dir>/story_plans/<branch>_story_plan.md` |
   | Per-task files output dir | `<state_dir>/task_plans/<branch>/` (holds one `task_<N>_plan.md` per readiness entry) |
   | Plan-review findings folder | `<state_dir>/task_plan_reviews/<branch>/` |
   | Business-parity-review findings folder | `<state_dir>/business_parity_reviews/<branch>/` (reached only when `phases.parity` is `true` — see `## Loop` step 2) |
   | Architecture-review findings folder | `<state_dir>/architecture_reviews/<branch>/` |
   | UI-test plan index output | `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md` (reached only when `phases.qa` is `true` — see `## UI-test-plan write loop`) |
   | UI-test per-test files output dir | `<state_dir>/ui_test_plans/<branch>/` (holds one `ui_test_<N>.md` per readiness entry) |
   | UI-test plan-review findings folder | `<state_dir>/ui_test_plan_reviews/<branch>/` |

3. **STOP file soft-fail at launch:** if `<state_dir>/STOP` exists, halt and report: `Halted by STOP file at <state_dir>/STOP. Delete the file and re-run <reentry_command> to continue.` Do NOT delete the STOP file yourself — it is owned by whoever created it, never by this flow. Then stop. (A STOP file is a user-initiated stop, not a flow blocker: it halts exactly as written here.)
4. **Initialize safety counters:**
   - Run `echo 0 > <state_dir>/.dispatch_counter` to reset the persistent dispatch counter. The counter lives in `<state_dir>/.dispatch_counter` — on disk rather than in context, so it survives harness auto-compaction; re-read on every dispatch (see the safety contract below). It is a machine-local run artifact: keep it out of commits (`init`'s managed ignore block covers it), and never stage `<state_dir>/` as a directory.
   - `MAX_TOTAL_DISPATCHES = 40` — a runaway backstop that sits **behind** both loops' own `iteration >= 5` caps, never in front of them. Sizing: `## Loop` dispatches **four** agents per revision (`task-plan-writer`, `business-parity-reviewer`, `architecture-reviewer`, `task-plan-reviewer`) and caps at 5 revisions → 20; the UI-test-plan loop resets `iteration` and dispatches two per revision → 10; 30 bounded, and the remaining 10 absorb writer clarification re-dispatches. Reaching it therefore means a re-dispatch runaway, not non-convergence — non-convergence escalates at those loop caps first. If you hit it, halt.
5. **If a story index already exists** at `<state_dir>/story_plans/<branch>_story_plan.md`, read it briefly (heading list + Phase 2 Readiness entries only — don't ingest the per-task files), then apply `<existing_artifact_decision>`, which decides between **proceed fresh** (write from scratch), **extend** (pass that instruction to the writer) and **skip** (this loop has nothing to do). Do not silently overwrite, and do not pick one of the three yourself — this core supplies no default.
6. **Establish the run mode — grep first, open the contract only on a hit.** Run `grep -nE '^#+ *Run mode' <prompt_path>`. **No hit → this run has no run mode**: hold `none` for this session, emit `📌 Run mode: none` where a disclosure is owed, and do **not** open `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md`. **A hit → read `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` and follow it**, resolving that section to its directive ids and holding them for this session. Reading the task prompt is permitted and always was: the path-only rule in `## What you must NOT do` names review artifacts and plan files, and the prompt is neither — nothing here carves an exception out of that rule. Two follow-on facts have other owners and are not restated here: the **durable record** of what you read, and the seeding of its skipped-phase markers, belong to the fork that creates that record on the flows whose fork maintains one; and the **re-read immediately before each gate below** is what you actually act on — never a value carried forward from here.

   **Who reads first.** This step is appended below steps 1–5, while a fork that creates the run's durable record does so as its *first* Setup act — so this step is not always the first read. The rule: the run mode is obtained by whichever participant reaches it first — the engine entry command's confirm-and-establish step where the session has one, otherwise this step, otherwise the creating fork performing the same grep-first check itself immediately before its creation write — and **the creation write never happens without a resolved run mode**, an absent `### Run mode` section resolving to "no run mode", which is a value, not a missing one. Where this step runs after the record already carries its run-mode block (a resume, or a fork that read first), **read the recorded block** and do not re-derive it from the prompt: the recorded block is the tie-break `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` states.

---

## Safety contract — applies before EVERY Agent dispatch

Before you spawn any writer or reviewer agent (`task-plan-writer`, `business-parity-reviewer`, `architecture-reviewer`, `task-plan-reviewer`, `ui-tests-plan-writer`, `ui-tests-plan-reviewer`):

1. **STOP file check.** Run `ls <state_dir>/STOP 2>/dev/null`. If it exists, halt:
   - Report: `Halted by STOP file at <state_dir>/STOP. Delete the file and re-run <reentry_command> to continue.`
   - Do NOT delete the STOP file yourself — it is owned by whoever created it, never by this flow.
   - Stop the session. (A STOP file is a user-initiated stop, not a flow blocker: it halts exactly as written here.)
2. **Increment counter.** Run `cat <state_dir>/.dispatch_counter 2>/dev/null || echo 0` to read the current count, add 1 to get `total_dispatches`, then run `echo <total_dispatches> > <state_dir>/.dispatch_counter` to persist. **Issue these as two separate, plain commands exactly as written** — do NOT fold them into a single `{ …; }` brace group, and do NOT use command substitution (`n=$(cat …)`) or arithmetic expansion (`$((n+1))`) in a one-liner. The headless Bash safety guard auto-allows only simple known-prefix commands (`cat …`, `echo …`); a brace-group / `$(…)` / `$((…))` form fails its per-piece prefix check, so the guard stays **silent** and the command falls through to the permission profile — where an unattended run **stalls** on a prompt it cannot answer. The prescribed `cat … || echo 0` read is fine — both of its pieces match safe prefixes. Always re-read from disk — never trust an in-memory copy from before the current dispatch (auto-compaction can wipe it). If `total_dispatches > MAX_TOTAL_DISPATCHES`, halt:
   - Report: `Halted: exceeded MAX_TOTAL_DISPATCHES (<N>). Dispatches ran past both loops' 5-revision caps, so this is a re-dispatch runaway rather than non-convergence. Inspect the story index <state_dir>/story_plans/<branch>_story_plan.md (and per-task files under <state_dir>/task_plans/<branch>/) and the latest findings under <state_dir>/task_plan_reviews/<branch>/. If the story index has a `## Rejected findings` section, read it first.`
   - Stop the session. (This flow's cap halt is a plain report + stop, not an escalation — it does not park and does not wait for an answer.)
3. **Print heartbeat** — one short line before the dispatch:

   ```
   [plan-write · iter <i>] → <agent_name>  (#<total_dispatches>)
   ```

   Example: `[plan-write · iter 0] → task-plan-writer  (#1)`
4. **Compose the prompt — knowledge, not conclusions.** The dispatch prompt is exactly the block its governing instruction defines, plus at most the sanctioned `context_notes:` line. What may and may not go in it, and the record you owe for anything you added, are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` — **read that file once at session start; it binds every dispatch you make.** No part of that boundary is restated here.

---

## Loop

`iteration` is reset to 0 at the start of this loop and counts **writer revisions across this loop's sequential gates** — every FAIL, from whichever gate, sends the plan back to step 1 — never rounds of any one gate. It is not a per-gate budget: no gate's remaining rounds are whatever the other gates left unspent. The cap exists to prevent one stuck loop from running forever, not to limit the whole session. Hitting the cap stops this loop and reports the blocker via `<escalate>`.

**The `iteration:` argument the dispatch blocks below pass is not this counter — never conflate the two.** Its value is the **next free index resolved per findings folder**: `ls` that dispatch's own `findings_folder` first and pass one past the highest `review_<n>.md` it holds, so an existing gapped series is never back-filled; a folder holding no `review_*.md` — including one that does not exist yet — starts at 0. Each folder's series is therefore gapless, and `ls <findings_folder> | grep -c '^review_'` counts that gate's own rounds. Listing a folder resolves a filename and opens no file, so the path-only rule in `## What you must NOT do` is intact. The heartbeat's `iter <i>` stays this counter, not the resolved index.

`iteration = 0`. Loop:

### 1. Spawn `task-plan-writer`

First iteration prompt:

```
Write the task plan.
Branch: <branch>
Task prompt: <prompt_path>
Outputs: story index at <state_dir>/story_plans/<branch>_story_plan.md and per-task files at <state_dir>/task_plans/<branch>/task_<N>_plan.md
```

Or, for revision iterations:

```
Revise the task plan per findings at <findings_file>.
Story index: <state_dir>/story_plans/<branch>_story_plan.md
Per-task files: <state_dir>/task_plans/<branch>/
```

The writer returns `story_file`, `task_files_dir`, and `tasks_count` — note these for the hand-off; do not read the files themselves. **When `phases.parity` is `true` in `harness.config.json`**, the writer **also** surfaces any excluded or deferred `<parity_vocabulary>` behaviours in a `## Parity exclusions / deferrals` section of its return. Note that section's contents (each entry's authorising task-prompt line or `TODO: @claude` marker) for the convergence summary — path-only discipline still applies, so this is the writer's own return text, not the plan files. When `phases.parity` is `false` the writer returns no such section and you do not ask for one.

If the writer returns a `## Questions` section in its output, **stop and route the questions through `<ask>` verbatim**. If an answer comes back, dispatch the writer again with the answers appended to the prompt. Do not invent answers.

### 2. Business-parity review (plan-review mode)

**Gate — re-read the run mode.** Before anything else in this step, re-read the run mode from the record `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The durable record` defines for this flow. If `parity` is among the skipped ids, **do not dispatch `business-parity-reviewer`**: make no dispatch, increment no counter, print no heartbeat. Note the skip for the convergence disclosure and **fall through to step 3 exactly as a `verdict: PASS` does** — a gate a run mode excludes is *passed by exclusion*, not pending, so this loop's convergence condition is unchanged. Otherwise run the step in full, as written below.

**Skip this gate unless `phases.parity` is `true` in `harness.config.json`.** A skipped gate is **not** a converged gate: the loop proceeds to the next step, records no pass for it, and reports none at `## Convergence`. (Stated once here; it governs every config-gated gate in this file, including the UI-test loop below.)

Business parity comes **before** architecture — catch a deviation from `<parity_vocabulary>`'s business logic in the plan (a wrong remote-call name, a mismatched request-payload field, a flipped `<` vs `<=`, a side-effect reorder) before spending architecture / structural review effort, and before any code is written. Apply the safety contract, then print the heartbeat before dispatching:

```
[plan-write · parity · iter <i>] → business-parity-reviewer  (#<total_dispatches>)
```

Example: `[plan-write · parity · iter 0] → business-parity-reviewer  (#N)`

Dispatch `business-parity-reviewer` in **plan-review mode** (same arg names as the architecture step):

```
story_path: <state_dir>/story_plans/<branch>_story_plan.md
task_files_dir: <state_dir>/task_plans/<branch>/
prompt_path: <prompt_path>
findings_folder: <state_dir>/business_parity_reviews/<branch>/
iteration: <iteration>
```

(The reviewer creates `<state_dir>/business_parity_reviews/<branch>/` itself only when it has findings to write — do NOT `mkdir -p` here, matching the existing reviewer-folder convention.)

Resolve `iteration:` as the `## Loop` preamble states — the next free index in `<state_dir>/business_parity_reviews/<branch>/`, not the loop counter.

Parse the return:

- `verdict: PASS` → fall through to step 3 (architecture review).
- `verdict: FAIL` → increment `iteration`. If `>= 5`, `<escalate>` with the latest findings path, each gate's own round count (`ls <findings_folder> | grep -c '^review_'`, run per gate as the `## Loop` preamble states) and a one-paragraph summary ("the plan loop reached its 5-revision cap; the business-parity gate was open when it fired"), **naming the story index's `## Rejected findings` section and its open entries when the index carries one, and its `## Scope register` rows whose `Disposition` is in dispute when it carries one**. Otherwise loop back to **step 1** with the revision prompt `Revise the task plan per findings at <findings_file>. Story index: <state_dir>/story_plans/<branch>_story_plan.md  Per-task files: <state_dir>/task_plans/<branch>/`, then re-run the parity review (then the architecture review, then the structural reviewer) on the revised plan.

### 3. Architecture review (plan-review mode)

**Gate — re-read the run mode.** Before anything else in this step, re-read the run mode from the record `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The durable record` defines for this flow. If `architecture` is among the skipped ids, **do not dispatch `architecture-reviewer`**: make no dispatch, increment no counter, print no heartbeat. Note the skip for the convergence disclosure and **fall through to step 4 exactly as a `verdict: PASS` does** — a gate a run mode excludes is *passed by exclusion*, not pending, so this loop's convergence condition is unchanged. Otherwise run the step in full, as written below.

Architecture comes **before** the structural plan review — catch layer-placement / dependency-direction problems in the plan before the structural reviewer (and before any code is written). Apply the safety contract, then print the heartbeat before dispatching:

```
[plan-write · arch · iter <i>] → architecture-reviewer  (#<total_dispatches>)
```

Example: `[plan-write · arch · iter 0] → architecture-reviewer  (#N)`

Dispatch `architecture-reviewer` in **plan-review mode** (same arg names as `task-plan-reviewer`):

```
story_path: <state_dir>/story_plans/<branch>_story_plan.md
task_files_dir: <state_dir>/task_plans/<branch>/
prompt_path: <prompt_path>
findings_folder: <state_dir>/architecture_reviews/<branch>/
iteration: <iteration>
```

(The reviewer creates `<state_dir>/architecture_reviews/<branch>/` itself only when it has findings to write — do NOT `mkdir -p` here, matching the existing reviewer-folder convention.)

Resolve `iteration:` as the `## Loop` preamble states — the next free index in `<state_dir>/architecture_reviews/<branch>/`, not the loop counter.

Parse the return:

- `verdict: PASS` → fall through to step 4 (`task-plan-reviewer`).
- `verdict: FAIL` → increment `iteration`. If `>= 5`, `<escalate>` with the latest findings path, each gate's own round count (`ls <findings_folder> | grep -c '^review_'`, run per gate as the `## Loop` preamble states) and a one-paragraph summary ("the plan loop reached its 5-revision cap; the architecture gate was open when it fired"), **naming the story index's `## Rejected findings` section and its open entries when the index carries one, and its `## Scope register` rows whose `Disposition` is in dispute when it carries one**. Otherwise loop back to **step 1** with the revision prompt `Revise the task plan per findings at <findings_file>. Story index: <state_dir>/story_plans/<branch>_story_plan.md  Per-task files: <state_dir>/task_plans/<branch>/`, then re-run the parity review (only when `phases.parity` is `true`) and the architecture review on the revised plan before reaching the structural reviewer.

### 4. Spawn `task-plan-reviewer`

(The reviewer creates `<state_dir>/task_plan_reviews/<branch>/` itself only when it has findings to write — do NOT `mkdir -p` here.)

```
story_path: <state_dir>/story_plans/<branch>_story_plan.md
task_files_dir: <state_dir>/task_plans/<branch>/
prompt_path: <prompt_path>
findings_folder: <state_dir>/task_plan_reviews/<branch>/
iteration: <iteration>
```

Resolve `iteration:` as the `## Loop` preamble states — the next free index in `<state_dir>/task_plan_reviews/<branch>/`, not the loop counter.

### 5. Parse the reviewer's return

- `verdict: PASS` → break, go to the "UI-test-plan write loop" below and then to `## Convergence`.
- `verdict: FAIL` → increment `iteration`. If `>= 5`, `<escalate>` with the latest findings path, each gate's own round count (`ls <findings_folder> | grep -c '^review_'`, run per gate as the `## Loop` preamble states) and a one-paragraph summary ("the plan loop reached its 5-revision cap; the plan-review gate was open when it fired"), **naming the story index's `## Rejected findings` section and its open entries when the index carries one, and its `## Scope register` rows whose `Disposition` is in dispute when it carries one**. Otherwise loop back to step 1 with the revision prompt.

---

## UI-test-plan write loop

**Skip this loop unless `phases.qa` is `true` in `harness.config.json`.** With the QA phase off there is no browser-QA pass for a UI-test plan to feed, so nothing here runs: fall straight through to `## Convergence`, which reports the loop as not run. Per step 2 of `## Loop`, that skip is not a converged gate — it records no pass.

Once the task-plan loop above converges (the `task-plan-reviewer` returned `verdict: PASS`), produce the UI-test plan **before** the hand-off. This is the QA-side analog of the task-plan loop: a `ui-tests-plan-writer` writes the plan, then the `ui-tests-plan-reviewer` reviews it for symmetry with the task-plan flow. The safety contract above (STOP-file check, `.dispatch_counter` increment against `MAX_TOTAL_DISPATCHES`, heartbeat line) applies before **every** dispatch in this loop, exactly as it does for the task-plan loop.

`iteration` is reset to 0 at the start of this loop.

### 1. Spawn `ui-tests-plan-writer`

**Gate — re-read the run mode.** Before anything else in this loop, re-read the run mode from the record `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The durable record` defines for this flow. If `qa` is among the skipped ids, **do not dispatch `ui-tests-plan-writer`** and skip this whole loop: no plan is written, no reviewer is dispatched, and neither is owed. Note the skip for the hand-off and fall through to `## Convergence`. This is a **third** terminal state of this loop, alongside the `ui-tests-plan-reviewer`'s `verdict: PASS` and the `no_ui: true` short-circuit below, and it is distinct from `no_ui` in provenance: an authored exclusion decided before the run began, not a writer's finding that there is nothing to test. Report it as such — never in the `no_ui` wording, and never with a writer's `reason`, because no writer ran. Otherwise run the loop in full, as written below.

Apply the safety contract, then print the heartbeat before dispatching:

```
[ui-test-write · iter <i>] → ui-tests-plan-writer  (#<total_dispatches>)
```

Example: `[ui-test-write · iter 0] → ui-tests-plan-writer  (#N)`

First iteration prompt:

```
Write the UI-test plan.
Branch: <branch>
Inputs: task prompt <state_dir>/task_prompts/<branch>_task_prompt.md, story index <state_dir>/story_plans/<branch>_story_plan.md, per-task files <state_dir>/task_plans/<branch>/
Outputs: index <state_dir>/ui_test_plans/<branch>_ui_test_plan.md and per-test files <state_dir>/ui_test_plans/<branch>/ui_test_<N>.md
```

Or, for revision iterations:

```
Revise the UI-test plan per findings at <findings_file>.
Index: <state_dir>/ui_test_plans/<branch>_ui_test_plan.md
Per-test files: <state_dir>/ui_test_plans/<branch>/
```

The writer returns `ui_test_index`, `ui_test_files_dir`, and `tests_count` — note these for the hand-off; do not read the files themselves.

**No-UI short-circuit.** If the writer returns `no_ui: true` (it wrote no plan because the branch renders no interactively-testable UI), **skip the `ui-tests-plan-reviewer` dispatch and the rest of this loop entirely** — there is no plan to review. Note the no-UI outcome (and the writer's `reason`) for the hand-off and fall through to `## Convergence`. Do **not** treat the absent index as an error, and do **not** dispatch the reviewer.

If the writer returns a `## Questions` section in its output, **stop and route the questions through `<ask>` verbatim** (same handling as the task-plan-writer). If an answer comes back, dispatch the writer again with the answers appended to the prompt. Do not invent answers.

### 2. Spawn `ui-tests-plan-reviewer`

The UI-test plan **is** meta-reviewed. Dispatch the `ui-tests-plan-reviewer` once per iteration against the UI-test index + per-test files — it validates the split index ↔ per-test 1:1 correspondence, that each per-test file matches the `ui-tests-plan-writer` contract, that each `**Capability / MCP:**` annotation names a capability the configured QA driver's variant actually has (or, where that variant declares no capability set, carries the not-applicable marker `n/a (<qa_driver> variant declares no capability set)`), that cited element selectors and backend names are real, that every asserted status/value attribute literal agrees with its authority — the call site in the application source that writes it, or the task file that introduces the attribute where this loop runs before that source exists — and that the `## Phase 2 Readiness — Ordered Fix List` heading is byte-identical. Apply the safety contract and heartbeat (`[ui-test-write · iter <i>] → ui-tests-plan-reviewer  (#<total_dispatches>)`) before dispatching, then give it:

```
ui_test_index: <state_dir>/ui_test_plans/<branch>_ui_test_plan.md
ui_test_files_dir: <state_dir>/ui_test_plans/<branch>/
prompt_path: <state_dir>/task_prompts/<branch>_task_prompt.md
findings_folder: <state_dir>/ui_test_plan_reviews/<branch>/
iteration: <iteration>
```

(The reviewer creates `<state_dir>/ui_test_plan_reviews/<branch>/` itself only when it has findings to write — do NOT `mkdir -p` here.)

Resolve `iteration:` as the `## Loop` preamble states — the next free index in `<state_dir>/ui_test_plan_reviews/<branch>/`, not the loop counter.

### 3. Parse the reviewer's return

- `verdict: PASS` → break, go to `## Convergence` below.
- `verdict: FAIL` → increment `iteration`. If `>= 5`, `<escalate>` with the latest findings path and a one-paragraph summary ("5 UI-test-plan-review iterations did not converge"), **naming the UI-test-plan index's `## Rejected findings` section and its open entries when the index carries one**. Otherwise loop back to step 1 with the revision prompt.

---

## Convergence

The flow has converged when **both** loops are done:

- the `task-plan-reviewer` returned `verdict: PASS` — which also means the architecture gate passed on the final revision, and, when `phases.parity` is `true`, the business-parity gate too — or were passed by exclusion, where the run mode skipped them — since they run before it and a revision re-runs them; **and**
- the UI-test-plan loop either returned `verdict: PASS` from the `ui-tests-plan-reviewer`, **or** short-circuited because the `ui-tests-plan-writer` returned `no_ui: true` (no plan written, no reviewer dispatched — not an error), **or** never ran because `phases.qa` is `false`, **or** never ran, because `qa` is among the recorded skipped ids (an authored exclusion rather than a writer's finding — equally not an error).

**Write the dispatch-additions record.** This loop has no phases, so it has exactly one write point: if either loop above owes a block under `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The entry format`, run that file's record step **once here, before the hand-off** — it owns where the record is written, what a block contains and how it is committed. It is best-effort and never a gate: a failure there is logged and this loop hands off unchanged.

At that point hand off via `<terminal_handoff>`. Carry these facts into the hand-off — they are what it reports. Every value comes from a writer's own return: **do not paste either plan's content**, and do not open the plan files to produce them.

- `tasks_count`, from the `task-plan-writer`'s return.
- The story-index path (`<state_dir>/story_plans/<branch>_story_plan.md`) and the per-task directory (`<state_dir>/task_plans/<branch>/`).
- **When `phases.parity` is `true`: every excluded or deferred `<parity_vocabulary>` behaviour the writer reported** in its `## Parity exclusions / deferrals` section — each with its authorising task-prompt line (for an explicit exclusion) or its entry-point `// TODO: @claude add a follow up task for this: …` marker location (for a deferral) — so omissions are visible at review. If the writer reported none, state that no `<parity_vocabulary>` behaviours were excluded or deferred. When `phases.parity` is `false` there is no such section and the hand-off carries nothing on this line.
- The UI-test-plan index path (`<state_dir>/ui_test_plans/<branch>_ui_test_plan.md`), the per-test directory (`<state_dir>/ui_test_plans/<branch>/`), and `tests_count` from the UI-test writer's return — **or**, when that writer returned `no_ui: true`, the no-UI variant instead: the branch renders no interactively-testable UI, so **no UI-test plan was written and QA will be skipped**, with the writer's `reason`. In that case there is no UI-test index or per-test directory to report. **When `phases.qa` is `false`** the loop never ran at all: report that this project has no QA phase enabled, so no UI-test plan was written — again with no index or per-test directory to report. **Or**, fourth, when the loop never ran because `qa` is among the recorded skipped ids, the run-mode variant instead: the run mode excluded QA, so **no UI-test plan was written and QA will be skipped**, with the recorded directive as the reason — likewise no index, no per-test directory and no `tests_count`. Report exactly one of the four, and keep the fourth distinct from the second: an authored exclusion is never reported in the `no_ui` wording and never carries a writer's `reason`, because no writer ran.
- **The run mode you re-read at the gates:** the directive ids honoured this run (its `skipped:` set) and any directive that was ignored, with the task prompt's `### Run mode` section as the authority. Like the two `📌` disclosure lines below, these are **yours** rather than a writer's, and producing them breaches nothing above: the prompt's `### Run mode` section is one of this flow's own inputs, and the record it is kept in — on the flows whose fork maintains one — is this flow's own durable state. Neither is a findings file or a plan file.
- The mandatory `📌 Dispatch additions: …` disclosure line, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The disclosure line` gives it (including its `none` form, which is a normal outcome). This one value is **yours**, not a writer's: `<N>` is your own count of the blocks you wrote at the record step above, so producing it opens no file and leaves the path-only discipline above intact.
- The mandatory `📌 Run mode: …` disclosure line, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The disclosure line` gives it, including its `none` form (a prompt carrying no such section at all — a normal outcome) and its ignored-directive suffix. Where this flow's hand-off is a fork-held `<terminal_handoff>` / convergence-summary value, the line is **emitted inside that value**, at the fork's own disclosure site — the same arrangement `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## Activation` describes for its own line. This section states the obligation and the form; the fork emits it.

Whether the flow stops at the hand-off or falls through past it is `<terminal_handoff>`'s to state — not yours to decide.

---

## Stop conditions

- **STOP file present** at `<state_dir>/STOP` (checked before every dispatch — see `## Safety contract` above). It halts exactly as that step words it: a plain report naming `<reentry_command>`, then stop — **never** routed through `<escalate>`, because a STOP file is a user-initiated stop, not a flow blocker.
- **`total_dispatches > MAX_TOTAL_DISPATCHES`** — session ceiling exceeded. It halts exactly as `## Safety contract` step 2 words it: a plain report + stop, **not** an escalation — this flow does not park on a cap hit.
- Either writer (`task-plan-writer` or `ui-tests-plan-writer`) returns `## Questions` → stop and route them verbatim through `<ask>`; the flow continues only once an answer comes back.
- Business-parity-review loop (`business-parity-reviewer` in plan-review mode, and only when `phases.parity` is `true`) hits `iteration >= 5` without PASS → `<escalate>`, naming the latest findings path and the index evidence that step names.
- Architecture-review loop (`architecture-reviewer` in plan-review mode) hits `iteration >= 5` without PASS → `<escalate>`, naming the latest findings path and the index evidence that step names.
- Either reviewer loop (task-plan or UI-test-plan) hits `iteration >= 5` without PASS → `<escalate>`, naming the latest findings path and the index evidence that step names.
- Any agent returns `error:` or `blocker:` → `<escalate>`.

---

## What you must NOT do

- Do NOT read the contents of `<state_dir>/task_plan_reviews/<branch>/review_*.md`, `<state_dir>/business_parity_reviews/<branch>/review_*.md`, `<state_dir>/architecture_reviews/<branch>/review_*.md`, or `<state_dir>/ui_test_plan_reviews/<branch>/review_*.md`. Path-only.
- Do NOT read the story index, per-task files, UI-test index, or per-test file content to verify quality. The reviewer's PASS is the contract.
- Do NOT edit the story index, per-task files, UI-test index, or per-test files directly. Dispatch the relevant writer.
- Do NOT decide for yourself what happens after `## Convergence`. That section states the facts the hand-off carries; `<terminal_handoff>` states what the flow does with them. Do not add a gate the binding does not state, and do not skip one it does.
- Do NOT execute this file without a fork's binding table. A **Mode-contract binding** — one of the five names this file's `## Mode contract — bindings this file uses` table declares — that is **used by a section you are executing** and that no fork has bound is a stop condition: halt and report rather than guessing a value. Every **other** `<…>` name here is a **path placeholder**, a **config value declared in `## Resolved values`**, or a loop counter, **not** a binding: an unresolved path placeholder is not a stop condition, it means you arrived without reading `## Setup`, so go read that Setup rather than halting.
- Do NOT infer a run mode from anything but its own record — the source `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The durable record` names for this flow. Not from the plan, not from a reviewer's return.
- Do NOT paraphrase a run-mode directive into any dispatch prompt. A directive addressed to a sub-agent reaches that agent through the prompt the agent reads itself; putting your reading of it into a dispatch is a conclusion rather than knowledge, under `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`.
- Do NOT add anything to a dispatch prompt beyond what its governing instruction defines and the one sanctioned `context_notes:` line. The rule — **Knowledge, not conclusions** — and the record you owe for every addition are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`; this list does not restate them.
