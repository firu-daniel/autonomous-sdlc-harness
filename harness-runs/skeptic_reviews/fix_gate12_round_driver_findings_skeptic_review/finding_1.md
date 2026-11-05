### 1. FR3's commit-on-branch.sh arm reads a step log that never carries a session's commit refusal

**File:** `scripts/lib/gate12-sandbox-round/grade-full-run.sh` (`g12_fr3_arm`) — "refusal=\"$(printf '%s\n' \"$G12_ARM_LOG\" | grep -F 'commit-on-branch.sh: '"; and its comment above `g12_fr3_arm` — "A refusal by either wrapper fails the arm: commit-on-branch.sh's in the Run the harness" (line 243, a hint only)

**Also:** `docs/development.md` (observation (xvi), **What it shows.**, the `**FR3**` item) — "and a `commit-on-branch.sh: refusing to commit: …` or `… — refusing to commit` line in `Run the harness`"; `docs/sandbox-verification.md` (`## 10.`, the `FR3` row's Expected cell), the same substring; `cli/test/gate12-sandbox-round-full-run.test.mjs` (the header's shipped-string list) — "`cli/templates/scripts/commit-on-branch.sh`: the prefix of its `$HR_WT_CONFIG_REFUSAL` refusal,".

**Problem.** Task 2 made FR3 fail on a `commit-on-branch.sh: … refusing to commit` line in the `Run the harness` step log, and the docs now state that FR3 reads one there. No shipped path writes that line to that log. `commit-on-branch.sh` is called only by the session, never by the watcher. The watcher's own commits go through `hr_commit_placed`, as `cli/templates/scripts/autonomous-watcher.sh` says beside `PUSH_BRANCH`: "The artifact commit is not routed through `commit-on-branch.sh`". The wrapper prints every refusal to stderr (`>&2`), so the line becomes the `tool_result` of the session's own Bash call. That result never reaches the step log:

- `spawn_engine` (`autonomous-watcher.sh`) sends the engine's stdout through `tee -a "${log_path%.log}.stream.jsonl" | "$formatter" >>"$log_path"`, and its stderr to `2>>"$log_path"`. Both go to the run's log file, not to the step's stdout. Only the watcher's `log` writes there (`tee -a "$WATCHER_LOG"`).
- The formatter, `cli/templates/scripts/autonomous-format-stream.sh`, says under **WHAT IT DELIBERATELY DROPS**: "`tool_result` bodies — a file read is the whole file". So the refusal is not in `run.log` in the `harness-state` artifact either. It survives only in the raw `<branch>.stream.jsonl`, and that stays on the runner.

**Runtime symptom.** Take a full run whose session commit is refused, for example by a filter-driver attribute, by `HR_SYNC_REFUSAL` or by a protected branch, while its pushes succeed. FR3 grades that run `pass` and quotes `job: completed stop`. The docs tell the operator that this `pass` means no `commit-on-branch.sh` refusal occurred. The operator records FR3 `pass` in `docs/sandbox-verification.md` §10, but a refused sandboxed write happened, which is the failure goal 1's third bullet exists to catch.

Round 13's own evidence shows this. The task prompt's measurement 2 says "The session's ledger commit was refused by `commit-on-branch.sh`". Yet the branch's round-13 replay (`round13()` in the full-run suite) puts no commit refusal in either job's `Run the harness` lines, because the real step log had none. FR3 fails that replay only on `PUSH_REFUSAL`. The three commit cases (`COMMIT_REFUSAL`, `COMMIT_DETACHED`) put the line where the shipped watcher never writes it. They pin the matcher, not a reachable path.

**Fix.** Keep the commit arm's code: it is harmless, and it fires if such a line ever reaches the log. Correct every site that claims the log carries the line:

- [ ] In `grade-full-run.sh`, in the comment above `g12_fr3_arm`, replace the sentence "A refusal by either wrapper fails the arm: commit-on-branch.sh's in the Run the harness log, push-branch.sh's in the Push the branch log." with:

  ```
  # A refusal by either wrapper fails the arm: push-branch.sh's in the Push the branch log, and
  # commit-on-branch.sh's in the Run the harness log should one ever reach it. A session's own
  # commit-on-branch.sh refusal does not: it is the stderr of the session's tool call, which
  # spawn_engine sends into the run's log file through autonomous-format-stream.sh, and that
  # formatter drops tool_result bodies, so neither this step log nor the bundle's run.log carries
  # it. A pass is therefore no evidence that no session commit was refused.
  ```

- [ ] In `docs/development.md`, in the `**FR3**` item under **What it shows.**, insert this directly after "…or `… — refusing to commit` line in `Run the harness`.":

  > That step log carries the watcher's lines, not the session's: a session's `commit-on-branch.sh` refusal is the stderr of its own tool call, which `spawn_engine` sends into the run's log file through `cli/templates/scripts/autonomous-format-stream.sh`, and that formatter drops `tool_result` bodies, so neither the step log nor the bundle's `run.log` carries it. FR3's `pass` says no push was refused and the run did not end `failed`; it is not evidence that no session commit was refused.

- [ ] In `docs/sandbox-verification.md` §10, in the `FR3` row's Expected cell, insert the same two sentences at the same point. They contain no `|`, so they go in the table as they are.
- [ ] In `cli/test/gate12-sandbox-round-full-run.test.mjs`, append this sentence to the header's `commit-on-branch.sh` bullet: "Its two FR3 cases put the line in `Run the harness`, where the shipped watcher never writes a session's refusal; they pin the arm's matcher, not a path a real run reaches."

No code or test assertion changes, so this fix needs no suite run. The prose edits are verified by reading them back.
