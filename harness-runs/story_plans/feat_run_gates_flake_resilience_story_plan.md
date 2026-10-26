# Story: One test-time multiplier, `HARNESS_TEST_TIME_SCALE`, for the timing-bound test cases

## Context

This branch adds one test-time multiplier, `HARNESS_TEST_TIME_SCALE`, so that this repository's timing-bound test cases tolerate a slow or loaded host. Today every such limit under `cli/test/` is a fixed constant sized for a fast, idle machine. A full gate run on 2026-10-26 failed 52 of these cases with a second suite running alongside it, and 8 with no other suite running. Every one of them passed when its file ran alone. The scope is the rewritten task prompt committed at `f1e49b05`. The clarification answer `harness-runs/clarifications/feat_run_gates_flake_resilience/answer_1.md` confirms that only the multiplier ships. This branch plans no concurrency cap, no timing measurement, no gate-log diagnostics, no re-run step, no `commands.testFile` key and no Phase G change. It also changes nothing in `scripts/run-gates.sh`, `run-test-suite.sh` or any `plugin/` document.

**Every limit the multiplier touches is a ceiling, not a wait.** A polled wait returns as soon as its condition holds, and `cli/test/helpers/fixture.mjs` → `runBounded` kills a process only if it is still running when its timer fires. So scaling a ceiling costs a passing run nothing. It only lengthens how long a broken case waits before it fails. Two kinds of duration stay fixed, and the plan names each one:
- a window a case waits out on purpose so it can assert that something does **not** happen;
- a duration that is itself the behaviour under test.

Task 1 writes the full list into the new helper's header, and Tasks 2 and 3 edit only the sites listed as scaled.

**The helper and its numbers.** These are decided here so that no implementer has to choose them.
- **The helper.** Task 1 adds `cli/test/helpers/timing.mjs`, modelled on `cli/test/helpers/concurrency.mjs` (`CONCURRENCY_VARIABLE`, `caseConcurrency`). It reads the variable once, at module load, through an exported constant `TIME_SCALE_VARIABLE = 'HARNESS_TEST_TIME_SCALE'`. It never derives the value from the host's load.
- **Its exports.** `parseTimeScale(value)`, `TIME_SCALE`, `DEFAULT_TIME_SCALE`, `MAX_TIME_SCALE` and `scaleBound(base)`. `scaleBound(base)` returns `Math.ceil(base * TIME_SCALE)` for a positive-integer `base`. The function is unit-agnostic, so it scales milliseconds, poll-attempt counts and tenths-of-a-second counts alike. It always returns a positive integer, which `runBash`'s own `Number.isInteger(timeoutMs)` check requires.
- **Validation.** Unset (`undefined`) takes the default. A value matching `^[0-9]+(\.[0-9]+)?$` that is above 0 and at or below the cap is the scale. Anything else, including the empty string, `0` and a value over the cap, throws at load with the value quoted and the accepted range stated. This follows `caseConcurrency`, so a bad value fails every file that imports the helper, and the helper's own load, by name.
- **Default `2`.** Every failing case passed alone, so the fixed limits are sized for a host doing one file's work. A full run alone already failed 8 cases, and the same run beside a second suite failed 52. Failures grow with the load on the host, and the load those figures name is two suites' worth of work. A multiplier of 2 gives every ceiling twice its old budget, which covers that doubled load. Because a ceiling costs a passing run nothing, the only price of the default is that a genuinely broken case takes up to twice as long to fail. This is a judgement from the prompt's figures, not a measurement. The branch takes no timing run as evidence (`harness-runs/lessons.md` → *"A plan never makes repeated in-run timing runs its acceptance evidence"*). With the variable set to `1`, every bound is exactly today's value.
- **Cap `5`.** The largest bound that gets scaled is `cli/test/test-timeout.test.mjs` → `CHILD_TEST_TIMEOUT_MS`, at 240 000 ms. At 5 it becomes 1 200 000 ms, which stays below the suite's `--test-timeout=1800000` (`cli/package.json` → `scripts.test`) with 600 s to spare. That margin keeps true one rule the existing headers state: a bound always fires before the runner kills the file and strands its detached processes. A cap of 7.5 or more would break it.

**The work is cut into four single-layer tasks, in bottom-up ship order.**
- **Task 1** (`cli`) creates the helper. It moves the shared watcher bound `TICK_TIMEOUT_MS` onto the helper and exports it. Its new test suite proves the parsing and validation, and shows that `TICK_TIMEOUT_MS` scales.
- **Task 2** (`cli`) moves the four watcher suites' ceilings onto `scaleBound`.
- **Task 3** (`cli`) does the same for the five remaining suites that carry a ceiling.
- **Task 4** (`general`) documents the variable in `docs/development.md` → Gate 4, the place this repository documents running its tests. It also corrects the one sentence there that states a bound which now scales.

Once `fix_headless_run_host_sleep` is rebased, its suites adopt the multiplier through Task 1's exported `TICK_TIMEOUT_MS` and `scaleBound`. This branch does not touch those suites.

**Top risks:**
- **A fixed bound that gets scaled.** If a does-not-happen window or a discriminating bound such as `init.test.mjs` → `RETURNS_PROMPTLY_MS` is scaled, passing runs either slow down or stop being able to fail. Task 1's header list and the per-site enumerations in Tasks 2 and 3 guard this: each names every site and its disposition, and each task's verification greps that the fixed sites are untouched.
- **A broken "unset" case.** A parent run that has `HARNESS_TEST_TIME_SCALE` exported would leak it into the helper's own tests. Task 1 therefore runs every load-time case in a child whose environment has the variable deleted or set explicitly.
- **A cap that drifts above the suite timeout.** Task 1's header argues the cap from the two named figures, and Task 4's documentation states the cap.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. Only the committing role flips a marker to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational progress markers only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_run_gates_flake_resilience/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Add the `HARNESS_TEST_TIME_SCALE` helper `cli/test/helpers/timing.mjs`, scale and export `TICK_TIMEOUT_MS`, and test the helper _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Scale the watcher suites' ceilings through `scaleBound` _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Scale the remaining suites' ceilings through `scaleBound` _(layer: cli)_ _(points: 15)_
4. [ ] **Task 4** — Document `HARNESS_TEST_TIME_SCALE` in `docs/development.md` → Gate 4 _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"**Document it** where this repository documents running its tests, with one line on when to raise it (a slow machine, a small CI runner)."*

**Derivation entry — files carrying a test-run command line (command).** Re-run verbatim from the repository root:
`git grep -nE "^(HARNESS_[A-Z_]+=[^ ]+ )*(npm test|node --test)" -- "*.md" ":!harness-runs" ":!examples/notes-app"`

**Derivation entry — prose stating a bound this branch scales, or a sibling test variable (command).** Re-run verbatim from the repository root:
`git grep -nE "TICK_TIMEOUT_MS|RUN_TIMEOUT_MS|HUNG_WAIT_MS|CHILD_TEST_TIMEOUT_MS|POLL_LIMIT|KILL_WAIT_TENTHS|240-second|HARNESS_TEST_CONCURRENCY|HARNESS_TEST_TIME_SCALE" -- "*.md" ":!harness-runs" ":!examples/notes-app"`

Neither entry reaches a standing-artifact row. No standing matrix under `harness-runs/` covers `docs/development.md`, so no procedure entry is owed. `harness-runs/` and `examples/notes-app/` are excluded from both entries. The first is run artifacts, and the second is a frozen capture plus that project's own toolchain (`.claude/context/conventions.md` → `## Documents of record`).

**Closure invariant:** every site that either derivation entry reaches appears as a row below. After Task 4, a re-run's hits are a subset of these rows plus the new Gate 4 lines Task 4 adds, which carry `HARNESS_TEST_TIME_SCALE`.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `README.md` → `### See it without adopting it` (the `npm test` line inside `cd examples/notes-app`) | — | entry 1, `npm test` | `no-change` | This is the example project's own test command, not this repository's suite. The multiplier does not reach it. |
| 2 | `docs/development.md` → `## 5. Verifying a change` → **Gate 4 — `init` against a throwaway fixture.** (its `npm test` block) | — | entry 1, `npm test` | `change` | Task 4 adds the `HARNESS_TEST_TIME_SCALE` paragraph and its fenced command to this gate. |
| 3 | `docs/development.md` → **A hung case cannot hold the gate.** (*"bounds its hung child at 2 seconds, inside its own 240-second `--test-timeout`"*) | — | entry 2, `240-second` | `change` | Task 4. The 240-second child timeout and the watcher bounds this paragraph names now scale. The 2-second bound stays fixed. |
| 4 | `docs/development.md` → **How the job-mode usage race is shown closed.** (`HARNESS_JOB_USAGE_REPEAT=40 node --test …`) | — | entry 1, `node --test` | `no-change` | This is a by-hand evidence command. Its bounds scale like those of any run, and nothing the paragraph states becomes false. |
| 5 | `docs/development.md` → **Run time, measured.** (`node --test --test-reporter=spec test/`) | — | entry 1, `node --test` | `no-change` | This is a measurement record of what was run at a stated commit. Editing it would falsify the record. |
| 6 | `docs/development.md` → **Where the time goes.** (`HARNESS_TEST_CONCURRENCY=1 npm test`) | — | entry 1 `npm test`; entry 2 `HARNESS_TEST_CONCURRENCY` | `no-change` | Task 4 places its new paragraph directly after this block (row 2) and leaves the block's own text unchanged. |
| 7 | `docs/development.md` → **Gate 9 — the example project and the run it carries.** (its `npm test` block) | — | entry 1, `npm test` | `no-change` | This runs the example project's own commands, not this repository's suite. |
