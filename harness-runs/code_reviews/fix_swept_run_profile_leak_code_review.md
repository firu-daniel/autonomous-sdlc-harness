# Code Review: fix_swept_run_profile_leak

## Context

**Branch:** `fix_swept_run_profile_leak`
**Date:** 2026-10-24
**Reviewed:** the whole branch diff against `dev`. This run copy has no local `dev`, so the base is `origin/dev`, the remote-tracking ref of the configured `defaultBranch`. The diff is ten files. Task 1: the sweep template `cli/templates/scripts/cleanup-merged-worktrees.sh` (`live_runs`, `profile_remove`, the slug derivation and the header) and the `hr_run_profile_file` caller comment in `cli/templates/scripts/lib/harness-run-lib.sh`. Task 2: the profile cases in `cli/test/cleanup-run-copies.test.mjs`. Task 3: the temp `XDG_STATE_HOME` in `cli/test/cleanup-worktree-record.test.mjs` and `cli/test/run-copy-migration.test.mjs`. Task 4: the `scripts/` mirrors and `docs/watcher.md`, `docs/sandbox-verification.md` and `docs/outer-loop-verification.md`. 8 run-artifact files excluded from the reviewed diff.

**The behaviour is right.** The profile is removed only after `removed clone …` or `removed worktree …`, and before `git branch -D`. The slug comes from `hr_repo_slug "$main_repo"`, which goes through `hr_main_repo` exactly as the watcher's `HARNESS_REPO_SLUG` assignment does. The inherited variable is never read, and the job-mode overwrite was confirmed in `autonomous-watcher.sh`. The live set is re-read through the one `live_runs` list. Its four statuses match `process_inbox_file`'s refusals, and the sanitized-name collision is caught. `launch_run` writes `status running` before `spawn_engine` renders the profile, so the re-check covers the hand-run race. `--dry-run` decides the same way and deletes nothing.

**Coverage and docs are complete.** All six prompt cases are present, under a per-case `XDG_STATE_HOME`. The `scripts/` mirrors are byte-identical (`cmp`). Every `change` row of the story's scope register landed, and a re-run of its derivation grep finds no stale lifetime claim. This review runs no suite; whether the tests pass is the Run gates phase's to establish. `phases.parity` is `false`, so no parity check ran.

**Pass 0.** The grep half's regex table is still an unfilled stub, which is a configuration gap and disabled only that half. The caller check found two new functions, `live_runs` and `profile_remove`. Both are script-local and have in-file callers; neither is an export of a consumed layer.

**Pass 2.** `per_task_findings_root` has no folders, so it was a no-op. The three findings below are all Should Fix.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves to `harness-runs/code_reviews/fix_swept_run_profile_leak_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading number is the fix order; `K` is the finding's stable identity.

1. [ ] **Finding 3** — Correct the § 1.4 "What moved" sentence: `cleanup-run-copies.test.mjs` uses a throwaway checkout carrying the template sweep, not an `init`-built fixture _(layer: general)_
2. [ ] **Finding 2** — Add the fail-closed "registry could not be re-read" keep line to `cleanup-run-copies.test.mjs`'s *Not covered* list _(layer: cli)_
3. [ ] **Finding 1** — Make the "no run profile path" line name the unanchorable state directory too, in the template, its `scripts/` mirror and the test that asserts it _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The sweep's "no run profile path" line blames the slug or the branch even when the real cause is a state directory that cannot be anchored, and the test pins that wrong text
→ [finding_1.md](fix_swept_run_profile_leak_code_review/finding_1.md)

### 2. `cleanup-run-copies.test.mjs`'s header lists one uncovered profile line, and leaves out the fail-closed "registry could not be re-read" keep line
→ [finding_2.md](fix_swept_run_profile_leak_code_review/finding_2.md)

### 3. The rewritten § 1.4 "What moved" sentence says `cleanup-run-copies.test.mjs` runs against an `init`-built fixture, which it does not
→ [finding_3.md](fix_swept_run_profile_leak_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
