### Task 2 — Cover the probe's refusal 4 against a finished run's live pid, drop the pid on `remote-run.sh stop`, and correct the two doctor comments the fix falsifies

**Goal:** Prove that the sandbox probe's preflight refusal 4 no longer fires on a finished run whose saved `pid` is a live process, and still fires on a real one. Make `remote-run.sh stop`'s `status failed` write drop the record's `pid` in the same call. Then correct the two `cli` comments that describe `running_count` as having no status filter.

**Depends on:** Task 1, which changes `running_count` in `cli/templates/scripts/autonomous-watcher.sh` to this contract:

- It is a pure reader whose only stdout is one integer.
- It counts a local record if and only if its `status` is exactly `running` and `kill -0` succeeds on its non-empty `pid`.
- A `completed`, `failed`, `parked`, `paused` or `park_loop` record counts `0`, whatever its `pid`.

Task 1 also sets the rule this task's `remote-run.sh` edit follows: every terminal write drops the `pid` **in the same** registry write as the status, never in a separate call after it, so no relaunch on the same branch key can come between the two.

This task changes neither the watcher nor the probe. Refusal 4 (`scripts/lib/sandbox-probe/preflight.sh`, the `# --- 4. No watcher run in flight` block) gets the fix for free: it runs `running_count` in a child shell that sources `$probe_scripts/autonomous-watcher.sh`, and in this suite's fixture that file is the one `init` wrote from `cli/templates/`, which is Task 1's template.

**Where this task stops.** It edits the **template** `cli/templates/scripts/remote-run.sh` only. The root copy `scripts/remote-run.sh` is the `general` layer's file, and **Task 3** makes it byte-identical to this template. Do not touch the root copy.

### Why `stop` is a terminal writer on local records

The verb gate's `status|sync)` arm refuses a record that does not carry `execution: github-actions`. `stop` does not pass through that arm. It reaches the `*)` arm, which tests only `execution.target`. `verb_stop` then writes `hr_registry_set "$registry" "$branch" remote_stopped_at "$stopped_at" status failed` to any existing record of the branch, whatever its `execution` field. The header says *"A run keeps the execution it started with"*, so a local record holding a `pid` can exist in a repository whose target is now `github-actions`. `cli/test/registry-writer.test.mjs` → *"a remote-run.sh stop racing the watcher's writes loses neither, every round"* writes such a record (`{ branch: 'feat_x', status: 'running' }`, no `execution` field) and asserts it ends `failed`. That test asserts only `status`, `remote_stopped_at` and the racing keys, so the added `pid ""` changes none of its assertions.

`sync`'s no-bundle `status failed` write is **not** changed. The `status|sync)` gate means it only ever writes a remote record, which carries `pid ""` from `hr_remote_record_init`.

### Targets

- `cli/test/sandbox-probe-shell.test.mjs`: two refusal-4 subtests inside `preflight refuses in order, exit 2, leaving nothing behind`.
- `cli/templates/scripts/remote-run.sh` → `verb_stop`'s registry write, and the header paragraph that describes it.
- `cli/test/remote-run.test.mjs`: one new test for `stop` on a local record holding a `pid`.
- `cli/src/doctor/checks.ts` → `liveRunCount`'s doc comment.
- `cli/test/doctor.test.mjs` → the comment in the subtest `a live run is counted by status and by pid, not by pid alone`.

**Work:**

- [ ] `cli/test/sandbox-probe-shell.test.mjs`: add two subtests, both labelled `4.` like the suite's other check-numbered ones. Place them after the `runLib` helper is defined, because they use it, as the `paused_run` case does, to find the registry: `runLib('hr_state_path', f.dir, 'autonomous_logs/registry.json')`. Seed and restore the registry exactly as the `paused_run` case does. Each subtest spawns its own live child (for example `sleep 300`) and kills it in `t.after`.
  - **4. a completed and a failed run whose pid is a live process are not in flight.** Two records under two different branch keys: one with `status: 'completed'` and one with `status: 'failed'`, each holding the live child's pid (one child serves both records). This covers both halves of the task prompt's goal item 5 first case through the probe's preflight. `preflight(f, probe, tmp, agentPass)` exits `0` with no `sandbox-probe: ` line, and `probeLeftovers(tmp)` is `[]`.
  - **4. a running record whose pid is live is refused.** One record with `status: 'running'` and the child's pid. `assertRefused(run, 'the watcher has 1 run(s) in flight; wait for them or stop them first')`, and `probeLeftovers(tmp)` is `[]`. This second case is what makes the first one discriminate: it shows check 4 still sees a real run.
- [ ] `cli/templates/scripts/remote-run.sh` → `verb_stop`: change the write to `hr_registry_set "$registry" "$branch" remote_stopped_at "$stopped_at" status failed pid ""`, with the clear in the **same** call. Keep the `|| echo "remote-run.sh: stopped on GitHub, but the local record of $branch could not be updated" >&2` fallback and the guard around it unchanged. In the header paragraph that reads *"it writes `remote_stopped_at` and sets `status` to `failed` in one `hr_registry_set` call"*, add that the same call clears `pid`, and why: a stopped run holds no slot, and a local record's saved `pid` could otherwise be reused. Keep the file's mode (`100644` in the index) and change nothing else in it.
- [ ] `cli/test/remote-run.test.mjs`: add one test after `stop sends the marker first, cancels exactly the active runs, and flips an existing record to failed`, named `stop on a local record that still holds a pid flips it to failed and drops the pid`. Use `remoteFixture(t)` and seed `REGISTRY` with `{ runs: { feat_x: { branch: 'feat_x', status: 'running', pid: '12345' } } }`: a record with no `execution` field, the local case the gate's `*)` arm lets through. No process is probed here, so a fixed pid string is fine. Run `remoteRun(fx, ['stop', 'feat_x'], { STUB_RUN_LIST: ACTIVE_RUNS })`, assert exit `0`, then assert the record's `status` is `'failed'` and its `pid` is `''`.
- [ ] `cli/src/doctor/checks.ts` → `liveRunCount`: rewrite the sentence *"The watcher's `running_count` tests only the pid, which is sound in the repository it runs in because `reconcile_stale_runs` demotes a dead `running` record first on every pass"*. Say instead that `running_count` applies the same `status` filter, so a finished record's reused pid holds no slot there either. Keep the rest: the foreign-root reason the filter is needed here, and the `EPERM` difference. Comment only, with no code change.
- [ ] `cli/test/doctor.test.mjs`: in that subtest, rewrite the parenthetical *"— the watcher's own `running_count`, which applies no status filter —"* so that it no longer describes `running_count`. The case's point stands as written: a bare `kill -0` walk would report 2. Comment only. No assertion changes.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-shell.test.mjs` passes, both new `4.` subtests included: the `completed` + `failed` case exits `0` with no `sandbox-probe: ` line and no leftovers, and the `running` case is refused with the 1-run message.
- `npm test --workspace cli -- test/remote-run.test.mjs` passes, the new `stop` test included: the seeded local record ends `failed` with `pid` `''`.
- `npm test --workspace cli -- test/doctor.test.mjs` passes. This task edits only a comment in it, so it must pass unchanged.
- `bash -n cli/templates/scripts/remote-run.sh` parses clean. `git diff -- cli/templates/scripts/remote-run.sh` changes only `verb_stop`'s `hr_registry_set` line and the header paragraph that describes it, and `git diff --summary -- cli/templates/scripts/remote-run.sh` reports no mode change.
- The unit's whole-tree type check (`commands.typecheck`) passes. `git diff -- cli/src/doctor/checks.ts` touches only lines inside the `liveRunCount` doc comment.
- `git grep -n 'running_count' -- cli/src cli/test` finds no remaining text claiming `running_count` has no status filter.

**Deviations from plan:**

- The two refusal-4 subtests share a suite-local `seedRuns(t, runs)` helper (and a `liveChild(t)` helper spawning `sleep 300`, killed `SIGKILL` in `t.after`) that does the `paused_run` case's seed-and-restore steps unchanged; the `paused_run` case itself was left as it was.
- Evidence downgrade: the bare `bash -n cli/templates/scripts/remote-run.sh` call was refused by the tool layer. The parse claim rests on the whole-tree `bash scripts/typecheck.sh` run instead, whose `check-shell-parse` step parses every `.sh` that `git ls-files --cached --others --exclude-standard` lists (this file among them) and reported `90 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`.
- `git grep -n running_count -- cli/src cli/test` still matches `cli/test/watcher-running-count.test.mjs`'s header, which says in the past tense that `running_count` "tested only the pid". That is Task 1's account of the defect, not a claim about the current watcher, so it was left alone.
