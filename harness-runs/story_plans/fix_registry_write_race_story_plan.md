# Story: Close the run-registry lost-update race, bound the usage wait, and bound a hung test

## Context

`fix_registry_write_race` closes a lost-update race in the run registry. 0.4.0's job mode made it reachable, and it hangs `cli/test/watcher-remote-job.test.mjs` → *"a reset 2 seconds ahead -> the run completes in the same job"*. The branch also bounds the two waits that the race's empty value turns into forever: the job-mode usage wait and the local watcher's usage auto-resume with its launch hold. Finally it puts a bound on the test suite, so one hung case can no longer hold gate 4 of `scripts/run-gates.sh` indefinitely. All code work is in the `cli` layer. The watcher, its library and `remote-run.sh` are templates under `cli/templates/scripts/`, and their tests are under `cli/test/`. The last task is the `general` catch-all, which updates `docs/`.

**The root cause, verified against the code.** `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_registry_set` is an unlocked `jq` read, then a `mktemp` write, then an `mv`. The `mktemp` takes no directory argument, so the temp file lives in `$TMPDIR`. That means the prompt's assumption that "the `mv` swap is atomic" does not hold today: a cross-filesystem `mv` is a copy, and an unlocked reader can see a partly written file. `hr_registry_init`'s `[ -f ] || printf >` has a second race: a reader's init can truncate a registry a writer just created. Separately from the lock, three writers order their writes against `PAUSE` in a way no lock can fix:

- `usage_gate`'s pause side touches `PAUSE` **before** it writes `paused_by usage`.
- `job_control_poll` touches `PAUSE` before it writes `pause_reason user`.
- `job_budget_pass` and `job_auto_resume`'s re-drop do the same with `pause_reason budget`.

A stub or engine that acknowledges inside that window gets classified by `classify_run_exit` as `overload` rather than `usage`, `user` or `budget`. So the fix has three parts: (1) a `mkdir` lock with its temp file in the registry's own directory and an atomic create; (2) a multi-key `hr_registry_set`, so pairs land in one write; (3) every reason or tag written **before** its `PAUSE` is dropped.

**The candidate approaches, checked.** Serializing `hr_registry_set` with a `mkdir` lock is right. Two details decide whether it is correct:

- `$$` is the parent's pid inside `spawn_engine`'s `( … ) &` subshell, and bash 3.2 has no `BASHPID`. So lock ownership is a per-call unique token, and staleness is judged on age, never on pid liveness.
- The jq floor is 1.5, so the multi-key program cannot use `$ARGS` or `--args`.

Unlocked reads stay safe once the temp file sits beside the registry. Re-deriving the reset time from the stream, as the prompt offers for finding 2, is **not** planned: after a pause the stream holds only the pre-pause events. Those are exactly what the gate read when it computed the value that was lost, and `usage_assess` skips every record that is not `running`. The gate's own one-hour fallback, named once as a constant and shared by both sites, is the repair. `job_usage_wait_ok`'s comment is only half wrong. An empty `usage_resume_at` with `paused_by` **also** empty really does mean the gate already dropped `RESUME`. An empty `usage_resume_at` with `paused_by usage` still set means the value was lost. Task 4 tells the two apart.

**Scope boundaries.**
- Several copies under this repository's own `scripts/` directory (for example `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh`) are `init`'s self-adoption output. They already differ from the templates, and this branch does not edit them: a maintainer's `init --force` refreshes them.
- Gate 6a's and gate 11's local failures and the version bump are out of scope, per the task prompt.
- The usage gate's unchanged arm that leaves a paused, tagged run alone when its working copy cannot be reached is out of scope, and Task 4 says so in its own body.

**Hand-run measurement (not a task).** The prompt asks for the job-mode usage case to be *"run enough times under load to show the race closed"* and for the method to be recorded. The lessons ledger bars a figure measured inside a session from a document of record. So Task 7 ships an opt-in repeat seam, and Task 8 records in `docs/development.md` → Gate 4 the command, the load it creates and what counts as a pass. The figure itself is taken **by hand**, outside any headless session, by a maintainer running that command. Until then Gate 4 records it as not yet measured.

**Top risks:** The likeliest failure is a lock that is correct in the common case but deadlocks or loses writes in the edge cases:
- a holder killed mid-write, which the stall watchdog does to the engine subshell;
- two breakers of one stale lock;
- a subshell sharing its parent's `$$`.

Task 1 guards that with a stale-lock case and a many-process concurrent-writer test that must fail against today's writer before the fix lands. The second risk is a fix proven by one green run of a flaky case. Tasks 1–3 therefore prove closure with deterministic invariants: every key written is present, and a pair is never seen split. Task 7 adds the repeat seam rather than relying on a single pass. The third risk is a "bounded" wait that a lost value still escapes, or that gets tangled with a legitimate empty value. Task 4 separates the two empty states by `paused_by`, and Task 5 drives the exact empty-value record in both the job and the local watcher.

Manual setup required:
- None for infrastructure. The one hand step is the measurement above: a maintainer runs Task 7's repeat command, as Task 8 records it in `docs/development.md` → Gate 4, on an idle machine outside any headless session, and writes the result into that paragraph by hand.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that task's commit lands. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to a self-contained `harness-runs/task_plans/fix_registry_write_race/task_<K>_plan.md`. Entries are ordered bottom-up by ship sequence, with the catch-all `general` layer last.

1. [x] **Task 1** — Serialize `hr_registry_set` behind a `mkdir` lock, add multi-key writes and an atomic create, proven by a concurrent-writer suite _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Write the watcher's paired registry keys in one call, and record every pause tag or reason before its `PAUSE` _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Batch `remote-run.sh`'s registry writes, and race a `stop` against watcher writes _(layer: cli)_ _(points: 10)_
4. [x] **Task 4** — Repair a usage pause whose `usage_resume_at` was lost, and bound the job-mode usage wait by `REMOTE_WAIT_MAX_SECS` _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Drive the lost-reset record through job mode and through the local watcher's `tick` _(layer: cli)_ _(points: 15)_
6. [x] **Task 6** — Give `node --test` a per-test timeout and `runBash` a process-group kill-on-timeout, proven by a deliberately hung watcher _(layer: cli)_ _(points: 15)_
7. [ ] **Task 7** — Bound every job-suite watcher run, and add an opt-in repeat seam for the job-mode usage case _(layer: cli)_ _(points: 10)_
8. [ ] **Task 8** — Document the serialized registry writer, the lost-reset repair, the bounded usage wait and the bounded test suite _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/watcher.md` and the watcher's header, wherever they describe the registry writer, the job-mode usage wait or the local usage auto-resume and launch hold, say what the code now does."*

The watcher's header is a comment in an application source file, so it is outside this register. Tasks 2 and 4 own it in their own bodies. The register covers the durable corpus text that states the same behaviours, plus the test-runner documentation that Task 6's change touches.

**Derivation entry A — corpus files naming the registry writer or the usage pause state, by identifier or in prose (command).** Re-run verbatim from the checkout root:
`git grep -lE 'usage_resume_at|usage_hold|hold marker|paused_by|REMOTE_WAIT_MAX_SECS|wait-poller|hr_registry_set|registry\.json|run registry|[Uu]sage pause|usage-paused|launch hold' -- 'docs/**' 'plugin/**' 'README.md' 'ARCHITECTURE.md' 'cli/README.md' 'cli/templates/**/*.md'`
To list the anchors inside each reached file, run the same pattern with `-n` in place of `-l`. Revised in round 1: the identifier-only pattern missed the same statements made in prose; this pattern is a strict superset of it.

**Derivation entry B — corpus files documenting how the test suite is run (command).** Re-run verbatim from the checkout root:
`git grep -lE 'node --test|npm test' -- 'docs/**' 'README.md' 'ARCHITECTURE.md' 'cli/README.md' 'cli/templates/**/*.md'`

**Derivation entry C — lessons-ledger rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** the standing ledger `harness-runs/lessons.md`. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it governs a behaviour this branch changes, meaning a retry or wait bound, a measurement recorded in a document of record, or a seam shipped for a later measurement.

**Closure invariant:** every file entry A or entry B reaches, and every ledger rule entry C reaches, appears as at least one row below. A file reached with more than one affected anchor carries one row per anchor.

| # | Site (path + symbol or quoted anchor, or standing-artifact row id) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `README.md` → the mermaid edge `"registry.json + one notification per lifecycle event"` and the filename paragraph | — | A, `registry\.json` | `no-change` | names the registry as an artifact; says nothing about how it is written or waited on |
| 2 | `cli/templates/state-dir/autonomous_logs/README.md` → the paragraph opening *"One readable transcript"* (the directory's inventory) | — | A, `registry\.json` | `change` | Task 1 — the lock directory the writer now creates beside `registry.json` joins that inventory |
| 3 | `docs/development.md` → the gate-12 paragraph *"The enable is reached only by a job that ends on a usage pause with decision `wait-poller`"* | — | A, `wait-poller`, `REMOTE_WAIT_MAX_SECS` | `no-change` | procedure for observing the poller enable; `REMOTE_WAIT_MAX_SECS=0` still routes every hosted usage pause to the poller after Task 4 |
| 4 | `docs/outer-loop-verification.md` → the usage-gate rows (*"Acting rows."*, *"Resume."*, *"The usage hold marker flaps"*) | — | A, `paused_by`, `usage_resume_at`, `hold marker` | `no-change` | a measured record at a stated commit; documents of record are not rewritten to describe later code |
| 5 | `docs/remote-execution.md` → `### Resuming without the local watcher`, the **Wait in the job** and **Hand it to the poller** bullets | — | A, `REMOTE_WAIT_MAX_SECS`, `wait-poller` | `change` | Task 8 — the in-job wait now has a bound past the reset for every runner, and a lost reset time is repaired before the choice |
| 6 | `docs/remote-execution.md` → the variables table row `REMOTE_WAIT_MAX_SECS` (*"the longest usage-pause wait a hosted job takes in the job"*) | — | A, `REMOTE_WAIT_MAX_SECS` | `change` | Task 8 — the variable now also bounds the wait past the reset, including self-hosted |
| 7 | `docs/remote-execution.md` → the numbered step *"7. **The decision.**"* | — | A, `wait-poller` | `no-change` | the decision vocabulary and what `continue` does with each value are unchanged |
| 8 | `docs/watcher.md` → §1 `**The status vocabulary — one live state and five a session ends in.**` (*"`remote-run.sh` reads and writes it (`sync`, `stop`)"*) | — | A, `registry\.json` | `change` | Task 8 — states that every writer goes through the one serialized library writer, and that a pair is written in one step |
| 9 | `docs/watcher.md` → §4 `**The usage gate acts on the one signal no run can observe about itself.**` | — | A, `hold marker`, `paused_by` | `change` | Task 8 — the lost-reset repair and its one notification, and the hold marker's bound |
| 10 | `docs/watcher.md` → §2 table row `remote-run.sh` (*"it reads and writes the run registry (`sync`, `stop`)"*) | — | A, `registry\.json` | `no-change` | still true: it reads and writes, through the library |
| 11 | `docs/watcher.md` → §5, §7 (`## 5. Machine-level usage lane`, `## 7. The repository registry`) | — | A, `registry\.json` | `no-change` | the lane and the machine-local repository registry, neither of which this branch touches |
| 12 | `plugin/commands/branch-answer.md` → step 2's **Remote records sync first.** and step 3 | — | A, `registry\.json` | `no-change` | reads the registry; the shape and vocabulary are unchanged |
| 13 | `plugin/commands/branch-pause.md` → steps 1 and 4 | — | A, `registry\.json` | `no-change` | reads the registry's `worktree`; unchanged |
| 14 | `plugin/commands/branch-prompt.md` → step 4 **Collision guard.** | — | A, `registry\.json` | `no-change` | a read-only `jq -e` probe; unchanged |
| 15 | `plugin/commands/branch-resume.md` → steps 1 and 4 | — | A, `registry\.json` | `no-change` | reads the registry; a hand `RESUME` is still the manual way on |
| 16 | `plugin/commands/branch-status.md` → step 2 **Selection** | — | A, `registry\.json` | `no-change` | read-only digest; unchanged |
| 17 | `plugin/commands/branch-user-review.md` → step 2 **Which-branch resolution.** | — | A, `registry\.json` | `no-change` | reads the registry; unchanged |
| 18 | `plugin/instructions/autonomous_pause_and_ledger.md` → the **Usage limit** row (*"watcher records `usage_resume_at` and drops `RESUME` when the window resets"*) and the auto-pause sentence it is contrasted with | — | A, `usage_resume_at` | `no-change` | still true; the repair only makes sure a time is always recorded |
| 19 | `README.md` → the `npm test` line in the development block | — | B, `npm test` | `no-change` | the command is unchanged; the timeout rides inside `cli/package.json`'s `test` script |
| 20 | `docs/cli.md` → the `daemon-path` and `command-resolves` bullets (*"`cd app && npm test`"*) | — | B, `npm test` | `no-change` | an example compound command line, unrelated to the suite |
| 21 | `docs/development.md` → `**Gate 4 — `init` against a throwaway fixture.**` and the paragraphs up to `**Run time, measured.**` | — | B, `npm test` | `change` | Task 8 — the per-test timeout, the bounded `runBash`, and the job-mode repeat command with how it is measured |
| 22 | `docs/development.md` → `**Run time, measured.**` (its table, `node --test --test-reporter=spec test/`, `HARNESS_TEST_CONCURRENCY=1 npm test`) | — | B, `node --test`, `npm test` | `no-change` | a record measured by hand at stated commits; not rewritten |
| 23 | `docs/development.md` → `**Gate 8 — the analyze command, in a session.**` and `**Gate 9 — the example project and the run it carries.**` | — | B, `npm test` | `no-change` | the example project's own `npm test`, not this suite |
| 24 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded by a count or a deadline…"* | — | C, governs the usage wait | `no-change` | the branch conforms to it: Task 4 bounds the wait and sends one notification naming the cause and the way on |
| 25 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session…"* | — | C, governs the recorded measurement | `no-change` | the branch conforms to it: Task 8 records the method, and the figure is a hand step |
| 26 | `harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam that will measure it…"* | — | C, governs the repeat seam | `no-change` | the branch conforms to it: Task 7's seam is opt-in, off by default and behind an environment variable |
| 27 | `ARCHITECTURE.md` → the mermaid node *"the run registry · the teed event log"* | — | A, `run registry` | `no-change` | names the registry as a sentinel exit classification reads; how it is written does not change what `classify_run_exit` reads |
| 28 | `ARCHITECTURE.md` → the `agent_probe` table row (*"a BACKSTOP"* to the run registry), §7's eighth operation **Be identifiable while running.** and the later paragraph citing it (*"making the run registry the sole liveness source"*) | — | A, `run registry` | `no-change` | a liveness-source design choice; this branch does not touch the process probe or what the registry holds |
| 29 | `ARCHITECTURE.md` → the **[shipped]** exit-classification paragraph (*"the `stall_killing` flag in the harness's own run registry"*) | — | A, `run registry` | `no-change` | the classification order and its sentinels are unchanged; Task 2 only moves each tag's write ahead of its `PAUSE`, which makes the paragraph's reading hold in the window it could fail |
| 30 | `cli/templates/state-dir/README-root.md` → *"event logs and run registry under `<state_dir>/autonomous_logs/`"* (the machine-local inventory) | — | A, `run registry` | `no-change` | the directory is ignored by its contents, so Task 1's lock directory beside `registry.json` is already covered; the per-file inventory is row 2's, which Task 1 owns |
| 31 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the control-plane row (*"the run registry and its concurrency cap"*) | — | A, `run registry` | `no-change` | names the registry as a control-plane component; unchanged |
| 32 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the table row `**Usage pause**` (*"yes, when the window resets"*, *"a recorded resume time the gate acts on"*) | — | A, `[Uu]sage pause` | `no-change` | Task 4 makes it true in the case it failed: a lost resume time is repaired, so there is always a recorded time the gate acts on |
| 33 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The stranded run.** (*"the tag … is written at the request"*) | — | A, `[Uu]sage pause` | `no-change` | Task 2 writes the tag before the `PAUSE`, which is still at the request; the bullet is a historical lesson about a cleanup pass, not a statement of the current ordering |
| 34 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → **Self-pause on API overload.** (*"Unlike the usage pause, nothing auto-resumes this one"*) | — | A, `[Uu]sage pause` | `no-change` | the overload self-pause is untouched, and the usage pause still auto-resumes |
| 35 | `plugin/instructions/autonomous_pause_and_ledger.md` → §2.5 step c (*"this pause apart from a usage pause or a hand-dropped …"*) | — | A, `[Uu]sage pause` | `no-change` | the `(API overload)` suffix and the log-tail distinction are unchanged |
| 36 | `plugin/commands/branch-status.md` → the opening description (*"It reads the run registry and a bounded tail…"*) | — | A, `run registry` | `no-change` | read-only; the registry's shape is unchanged |
| 37 | `docs/outer-loop-verification.md` → **A real GitHub Actions run.** (its `usage-paused` mention) | — | A, `usage-paused` | `no-change` | a measured record at a stated commit; not rewritten |
| 38 | `docs/remote-execution.md` → the mermaid edge `"enable on a usage pause"` and **The resume poller** billing paragraph (*"while a run is waiting on a usage pause"*) | — | A, `[Uu]sage pause` | `no-change` | the poller is still enabled on a usage pause; Task 4's bound also ends in `wait-poller` |
| 39 | `docs/remote-execution.md` → the `gh run cancel` table row and **Stopping one run** (*"a usage-paused run waiting for the poller"*) | — | A, `usage-paused` | `no-change` | the stop marker's reach is unchanged; Task 3 only batches `stop`'s record write |
| 40 | `docs/remote-execution.md` → the notifications **Decision:** (*"the reset time for a usage pause"*) | — | A, `[Uu]sage pause` | `no-change` | a usage pause's `paused` notification still names the reset time (the repaired one when it was lost); the bound's notification is a distinct event, stated in row 5's bullet, which Task 8 owns |
| 41 | `docs/remote-execution.md` → the three verified-assumption table rows (the `workflow_dispatch` / `GITHUB_TOKEN` row, *"The poller enabling on a usage pause"*, the upload-artifact row) | — | A, `[Uu]sage pause`, `usage-paused` | `no-change` | assumptions about GitHub behaviour; unchanged |
| 42 | `docs/watcher.md` → §7 **Not the run registry.** and the third row shape paragraph (*"a `stateDir` to read a run registry from"*) | — | A, `run registry` | `no-change` | the machine-local repository registry, which this branch does not touch (the same class as row 11) |
