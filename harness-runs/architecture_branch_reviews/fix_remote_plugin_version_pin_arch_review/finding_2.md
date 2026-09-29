### 2. Give the `npx autonomous-sdlc-harness@<version>` prefix one producer in doctor's version warning

**Severity:** Should Fix. **Layer:** cli.

**Sites.**

- `cli/src/generators/githubWorkflows.ts` → `upgradeWorkflowsCommand`, which builds its prefix as `` `npx ${ownManifestString('name')}@${version} …` `` (around line 60).
- `cli/src/doctor/checks.ts` → `REMOTE_EXECUTION_CHECK`, the warning that contains `` `${upgradeWorkflowsCommand(version)}` `` and `` `${CLI}@${pins[0]} doctor` `` (around line 2451). `CLI` there is the module-local `const CLI = 'npx autonomous-sdlc-harness';` (around line 247).

**Problem.** This one warning prints two commands that begin with the same `npx autonomous-sdlc-harness@<version>` prefix, and the prefix comes from two producers: the package manifest's `name`, read in `upgradeWorkflowsCommand`, and the hardcoded literal `CLI` in `checks.ts`. `.claude/context/cli.md` → *"One string, one producer"* and `.claude/context/conventions.md` → *"A responsibility that already has a home does not get a second one"* both treat that as a drift point: if the package is renamed, the two commands in one message would disagree. The duplicate `CLI` literal in `init.ts` and `checks.ts` existed before this branch. This branch adds a third producer of the same prefix, built a different way.

**Fix.** In `cli/src/doctor/checks.ts`, build the "stay on the pin" command from the same source as the upgrade command. The simplest form: export from `cli/src/generators/githubWorkflows.ts` a helper next to `upgradeWorkflowsCommand`, `pinnedCliCommand(version: string): string`, returning `` `npx ${ownManifestString('name')}@${version}` ``. Have `upgradeWorkflowsCommand` return `` `${pinnedCliCommand(version)} init ${UPGRADE_WORKFLOWS_FLAG}` ``, and make the doctor warning print `` `${pinnedCliCommand(pins[0])} doctor` `` instead of `` `${CLI}@${pins[0]} doctor` ``. Leave the pre-existing `CLI` constants alone: unifying them is outside this branch. The message text does not change for the current package name, so existing assertions still hold.
