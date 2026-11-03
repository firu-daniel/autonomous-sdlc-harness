### Task 1 — Share the release-aware hung session, its scaled bound and its release trigger in `cli/test/helpers/watcher.mjs`

**Goal:** Give the watcher suites one definition of the hung session. The session stays hung, writing nothing, until the test creates `<REC>/release`. It has a scaled upper bound, and when that bound is reached it leaves a `release-missed` marker. The module also provides the predicate a job-mode case releases on, and the assertion that turns a missing release into a failure that names it.

**Where this task stops.** This task adds exports and edits two helper headers. It changes no suite: `watcher-stall-reset-payloads.test.mjs` keeps its private `HUNG_BODY` until **Task 2** switches it to the export, and `watcher-placeholder-host.test.mjs` keeps its copy until **Task 3** does. It writes no release trigger into any pass script, and it changes nothing under `scripts/` or `cli/templates/`.

### Targets

- `cli/test/helpers/watcher.mjs` — the new exports and an added choice in the module header.
- `cli/test/helpers/timing.mjs` — the module header's choice 4, `Stub lifetimes` bullet.

**Work:**

- [ ] `watcher.mjs`: export the following. Each gets a doc comment and the names stay exactly these, because Tasks 2 and 3 import them:
  - `HUNG_RELEASE = 'release'` and `HUNG_RELEASE_MISSED = 'release-missed'` — the two control-file names under the case's `REC` directory.
  - `HUNG_RELEASE_BOUND_SECS = scaleBound(90)`. Its doc comment states three things. It is a ceiling, so it is scaled (`./timing.mjs`). It is never below the 60 s it replaces, because the task prompt forbids lowering the sleep: under load a shorter one ended before the watchdog's second check. And it stays below the stalled-pass timeout at every scale, because hung wait `scaleBound(60_000)` ms + bound `scaleBound(90)` s = 150 × scale s, which is less than `scaleBound(180_000)` ms = 180 × scale s (`watcher-stall-reset-payloads.test.mjs` → `RUN_TIMEOUT_MS`; `watcher-placeholder-host.test.mjs` → `STALL_TIMEOUT_MS`).
- [ ] `watcher.mjs`: export `hungBody(boundSecs)` and `HUNG_BODY = hungBody(HUNG_RELEASE_BOUND_SECS)`.
  - Keep today's body, which both suites currently carry identically, except for its `sleep 60` line. That stays as is: the first-launch arm guarded by `[ ! -e "$REC/hung" ]`, its `: > "$REC/hung"`, the `until [ -e "$REC/go" ]; do echo "{}"; sleep 0.2; done` loop, and `: > "$REC/silent"`. So does the relaunch arm, `cp "$REGISTRY" "$REC/resumed-registry.json"`.
  - Replace `sleep 60` with a silent wait on `$REC/release`, bounded on bash's own `SECONDS`: `end=$((SECONDS + <boundSecs>))`, then `until [ -e "$REC/release" ]`. Inside the loop, write `: > "$REC/release-missed"` and `break` once `[ "$SECONDS" -ge "$end" ]`, otherwise `sleep 0.2`.
  - The loop writes nothing to stdout or stderr: the watchdog has to keep reading the session as silent.
  - Use only Bash 3.2 forms: no `read -t` with a fraction, no `$EPOCHSECONDS`, no `[[ … ]]`-only features.
- [ ] `watcher.mjs`: export `stallVerdictNotified(notifications, branch)`, the job-mode release trigger. It returns true when `notifications` (the shape `notifications()` returns: `{ event, branch, detail }`) holds an entry for `branch` whose `event` is `failed` or `resumed` and whose `detail` contains `stall-watchdog`.
  - Its doc comment cites why that is the watchdog's last act on either arm of `check_stalled_runs` in `autonomous-watcher.sh`. The give-up arm sends `notify failed "$b" "$log_path" "(stall-watchdog: $why)"` after `registry_set "$b" status failed pid ""`. The resume arm sends `notify resumed … "(stall-watchdog restart #…)"` after `spawn_engine`.
  - It also notes that `notify` calls the recorder in job mode too.
- [ ] `watcher.mjs`: export `assertHungReleased(rec)`, which fails when `<rec>/release-missed` exists. Its message names the missing release: `the hung session was never released: no <rec>/release within HUNG_RELEASE_BOUND_SECS s of \`silent\` — the case's release trigger did not fire`, with the bound's actual value spelled in. Add a seventh entry to the header's `## Six non-obvious choices` list and rename the heading `## Seven non-obvious choices`. The new entry covers three points:
  - The hung session ends on the test's release, never on a timer. Inside the sandbox `pgrep -P` cannot list processes, so the watchdog's kill reaches only the launch subshell, and `tee` and the formatter hold the test's pipes until the stub exits.
  - Release only after the watchdog has acted. A stub freed before the kill exits 0 under a live subshell and the run reads `completed`.
  - The bound arm turns a missing release into the named failure above.
- [ ] `timing.mjs`: in choice 4's `Stub lifetimes` bullet, drop `` `HUNG_BODY`'s `sleep 60` ``. Keep the `sleep 30` in the killed-job stubs and the agent stub's `sleep 0.3`. Do not add `HUNG_RELEASE_BOUND_SECS` to the fixed list. It is a ceiling and goes through `scaleBound`, which is this module's rule.

**Verification:**

- `npm test --workspace cli -- test/helpers/watcher.mjs` and `npm test --workspace cli -- test/helpers/timing.mjs` each exit 0. Both files load as test files of their own, so this proves the new exports evaluate at import time without throwing.
- A language probe under `harness-runs/scratch/`, run through `bash scripts/scratch-run.sh <file>`, writes `hungBody(1)` to a file and runs it under `bash` with `REC` set to a temporary directory holding `hung`-absent and `go`-present.
  - With no `release`, the run ends after about 1 s, and `release-missed` and `silent` exist.
  - With `release` created before the run, it ends at once and `release-missed` is absent.
  - Its combined stdout after the `go` loop is empty.
- `stallVerdictNotified` answers `true` for `[{ event: 'resumed', branch: 'feat_x', detail: '(stall-watchdog restart #1 — hung 3s)' }]` and `'feat_x'`, and `false` for a `failed` entry whose detail lacks `stall-watchdog` or which names another branch. Check this in the same scratch probe.
- `bash scripts/typecheck.sh` exits 0.
