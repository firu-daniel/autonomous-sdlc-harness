### 1. Move the Run gates lane layout, label pattern, staleness bound and heartbeat age into the run library

**Severity:** Must Fix

**Sites:**

- `cli/templates/scripts/launch-sandboxed-gates.sh`:
  - the constants block `LABEL_PATTERN='^[A-Za-z0-9][A-Za-z0-9._-]*$'`, `STALE_SECONDS=30` and `LOG_SUBDIR='test_run_logs'`;
  - the check-9 assignment `log_dir="$target/$state_dir/$LOG_SUBDIR/$safe_branch"`;
  - the function `heartbeat_age()`;
  - the header paragraph `# MIRRORS of \`run-test-suite.sh\`, so a change to any of them is an edit to both:`.
- `cli/templates/scripts/run-test-suite.sh`:
  - `STALE_SECONDS=30`, `LOG_SUBDIR='test_run_logs'` and `LABEL_PATTERN=…`;
  - `log_dir="$state_dir/$LOG_SUBDIR/$safe_branch"`;
  - `heartbeat_age()`;
  - the new header sentence `` `launch-sandboxed-gates.sh` mirrors LABEL_PATTERN, STALE_SECONDS and the LOG_SUBDIR / `log_dir` lane layout ``.
- `scripts/launch-sandboxed-gates.sh`, `scripts/run-test-suite.sh` and `scripts/lib/harness-run-lib.sh`: this checkout's byte-identical copies of the three templates.
- `scripts/lib/sandbox-probe/legs-local.sh`:
  - `SP_T2_STALE_SECONDS=30`, under its comment `# Mirrors run-test-suite.sh's STALE_SECONDS`;
  - `lane="$SP_CLONE/$state_rel/test_run_logs/…"`.
- `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`: `lane="$SP_CLONE/$state_rel/test_run_logs/$safe"`.

**Problem.**

The branch adds a second outer-loop script that has to agree with `run-test-suite.sh` on where a Run gates round's lane lives (`<state_dir>/test_run_logs/<sanitized branch>/<label>.{running,verdict,log}`), which labels are legal, and when a `.running` heartbeat counts as stale. It does not take these from one owner. It retypes all of them: three constants, the `log_dir` composition, and a byte-identical copy of `heartbeat_age()`. Then it declares the copies as "mirrors" in both headers, "so a change to any of them is an edit to both". The probe adds a third copy of the bound (`SP_T2_STALE_SECONDS`, "Mirrors run-test-suite.sh's STALE_SECONDS") and two more literal spellings of the lane layout.

The launcher's own header says what drift costs: "A drift makes the `pending` answer and the 'did not start' refusal read the wrong lane, which refuses every sandboxed round while the gates run." No compile step or test pins the copies together.

The rule sources say these values already have a home:

- `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*. *"Before adding a copy of anything, grep for it"* follows, illustrated by `repoPaths.ts`, where drifted copies of one derivation silently changed behaviour.
- `.claude/context/conventions.md` → `## Configuration is the source of truth…`: *"The shared constants have owners, and a value is imported from its owner rather than retyped"*. Under `## What accompanies a new unit of each kind`, a persisted path shape joins *"the module that owns that artifact"* rather than *"being named at its use site"*.
- The owner exists and both scripts already source it. `cli/templates/scripts/lib/harness-run-lib.sh`'s header calls itself the place that *"derives the anchors (main checkout, work root, worktree directory, repo slug, state-dir paths) the scripts would otherwise each re-derive slightly differently"*. It already owns the lane helpers this code calls: `hr_state_dir`, `hr_sanitize_branch`, `hr_lane_mtime` and `hr_lane_mkdir`. The `hr_lane_mtime` comment changed on this branch already names both scripts' `heartbeat_age` as its callers.
- The declared-mirror exception in `## Configuration is the source of truth…` (`MACHINE_REGISTRY_FILENAME`) applies only where one side is TypeScript and the other a shipped template that cannot import it. Here both sides are shell scripts that source the same library, so that exception does not apply.

**Fix.**

1. In `cli/templates/scripts/lib/harness-run-lib.sh`, add one owner for the Run gates lane, beside `hr_lane_mtime`:
   - read-only constants `HR_TEST_RUN_LABEL_PATTERN='^[A-Za-z0-9][A-Za-z0-9._-]*$'`, `HR_TEST_RUN_STALE_SECONDS=30` and `HR_TEST_RUN_LOG_SUBDIR='test_run_logs'`, set with plain assignments, no `set` options, so the sourced-library rule in `.claude/context/conventions.md` → `## Shell assets` holds;
   - `hr_test_run_lane_dir <state_dir> <branch>`, which prints `<state_dir>/$HR_TEST_RUN_LOG_SUBDIR/<hr_sanitize_branch branch>` and returns 1 when the branch does not sanitize;
   - `hr_heartbeat_age <running_file>`, the body both scripts' `heartbeat_age` share today: it prints the age in whole seconds and fails, printing nothing, when `hr_lane_mtime` answers 0.

   Name the two callers in each helper's comment and in the library header's list of what it owns.
2. In `cli/templates/scripts/run-test-suite.sh`:
   - delete `LOG_SUBDIR` and `LABEL_PATTERN`, and use the library's constants;
   - initialise `STALE_SECONDS="$HR_TEST_RUN_STALE_SECONDS"` after the library is sourced, keeping the `RUN_TEST_SUITE_STALE` override in this script alone. Move the constants block below the `. "$hr_lib"` line, or source the library before the label check;
   - build `log_dir` with `hr_test_run_lane_dir "$state_dir" "$branch"`;
   - replace `heartbeat_age` with `hr_heartbeat_age "$running_file"`;
   - delete the header sentence that declares the launcher's mirrors.
3. In `cli/templates/scripts/launch-sandboxed-gates.sh`:
   - delete `LABEL_PATTERN`, `STALE_SECONDS`, `LOG_SUBDIR` and `heartbeat_age`;
   - use `HR_TEST_RUN_LABEL_PATTERN` and `HR_TEST_RUN_STALE_SECONDS`, which still ignore `RUN_TEST_SUITE_STALE`, as the header states;
   - in check 9, compose `log_dir="$target/$(hr_test_run_lane_dir "$state_dir" "$branch")"`, refusing as today when it fails;
   - in check 10, call `hr_heartbeat_age "$running_file"`;
   - replace the header's `MIRRORS of run-test-suite.sh` paragraph with one line saying that the label pattern, the bound, the lane layout and the heartbeat reader are the run library's.

   The library is sourced at check 1, before the label check in check 2, so the pattern is available there.
4. In `scripts/lib/sandbox-probe/legs-local.sh`, replace `SP_T2_STALE_SECONDS=30` and its mirror comment with a read of `HR_TEST_RUN_STALE_SECONDS`. In both probe legs, build `lane` with `hr_test_run_lane_dir`. The probe already sources the run library: it calls `hr_sanitize_branch` and `hr_lane_mtime`.
5. Copy the three changed templates byte for byte over `scripts/launch-sandboxed-gates.sh`, `scripts/run-test-suite.sh` and `scripts/lib/harness-run-lib.sh`, as Task 7 did.
6. Accompanying tests (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`; `.claude/context/cli.md` → `## What "done" means here`). In the existing suite that covers the run library's helpers, add cases for `hr_test_run_lane_dir`, covering a sanitized branch and an unsanitizable one, and for `hr_heartbeat_age`, covering a fresh file, a missing file and an unreadable mtime. Keep the existing `cli/test/run-test-suite.test.mjs` and `cli/test/launch-sandboxed-gates.test.mjs` assertions unchanged: they pin the behaviour this refactor must preserve.

- **Deviations from plan:** (`cli` layer dispatch)
  - Step 6 asks for cases "in the existing suite that covers the run library's helpers". No `cli/test` suite unit-tests `hr_lane_mtime` or `hr_sanitize_branch` directly: `grep -rln "hr_lane_mtime\|hr_sanitize_branch" cli/test` names only `run-test-suite.test.mjs` and `sandbox-probe-gate-sandbox-legs.test.mjs`, which drive whole scripts. The cases therefore went into a new suite, `cli/test/run-gates-lane-lib.test.mjs`. It has the same shape as `cli/test/placeholder-sweep-lib.test.mjs`: a copy of the library sourced in one `bash`. It reads one fixed file, so it owes no `treeGuards` entry.
  - In `run-test-suite.sh`, the library is now sourced before argument parsing, as Fix step 2 allows ("or source the library before the label check"). `refuse()` moved above the sourcing block. With an unreadable library, a bad label now reports `cannot read '<lib>'` instead of the label refusal.
  - Comment-only edits that the finding does not list: `run-test-suite.sh`'s `THE BOUND.` paragraph and its usage line, and the launcher's checks 2, 9 and 10, the `START, SUPERVISE, WAIT.` paragraph and the exit map. These now name `HR_TEST_RUN_*` / `hr_test_run_lane_dir` where they used to name the deleted `LABEL_PATTERN` / `STALE_SECONDS`, or retyped the pattern.
  - Fix steps 4 and 5 (`scripts/lib/sandbox-probe/legs-*.sh` and the byte-identical copies under `scripts/`) are outside `cli/`. They belong to this finding's `general` dispatch and were not touched here.
  - Not run here, and deferred to the Run gates phase: `cli/test/run-test-suite.test.mjs` and `cli/test/launch-sandboxed-gates.test.mjs`. This unit did not edit either file, so `## The test-run rule` point 1 excludes them. They are the behaviour pins for this refactor.
- **Deviations from plan:** (`general` layer dispatch)
  - Step 4 says to replace `SP_T2_STALE_SECONDS=30` "with a read of `HR_TEST_RUN_STALE_SECONDS`". That cannot be a source-time assignment. `scripts/sandbox-probe.sh` sources `legs-local.sh` before `preflight.sh` sources the run library, so under the entry point's `set -u` such an assignment would abort the probe. `SP_T2_STALE_SECONDS` was therefore deleted, and its two use sites in `sp_leg_gates` now read `$HR_TEST_RUN_STALE_SECONDS` when the function runs. The header line that named `SP_T2_STALE_SECONDS` now names the library constant and states this ordering.
  - In `legs-local.sh`, building the lane with `hr_test_run_lane_dir` adds an `elif` to `sp_leg_gates`' T2/T3 chain. A `SP_BRANCH` that does not sanitize now produces `not run` ("has no Run gates lane: it does not sanitize"). Before, the lane path was built with an empty branch segment.
  - Step 5: `cp` was refused by the tool layer in this session. The three `scripts/` copies were brought level with the same edits made through the file-edit tool instead. The content now matches the templates: `git diff --no-index` between each template and its copy prints no content hunk. The only difference it reports is the pre-existing mode change `100644` → `100755` on `run-test-suite.sh`.
  - Not run, and no phase of this flow runs them: the probe legs (`scripts/sandbox-probe.sh`), which need live sessions. The evidence for the leg edits is reading them plus `bash scripts/typecheck.sh`, whose shell-parse check covers them. The verdict line was `check-shell-parse: 107 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, followed by `PASS: typecheck`.
