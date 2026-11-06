### 2. The `pause-note` arm's canned skip line is read out of `hr_remote_copy_tree`, but `hr_remote_bundle_source_ok` prints it

**File:** `cli/test/gate12-sandbox-round-grade.test.mjs` — the module-level `const [SKIP_PREFIX, SKIP_SUFFIX] = extract(` reading `fnBody(source(LIB), 'hr_remote_copy_tree', LIB)`, and its use in `sb2PauseRun` through `skipLine(PAUSE_LINK)`.

**Problem.** The suite's stated rule, in its header, is that every log string a canned answer carries *"is read at test time out of the shipped file that prints it"*. The branch's story plan restates it as a constraint every task carries.

- The `clarifications` arm's skip line is printed by `hr_remote_copy_tree`, the directory source. The suite extracts its prefix and suffix from that function, which is correct.
- The `pause-note` arm's line is printed by a different function: `hr_remote_bundle_source_ok` in `cli/templates/scripts/lib/harness-run-lib.sh`, the per-source gate `hr_remote_bundle_write` runs before the `PAUSE_PROGRESS.md` file source. `grade-state.sh` says so itself: *"the pause-note arm's is hr_remote_bundle_source_ok's, for the PAUSE_PROGRESS.md source"*.
- Yet `sb2PauseRun` cans its line from `hr_remote_copy_tree`'s strings, and the suite header says the same: *"`hr_remote_copy_tree`: … of both SB2 arms' skip lines"*.

Today the two `printf` formats are the same, so nothing fails. But a later edit to `hr_remote_bundle_source_ok`'s wording would leave the shipped grader matching nothing on a real `pause-note` run, and it would grade a genuine skip as `not run`. Every `pause-note` case here would stay green.

**Fix.**

1. Below the existing `SKIP_PREFIX` / `SKIP_SUFFIX` extraction, add a second one from the function that prints the `pause-note` line:

   ```js
   const [SOURCE_SKIP_PREFIX, SOURCE_SKIP_SUFFIX] = extract(
     fnBody(source(LIB), 'hr_remote_bundle_source_ok', LIB),
     /printf '(remote state bundle: skipped )%s: %s( is a symbolic link)\\n'/,
     'hr_remote_bundle_source_ok skip line',
   );
   const sourceSkipLine = (path) => `${SOURCE_SKIP_PREFIX}${path}: ${path}${SOURCE_SKIP_SUFFIX}`;
   ```

2. In `sb2PauseRun`, change the default `save = [skipLine(PAUSE_LINK)]` to `save = [sourceSkipLine(PAUSE_LINK)]`. In the case "SB2 pause-note: no skip line for PAUSE_PROGRESS.md and a clean artifact is not run, …", change `sb2PauseRun({ save: [skipLine(other)] })` to `sb2PauseRun({ save: [sourceSkipLine(other)] })`.
3. In the file header, replace the bullet *"`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_copy_tree`: the `remote state bundle: skipped ` prefix and ` is a symbolic link` suffix of both SB2 arms' skip lines, the `pause-note` arm's around `<root>/<stateDir>/PAUSE_PROGRESS.md`."* with two bullets:
   - *"`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_copy_tree`: the `remote state bundle: skipped ` prefix and ` is a symbolic link` suffix of the `clarifications` arm's skip line."*
   - *"`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_source_ok`: the same prefix and suffix of the `pause-note` arm's skip line, around `<root>/<stateDir>/PAUSE_PROGRESS.md`."*

This fix edits one test file, so that file is the only test the fix runs: `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs`, from the repository root, as one plain foreground command.
