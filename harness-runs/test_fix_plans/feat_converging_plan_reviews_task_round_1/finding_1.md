### 1. Job-mode stall kill: the relaunched session leaves no registry snapshot, and the kill-time placeholder sweep removes nothing

**Site anchors** (each grep-verified in the current tree; line numbers are navigation hints only):

- `cli/test/watcher-placeholder-host.test.mjs` — test `job: (1) a stall kill in a job sweeps its recorded leftovers before the reset, and the run resumes`, the failing assertion `assert.notEqual(resumed, null, \`the session was not relaunched:\n${log}\`)` (near line 818).
- `cli/test/helpers/watcher.mjs` → `hungBody` — the relaunch arm `cp "$REGISTRY" "$REC/resumed-registry.json"`.
- `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`, the kill-tier sweep block — `placeholder_sweep_pass "$b" 0` directly after the `tree_left` wait loop, followed by `log "stall-watchdog: '$b' -> reset to the last commit and resume (restart #$((restarts + 1)))"`.
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_placeholder_sweep_var` (returns 1, logging nothing, when no manifest argument was readable).

**Failing test:** `cli/test/watcher-placeholder-host.test.mjs` — `job: (1) a stall kill in a job sweeps its recorded leftovers before the reset, and the run resumes` (TAP `not ok 1754`).

**The failure, quoted from the log** (absolute paths under the checkout rewritten repo-relative):

```
not ok 1754 - job: (1) a stall kill in a job sweeps its recorded leftovers before the reset, and the run resumes
  location: 'cli/test/watcher-placeholder-host.test.mjs:796:1'
  failureType: 'testCodeFailure'
  error: |-
    the session was not relaunched:
    2026-11-14T09:13:51 [watcher] job: launching run for 'feat_x' (engine=task) in /private/var/folders/5t/ht_j4jgs5h51bf16nmfz885m0000gn/T/harness-fixture-esMs8r (log: /private/var/folders/5t/ht_j4jgs5h51bf16nmfz885m0000gn/T/harness-fixture-esMs8r/devscene/autonomous_logs/feat_x.log)
    2026-11-14T09:13:51 [watcher] session environment for 'feat_x': removing GH_TOKEN GITHUB_TOKEN HARNESS_PR_TOKEN NPM_TOKEN DEVSCENE_PUSH_URL DEVSCENE_GIT_TOKEN
    2026-11-14T09:13:53 [watcher] stall-watchdog: 'feat_x' is hung (2s with no output, pid 69797) — killing its process tree
    2026-11-14T09:13:56 [watcher] stall-watchdog: 'feat_x' -> reset to the last commit and resume (restart #1)
    2026-11-14T09:13:56 [watcher] session environment for 'feat_x': removing GH_TOKEN GITHUB_TOKEN HARNESS_PR_TOKEN NPM_TOKEN DEVSCENE_PUSH_URL DEVSCENE_GIT_TOKEN
    remote-run.sh: no 'devscene pause feat_x' run was created at or after 1794640430
    2026-11-14T09:13:57 [watcher] job: control poll of 'feat_x' since 1794640430 (exit 5): remote-run.sh: no 'devscene pause feat_x' run was created at or after 1794640430
    2026-11-14T09:13:58 [watcher] classify: 'feat_x' has no readable ledger (absent: no ledger at flow_progress/feat_x_progress.md) after a stall restart — not classifying it completed
    2026-11-14T09:13:58 [watcher] run 'feat_x' paused (unfinished) — the session exited 0 before its ledger finished (absent: no ledger at flow_progress/feat_x_progress.md, after a stall restart); resume with /devscene:branch-resume feat_x
    2026-11-14T09:13:59 [watcher] job: no auto-resume of 'feat_x' after an unfinished session — 0 of REMOTE_AUTO_RESUME_MAX=0 used
    2026-11-14T09:13:59 [watcher] placeholder sweep: removed /private/var/folders/5t/ht_j4jgs5h51bf16nmfz885m0000gn/T/harness-fixture-esMs8r/.claude/settings.local.json
    2026-11-14T09:13:59 [watcher] placeholder sweep: removed /private/var/folders/5t/ht_j4jgs5h51bf16nmfz885m0000gn/T/harness-fixture-esMs8r/devscene-scripts/.git
  code: 'ERR_ASSERTION'
  operator: 'notStrictEqual'
  stack: TestContext.<anonymous> (cli/test/watcher-placeholder-host.test.mjs:818:10)
```

The suite summary for the file: `199.0 s  test/watcher-placeholder-host.test.mjs  (27 tests, 1 failed)`; the run's totals `# tests 3930`, `# pass 3925`, `# fail 1`, `# skipped 4`.

**Class:** first round on this branch (no earlier log), so neither *new this round* nor *persisting* can be established.

**Diagnosis.**

- **What the assertion means.** `resumed` is `null` only when `<REC>/resumed-registry.json` does not exist when the job returns. `HUNG_BODY` writes it on the relaunch arm alone: the first launch creates `<REC>/hung`, and any later launch, seeing `hung`, runs `cp "$REGISTRY" "$REC/resumed-registry.json"`. The stub wrapper then runs `exit 0` whatever `cp` returned, so a failed copy is silent.
- **The relaunch did happen.** The log shows a second `session environment for 'feat_x'` line at 09:13:56, directly after the reset line, and a session that `exited 0` at 09:13:58. So either the relaunched stub did not take the `else` arm, or its `cp` failed. The registry write is atomic (`hr_registry_set` writes with `mktemp` then `mv`), so a half-written registry is unlikely to be the cause. `hung` lives under `watcher-test/`, which is untracked, and `hr_run_reset_var` resets with `read-tree --reset -u` and no `git clean`, so the reset should not delete it either. The log alone cannot tell these cases apart, and that is the first gap to close.
- **The kill-time sweep removed nothing, against the test's own title.** The title promises the job *"sweeps its recorded leftovers before the reset"*. In the log, the kill at 09:13:53 and the reset at 09:13:56 have no `placeholder sweep:` line between them: no `removed`, no `kept`, and no `skipped, '<b>''s process tree has not exited`. The only two `removed` lines come at 09:13:59, from the job-exit sweep, after the relaunched session had already run. In `check_stalled_runs`, a `tree_left=0` exit from the wait loop calls `placeholder_sweep_pass "$b" 0`, and that call can return silently in two cases: `placeholder_manifests_var` finds no manifest, or `hr_placeholder_sweep_var` returns 1 (no manifest argument readable). So the relaunched session started with both planted leftovers still in place: an empty mode-0444 `.claude/settings.local.json` and an empty `devscene-scripts/.git`. That is the state the kill-time sweep exists to prevent, and it is the most likely reason the relaunch behaved differently.
- **Why the test still reached line 818.** The leftover assertions just before it (`present(path) === false` and `log.includes('placeholder sweep: removed <line>')`) are met by the job-exit sweep. The test cannot tell a kill-time removal from an exit-time one, so the first assertion that fails is the relaunch evidence.
- **The branch did not touch this path.** Against `origin/dev`, this branch changes no line of `cli/templates/scripts/autonomous-watcher.sh`, `cli/test/watcher-placeholder-host.test.mjs` or `cli/test/helpers/watcher.mjs`. Its `cli/templates/scripts/lib/harness-run-lib.sh` change is confined to `hr_remote_planning_paths` and `hr_remote_bundle_restore`, whose only callers are `remote-run.sh`'s `restore` and `mirror` paths, and the watcher's stall path calls neither. The file passed in every earlier run recorded under `harness-runs/run_analytics/`. This round it ran in 199 s against roughly 535–605 s before, so a timing-dependent race in the kill-tier sweep (the `tree_left` wait or the manifest lookup) is the leading suspect. It is not an environment fault: the cause is in the tree, in the watcher or in the test's evidence.

**Fix.**

- [ ] **Make the relaunch evidence say what happened** — `cli/test/helpers/watcher.mjs` → `hungBody`. In the `else` arm, write a marker before the copy (`: > "$REC/relaunched"`). Then replace the bare `cp` with one that records its own failure (`cp "$REGISTRY" "$REC/resumed-registry.json" 2>"$REC/resumed-cp.err" || :`). Keep the Bash 3.2 forms the helper's comment requires.
- [ ] **Put that evidence in the failure message** — `cli/test/watcher-placeholder-host.test.mjs`, test `job: (1) …`. Extend the `the session was not relaunched` message with: whether `<rec>/relaunched` exists, the contents of `<rec>/resumed-cp.err` when present, and `f.prompts().length`. A future failure then names its own cause.
- [ ] **Make the kill-time sweep observable** — `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`, kill-tier block. When the sweep after the `tree_left` wait removes and keeps nothing, log one line saying so. Name the reason: no manifest found, or none readable, using `hr_placeholder_sweep_var`'s return of 1 to tell them apart. A silent sweep is then never mistaken for one that did not run. Edit the template only. Do not edit the repository's own copy at `scripts/autonomous-watcher.sh` (or `scripts/lib/harness-run-lib.sh`). Those files are `init`'s output in this checkout and belong to the `general` layer (`.claude/context/conventions.md` → `## Documents of record`). They are byte-identical to their templates today, and they are refreshed by a forced self-adopt re-render after the template change, not by this `cli` unit.
- [ ] **Fix the root cause the evidence exposes**: find out why `placeholder_sweep_pass "$b" 0` in the kill tier removed nothing while the job-exit sweep (`placeholder_sweep_pass "" 0` / `job_sweep`) removed both leftovers from the same manifest. Compare the two call sites' inputs: the `exclude` argument and `running_count`, the `placeholder_manifests_var "$JOB_MODE" "$HARNESS_REPO_SLUG"` result while the job's record is still `running`, and the manifest's readability at that moment. Correct the watcher so the recorded leftovers are removed before `hr_run_reset_var` and the relaunch. **Where the correction lands:** if the cause is in the kill tier's call or its inputs (the `exclude` argument, `running_count`, or the timing of the `tree_left` wait), fix it in `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`, at the `placeholder_sweep_pass "$b" 0` call. If it is in manifest discovery while the record is still `running`, fix it in the same file → `placeholder_manifests_var`. If it is in the sweep's own manifest handling, which `remote-run.sh` shares, fix it in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_placeholder_sweep_var` and never in a second copy inside the watcher (`.claude/context/conventions.md` → `### Where a new responsibility goes`). Every one of these targets sits under `cli/`, so the `cli` tag holds. As above, leave the root `scripts/` copies to the re-render. Do not change the test's expectations to accept a sweep that happens only at job exit.
- [ ] **Pin the order the title promises** — in the same test, assert that each `placeholder sweep: removed <line>` appears in the watcher log **before** the `stall-watchdog: '<branch>' -> reset to the last commit and resume` line (compare `log.indexOf` positions), so an exit-time removal no longer satisfies it.
- [ ] Leave the other `job:` cases' assertions as they are. Only `job: (1)` uses `HUNG_BODY`'s relaunch arm through `f.job(…, plant)`, and the marker and error-file additions do not change any other suite's outcome. `watcher-stall-reset-payloads.test.mjs` reads `resumed-registry.json` the same way and gains nothing it must change.
