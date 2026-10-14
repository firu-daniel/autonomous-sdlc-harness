# Review plan meta-review — iteration 0

## Must Fix
1. **No check drawn from the touched layers' conventions documents, and no clean-pass rationale for them** — refers to "Structure" (missed checks). Offending file: the index, `harness-runs/code_reviews/fix_watcher_worktree_git_calls_code_review.md` (`## Context`).
   The diff touches two layers. `cli` has `cli/src/commands/doctor.ts`, `cli/src/config/io.ts`, `cli/src/core/git.ts`, `cli/src/core/json.ts`, `cli/src/doctor/checks.ts` and `cli/src/generators/writeProtection.ts`, plus the `cli/templates/` scripts and eight `cli/test/` suites. `general` has `docs/cli.md`, `docs/watcher.md` and `docs/remote-execution.md`. The rule is that each touched layer gets at least one finding, or an explicit clean-pass rationale, drawn from that layer's conventions document. None of the three findings is drawn from `.claude/context/cli.md` or `.claude/context/conventions.md`:
   - Finding 1 comes from the story's design constraint and a probe.
   - Finding 2 comes from task-prompt goal 4.
   - Finding 3 is a pointer-direction slip.

   The Context paragraph lists what the diff covers and the `RED ONCE` coverage, but it says nothing about the rules those documents make reviewable for this diff:
   - `cli/src/core/git.ts` is the only module that invokes `git`. This diff adds `mergeBase`, `fileAtRef`, `commitResolves` and `changedPathsBetween` there, and `cli/src/doctor/checks.ts` consumes them.
   - The new `doctor --job-surfaces=<branch>[@<commit>]` option and its `job-surfaces` check: `doctor` asks, grades and repairs nothing, and an adopter-fixable refusal is an ordinary `HarnessError` while a CLI fault goes through `internal()`.
   - A change to a command lands with a case that drives the compiled CLI against a throwaway fixture, and a refusal is asserted on the bytes on disk (`cli/test/doctor-job-surfaces.test.mjs`).
   - Every changed `cli/src/` module's header is held to its own stated rule. That includes `writeProtection.ts`, which now carries the declared shell mirror in `harness-run-lib.sh`.
   - A sourced library sets no shell options, and the scripts stay bash 3.2.
   - The documents of record: a measured fact states the command and the exact message, and a deferral cites a numbered roadmap item. This applies to the residuals added to `docs/cli.md` §6.

   The diff also exhibits two `harness-runs/lessons.md` categories, and no finding or rationale covers either:
   - **"A script that creates a temporary working copy or branch removes it on every exit path…"** The diff adds a `mktemp -d` scratch directory in `stall_job_surfaces_ok`, a temporary index in `hr_commit_placed`, and the `create-worktree.sh --existing` copy.
   - **"Every automatic retry in an unattended path is bounded…"** The stall watchdog now gives up on a refused reset instead of resuming.

   From what was read, the code appears compliant, so a short rationale is all this needs. As the index stands, though, nothing shows those checks were run.
   **Fix:** In the index's `## Context`, add a clean-pass paragraph for each touched layer, citing the conventions-document section each check comes from:
   - **`cli`** (`.claude/context/cli.md` and the cross-layer rules it defers to): the `core/git.ts` monopoly, `doctor`'s ask-and-grade contract and error classes for `--job-surfaces`, the fixture-driven and bytes-on-disk test bar for `doctor-job-surfaces.test.mjs`, the module-header rule including `writeProtection.ts`'s mirror declaration, and the sourced-library and bash 3.2 rules for `harness-run-lib.sh`.
   - **`general`** (`.claude/context/conventions.md` → `## Documents of record`): the measured-fact and deferral rules for the new `docs/cli.md` §6 residuals and the `docs/remote-execution.md` §11 text.
   - **The two `harness-runs/lessons.md` entries named above**, each with the site that satisfies it.

   Where a check fails, make it a new `finding_<N>.md`, with its index pointer and readiness entry, in place of the rationale.

## Should Fix
1. **Finding 3's supporting claim overstates the header's consistency** — refers to review finding #3, `finding_3.md`. It says "Every other cross-reference in this header to that section reads 'see JOB MODE', with no direction word". The watcher header also carries `(JOB MODE)` with no "see" (the `job` usage line) and a bare `JOB MODE).` (the line ending "NEVER a dispatched agent:"). The fix is still right.
   **Fix:** In `finding_3.md`, reword the sentence to say that no other cross-reference to that section carries a direction word.

2. **Finding 1's quoted substring for the `hr_run_reset_var` comment does not match the file verbatim** — refers to review finding #1, `finding_1.md`, fix step 3. The step quotes `refused with nothing written, HR_RUN_RESET_REFUSAL set from the reset surface check`. The source reads `` refused with nothing written, `HR_RUN_RESET_REFUSAL` set from the `` and wraps onto the next comment line as `` `reset` surface check ``, so a grep for the quoted text finds nothing.
   **Fix:** In `finding_1.md` step 3, quote a substring that greps, for example `refused with nothing written`.
