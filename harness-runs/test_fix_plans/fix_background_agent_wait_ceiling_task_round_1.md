# Test Fix Plan: fix_background_agent_wait_ceiling — task round 1

## Context

- **Branch:** `fix_background_agent_wait_ceiling`
- **Log:** `harness-runs/test_run_logs/fix_background_agent_wait_ceiling/task_round_1.log`
- **Earlier logs:** none — this is the first gate round.

The typecheck gate passed (`exited 0`); the test gate failed at gate 4 (`npm test`, exit 1) with 45 failing tests and 2 cancelled across ten watcher suites under `cli/test/`, plus two file-level failures (`watcher-review-drop-payloads.test.mjs`, `watcher-stall-reset-payloads.test.mjs`), while every other gate the script runs passed or was reported BLOCKED / SKIPPED for a tool the host lacks.

The log carries **no assertion text** for any failure: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of the `npm test` output. Every diagnosis below is therefore made against the current tree. The suspected shared cause, stated in each finding: the failing tests drive watcher paths the branch's change does not alter in any way they assert, sibling tests of identical shape and the branch's own new watcher suites passed in the same run, and the run took 3 390 s with 2 tests cancelled — consistent with scaled time bounds exceeded on a loaded host. That is a suspicion, not a proof, so every failure keeps its own finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop: walk it top to bottom, and treat `[ ]` markers anywhere else — including the `- [ ]` sub-step bullets inside the finding files — as informational only. Finding 1 comes first because it is the cleanest probe of the suspected shared cause (it differs from a passing sibling only by the stub's exit code); Finding 29 precedes Findings 30–34 because those four subtests and their parent read state Finding 29's subtest sets up.

1. [x] **Finding 1** — keep-awake (b)(c): exit 3 classified failed under a hold. _(layer: cli, general)_
2. [x] **Finding 2** — keep-awake: the driver's default probe is silent. _(layer: cli, general)_
3. [x] **Finding 3** — keep-awake (d): execution.keepAwake false takes no hold. _(layer: cli, general)_
4. [x] **Finding 4** — keep-awake (l): a released hold is retaken once the key is true. _(layer: cli, general)_
5. [x] **Finding 5** — keep-awake (e)-(h): the logind hold follows mains power. _(layer: cli, general)_
6. [x] **Finding 6** — keep-awake (i): a refused lock logs once and is never retried. _(layer: cli, general)_
7. [x] **Finding 7** — keep-awake (j): one WSL2 not-holding line. _(layer: cli, general)_
8. [x] **Finding 8** — keep-awake (k): kill switch on battery still releases the hold. _(layer: cli, general)_
9. [x] **Finding 9** — placeholder host: a planted .git/commondir refuses the resume. _(layer: cli, general)_
10. [ ] **Finding 10** — placeholder host: the manifest lists exactly the absent paths. _(layer: cli, general)_
11. [ ] **Finding 11** — placeholder host: a second queued run is deferred at cap 1. _(layer: cli, general)_
12. [ ] **Finding 12** — placeholder host: with the seam off no manifest is written. _(layer: cli, general)_
13. [ ] **Finding 13** — placeholder host (1): a leftover scriptsDir/.git is swept. _(layer: cli, general)_
14. [ ] **Finding 14** — placeholder host (2): a leftover .git/commondir is kept while live. _(layer: cli, general)_
15. [ ] **Finding 15** — placeholder host (5): a .git/commondir with content refuses the resume. _(layer: cli, general)_
16. [ ] **Finding 16** — remote dispatch: a remote task drop is dispatched, never spawned. _(layer: cli, general)_
17. [ ] **Finding 17** — remote dispatch: hold and cap do not gate a remote drop. _(layer: cli, general)_
18. [ ] **Finding 18** — remote dispatch: a failed dispatch leaves the record failed. _(layer: cli, general)_
19. [ ] **Finding 19** — remote dispatch: a refused push blocks the dispatch. _(layer: cli, general)_
20. [ ] **Finding 20** — remote dispatch: a task re-drop and the one-live-copy rule. _(layer: cli, general)_
21. [ ] **Finding 21** — review drop: a clean reused clone launches. _(layer: cli, general)_
22. [ ] **Finding 22** — review drop (L2): a nested repository's core.fsmonitor is never run. _(layer: cli, general)_
23. [ ] **Finding 23** — review drop (L3): a submodule core.fsmonitor is never run. _(layer: cli, general)_
24. [ ] **Finding 24** — review drop (L5): a committed .claude/settings.json change is refused. _(layer: cli, general)_
25. [ ] **Finding 25** — review drop (L6): an untracked githooks/post-checkout is refused. _(layer: cli, general)_
26. [ ] **Finding 26** — review drop (L8): a symlinked user_reviews directory is refused. _(layer: cli, general)_
27. [ ] **Finding 27** — review drop (L9): a forged base does not pass. _(layer: cli, general)_
28. [ ] **Finding 28** — review drop: the suite file reported as failed. _(layer: cli, general)_
29. [ ] **Finding 29** — run analytics: a launch commits both analytics files and pushes. _(layer: cli, general)_
30. [ ] **Finding 30** — run analytics: a resume adding no session adds no commit. _(layer: cli, general)_
31. [ ] **Finding 31** — run analytics: a refused push is one watcher-log line. _(layer: cli, general)_
32. [ ] **Finding 32** — run analytics: a run-analytics.sh exiting 1 changes no outcome. _(layer: cli, general)_
33. [ ] **Finding 33** — run analytics: a missing run-analytics.sh changes no outcome. _(layer: cli, general)_
34. [ ] **Finding 34** — run analytics: the parent test. _(layer: cli, general)_
35. [ ] **Finding 35** — run profile: a task drop launches on a per-run copy. _(layer: cli, general)_
36. [ ] **Finding 36** — run profile: another live worktree's .git pointer is in the copy. _(layer: cli, general)_
37. [ ] **Finding 37** — run profile: a placeholder host's copy omits each omit row's denyWrite. _(layer: cli, general)_
38. [ ] **Finding 38** — run profile: refused on sandbox.enabled false. _(layer: cli, general)_
39. [ ] **Finding 39** — run profile: refused on a two-document base. _(layer: cli, general)_
40. [ ] **Finding 40** — run profile: the opt-out profile launches. _(layer: cli, general)_
41. [ ] **Finding 41** — sandbox refusal (b): a taken optOut launches the stub. _(layer: cli, general)_
42. [ ] **Finding 42** — sandbox refusal (d): the default probe launches the stub. _(layer: cli, general)_
43. [ ] **Finding 43** — stall host sleep (a)(b): a long host sleep is not silence. _(layer: cli, general)_
44. [ ] **Finding 44** — stall host sleep (c): a hung run with no sleep is killed. _(layer: cli, general)_
45. [ ] **Finding 45** — stall reset: an honest hung run resumes. _(layer: cli, general)_
46. [ ] **Finding 46** — stall reset (S2): a committed settings hook is refused. _(layer: cli, general)_
47. [ ] **Finding 47** — stall reset: the suite file reported as failed. _(layer: cli, general)_

## Must Fix

### 1. keep-awake (b)(c): exit 3 classified failed under a hold
→ [finding_1.md](fix_background_agent_wait_ceiling_task_round_1/finding_1.md)

### 2. keep-awake: the driver's default probe is silent
→ [finding_2.md](fix_background_agent_wait_ceiling_task_round_1/finding_2.md)

### 3. keep-awake (d): execution.keepAwake false takes no hold
→ [finding_3.md](fix_background_agent_wait_ceiling_task_round_1/finding_3.md)

### 4. keep-awake (l): a released hold is retaken once the key is true
→ [finding_4.md](fix_background_agent_wait_ceiling_task_round_1/finding_4.md)

### 5. keep-awake (e)-(h): the logind hold follows mains power
→ [finding_5.md](fix_background_agent_wait_ceiling_task_round_1/finding_5.md)

### 6. keep-awake (i): a refused lock logs once and is never retried
→ [finding_6.md](fix_background_agent_wait_ceiling_task_round_1/finding_6.md)

### 7. keep-awake (j): one WSL2 not-holding line
→ [finding_7.md](fix_background_agent_wait_ceiling_task_round_1/finding_7.md)

### 8. keep-awake (k): kill switch on battery still releases the hold
→ [finding_8.md](fix_background_agent_wait_ceiling_task_round_1/finding_8.md)

### 9. placeholder host: a planted .git/commondir refuses the resume
→ [finding_9.md](fix_background_agent_wait_ceiling_task_round_1/finding_9.md)

### 10. placeholder host: the manifest lists exactly the absent paths
→ [finding_10.md](fix_background_agent_wait_ceiling_task_round_1/finding_10.md)

### 11. placeholder host: a second queued run is deferred at cap 1
→ [finding_11.md](fix_background_agent_wait_ceiling_task_round_1/finding_11.md)

### 12. placeholder host: with the seam off no manifest is written
→ [finding_12.md](fix_background_agent_wait_ceiling_task_round_1/finding_12.md)

### 13. placeholder host (1): a leftover scriptsDir/.git is swept
→ [finding_13.md](fix_background_agent_wait_ceiling_task_round_1/finding_13.md)

### 14. placeholder host (2): a leftover .git/commondir is kept while live
→ [finding_14.md](fix_background_agent_wait_ceiling_task_round_1/finding_14.md)

### 15. placeholder host (5): a .git/commondir with content refuses the resume
→ [finding_15.md](fix_background_agent_wait_ceiling_task_round_1/finding_15.md)

### 16. remote dispatch: a remote task drop is dispatched, never spawned
→ [finding_16.md](fix_background_agent_wait_ceiling_task_round_1/finding_16.md)

### 17. remote dispatch: hold and cap do not gate a remote drop
→ [finding_17.md](fix_background_agent_wait_ceiling_task_round_1/finding_17.md)

### 18. remote dispatch: a failed dispatch leaves the record failed
→ [finding_18.md](fix_background_agent_wait_ceiling_task_round_1/finding_18.md)

### 19. remote dispatch: a refused push blocks the dispatch
→ [finding_19.md](fix_background_agent_wait_ceiling_task_round_1/finding_19.md)

### 20. remote dispatch: a task re-drop and the one-live-copy rule
→ [finding_20.md](fix_background_agent_wait_ceiling_task_round_1/finding_20.md)

### 21. review drop: a clean reused clone launches
→ [finding_21.md](fix_background_agent_wait_ceiling_task_round_1/finding_21.md)

### 22. review drop (L2): a nested repository's core.fsmonitor is never run
→ [finding_22.md](fix_background_agent_wait_ceiling_task_round_1/finding_22.md)

### 23. review drop (L3): a submodule core.fsmonitor is never run
→ [finding_23.md](fix_background_agent_wait_ceiling_task_round_1/finding_23.md)

### 24. review drop (L5): a committed .claude/settings.json change is refused
→ [finding_24.md](fix_background_agent_wait_ceiling_task_round_1/finding_24.md)

### 25. review drop (L6): an untracked githooks/post-checkout is refused
→ [finding_25.md](fix_background_agent_wait_ceiling_task_round_1/finding_25.md)

### 26. review drop (L8): a symlinked user_reviews directory is refused
→ [finding_26.md](fix_background_agent_wait_ceiling_task_round_1/finding_26.md)

### 27. review drop (L9): a forged base does not pass
→ [finding_27.md](fix_background_agent_wait_ceiling_task_round_1/finding_27.md)

### 28. review drop: the suite file reported as failed
→ [finding_28.md](fix_background_agent_wait_ceiling_task_round_1/finding_28.md)

### 29. run analytics: a launch commits both analytics files and pushes
→ [finding_29.md](fix_background_agent_wait_ceiling_task_round_1/finding_29.md)

### 30. run analytics: a resume adding no session adds no commit
→ [finding_30.md](fix_background_agent_wait_ceiling_task_round_1/finding_30.md)

### 31. run analytics: a refused push is one watcher-log line
→ [finding_31.md](fix_background_agent_wait_ceiling_task_round_1/finding_31.md)

### 32. run analytics: a run-analytics.sh exiting 1 changes no outcome
→ [finding_32.md](fix_background_agent_wait_ceiling_task_round_1/finding_32.md)

### 33. run analytics: a missing run-analytics.sh changes no outcome
→ [finding_33.md](fix_background_agent_wait_ceiling_task_round_1/finding_33.md)

### 34. run analytics: the parent test
→ [finding_34.md](fix_background_agent_wait_ceiling_task_round_1/finding_34.md)

### 35. run profile: a task drop launches on a per-run copy
→ [finding_35.md](fix_background_agent_wait_ceiling_task_round_1/finding_35.md)

### 36. run profile: another live worktree's .git pointer is in the copy
→ [finding_36.md](fix_background_agent_wait_ceiling_task_round_1/finding_36.md)

### 37. run profile: a placeholder host's copy omits each omit row's denyWrite
→ [finding_37.md](fix_background_agent_wait_ceiling_task_round_1/finding_37.md)

### 38. run profile: refused on sandbox.enabled false
→ [finding_38.md](fix_background_agent_wait_ceiling_task_round_1/finding_38.md)

### 39. run profile: refused on a two-document base
→ [finding_39.md](fix_background_agent_wait_ceiling_task_round_1/finding_39.md)

### 40. run profile: the opt-out profile launches
→ [finding_40.md](fix_background_agent_wait_ceiling_task_round_1/finding_40.md)

### 41. sandbox refusal (b): a taken optOut launches the stub
→ [finding_41.md](fix_background_agent_wait_ceiling_task_round_1/finding_41.md)

### 42. sandbox refusal (d): the default probe launches the stub
→ [finding_42.md](fix_background_agent_wait_ceiling_task_round_1/finding_42.md)

### 43. stall host sleep (a)(b): a long host sleep is not silence
→ [finding_43.md](fix_background_agent_wait_ceiling_task_round_1/finding_43.md)

### 44. stall host sleep (c): a hung run with no sleep is killed
→ [finding_44.md](fix_background_agent_wait_ceiling_task_round_1/finding_44.md)

### 45. stall reset: an honest hung run resumes
→ [finding_45.md](fix_background_agent_wait_ceiling_task_round_1/finding_45.md)

### 46. stall reset (S2): a committed settings hook is refused
→ [finding_46.md](fix_background_agent_wait_ceiling_task_round_1/finding_46.md)

### 47. stall reset: the suite file reported as failed
→ [finding_47.md](fix_background_agent_wait_ceiling_task_round_1/finding_47.md)

## Not fixable on this branch

None. Gate 4 is the only failing gate. Gate 13's `BLOCKED` lines (13a–13c, `python-service: not provisioned`) and the `SKIPPED` lines (13d, 14d) are reported by the gate script as not run, not as failures, and `run-gates: 1 failed, 24 passed` counts only gate 4 — so they yield no finding.

## Source failures

Class for every entry: *first round* — no earlier log was named, so none is classified new-versus-persisting.

**typecheck gate** — `exited 0`; no failures.

**test gate — gate 4 `npm test` (exit 1)**

| Log line | Test file | Mapped to |
|---|---|---|
| `not ok 1199 - (b)(c) macOS: an engine exiting 3 is classified failed under a hold, …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 1 |
| `not ok 1200 - the driver's default probe is silent: …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 2 |
| `not ok 1201 - (d) execution.keepAwake false takes no hold, …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 3 |
| `not ok 1202 - (l) macOS: a hold released by execution.keepAwake false is taken again …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 4 |
| `not ok 1203 - (e)-(h) Linux: the logind hold waits on the engine, …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 5 |
| `not ok 1204 - (i) Linux: a refused lock logs once, …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 6 |
| `not ok 1205 - (j) WSL2: one not-holding line naming WSL2, …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 7 |
| `not ok 1206 - (k) Linux: under the global kill switch a pass on battery …` | `cli/test/watcher-keep-awake.test.mjs` | Finding 8 |
| `not ok 1232 - a planted .git/commondir in the clone refuses the resume` | `cli/test/watcher-placeholder-host.test.mjs` | Finding 9 |
| `not ok 1233 - after a launch the manifest lists exactly the absent exact denyWrite …` | `cli/test/watcher-placeholder-host.test.mjs` | Finding 10 |
| `not ok 1234 - a second queued run is deferred at cap 1, …` | `cli/test/watcher-placeholder-host.test.mjs` | Finding 11 |
| `not ok 1236 - with the seam off no manifest is written, two runs launch, …` | `cli/test/watcher-placeholder-host.test.mjs` | Finding 12 |
| `not ok 1237 - (1) a recorded leftover <scriptsDir>/.git is swept …` | `cli/test/watcher-placeholder-host.test.mjs` | Finding 13 |
| `not ok 1238 - (2) a recorded leftover .git/commondir is kept while its run is live …` | `cli/test/watcher-placeholder-host.test.mjs` | Finding 14 |
| `not ok 1242 - (5) a recorded .git/commondir with content is kept …` | `cli/test/watcher-placeholder-host.test.mjs` | Finding 15 |
| `not ok 1257 - a remote task drop is committed, pushed and dispatched, never spawned` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 16 |
| `not ok 1258 - the usage hold and the cap do not gate a remote drop; …` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 17 |
| `not ok 1259 - a failed dispatch leaves the record failed with one failed notification` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 18 |
| `not ok 1260 - a push origin refuses blocks the dispatch` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 19 |
| `not ok 1261 - a task re-drop is refused by the one-live-copy rule, …` | `cli/test/watcher-remote-dispatch.test.mjs` | Finding 20 |
| `not ok 1302 - a clean reused clone launches, …` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 21 |
| `not ok 1303 - (L2) a nested repository's own core.fsmonitor …` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 22 |
| `not ok 1304 - (L3) a core.fsmonitor in the clone's submodule config …` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 23 |
| `not ok 1305 - (L5) a committed .claude/settings.json change, …` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 24 |
| `not ok 1306 - (L6) an untracked githooks/post-checkout is refused` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 25 |
| `not ok 1307 - (L8) a user_reviews directory that is a symlink out of the clone …` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 26 |
| `not ok 1308 - (L9) a forged base: …` | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 27 |
| `not ok 123 - cli/test/watcher-review-drop-payloads.test.mjs` (file-level) | `cli/test/watcher-review-drop-payloads.test.mjs` | Finding 28 |
| `not ok 1 - a launch commits run-analytics.json then run-analytics.md …` (subtest of 1320) | `cli/test/watcher-run-analytics.test.mjs` | Finding 29 |
| `not ok 2 - a resume that adds no session adds no analytics commit …` (subtest of 1320) | `cli/test/watcher-run-analytics.test.mjs` | Finding 30 |
| `not ok 3 - a push origin refuses after the commits is one watcher-log line …` (subtest of 1320) | `cli/test/watcher-run-analytics.test.mjs` | Finding 31 |
| `not ok 4 - a run-analytics.sh that exits 1 changes neither …` (subtest of 1320) | `cli/test/watcher-run-analytics.test.mjs` | Finding 32 |
| `not ok 5 - a missing run-analytics.sh changes neither …` (subtest of 1320) | `cli/test/watcher-run-analytics.test.mjs` | Finding 33 |
| `not ok 1320 - the session's analytics are committed and pushed on the run's branch, …` | `cli/test/watcher-run-analytics.test.mjs` | Finding 34 |
| `not ok 1321 - a task drop launches on a per-run copy at hr_run_profile_file: …` | `cli/test/watcher-run-profile.test.mjs` | Finding 35 |
| `not ok 1323 - another live linked worktree's .git pointer is in the clone run's per-run copy` | `cli/test/watcher-run-profile.test.mjs` | Finding 36 |
| `not ok 1324 - on a placeholder host a clone's per-run copy omits …` | `cli/test/watcher-run-profile.test.mjs` | Finding 37 |
| `not ok 1325 - the launch is refused on the base's sandbox.enabled false with no opt-out marker` | `cli/test/watcher-run-profile.test.mjs` | Finding 38 |
| `not ok 1328 - the launch is refused on a base that is two JSON documents` | `cli/test/watcher-run-profile.test.mjs` | Finding 39 |
| `not ok 1330 - the opt-out profile init renders from sandbox.optOut launches` | `cli/test/watcher-run-profile.test.mjs` | Finding 40 |
| `not ok 1342 - (b) a taken sandbox.optOut exempts the drop: the stub is launched` | `cli/test/watcher-sandbox-refusal.test.mjs` | Finding 41 |
| `not ok 1344 - (d) the helper's default probe launches the stub` | `cli/test/watcher-sandbox-refusal.test.mjs` | Finding 42 |
| `not ok 1346 - (a)(b) a long host sleep is not silence at the first pass after wake; …` | `cli/test/watcher-stall-host-sleep.test.mjs` | Finding 43 |
| `not ok 1347 - (c) a genuinely hung run with no host sleep is killed on the pass, as before` | `cli/test/watcher-stall-host-sleep.test.mjs` | Finding 44 |
| `not ok 1349 - an honest hung run resumes: the edit discarded, the branch unmoved, the note written` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 45 |
| `not ok 1351 - (S2) a .claude/settings.json committed with a hook is refused, …` | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 46 |
| `not ok 129 - cli/test/watcher-stall-reset-payloads.test.mjs` (file-level) | `cli/test/watcher-stall-reset-payloads.test.mjs` | Finding 47 |

The summary lines read `# fail 45` and `# cancelled 2`. The log does not say which of the `not ok` lines above are the two cancellations, so no line is mapped as one; every `not ok` line the log carries is mapped above exactly once.
