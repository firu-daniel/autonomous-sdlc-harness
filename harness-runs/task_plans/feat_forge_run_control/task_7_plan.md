### Task 7 — Report every job-mode lifecycle event from the watcher

**Goal:** Every lifecycle event a remote run's job sends — `parked`, `park_loop`, `paused`, `resumed`, `failed` — also reaches the run's issue or pull request as a comment and moves its state label (goal 5, acceptance 5). The watcher's job-mode `notify()` wrapper calls `remote-run.sh report` beside `autonomous-notify.sh`, which keeps working unchanged. Every call site already passes through that one wrapper, so the in-job usage pause, the bounded auto-resume and the stall watchdog's events are all covered, and a chained `budget` continuation stays silent because job mode never notifies it (`autonomous-watcher.sh` → the header's `JOB MODE` block, *NOTIFICATIONS*).

**Depends on:** Task 3's verb `remote-run.sh report <event> <branch> [--note <text>] [--repo <root>]`. It exits 0 on every path but a usage error, calls no `gh` with the forge coupling off, and prints one line naming what it posted or why it posted nothing. Its `completed` and `launched` print one line and post nothing: `completed` is reported by `deliver` once the branch is pushed (Task 6), and `launched` is the trigger's own comment. The watcher already resolves `REMOTE_RUN="$SCRIPT_DIR/remote-run.sh"`, and `MAIN_REPO` is the job's checkout in job mode.

**Where this task stops.** Only the watcher's wrapper changes. `remote-run.sh`'s own `notify()` in `continue` and `poll` is Task 8's, and the cancelled-job step in `harness-run.yml` is Task 14's. The watcher keeps reaching GitHub only through `remote-run.sh`, as `cli/src/remote/githubActions.ts`'s header says. A local run (`JOB_MODE` not `1`) calls nothing new: a local-only adopter gains no new surface (goal 7).

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — the `notify()` wrapper, and the header's `JOB MODE` → *NOTIFICATIONS* bullet.
- `cli/test/watcher-remote-job.test.mjs` — the report call.

**Work:**

- [ ] **`notify()`**: after the `"$NOTIFY" "$@" || true` line, when `JOB_MODE` is `1` and `REMOTE_RUN` is a readable file, run `bash "$REMOTE_RUN" report "$1" "$2" --repo "$MAIN_REPO" >>"$3" 2>&1 || true` — `$3` is the run's central log path, which every `notify` call already passes — or with its output sent to `/dev/null` when `$3` is empty. The detail argument (`$4`) is **not** passed: it names local slash commands, and the comment must name GitHub actions only, which `report` derives itself from the job's registry record. The wrapper stays best-effort: a missing script is one `log` line, as a missing notifier is today.
- [ ] **The header**: the *NOTIFICATIONS* bullet of the `JOB MODE` block gains one sentence. Each job-mode event is also passed to `remote-run.sh report`, which comments on the run's pull request or issue and moves its state label when `forge` is `github`; `autonomous-notify.sh` is unchanged; and `completed` is reported by the workflow's `deliver` step after the push.
- [ ] **`watcher-remote-job.test.mjs`**:
  - the fixture's `scripts/` already carries the real `remote-run.sh`;
  - with `forge` set to `github` and `HARNESS_GH_CLI` pointing at a recorder stub, a case that ends parked asserts that the stub's log holds an `api --method POST repos/<repo>/issues/<n>/comments` call — the run's issue, from a provenance line the fixture writes into the task prompt on origin;
  - a second case with `forge` unset asserts that the stub logs no `issues/` call;
  - the file's header gains one sentence naming that rule.

**Verification:**

- `npm test -- test/watcher-remote-job.test.mjs` from `cli/` passes, every pre-existing case unchanged.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` exits 0.
- `git grep -n '"\$REMOTE_RUN" report' -- cli/templates/scripts/autonomous-watcher.sh` has its only hit inside `notify()`: no event site calls `report` directly.
