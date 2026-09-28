# Task plan review — iteration 3

The Must Fix from iteration 2 is resolved. The untrack route is now one route, spelled the same way everywhere, and it has one producer:

- `profileUntrackRemedy` (Task 4) builds it from `cli/src/core/defaultBranchPush.ts`.
- Task 5 calls that helper.
- Tasks 8 and 9 restate it byte for byte, and Tasks 4 and 5 each assert that the refused bare `git push origin ` form is absent.

I re-ran derivation entries A, B and C verbatim:

- Entry A lists 13 files and entry B lists 4. Each file is a row.
- Entry C reaches the four `feat_remote_execution_github_actions` rules (rows 17–20).

So the closure invariant holds.

These all check out:

- Index structure.
- 1:1 correspondence between the index and the task files (12 entries, 12 files).
- Single-layer tags.
- Points (all ≤ 20) and Work-bullet counts (all ≤ 5).
- Bottom-up order, with Task 12 first, Task 11 ninth and `general` last.
- The test-run rule.

Every cited code anchor resolves in the tree, including these:

- `create-worktree.sh` → `worktree add -b "$branch" "$worktree_dir" "origin/$default_branch"`
- `hr_main_repo`
- `pathAtRef`'s "one caller"
- `GIT_WORKTREE_LIST_ARGS`
- `pluginRuntimeRoot`'s fallback
- `reportGithubSteps`
- the `REMOTE_EXECUTION_CHECK` warning
- the `projectSettings.ts` note
- the §7 step 3 blocks

The finding below is new.

## Must Fix

1. **`task_9_plan.md`: `docs/cli.md` gets the three untrack commands inside bullets, with no fenced block, which repeats a ledger lesson.**
   Two Work bullets put the untrack commands into bullet prose:
   - Work bullet 3 (the `profile-paths` bullet): *"Where the bullet names the job's remedy, name the untrack route by its three commands as under **Depends on**"*.
   - The same bullet, for the new `profile-tracked` bullet: *"its remedy the same three commands spelled exactly as `profileUntrackRemedy` prints them"*.

   Nothing in the task asks for a fenced block, and none of its Verification bullets checks for one. So an implementer following it writes three commands an adopter must run inline in a `docs/cli.md` bullet paragraph.

   `harness-runs/lessons.md` → `## Adopter-facing documentation` says: *"Every command an adopter is meant to run sits in a fenced block, one command per line; never inline it, join two with prose, or cut its block when compacting a document."* `docs/cli.md` is adopter-facing and already follows this: its other runnable commands are fenced, e.g. the `npx autonomous-sdlc-harness doctor --check-github` block closing §7 and the `npx autonomous-sdlc-harness init` block ending §4.

   Tasks 8 and 10 both carry the requirement for the same commands in their own documents, and each cites the ledger. Task 9 is the one task that writes this sequence without it.

   **Fix:** in `task_9_plan.md`:
   - In Work bullet 3, state that wherever `docs/cli.md` gives the untrack route (the `profile-paths` bullet's job remedy and the new `profile-tracked` bullet), it appears as fenced blocks, one command per line: `git rm --cached .claude/settings.autonomous.json`, then `git commit -m "Stop tracking the machine-local permission profile"`, then `git push --no-verify origin <default branch>`. Cite the ledger line.
   - A bullet may name the route by reference to one fenced occurrence rather than repeat it, but no bullet carries the commands inline.
   - The `| Check | Asks |` table row names no command.
   - Add a Verification bullet: every untrack command in `docs/cli.md` sits in its own fenced block, one per line, and none appears inline in bullet prose.

## Should Fix

1. **`task_11_plan.md` → `**Ship order.**` still says *"it ships **eighth**"*.** This was raised in iteration 2 and is unaddressed. The story index puts it ninth (readiness entry 9), and so does its own Context (*"**Task 11** ships **ninth**"*). Change it to *ninth*.
2. **`task_11_plan.md`, Verification bullet 3 cannot pass as written.** This was raised in iterations 1 and 2 and is unaddressed. The bullet expects `grep -n "git push origin" cli/src/doctor/checks.ts` to return *"only `base-freshness` and `remote`-check lines"*. It also returns `JJ_REPOSITORY_CHECK`'s doc comment and its warn message, which both quote *"the identical refusal `git push origin <protected>` draws"*. Keep only the part that carries weight: no hit inside `REMOTE_EXECUTION_CHECK`.
3. **`task_3_plan.md`: the "nothing written" outcome is still unspecified.** This was raised in iterations 0, 1 and 2, is unaddressed, and is not recorded as rejected. `PluginRootEntriesOutcome` is `'off' | 'appended' | 'no-root'`, and `pluginRootEntriesNote` keys on `'appended'`.
   - Say which value a render reports when every entry was filtered out by `FORBIDDEN_IN_ENTRY`, or add a fourth value.
   - Say whether such a root still goes into `permissions.additionalDirectories`.
   - Fold a test case for the last Verification bullet into the existing test bullet.

## Nice to Have

1. `cli/test/doctor.test.mjs` → the doc comment on `pluginEntries` (*"**no read grant**: reads under the install root were measured to succeed under a profile naming no rule over it"*) becomes stale for the coinciding-root cases Task 2 rewrites. So does `cli/test/init.test.mjs` → the `PLUGIN_PERMISSIONS_GRADED` usage comment that cites the *not graded* pass. Task 2 edits both files and could reword both comments in the same edit.
