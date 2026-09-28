# Task plan review — iteration 0

## Must Fix

1. **`init`'s own closing notes and `doctor`'s remedy still print the refused default-branch push, and no task owns them** — story index (`fix_remote_job_permission_profile_story_plan.md`); a new `cli` task, or an existing one widened within budget.
   Acceptance criterion four reads *"`init`'s notes, `docs/remote-execution.md` §4 and §7, `docs/cli.md` and Gate 12's *Setup* agree with what the code does about … the default-branch push and the `workflow` scope."* The plan only fixes the documents (Tasks 8 and 10). But the push the prompt's finding 6 describes is also printed by the code:
   - `cli/src/commands/init.ts` → `reportGithubSteps` prints `command(\`git push origin ${defaultBranch}\`)` as step 1 of the `remote execution` block. That block is `init`'s note for a fresh workflow, and it never mentions the `workflow` token scope either. `cli/templates/githooks/pre-push` refuses that push (*"pre-push: refusing to push to protected branch '$target'"*), because `defaultBranch` is always in the hook's `case` set.
   - `cli/src/doctor/checks.ts` → `REMOTE_EXECUTION_CHECK` gives *"commit it and push it with \`git push origin ${branch}\`"* as the remedy when `origin/<defaultBranch>` does not carry the run workflow. That is the same setup push, and the same hook refuses it.
   - `cli/test/init.test.mjs` asserts this closing report against `docs/remote-execution.md` → `## 7. Turning it on` step 3 (the comment *"The commit line is the one `docs/remote-execution.md` → `## 7. Turning it on` step 3 prints"*). Once Task 8 changes step 3 and this code does not change, the note and the document disagree.

   The Scope register sets `cli/src/**` aside as *"owned by Tasks 1–7 as code"*, but none of Tasks 1–7 targets either file.
   **Fix:** Add a `cli` task, placed before Task 8 in readiness order and `**Depends on:**`-linked from Tasks 8 and 10. It makes `reportGithubSteps` print the route that works (the same `git push --no-verify origin <defaultBranch>` Tasks 8 and 10 adopt, with its one-sentence reason) and adds the `workflow`-scope step (`gh auth refresh -s workflow`) ahead of the push. It makes `REMOTE_EXECUTION_CHECK`'s remedy name the same route. It updates the `init.test.mjs` assertion on the closing report to match. Restate the exact printed commands in Tasks 8 and 10 so the documents and the note stay byte-aligned.

2. **Ignoring the profile for every adopter breaks the teammate-clone contract that `init`'s own note and the README state, and the plan neither changes the contract nor updates either statement** — story index (`## Context`, the *"The profile is gitignored for every adopter"* decision), `task_3_plan.md`, and a `general` task (Task 9 or 10).
   `cli/src/generators/projectSettings.ts` returns this note from `init`: *"There is no second init: the config and the permission profile are committed too."* The root `README.md` → **F. A teammate clones** says *"No `init` re-run is needed: `harness.config.json` and the permission profile are committed."*, and its only step after cloning is `npx autonomous-sdlc-harness doctor`. After Task 1:
   - a fresh clone has no `.claude/settings.autonomous.json`;
   - `doctor`'s `permission-profile` check fails (*"… could not be read"*);
   - the documented onboarding stops working.

   Acceptance criterion four requires `init`'s notes to stay true about the profile. Task 3 rewrites only `writePermissionProfile`'s note and leaves this second note in `projectSettings.ts` unowned. The Context argues the decision without stating the consequence that a teammate now owes one `init` run, so every document stating the old onboarding is left behind.
   **Fix:**
   - State the new onboarding in the Context decision: a clone runs `init`, which generates the machine-local profile.
   - Widen Task 3 (it is at 15 points, and its 4 `**Work:**` bullets have room for one more) or add a `cli` task that rewrites the `projectSettings.ts` note. Say that the profile is machine-local and ignored, and that a teammate generates theirs with `npx autonomous-sdlc-harness init`. Add a `cli/test/init.test.mjs` assertion that the note no longer says the profile is committed.
   - Give a `general` task the `README.md` → **F. A teammate clones** edit, with `init` as its own fenced command before the `doctor` block, per the lessons-ledger rule *"Every command an adopter is meant to run sits in a fenced block, one command per line"*.

3. **Scope register: the derivation misses a corpus site that states the profile is committed (disposition ii)** — story index (`## Scope register`).
   I re-ran derivation entries A and B verbatim. They reach every file the register lists, but no pattern in them matches the wording in which the corpus says the profile is **committed**. So the one corpus site whose statement Task 1 makes false is not reached: `README.md` → **F. A teammate clones**, *"No `init` re-run is needed: `harness.config.json` and the permission profile are committed."* It is not a row. It needs a `change` row owned by the task Must Fix 2 assigns.
   Corrected entry A, strictly wider than the one on the page (the same command with two more patterns):
   ```
   grep -lE -e 'settings\.autonomous\.json' -e 'plugin-root-entries' -e 'plugin-permissions' -e 'profile-paths' -e 'push origin .default branch.' -e 'succeed ungranted' -e 'workflow. scope' -e 'add-dir' -e 'permission profile.{0,40}committed' -e 'committed profile' *.md docs/*.md cli/README.md cli/templates/claude/*.json examples/notes-app/README.md
   ```
   Apply the same two patterns to entry B. The only new file it reaches is `README.md`. Its other new matches, `docs/cli.md`'s `profile-paths` bullet (*"regenerate the committed profile"*) and `docs/outer-loop-verification.md` line-free anchor *"permission profile and committed `githooks/pre-push`"*, are already rows 2 and 6.
   **Fix:** Replace entries A and B with the widened commands, and add the `README.md` → **F. A teammate clones** row with disposition `change` and its owning task.

## Should Fix

1. **`task_3_plan.md` — the "nothing written" outcome is unspecified, and one Verification bullet has no test behind it.**
   - `PluginRootEntriesOutcome` is `'off' | 'appended' | 'no-root'`, and `pluginRootEntriesNote` keys on `'appended'`. *"report the outcome as nothing written"* does not say which value that is, or whether a fourth one is added. Name it.
   - The Verification bullet *"A render whose every plugin-root entry was filtered out carries no `THE PLUGIN-ROOT ENTRIES WERE WRITTEN` `_README` line"* has no `**Work:**` bullet adding a case that drives it. Add one: a plugin root containing a `FORBIDDEN_IN_ENTRY` character is the natural fixture. Otherwise drop the bullet.
2. **`task_4_plan.md` and `task_9_plan.md` — leftover "committed profile" wording.**
   - `PROFILE_PATHS_CHECK`'s doc comment says an `init --force` in a worktree *"regenerates the **committed** profile"*.
   - `docs/cli.md`'s `profile-paths` bullet says *"regenerate the committed profile against the worktree's own path"*.

   Both tasks edit exactly these passages. Name the rewording in their Work bullets so the new "gitignored" fact is not contradicted three sentences later.
3. **`task_2_plan.md`, Work bullet 2 — normalization is not stated for the check's comparison.** In `PLUGIN_PERMISSIONS_CHECK.run` the `roots` and `runtimeRoot` are both un-normalized, so `root === runtimeRoot` holds. In the generator the comparison is on normalized roots. Say so explicitly in the check's bullet, as the generator's bullet already does, so an implementer who normalizes one side does not silently drop the `Read` requirement.

## Nice to Have

1. Once `init` writes `.claude/settings.autonomous.json` into the managed block (Task 1), this repository's hand-added rule in the root `.gitignore` (*"Added by hand in this repository, not by init"*) duplicates it on the next `init` run. The plan could note that. Editing the root `.gitignore` is optional.
