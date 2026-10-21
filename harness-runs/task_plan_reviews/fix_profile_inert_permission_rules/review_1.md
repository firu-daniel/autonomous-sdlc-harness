# Task plan review — iteration 1

## Must Fix

1. **Scope register: no derivation entry reaches `examples/notes-app/README.md`, which Task 10 makes false.** Applies to the story index (`fix_profile_inert_permission_rules_story_plan.md`), `## Scope register`, and to `task_10_plan.md`.
   I re-ran entries A, B and C exactly as written and re-walked D. Every site they reach has a row (rows 1–33), D still reaches no ledger entry, and the iteration-0 finding about `docs/outer-loop-verification.md` is resolved by row 33. But the register misses one site that no entry reaches:
   - `examples/notes-app/README.md`, in the paragraph that records the machine-path substitution of `.claude/settings.autonomous.json`. It says *"The file now carries 212 `/workspace`-rooted occurrences across 173 lines (`grep -o '/workspace' … | wc -l` and `grep -c '/workspace'`): 181 `/workspace/notes-app`, 59 of them the sibling worktree glob `/workspace/notes-app-*`"*, and it lists what the file carries as *"every `Read` / `Edit` / `Write` file rule, every wrapper `Bash` entry"*.

   I ran those counts on the current fixture: 212, 173, 181 and 59, all exact. The fixture currently holds 41 lines with `Write(` and 9 `notes-app-*/scripts/` wrapper rows. Task 10 removes all of them, so after Task 10 every one of those figures is wrong, and so is the claim that the file has `Write` file rules. This paragraph is kept current whenever the fixture is re-rendered: `7a760676` (#122) changed `examples/notes-app/.claude/settings.autonomous.json` and edited this README in the same change. The README is not one of the frozen-capture files listed in `.claude/context/conventions.md` → `## Documents of record`.

   Entry A does not match it because the text is spelled `` `Edit` / `Write` `` with a backtick on each side of the ` / `. `Edit ?/ ?`?Write` needs `/` straight after `Edit`, and `Edit`/`Write` allows no spaces. No other entry matches it either.
   **Fix:** In the story index, replace derivation entry A with this command. It is strictly wider than the current entry. I ran it, and the only file it adds is `examples/notes-app/README.md`:
   ```
   git grep -lE 'Write\(|`Write` (rule|deny|allow|pair)|Edit` and (a )?`Write|Edit and a Write|Edit ?/ ?`?Write|Edit`/`Write|`Read`, `Edit` and `Write|`Edit` / `Write`|sibling worktree glob' -- . ':!harness-runs' ':!*.sh' ':!*.ts' ':!*.mjs'
   ```
   Add a row for `examples/notes-app/README.md`, anchored on the quoted text *"The file now carries 212 `/workspace`-rooted occurrences"*, with Evidence `A`, Disposition `change` and owner Task 10. In `task_10_plan.md`:
   - Add the README to `### Targets`.
   - Add a `**Work:**` bullet to re-take the paragraph's figures on the re-rendered file with the commands the paragraph quotes, rewrite *"every `Read` / `Edit` / `Write` file rule"* to describe what the file now carries, and add one sentence recording this re-render, as earlier re-renders did.
   - Add a `**Verification:**` bullet saying the figures equal the commands' output.

   Then run every entry again and check that the closure invariant holds.

## Should Fix

These four repeat iteration 0's Should Fix items. The plan neither applied them nor recorded them under `## Rejected findings`.

1. **Task 7 still misses stale sentences in `docs/cli.md`** (`task_7_plan.md`).
   - In the paragraph after the `## 6.` bullet list: *"Because `ask` is evaluated before `allow`, **all three** forms are asked about"*.
   - In the `profile-paths` bullet: *"a relocated repository carries a profile whose edit, write, read and script rules match nothing here"*, and *"the sibling-worktree glob every generated profile carries"*. That glob is now carried only by the `Edit`/`Read` file rules.

   Task 7's verification grep, `three (literal )?forms`, does not match `**all three** forms`. Add `\*\*all three\*\*` to it, and add a `**Work:**` sub-bullet for each sentence.
2. **Stale doc comments and report text in `cli/src/doctor/checks.ts` that Task 2 does not target** (`task_2_plan.md`, which owns the file).
   - `COMMAND_PERMISSIONS_CHECK`'s doc says *"the three-forms-per-script invariant is asserted here from the outside"* and *"the deploy wrapper's three are"*.
   - The neighbouring check's doc says *"the profile carries its three allow entries"*.
   - `PROFILE_PATHS_CHECK`'s warn sentence says *"its edit, write, read and script rules matching nothing here"*.

   All of these are false once `FORMS_PER_SCRIPT` is `2` and no `Write` rule is generated. Add the symbols to Task 2's `### Targets` and give them a `**Work:**` bullet.
3. **The refusal sentence for `run_profile_check`'s `delta` verdict, kept byte-identical, becomes inaccurate** (`task_1_plan.md`). The sentence is *"differs from the base profile … by more than entries appended to sandbox.filesystem.denyWrite and permissions.deny"*. Once twin appends to `allow` and `ask` are accepted, that list is incomplete. Also, the current jq returns `delta` for any change outside `denyWrite` and `deny` (`($F | restore($dw) | restore($pd)) != $B`). Unless the twin lists are restored before that comparison, a non-twin `allow` append reaches `delta`, never the new verdict. State the order the verdicts are tested in, and either name the twin appends in the `delta` sentence or say why it may stay as it is.
4. **W7 does not tell the profile's grant apart from the guard's** (`task_9_plan.md`). With cwd at `<clone>`, the script-allowlist guard already answers `allow` for `bash <clone>/scripts/typecheck.sh`, so W7 passes whether or not the per-run twin rule matches. Add a variant or condition that isolates the profile rule, for example plugin hooks disabled, or the `--debug` line naming the rule that matched.

## Nice to Have

None.
