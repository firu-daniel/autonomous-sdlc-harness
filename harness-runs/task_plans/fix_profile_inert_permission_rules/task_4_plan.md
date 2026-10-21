### Task 4 — Restate the wrapper forms in `cli/scripts/README.md` and the QA profile fragment

**Goal:** Make two more `cli`-layer texts that say *"three forms"* describe what is now generated. Both are reached by the story index's scope-register entry B.

**Depends on:** Task 3. It leaves the base profile with two forms per script: the repo-relative invocation `bash <scriptsDir>/<file>` and the main-checkout absolute path `bash <repoRoot>/<scriptsDir>/<file>`. Task 1 has the watcher's per-run copy add the run copy's exact `bash <copy>/<scriptsDir>/<file>` twin. This task only states those forms.

### Targets

- `cli/scripts/README.md`: the bullet **Coverage is a row, not a mechanism.**
- `cli/templates/claude/settings.autonomous.qa.json`: the `_README` line beginning *"THE PORT PROBE IS ALLOW-LISTED AS A COMMAND PREFIX"*.

**Work:**

- [ ] `cli/scripts/README.md`: the *"three literal forms the profile generator already builds and tests — the repo-relative invocation, its repo-root-absolute twin and its sibling-worktree twin"* becomes the two forms the generator builds, plus the run copy's exact twin the run watcher's per-run copy adds. Keep the rest of the bullet, including the directory-prefix point and its `docs/development.md` §3 citation, unchanged.
- [ ] `settings.autonomous.qa.json`: *"listed there in all three forms a caller may use"* becomes *"listed there in every form a caller may use"*. That wording stays true whichever profile carries which form. Leave the rest of the line byte-identical.

**Verification:**

- Run `git grep -nE 'three (literal )?forms' -- cli/scripts/README.md cli/templates/claude/settings.autonomous.qa.json`. It returns nothing.
- `jq . cli/templates/claude/settings.autonomous.qa.json` exits 0, so the fragment still parses. The merged profile is exercised by Task 3's `profile.test.mjs` QA case. This task runs no test file.
