### Task 3 — Base profile: drop the `Write` allow pair and the sibling-glob wrapper rows

**Goal:** The generated base profile carries no `Write(path)` rule, and no wrapper rule spelled under the sibling-run-copy glob. Each wrapper and each agent-invocable outer-loop script is allow-listed in **two** forms in the base: the repo-relative invocation and the main-checkout absolute path. The run copy's own exact form comes from the watcher's per-run copy. The template's `_README` says so instead of describing rules that do not match.

**Depends on:** Task 1. That task makes `writeProtection.ts` → `fileToolDenyRules` `Edit`-only, and has the watcher's per-run copy append, for every base `permissions.allow` and `permissions.ask` entry starting `Bash(bash <MAIN_REPO>/<scripts_dir>/`, its twin starting `Bash(bash <copy>/<scripts_dir>/`, to the same list. This task's `_README` describes that third form. It does not build it. Task 2 has already made `doctor` grade `Edit` deny rules only.

**Where this task stops.** The prose of `cli/templates/claude/settings.autonomous.qa.json` and `cli/scripts/README.md` is **Task 4**'s. `examples/notes-app/.claude/settings.autonomous.json` is **Task 10**'s.

### Targets

- `cli/templates/claude/settings.autonomous.json`: `permissions.allow`, `permissions.ask`, `_README`.
- `cli/src/generators/permissionProfile.ts`: `RowTokens` and the three token families, `FORMS_PER_SCRIPT`, the module header and the doc comments that say *"three forms"*.
- `cli/test/profile.test.mjs`.
- `cli/test/init.test.mjs`.
- `cli/test/doctor.test.mjs`.

**Work:**

- [ ] **Template rows.** Remove `Write(/{{repoRoot}}/**)` and `Write(/{{worktreeGlob}}/**)` from `allow`, and the three form-(iii) rows `Bash(bash {{worktreeGlob}}/{{scriptPath}}:*)`, `Bash(bash {{worktreeGlob}}/{{outerLoopPath}}:*)` (both in `allow`) and `Bash(bash {{worktreeGlob}}/{{deployPath}}:*)` (in `ask`). Keep the `Edit` and `Read` pairs for `{{repoRoot}}` and `{{worktreeGlob}}`. They are the file grants, and they are what `doctor`'s `profile-paths` check covers a run copy's root with.
- [ ] **Template `_README`.** Rewrite only the lines that state what was removed, and leave every other line byte-identical.
  - **THE CHECKOUT AND ITS SIBLING WORKTREES BOTH:** the file globs are listed for both. A wrapper path is listed for the checkout here, and the run watcher's per-run copy adds the run copy's own exact path, because a `*` before a rule's trailing `:*` is matched literally (`docs/sandbox-verification.md` F4).
  - **EVERY WRAPPER … ALL THREE FORMS:** two forms here plus the per-run copy's exact third. The deploy wrapper's `ask` rows are twinned into `ask` the same way, so remove deploy from both blocks or from neither still holds.
  - **THE OUTER-LOOP SCRIPTS … SAME THREE WAYS** and **THE PROBE ROUTE … three forms are already listed above:** the same forms.
  - **CREATING A FILE AND CHANGING ONE ARE TWO DIFFERENT GRANTS:** replace it with a line stating that `Edit` rules cover every file-editing tool, creation by `Write` included, and that a `Write(path)` rule is accepted, never consulted, and warned about at startup, so this profile writes none.
  - **EVERY FILE RULE … `Read`, `Edit` AND `Write` ALIKE:** now `Read` and `Edit`. Keep the two-slash explanation.
  - **THREE COMMANDS RUN OUTSIDE THE SANDBOX:** *"The repo-relative and sibling run-copy spellings … stay in `allow` above"* now names the repo-relative spelling here and the run copy's exact spelling in the per-run copy.
  - **TWO RESIDUALS:** *"the `Edit` deny rules carry the same globs"*.
- [ ] **`permissionProfile.ts`.** Drop form (iii) from `RowTokens`: its `path` member, and the `scriptPath`, `outerLoopPath` and `deployPath` token names in `WRAPPER_ROW_TOKENS`, `OUTER_LOOP_ROW_TOKENS`, `DEPLOY_ROW_TOKENS`, `tokenNames`, `rowValues` and the known-token set. A template still carrying one of those tokens must fail as an unknown token. Set `FORMS_PER_SCRIPT` to `2`, and keep `assertEveryScriptListed` as the check. Rewrite the module header's failure mode 3 and choice 1, plus every *"three forms"* doc comment (`RowTokens`, `OUTER_LOOP_ROW_TOKENS`, `DEPLOY_ROW_TOKENS`, `FORMS_PER_SCRIPT`, `SelectedScript`, `invokedPath`, `renderArray`, `assertEveryScriptListed`), so that they say two forms in the base and the run copy's exact form in the watcher's per-run copy. In `pluginRootEntryTarget`'s doc, the *"sibling-worktree spelling"* becomes a spelling a profile an earlier release wrote. `SelectedScript.path` may stay if `invokedPath`'s validation still uses it. Do not add a third token family.
  - [ ] **Declare the watcher's mirror in the module header.** The header has no mirrors block today. Add one in the form `cli/src/generators/writeProtection.ts`'s header uses (*"Mirrors outside this package, each held equal by the suite named:"*, one bullet per mirror, then *"A mirror this header does not declare is a defect."*). Its one bullet names `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_wrapper_prefixes` (added by Task 1) as a copy of the main-checkout wrapper-row prefix that the `{{repoRoot}}` rows of `WRAPPER_ROW_TOKENS`, `OUTER_LOOP_ROW_TOKENS` and `DEPLOY_ROW_TOKENS` render through `rowValues`: `Bash(bash <repoRoot>/<scriptsDir>/`, with a `.` scripts directory collapsing to `Bash(bash <repoRoot>/` as `join(repoRoot, scriptsDir)` does. It names `cli/test/watcher-run-profile.test.mjs` as the suite holding them equal, and states that any change to that row spelling is an edit to `run_profile_wrapper_prefixes` in the same change. The `RowTokens` doc comment points at that header bullet rather than restating the prefix.
- [ ] **`profile.test.mjs`.**
  - `expectedForms` returns the two forms.
  - Rewrite the tests *"every wrapper that was written is allow-listed for this checkout and for a sibling worktree"*, the outer-loop *"three forms"* test and the scratch-runner test. The two forms are present, and no `allow` or `ask` entry starts with `Bash(bash <worktreeGlob>`.
  - *"reading, changing and creating a file are each granted"* asserts the `Edit` and `Read` pairs for the checkout and the sibling glob, and that no entry in `allow` or `deny` starts with `Write(`. Rewrite its comment to the `Edit`-covers-`Write` reason.
  - The write-protection helpers (the *"Both sides of one protected path"* and *"Neither side of one path"* helpers, and the `copyGit` case) expect `Edit` rules only.
  - The sandbox-exclusion negatives that spell a sibling-glob path stay as negative inputs.
- [ ] **`init.test.mjs` and `doctor.test.mjs`.** In `init.test.mjs`, the forward pairing case (*"each written wrapper contributes exactly the three forms"*), the custom-`scriptsDir` case that builds `join(worktreeGlob, 'harness-scripts', name)`, and the header and inline comments that describe the glob form all move to two forms. In `doctor.test.mjs`, the wrapper-forms helper documented as *"its sibling-worktree twin"* builds two forms. The case that pushes `Edit`/`Write` rules for directories pushes `Edit` only. Leave the case *"a sibling worktree is covered by the profile's worktree pattern and does not warn"* unchanged. It is this branch's end-to-end check that coverage holds through the kept `Edit`/`Read` globs.

**Verification:**

- `npm test --workspace cli -- test/profile.test.mjs`, then `npm test --workspace cli -- test/init.test.mjs`, then `npm test --workspace cli -- test/doctor.test.mjs`, each as one plain foreground command from the repository root. All three pass.
- `doctor.test.mjs`'s unchanged sibling-worktree coverage case passes on a profile with no glob wrapper row. `doctor`'s `profile-paths` still covers a run copy through the kept `Edit`/`Read` globs. This is the coverage dependency the task prompt names.
- The *"reading, changing and creating"* case covers the third `Top risks:` entry as far as a test can: the `Edit` pair that now grants creation is asserted present for both roots. The real-session confirmation is the owed W6 row (Task 9).
- Run `grep -nE 'Write\(|worktreeGlob\}\}/\{\{' cli/templates/claude/settings.autonomous.json`. The only hits allowed are `_README` prose. No permission entry may match.
