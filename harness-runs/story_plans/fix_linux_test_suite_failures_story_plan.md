# Story: Make the CLI test suite pass on Linux (the three non-jq failure groups)

## Context

This branch makes `npm test --workspace cli` pass on Linux, apart from sandbox3b1d's run-analytics jq failures, by fixing the five failing tests the task prompt lists, which fall into three groups. It also decides, for each group, whether it is a test that assumes macOS or a real Linux defect in the code under test. The baseline is the 2026-10-30 measurement in Gate 15's container on `dev` at `1a41540c`, which the task prompt records. The user's answer to park 1 (`harness-runs/clarifications/fix_linux_test_suite_failures/answer_1.md`) states that the suite was measured again, on `dev` at `66e1e6c5`, which covers #224's new test files. Since then only #227 has landed, and it touches nothing on these three groups' paths. No fresh measurement is taken here. Before merging, the user re-runs the container suite on this branch's head. A failure there that fits none of the three groups comes back as a plan revision.

**The verdicts, which every task records in its own headers and comments:**

- **Group 1 — `spawn E2BIG`: test assumptions in both tests. The code is not at fault.** Linux limits each single argument or `NAME=value` environment string to 131072 bytes (`MAX_ARG_STRLEN`, on 4 KiB pages). macOS has only the total limit.
  - `remote-control-mention.test.mjs` hands its 210,000-byte diff to the `gh` stub in the environment variable `STUB_PR_DIFF`.
  - J6 in `watcher-stall-reset-payloads.test.mjs` hands the whole `remote-run.sh` to `bash -c` as one argument, in `commitInCopy`'s `printf "%s" "$1" | git hash-object`.
  - The real mention path (`cli/templates/scripts/remote-run.sh` → `control_mention_context_extra`) keeps the diff in the unexported shell variable `GH_OUT` and writes it with the builtin `printf '%s\n' "$GH_OUT" >"$dir/diff.patch"`. `mention_cap` then cuts it with file operations. No argument and no environment value ever carries the diff.
- **Group 2 — `Author identity unknown`: a test assumption.**
  - Both failing commits run inside the fixture's bare `origin`: the test's own `commit-tree` there, and the `post-receive` hook's.
  - `cli/test/helpers/fixture.mjs` → `seedOrigin` gives that repository no identity, and `ISOLATED_ENV` points `GIT_CONFIG_GLOBAL` at `/dev/null`. Git then guesses an identity from the host name. That works on macOS, whose host names carry a domain, and fails in a container, whose host names do not.
- **Group 3 — the sweep's fetch bound: a code defect.** It depends on whether a terminal is attached, not on Linux.
  - `cli/templates/scripts/cleanup-merged-worktrees.sh` → `run_bounded` skips the process-group kill whenever `/dev/tty` opens, and then signals only the direct child.
  - Gate 15's recipe gives the suite a controlling terminal: `docker run -it … bash`, then `su - probe`. So the `git` stand-in died and its `sleep 300` kept the output pipe, which accounts for the measured 300.1 s.
  - The real case this affects is a watcher started from a terminal. It reads the sweep through a pipe, so it would block for as long as a hung transport lives.
  - **Confirmed by hand on macOS** (park 2 answer, `harness-runs/clarifications/fix_linux_test_suite_failures/answer_2.md`). This run's command sandbox refuses `script` a pseudo-terminal (`script: openpty: Operation not permitted`), so the run could not take the reproduction itself. The user ran the proving case from a macOS terminal, outside the sandbox, against the unchanged script: `npm test --workspace cli -- --test-name-pattern="terminal is attached" test/outer-loop-scripts.test.mjs`. It failed with *"the sweep took 53.0s against a 3s ceiling — the fetch's transport is still holding the pipe"*. That reproduction and the user's pre-merge Linux container run are the branch's proof for group 3. The sandbox stays as it is, with no `sandbox.optOut`.

**Each group gets a guard that runs on macOS**, so that a later test cannot bring the same mistake back unseen:

- **Group 1:** Task 1 makes the fixture runners refuse any single argument or environment string over the Linux bound.
- **Group 2:** Task 1 also points `GIT_CONFIG_GLOBAL` at a checked-in file that sets `user.useConfigOnly = true`, so git refuses to guess an identity on every host.
- **Group 3:** Task 3 adds a case that runs the sweep under a pseudo-terminal through `script`. Where `script` is refused a pseudo-terminal before the sweep runs, as under the run's sandbox, the case skips and names the refusal.

**Task order and dependencies.** The tasks run in bottom-up order: three `cli` tasks, then the `general` catch-all task, which brings the self-adopted root copy of the sweep up to date and documents the change.

- Task 1 owns `cli/test/helpers/fixture.mjs` and every change to it. Task 2 only consumes that file's new single-string guard.
- Between Task 1's commit and Task 2's, the two group-1 tests fail on macOS too. Task 1's guard causes this on purpose: it is how Task 2's own test run shows the fix on a macOS host.
- Task 3 owns the sweep template. Task 4 copies it byte for byte to the root `scripts/` and never edits the template.

**Top risks:**

1. **`user.useConfigOnly` could surface a test that passes on macOS only because git guesses an identity.** The Linux measurement already ran every `ISOLATED_ENV` subprocess with no usable guess, and only group 2 failed. Even so, a test that has never run on Linux, or a subprocess outside `ISOLATED_ENV`, could still depend on the guess. Task 1 guards this risk: it states the residual it does not close, and Phase G's full macOS run is where any such test shows up.
2. **The pseudo-terminal case could fail on one platform for a reason unrelated to the sweep.** BSD `script` and util-linux `script` take different arguments, and util-linux `script` reacts to stdin reaching EOF. Task 3 guards this risk. The case must prove that a controlling terminal was really present before it asserts on the timing. It skips, naming the reason, in two cases only: when `script` is not installed, and when `script` reports an `openpty` / `tcgetattr` (util-linux: *"failed to create pseudo-terminal"*) refusal and the sweep never ran.
3. **The refused-pseudo-terminal skip means the sandboxed gates never run the terminal case.** A skip there could hide a broken fix. Task 3 keeps the skip narrow: the marker must be missing, `script`'s refusal line must be present, and the sweep's output must be absent, so any other missing marker still fails. Task 4 records that the proof is the user's hand reproduction plus the pre-merge container run, never a gate pass.
4. **The terminal explanation for group 3 could be incomplete on Linux.** No task can close this risk, because only the user's pre-merge container run shows it. The macOS hand reproduction confirms the mechanism there, and Task 4's document of record states only what was measured and what guards each group. It claims no Linux pass.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom.

- **Only the committing role flips a marker to `[x]`.** In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself.
- **No implementer changes a marker here, or edits any other line of this section,** in an index a run is iterating.
- **`[ ]` markers anywhere else are informational only.** This includes the sub-step bullets inside the per-task files. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_linux_test_suite_failures/task_<K>_plan.md`. The entries are in bottom-up ship order, with the catch-all layer last.

1. [x] **Task 1** — Make the fixture environment refuse, on every host, what Linux refuses: a guessed git identity and an oversized single argument _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Pass the two group-1 tests' oversized values through a file, not an argument or environment string _(layer: cli)_ _(points: 10)_
3. [x] **Task 3** — Bound the sweep's fetch by process group whenever its stdout is not a terminal, with a pseudo-terminal case as the proof _(layer: cli)_ _(points: 20)_
4. [x] **Task 4** — Re-sync the root sweep copy and record the Linux suite's three groups in the documents of record _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"The branch records which group was a test assumption and which a code defect."*

The register covers only this plan's targets in the project's durable text. Every other target is source code: test files, the fixture helper, the shipped sweep script, the self-adopted copy of that script, and a git configuration file that only tests read.

**Derivation entry — corpus files (command).** Re-run this from the checkout root, exactly as written:

```
git grep -noE 'GIT_CONFIG_GLOBAL|ISOLATED_ENV|per-user file|useConfigOnly|Author identity|seedOrigin|E2BIG|MAX_ARG|STUB_PR_DIFF|commitInCopy|run_bounded|/dev/tty|controlling terminal|HARNESS_FETCH_TIMEOUT|releases its output pipe|pseudo-terminal|openpty|tcgetattr|The suite under jq 1\.6' -- '*.md' '*.txt' ':(exclude)harness-runs/*/**' ':(exclude)examples/**'
```

The patterns name each symbol this branch changes or classifies, plus the anchor of the paragraph the new record goes beside. The pathspec covers every Markdown and text file except per-run artifacts and the frozen `examples/` capture. Each hit is a `path:line:match` triple, and each distinct paragraph it lands in is one site.

**Derivation entry — standing-artifact rows (procedure).**

- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md harness-runs/improvement_suggestions.md`
- **Artifact:** the two standing ledgers under `harness-runs/`.
- **Traversal:** each file's topic headings in file order, then the one-line entries under each heading.
- **Decision rule:** an entry is reached when it names a surface on this branch's target list: `cli/test/helpers/fixture.mjs`, `remote-control-mention.test.mjs`, `watcher-stall-reset-payloads.test.mjs`, `outer-loop-scripts.test.mjs`, `cleanup-merged-worktrees.sh`, `docs/cli.md` or `docs/development.md`, or the identity, argument-size or fetch-bound behaviour they carry.
- **Result when this plan was written:** no entry is reached. The ledgers' rules on evidence, such as attributing an effect only after a control run, bind the plan as constraints, not as sites.

**Closure invariant:** every site that either entry reaches appears as a row below, and no command or procedure re-run reaches a site that is not a row.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/cli.md`, the fixture bullet beginning *"git runs with every configuration source it reads pointed away"*, and its lead-in *"Six choices in that harness are worth knowing"* | — | command entry, `per-user file` | `change` | Task 4. The per-user file now points at the checked-in identity-refusing file, and the single-string guard is a new choice. |
| 2 | `docs/cli.md`, the bullet beginning *"The main-checkout anchor is blanked."* | — | command entry, `ISOLATED_ENV` | `no-change` | It describes the blanking of `HARNESS_MAIN_REPO` and `HARNESS_GITHUB_DEFAULT_COMMIT`, which this branch leaves as they are. |
| 3 | `docs/cli.md`, the paragraph beginning *"The excluded rule's `:*` accepts any argument"* (`hr_wrapper_target_check_var`) | — | command entry, `GIT_CONFIG_GLOBAL` | `no-change` | It describes the wrappers dropping the inherited git environment. This branch changes no wrapper. |
| 4 | `docs/development.md`, the paragraph *"**The suite under jq 1.6, by hand.**"* | — | command entry, `The suite under jq 1.6` | `change` | Task 4 inserts the new paragraph *"**The suite on Linux, by hand.**"* directly after this one. The jq paragraph's own text stays as it is. |
| 5 | `docs/outer-loop-verification.md`, the list item *"`cleanup-merged-worktrees.sh` — `run_bounded()` and the `HARNESS_FETCH_TIMEOUT`-bounded `fetch --prune`"* | — | command entry, `run_bounded` / `HARNESS_FETCH_TIMEOUT` | `no-change` | It records executable change since a dated stamp, and the script is already listed as changed. Its own text says *"re-run the recipe rather than editing the number"*. |
| 6 | `docs/development.md`, the new paragraph *"**The suite on Linux, by hand.**"* (created by this branch, so the command first reaches it once Task 4 lands) | — | command entry, after Task 4: `E2BIG` / `Author identity` / `useConfigOnly` / `controlling terminal` / `run_bounded` / `pseudo-terminal` | `change` | Task 4 creates it. It is the branch's record of which group was a test assumption and which a code defect, and of group 3's hand reproduction. |
