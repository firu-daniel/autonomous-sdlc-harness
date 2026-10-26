# Test Fix Plan: fix_headless_run_host_sleep — task round 1

## Context

**Branch:** `fix_headless_run_host_sleep`
**Test log:** `harness-runs/test_run_logs/fix_headless_run_host_sleep/task_round_1.log`
**Earlier logs:** none — this is the branch's first Run gates round, so every failure is classed *new this round*.
**Summary:** The typecheck gate passed. The test gate failed only on run-gates gate 4 (`npm test`), with 52 failing cases. 51 of them are watcher cases whose pass routes an inbox drop that cuts or reuses a clone, and the 52nd is a job-mode park sequence.

The gate wrapper keeps only each failing case's `not ok` line and the tail of the suite's output, so this log has no assertion message for any failure. Every diagnosis below comes from the current tree. All 52 failing cases run through the code this branch added to the watcher's passes (`cli/templates/scripts/autonomous-watcher.sh` → `tick()`: `host_wake_pass`, `keep_awake_resolve`, `keep_awake_pass`; `run_job`'s wait loop: `host_wake_pass`) and, where they launch, through the new launch head in `spawn_engine` (`keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')"`, then `exec "$AGENT_CLI"`). However, the way the failures are spread through the run points to a transient condition during part of the run rather than a defect in that code. Finding 1 sets out that evidence, and every other finding names it as the suspected shared cause. Each failing case still keeps its own entry.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only.

Order: the suspected root cause first (Finding 1, the case that tests the new launch head on the shared driver's default path), then the rest of the branch's own new suites, then the existing suites that cross the same pass, one file at a time.

1. [x] **Finding 1** — The keep-awake default-probe case fails: the shared root-cause check. _(layer: cli, general)_
2. [x] **Finding 2** — Keep-awake (a)(c): the macOS caffeinate hold case fails. _(layer: cli)_
3. [x] **Finding 3** — Keep-awake (b)(c): the exit-3 macOS hold case fails. _(layer: cli)_
4. [x] **Finding 4** — Keep-awake (d): the keepAwake-false case fails. _(layer: cli)_
5. [x] **Finding 5** — Keep-awake (l): the re-taken macOS hold case fails. _(layer: cli)_
6. [x] **Finding 6** — Keep-awake (e)-(h): the Linux logind session case fails. _(layer: cli)_
7. [ ] **Finding 7** — Keep-awake (i): the refused Linux lock case fails. _(layer: cli)_
8. [ ] **Finding 8** — Keep-awake (j): the WSL2 not-holding case fails. _(layer: cli)_
9. [ ] **Finding 9** — Keep-awake (k): the kill-switch battery release case fails. _(layer: cli)_
10. [ ] **Finding 10** — Stall host sleep (a)(b): the long-sleep case fails. _(layer: cli)_
11. [ ] **Finding 11** — Stall host sleep (c): the genuine-hang case fails. _(layer: cli)_
12. [ ] **Finding 12** — Stall host sleep (d): the missing last-pass file case fails. _(layer: cli)_
13. [ ] **Finding 13** — Sandbox refusal (d): the helper's default-probe launch fails. _(layer: cli)_
14. [ ] **Finding 14** — Sandbox refusal (b): the taken-optOut launch fails. _(layer: cli)_
15. [ ] **Finding 15** — Sandbox refusal (e): the GitHub Actions dispatch fails. _(layer: cli)_
16. [ ] **Finding 16** — Run profile: the per-run copy launch case fails. _(layer: cli)_
17. [ ] **Finding 17** — Run profile: the other-worktree pointer case fails. _(layer: cli)_
18. [ ] **Finding 18** — Run profile: the sandbox.enabled-false refusal fails. _(layer: cli)_
19. [ ] **Finding 19** — Run profile: the failIfUnavailable-false refusal fails. _(layer: cli)_
20. [ ] **Finding 20** — Run profile: the empty-base refusal fails. _(layer: cli)_
21. [ ] **Finding 21** — Run profile: the two-document base refusal fails. _(layer: cli)_
22. [ ] **Finding 22** — Run profile: the opt-out profile launch fails. _(layer: cli)_
23. [ ] **Finding 23** — Run profile: the clone exit sync case fails. _(layer: cli)_
24. [ ] **Finding 24** — Remote dispatch: the remote task drop case fails. _(layer: cli)_
25. [ ] **Finding 25** — Remote dispatch: the usage-hold and kill-switch case fails. _(layer: cli)_
26. [ ] **Finding 26** — Remote dispatch: the failed-dispatch case fails. _(layer: cli)_
27. [ ] **Finding 27** — Remote dispatch: the refused-push case fails. _(layer: cli)_
28. [ ] **Finding 28** — Remote dispatch: the one-live-copy re-drop case fails. _(layer: cli)_
29. [ ] **Finding 29** — Remote dispatch: the identical re-drop case fails. _(layer: cli)_
30. [ ] **Finding 30** — Remote dispatch: the remote review drop case fails. _(layer: cli)_
31. [ ] **Finding 31** — Remote dispatch: the key-absent launch case fails. _(layer: cli)_
32. [ ] **Finding 32** — Remote dispatch: the key-absent library routing case fails. _(layer: cli)_
33. [ ] **Finding 33** — Remote dispatch: the running remote record case fails. _(layer: cli)_
34. [ ] **Finding 34** — Remote park sequence: the stop-then-resume case fails. _(layer: cli)_
35. [ ] **Finding 35** — Review drop: the clean reused clone launch fails. _(layer: cli)_
36. [ ] **Finding 36** — Review drop (L2): the nested-repository fsmonitor case fails. _(layer: cli)_
37. [ ] **Finding 37** — Review drop (L3): the submodule fsmonitor case fails. _(layer: cli)_
38. [ ] **Finding 38** — Review drop (L5): the committed settings change refusal fails. _(layer: cli)_
39. [ ] **Finding 39** — Review drop (L6): the untracked post-checkout refusal fails. _(layer: cli)_
40. [ ] **Finding 40** — Review drop (L8): the symlinked user_reviews refusal fails. _(layer: cli)_
41. [ ] **Finding 41** — Review drop (L9): the forged-base case fails. _(layer: cli)_
42. [ ] **Finding 42** — Review drop (L10): the skip-worktree settings refusal fails. _(layer: cli)_
43. [ ] **Finding 43** — Review drop (L1): the planted config.worktree refusal fails. _(layer: cli)_
44. [ ] **Finding 44** — Review drop (L1c): the off-allow-list fsmonitor refusal fails. _(layer: cli)_
45. [ ] **Finding 45** — Stall reset: the honest hung run resume fails. _(layer: cli)_
46. [ ] **Finding 46** — Stall reset (S1): the reference-transaction refusal fails. _(layer: cli)_
47. [ ] **Finding 47** — Stall reset (S2): the committed settings hook refusal fails. _(layer: cli)_
48. [ ] **Finding 48** — Stall reset (S3): the nested-repository resume fails. _(layer: cli)_
49. [ ] **Finding 49** — Stall reset (S5): the symlinked PAUSE_PROGRESS.md refusal fails. _(layer: cli)_
50. [ ] **Finding 50** — Stall reset (S6): the forged-base case fails. _(layer: cli)_
51. [ ] **Finding 51** — Stall reset (S7): the skip-worktree settings refusal fails. _(layer: cli)_
52. [ ] **Finding 52** — Run-copy migration: the new drop beside a legacy run fails. _(layer: cli)_

---

## Must Fix

### 1. The keep-awake default-probe case fails: the shared root-cause check
→ [finding_1.md](fix_headless_run_host_sleep_task_round_1/finding_1.md)

### 2. Keep-awake (a)(c): the macOS caffeinate hold case fails
→ [finding_2.md](fix_headless_run_host_sleep_task_round_1/finding_2.md)

### 3. Keep-awake (b)(c): the exit-3 macOS hold case fails
→ [finding_3.md](fix_headless_run_host_sleep_task_round_1/finding_3.md)

### 4. Keep-awake (d): the keepAwake-false case fails
→ [finding_4.md](fix_headless_run_host_sleep_task_round_1/finding_4.md)

### 5. Keep-awake (l): the re-taken macOS hold case fails
→ [finding_5.md](fix_headless_run_host_sleep_task_round_1/finding_5.md)

### 6. Keep-awake (e)-(h): the Linux logind session case fails
→ [finding_6.md](fix_headless_run_host_sleep_task_round_1/finding_6.md)

### 7. Keep-awake (i): the refused Linux lock case fails
→ [finding_7.md](fix_headless_run_host_sleep_task_round_1/finding_7.md)

### 8. Keep-awake (j): the WSL2 not-holding case fails
→ [finding_8.md](fix_headless_run_host_sleep_task_round_1/finding_8.md)

### 9. Keep-awake (k): the kill-switch battery release case fails
→ [finding_9.md](fix_headless_run_host_sleep_task_round_1/finding_9.md)

### 10. Stall host sleep (a)(b): the long-sleep case fails
→ [finding_10.md](fix_headless_run_host_sleep_task_round_1/finding_10.md)

### 11. Stall host sleep (c): the genuine-hang case fails
→ [finding_11.md](fix_headless_run_host_sleep_task_round_1/finding_11.md)

### 12. Stall host sleep (d): the missing last-pass file case fails
→ [finding_12.md](fix_headless_run_host_sleep_task_round_1/finding_12.md)

### 13. Sandbox refusal (d): the helper's default-probe launch fails
→ [finding_13.md](fix_headless_run_host_sleep_task_round_1/finding_13.md)

### 14. Sandbox refusal (b): the taken-optOut launch fails
→ [finding_14.md](fix_headless_run_host_sleep_task_round_1/finding_14.md)

### 15. Sandbox refusal (e): the GitHub Actions dispatch fails
→ [finding_15.md](fix_headless_run_host_sleep_task_round_1/finding_15.md)

### 16. Run profile: the per-run copy launch case fails
→ [finding_16.md](fix_headless_run_host_sleep_task_round_1/finding_16.md)

### 17. Run profile: the other-worktree pointer case fails
→ [finding_17.md](fix_headless_run_host_sleep_task_round_1/finding_17.md)

### 18. Run profile: the sandbox.enabled-false refusal fails
→ [finding_18.md](fix_headless_run_host_sleep_task_round_1/finding_18.md)

### 19. Run profile: the failIfUnavailable-false refusal fails
→ [finding_19.md](fix_headless_run_host_sleep_task_round_1/finding_19.md)

### 20. Run profile: the empty-base refusal fails
→ [finding_20.md](fix_headless_run_host_sleep_task_round_1/finding_20.md)

### 21. Run profile: the two-document base refusal fails
→ [finding_21.md](fix_headless_run_host_sleep_task_round_1/finding_21.md)

### 22. Run profile: the opt-out profile launch fails
→ [finding_22.md](fix_headless_run_host_sleep_task_round_1/finding_22.md)

### 23. Run profile: the clone exit sync case fails
→ [finding_23.md](fix_headless_run_host_sleep_task_round_1/finding_23.md)

### 24. Remote dispatch: the remote task drop case fails
→ [finding_24.md](fix_headless_run_host_sleep_task_round_1/finding_24.md)

### 25. Remote dispatch: the usage-hold and kill-switch case fails
→ [finding_25.md](fix_headless_run_host_sleep_task_round_1/finding_25.md)

### 26. Remote dispatch: the failed-dispatch case fails
→ [finding_26.md](fix_headless_run_host_sleep_task_round_1/finding_26.md)

### 27. Remote dispatch: the refused-push case fails
→ [finding_27.md](fix_headless_run_host_sleep_task_round_1/finding_27.md)

### 28. Remote dispatch: the one-live-copy re-drop case fails
→ [finding_28.md](fix_headless_run_host_sleep_task_round_1/finding_28.md)

### 29. Remote dispatch: the identical re-drop case fails
→ [finding_29.md](fix_headless_run_host_sleep_task_round_1/finding_29.md)

### 30. Remote dispatch: the remote review drop case fails
→ [finding_30.md](fix_headless_run_host_sleep_task_round_1/finding_30.md)

### 31. Remote dispatch: the key-absent launch case fails
→ [finding_31.md](fix_headless_run_host_sleep_task_round_1/finding_31.md)

### 32. Remote dispatch: the key-absent library routing case fails
→ [finding_32.md](fix_headless_run_host_sleep_task_round_1/finding_32.md)

### 33. Remote dispatch: the running remote record case fails
→ [finding_33.md](fix_headless_run_host_sleep_task_round_1/finding_33.md)

### 34. Remote park sequence: the stop-then-resume case fails
→ [finding_34.md](fix_headless_run_host_sleep_task_round_1/finding_34.md)

### 35. Review drop: the clean reused clone launch fails
→ [finding_35.md](fix_headless_run_host_sleep_task_round_1/finding_35.md)

### 36. Review drop (L2): the nested-repository fsmonitor case fails
→ [finding_36.md](fix_headless_run_host_sleep_task_round_1/finding_36.md)

### 37. Review drop (L3): the submodule fsmonitor case fails
→ [finding_37.md](fix_headless_run_host_sleep_task_round_1/finding_37.md)

### 38. Review drop (L5): the committed settings change refusal fails
→ [finding_38.md](fix_headless_run_host_sleep_task_round_1/finding_38.md)

### 39. Review drop (L6): the untracked post-checkout refusal fails
→ [finding_39.md](fix_headless_run_host_sleep_task_round_1/finding_39.md)

### 40. Review drop (L8): the symlinked user_reviews refusal fails
→ [finding_40.md](fix_headless_run_host_sleep_task_round_1/finding_40.md)

### 41. Review drop (L9): the forged-base case fails
→ [finding_41.md](fix_headless_run_host_sleep_task_round_1/finding_41.md)

### 42. Review drop (L10): the skip-worktree settings refusal fails
→ [finding_42.md](fix_headless_run_host_sleep_task_round_1/finding_42.md)

### 43. Review drop (L1): the planted config.worktree refusal fails
→ [finding_43.md](fix_headless_run_host_sleep_task_round_1/finding_43.md)

### 44. Review drop (L1c): the off-allow-list fsmonitor refusal fails
→ [finding_44.md](fix_headless_run_host_sleep_task_round_1/finding_44.md)

### 45. Stall reset: the honest hung run resume fails
→ [finding_45.md](fix_headless_run_host_sleep_task_round_1/finding_45.md)

### 46. Stall reset (S1): the reference-transaction refusal fails
→ [finding_46.md](fix_headless_run_host_sleep_task_round_1/finding_46.md)

### 47. Stall reset (S2): the committed settings hook refusal fails
→ [finding_47.md](fix_headless_run_host_sleep_task_round_1/finding_47.md)

### 48. Stall reset (S3): the nested-repository resume fails
→ [finding_48.md](fix_headles`s_run_host_sleep_task_round_1/finding_48.md)

### 49. Stall reset (S5): the symlinked PAUSE_PROGRESS.md refusal fails
→ [finding_49.md](fix_headless_run_host_sleep_task_round_1/finding_49.md)

### 50. Stall reset (S6): the forged-base case fails
→ [finding_50.md](fix_headless_run_host_sleep_task_round_1/finding_50.md)

### 51. Stall reset (S7): the skip-worktree settings refusal fails
→ [finding_51.md](fix_headless_run_host_sleep_task_round_1/finding_51.md)

### 52. Run-copy migration: the new drop beside a legacy run fails
→ [finding_52.md](fix_headless_run_host_sleep_task_round_1/finding_52.md)

---

## Not fixable on this branch

None remaining. The log carries no sandbox-refusal line and no failure whose cause it shows to lie outside the tree. Finding 1 states the evidence that these failures were transient. That evidence is not proof, so every failing case is planned as fixable.

---

## Source failures

**Gate `typecheck` (`commands.typecheck`):** exited 0 (`PASS: typecheck`). No static failure, so there is nothing to map.

**Gate `test` (`commands.test`):** exited 1 (`FAIL: test (exit 1)`). Run-gates gate 4 (`  FAIL  4 npm test (exit 1)`) is the only failing run-gates gate (`run-gates: 1 failed, 22 passed`). The suite reports `# fail 52`, and the log names exactly 52 `not ok` lines. These are not failures and produce no finding: gates 6f, 13d and 14d (`SKIPPED`), gates 13a to 13c (`BLOCKED`: the Python environment is not provisioned under `<home>/.cache/harness-docs-retrieval/venvs/…`), and the gates the script lists as ones it cannot run.

All 52 cases are *new this round*, because there is no earlier log.

| Failing test (as the log names it) | Suite file | Maps to |
|---|---|---|
| `the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold` | `cli/test/watcher-keep-awake.test.mjs` | Finding 1 |
| `(a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream` | `cli/test/watcher-keep-awake.test.mjs` | Finding 2 |
| `(b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text` | `cli/test/watcher-keep-awake.test.mjs` | Finding 3 |
| `(d) execution.keepAwake false takes no hold, logs nothing, and status names it` | `cli/test/watcher-keep-awake.test.mjs` | Finding 4 |
| `(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true` | `cli/test/watcher-keep-awake.test.mjs` | Finding 5 |
| `(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session` | `cli/test/watcher-keep-awake.test.mjs` | Finding 6 |
| `(i) Linux: a refused lock logs once, still launches, and is never retried on mains` | `cli/test/watcher-keep-awake.test.mjs` | Finding 7 |
| `(j) WSL2: one not-holding line naming WSL2, and no tool invoked` | `cli/test/watcher-keep-awake.test.mjs` | Finding 8 |
| `(k) Linux: under the global kill switch a pass on battery still releases the hold` | `cli/test/watcher-keep-awake.test.mjs` | Finding 9 |
| `(a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills` | `cli/test/watcher-stall-host-sleep.test.mjs` | Finding 10 |
| `(c) a genuinely hung run with no host sleep is killed on the pass, as before` | `cli/test/watcher-stall-host-sleep.test.mjs` | Finding 11 |
| `(d) a missing or non-integer last-pass file records no wake and never defers a kill` | `cli/test/watcher-stall-host-sleep.test.mjs` | Finding 12 |
| `(d) the helper's default probe launches the stub` | `cli/test/watcher-sandbox-refusal.test.mjs` | Finding 13 |
| `(b) a taken sandbox.optOut exempts the drop: the stub is launched` | `cli/test/watcher-sandbox-refusal.test.mjs` | Finding 14 |
| `(e) a drop sent to GitHub Actions never consults the probe and is dispatched` | `cli/test/watcher-sandbox-refusal.test.mjs` | Finding 15 |
| `a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone's exact entries` | `cli/test/watcher-run-profile.test.mjs` | Finding 16 |
| `another live linked worktree's .git pointer is in the clone run's per-run copy` | `cli/test/watcher-run-profile.test.mjs` | Finding 17 |
| `the launch is refused on the base's sandbox.enabled false with no opt-out marker` | `cli/test/watcher-run-profile.test.mjs` | Finding 18 |
| `the launch is refused on the base's sandbox.failIfUnavailable false` | `cli/test/watcher-run-profile.test.mjs` | Finding 19 |
| `the launch is refused on an empty base file` | `cli/test/watcher-run-profile.test.mjs` | Finding 20 |
| `the launch is refused on a base that is two JSON documents` | `cli/test/watcher-run-profile.test.mjs` | Finding 21 |
| `the opt-out profile init renders from sandbox.optOut launches` | `cli/test/watcher-run-profile.test.mjs` | Finding 22 |
| `a clone run's exit syncs its branch into the main checkout` | `cli/test/watcher-run-profile.test.mjs` | Finding 23 |
| `a remote task drop is committed, pushed and dispatched, never spawned` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 24 |
| `the usage hold and the cap do not gate a remote drop; the kill switch still defers it` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 25 |
| `a failed dispatch leaves the record failed with one failed notification` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 26 |
| `a push origin refuses blocks the dispatch` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 27 |
| `a task re-drop is refused by the one-live-copy rule, and proceeds once the copy and branch are gone` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 28 |
| `an identical re-drop after a refused push skips the commit, lands the push and dispatches once` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 29 |
| `a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 30 |
| `with the key absent the same drop launches the agent and sends nothing to gh` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 31 |
| `with the key absent a drop routes through the library: task engine on its branch, junk rejected` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 32 |
| `a running remote record is never reconciled, counted, stall-killed or usage-paused` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 33 |
| `stop, then resume: park, answer, a job killed mid-session, then a pause resume completes and delivers` | `cli/test/watcher-remote-park-sequence.test.mjs` | Finding 34 |
| `a clean reused clone launches, with the review placed and left uncommitted` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 35 |
| `(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 36 |
| `(L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 37 |
| `(L5) a committed .claude/settings.json change, the working-tree file untouched, is refused` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 38 |
| `(L6) an untracked githooks/post-checkout is refused` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 39 |
| `(L8) a user_reviews directory that is a symlink out of the clone is refused, and nothing is written outside` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 40 |
| `(L9) a forged base: the local default-branch refs pointed at a payload tip do not pass it` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 41 |
| `(L10) a session-written .claude/settings.json hidden by a skip-worktree bit in the clone's index is refused` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 42 |
| `(L1) a .git/config.worktree planted in the clone, carrying core.fsmonitor, is refused and never read` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 43 |
| `(L1c) a core.fsmonitor in the clone's .git/config, off the allow-list, is refused and never run` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 44 |
| `an honest hung run resumes: the edit discarded, the branch unmoved, the note written` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 45 |
| `(S1) a githooks/reference-transaction committed on the branch is refused, and never runs` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 46 |
| `(S2) a .claude/settings.json committed with a hook is refused, and the working-tree file is not installed` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 47 |
| `(S3) a nested repository's own core.fsmonitor behind a gitlink is never run: the run resumes` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 48 |
| `(S5) a PAUSE_PROGRESS.md symlinked out of the clone is refused, and the outside file is unchanged` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 49 |
| `(S6) a forged base: the local default-branch refs pointed at a payload tip do not pass it` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 50 |
| `(S7) a session-written .claude/settings.json hidden by a skip-worktree bit in the clone's index is refused` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 51 |
| `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree` | `cli/test/run-copy-migration.test.mjs` | Finding 52 |
