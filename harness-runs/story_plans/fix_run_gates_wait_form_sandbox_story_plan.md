# Story: Make `run-test-suite.sh`'s liveness check work inside the unattended sandbox

## Context

This branch replaces the signal `run-test-suite.sh` uses to decide whether a gate run is still in flight. Today `run_alive` (`cli/templates/scripts/run-test-suite.sh` → `run_alive`, the `kill -0 "$pid" 2>/dev/null` line) sends signal 0 to the PID recorded in `<label>.running`. Under Claude Code's macOS sandbox that signal is refused when another Bash call started the target process, so it fails both of its callers. The wait form (`--wait <label>`) refuses `no run in flight for <label>` while the run is alive. The run form's one-run-per-label guard does not see the live run, so it starts a second run of the same label, and that run truncates the live run's log.

**The measurement is already taken, so this branch records it rather than re-taking it.** It was taken 2026-10-23 on Claude Code 2.1.309, macOS, headless, on the watcher's launch line under the live profile; the raw results are `<home>/Work/harness-sandbox-tests/sbx2-results-20261023-083639/`, session `A`. Three results settle the design. `kill -0` from a later sandboxed call is refused (`kill: (68252) - Operation not permitted`, exit 1), and so is the same call on a process the wrapper detached itself (`kill: (70347) - Operation not permitted`). `kill -0` within one call on that call's own child succeeds (exit 0). `ps` is refused outright, even within one call (`/bin/ps: Operation not permitted`, exit 126), and `pgrep` cannot read the process list either. So no process-table or signal check can tell a later call whether a run is alive, and the new signal is **file-based**.

**The design: the mtime of `<label>.running` is the run's heartbeat.** The run form writes `.running` as it does today, holding its own PID; the PID is kept only as an ownership token. While the run form is alive, a heartbeat process it starts refreshes that file's mtime every second. A reader decides from the file alone:

- `.verdict` present → the run **finished**, and its line is printed;
- `.running` present with a heartbeat no older than `STALE_SECONDS` → the run is **live**;
- otherwise (no `.running`, or a stale heartbeat, and no verdict) → **no run in flight**: it never started, or it **died without a verdict**.

That signal needs no signal and no process listing from the reader. It survives whichever way the run form was started: as a tool-level background task, or as a process the wrapper detaches itself, which is the shape `sandbox2c` may adopt. It does not depend on the Bash call that started the run still being alive. The run form sends no signal either. Its heartbeat process hangs off a pipe whose only write end the run form holds (fd 3, `exec 3> >(…)`), and stops when that pipe reaches end of file, which happens however the run form exits, `SIGKILL` included; each gate closes its inherited copy (`3>&-`), so an orphaned gate cannot keep the heartbeat fresh. The gates themselves still run in the run form's foreground, so a signal to the run form's process group, such as a terminal Ctrl-C, stops the gate exactly as it does today, and a trapped signal to the run form's PID alone takes effect only once the running gate returns, so the label never reads free while its gate runs. The measurement's one permitted `kill -0` was within one live foreground call on a child that call had just started; nothing measured a run form that outlives its starting call signalling its own child, so the plan does not rely on it.

**The wire does not change.** That covers the `pass` / `fail <log>` / `pending` lines, the exit map 0/1/2/3, the `.running` / `.verdict` / `.log` names and paths, the label pattern and the refusal text `no run in flight for <label>`. The plugin's G.1 prose (`plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`) needs no edit for that reason. A `--wait` refusal still means what it says, and it now arrives only for a run that is really gone. A crashed run is refused within one `--wait` call, because `STALE_SECONDS` (30) is smaller than `WAIT_SLICE_SECONDS` (60). So the uncapped `--wait` re-issue in G.1 always ends.

The work is cut into four single-layer tasks, in bottom-up ship order. Task 1 changes the **template** `cli/templates/scripts/run-test-suite.sh`, which is what an adopter receives. Task 2 proves it in `cli/test/run-test-suite.test.mjs`. Task 3 brings this repository's own self-adopted copy, `scripts/run-test-suite.sh`, level with the template. Task 4 records the measurement and the owed sandboxed rows in `docs/sandbox-verification.md`. The catch-all tasks come last because they copy and document what the `cli` tasks built.

**Re-rendering without the forced `init`.** `init` copies an outer-loop script byte for byte (`cli/test/outer-loop-scripts.test.mjs` → *"the test-suite runner lands verbatim under scriptsDir, and a re-run keeps it"*). So for this file, the self-adopt recipe in `docs/development.md` → *"Regenerating this repository's adoption after a `cli/templates/` change is one forced self-adopt run"* has one outcome: `scripts/run-test-suite.sh` holds the template's bytes. Task 3 produces exactly that outcome, and the hand-kept files the recipe would overwrite and then restore are never touched. An unattended run cannot use the recipe itself. Its `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force …` line is not in the run's permission profile, and the forced run writes `.claude/settings.json`, which the sandbox denies in every run copy, beside the conventions documents under `.claude/context/`, which this plan may not target. Task 3 states the supervised alternative.

**Top risks:**

- **A live run that outlasts `STALE_SECONDS` could be misjudged dead.** That would reopen the double-run bug in a new form. Task 1's heartbeat process refreshes the mtime every second for as long as the run form lives, and ends on a pipe's end of file rather than on a signal the sandbox might refuse to a detached run form. Task 2 holds a real run for twice a shortened stale window and asserts that `--wait` still prints `pending`.
- **A crash could stay invisible, with `--wait` printing `pending` forever.** That would happen if the heartbeat came from anything other than the run form itself. Task 1's heartbeat lives exactly as long as the run form's end of its pipe, and the gates close their copies, so nothing outlives the run form to keep the file fresh. Task 2 kills a real run with `SIGKILL` and asserts that one `--wait` call refuses.
- **The mtime read could behave differently between BSD (macOS) and GNU (Linux) userland.** The library handles that difference, not the script. Task 1 reads the mtime through `hr_lane_mtime`, which `cli/templates/scripts/lib/harness-run-lib.sh` already owns. That function picks `stat -f %m` or `stat -c %Y` on the value, not the exit status, and prints `0` for a missing path or an unreadable mtime. Task 1 maps that `0` to a refusal rather than a guess, and the script carries no `stat` of its own. Whether `stat`, `touch` and `date` are allowed inside the sandbox is measured by Task 4's owed rows, not inferred. The Linux sandbox is recorded as not measured.

**Manual setup required:**

1. **Take `docs/sandbox-verification.md` rows WF2–WF4 on macOS, sandboxed (Task 4).** Use a headless session on the `## 0. Method` launch line, cwd = a run copy carrying this branch's merged tree. WF2: a tool-backgrounded run form collected by repeated foreground `--wait` calls, plus a run form re-issued while that run is live. WF3: a run killed with `kill -9` from an unsandboxed terminal, then `--wait`. WF4: a run form the session detaches itself with `nohup … &`, then `--wait` from the next call. In WF2 and WF4 the run is held longer than `STALE_SECONDS` (30 s) and the first `--wait` is issued after that point. An agent cannot take these rows. Each needs a person to launch the sandboxed session, and WF3 needs a terminal outside the sandbox.
2. **WF5, the Linux sandbox, needs a Linux host** with `bubblewrap`, `socat` and a signed-in Claude Code, which `## 6. The unresolved points, settled or not` records as unavailable. It stays **not run** until such a host is used.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, or the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers elsewhere, such as the sub-step bullets inside the per-task files, are informational progress markers only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_run_gates_wait_form_sandbox/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all `general` layer last.

1. [x] **Task 1** — Replace `run_alive`'s `kill -0` with a `.running` mtime heartbeat in the `run-test-suite.sh` template _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Cover the heartbeat in `cli/test/run-test-suite.test.mjs`: an unsignalable live run, a run that died without a verdict, and the run form finding a live run _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Bring this repository's `scripts/run-test-suite.sh` level with the template _(layer: general)_ _(points: 5)_
4. [ ] **Task 4** — Record the measurement and the wait form's sandbox rows in `docs/sandbox-verification.md` _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Replace the liveness signal with one the sandbox allows, used by both `run_alive` callers."* Also from the task prompt, for the documents: *"Record the result in `docs/sandbox-verification.md`, as a row for the wait form under the sandbox, with the measurement from goal 1."*

**D1 — corpus files that describe the wrapper or its liveness check (command).** Re-run this verbatim from the checkout root. It is read-only:

```
grep -rlE 'run-test-suite\.sh|kill -0|run_alive|<label>\.running' docs plugin cli/templates/state-dir cli/templates/claude cli/templates/scripts/README.md cli/templates/README.md cli/README.md README.md ARCHITECTURE.md examples/notes-app/.claude examples/notes-app/README.md harness-runs/test_run_logs/README.md
```

**D2 — files the task prompt names (procedure).**
- **Artifact:** `harness-runs/task_prompts/fix_run_gates_wait_form_sandbox_task_prompt.md`.
- **Traversal:** its `## The goal` items 1–5 in order, then its `## Constraints` bullets in order.
- **Decision rule:** a path is reached when the item names it as a file to change or to use, and it is durable corpus text. Application source, its tests and its header comments are excluded.

**D3 — standing-artifact rows (procedure).**
- **Artifact:** `harness-runs/lessons.md`. First step, runnable: `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names `run-test-suite.sh`, the Run gates phase, `docs/sandbox-verification.md` or a process-liveness check. D3 reaches no rule as of this plan, so it contributes no row. The four lessons this plan honours are cited in the tasks instead: the bounded-retry rule, the hand-measured-figure rule, the measurement-seam rule and the "not yet measured" rule.

**Closure invariant:** every site D1, D2 or D3 reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` (the opening `**Who reads this:**` paragraph, `## 5. Failures and their follow-ups`, `## 6. The unresolved points, settled or not`) | — | D2, goals 1 and 5 | `change` | Task 4 |
| 2 | `docs/development.md` → *"Regenerating this repository's adoption after a `cli/templates/` change is one forced self-adopt run"* | — | D2, goal 4 | `no-change` | The recipe is used, not changed. Task 3 produces its outcome for the one file and argues why. |
| 3 | `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates` (*"A `--wait` refusal (no run in flight, nothing on stdout) is the no-verdict-line case below."*) | — | D1, `run-test-suite.sh` | `no-change` | The wire is unchanged. A refusal still means no run in flight, and it now arrives only for a run that is gone. |
| 4 | `plugin/instructions/code_review_instructions.md` → the *"Run the gates, because the implementers this branch's plan dispatched ran no suite"* step | — | D1, `run-test-suite.sh` | `no-change` | It quotes the run and wait forms and their lines, all unchanged. |
| 5 | `plugin/instructions/code_review_fixes_instructions.md` → the *"Run the gates, because the implementers this flow dispatched ran no suite"* step | — | D1, `run-test-suite.sh` | `no-change` | As row 4. |
| 6 | `plugin/instructions/user_review_fixes_instructions.md` → the *"Run the gates, because the implementers this flow dispatched ran no suite"* step | — | D1, `run-test-suite.sh` | `no-change` | As row 4. |
| 7 | `plugin/agents/test-fix-plan-writer.md` (the marker-line block) | — | D1, `run-test-suite.sh` | `no-change` | The log marker lines are unchanged. Task 1 keeps them byte-exact. |
| 8 | `plugin/commands/branch-implement-plan-semi-autonomous.md` → *"Phase G: Run gates"* | — | D1, `run-test-suite.sh` | `no-change` | It names the wrapper only. |
| 9 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` → *"a Run gates phase"* | — | D1, `run-test-suite.sh` | `no-change` | It names the wrapper only. |
| 10 | `plugin/docs/AUTONOMOUS_FLOW.md` → the Run gates phase row | — | D1, `run-test-suite.sh` | `no-change` | It names the wrapper's location and its runner only. |
| 11 | `docs/watcher.md` → the `run-test-suite.sh` row of the scripts table | — | D1, `run-test-suite.sh` | `no-change` | It states what the wrapper runs and prints, all unchanged. |
| 12 | `docs/config.md` → the `commands.test` row | — | D1, `run-test-suite.sh` | `no-change` | It names the wrapper as the runner only. |
| 13 | `docs/cli.md` → *"Two families land in `scriptsDir`, and only one of them is generated."* | — | D1, `run-test-suite.sh` | `no-change` | The script stays an outer-loop script copied verbatim. |
| 14 | `cli/README.md` → the *"Two script families live there"* paragraph | — | D1, `run-test-suite.sh` | `no-change` | It names the script family only. |
| 15 | `cli/templates/claude/settings.autonomous.json` → the `_README` line *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS"* | template | D1, `run-test-suite.sh` | `no-change` | The invocation strings and the agent-invocable set are unchanged. The constraints forbid adding a sandbox entry. Its worked-example copy is row 21. |
| 16 | `cli/templates/state-dir/test_run_logs/README.md` (*"Beside each log sit `<label>.running`, the in-flight run's PID"*) | template | D1, `run-test-suite.sh` | `no-change` | The file still holds the run's PID. Its mtime becoming the heartbeat is the wrapper's internal contract, stated in Task 1's header. Editing the template would also owe the self-adopted copy (row 17). |
| 17 | `harness-runs/test_run_logs/README.md` (the same sentence) | self-adopted copy | D1, `run-test-suite.sh` | `no-change` | As row 16. It stays byte-identical to its template. |
| 18 | `docs/work-report-research/test-fix-plan-writer.md` (*"mirrored in `scripts/run-test-suite.sh:18–22` and `cli/test/run-test-suite.test.mjs:83–85`"*) | — | D1, `run-test-suite.sh` | `no-change` | This is a research record, not this branch's to edit. Task 1 keeps lines 1–22 of the script where they are, and Task 2 keeps lines 1–88 of the test line-for-line, so both citations still land. |
| 19 | `docs/work-report-research/statistics-plan-writer.md` (*"after `run-test-suite.sh task_supervised` passes"*) | — | D1, `run-test-suite.sh` | `no-change` | A research record of a past flow. The label form it quotes is unchanged. |
| 20 | `cli/templates/scripts/README.md` → *"The other family in this directory is not generated."* (the *"Run gates wrapper `run-test-suite.sh`"* naming and the *"`run-test-suite.sh` is run once per Run gates phase … prints only `pass` or `fail <log path>`"* sentence) | — | D1, `run-test-suite.sh` | `no-change` | It describes only the run form: what it runs, where it logs and the two lines it prints. All of that is unchanged. It says nothing of the wait form or the liveness check. |
| 21 | `examples/notes-app/.claude/settings.autonomous.json` → the `_README` line *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS"*, plus its `run-test-suite.sh` `allow`, `deny` and `sandbox.filesystem.denyWrite` entries | worked-example copy | D1, `run-test-suite.sh` | `no-change` | The worked example's frozen profile, the mirrored counterpart of row 15. As row 15: the invocation strings and the agent-invocable set are unchanged, and the constraints forbid adding a sandbox entry. |
