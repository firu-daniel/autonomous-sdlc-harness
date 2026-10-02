### 2. Give GitHub's pull-request setting name and path one owner in `remote/githubActions.ts`

**Severity:** Must Fix

**Sites:**
- `cli/src/commands/init.ts` → `reportGithubSteps`, the new pull-request step containing `"Allow GitHub Actions to create and approve pull requests" is switched on under Settings -> Actions -> General -> Workflow permissions` (around line 2640, navigation hint only).
- `cli/src/doctor/checks.ts` → `REMOTE_GITHUB_CHECK`, the new block that declares `const settingName = 'Allow GitHub Actions to create and approve pull requests';`, and its warning that contains `turn it on under Settings → Actions → General → Workflow permissions` (around line 2762, navigation hint only).

**Problem.** Two `cli/src` areas, `commands/` and `doctor/`, each spell GitHub's *Allow GitHub Actions to create and approve pull requests* setting and the settings path that reaches it. The copies have already drifted. `init` prints `Settings -> Actions -> General -> Workflow permissions`, while `doctor` prints `Settings → Actions → General → Workflow permissions`, so an adopter reads two spellings of one path from one CLI.

Three written rules cover this:
- `.claude/context/conventions.md` → `## Shared code, and where it lives`: *"A value or behaviour two `cli/src` areas need lives there, never duplicated into both."*
- `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one."*
- `cli/src/remote/githubActions.ts` already owns the GitHub-side names that `init` and `doctor` share. Its header rule is *"every remote-execution name has one owner, and a copy anywhere else in `cli/src` imports it,"* and the module was widened on this branch to hold the run-control names.

The `doctor` block's own doc comment says that a value local to `doctor` stays local only when no other file spells it (`ARTIFACT_RETENTION_ENDPOINT`, *"Local, not a `remote/githubActions.ts` export: … no shell or YAML file spells this endpoint"*). This setting name is spelled in `init` as well, so that reasoning does not apply.

**Fix.**
1. In `cli/src/remote/githubActions.ts`, next to `GIT_TOKEN_SECRET`, export two constants, each with a one-line doc comment:
   ```ts
   /** GitHub's repository setting that lets a workflow's own token open a pull request; off by default. */
   export const PR_CREATE_SETTING = 'Allow GitHub Actions to create and approve pull requests';
   /** Where an adopter finds {@link PR_CREATE_SETTING} in the repository's settings. */
   export const PR_CREATE_SETTING_PATH = 'Settings -> Actions -> General -> Workflow permissions';
   ```
   Pick one arrow spelling for the path. The ASCII `->` follows `.claude/context/conventions.md` → `## Output, logging and errors` (*"plain ASCII"*). Update the module header's list of run-control names to include both.
2. In `cli/src/commands/init.ts`, import both into the existing `../remote/githubActions.js` import. In `reportGithubSteps`, build the pull-request step's sentence from `${PR_CREATE_SETTING}` and `${PR_CREATE_SETTING_PATH}`, keeping the quotation marks around the setting name.
3. In `cli/src/doctor/checks.ts`, import both into the existing `../remote/githubActions.js` import. Delete the local `const settingName = …` and use `PR_CREATE_SETTING` wherever `settingName` was used. In the warning, replace the literal `Settings → Actions → General → Workflow permissions` with `${PR_CREATE_SETTING_PATH}`.
4. Run `commands.typecheck`. If a test in a file this unit edits asserts the old `→` spelling of the path, update that assertion and run that file only.
