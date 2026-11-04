### 2. PD28's fourth Linux refusal string also became a `dd` and rename refusal, so CS1/CS2/CS7's Linux pass sentence names git's lock line

**File:** `scripts/lib/sandbox-probe/legs-protection.sh` (`sp__wp_mv_class` — "if sp__linux_refusal_line \"$1\" >/dev/null; then"; the Linux pass sentence — "every dd and rename refused by the sandbox (one of: Operation not permitted, $(sp__linux_refusal_names))"), together with `scripts/lib/sandbox-probe/judge.sh` (`sp__linux_refusal_names`)

Task 4 appended `could not lock config file .git/config: File exists` to `SP__LINUX_SANDBOX_STRINGS` so that CL5's `git config` refusal is judged a sandbox refusal on Linux. The write-protection leg reads that same array in two places that have nothing to do with `git config`:

- `sp__wp_mv_class` classes a rename helper line as `refused` when `sp__linux_refusal_line "$1"` matches any member of the whole set. This now includes git's lock line.
- The Linux pass sentence for the write-protection rows (`SP__WP_RE`, used by CS1, CS2 and CS7) reads `every dd and rename refused by the sandbox (one of: Operation not permitted, $(sp__linux_refusal_names))`. It now prints `… Device or resource busy, could not lock config file .git/config: File exists)`. That tells whoever records a Linux run that a `dd` or a `mv` could have been refused with a git lock-file error. Neither can print one.

The leg's own header makes the same claim. Its `ON LINUX` paragraph says *"every string of the judge's Linux set is a rename refusal"*, and its `PD23.` paragraph says *"sp__wp_mv_class classes every string of the judge's Linux set as `refused`"*. Both were true when the set held only file-system errors, and neither is true now. The comment Task 4 added in `judge.sh` (*"the member moves no other row's verdict"*) covers verdicts only. It does not cover this evidence text. `cli/test/sandbox-probe-protection-legs.test.mjs` → `sp__linux_refusal_names: the Linux pass sentence names the judge’s whole set` now pins the wrong sentence.

The judge already lets a caller name a subset of its set (`sp__linux_refusal_line <text> [<string>...]`, which returns status 2 for a non-member). The fix gives the names helper the same contract and has the write-protection leg name the three file-system members.

**Fix:**

1. In `scripts/lib/sandbox-probe/judge.sh`, replace `sp__linux_refusal_names` and its comment with:

   ```bash
   # sp__linux_refusal_names [<string>...] — print SP__LINUX_SANDBOX_STRINGS, or the named subset, joined by ", ",
   # for an evidence sentence that names the set it was graded against; status 2 and nothing printed when a
   # named string is not a member.
   sp__linux_refusal_names() {
     local s out="" known found
     if [ "$#" -eq 0 ]; then
       set -- "${SP__LINUX_SANDBOX_STRINGS[@]}"
     else
       for s in "$@"; do
         found=0
         for known in "${SP__LINUX_SANDBOX_STRINGS[@]}"; do
           [ "$s" = "$known" ] && found=1
         done
         [ "$found" -eq 1 ] || return 2
       done
     fi
     for s in "$@"; do
       out="${out:+$out, }$s"
     done
     printf '%s' "$out"
   }
   ```

2. In `scripts/lib/sandbox-probe/legs-protection.sh`, directly below `SP_CS2_NEW_NAME="sbx_cs2_new"`, add:

   ```bash
   # The judge's Linux strings a dd or a rename can print: every member of judge.sh's SP__LINUX_SANDBOX_STRINGS
   # but git's lock line, which only a .git/config write prints (§5 PD28). Named through judge.sh, which
   # refuses a non-member.
   SP__WP_LINUX_REFUSALS=("Read-only file system" "Permission denied" "Device or resource busy")
   ```

3. In `sp__wp_mv_class`, change `if sp__linux_refusal_line "$1" >/dev/null; then` to `if sp__linux_refusal_line "$1" "${SP__WP_LINUX_REFUSALS[@]}" >/dev/null; then`. In its comment, change *"On Linux its refusal strings are the judge's whole Linux set, through judge.sh → sp__linux_refusal_line."* to *"On Linux its refusal strings are SP__WP_LINUX_REFUSALS, through judge.sh → sp__linux_refusal_line."*

4. In the Linux pass sentence, change `$(sp__linux_refusal_names)` to `$(sp__linux_refusal_names "${SP__WP_LINUX_REFUSALS[@]}")`.

5. In the file header (each phrase below wraps across `#` comment lines, so match it across the line break and rewrap):
   - In the `ON LINUX (SP_PLATFORM `linux`)` paragraph, change *"every string of the judge's Linux set is a rename refusal beside Operation not permitted, and the row's pass sentence names them all through judge.sh → sp__linux_refusal_names"* to *"every string of SP__WP_LINUX_REFUSALS, the judge's Linux set less git's lock line, is a rename refusal beside Operation not permitted, and the row's pass sentence names them through judge.sh → sp__linux_refusal_names"*.
   - In the `PD23.` paragraph, change *"sp__wp_mv_class classes every string of the judge's Linux set as `refused`"* to *"sp__wp_mv_class classes every string of SP__WP_LINUX_REFUSALS as `refused`"*.

6. In `cli/test/sandbox-probe-protection-legs.test.mjs`, replace the case `sp__linux_refusal_names: the Linux pass sentence names the judge’s whole set` with:

   ```js
   test('sp__linux_refusal_names: the Linux pass sentence names the judge’s set less git’s lock line', async (t) => {
     const dir = await caseDir(t);
     const run = await sourced(dir, 'sp__linux_refusal_names "${SP__WP_LINUX_REFUSALS[@]}"');
     assert.equal(run.status, 0, run.stderr);
     assert.equal(run.stdout, 'Read-only file system, Permission denied, Device or resource busy');
     const stranger = await sourced(dir, 'sp__linux_refusal_names "File exists"');
     assert.equal(stranger.status, 2);
     assert.equal(stranger.stdout, '');
   });
   ```

   In the same file's header comment, change *"the judge's whole Linux set applying to a dd and a rename alike"* (it wraps after *"the judge's"*) to *"the judge's Linux set less git's lock line applying to a dd and a rename alike"*.

Leave `cli/test/sandbox-probe-judge.test.mjs` → `the Linux table names exactly its four strings` as it is. It calls `sp__linux_refusal_names` with no argument and still expects all four strings. `sp_judge_call` keeps reading the whole set, so CL5's verdict does not move and neither does any macOS verdict. This fix edits `cli/test/sandbox-probe-protection-legs.test.mjs`, so that file is the only test it runs: `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs`. The full suite runs later, in the Run gates phase.
