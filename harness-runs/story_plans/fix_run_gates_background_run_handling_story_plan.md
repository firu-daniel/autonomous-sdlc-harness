# Story: The Run gates run form detaches the gate run itself, and the flow's account of a headless turn's end is corrected

## Context

Phase G's gate run must survive however long the suite takes, and its verdict must be collected reliably. Today `### G.1 Run the gates` (`plugin/instructions/plan_orchestration_instructions_core.md`) expects the Bash tool to move an over-running foreground call to the background, and the tool stops a moved command at its background time limit. This repository's suite needs about 37–40 minutes sandboxed. The maintainer measured that limit on Claude Code 2.1.309 (probe B1), and the run `feat_unattended_sandbox_preflight` hit it on 2.1.308 (its round 1). This branch makes the wrapper's **run form start the gates as a process detached from the calling shell and print `pending` at once**. Every round is then collected through the wait form (`--wait <label>`), and the Bash tool's backgrounding never touches a gate run. Probe A2 measured this shape on 2.1.309. A process started with `nohup … </dev/null >/dev/null 2>&1 &` plus `disown` inside one sandboxed call outlived that call and the session's own exit, and ran its full 1524 s.

**What does not change.** The decisions the task prompt marks as holding stay as they are:
- The verdict comes from the wrapper's verdict file, never from the suite's output.
- `--wait` is one foreground call bounded by `WAIT_SLICE_SECONDS` and re-issued on `pending`.
- One run per label.
- No `Monitor` and no `sleep`.
- A unit's own run stays in the foreground (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6, which no task edits).

The wire is kept exactly: the lines `pass` / `fail <log>` / `pending`, the exit map 0/1/2/3, the `.running` / `.verdict` / `.log` names and paths, the label pattern, the log marker lines, and the refusal texts. The detached process carries `sandbox2b`'s liveness signal (the mtime of `<label>.running`, refreshed by the heartbeat on fd 3), and no second signal is added.

**The design, which Task 1 owns.**
- **Run form.** It resolves and refuses exactly as today, in the calling shell. It collects a live run of its label exactly as today (`run_alive` → `wait_for_verdict`). Otherwise it removes a stale `.verdict` and re-invokes the script itself as a **worker**, with an environment marker set to the label: `nohup bash <the script's own path> <label> </dev/null >/dev/null 2>&1 &`, then `disown`. It polls, for a bounded start-up window, until `.running` holds the worker's PID (`$!`). Only then does it print `pending` and exit 3. So an immediate `--wait`, or a second run form, always finds a live run.
- **Worker.** It is today's run body unchanged: `.running` holding its own `$$`, the fd-3 heartbeat, the gates, the verdict rename, and the `.running` removal. It unsets the marker before any gate runs, so the suite it runs can never inherit it. This repository's own suite spawns the wrapper with the label `task_round_1`, the same label as this repository's first gate round.

The internal names Task 1 introduces are the wrapper's own, not a wire. Every other task treats the run form as a black box with the contract above.

**The teardown account is corrected to the three measured cases.** All three were measured on Claude Code 2.1.309, macOS, headless, sandboxed:
- **nothing pending:** the process exits `rc=0` right after the turn ends (probe A);
- **a background Bash task pending:** the process stays alive, is woken when the task completes, runs a second turn, then exits `rc=0` (probe E);
- **a `Monitor` pending:** the same, woken when the Monitor's stream ends (probe F).

The rule against ending the turn with a gate run in flight stays. Its reasons are now three:
- a silent wait gives the stall watchdog no output, and a wait longer than `STALL_KILL_SECS` is exposed to a kill-and-resume;
- the STOP and PAUSE checks run only on each `--wait` re-issue;
- a detached run is not a tool task, so nothing wakes the session when it finishes, and with nothing pending the turn's end is the process's end.

The wake-up in probes E and F is recorded as observed CLI behaviour only, never used as a mechanism (a task-prompt constraint). No passage names the background limit's figure or a `timeout` value as an input to the flow.

**The stall watchdog and a detached run.** The watcher's `check_stalled_runs` (`cli/templates/scripts/autonomous-watcher.sh`) kills the session's PID and the descendants it can enumerate at that moment, then resets and resumes. A detached worker has been reparented away from the session, so it is not among them. It survives the kill, and the resumed session's G.1 re-issues the run form for the same round. One-run-per-label then collects the live run instead of starting a second. The reset (`hr_run_reset_var`, a `read-tree --reset`) leaves the gitignored `test_run_logs/` untouched, so `.running` survives it. Task 2 tests that path without `pgrep` or `ps`, which a sandboxed run refuses. While G.1's `--wait` loop runs, each re-issue is a stream event, so the session is never silent long enough to reach the watchdog's warn tier. The watchdog's busy-CPU guard (`STALL_BUSY_CPU_PCT`) sums CPU over the session's descendants only, so it would not count a detached run's CPU. That is read off the code. Its effect was not measured, and Task 11 records it as **not measured**. The env tunable is the seam a later measurement uses.

**The rows the corrected passages cite — the interface between the `plugin` tasks and Task 11.** Task 11 adds a block to `docs/sandbox-verification.md` → `## 5. Failures and their follow-ups`, under the bold title **The Run gates run form, the background limit and a headless turn's end.** Its rows carry exactly these ids and contents. Tasks 4 and 6 cite them by these ids without opening the document. Task 7 points at §2.5 rather than at a row.

| Id | What the row records |
|---|---|
| BG1 | Probe A, 2.1.309: with nothing pending, the headless process exits `rc=0` right after the turn ends |
| BG2 | Probe A2, 2.1.309: a process detached with `nohup … </dev/null >/dev/null 2>&1 &` plus `disown` inside one sandboxed call outlives the call and the session's exit and runs its full 1524 s; no tool-level limit applies because the Bash tool never tracked it; `kill -0` on it from a later call is refused |
| BG3 | Probe B1, 2.1.309: a foreground call moved to the background at 120 s is stopped 600 s later (`task_notification` `status: "stopped"`, *"stopped after reaching its background time limit"*); the move message's own text |
| BG4 | Probes C1–C3, 2.1.309: an explicit background launch is stopped at 600 s with no `timeout`, at 300 s with `timeout` 300000, and ran its full 30 minutes with 7200000; the stop notification's *"If it already had the longest `timeout` allowed, do not restart it"*; the maximum not measured |
| BG5 | Probe E, 2.1.309: a background Bash task pending keeps the process alive; it is woken on the task's completion (`E-woken`, a second `result` event), then exits `rc=0` |
| BG6 | Probe F, 2.1.309: a `Monitor` pending — the same, woken when the Monitor's stream ends |
| BG7 | The run `feat_unattended_sandbox_preflight`, 2026-10-22, 2.1.308: round 1 (`timeout` 600000, moved at 10 minutes, stopped at 20); round 4 matching BG5; the stall watchdog warning at 1203 s and 1212 s while the session sat silent, and not killing |
| BG8 | `STALL_BUSY_CPU_PCT`'s effect on a session waiting behind a detached run: **not measured** |
| BG9 | The Linux sandbox, all of BG1–BG8: **not taken**, not inferred from macOS |
| BG10 | Owed: the shipped run form end to end, macOS, sandboxed, per §0 — the run form returns `pending` at once, `--wait` collects across more than `STALE_SECONDS`, and a session killed mid-wait by hand from outside the sandbox is followed by a re-issued run form that prints `pending` and starts nothing |

**The Done-summary clause — the interface between Task 4 and Task 8.** Both cores' D.2 Run gates bullets end with this clause, appended byte-identically after the bullet's last sentence:

> Then report the gate runs this session saw go uncollected: append `; gate runs not collected: ` and one `round <j> — <stopped|re-launched|lost> — <evidence>` per event, comma-separated, where **stopped** is a tool-layer notification that a command carrying `run-test-suite.sh` was stopped, its status and message quoted; **re-launched** is this session issuing the run form for a label it had already issued it for; and **lost** is a `--wait` refusal for a label whose verdict this session never read. Where this session saw none, append `; gate runs not collected: none observed`. Where this session re-entered after a pause or a stall-watchdog restart, say that an earlier session's gate runs are unreachable to it — never `none` for them.

Task 8 adds the matching improvement-observation duty, which uses those same three event names.

**The `--wait` loop and the bounded-retry lesson.** `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded by a count or a deadline"* governs retries of a failure. A `--wait` re-issue is a poll of a run that has not finished. Nothing bounds the number of re-issues, and no task adds a deadline (task prompt: *"name no wall-clock figure"*, *"a gate run in flight is never stopped or re-launched"*). The loop still ends for every run that ends: a finished run leaves a verdict, a dead run's heartbeat goes stale and the next `--wait` refuses within one call (`STALE_SECONDS` < `WAIT_SLICE_SECONDS`), and a STOP file ends the wait. The one case that does not end is a gate that never exits. Task 1's wrapper header states it as a residual, and Task 11 records it in `## 6. The unresolved points, settled or not`. It was previously cut short only by the tool's background limit, which this branch removes on purpose.

**Ship order.** The tasks run bottom-up in this repository's configured layer order, `cli`, then `plugin`, then the catch-all `general`. Tasks 1–3 change the template wrapper, its suite and the scripts README. Tasks 4–8 change the flow prose. Tasks 9–11 bring this checkout's self-adopted `scripts/run-test-suite.sh` level with the template, correct `docs/watcher.md`'s row, and record the measurements. Task 9 matters to this branch's own Phase G, which runs `scripts/run-test-suite.sh`.

**Top risks:**
- **A run form that prints `pending` before its worker is visible** would make the next `--wait` refuse `no run in flight` and escalate, the very failure this branch exists to remove. Task 1 polls until `.running` holds the worker's PID before printing. Task 2 issues `--wait` and a second run form immediately after `pending`, while the gate is held, and asserts neither refuses and nothing runs twice.
- **The worker marker leaking into the suite**, or **a test leaving a held worker orphaned**, would break this repository's own Phase G. The suite spawns the wrapper with the gate label `task_round_1`, and an orphan held on a release file in a deleted fixture would spin forever. Task 1 unsets the marker before any gate runs. Task 2 releases every held worker and waits for it to end before its fixture is removed, and its stub stops holding once its fixture is gone.
- **Signal behaviour changes for the detached worker.** A background job in a non-interactive shell starts with INT and QUIT ignored, and `nohup` ignores HUP, so the old "Ctrl-C to the group stops the gate" no longer holds. Task 1 measures the behaviour sandboxed, inside one Bash call (the shape Task 2's suite runs in under Phase G), and records it in the wrapper's `SIGNALS` paragraph, with any sandbox refusal quoted verbatim; Task 2 asserts that sandboxed observation rather than a guess. Whether a sandboxed test process may signal a worker its own descendant started, once that worker has been reparented, rests on that one measurement only. Task 2 therefore ends workers through release files wherever a case allows, and signals one only where the signal is the case's subject.

**Manual setup required:**
1. **Check the installed Claude Code version (Task 11).** Run `claude --version` from an ordinary terminal. If it is no longer 2.1.309, re-run `<home>/Work/harness-sandbox-tests/sbx2-probes.sh` as before. If the results differ, add the new version's results beside the 2.1.309 ones in rows BG1–BG6, keeping both. An agent cannot do this: the probes launch headless sessions from outside the sandbox. The raw results under `sbx2-results-20261023-083639/` are not readable from a sandboxed run either, which is why Task 11 records the figures as the task prompt states them.
2. **Take row BG10 (Task 11)** on macOS, in a sandboxed session on the §0 launch line, cwd = a run copy carrying this branch's merged tree, with the run held longer than `STALE_SECONDS`. The by-hand kill of the session comes from an unsandboxed terminal.
3. **BG8, if wanted:** measure `STALL_BUSY_CPU_PCT`'s effect by running the watcher with a lowered `STALL_WARN_SECS` / `STALL_KILL_SECS` over a session that ends its turn with a detached gate run in flight. It stays **not measured** until someone does.
4. **BG9** needs a Linux host with `bubblewrap`, `socat` and a signed-in Claude Code (`docs/sandbox-verification.md` → `## 6. The unresolved points, settled or not`). It stays **not taken**.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, or the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers elsewhere, such as the sub-step bullets inside the per-task files, are informational progress markers only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_run_gates_background_run_handling/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all `general` layer last.

1. [x] **Task 1** — Make the `run-test-suite.sh` template's run form detach the gate run and print `pending` at once _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Cover the detached run form in `cli/test/run-test-suite.test.mjs`: immediate `pending`, collection by a later `--wait`, and the watchdog-kill path _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Correct the run form's description in `cli/templates/scripts/README.md` _(layer: cli)_ _(points: 5)_
4. [x] **Task 4** — Rewrite `### G.1 Run the gates` for the detached run form and add the uncollected-gate-run clause to the plan core's Done summary _(layer: plugin)_ _(points: 20)_
5. [x] **Task 5** — Rewrite the `pending` bullet of the three supervised flows that run the gates _(layer: plugin)_ _(points: 10)_
6. [ ] **Task 6** — Correct `autonomous_pause_and_ledger.md` §2.5's teardown account to the three measured cases _(layer: plugin)_ _(points: 10)_
7. [ ] **Task 7** — Correct the teardown clause in the five autonomous forks' self-pause paragraphs _(layer: plugin)_ _(points: 10)_
8. [ ] **Task 8** — Report uncollected gate runs in the user-review fix core's Done summary and in the improvement observations _(layer: plugin)_ _(points: 15)_
9. [ ] **Task 9** — Bring this repository's `scripts/run-test-suite.sh` level with the template _(layer: general)_ _(points: 5)_
10. [ ] **Task 10** — Correct the `run-test-suite.sh` row of `docs/watcher.md` _(layer: general)_ _(points: 5)_
11. [ ] **Task 11** — Record the probe results and the run's evidence in `docs/sandbox-verification.md` as rows BG1–BG10 _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Rewrite G.1, and the same paragraph in every flow that runs Phase G by reference (`code_review_instructions.md`, `code_review_fixes_instructions.md`, `user_review_fixes_instructions.md`, and the user-review fix core)"*; *"Correct the teardown passages in §2.5 and G.1 to the measured three cases."*; *"Make the Done summary and the improvement observations report a gate run that was stopped, re-launched or lost to a time limit."*; *"Record the probe results in `docs/sandbox-verification.md`, with the version, as rows the corrected passages cite."*

**D1 — corpus files that describe the wrapper (command).** Re-run this verbatim from the checkout root. It is read-only:

```
grep -rlE 'run-test-suite\.sh' docs plugin cli/templates/state-dir cli/templates/claude cli/templates/scripts/README.md cli/templates/README.md cli/README.md README.md ARCHITECTURE.md examples/notes-app/.claude examples/notes-app/README.md harness-runs/test_run_logs/README.md
```

**D2 — corpus files that state the teardown or backgrounding claim (command).** Re-run verbatim, read-only:

```
grep -rlE 'torn down (when|at end of)|when (its|the) turn ends|moves the run to the background|background time limit' plugin docs cli/templates README.md ARCHITECTURE.md examples/notes-app/README.md
```

**D3 — the Done-summary Run gates bullet and the improvement-observation rules (command).** Re-run verbatim, read-only:

```
grep -rlE 'Run gates \(Phase G\): passed on round|What the orchestrator may log' plugin
```

**D4 — files the task prompt names (procedure).**
- **Artifact:** `harness-runs/task_prompts/fix_run_gates_background_run_handling_task_prompt.md`.
- **Traversal:** the bullet list under *"Before changing anything, read the rationale already recorded"*, then `## The goal` items 1–5 in order, then the `## Constraints` bullets in order.
- **Decision rule:** a path is reached when the item names it as a file to read, change or leave alone, and it is durable corpus text. Application source, its tests and its header comments are excluded.

**D5 — standing-artifact rows (procedure).**
- **Artifact:** `harness-runs/lessons.md`. First step, runnable: `grep -nE 'measure|wall-clock|retry' harness-runs/lessons.md`.
- **Traversal:** that command's matching lines in file order, each read as the one-line rule it opens.
- **Decision rule:** a rule is reached when its line matches.

**Closure invariant:** every site D1, D2, D3, D4 or D5 reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`, and `### D.2 Done summary`'s *"Run gates (Phase G): passed on round N"* bullet | — | D1, D2, D3, D4 goals 2–4 | `change` | Task 4 |
| 2 | `plugin/instructions/code_review_instructions.md` → step 6, *"If the tool layer moves the run to the background, or the command prints `pending`"* | — | D1, D2, D4 goal 2 | `change` | Task 5 |
| 3 | `plugin/instructions/code_review_fixes_instructions.md` → `## Phase 3`, the same bullet | — | D1, D2, D4 goal 2 | `change` | Task 5 |
| 4 | `plugin/instructions/user_review_fixes_instructions.md` → `## Phase 3`, the same bullet | — | D1, D2, D4 goal 2 | `change` | Task 5 |
| 5 | `plugin/instructions/user_review_fixes_instructions_core.md` → `## Phase G — Run gates` | — | D4 goal 2 | `no-change` | It runs the plan core's Phase G verbatim and *"restates no step of it"*. It carries no copy of the paragraph, so Task 4's G.1 rewrite reaches it by reference. |
| 6 | `plugin/instructions/user_review_fixes_instructions_core.md` → `### D.2 Done summary`, the *"Run gates (Phase G): passed on round N"* bullet | — | D3, D4 goal 4 | `change` | Task 8 |
| 7 | `plugin/instructions/autonomous_pause_and_ledger.md` → §2.5, the paragraph opening *"A backoff is not a resumption mechanism, and neither is a `Monitor`."* | — | D2, D4 goal 3 | `change` | Task 6 |
| 8 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Self-pause on API overload.** (*"the headless process is torn down at end of turn"*) | — | D2 | `change` | Task 7 |
| 9 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → **Self-pause on API overload.** (same clause) | — | D2 | `change` | Task 7 |
| 10 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → **API-overload self-pause.** (same clause) | — | D2 | `change` | Task 7 |
| 11 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → **Self-pause on API overload.** (same clause) | — | D2 | `change` | Task 7 |
| 12 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → **Self-pause on API overload during planning.** (same clause) | — | D2 | `change` | Task 7 |
| 13 | `plugin/instructions/improvement_observations_instructions.md` → `## What the orchestrator may log — rules` | — | D3, D4 goal 4 | `change` | Task 8 |
| 14 | `plugin/commands/branch-start-plan-autonomous.md` (points the orchestrator at `## What the orchestrator may log — rules`) | — | D3 | `no-change` | It points at the section, which Task 8 extends in place. The pointer still resolves and reads the new duty at session start. |
| 15 | `plugin/commands/branch-start-user-review-fix-autonomous.md` (the same pointer) | — | D3 | `no-change` | As row 14. |
| 16 | `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6 (*"`### G.1 Run the gates` forbids both by name"*) | — | D4 constraints | `no-change` | The task prompt leaves point 6 alone. It does not cite the teardown claim, and Task 4 keeps G.1's *"Forbidden here, by name: a `Monitor`, a `sleep` …"* opening, so its citation still lands. |
| 17 | `plugin/agents/test-fix-plan-writer.md` (the marker-line block) | — | D1 | `no-change` | The log marker lines are unchanged. Task 1 keeps them byte-exact. |
| 18 | `plugin/docs/AUTONOMOUS_FLOW.md` → the Run gates phase row, `**5. The Run gates phase (Phase G).**`, and **A run can also pause itself.** | — | D1 | `no-change` | They name the wrapper and *"one wrapper call"* per round, which still holds: one run form per round plus its `--wait` collection. *"a run that instead ends its turn quietly exits as though it had succeeded"* is the nothing-pending case (BG1), which stays true. |
| 19 | `plugin/commands/branch-implement-plan-semi-autonomous.md` → *"Phase G:"* | — | D1 | `no-change` | It names the wrapper and the round cap only. |
| 20 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` → *"a Run gates phase"* | — | D1 | `no-change` | It names the wrapper only. |
| 21 | `cli/templates/scripts/README.md` → *"`run-test-suite.sh` is run once per Run gates phase, … and prints only `pass` or `fail <log path>`"* | — | D1 | `change` | Task 3 |
| 22 | `cli/templates/scripts/run-test-suite.sh` → `THE WAIT FORM, AND WHY IT EXISTS` (*"A headless session is torn down when its turn ends"*) | — | D2, D4 goal 1 | `change` | Task 1. This is application source, listed only because D2 reaches its header. |
| 23 | `cli/templates/claude/settings.autonomous.json` → the `_README` line *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS"* | template | D1 | `no-change` | The invocation strings are unchanged. `nohup` runs inside the wrapper, never as a command a session issues, so no permission or sandbox entry is owed. |
| 24 | `examples/notes-app/.claude/settings.autonomous.json` → the same `_README` line and its `run-test-suite.sh` entries | worked-example copy | D1 | `no-change` | As row 23. |
| 25 | `cli/templates/state-dir/test_run_logs/README.md` | template | D1 | `no-change` | It describes the log, the marker lines and the verdict line the orchestrator reads, all unchanged. Which process writes the log is not stated there. |
| 26 | `harness-runs/test_run_logs/README.md` | self-adopted copy | D1 | `no-change` | As row 25. It stays byte-identical to its template. |
| 27 | `cli/README.md` → *"Two script families live there"* | — | D1 | `no-change` | It names the script family only. |
| 28 | `docs/cli.md` → *"Two families land in `scriptsDir`, and only one of them is generated."* | — | D1 | `no-change` | The script stays an outer-loop script copied verbatim. |
| 29 | `docs/config.md` → the `commands.test` row | — | D1 | `no-change` | It names the wrapper as the runner, once per Run gates round, which still holds. |
| 30 | `docs/watcher.md` → the `run-test-suite.sh` row of the scripts table (*"prints only `pass` or `fail <log path>`"*) | — | D1 | `change` | Task 10 |
| 31 | `docs/sandbox-verification.md` → the opening `**Who reads this:**` paragraph, the headline, `## 5. Failures and their follow-ups` (new F6 row, WF2 and WF4, the new BG block) and `## 6. The unresolved points, settled or not` | — | D1, D4 goal 5 | `change` | Task 11 |
| 32 | `docs/work-report-research/test-fix-plan-writer.md` (*"mirrored in `scripts/run-test-suite.sh:18–22` and `cli/test/run-test-suite.test.mjs:83–85`"*) | — | D1 | `no-change` | A research record, not this branch's to edit. Task 1 keeps the script's lines 1–22 line-for-line in count, and Task 2 keeps the test's lines 1–88 the same, so both citations still land. |
| 33 | `docs/work-report-research/statistics-plan-writer.md` (*"after `run-test-suite.sh task_supervised` passes"*) | — | D1 | `no-change` | A research record of a past flow. The label form is unchanged. |
| 34 | `harness-runs/story_plans/feat_run_gates_phase_story_plan.md` | — | D4, the rationale list | `no-change` | A past branch's run artifact, read for rationale only. |
| 35 | `harness-runs/story_plans/fix_background_test_wait_story_plan.md` | — | D4, the rationale list | `no-change` | As row 34. |
| 36 | `harness-runs/lessons.md` → *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision"* | — | D5 | `no-change` | Honoured. The design rests on probe A2 in a real headless sandboxed session (BG2), not on Task 2's stub. Task 2 proves the wrapper's own logic only. |
| 37 | `harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam that will measure it"* | — | D5 | `no-change` | Honoured. BG8 ships as not measured, and its seam already exists: `STALL_BUSY_CPU_PCT`, `STALL_WARN_SECS` and `STALL_KILL_SECS` are environment tunables of the watcher, so a measurement needs no new surface. |
| 38 | `harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future"* | — | D5 | `no-change` | No task writes a decision rule's verdict into another document as pending work. The probe re-run is a Manual setup step, not planned work. |
| 39 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session"* | — | D5 | `no-change` | Honoured. Every figure Task 11 records was taken by the maintainer from outside the sessions under test, and no task measures a duration. |
| 40 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded by a count or a deadline"* | — | D5 | `no-change` | Addressed in `## Context` → **The `--wait` loop and the bounded-retry lesson.** A `--wait` re-issue polls a run that has not finished and does not retry a failure. Every run that ends ends the loop. The never-exiting gate is recorded as a residual (Tasks 1 and 11), not hidden. |
