# Task plan review — iteration 0

## Must Fix

1. **Scope register: entries B and C miss `docs/outer-loop-verification.md`** — story index (`fix_profile_inert_permission_rules_story_plan.md`), `## Scope register`.
   I re-ran every derivation entry exactly as written. Every hit from A, B and C has a row, and D still reaches nothing. But neither entry B nor entry C reaches a site that matches the scope predicate (*"text that states … which forms a wrapper is allow-listed in"*, plus the guard's sibling-run-copy statement this branch narrows), so that site has no row:
   - `docs/outer-loop-verification.md` → `### 1.8 \`refresh-branch.sh\` — the one permitted spelling of the safe direction` → **Reachability, driven on the `init` fixture.**: *"returns the three allow forms (repo-relative, repo-root-absolute, sibling-worktree glob) the profile emits for an `agentInvocable` row"*.
   - `docs/outer-loop-verification.md` → `## 3. The allow/deny surface` → **Which outer-loop scripts carry a generated permission entry, and which an agent can actually run.**: *"returns the three allow forms per script the profile emits for an `agentInvocable` row (repo-relative, repo-root-absolute, sibling-worktree glob)"*.
   - The same section's matrix row *"the same three spellings on an **allowed** basename | `allow` ×3"*. Those three spellings include *"a sibling-working-copy path"*, which is the guard decision Task 5 narrows. Entry C's pathspec names only `plugin/hooks/README.md` and `docs/guard-verification.md`, so it cannot reach this row.

   Entry B's alternation lacks `three allow forms` and `sibling-worktree glob`. Entry C is limited to two files and does not match `sibling working copy` / `sibling-working-copy`.
   **Fix:** Replace entry B with this strictly wider command, which I ran (its only new file is `docs/outer-loop-verification.md`):
   ```
   git grep -lE 'three forms|THREE FORMS|THREE WAYS|three literal forms|three allow forms|\*\*all three\*\* forms|worktree twin|run-copy twin|sibling-worktree glob|-\*/scripts/|worktree_glob>/<scripts|sibling-worktree pattern beside' -- . ':!harness-runs' ':!*.sh' ':!*.ts' ':!*.mjs'
   ```
   Replace entry C with this one, which I also ran:
   ```
   git grep -lE 'sibling (worktree|run cop|working[- ]cop)' -- plugin/hooks/README.md docs/guard-verification.md docs/outer-loop-verification.md
   ```
   Then add a row for `docs/outer-loop-verification.md`, Evidence `B, C`, with the anchors above. Choose its disposition: `no-change` with a dated-measurement reason, as rows 13 and 14 do, or `change` owned by a general-layer task. Then run every entry again and check that the closure invariant holds.

## Should Fix

1. **Task 7 misses three sentences in `docs/cli.md` that go stale** (`task_7_plan.md`).
   - *"Because `ask` is evaluated before `allow`, **all three** forms are asked about"* (the paragraph after the `## 6.` bullet list). The base now has two deploy forms, and the third is the per-run twin. Restate it the way the **Every wrapper is allow-listed** bullet is restated.
   - The `profile-paths` bullet: *"a relocated repository carries a profile whose edit, write, read and script rules match nothing here"*. There are no `Write` rules any more.
   - The same bullet: *"the sibling-worktree glob every generated profile carries"*. It is now carried only by the `Edit`/`Read` file rules.

   Task 7's verification grep `three (literal )?forms` does not match `**all three** forms`, so the first one would pass unnoticed.
2. **`COMMAND_PERMISSIONS_CHECK`'s doc comment in `cli/src/doctor/checks.ts` goes stale after Task 3** (`task_2_plan.md`, which owns `checks.ts`). It says *"the three-forms-per-script invariant is asserted here from the outside"* and *"the deploy wrapper's three are — in `ask`"*. Once `FORMS_PER_SCRIPT` is `2`, both are false. Add the symbol to Task 2's `### Targets` and give it a `**Work:**` bullet that says two forms in the base.
3. **Task 1 keeps the `delta` refusal sentence byte-identical, and that makes it inaccurate** (`task_1_plan.md`). The sentence reads *"differs from the base profile … by more than entries appended to sandbox.filesystem.denyWrite and permissions.deny"*. Once twin appends to `permissions.allow` and `permissions.ask` are accepted, that list of accepted appends is incomplete. Either name the twin appends in the sentence, or state why the sentence may stay incomplete.
4. **W7 cannot tell the profile's grant apart from the guard's** (`task_9_plan.md`). The script-allowlist guard already answers `allow` for `bash <clone>/scripts/typecheck.sh` when cwd is `<clone>`. So W7 passes whether or not the per-run twin rule matches. Add a W7 condition or variant that isolates the profile rule, for example plugin hooks disabled, or the `--debug` line naming the matched rule.

## Nice to Have

None.
