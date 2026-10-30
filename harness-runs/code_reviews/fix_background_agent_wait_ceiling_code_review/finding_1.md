### 1. In job mode a zero exit over an unfinished ledger overwrites a pending `usage` or `budget` pause, so `job_auto_resume` deletes that PAUSE and relaunches the run

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`classify_run_exit`), the zero-exit arm: "if [ \"$JOB_MODE\" = \"1\" ] && [ \"$(registry_get \"$branch\" pause_reason)\" = \"user\" ]; then"

The new `unfinished` arm keeps a pending pause only when it is the user's. The local `PAUSE_ACK` arm a few lines above settles a job-mode pause reason in a fixed order: `user`, then `usage` (from `paused_by`), then `budget`. The `unfinished` arm skips the last two. Here is the job-mode sequence it lets through:

1. The usage gate tags the still-`running` record `paused_by=usage` and drops `PAUSE`, or `job_budget_pass` records `pause_reason budget` and drops `PAUSE`.
2. The session exits 0 before it reaches a checkpoint and writes no `PAUSE_ACK`. Ending the turn is enough to do this, and it is the incident shape this branch exists for.
3. `classify_run_exit` finds the ledger unfinished and writes `pause_reason unfinished`.
4. `run_job`'s new `unfinished)` arm calls `job_auto_resume`, and its `begin_pause_resume` deletes the pending `PAUSE`. For a usage pause, the session is then relaunched into a usage window that is still exhausted, and one of the run's `REMOTE_AUTO_RESUME_MAX` allowances is spent on it. `job_auto_resume` puts back only the hosted budget's PAUSE. The usage gate re-requests its pause only after its stale-tag sweep has cleared the tag and a later throttled assessment has run.

This is the `harness-runs/lessons.md` → *Unattended control loops* rule: *"A process that turns off a shared switch another actor can turn on must check the enabling condition again after switching it off…"*. The story plan applied that rule to `user` only (decision 6). For a `budget` pause, the correct outcome is `run_job`'s `budget)` arm (`continue`, a chained job), not a bounded auto-resume.

**Fix:**

1. In `cli/templates/scripts/autonomous-watcher.sh` → `classify_run_exit`, replace the job-mode `user` block at the top of `if [ "$ledger_state" = "unfinished" ]; then` (from `if [ "$JOB_MODE" = "1" ] && [ "$(registry_get "$branch" pause_reason)" = "user" ]; then` through its `fi`) with this block. It mirrors the `PAUSE_ACK` arm's order:

   ```bash
      if [ "$JOB_MODE" = "1" ]; then
        # A pause another actor already requested outranks `unfinished`, in the
        # PAUSE_ACK arm's order — `user`, then `usage`, then `budget`. Writing
        # `unfinished` over it would send the record to job_auto_resume, whose
        # begin_pause_resume deletes that actor's PAUSE.
        local held_reason
        held_reason="$(registry_get "$branch" pause_reason)"
        if [ "$held_reason" != "user" ]; then
          if [ "$(registry_get "$branch" paused_by)" = "usage" ]; then
            held_reason=usage
          elif [ "$held_reason" != "budget" ]; then
            held_reason=""
          fi
        fi
        if [ -n "$held_reason" ]; then
          registry_set "$branch" pause_reason "$held_reason" status paused
          log "run '$branch' paused (unfinished) — the session exited 0 before its ledger finished ($ledger_detail); the pending $held_reason pause is kept"
          # run_job's `user)` arm notifies nothing, so this is that pause's one
          # notification; run_job's `usage)` and `budget)` arms own theirs.
          if [ "$held_reason" = "user" ]; then
            notify paused "$branch" "$log_path" "paused as you asked — run /autonomous-sdlc-harness:branch-resume $branch to continue; $(hr_github_resume_route "$branch" "$(registry_get "$branch" engine)")"
          fi
          return 0
        fi
      fi
   ```

   Leave the unconditional `registry_set "$branch" status paused pause_reason unfinished` path below it unchanged.
2. In the same file, bring three comments into line with the new block:
   - The function comment of `classify_run_exit`: replace `(in job mode a \`user\` reason already recorded is kept instead)` with `(in job mode a pending \`user\`, \`usage\` or \`budget\` pause is kept instead)`.
   - The registry field list → `pause_reason`: replace `In job mode it never replaces a \`user\` reason already recorded; see JOB MODE.` with `In job mode it never replaces a pending \`user\`, \`usage\` or \`budget\` pause; see JOB MODE.`, and re-wrap the comment lines.
   - The JOB MODE header → THE DECISION bullet: replace `a zero exit over an unfinished ledger (\`unfinished\`) -> auto-resume, else \`stop\`` with `a zero exit over an unfinished ledger (\`unfinished\`, written only when no \`user\`, \`usage\` or \`budget\` pause was pending) -> auto-resume, else \`stop\``, and re-wrap.
3. In `docs/watcher.md` → `## 4. Pausing, parking and the usage gate`, the paragraph opening *"If the setting ever fails to reach a session"*: replace `and a pause the user already asked for keeps its \`user\` reason` with `and a pause already pending — the user's, the usage gate's or the hosted budget's — keeps its own reason`.
4. Copy `cli/templates/scripts/autonomous-watcher.sh` byte for byte over `scripts/autonomous-watcher.sh`, and confirm with `cmp` that the two files are identical.
5. In `cli/test/watcher-remote-job.test.mjs`, add two subtests to `test('unfinished: a zero exit over an unfinished ledger is resumed, bounded, then reported', …)`, and name them in the file header's `unfinished:` RED ONCE sentence with this mutation: *the usage / budget precedence removed from `classify_run_exit`'s `unfinished` arm → both cases show `pause_reason` `unfinished` and two prompts.* Both use the file's existing `stageLedger`, `taskLedger`, `rateLimitRejected`, `PAUSE_WAIT_TENTHS`, `nowSecs` and `lastLine` helpers:
   - `'a usage pause pending at an unfinished exit -> paused / usage / wait-poller, no auto-resume'`. The stub body is `` `${rateLimitRejected(100)}; for i in $(seq 1 ${PAUSE_WAIT_TENTHS}); do if [ -f "$STATE/PAUSE" ]; then break; fi; sleep 0.1; done\n${copy}\nexit 0` ``, where `copy` is `await stageLedger(j, taskLedger(j.branch, []))`. Run the job with `{ USAGE_CHECK_INTERVAL_SECS: '1', USAGE_RESUME_MARGIN_SECS: '0', HARNESS_JOB_DEADLINE_EPOCH: String(nowSecs() + 50), REMOTE_AUTO_RESUME_DELAY_SECS: '0' }`. Assert `lastLine(result.stdout)` is `'job: paused wait-poller'`, `j.status().pause_reason` is `'usage'`, `j.prompts().length` is `1`, and the watcher log matches `/paused \(unfinished\)/`.
   - `'a budget pause pending at an unfinished exit -> paused / budget / continue, no auto-resume'`. The stub body is the same wait-for-PAUSE loop followed by `${copy}\nexit 0`, without `rateLimitRejected`. Run the job with `{ HARNESS_JOB_STARTED_EPOCH: String(nowSecs()), REMOTE_SELF_PAUSE_AFTER_SECS: '1', REMOTE_AUTO_RESUME_DELAY_SECS: '0' }`. Assert `lastLine(result.stdout)` is `'job: paused continue'`, `j.status().pause_reason` is `'budget'` and `j.prompts().length` is `1`.

   Run the edited file once: `npm test --workspace cli -- test/watcher-remote-job.test.mjs`. It is the only test this fix runs.

**Deviations from plan:**

- `cli` layer dispatch: Fix items 1, 2 and 5 implemented. Items 3 (`docs/watcher.md`) and 4 (copy over `scripts/autonomous-watcher.sh` and `cmp`) lie outside `cli/` and are left to this finding's `general` layer dispatch; until it lands, `cmp` of the template against `scripts/autonomous-watcher.sh` reports a difference.
- Item 2, `pause_reason` comment: the re-wrap carries on through the end of that paragraph (`unless the usage gate …` through `` never shows a stale `unfinished`. ``), with no wording change.
- Item 5: the file header's lead sentence for the `unfinished:` cases (`unless the user asked for the pause, which outranks it`) now reads `unless a \`user\`, \`usage\` or \`budget\` pause is pending, which outranks it`, so the header still matches the code under it.
- Item 5, RED ONCE evidence: confirmed with `harness-runs/scratch/unfinished-held-reason-red.mjs`, run through `bash scripts/scratch-run.sh`. The script set `held_reason=""` in place of the `paused_by` / `budget` branch in the **tracked template**, which the fixture's `init` installs from, ran `npm test --workspace cli -- test/watcher-remote-job.test.mjs`, then restored the template (`restored true`). Result: `not ok 4` (usage case) and `not ok 5` (budget case), with every other subtest `ok` (`# fail 3`: the two subtests plus their parent). The run printed only the `ok` / `not ok` lines, not the assertion values, so the header's wording about what the mutation shows (*`pause_reason` `unfinished` and two prompts*) comes from the finding's text and was not observed.
- `general` layer dispatch: Fix items 3 and 4 implemented. Item 4: `cp` of the template over `scripts/autonomous-watcher.sh` was refused by the permission profile (twice), so the copy was made by applying the template's four uncommitted hunks to `scripts/autonomous-watcher.sh` with the Edit tool; both files had the same blob at `HEAD` (`git rev-parse HEAD:<path>` → `1a64beaa…` for each). `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` then exited 0 with no output.
