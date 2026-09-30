### Task 2 — Ignore the two workflow `.bak` files and the permission profile's `.bak` in the managed `.gitignore` block

**Goal:** Add three ignore rules to the managed `.gitignore` block, so `git add -A` or `git add .github` can never stage the copies the upgrade and `--force` take:

- `.github/workflows/harness-run.yml.bak`
- `.github/workflows/harness-resume.yml.bak`
- `.claude/settings.autonomous.json.bak`

Every other `--force` `.bak` stays visible, and `cli/src/generators/repoRoot.ts` → choice 4 is rewritten to say where that line is drawn and why.

**Where this task stops.** This task adds the rules and nothing else. The upgrade's printed report is **Task 3's**. That task swaps the report's `Do not commit the .bak files.` for a sentence saying the files are ignored, and names `.gitignore` in its `git add` line whenever a run merges these new lines into an existing block. That happens on the first upgrade after this release, and it is why Task 3 depends on this one. The documents describing the block (`docs/cli.md` → `## 3.`, `docs/remote-execution.md` → `### Upgrading`) are **Tasks 5 and 6**'s.

### Targets

- `cli/templates/repo/gitignore`: one new comment and one new token, placed right after the `/{{configBackupFile}}` group.
- `cli/src/generators/repoRoot.ts`: the value for the new token, and header choice 4.
- `cli/src/remote/githubActions.ts`: the module header only, amended to name `repoRoot.ts` as its one ungated consumer. No constant changes.
- `cli/test/init.test.mjs`: a new case asserting what is and is not ignored.

**Work:**

- [ ] `gitignore` template: after the `/{{configBackupFile}}` line, add a comment group and a `{{harnessBackups}}` token. The comment says:
  - these are the copies `init --upgrade-workflows` and `init --force` take of the two remote-execution workflows and of the permission profile;
  - the upgrade's report names each workflow copy in a diff command, and the profile copy carries this machine's absolute paths just as the profile does;
  - every other `.bak` a forced run writes is left visible on purpose.

  Write plain `-` hyphens in the comment, as the rest of the template does.
- [ ] `repoRoot.ts` → `writeRepoRootFiles`: render `harnessBackups` as three lines joined with `\n`, following the `runControlArtifacts` precedent (one token carrying several rules):
  - `${WORKFLOW_RUN_PATH}.bak` and `${WORKFLOW_RESUME_PATH}.bak`, imported from `../remote/githubActions.js`, which owns both names;
  - `${PROFILE_PATH}.bak`, where `PROFILE_PATH` is already imported.

  **Ungated**, like the profile rule ("Ungated: the profile is machine-specific whatever `execution.target` says"). A rule gated on `remoteExecutionApplies` would change `.gitignore` in the same run that turns remote execution on, and the first-setup block's `git add` names only the workflows. Write no leading slash: each path has a separator in the middle, so git already reads it relative to the `.gitignore` it sits in, as for the existing `.claude/settings.autonomous.json` rule. The config backup needs its `/` only because its name has no separator.
- [ ] `repoRoot.ts` header, choice 4: rewrite the `.bak` half to state the new line, keeping the existing reasoning about bare `*.bak` and the append-only block.
  - Ignored: the configuration's `.bak` (as before), the two workflow `.bak` files and the profile's `.bak`, each by exact path.
  - Why the workflows: the upgrade is the routine route on every release, and its own report names each copy, so `git status` visibility adds nothing.
  - Why the profile: its copy carries the same machine paths as the file.
  - Every other forced `.bak` stays visible for the reason the choice already gives.
  - Why no glob such as `.github/workflows/*.yml.bak`: the block covers only files a harness command creates, and a glob would claim the adopter's own workflow backups.
- [ ] `githubActions.ts` module header, in the same task as the import above (`.claude/context/cli.md` → `## What "done" means here`: a change either satisfies its module's header or amends it in the same edit). The header now says the constants are read by "the generator that writes the workflows and the `doctor` checks", and that "every consumer tests that switch first". Amend both statements:
  - Name the third consumer, `generators/repoRoot.ts`, which spells the two workflow `.bak` ignore rules whatever `execution.target` says.
  - Scope the "Nothing here is consulted unless … `remoteExecutionApplies(config)` is true: every consumer tests that switch first" sentence so it excludes that one consumer. Give the reason in one clause: a gated rule would change `.gitignore` in the same run that turns remote execution on.
  - Leave every exported constant and the rest of the header unchanged.
- [ ] `init.test.mjs`: add a case beside the upgrade suite (`'init --upgrade-workflows re-pins an older workflow after a .bak, and nothing else does'`), or inside it, using `agedWorkflowFixture` and the `ignoredAmong` helper from `helpers/fixture.mjs`.
  - After `initOk(dir, [UPGRADE_WORKFLOWS])`, both workflow `.bak` paths are in `ignoredAmong`'s answer.
  - A planted `.github/workflows/ci.yml.bak` and a planted `.claude/CLAUDE.md.bak` are not.
  - After `initOk(dir, ['--force'])`, `.claude/settings.autonomous.json.bak` is ignored.
  - A further plain `initOk` leaves `.gitignore` byte-identical. Idempotence of the merged block is the accompanying assertion the conventions table requires of a generated artifact.

**Verification:**

- Run the edited `cli/test/init.test.mjs` under `unit_loop_core.md` → `## The test-run rule` (3). The new case passes. The existing idempotence cases (`'a second init changes nothing, …'`) still pass with the three new lines in the block.
- Read the rendered block in the test fixture's `.gitignore`. The three lines sit under their own comment, carry no leading `/`, and no line in the block is a bare `*.bak`.
- Grep `cli/src/generators/repoRoot.ts` for the literal `harness-run.yml`. There is no hit, because the names come from `remote/githubActions.ts`, which owns them.
- Read the amended `cli/src/remote/githubActions.ts` header. Its consumer list names `generators/repoRoot.ts`, and its gating sentence names the `repoRoot.ts` exception with its one-clause reason, so no sentence in the header still promises that every consumer tests `remoteExecutionApplies` first.
