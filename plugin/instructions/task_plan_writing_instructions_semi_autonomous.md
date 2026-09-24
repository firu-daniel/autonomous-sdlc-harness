# Semi-autonomous task-plan writing loop

Run `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md` verbatim by reference, with the bindings below. Do not restate the Setup, the Safety contract, the writer/reviewer loop, the UI-test-plan loop, the stop conditions or the "What you must NOT do" list — they are canonical there.

**This fork is bound by the semi-autonomous planning entry point only.** The `/autonomous-sdlc-harness:branch-start-plan-semi-autonomous` command is its sole reader. The family's other consumer — the autonomous planning fork, `task_plan_writing_instructions_autonomous.md` — binds the core directly and does not read this file. It does **not** serve the supervised planning entry point either: `/autonomous-sdlc-harness:branch-start-plan` is entirely self-contained — its steps are inline and it reads no instruction file at all — so that flow consumes neither this fork nor the core.

---

## Resolved values

The two tokens below are neither Mode-contract **bindings** (`## Mode contract — bindings`, immediately below) nor ordinary **path placeholders** (`<branch>`, which resolves from the core's `## Setup` as every path placeholder this flow uses does): they resolve from the adopting repository's `harness.config.json`, are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<parity_vocabulary>` | config value | `parity.referenceName` — the name of the reference implementation this project is kept in parity with. Read **only** when `phases.parity` is `true`; when it is `false` the writer reports no parity exclusions and the hand-off carries none. |

---

## Mode contract — bindings

One row per binding declared in `task_plan_writing_instructions_core.md` → `## Mode contract — bindings this file uses`, carrying **this flow's value**. The core supplies no defaults (`mode_contract.md` rule (1)), so these values are what complete it; both read orders converge on this pair of files and neither is complete alone (rule (2)).

**Values only.** No row below restates a loop step or a dispatch block. One value — `<terminal_handoff>` — is a procedure too long for a table cell and is stated in full in the subsection **of this same section**, immediately below the table; it is inline in this fork, not a pointer to a third file (rule (2)). That subsection is also the one place this fork restates text the core also carries — the core's `## Convergence` fact list, deliberately, and to be mirrored on change; see the `## Convergence` bullet below.

| Binding | Value for this flow |
|---|---|
| `<escalate>` | Stop and surface the blocker, plus whatever path(s) the core's site names, to the user in your text output, then wait for direction. Do not continue. (For an `iteration >= 5` stop — the common case — that is the latest findings path plus the one-paragraph non-convergence summary the walker prints on the `summary:` line of its `binding: <escalate>` action. Sites that name neither, such as the missing task prompt at `## Setup` step 2 or an agent returning `error:` / `blocker:`, report the blocker alone.) |
| `<ask>` | Surface the writer's `## Questions` section to the user in your text output and wait for their answer — the flow resumes in this same session, which is what distinguishes `<ask>` from `<escalate>`. (The verbatim-relay requirement, the re-dispatch-with-the-answers-appended rule and the do-not-invent prohibition are the core's, on its `## Loop` step 1 / `## UI-test-plan write loop` step 1 sites — not restated here.) |
| `<existing_artifact_decision>` | Ask the user which of **extend it / rewrite from scratch / stop (the existing plan is good)**. Their answer selects one of the three outcomes the core's Setup step 5 names: "extend" → **extend**, "rewrite from scratch" → **proceed fresh**, "stop" → **skip**, which here ends the session. (What each outcome does, and the do-not-silently-overwrite / do-not-pick-one-yourself prohibitions, are the core's on that same step — not restated here.) |
| `<reentry_command>` | `/autonomous-sdlc-harness:branch-start-plan-semi-autonomous` |
| `<terminal_handoff>` | **Present to user, then stop.** Stated in full in ``### `<terminal_handoff>` — Present to user`` below. |

### `<terminal_handoff>` — Present to user

Deliver the facts the core's `## Convergence` carries to the user, then stop:

1. Tell the user the task plan was written and reviewed clean — and the UI-test plan too, **unless** the UI-test writer returned `no_ui: true` (no UI-test plan written; QA will be skipped — see below) or `phases.qa` is `false` (the loop never ran — see below) or `qa` is among the recorded skipped ids (the loop never ran because the run mode excluded QA — see below).
2. Show them a short summary in your text output: number of tasks (from the task-plan writer's `tasks_count`), the story-index path (`<state_dir>/story_plans/<branch>_story_plan.md`), the per-task directory (`<state_dir>/task_plans/<branch>/`). **When `phases.parity` is `true` in `harness.config.json`, explicitly list any excluded or deferred `<parity_vocabulary>` behaviours the writer reported** in its `## Parity exclusions / deferrals` section — each with its authorising task-prompt line (for an explicit exclusion) or its entry-point `// TODO: @claude add a follow up task for this: …` marker location (for a deferral) — so omissions are visible to the user at review. If the writer reported none, state that no `<parity_vocabulary>` behaviours were excluded or deferred; when `phases.parity` is `false` the writer returns no such section and there is nothing to report on this line. Then report the UI-test plan alongside it: the UI-test-plan index path (`<state_dir>/ui_test_plans/<branch>_ui_test_plan.md`), the per-test directory (`<state_dir>/ui_test_plans/<branch>/`), and the test count (from the UI-test writer's `tests_count`). **If the UI-test writer returned `no_ui: true`**, say instead that the branch renders no interactively-testable UI, so **no UI-test plan was written and QA will be skipped** (give the writer's `reason`) — there is no UI-test index or per-test directory to report. **If `phases.qa` is `false`**, say instead that this project has no QA phase enabled, so no UI-test plan was written — again with no index or per-test directory to report. **If the loop never ran because `qa` is among the recorded skipped ids**, say instead that the run mode excluded QA, so **no UI-test plan was written and QA will be skipped**, with the recorded directive as the reason — likewise no index, no per-test directory and no `tests_count`. Report exactly one of the four, and keep the fourth distinct from the second: an authored exclusion is never reported in the `no_ui` wording and never carries a writer's `reason`, because no writer ran. Name **the run mode you re-read at the gates** as well: the directive ids honoured this run (its `skipped:` set) and any directive that was ignored, with the task prompt's `### Run mode` section (`<state_dir>/task_prompts/<branch>_task_prompt.md`) as the authority — this value is yours, not a writer's, so producing it opens no plan file. **Do not paste either plan's content** — they can open the indexes for the readiness lists and drill into the per-task / per-test files.
3. Name any **plan-review findings folder that exists** for this branch — `<state_dir>/task_plan_reviews/<branch>/`, `<state_dir>/business_parity_reviews/<branch>/`, `<state_dir>/architecture_reviews/<branch>/`, `<state_dir>/ui_test_plan_reviews/<branch>/` — as **uncommitted artifacts to include when they commit the plan**: no flow step on this path stages them, so a commit covering only the story index and the per-task files loses them at PR time. Check which of the four are present and list only those; where none exists (every plan reviewer passed first time), say nothing — an absent folder is a normal outcome, not a defect.
4. Tell them the next step: open the story index, review it (and any per-task / per-test files), and run `/autonomous-sdlc-harness:branch-implement-plan-semi-autonomous` when ready — its QA phase will execute the UI-test plan during implementation.
5. Emit the mandatory `📌 Dispatch additions: …` disclosure line, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The disclosure line` gives it (including its `none` form, which is a normal outcome). `<N>` is your own count of the blocks you wrote at the core's `## Convergence` record step — producing it opens no file. Emit the mandatory `📌 Run mode: …` disclosure line too, as its own line beside the `📌 Dispatch additions: …` line and never merged into it, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The disclosure line` gives it — including its `none` form (a prompt carrying no such section at all, a normal outcome) and its ignored-directive suffix; the core's `## Convergence` owns that obligation and the form, and this fork-held hand-off value is where it is emitted.

Then stop. Do not auto-proceed to implementation — the user must approve the plan first.

---

## What this fork does NOT redefine

- `## Setup (once per session)` — its steps and the `Artifact | Path` table that resolves every path this flow reads or writes. Canonical in the core.
- `## The walker — routing is its, judgement is yours` — the walker's forms, the outcome table and how its output is acted on. Canonical in the core.
- `## Safety contract — applies before EVERY Agent dispatch` — the `<state_dir>/STOP` check, the `.dispatch_counter` increment, `MAX_TOTAL_DISPATCHES` and the compose-the-prompt step, canonical in the core; the heartbeat format, canonical in the planning graph.
- `## Loop` — the task-plan writer/reviewer loop, steps 1–5 (`task-plan-writer`, the business-parity gate, the architecture gate, `task-plan-reviewer`, the verdict parse), including every prompt and dispatch block, canonical in the core, and every `iteration >= 5` cap, canonical in the planning graph the walker walks.
- `## UI-test-plan write loop` — steps 1–3, including the `no_ui: true` short-circuit and the `phases.qa` gate. Canonical in the core.
- `## Convergence` — the condition both loops must meet, and the **owner** of the fact set the hand-off carries. Canonical in the core. `<terminal_handoff>` above carries a deliberate verbatim copy of those facts, because its value *is* the five-step body that delivers them (it names a slash command and states a gate the autonomous fork removes, so the core cannot hold it): a change to the core's fact list must be mirrored in that subsection.
- `## Stop conditions` and `## What you must NOT do`. Canonical in the core.

**Ownership.** This fork **binds** values; it never restates a body, and it is never cited by another fork. Anything that reads as *what to do* rather than *what a value is* belongs in the core (`mode_contract.md` rules (3) and (5)) — the one exception being `<terminal_handoff>`, whose value *is* a procedure the core is forbidden to contain: it names a slash command and states a gate the autonomous fork removes.
