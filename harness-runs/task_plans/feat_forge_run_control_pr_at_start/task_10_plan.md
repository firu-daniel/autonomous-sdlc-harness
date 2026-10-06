### Task 10 — The job's supervision loop reports a phase change from the ledger

**Goal:** Item 6's trigger. Inside a GitHub Actions job (`autonomous-watcher.sh job …`), the supervision loop in `run_job` reads the run's flow-progress ledger in the job's own checkout on every pass. When the four-phase reading changes, it calls `remote-run.sh report progress <branch>`, and it calls once more when the job ends. The flow pushes every ledger tick as a commit in that same checkout, so no new state is kept and nothing is polled from GitHub.

**Depends on:** Task 9, which adds `remote-run.sh report progress <branch> [--repo <root>]`. That call always exits 0 and is itself gated on `forge` `github`, `execution.target` `github-actions`, `execution.progressComments`, a stopped branch, and a recognised open pull request, so the watcher gates on none of these. Also Task 2's `hr_ledger_phases <ledger_file>`, which prints one line `<engine> <round> <p1> <p2> <p3> <p4>` with status 0, or nothing with status 1.

**Where this task stops.** The watcher decides *when* to call and never *what* to post. Rendering, the target, the opt-out and the edit-in-place are Task 9's. A local (non-job) watcher posts nothing, because the comment is a GitHub-side report of a job. The documentation is **Task 17's** (`docs/remote-execution.md`) and **Task 15's** (§5).

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — a new `job_progress_pass`, its two calls in `run_job`, and the header's `JOB MODE` block.
- `cli/test/watcher-remote-job.test.mjs` — cases for the pass.

**Work:**

- [ ] `job_progress_pass <branch> <state_abs> [final]`: return 0 at once unless `JOB_MODE` is `1`. Compute `line="$(hr_ledger_phases "$state_abs/flow_progress/${branch}_progress.md")"`, returning 0 on status 1 (no ledger yet, or not a task or round ledger). When `line` equals a global `JOB_PROGRESS_LAST` and `final` is not passed, return 0. Otherwise set `JOB_PROGRESS_LAST="$line"` and run `bash "$REMOTE_RUN" report progress "$branch" --repo "$MAIN_REPO" >>"$WATCHER_LOG" 2>&1 || true`, following the existing `job_report` call's form. Initialise `JOB_PROGRESS_LAST=""` with the job's other globals, so a job's first pass always syncs once. That is how a chained job confirms the comment is already current at the cost of one listing.
- [ ] Calls in `run_job`: one in the `running)` arm right after `job_budget_pass "$branch" "$state_abs"`, and one after the loop's `wait` and before `job_write_status "$branch" "$remote_status" "$decision" "$detail"`, passing `final`. The final pass catches a tick, `D` / `R5` among them, that landed after the last poll, because every tick a job makes is in its own window. That is why the comment never misses a phase and never posts one twice across chained jobs. Pass `final` only at the end, so the in-loop pass stays a pure change detector.
- [ ] The header's `JOB MODE` block: add a paragraph, **THE PROGRESS PASS**. Each pass reads the ledger the flow pushes in this checkout through `hr_ledger_phases`, and it calls `remote-run.sh report progress` on a change and once at the job's end. It reads nothing from GitHub to decide and keeps no state across jobs, since the render is deterministic and `report progress` edits the comment only when its body differs. A budget continuation therefore posts nothing new unless a phase moved. This is consistent with `docs/github-run-control.md` → §5's *The budget is silent*, because what is posted is a phase, not the continuation.
- [ ] `cli/test/watcher-remote-job.test.mjs`: in that suite's style (recorded agent CLI, `gh` stub with `forge` `github`, bounded `runBash`), add cases. First: a run whose recorded agent writes a fresh task-engine ledger, then ticks `P1`–`P3` before exiting, with the stub answering `pr list` with pull request 12 and an empty comment listing. Its stub log shows at least one progress `POST` on `#12`, and the last progress write carries `Planning: done`. Second: the same run with `execution.progressComments` set `false` in the fixture's `harness.config.json`, which gives no progress write. Third: a job whose ledger never changes after its first pass gives exactly one `report progress` invocation before the final one, which you can count from the watcher log line `report progress` writes.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-job.test.mjs` passes, run once from the repository root as one plain foreground command.
- `bash scripts/typecheck.sh` passes.
- Exercise the path end to end through the first case above: the recorded agent's ledger tick reaches a progress comment on the stub's pull request through Task 9's verb, with no `report progress` call made by anything but `job_progress_pass`. Grep `autonomous-watcher.sh` for `report progress` and find it only there.
