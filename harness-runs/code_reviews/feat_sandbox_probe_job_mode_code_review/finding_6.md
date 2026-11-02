### 6. The Linux write-protection pass sentence still names two refusal strings, though the judge now passes CS1, CS2 and CS7 on any of four

**File:** `scripts/lib/sandbox-probe/legs-protection.sh` (`sp__wp_judge_row`) — "refused by the sandbox (Operation not permitted or Read-only file system)". The set it should name is `scripts/lib/sandbox-probe/judge.sh` → `SP__LINUX_SANDBOX_STRINGS=("Read-only file system" "Permission denied" "Device or resource busy")`.

**Problem.** The branch widens what the probe accepts as a Linux sandbox refusal:

- `judge.sh` adds `SP__LINUX_SANDBOX_STRINGS` and `sp__linux_refusal_line`, and `sp__layer` now files a result carrying any of the three under layer `sandbox`. So a CS1/CS2/CS7 `dd` passes on any of them.
- `legs-protection.sh` → `sp__wp_mv_class` now classes the whole set as `refused`. So a rename passes on any of them too.

`sp__wp_judge_row`'s Linux pass arm is unchanged and still writes:

`$passed target(s): every dd and rename refused by the sandbox (Operation not permitted or Read-only file system), every inode and shasum unchanged, no new name created`

When a Linux row passes on `Permission denied` or `Device or resource busy`, the recorded evidence names messages the probe did not see. That evidence is what `docs/sandbox-verification.md` rows such as CS2 (Linux) and CS7 (Linux) are transcribed from. `harness-runs/lessons.md` → `## Evidence and measurement` ("A measurement script stores and reports every reading in full") and `.claude/context/conventions.md` → `## Documents of record` ("A measured fact states what was measured, the command and the exact message") both bind that text. The grading itself is sound: the same function checks every target's inode and shasum on disk. Only the evidence sentence is wrong.

The file's header has the same drift: "`Read-only file system` is a rename refusal beside `Operation not permitted`, and the row's pass sentence names both."

Nothing under `cli/test/` asserts the old sentence. A search for "every dd and rename" and "Operation not permitted or Read-only" there finds no match, so no existing case changes.

**Fix.** Build the sentence from the judge's own set, so it cannot drift from the judge again.

1. In `scripts/lib/sandbox-probe/judge.sh`, right after the closing `}` of `sp__linux_refusal_line`, add:

   ```bash
   # sp__linux_refusal_names — print SP__LINUX_SANDBOX_STRINGS joined by ", ", for an evidence sentence that
   # names the set it was graded against.
   sp__linux_refusal_names() {
     local s out=""
     for s in "${SP__LINUX_SANDBOX_STRINGS[@]}"; do
       out="${out:+$out, }$s"
     done
     printf '%s' "$out"
   }
   ```

2. In the same file, change the comment above `SP__LINUX_SANDBOX_STRINGS` from "a caller outside this file reads them through" / "sp__linux_refusal_line." to read: `a caller outside this file reads them through sp__linux_refusal_line, or names them through sp__linux_refusal_names.` Rewrap the two comment lines to fit.
3. In `scripts/lib/sandbox-probe/legs-protection.sh` → `sp__wp_judge_row`, in the `elif [ "${SP_PLATFORM:-}" = linux ]; then` arm, replace the `SP__WP_RE=` line with:

   ```bash
       SP__WP_RE="$passed target(s): every dd and rename refused by the sandbox (one of: Operation not permitted, $(sp__linux_refusal_names)), every inode and shasum unchanged, no new name created"
   ```

   The macOS arm below it stays exactly as it is.
4. In the same file's header, in the `ON LINUX (SP_PLATFORM `linux`)` paragraph, replace "`Read-only file system` is a" / "rename refusal beside `Operation not permitted`, and the row's pass sentence names both." with: `every string of the judge's Linux set is a rename refusal beside Operation not permitted, and the row's pass sentence names them all through judge.sh → sp__linux_refusal_names.` Rewrap the paragraph to fit.
5. In `cli/test/sandbox-probe-protection-legs.test.mjs`, after `test('sp__wp_mv_class: one rename helper line’s class, by platform', …)`, add:

   ```js
   test('sp__linux_refusal_names: the Linux pass sentence names the judge’s whole set', async (t) => {
     const dir = await caseDir(t);
     const run = await sourced(dir, 'sp__linux_refusal_names');
     assert.equal(run.status, 0, run.stderr);
     assert.equal(run.stdout, 'Read-only file system, Permission denied, Device or resource busy');
   });
   ```

   The suite already sources `judge.sh` through `LIBS`. This file is the test file the fix edits, so it is the one the fix runs.

Do not edit the CS2 (Linux) and CS7 (Linux) rows of `docs/sandbox-verification.md`: they quote what the probe printed on 2026-10-29, and a measured fact stays as it was measured.
