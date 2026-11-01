### 1. The earlier-session placeholder the sweep case plants is writable, so the sweep keeps it

**File:** `cli/test/sandbox-probe-job-launch.test.mjs` (`test('the job-mode placeholder manifest', …)` → subtest `'a placeholder an earlier session left is swept and listed again'`) — "`: > ${q(m.absentOne)}`" (about line 284; navigation hint only)

**Failing test:** `cli/test/sandbox-probe-job-launch.test.mjs` — `a placeholder an earlier session left is swept and listed again`, and its parent `the job-mode placeholder manifest`, which is reported `not ok` only because this subtest failed.

**Failure, as the log reports it** (gate `test`, inner gate 4 `npm test`):

```
  FAIL  4 npm test (exit 1)
            not ok 4 - a placeholder an earlier session left is swept and listed again
        not ok 1168 - the job-mode placeholder manifest
        # fail 2
```

The log is truncated and carries no assertion text for either failure. The diagnosis below comes from the current tree.

**Class:** no earlier round. This is round 1 and no earlier logs were named. The subtest exercises the pre-session sweep that `54ee7957` ("Sweep before every job-mode manifest write") added to `sp_job_manifest_write`.

**Diagnosis.** The subtest calls `sp_job_manifest_write` once. That writes a manifest listing `m.absentOne`. It then plants a file at that path with `: > ${q(m.absentOne)}` and calls `sp_job_manifest_write` a second time. It asserts that the second call's pre-session sweep removed the file (`assert.ok(!existsSync(m.absentOne), …)`) and that the new manifest lists `m.absentOne` first.

The probe side is correct. `scripts/lib/sandbox-probe/job.sh` → `sp_job_manifest_write` calls `sp__job_sweep "job-sweep before this session"` first. That runs the fixture watcher's `HARNESS_JOB_MODE=1 autonomous-watcher.sh job-sweep <branch>`, which leads to `cli/templates/scripts/autonomous-watcher.sh` → `job_sweep` → `placeholder_sweep_unprobed` → `hr_placeholder_sweep_var` over `hr_job_absent_files`, and that finds the manifest under `SP_JOB_RUNNER_TEMP`.

The sweep then removes a listed path only when `scripts/lib/harness-run-lib.sh` → `hr_placeholder_leftover_var` answers 0. That needs a regular file that is 0 bytes, owned by this user and **carries no write bit for user, group or other** ("`-perm -u+w -o -perm -g+w -o -perm -o+w`"). This matches the real bubblewrap leftover, which is a read-only empty file.

The test creates its file with `: >` under the default umask, so the file is mode 644 and writable. The sweep therefore records it as `kept <path>: writable` and leaves it on disk. The first assertion fails. The second would fail too, because a path that still exists is never written into the manifest (`hr_placeholder_manifest_write` lists only paths where "`[ ! -e "$p" ] && [ ! -L "$p" ]`"). The parent test `the job-mode placeholder manifest` fails only because this subtest failed.

The other suites that plant a leftover already make it read-only. `cli/test/watcher-placeholder-host.test.mjs` uses "`': > "$2" && chmod 444 "$2"'`" and `await chmod(path, 0o444);`.

**Fix.** In `cli/test/sandbox-probe-job-launch.test.mjs`, in the subtest `'a placeholder an earlier session left is swept and listed again'`, make the planted file a real placeholder leftover: empty and read-only. Replace the script line

```
`: > ${q(m.absentOne)}`,
```

with

```
`: > ${q(m.absentOne)} && chmod 444 ${q(m.absentOne)}`,
```

- [ ] Change nothing in `scripts/lib/sandbox-probe/job.sh`, `cli/templates/scripts/autonomous-watcher.sh` or `hr_placeholder_leftover_var`. The leftover test's no-write-bit condition is the safety rule that keeps a session-planted file from being swept, and it must not be loosened to fit the test.
- [ ] Keep both existing assertions as they are: the file is gone after the second call, and the second manifest's first line is `m.absentOne`.
- [ ] Optionally, add a one-line comment above the planted line saying that the file is made read-only because `hr_placeholder_leftover_var` sweeps only a 0-byte file with no write bit.
