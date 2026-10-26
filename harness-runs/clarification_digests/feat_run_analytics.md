## question_1 — Set the executable bit on `scripts/run-analytics.sh`, which the run's permission profile refused
- **raised by:** Phase C2.4 (skeptic-review fix loop), `layer-implementer` (layer `general`), on readiness entry 1 of the skeptic-review index (`harness-runs/skeptic_reviews/feat_run_analytics_skeptic_review/finding_1.md`).
- **asked:** Q1 — this repository's own copy, `scripts/run-analytics.sh`, was committed as `100644` because Task 9 wrote it with the file tools after `cp` was refused. The watcher's `record_run_analytics` checks `[ ! -x "$RUN_ANALYTICS" ]`, so at 644 it records nothing for any run in this repository. Adopters are unaffected: `OUTER_LOOP_SCRIPTS` declares the file `mode: 0o755`. The profile refused `chmod 755 scripts/run-analytics.sh` twice, and no allow entry covers `chmod` or `git update-index --chmod`. Options:
  - **(a) Set the bit yourself, then resume.** In the run copy `autonomous-sdlc-harness-feat_run_analytics`, run `chmod 755 scripts/run-analytics.sh` and leave the change uncommitted. On resume, the fix dispatch sees the mode already set and the committer stages the mode change as Finding 1's commit (`100755`). The C2.4 loop then continues to Finding 2.
  - **(b) Add a narrow allow entry for this one command** to the run's permission profile, `Bash(chmod 755 scripts/run-analytics.sh)`, then resume. The fix dispatch then sets the bit itself.
  - **(c) Accept the defect for now.** Finding 1 is closed unfixed and fixed by hand at review. Say so, and the resumed run records it as an assumption and goes on to Finding 2.
- **answered:** Q1: (a) — executable bit set on scripts/run-analytics.sh in the run copy, left uncommitted.
- **carries beyond this branch:** nothing beyond this branch

## question_2 — How to resolve the persisting round-2 watcher-test failures, given that the race the test fix plan blamed does not occur
- **raised by:** Phase G — Run gates, row G.4 fix loop, `layer-implementer` (layer `cli`), on readiness entry 1 (Finding 1) of the round-2 test fix plan (`harness-runs/test_fix_plans/feat_run_analytics_task_round_2/finding_1.md`; index `harness-runs/test_fix_plans/feat_run_analytics_task_round_2.md`; gate log `harness-runs/test_run_logs/feat_run_analytics/task_round_2.log`).
- **asked:** Q1 — round 2's `npm test` failed 7 of 2328 tests, all of which had also failed in round 1: the four `cli/test/watcher-run-analytics.test.mjs` subtests, `watcher-sandbox-refusal` (d), and `watcher-review-drop-payloads` (L2). The implementer measured no race: in 41 launch passes no analytics commit failed. The planned retry on exit `4` cannot be built, because `hr_commit_placed` maps the library's `4` to `1`. The cost is launch-pass time under load:

  | K | Time per pass | Against the 120 000 ms bound |
  |---|---|---|
  | 1 | about 13 s | — |
  | 10 | 34–39 s | — |
  | 30 | 116–155 s | mostly over it |

  The branch's hook adds about 28–35% to a launch pass, at about 1.6 s per analytics commit. The likely cause (inferred, not reproduced): under full-suite load the launch pass outlasts its bound, and a timeout in subtest 1 also fails subtests 2–4, which depend on it. Options:
  - **(a) Give the analytics launch case its own bound** in the `Fix` sections of `finding_1.md` (and `finding_5.md` / `finding_6.md` if they should follow).
  - **(b) Cut the hook's cost** by requiring one shared copy check across the two analytics commits, through a new `hr_commit_placed` contract in `cli/templates/scripts/lib/harness-run-lib.sh` and its mirror. This saves only about 0.9 s of a 13 s pass.
  - **(c) Rule the failures environmental (host load).** Flip Findings 1–6 to `[x]` and commit that, then resume straight to round 3.
  - **(d) Something else**, made effective on disk the same way.
- **answered:** Q1 — (d), combined with (a) for the analytics suite only, and made effective on disk at cb34217d. The fix is in the tests only. The shared watcher fixture runs with the analytics hook neutralised by default, adding no commit and no watcher-log line, so suites that do not test analytics stop paying ~3.2 s per launch pass. Only cli/test/watcher-run-analytics.test.mjs opts in, and its launch passes through the hook get a ceiling of twice the per-pass bound through tick's timeoutMs and scaleBound. No production or library change: the hook's cost on a real launch is accepted. The "do not lengthen any bound" rule is lifted for that one ceiling only, and no assertion changes. The full ruling is in the Fix sections of finding_1.md, finding_5.md and finding_6.md of the round-2 test fix plan. A lone-file pass shows only that nothing broke; the round-3 gate run is the verification.
- **carries beyond this branch:** a standing test-fixture decision — the shared watcher fixture (`cli/test/helpers/watcher.mjs` → `createWatcherFixture`) runs with the run-analytics hook neutralised by default, and only a suite that tests analytics opts in (`runAnalytics: true`). The hook's cost on a real launch (about 1.6 s per analytics commit) is accepted, with no production or library change.
