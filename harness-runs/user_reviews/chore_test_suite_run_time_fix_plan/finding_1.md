### 1. Gate 4's host run-time row was measured on a loaded machine and overstates the gain

> **Self-contained per-finding file** for the `chore_test_suite_run_time` user-review fix-plan index (`harness-runs/user_reviews/chore_test_suite_run_time_fix_plan.md`). Everything needed to apply the fix is here. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/development.md` → `## 5. Verifying a change` → **Gate 4** → the **Run time, measured.** block. It runs from the paragraph starting "**Run time, measured.** Measured on 2026-09-25" to the paragraph ending "…787 tests passing before and 791 after, with none failing:". Around line 242–260 at the time of writing.

**The problem.** The recorded host row (`| host, 10 cores | 466 s, 494 s, 376 s | 209 s, 209 s, 217 s | 314 s, 507 s, 337 s | 236 s, 316 s, 331 s |`) was measured inside the headless run. Other sessions were running their own suites and processes on the same machine at the time; the record itself notes a 1-minute load of 20.86 before the before run. It reads as roughly 2× faster for `npm test`. The user re-measured both sides by hand, outside any headless session, with no other heavy process running. On that free machine the gain is about a third. The provenance around the row (date, Node version, `--runs 3` commands, run order, the "range, not a point" load explanation, "All three after `npm test` runs exited 0") describes the old measurement and has to change with it.

The user's measurement (verbatim `measure-suite:` lines, taken 2026-09-26 from the branch worktree with the branch's own `scripts/measure-suite.sh`; host Darwin arm64, `os.availableParallelism()` 10, Node v22.23.2, git 2.50.1 (Apple Git-155); 1-minute load average 2.47 before the after run, 2.25 before the before run; the before run taken right after the after run; after measured at branch `HEAD` `19417ce9a6c1`, whose `cli/`, `scripts/` and `docs/` match the current `HEAD`):

```
measure-suite: host cpus=10 ref=19417ce9a6c1 npm-test run 1/1: 117.83 s, exit 0
measure-suite: host cpus=10 ref=19417ce9a6c1 run-gates run 1/1: 135.32 s, exit 1
  run-gates: 1 failed, 19 passed
measure-suite: host cpus=10 ref=fe17b4e2293f npm-test run 1/1: 170.48 s, exit 0
measure-suite: host cpus=10 ref=fe17b4e2293f run-gates run 1/1: 208.22 s, exit 1
  run-gates: 1 failed, 19 passed
    - 11 docs-retrieval relevance floor
```

**Do not re-measure, and do not run `measure-suite.sh` at all for this fix.** One run per side is deliberate (see the new paragraph below). The fix only edits prose and the table.

**Fix.** Edit only `docs/development.md`, in this order:

- [ ] **Opening clause.** Replace
  > **Run time, measured.** Measured on 2026-09-25 on a 10-core macOS host (Darwin arm64, `os.availableParallelism()` 10), Node v20.19.5, git 2.50.1, one host command each, from the repository root:

  with
  > **Run time, measured.** Measured by hand on 2026-09-26 on a 10-core macOS host (Darwin arm64, `os.availableParallelism()` 10), Node v22.23.2, git 2.50.1 (Apple Git-155), outside any headless session and with no other heavy process running, one host command each, from the repository root:

- [ ] **The two fenced command blocks.** Replace `bash scripts/measure-suite.sh --ref fe17b4e2293f --runs 3` with `bash scripts/measure-suite.sh --ref fe17b4e2293f --runs 1`, and `bash scripts/measure-suite.sh --runs 3` with `bash scripts/measure-suite.sh --runs 1`. Keep each in its own fenced block, one command per block.

- [ ] **Provenance sentence above the table.** Replace the whole paragraph beginning "`fe17b4e2293f` is the `dev` commit before the template-copied fixtures and the concurrent suites." and ending "…rounded to whole seconds:" with
  > `fe17b4e2293f` is the `dev` commit before the template-copied fixtures and the concurrent suites. Both before columns were measured at it, and both after columns at the branch's own `HEAD`, from the branch's worktree with the branch's own `scripts/measure-suite.sh`, the before run taken right after the after run. Each figure is the script's own `measure-suite:` line rounded to whole seconds:

  Do not name a branch-only SHA such as `19417ce9a6c1`. The squash merge drops it (code-review Finding 1).

- [ ] **Host row.** Replace the `| host, 10 cores | … |` row with
  ```
  | host, 10 cores | 170 s | 118 s (−31%) | 208 s | 135 s (−35%) |
  ```
  Leave the header row and the two `--cpus` rows ("not yet measured") unchanged.

- [ ] **The paragraph under the table.** Replace its opening, from "Read the host row as a range, not a point." through "All three after `npm test` runs exited 0.", with
  > One run per side is deliberate. A measurement taken inside a harness session is unstable and unpredictable: other sessions can be running their own tests and other processes on the same machine at the same time, and the session taking the measurement adds to the load itself. So these figures are taken by hand, outside any headless session, on a machine with no other heavy process running. `uptime` read a 1-minute load average of 2.47 just before the after run and 2.25 just before the before run. Repeating the measurement inside a run would not make it more trustworthy. Both `npm test` runs exited 0.

  Keep the rest of that paragraph exactly as it is, starting at "Every `run-gates.sh` run, before and after, exited 1 on the same single failure, `11 docs-retrieval relevance floor`, and no other." and running through "…787 tests passing before and 791 after, with none failing:". Keep the fenced `node --test --test-reporter=spec test/` block and the "The four it adds…" paragraph after it unchanged too. The `11 docs-retrieval relevance floor` failure pre-exists the branch and is not part of this fix.

- [ ] **Task 7's "three consecutive runs".** No edit. That acceptance wording appears only in the run artifacts (`harness-runs/task_prompts/chore_test_suite_run_time_task_prompt.md`, `harness-runs/task_plans/chore_test_suite_run_time/task_7_plan.md`, `task_4_plan.md`), and not in `docs/` or any other document of record. The user asked to align it only if the document of record quotes it. After this fix the document says why one run per side is enough, and nothing in it demands three.

**Verification.**
- `git grep -n -e "--runs 3" -e "v20.19.5" -e "20.86" -e "range, not a point" -e "All three after" -- docs/development.md` prints nothing.
- `git grep -n "170 s | 118 s (−31%) | 208 s | 135 s (−35%)" -- docs/development.md` prints the host row.
- `git grep -n -e "19417ce" -e "a885d631d85b" -e "4c36164a9759" -- docs` prints nothing.
- `git grep -n "787 tests passing before and 791 after" -- docs/development.md` still prints its line.
- `git diff --stat` touches only `docs/development.md`.
