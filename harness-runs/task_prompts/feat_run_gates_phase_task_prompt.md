A new **Run gates phase** in the autonomous flow. It is the only place `<test_cmd>` runs, and it runs once at the
end of the end-of-branch phase and once at the end of each user-review fix round. Today the suite runs once for
every implemented unit, and that is what this branch replaces.

> ⚠️ **Locate every anchor in this prompt by quoted text or heading, never by line number.**

---

## Why

`plugin/agents/layer-implementer.md` runs `<test_cmd>` for every unit it implements: every task, and every
code-review, skeptic and user-review fix item. In this repository one full run
(`bash scripts/test.sh` → `scripts/run-gates.sh`) took about 220 s on 2026-09-25, on a 10-core machine. The
`fix_gate_6a_worktree_git_file` run had only 3 tasks, and it still ran the suite at least 18 times, about an hour.
Branches with 15 tasks and a full review cycle pay several times that. Autonomous runs will soon execute on
remote GitHub Actions runners, which have far fewer cores, and there that cost may be enough to rule the plugin
out.

The earlier `chore_test_suite_run_time` branch made each suite run cheaper. That is not enough on its own. No
realistic speed-up shrinks the suite by 5×, so running it once per unit stays expensive at any speed. The number
of runs has to come down too, and it has to come down for every adopter, whose test command may take 5 seconds
or 40 minutes.

## The phase

- **Where it runs.**
  - After the end-of-branch phase, once every end-of-branch reviewer has finished and its fixes have landed. It
    runs before the docs, statistics and lessons phases.
  - At the end of the user-review fix phase, before the statistics update and anything else that follows the
    reviews.
- **What the orchestrator does.** It runs the full `<test_cmd>` through a wrapper and reads only whether it
  passed. The orchestrator does not know what the gates are and never reads their output.
  - **All green:** the phase's ledger entry is flipped and the flow goes on.
  - **Any failure:** a fix loop runs, shaped like the user-review one. A fix-plan writer turns the failures into
    a split fix plan, a plan reviewer approves it, the fixes are implemented and committed through the existing
    unit loop, and the phase runs the gates again.
- **Cap.** The loop is capped at 5 rounds, the same cap as the plan-writing loop and the end-of-branch review
  loops. A failure still there after the cap ends in a clarification park, never an endless loop.

## Decisions already taken

- **The wrapper keeps the orchestrator's context clean.** It writes the full gate output to a log file under the
  run-artifact tree and prints one line: `pass`, or `fail` plus the log path. The fix-plan writer reads the log.
  Across iterations the wrapper either overwrites the log or versions it per round. The plan chooses which, and
  says why.
- **No baseline run.** Every failure the phase sees is treated as the branch's to fix. Every branch fixes its own
  gate failures before it merges, so the default branch stays green, and a failure on a branch was most likely
  caused by it and has to be fixed either way. A worktree run on the merge base is rejected: it costs another
  full suite run, and when docs retrieval is on it also needs the retrieval setup. A failure the branch cannot
  fix, such as an environment problem, is what the cap and the park are for.
- **Gates run nowhere else in the flow.** Implementers stop running `<test_cmd>` per unit.
- **No plan asks for a test run before the phase.** A plan's `**Verification:**` bullet is an instruction the
  implementer carries out, so a plan that names `<test_cmd>`, a gate script it runs, or even a single targeted
  test file brings the per-unit run back through the plan. A targeted test is excluded too, for the same reason
  as the first rejected option below: picking the right one means an implementer has to search for and
  understand what each test covers, and that fills its context and makes its decisions worse. This holds for every plan written before the Run gates phase: the task plan, the code
  review and skeptic review findings, and the user-review fix plan. It also holds for the phase's own fix plan,
  since the phase reruns the gates itself once the fixes land. Each of those writers stops asking for a test
  run, and each of their reviewers raises one as a finding. `<typecheck_cmd>` is not a test run and stays.
- **One exception: a unit that creates or edits a test file runs that file.** It runs only the test files it
  wrote, never the suite and never a gate. There is nothing to search for, because the unit just wrote the file,
  and without this a project that adds or changes unit tests has no way to check them before the phase.
- **The exception is best-effort.** The unit runs the file only when it has a way to run one file on its own.
  When it has none, it skips the run and does not raise a blocker, because the Run gates phase runs that test
  anyway.
- **Implementers keep `<typecheck_cmd>` per unit.** In this repository it is `bash scripts/typecheck.sh` →
  `npm run build` → `tsc`. It took 1.46 s on 2026-09-25, so the per-unit check stays and the suite is the only
  thing moved. The check sees only the compiled CLI: a unit that changes only plugin prose gets nothing from it,
  and the Run gates phase is what covers that unit.

## Considered and rejected, recorded so the planner does not reopen them

- **An agent runs only the gates its change could affect.** To choose well, an implementer would have to read
  what every gate covers. That costs more context than the time saved and makes the implementation worse.
- **Implementers or end-of-branch reviewers run the suite at chosen points.** This still means several full runs
  per session. A late failure also has nowhere to go: its fix would re-enter phases the flow-progress ledger has
  already closed. The phase's own fix loop is what solves that.
- **Leave the gates to CI.** The harness does not integrate with GitHub, and where a session runs will be the
  adopter's choice. CI can be an addition an adopter makes. It cannot replace this phase.

## Establish, do not assume

- **What happens when an adopter has no typecheck.** `commands.typecheck` can be `<none>`, and
  `plugin/agents/layer-implementer.md` already covers that case. Confirm that its per-unit verification still
  reads correctly with `<test_cmd>` removed from it.
- **How an implementer runs one new test file.** The config carries `commands.test` for the whole suite and
  nothing for a single file, and how to run one file differs from stack to stack. Settle where the implementer
  learns that command, for example a new config field or the layer's conventions document. When there is no such
  command, the unit skips the run and does not raise a blocker, as the exception above already says.
  - **A candidate already in place: the test wrapper itself.** The `scripts/test.sh` template that `init` writes
    (`cli/templates/scripts/test.sh`) passes its arguments on to the last command of its line, and its own comments
    say that whether that command accepts a bare file path is up to the command. A test runner usually accepts one:
    `npx vitest run "$@"` does, so `bash scripts/test.sh src/test/unit/foo.test.ts` runs one file. A line ending in a
    sub-command's own flags does not. Using the wrapper needs no new config field and adds no new command to
    allow-list. Two things are still open. First, how the implementer learns that this project's line accepts a
    file path, for example a line in the layer's conventions document. Second, this repository's own wrapper: its
    line is `bash scripts/run-gates.sh`, which ignores its arguments, so passing a file path runs the full suite.
    Here the wrapper is exactly the per-unit suite run this branch removes. Confirm this candidate or reject it, and
    say why.
- **Every place the contract reaches.** A new phase touches:
  - the flow-progress ledger for both engines;
  - the planning flow graph (`task_plan_writing.graph.json`) is not touched; this phase is not part of planning;
  - `/autonomous-sdlc-harness:branch-status`;
  - resume from a paused or parked run;
  - the supervised and semi-autonomous flows;
  - `plugin/docs/AUTONOMOUS_FLOW.md`;
  - every document that states when `<test_cmd>` runs.

  The plan names each one it changes.
- **How the new fix-plan writer and its reviewer relate to the existing roles.** The fix-plan instructions are
  new, modelled on `plugin/instructions/user_review_fix_plan_writing_instructions.md`. Settle whether the writer
  and the reviewer are new agents or existing ones dispatched with new instructions, and argue it against the
  `tools:` allowlist rule in the always-loaded project file.

## Out of scope

- The speed of this repository's own suite. `chore_test_suite_run_time` owns that.
- Running a session on GitHub Actions.

## Acceptance

A run cannot launch another autonomous run, so each criterion below is shown by a test under `cli/test/` where
the behaviour lives in code: the wrapper, the flow graph, or the ledger and resume logic. Where it lives in
instruction prose, it is shown by a walk of the instructions, step by step, recorded in the story index.

1. With every gate green, the flow runs `<test_cmd>` exactly once per Run gates phase, and implementers no longer
   run it per unit. They still run `<typecheck_cmd>` per unit.
2. The wrapper prints only `pass`, or `fail` plus the log path, and writes the log the way the plan chose.
3. A failing gate opens the fix loop, and the loop returns to the gate run after the fixes land.
4. A failure still present after 5 rounds parks the run and does not loop further.
5. No plan writer asks for a test run in a `**Verification:**` bullet, whether the full suite, a gate or a test
   file the unit did not write, and each plan reviewer raises one as a finding. The one run allowed is a test
   file the unit created or edited, and only when the unit has a way to run one file. Without one, the unit
   skips the run and raises no blocker.
6. `bash scripts/run-gates.sh` prints no new failure.
