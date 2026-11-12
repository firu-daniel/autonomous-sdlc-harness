### Task 24 — Respell the watcher, restart-watcher, keep-awake and ledger suites

**Goal:** Bring the suites that drive the written watcher and its library in line with `devscene.config.json`, the `devscene/` state directory, `devscene-scripts`, the `devscene pause <branch>` title and the `Run DevScene` step.

**Depends on:** Task 5, which renamed the run library, the watcher, the restart wrapper and `cli/test/helpers/watcher.mjs` (`STATE_DIR = 'devscene'`, config path `devscene.config.json`). Task 6 titles the runs the watcher's job mode matches.

**Where this task stops.** These suites launch the watcher through `helpers/watcher.mjs`, which Task 5 already respelled, so this task changes only what each suite spells itself. Examples are the `RESUME from a PAUSE: read devscene/PAUSE_PROGRESS.md` expectation, fixture paths and `gh` stub titles.

### Targets

- `cli/test/watcher-background-wait.test.mjs`, `watcher-keep-awake.test.mjs`, `watcher-ledger-classification.test.mjs`, `watcher-park-loop.test.mjs`, `watcher-placeholder-host.test.mjs`, `watcher-push-refusal.test.mjs`
- `cli/test/watcher-remote-dispatch.test.mjs`, `watcher-remote-job.test.mjs`, `watcher-remote-park-sequence.test.mjs`, `watcher-review-drop-payloads.test.mjs`, `watcher-run-analytics.test.mjs`, `watcher-run-profile.test.mjs`
- `cli/test/watcher-running-count.test.mjs`, `watcher-sandbox-refusal.test.mjs`, `watcher-session-env.test.mjs`, `watcher-stall-host-sleep.test.mjs`, `watcher-stall-reset-payloads.test.mjs`, `watcher-usage-resume.test.mjs`
- `cli/test/restart-watcher-cli.test.mjs`, `cli/test/restart-watcher-remote.test.mjs`, `cli/test/keep-awake-lib.test.mjs`, `cli/test/ledger-phases.test.mjs`

(all under `cli/test/`)

**Work:**

- [ ] The six local-loop watcher suites (first group above): apply rows 1–3 of `## Context`'s spelling table. `watcher-ledger-classification.test.mjs`'s `/RESUME from a PAUSE: read devscene\/PAUSE_PROGRESS\.md/` is included.
- [ ] The six remote watcher suites (second group): rows 1–3 and 12. `watcher-remote-job.test.mjs`'s `/RESUME from a PAUSE: read devscene\/PAUSE_PROGRESS\.md/` and every `devscene pause feat_x` `gh` stub title are included, as is row 11 wherever a suite names the `Run DevScene` step.
- [ ] The remaining six watcher suites (third group): rows 1–3.
- [ ] `restart-watcher-cli.test.mjs`, `restart-watcher-remote.test.mjs`, `keep-awake-lib.test.mjs`, `ledger-phases.test.mjs`: rows 1–3.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|Run the harness|harness (run|pause|stop)( [^a-z ]|[^ a-z]| [a-z]+_)' --` followed by this task's twenty-two target paths prints nothing.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, from the repository root, one plain foreground command per file.
