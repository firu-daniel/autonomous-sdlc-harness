# Code Review: fix_job_mode_scripts_git_placeholder

## Context

**Branch:** `fix_job_mode_scripts_git_placeholder`
**Date:** 2026-11-05

**What was reviewed.** The whole branch diff against `defaultBranch` `dev`, read as `origin/dev...HEAD` because this checkout holds no local `dev` ref. That is 45 files. 14 run-artifact files were excluded from the reviewed diff.

- **F15, route (a).** `hr_script_root` in `cli/templates/scripts/lib/harness-run-lib.sh`, and the eight library-sourcing outer-loop scripts switched to it. The same algorithm is inlined in the four wrapper templates (`typecheck.sh`, `test.sh`, `start-dev-server.sh`, `deploy.sh`), and the `protectedPaths` doc comment in `cli/src/generators/writeProtection.ts` was updated. The launcher's header note and the launcher suite now keep the `.git`-leaf placeholder in place, with new case `(t)`.
- **F15 tests.** The runner-git shim (`cli/test/helpers/runner-git-shim.mjs`) and four new suites (`script-root`, `job-layout-root`, `wrapper-root-placement`, `script-root-callers`).
- **PD31.** The probe's `/proc` reads now go through probe-written scripts and `sp_session --token-file`, with their `PD31:` fixtures.
- **JS3.** A stalling plant in `default-branch.sh`, with its refusal above 480 s and its fixtures.
- **Copies and records.** The self-adopted `scripts/` copies and the `examples/notes-app/scripts/` wrappers were refreshed, and the F15 and PD31 rows and the restated PN/NN/JS3 rows were added to the documents of record.

**Conclusions.**

- **Copies.** The eight library-sourcing scripts and the run library in `scripts/` are byte-identical to their templates. The rendered wrappers carry the new placement.
- **Scope.** Every script the task prompt lists now places its root through `hr_script_root` or its declared inline mirror. No `<scriptsDir>/.git` protection is dropped, and `hr_wrapper_main_of` is untouched.
- **Tests.** Each capability lands with its tests, and each new suite opens with the rule it enforces. No new suite reads a tree, so no `treeGuards` entry is owed. `script-root-callers.test.mjs` reads a fixed list of files and says so. This review runs no suite: whether the tests pass is the Run gates phase's to establish.
- **Parity.** `phases.parity` is `false`, so there is no parity review.
- **Pass 0.** Half (a) is disabled: this agent's sweep list has no regexes filled in, which is a configuration gap. Half (b) found no new export under `cli/src`. Both new test-helper exports (`installRunnerGitShim`, `plantPlaceholder`) and `hr_script_root` have callers outside their defining files.
- **Pass 2.** `per_task_findings_root` holds no per-unit reviews, so nothing was carried over.
- **Still owed.** Two routes are owed a runner measurement: F15's on GS1–GS4/WF5 and PD31's on PN1–PN3/NN2. Both F15 and PD31 rows record this as owed, as the story index's manual step 1 requires.

The three findings below are what is left.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Replace "`git -C` on the script's own directory answers with" by "The placement below answers with" in the four wrapper templates and their five rendered copies _(layer: cli, general)_
2. [x] **Finding 2** — Derive JS3's stall and Bash-timeout durations once, in `g12_js3_durations`, and read them in both `g12_js3_files` and `g12_db_stall_fits` _(layer: general)_
3. [x] **Finding 1** — Bound the JS3 stall-body case's second run by `scaleBound` against a 600 s body instead of an unscaled `< 1000` ms ceiling _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The JS3 stall-body case discriminates on an unscaled 1000 ms wall-clock ceiling
→ [finding_1.md](fix_job_mode_scripts_git_placeholder_code_review/finding_1.md)

---

## Nice to Have

### 2. JS3's Bash-timeout formula is derived twice in `default-branch.sh`
→ [finding_2.md](fix_job_mode_scripts_git_placeholder_code_review/finding_2.md)

### 3. The wrapper templates' anchoring comment still names `git -C` on the script's own directory as the mechanism
→ [finding_3.md](fix_job_mode_scripts_git_placeholder_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section holds no parity divergence.
