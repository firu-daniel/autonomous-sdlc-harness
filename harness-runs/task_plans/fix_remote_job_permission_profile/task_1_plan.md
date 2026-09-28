### Task 1 — Ignore the permission profile in the managed `.gitignore` block

**Goal:** Make `init` write an ignore rule for `.claude/settings.autonomous.json` into the managed `.gitignore` block for **every** adopter, so a profile carrying one checkout's absolute paths is never committed by default and a remote job's create-if-absent `init` never finds another machine's profile in its checkout (task prompt → `## What is wrong`, finding 2).

**Why every adopter and not only `execution.target: github-actions`.** The profile is machine-specific by construction, the watcher reads it from the main checkout and never from a worktree (`cli/templates/scripts/autonomous-watcher.sh` → `SETTINGS_PROFILE="$MAIN_REPO/.claude/settings.autonomous.json"`), so no run needs it committed — which is exactly why this repository already ignores it by hand (root `.gitignore` → the comment opening `# Added by hand in this repository, not by init`). A rule gated on the execution target would leave a local-only adopter committing a file that is wrong on every other clone, and would let an adopter who switches to remote later carry a committed profile into the job.

**Depends on:** Task 12, which ships first and makes `doctor` in a linked worktree read the profile from the main checkout (`mainWorktreeRoot(repoRoot) ?? repoRoot`, `cli/src/core/git.ts`). Once this task's rule lands, `init`'s first commit (`cli/src/core/git.ts` → `commitAll`, `git add -A`) no longer carries the profile, so no `git worktree add` checkout has one; without Task 12, `doctor` in every worktree would `FAIL permission-profile` and `cli/test/doctor.test.mjs`'s sibling-worktree case would throw. With it, a worktree grades the main checkout's profile — the one the watcher loads — and passes. This task edits neither file.

**Where this task stops.** It changes only the ignore block. `init`'s closing note that still says the profile "is committed" lives in `cli/src/generators/permissionProfile.ts` → `writePermissionProfile` and is **Task 3's** to rewrite; the `doctor` check that catches a profile an earlier release already committed (a new ignore rule does not untrack a tracked file) is **Task 5's**. This task does not edit `permissionProfile.ts` beyond importing its existing `PROFILE_PATH` export.

### Targets

- `cli/templates/repo/gitignore` — the new rule and its comment, and the corrected comment above `.claude/settings.local.json`.
- `cli/src/generators/repoRoot.ts` → `writeRepoRootFiles` — the value for the new token.
- `cli/test/init.test.mjs` — a case asserting the rule lands and takes effect. **Shared file:** this task adds one case; Tasks 2 and 3 edit other cases later and nothing this one adds.

**Work:**

- [ ] `cli/templates/repo/gitignore`: add a `{{permissionProfilePath}}` line next to `.claude/settings.local.json`, under a comment stating why the file is machine-local (it names this checkout's absolute paths, the watcher and `doctor` read it from the main checkout only — a linked worktree carries none — and a remote job generates its own), and that a copy an earlier release committed stays tracked until it is untracked by hand — `doctor` reports that state. Correct the existing comment `# The per-machine settings file the agent runner writes beside the committed profiles.`, which is false once the profile is ignored.
- [ ] `cli/src/generators/repoRoot.ts` → `writeRepoRootFiles`: pass `permissionProfilePath` into the `render(TEMPLATES.gitignore, { … })` call from `PROFILE_PATH`, imported from `./permissionProfile.js` beside the two fragment paths already imported from there — never retyped as a literal (`.claude/context/conventions.md` → `## Configuration is the source of truth…`, the shared-constants paragraph). Check whether the module header or `GITIGNORE_BLOCK_HEADER`'s doc enumerates the block's rules, and extend it if it does.
- [ ] `cli/test/init.test.mjs`: one case — after `init` on a throwaway fixture, the managed block carries `.claude/settings.autonomous.json`, git reports the profile ignored (the existing `ignoredAmong` helper in `cli/test/helpers/fixture.mjs`), and a second `init` changes nothing in `.gitignore` (the idempotence assertion `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` requires of a written artifact).

**Verification:**

- The new case in `cli/test/init.test.mjs` passes.
- `commands.typecheck` passes.
- `cli/test/doctor.test.mjs` is not run by this task (it does not edit it — `unit_loop_core.md` → `## The test-run rule`); its sibling-worktree case was made independent of a committed profile by Task 12, which is what lets this task ship without breaking it.
- The rendered `.gitignore` of a fixture `init` wrote carries exactly one `.claude/settings.autonomous.json` line inside the managed block, and no line naming the profile as committed remains in `cli/templates/repo/gitignore`.

**Deviations from plan:**

- Verification bullet "The new case in `cli/test/init.test.mjs` passes" was not executed: neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command, so the case was not run in this unit and its pass is deferred to the Run gates phase. The same applies to the rendered-fixture bullet (exactly one profile line inside the managed block), which the new case asserts. What was executed: `bash scripts/typecheck.sh` (PASS), and a grep of `cli/templates/repo/gitignore` for `committed profile` / `profiles` (no match).
- The module header of `cli/src/generators/repoRoot.ts` characterised the block as covering only files "the harness configures by path"; extended to name the generated permission profile too. `GITIGNORE_BLOCK_HEADER`'s doc enumerates no rules and was left unchanged.
