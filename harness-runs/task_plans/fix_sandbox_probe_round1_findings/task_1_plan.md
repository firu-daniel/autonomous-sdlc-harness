### Task 1 — Refuse a result line whose row is not its leg's, record non-passing legs, and restate the changed legs' expected results in the leg table and Gate 15

**Goal:** Make `sp_result_line` refuse a line whose row is not one of its leg's declared rows. A fused `T2fail` is then caught at its source, whatever its other arguments say. Record every leg that printed anything but `pass`, for Task 3's evidence keeping. Restate the expected result of each leg this branch changes, in `SP_LEGS` and in Gate 15's restated table, in one edit.

**Where this task stops.** It changes no leg. The leg tasks (4–9) change what each leg does, against the expected texts written here. Task 3 consumes `sp_leg_nonpass`. Task 11 tests the row check and the record. Task 16 amends the rows in `docs/sandbox-verification.md`, and this task touches none of them.

### Targets

- `scripts/lib/sandbox-probe/core.sh`: `sp_result_line`, the new non-pass record, the `SP_LEGS` declarations and the header comment.
- `docs/development.md` → the `**Gate 15 — the unattended sandbox probe (macOS).**` entry: the leg table rows, its bold sentence `**It changes nothing outside its own temp area, the probe clone and the probe branch**`, and one new evidence paragraph.

**Work:**

- [ ] **Row check in `sp_result_line`.**
  - Before the verdict check, refuse a row that is not one of `sp_leg_rows "$leg"`'s comma-joined rows. The one exception is leg `judge` with row `-` (the `judge` subcommand's line, `judge.sh` → `sp_judge_cli`).
  - On refusal:
    - print no result line;
    - write exactly `sp_refuse "sp_result_line: row '$row' is not a row of leg '$leg' ($rows)"` on stderr, where `$rows` is the comma-joined list, or `none` for a leg not in the table;
    - add 1 to `SP_FAIL_COUNT`;
    - return 1.
  - Match on whole rows (`case ",$rows," in *",$row,"*)`), so `T2` never matches inside `T2fail` and `CS1` never matches `CS12`.
  - Keep the existing verdict refusal's text and behaviour unchanged. It still runs second.
- [ ] **Non-pass record.**
  - Add `SP_NONPASS_LEGS=""`, a newline-separated list, beside `SP_FAIL_COUNT`.
  - `sp_result_line` appends its leg, once, whenever it prints a `fail` or `not run` line, or refuses a line for its row or its verdict.
  - Add `sp_leg_nonpass <leg>`, which returns status 0 when the leg is in the list and 1 otherwise. Use no pipe: `case $'\n'"$SP_NONPASS_LEGS" in *$'\n'"$1"$'\n'*)`.
  - Leg `judge` is recorded like any other. Nothing reads it.
- [ ] **`SP_LEGS` expected texts.** Replace the third argument of these eight `sp_leg_declare` calls. Leave the leg name, rows and "recorded in" argument unchanged. The texts must carry no `|` and no tab.
  - `gates`: `the gates, started in the clone through run-test-suite.sh and collected with --wait, reach a pass verdict with no gate failing on its temporary file, and each of W7's six wrapper calls runs with no permission denial`
  - `mktemp`: `the bare, -d and -t mktemp forms are refused with mkstemp failed, the explicit form spelled with the session's TMPDIR as a literal path is written, and a call refused at the permission layer is not run`
  - `wrappers`: `the main checkout's wrappers run outside the sandbox and land on the clone, while the clone's own copies, the compound and the assignment prefix stay sandboxed or are neutralised, the prefix allowed through --allowedTools so a permission-layer refusal of it is not run`
  - `wrappers-refresh`: `refresh-branch.sh on the clone arm runs outside the sandbox: fixture (a) fast-forwards, (b) writes a two-parent merge, (c) exits 4 with nothing written, and the clone's own copy stays sandboxed for its fetch while its --local merge runs in the clone`
  - `write-protection`: `every write to the clone's protected paths, to <main>/.git and to the per-run profile, the per-run profile's Edit included, is refused while its control is written, and neither this leg's debug log nor W7's carries an unmatched-rule line`
  - `git`: `ordinary git in the clone succeeds under the real per-run profile, git fetch origin is refused by the network allowlist as the clone layout intends, and each CL5 write is refused or written as recorded`
  - `network`: `hosts off the allowlist are refused, a loopback listener the probe owns returns no body to the session, a link-local host's curl error line is recorded and is not run where it cannot tell a refusal from an unreachable host, and a call carrying allowed_domains does not reach its host`
  - `credentials`: `reads of ~/.ssh are refused, the token variables the profile unsets are absent by a check that prints presence only, whether the SSH agent socket is reachable is recorded, and the leg is not run when its session issued no calls`
- [ ] **Gate 15's leg table.**
  - In `docs/development.md` → the table under `| Leg | Rows | Expected | Recorded in |`, replace the Expected cell of the same eight rows with the texts above.
  - Wrap in backticks only what the existing rows already backtick-quote (`<main>/.git` is written `` `<main>/.git` `` there). The comparison in `cli/test/sandbox-probe-git-and-legs.test.mjs` strips backticks and splits on `|`.
- [ ] **Gate 15's evidence paragraph, its temp-area sentence, and `core.sh`'s header.**
  - In the Gate 15 paragraph, amend the bold sentence `**It changes nothing outside its own temp area, the probe clone and the probe branch**` to name the one exception: the evidence directory it keeps under `TMPDIR` when a leg does not pass, and prints last. Keep the bold span and the `shasum` guard clause that follows it. Task 3 makes the same correction to `scripts/sandbox-probe.sh`'s header sentence.
  - After the fenced command block that follows the `CS1's probe set includes the installed plugin root…` paragraph, and before `**The rows this probe does not take, named so the list is complete.**`, add one paragraph. It must not sit between that paragraph's closing colon and its fenced block. It states:
    - when a leg prints anything but `pass`, the probe keeps that leg's session streams, prompts, stderr files and debug logs, and T2's gate log;
    - it moves them, before teardown removes its temp area, into a new `sandbox-probe-evidence.<suffix>` directory under `TMPDIR` (outside the clone and the main checkout);
    - it prints that directory as its last stderr line;
    - a passing leg keeps nothing;
    - the kept streams can quote what a session read, so the person who ran the probe removes the directory once the rows are recorded.
  - No new command goes inline (the ledger's fenced-block rule). The fenced block stays as it is.
  - In `core.sh`'s header, name the row check and `SP_NONPASS_LEGS` / `sp_leg_nonpass` beside the result line.

**Verification:**

- `bash scripts/sandbox-probe.sh --list` prints the eight changed lines with the texts above. Each Expected cell of Gate 15's table, with backticks removed, equals the matching `--list` line's third field. Task 11's suite holds that comparison.
- Each `sp_result_line` call in `scripts/lib/sandbox-probe/*.sh` that names a literal row names one in its own leg's rows. Re-derive with `grep -nE 'sp_(result_line|row_result)( --direct)? [a-z-]+ [A-Z]' scripts/lib/sandbox-probe/*.sh`. Every literal row on a matched line must be one of that leg's `--list` rows. The defective `gates T2"$verdict"` call is the one exception; Task 4 fixes it.
- No sentence in `docs/development.md` other than the eight Expected cells, the Gate 15 paragraph's `It changes nothing outside its own temp area…` sentence and the new paragraph changed (`git diff -- docs/development.md`).
- `git grep -n 'nothing outside its own temp area' -- docs` still matches only the Gate 15 paragraph, and that sentence now names the kept evidence directory.
- The new paragraph sits after the fenced command block and directly before `**The rows this probe does not take…**`; the CS1 paragraph's colon is still followed by its fenced block.
