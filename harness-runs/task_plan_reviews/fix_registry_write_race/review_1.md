# Task plan review — iteration 1

## Must Fix

1. **`task_5_plan.md` — with `rateLimitRejected(1)`, the wait-bound case usually never pauses the run**
   The second Work bullet (*"Job mode, the wait bound."*) has the stub emit `rateLimitRejected(1)`, so `resetsAt` = E + 1, where E is the integer second of the emit. The emit happens about 0.3 s after spawn, because of the job stub's `sleep 0.3`.
   - The gate does not read the stream "at once". `run_job`'s `running)` arm runs `sleep "$POLL_INTERVAL_SECS"` (1 s) **before** it calls `usage_gate`, so the first read comes about 0.7 s or more after the emit.
   - `usage_assess` then applies invariant 1: `if [ "$r" -gt 1 ] && [ "$horizon" -gt 0 ] && [ "$horizon" -le "$now" ]; then r=1; fi`, where `now` is `date +%s`, a whole second. The event still counts as `rejected` only while `now` ≤ E, which means the gate has to run in the same whole second as the emit. With a gap of about 0.7 s or more, that fails on most runs.
   - When it fails, the event reads as `allowed`, no `PAUSE` is dropped, the kill-switch stub never fires, and the job ends `completed stop`. The case then fails its first assertion (*"is usage-paused — waiting in the job for"*) for a timing reason unrelated to Task 4.
   - The file's own note (*"`LAST_USAGE_CHECK` starts at 0, so the gate's first pass runs at once, possibly before the stub's `rateLimitRejected` is in the stream"*) misreads the loop. The existing passing case *"a reset 2 seconds ahead"* uses `rateLimitRejected(2)` for exactly this margin.

   **Fix:** In `task_5_plan.md`'s wait-bound bullet, use `rateLimitRejected(2)` and keep `REMOTE_WAIT_MAX_SECS: '2'`. `job_usage_wait_ok` compares `ra - now ≤ 2` with `ra` = E + 2 and `now` ≥ E, so the in-job wait is still taken. If you prefer, widen both values together. Also correct the explanation of `USAGE_CHECK_INTERVAL_SECS: '1'`: the first gate pass runs after one `POLL_INTERVAL_SECS` sleep, and the reason for `'1'` is that the **second** pass, the gate's own resume, has to fall inside the case's run.

2. **Story index (`fix_registry_write_race_story_plan.md`) `## Scope register` — derivation entry A is under-inclusive**
   The register's own coverage statement is *"the durable corpus text that states the same behaviours"*: the registry writer, the job-mode usage wait, and the local usage auto-resume and launch hold. It already counts a file that names the registry as an artifact as a site (row 1, `README.md`). Entry A matches only identifier spellings (`registry\.json`, `paused_by`, `usage_resume_at`, …), so it misses the same statements when they are made in prose. I re-ran it with the prose phrasings added. These sites are reached and have no row:
   - `ARCHITECTURE.md` → the mermaid node *"the run registry · the teed event log"*, and §7's *"making the run registry the sole liveness source"*. These name the registry as an artifact, the same class as row 1.
   - `cli/templates/state-dir/README-root.md` → *"event logs and run registry under `<state_dir>/autonomous_logs/`"*. This is the machine-local inventory, and Task 1 adds a lock directory beside that file.
   - `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`, three anchors:
     - the table row `**Usage pause**` (*"yes, when the window resets"*, *"a recorded resume time the gate acts on"*), which describes the local usage auto-resume that Task 4 changes;
     - the **The stranded run.** bullet (*"the tag … is written at the request"*), which describes when the tag is written, and Task 2 moves that write to before the `PAUSE`;
     - the control-plane row naming *"the run registry and its concurrency cap"*.
   - `plugin/instructions/docs_orchestration_instructions_autonomous.md` → **Self-pause on API overload.** (*"Unlike the usage pause, nothing auto-resumes this one"*).

   Each of these is probably a `no-change` row, but the register has to list it for the closure invariant to hold.
   **Fix:** Replace entry A with a strictly wider command and add one row per reached anchor, each with its disposition and reason:
   `git grep -lE 'usage_resume_at|usage_hold|hold marker|paused_by|REMOTE_WAIT_MAX_SECS|wait-poller|hr_registry_set|registry\.json|run registry|[Uu]sage pause|usage-paused|launch hold' -- 'docs/**' 'plugin/**' 'README.md' 'ARCHITECTURE.md' 'cli/README.md' 'cli/templates/**/*.md'`

## Should Fix

1. **`task_3_plan.md` contradicts `task_4_plan.md` / `task_5_plan.md` about the poller's empty-time arm.**
   - Task 3's "Where this task stops" says Task 4 *"makes job mode always record a usable time before it hands a run to the poller, so that arm is a corrupt-bundle guard"*.
   - Task 5's wait-bound case now asserts the opposite: the bound path ends `wait-poller` with `usage_resume_at` and `paused_by` both empty.
   - `remote-run.sh` → `poll_branch` then logs *"is usage-paused with no readable usage_resume_at; skipped"* and does not count the branch as waiting. So the job enables a poller that will never act.

   Pick one behaviour and state it in all three files. One option is to have the bound path write the captured `ra` back before `job_write_status`: the value is already in the past, so the poller re-dispatches on its next tick. The other is to end the bound path with `stop`, since its notification already names `/autonomous-sdlc-harness:branch-resume`.

2. **`task_1_plan.md` — the stale-lock breaker's guarantee is overstated.** The plan says renaming the lock aside first means *"a second breaker cannot remove a fresh owner"*. That does not hold:
   - A breaker that read the stale owner can still `mv` aside a lock that a faster breaker has just re-created.
   - `hr_lane_acquire` names the aside `"$lock.stale.$$"`, and `$$` is shared by the watcher and its engine subshell, which the plan itself rules out for the owner token.

   Key the aside name on the per-call token, re-check the aside's owner after the rename (restore it, or give up, if the owner is fresh), and add a case where two breakers race one planted stale lock. The `Top risks:` paragraph names *"two breakers of one stale lock"* as a risk Task 1 guards, but case (c) has only one breaker. Also add `hr_lane_mtime`'s comment (*"The only `stat` in this file, and it exists for one case"*) to Task 1's `### Targets`, because reusing the function makes that comment false.

3. **`task_6_plan.md` — the 300 s argument is made against the whole suite, but `--test-timeout` also bounds each top-level parent test.** Several suites group many watcher cases under one parent, for example `watcher-remote-job.test.mjs`'s `usage:` group. Argue the value against the longest parent test on the slowest supported runner, and carry the same argument into Task 8's Gate 4 paragraph.

4. **`task_6_plan.md` — the hung child's 3 s test timeout also covers building the fixture.** The child runs `init` plus git before it writes the path file. Build the fixture in a `before` hook, or start the explicit bound only after `watch` is launched. Have the parent assert that the path file exists before it runs `pgrep`, so the "no process left behind" check cannot pass vacuously.

5. **`task_2_plan.md` — other pairs written back to back are left split.** `launch_run`, `launch_remote_run` and `run_job` each clear `paused_by` and `usage_resume_at` in two consecutive calls. The split is harmless today, because every reader keys on `paused_by`. Either batch them in the same multi-key call, or say in Task 2 why they are left as they are. The prompt's candidate approach names *"the other pairs written back to back"*.
