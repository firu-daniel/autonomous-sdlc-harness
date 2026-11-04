### 3. CL5's placeholder test `c*"1, 3"*` also accepts device numbers other than `/dev/null`'s `1, 3`

**File:** `scripts/lib/sandbox-probe/legs-protection.sh` (`sp__git_cl5_grade`) — `case "$4" in c*"1, 3"*) placeholder=1 ;; esac`

PD28's decision is that `could not lock config file .git/config: File exists` counts as a sandbox refusal only when `.git/config.lock` read as bubblewrap's `/dev/null` placeholder inside the session. That placeholder is the character device whose major and minor numbers are `1, 3`. The function's comment and §5 PD28 both state it as *"a `c` reading carrying `1, 3`"*. The glob `c*"1, 3"*` checks for the substring `1, 3` anywhere after the leading `c`, so it also matches a character device numbered `11, 3`, `21, 3`, `1, 30` or `1, 31`. The `ls -ld` reading puts a space on each side of the device pair (`crw-rw-rw- 1 nobody nogroup 1, 3 Nov  3 19:07 .git/config.lock`). This is a probe verdict, and a looser match lets a lock path that was not the placeholder grade CL5 `pass` rather than `not run`, which is the outcome PD28 rules out.

**Fix:**

1. In `sp__git_cl5_grade`, change

   ```bash
          case "$4" in c*"1, 3"*) placeholder=1 ;; esac
   ```

   to

   ```bash
          case "$4" in c*" 1, 3 "*) placeholder=1 ;; esac
   ```

2. In `cli/test/sandbox-probe-protection-legs.test.mjs`, in the test `PD28: on Linux, CL5's File exists refusal passes only where the lock path read as the placeholder inside the session`, add a constant after `const REGULAR = …`:

   ```js
     const OTHER_DEVICE = 'crw-rw-rw- 1 root root 11, 3 Nov  3 19:07 .git/config.lock';
   ```

   Then add one entry to its `cases` array, after the entry named `'a regular file inside the session is not run'`:

   ```js
       { name: 'a character device other than 1, 3 inside the session is not run', readings: ['absent', OTHER_DEVICE, 'absent'], v: 'not run', e: NOT_PLACEHOLDER },
   ```

The existing `PLACEHOLDER` reading, `crw-rw-rw- 1 nobody nogroup 1, 3 Nov  3 19:07 .git/config.lock`, still matches the tightened glob, so the passing case does not change. This fix edits `cli/test/sandbox-probe-protection-legs.test.mjs`, so that file is the only test it runs: `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs`. The full suite runs later, in the Run gates phase.

- **Deviations from plan:** The `general`-layer dispatch applied step 1 only (`scripts/lib/sandbox-probe/legs-protection.sh`); step 2 edits `cli/test/sandbox-probe-protection-legs.test.mjs`, which is in the `cli` layer's path, so neither step 2 nor its single-file run `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs` was carried out by that dispatch. Both are left for a `cli`-layer dispatch. `bash scripts/typecheck.sh` was run after step 1 and printed `PASS: typecheck`. The `cli`-layer dispatch then applied step 2 as written; `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs` reported `# tests 67`, `# pass 67`, `# fail 0`, including the new subtest `Linux: a character device other than 1, 3 inside the session is not run, …`, and `bash scripts/typecheck.sh` printed `PASS: typecheck`.
