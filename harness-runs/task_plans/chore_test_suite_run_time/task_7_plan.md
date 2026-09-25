### Task 7 — Measure the before and after, prove nothing was lost, and record both in `docs/development.md` gate 4

**Goal:** Produce the task prompt's acceptance evidence that can be measured on this machine: `npm test` and `bash scripts/run-gates.sh` timed before and after on the **10-core host**, the same tests passing before and after, and three consecutive green host runs. Write the figures where this repository keeps a measured fact: `docs/development.md` → `## 5. Verifying a change` → **Gate 4**. That record states plainly that the 2- and 4-core figures are **not yet measured** and names the command that measures them. Also keep `docs/cli.md` → `## 10. How this is tested` complete, since it restates the fixture helper's numbered choices.

**Why host-only (the user's decision, Park 1):** no container runtime exists on the measuring machine, so `bash scripts/measure-suite.sh --cpus <n>` exits `3` by design. The user answered `harness-runs/clarifications/chore_test_suite_run_time/answer_1.md` with option (b): *"host-only now — measure on the 10-core host only, record that the 2- and 4-core figures are not yet measured, name `bash scripts/measure-suite.sh --cpus 4` as the command to run them, and leave acceptance item 1 open."* This task therefore **does not invoke `--cpus`**. It does not close acceptance item 1, and it does not report it as closed.

**Depends on:** Tasks 1–6, all landed. This task uses the following from them:

- `scripts/measure-suite.sh` (Tasks 5–6): `bash scripts/measure-suite.sh [--ref <commit>] [--runs <k>] [--cpus <n>]`. It prints one line per timed run, `measure-suite: <host|container> cpus=<n> ref=<12-char sha> <npm-test|run-gates> run <i>/<k>: <seconds> s, exit <status>`, followed by each `run-gates` run's closing summary. Exit codes: `0` all runs reported, `1` setup failed, `2` bad usage, `3` no container runtime.
- `cli/test/helpers/concurrency.mjs` (Task 2): the variable `HARNESS_TEST_CONCURRENCY`, whose value `1` runs every case in series.
- The template-copied fixtures (Task 1).
- The three concurrent suites (Tasks 2–4), with one `init` case running after its suite.

**The modelled core count is still 4, with 2 beside it, and it is recorded as unmeasured.** GitHub's standard hosted Linux runner has **4 vCPUs for a public repository** (this one is public) and **2 for a private one**. The record names both counts and why. It gives no seconds for either: acceptance item 1 requires measured figures, so an estimate is never written into a restricted-core cell. The planner's estimates in the story index `## Context` stay in the plan.

**This task writes no new mechanism.** If a measurement shows a flake or a regression, stop and report it as the task's blocker, naming the run and the failing case. Do not tune a bound, skip a case, or re-run until green to make the record look green. Two earlier full-suite runs, during Tasks 1 and 4, failed 1 of 790 and 2 of 791 cases without naming them and passed on re-run. This task is where that is checked, so a red run is evidence, not noise.

### Targets

- `docs/development.md` — `## 5. Verifying a change` → the **Gate 4** block: the paragraph opening *"Every test builds its **own** fixture repository under the system temp directory"*, and a new paragraph after it.
- `docs/cli.md` — `## 10. How this is tested`: the list introduced by *"Four choices in that harness are worth knowing before they cost a debugging round"*. It restates `cli/test/helpers/fixture.mjs`'s numbered header choices, so it must gain the fifth one Task 1 added there.

**Work:**

- [ ] **Find the before commit and measure it on the host.** `git merge-base HEAD dev` gives the branch point `M`. The first line of `git log --reverse --format=%H M..HEAD -- cli/test/helpers/fixture.mjs` is Task 1's commit, and the before commit is that SHA followed by `^`. Run `bash scripts/measure-suite.sh --ref <before> --runs 1`. Do **not** run `--cpus`.
- [ ] **Measure the after at `HEAD` on the host:** `bash scripts/measure-suite.sh --runs 3`. All three `npm-test` lines must show `exit 0`; those are the three-consecutive-green evidence on the host. Every `run-gates` summary must name no failure the before run's summary did not name. If any run is red, find the failing case before reporting: from `cli/`, run `node --test --test-reporter=spec test/`, send its output to a file under the system temp directory, and search that file for `✖`. Then stop with the blocker, naming the run, the case and its file.
- [ ] **Prove nothing was lost.** From `cli/`, run `node --test --test-reporter=spec test/` at the before commit and at `HEAD`. For the before commit, use the worktree `measure-suite.sh` would use, or a `git worktree add --detach` of your own that you remove with `git worktree remove --force`. Compare `ℹ tests` / `ℹ pass`. Diff the sorted case names with durations stripped: the only additions may be `fixture-template.test.mjs`'s cases and the three `describe` suite lines, and nothing may be removed. Then compare `git grep -c "assert\." <before> -- cli/test` with `git grep -c "assert\." HEAD -- cli/test`: every file present at the before commit must report the same count.
- [ ] **Update `docs/development.md`, Gate 4.** Amend the *"Every test builds its **own** fixture repository…"* sentence so it stays true: each test's repository is its own **copy** of a seeded template that its test process builds once. Then add one paragraph, **Run time, measured.**, stating:
  - the date and the host facts (10 cores, macOS, the Node version `measure-suite.sh` ran);
  - the commands, each in its own fenced block, one per line (the ledger's `## Adopter-facing documentation` rule);
  - a table of before and after seconds for `npm test` and `run-gates.sh`. The host row carries the measured figures, labelled by the commit each was measured at. The `--cpus 4` and `--cpus 2` rows read **not yet measured**, with no number;
  - the modelled core count and why (above);
  - that the restricted rows need a `docker`-compatible runtime, and the commands that fill them, each in its own fenced block: `bash scripts/measure-suite.sh --cpus 4`, `bash scripts/measure-suite.sh --cpus 2`, and the `--ref <before> --cpus 4` form. Add that, once taken, those figures model the **core count** and not the hosted runner's per-core speed, because the container runs Linux on the host's own architecture;
  - what the time is spent on. Every case is a serial chain of subprocesses: the CLI's own start and git probes, and, before Task 1, about fourteen git processes per fixture. The work is CPU-bound, so wall time at `n` cores is bounded below by the suite's CPU time over `n`;
  - that three files run their cases concurrently under a bound, and the switch that turns it off, in a fenced block: `HARNESS_TEST_CONCURRENCY=1 npm test`.

  Write every figure as the command's own output rounded to whole seconds, with its commit. Include **no path from the measurement output**: the worktree and archive paths sit under the system temp directory, and gate 6a greps for the home directory. Do not describe the restricted measurement as scheduled work of a later branch. Name the command and leave it at that.
- [ ] **Update `docs/cli.md` → `## 10. How this is tested`.** Change *"Four choices in that harness"* to five. Add the bullet for Task 1's header choice, in the list's existing register (a bold lead clause, then why): the seeded repository is copied from a template each test process builds once, the template is never handed to a test, and the origin's one stored path is rewritten per copy. Leave the paragraph *"Every test therefore **builds its own throwaway fixture**…"* as it is. Each test still gets a repository of its own and nothing is shared, which a copy keeps true.

**Verification:**

- `docs/development.md` Gate 4 carries a before and an after for both commands on the host. Each figure traces to a `measure-suite:` line from this task's runs; quote those lines in the implementer's return summary. The `--cpus 4` and `--cpus 2` cells read not yet measured and contain no number. `bash scripts/measure-suite.sh --cpus 4` appears in a fenced block of its own.
- The implementer's return summary states that acceptance item 1 remains **open**: the restricted-core figures are not measured, per the user's Park 1 answer (b).
- Re-run this branch's scope-register derivation command (story index → `## Scope register`). Confirm that every site it reaches is a register row and that the only `change` rows are this task's.
- `bash scripts/run-gates.sh` prints no failure its run at the before commit did not print. `bash scripts/check-llms-txt.sh` exits 0 (no link was added, so none can break).
- `grep -n "$HOME" docs/development.md` prints nothing.
