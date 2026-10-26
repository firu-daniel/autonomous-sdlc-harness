## The run copy carries no local `defaultBranch` ref, so `diff_base: dev` does not resolve as written
- **category:** agent-contract
- **evidence:** `git rev-parse --verify -q dev` printed nothing and `git rev-parse --verify -q origin/dev` printed `c7d4cec4…` in this run copy. The Task 2 `layer-implementer` reported `git diff dev` failing with `fatal: bad revision 'dev'` (deviation note in `harness-runs/task_plans/feat_run_gates_flake_resilience/task_2_plan.md`). The A2.1 dispatch block carries `diff_base: dev` (`<default_branch>`), and the branch-reviewer, skeptic-reviewer and statistics-plan-writer each reported falling back to `origin/dev` on their own. The orchestrator added a `context_notes:` line to three dispatches to pass the fact on (`harness-runs/dispatch_additions/feat_run_gates_flake_resilience.md`).
- **cost this run:** three dispatch additions recorded, and one implementer check that could not run as the plan wrote it
- **hypothesis:** the run copy is cut from `origin/<default_branch>` and no local branch of that name is created in it

## A unit's single-file run of a watcher suite exceeded the foreground limit, and the implementer then ran it piped through `tail`
- **category:** agent-contract
- **evidence:** the Task 2 `layer-implementer` return (dispatch #6) reported that `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs` hit the 600 s foreground limit, was moved to the background and was not collected, and that it then ran the same file piped through `tail`, which `## The test-run rule` point 6 forbids. The edited file was left unverified until the Run gates phase.
- **cost this run:** one edited suite shipped from Phase A with no unit-level run; dispatch took ~995 s

## `test-timeout.test.mjs`'s only case skips in the sandbox because `pgrep` cannot read the process table
- **category:** tooling-gap
- **evidence:** the Task 3 `layer-implementer` return (dispatch #8) reported `npm test --workspace cli -- test/test-timeout.test.mjs` exiting 0 with its one case skipped: `pgrep` exits 3 with "sysmond service not found" inside the command sandbox. The case the branch changed (`CHILD_TEST_TIMEOUT_MS = scaleBound(240_000)`) was therefore not run end to end at unit level.
- **cost this run:** the edited constant's only exercising case was unverified at unit level

## The branch reviewer's Pass 0 grep half could not run: the sweep table is an unfilled stub
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return (dispatch #13) stated "the grep half didn't run. The sweep table is still an unfilled stub with no regexes, which is a configuration gap to close."
- **cost this run:** Pass 0's regex sweep produced nothing for this branch

## The committer first called the commit wrapper under `plugin/scripts/` and was blocked
- **category:** agent-contract
- **evidence:** the Phase C `committer` return for code-review Finding 1 (dispatch #21) reported: "I first called the wrapper at `plugin/scripts/`, and that call was blocked before it ran. `harness.config.json` sets `scriptsDir` to `scripts`", after which it committed with `scripts/commit-on-branch.sh` (main checkout).
- **cost this run:** one refused tool call; the commit landed on the second attempt (`6dc7fdd5`)
