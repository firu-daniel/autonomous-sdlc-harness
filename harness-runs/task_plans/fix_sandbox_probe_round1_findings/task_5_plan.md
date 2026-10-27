### Task 5 — Take CS7's `Edit` and W7's debug log, grade CS3's fetch as an expected refusal, and drop the pipe in `sp__wp_tracked`

**Goal:** Fix four defects in `scripts/lib/sandbox-probe/legs-protection.sh`:

- **Defect 12.** Take the two halves the write-protection leg skipped: CS7's `Edit` (after `Read`) of the per-run profile, and W8's reading of W7's debug log.
- **Defect 9.** In the git leg, grade CS3's `git fetch origin` as the expected refusal it is by design (§7 OR2), and grade CS3 on its remaining calls.
- **Defect 10.** Remove the pipe into `grep -qxF` that printed `printf: write error: Broken pipe`.

**Depends on:**

- **Task 1.** The leg table now expects *"the per-run profile's Edit included … neither this leg's debug log nor W7's carries an unmatched-rule line"* (write-protection) and *"git fetch origin is refused by the network allowlist as the clone layout intends"* (git).
- **Task 4.** It sets the global `SP_W7_DEBUG` to `$SP_TMP/gates-w7.debug.log` once W7's session has launched, and leaves it empty otherwise. This task reads `${SP_W7_DEBUG:-}` and nothing else of the gates leg.

**Where this layer stops.**

- **Task 14** tests the four functions below by sourcing `core.sh`, `judge.sh`, `controls.sh` and this file. So `sp__wp_w8`, `sp__wp_cs7_edit` and `sp__git_cs3_fetch` read only their arguments, the stream and (for W8) `SP_RUN_PROFILE`. They never launch a session or call `hr_*`.
- **Task 16** amends no row this task touches: CS7's and W8's checks already name the `Edit` and both sessions. CS3's expected column is Task 16's.

### Targets

- `scripts/lib/sandbox-probe/legs-protection.sh`: `sp__wp_tracked`, `sp__wp_w8`, `sp_leg_write_protection`, `sp_leg_git`, the new `sp__wp_cs7_edit` and `sp__git_cs3_fetch`, and the header.

**Work:**

- [ ] **`sp__wp_tracked [<exclude>]`, no pipe.** Replace `printf '%s\n' "$list" | grep -qxF README.md` with a whole-line `case $'\n'"$list"$'\n' in *$'\n'README.md$'\n'*)`. Same result, same signature, nothing on stderr.
- [ ] **CS7's `Edit`.**
  - In the write-protection session's prompt, after the W6 calls and before the controls, add:

    ```
    sp_prompt_tool "$pfile" "Edit, with file_path set to exactly $SP_RUN_PROFILE (after a Read of that same path), appending the line: sandbox probe CS7"
    ```
  - Add `sp__wp_cs7_edit <stream> <run profile>`. It sets `SP__WP_EDIT_V` (`pass` | `fail` | `not run`) and `SP__WP_EDIT_E` from `sp_judge_tool <stream> file-tool Edit <run profile>`:
    - layer `file-tool` or `permission` → `pass`, `Edit refused at the <layer> layer: <evidence>`;
    - layer `ran` → `fail`, `the Edit of <run profile> was not refused`;
    - no match → `not run`, quoting the judge.
  - CS7's line combines the dd/rename verdict (`sp__wp_judge_row CS7`) with this half:
    - `fail` if either fails;
    - otherwise `not run` if either is `not run`;
    - otherwise `pass`.
  - The evidence carries both clauses. The existing shasum check of the run profile covers the `Edit` too, because it is taken after the session.
- [ ] **W8 reads both logs.** Change the signature to `sp__wp_w8 <departure> <write-protection log> <W7 log, or empty>`, and call it with `"$departure" "$dbg" "${SP_W7_DEBUG:-}"`. It prints W8's one line through `sp_result_line`:
  - Apply the existing unmatched-rule / mixed-prefix test to each log in turn.
  - `fail` when either log carries such a line for a rule `SP_RUN_PROFILE` carries. Quote the line and name its log (`write-protection` or `W7`).
  - Otherwise `not run` when either log is empty, missing or not given: `W7's --debug-file log is missing or empty (the gates leg did not run its W7 session in this run)`, or the write-protection equivalent.
  - Otherwise `pass`, with each log's line count and the count of such lines for rules the profile does not carry.
- [ ] **CS3's fetch, an expected refusal.**
  - Take `$c_fetch` out of the loop that expects layer `ran`.
  - Add `sp__git_cs3_fetch <stream> <command>`. It sets `SP__GIT_FETCH_V` and `SP__GIT_FETCH_E` from `sp_judge_call <stream> network <command>`:
    - layer `network` → `pass`, `refused by the network allowlist, as the clone layout intends (§7 OR2): <evidence>`;
    - layer `ran` → `fail`, `git fetch origin reached origin from inside the sandbox: <evidence>`;
    - any other layer, or no match → `not run`, naming it.
  - CS3's verdict folds this half in like the other calls: a `fail` adds to `fails`, a `not run` to `notrun`. The `pass` clause joins `parts` beside `origin: <url>`.
  - The other calls and the ref, stash and switch checks are unchanged.
- [ ] **The header.** Name the CS7 `Edit` half, W8's two logs and `SP_W7_DEBUG`, CS3's fetch as an expected refusal, and the four functions with their signatures.

**Verification:**

- `grep -nE '\| *grep' scripts/lib/sandbox-probe/legs-protection.sh` finds nothing.
- The write-protection prompt's CS7 `Edit` sentence names `$SP_RUN_PROFILE`, and CS7's `sp_row_result` evidence carries both the dd/rename clause and the `Edit` clause.
- `sp__wp_w8` is called once, with three arguments, the third `"${SP_W7_DEBUG:-}"`.
- `$c_fetch` no longer appears in the `for cmd in …` judging loop, and appears in exactly one `sp__git_cs3_fetch` call.

**Deviations from plan:**

- `sp__wp_cs7_edit`: the plan named layers `file-tool`/`permission`, `ran` and no match. A refusal at any other layer (`sandbox`, `network`) is graded `not run`, naming the layer, the way the plan grades `sp__git_cs3_fetch`'s other layers. The `ran` evidence also quotes the judge's line after `the Edit of <run profile> was not refused`.
- `sp__wp_w8`: the not-run evidence keeps the per-log counts of any log that was read. The per-log scan moved into a helper, `sp__wp_w8_scan <log> <rules>`, which reads only its arguments.
- Verification: a bare `bash -n` on the file was refused at the permission layer (`don't ask mode`). Syntax rests on `bash scripts/typecheck.sh` instead (`check-shell-parse: 89 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`; `PASS: typecheck`). Behaviour rests on a scratch probe run through `scripts/scratch-run.sh`. It sourced `core.sh`, `judge.sh`, `controls.sh` and this file against synthetic streams, and covered `sp__wp_tracked`, all three `sp__wp_cs7_edit` and `sp__git_cs3_fetch` branches, and W8's fail-in-W7, missing-W7 and pass cases. Each printed the expected verdict, with nothing on stderr. The probe stays at `harness-runs/scratch/task5_probe.py` and is not to be committed, because the `rm` of it was refused (`don't ask mode`).
