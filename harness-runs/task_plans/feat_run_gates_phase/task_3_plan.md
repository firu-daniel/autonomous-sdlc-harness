### Task 3 — Add the four Run-gates directories to the run-artifact tree and ignore `test_run_logs` by its contents

**Goal:** Give every artifact the Run gates phase writes a directory, with a contract README, in the tree `init` materialises. Keep the per-round logs out of every commit: they carry machine paths, which the self-containment gate refuses.

**Where this layer stops.** This task declares the directories and writes their contracts. Task 1's script creates `test_run_logs/<branch>/` itself. The instructions that write into the other three directories are `plugin` tasks: Task 7 for the writer, Task 8 for the reviewer and Task 9 for the phase. Task 20 mirrors the READMEs and the ignore lines into this repository.

### Targets

- `cli/src/generators/stateDir.ts` → `STATE_DIR_ENTRIES`.
- `cli/templates/state-dir/test_run_logs/README.md`, `cli/templates/state-dir/test_fix_plans/README.md`, `cli/templates/state-dir/test_fix_plan_reviews/README.md`, `cli/templates/state-dir/test_fix_point_reviews/README.md` (all new).
- `cli/src/generators/repoRoot.ts` → `CONTENTS_IGNORED_DIRS` and `writeRepoRootFiles`, plus `cli/templates/repo/gitignore`.
- `cli/templates/state-dir/README-root.md`.
- `cli/test/doctor.test.mjs` → `README_PAIR_DIRS`.

**The names this task defines.** Tasks 7, 8, 9, 13, 19 and 20 restate them.

| Directory | Always written? | Holds | Written by |
|---|---|---|---|
| `test_run_logs` | yes — **contents ignored, README excepted** | `<branch>/<gate_key>_round_<gate_round>.log`, the full output of one gate run | `run-test-suite.sh` |
| `test_fix_plans` | yes — committed | `<branch>_<gate_key>_round_<gate_round>.md` (the index) and the sibling folder `<branch>_<gate_key>_round_<gate_round>/finding_<N>.md` | `test-fix-plan-writer` |
| `test_fix_plan_reviews` | yes — committed | `<branch>_<gate_key>_round_<gate_round>/review_<i>.md` | `architecture-reviewer`, insertion point 4 |
| `test_fix_point_reviews` | yes — committed | `<branch>_<gate_key>_round_<gate_round>/item_<N>/review_<i>.md` | `layer-reviewer`, only where `<per_unit_review>` is `on` |

`<gate_key>` is `task` in the task flow and `review_<n>` in the user-review fix flow.

**Work:**

- [ ] `stateDir.ts`: add the four rows, none of them phase-gated. Place them after `dispatch_additions`, with a one-line comment naming the Run gates phase as their owner. Group `test_run_logs` with the other machine-local runtime surfaces in that comment's wording.
- [ ] **The four READMEs**, modelled on `cli/templates/state-dir/scratch/README.md` and `…/code_reviews/README.md`. Each states what one file in the directory is and exactly how it is named, who writes and who reads it by role, when it appears and when it is superseded, and the one mistake a reader would otherwise make. The mistakes:
  - **`test_run_logs`:** it is machine-local and ignored by its contents, so a log is never evidence a later reader can open. A fix plan quotes what the log showed **with machine paths rewritten** — checkout-root paths made repo-relative, other home-directory paths replaced by `<home>` — because the fix plan is committed and the log's paths are what keep the log itself out of every commit. The log is versioned per round, never overwritten across rounds.
  - **`test_fix_plans`:** it is a fix plan, not a review. Its readiness list is walked by the unit loop's row `G.4`, and each round is a new index, never an edit of the previous one.
  - **`test_fix_plan_reviews`:** it holds the architecture gate's plan-review findings over one round's plan.
  - **`test_fix_point_reviews`:** it stays empty in a flow whose per-unit review is off.
- [ ] `repoRoot.ts` + `gitignore`:
  - Add a `TEST_RUN_LOGS_DIR = 'test_run_logs'` constant with a doc comment in the style of `SCRATCH_DIR`'s.
  - Add its row to `CONTENTS_IGNORED_DIRS` with the role `'the test-run log directory'`.
  - Pass `testRunLogsGlob` / `testRunLogsReadmeException` to the render.
  - In the template, insert `{{testRunLogsGlob}}` and `{{testRunLogsReadmeException}}` after the scratch pair, under a comment in that block's style: the full output of each gate run is machine-local because it carries machine paths; the README is the committed contract; so the contents are ignored and that one file is excepted.
- [ ] `README-root.md`: the *"What git ignores is the machine-local part of it"* paragraph lists four contents-ignored directories. Add the test-run logs as the fifth, and change *"All four"* to *"All five"*.
- [ ] `doctor.test.mjs` → `README_PAIR_DIRS`: add `'test_run_logs'`, so the README-negation cases cover it without a change on the `doctor` side. `CONTENTS_IGNORED_DIRS` is what `contentsIgnoredDirectories` exports to `doctor`.

**Verification:**

- `bash scripts/typecheck.sh` passes.
- `cli/test/doctor.test.mjs`, which this unit edits, is run on its own where a single-file test command is stated. Where none is, the run is skipped and recorded, per `plugin/instructions/unit_loop_core.md` → `## The test-run rule` once Task 5 lands.
- `grep -n "test_run_logs\|test_fix_plans\|test_fix_plan_reviews\|test_fix_point_reviews" cli/src/generators/stateDir.ts` shows the four rows. `grep -rn "test_run_logs" cli/src` shows it declared once in `stateDir.ts` and once as `repoRoot.ts`'s constant, whose `treeDirectory` check ties the two together.
