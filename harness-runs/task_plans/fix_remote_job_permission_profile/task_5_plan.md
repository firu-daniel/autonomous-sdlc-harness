### Task 5 — Add the `profile-tracked` doctor check

**Goal:** Add a `doctor` check, id `profile-tracked`, that reports a permission profile committed to the repository — the state Run 1 was in, and the state every repository adopted before Task 1 is in — by name, with the fix, instead of leaving it to be inferred from `profile-paths`. It warns on a person's machine and **fails** under `doctor --remote-job`, so a job whose checkout carries a committed profile stops at the preflight with a `FAIL` naming the fix (task prompt → acceptance criterion two).

**Depends on:** Task 1, which adds `.claude/settings.autonomous.json` to the managed `.gitignore` block — the reason this state can now be called a leftover rather than the design, and the rule the remedy relies on once the file is untracked. Task 4, which added `readonly remoteJob: boolean` to `CheckContext` (set by `doctor --remote-job`, `false` otherwise) and made `profile-paths` fail under it when the profile covers no path here; this check reads `ctx.remoteJob` and calls `profileUntrackRemedy(ctx)` (the untrack route, below), and uses nothing else Task 4 added.

**Why a check of its own, when `profile-paths` already fails a foreign profile in the job.** The two answer different questions and need different remedies. `profile-paths` asks whether the profile's paths name this checkout; a profile committed from *this* machine passes it locally while still being carried into every clone and every job. And a committed profile can only be replaced in the job by untracking it — `init --force` would rewrite a tracked file, which the job's `Generate the job's permission profile` step refuses (`cli/templates/github/workflows/harness-run.yml` → *"changed tracked files"*). So the tracked state is named once, here, with the one remedy that works everywhere.

**The check's contract — restated by Tasks 8 and 9.**

- **Question:** is `.claude/settings.autonomous.json` (`PROFILE_PATH`, imported from `cli/src/generators/permissionProfile.ts`) carried by the tree `HEAD` names? Asked with `pathAtRef(repoRoot, 'HEAD', PROFILE_PATH)` from `cli/src/core/git.ts` — the existing read-only `git cat-file -e` probe; no new `git` invocation is added anywhere (`.claude/context/conventions.md` → the `core/git.ts` monopoly).
- **`pass`** when it is not, saying the profile is machine-local and ignored. **`warn`** when it is and `ctx.remoteJob` is false. **`fail`** when it is and `ctx.remoteJob` is true. Both non-pass messages name the remedy as three commands, in this order and spelling — the **untrack route**, taken from the helper `profileUntrackRemedy(ctx: CheckContext): string` that Task 4 added to `checks.ts` for `profile-paths` (call it; do not re-spell the commands), and restated byte-for-byte by Tasks 8 and 9:

  ```
  git rm --cached .claude/settings.autonomous.json
  git commit -m "Stop tracking the machine-local permission profile"
  git push --no-verify origin <defaultBranch>
  ```

  with `<defaultBranch>` substituted from `ctx.config.defaultBranch` when it is a non-empty string, and printed as the literal `<defaultBranch>` otherwise (the helper does this). The message says why, one sentence each — the first is this check's own, the rest come with the helper: the file carries this machine's absolute paths, and a remote job keeps a committed one rather than generating its own; the commit must land on the **default branch**, because every run's branch is cut from `origin/<defaultBranch>` (`cli/templates/scripts/create-worktree.sh` → `worktree add -b "$branch" "$worktree_dir" "origin/$default_branch"`), so an untrack pushed only to a run branch covers that one run and the next branch carries the profile again; and `--no-verify` skips the `pre-push` hook `init` installed, which refuses a push to `<defaultBranch>` — this push is yours to make on purpose, and the harness never makes it. That push command and its `--no-verify` reason are not the helper's own either: `profileUntrackRemedy` takes them from `defaultBranchPushCommand(branch)` and `defaultBranchPushReason(branch)` in `cli/src/core/defaultBranchPush.ts` (Task 4), the **single producer** of the default-branch setup push in `cli/src`, which `init.ts` → `reportGithubSteps` and `checks.ts` → `REMOTE_EXECUTION_CHECK` also consume after Task 11. This check imports nothing from that module directly and spells neither. A repository that lands its default branch only through pull requests may take the same commit through one instead; the message names the push, not the alternative, so that there is one route to restate.
- **`unevaluated`** when the repository root did not resolve, in the words the neighbouring checks use.
- **Order:** directly after `profile-paths` in `CHECKS`.

**Where this task stops.** It adds one check and its tests. It does not change `profile-paths` or `plugin-permissions` (Task 4), the workflow (Task 6) or any document (Tasks 8–10). In `checks.ts` it adds `PROFILE_TRACKED_CHECK` and its `CHECKS` row only.

### Targets

- `cli/src/doctor/checks.ts` — `PROFILE_TRACKED_CHECK` (new) and its `CHECKS` row. **Shared file:** Tasks 12, 2 and 4 edited it before.
- `cli/src/core/git.ts` → the doc comment on `pathAtRef`, which says its *"one caller"* is `doctor`'s `remote-execution` check — no longer true. Header only; the function is unchanged. **Shared file:** Task 12 added `mainWorktreeRoot` and its constant before; leave them as it left them. `profile-tracked` asks about `ctx.repoRoot` (the checkout `doctor` runs in), not the main checkout Task 12 reads the profile from.
- `cli/test/doctor.test.mjs` — the `profile-tracked` cases. **Shared file** with Tasks 12, 2 and 4.

**Work:**

- [ ] `checks.ts`: add `PROFILE_TRACKED_CHECK` per the contract above, with a doc comment stating the question, the three grades and why the job fails where a person's machine warns, and insert it after `PROFILE_PATHS_CHECK` in `CHECKS`. If the comment above `CHECKS` explains the order of the profile block, extend it.
- [ ] `cli/src/core/git.ts` → `pathAtRef`'s doc comment: name both callers and keep its `false`-on-every-failure discipline stated for each — for `profile-tracked`, a `HEAD` that does not resolve (a repository with no commit) reads as not tracked, which is correct: nothing is committed.
- [ ] `cli/test/doctor.test.mjs`: on throwaway fixtures, a profile committed at `HEAD` → `WARN profile-tracked` naming `git rm --cached`, exit status unmoved by it; the same with `--remote-job` → `FAIL profile-tracked` and exit 1; an ignored, untracked profile → `PASS`. In both non-pass cases assert the message carries `git push --no-verify origin <the fixture's defaultBranch>` and contains no `git push origin ` substring (the form the `pre-push` hook refuses). If any case in the suite pins the total number of checks or the summary counts, update it for the new row.

**Verification:**

- The new cases in `cli/test/doctor.test.mjs` pass.
- `commands.typecheck` passes.
- `PROFILE_TRACKED_CHECK`'s remedy text contains `git push --no-verify origin` and no `git push origin ` form.
- `grep -rn "no-verify origin" cli/src` still finds the spelling only in `cli/src/core/defaultBranchPush.ts`.
- `grep -n "profile-tracked" cli/src/doctor/checks.ts` shows the id once, in the check, and the check sits after `profile-paths` in `CHECKS`.

**Deviations from plan:**

- The `cli/test/doctor.test.mjs` case was written but not run: neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command, so the run is deferred to the Run gates phase (`unit_loop_core.md` → `## The test-run rule`, point 3). The bullet *"The new cases … pass"* rests instead on a throwaway scratch probe (`bash scripts/scratch-run.sh` over a `.mjs` under `harness-runs/scratch/`, deleted after) that drove the compiled CLI against a temp fixture and observed: fresh `init` → `PASS profile-tracked`, exit 0; profile force-added and committed → `WARN profile-tracked` naming `git rm --cached .claude/settings.autonomous.json` and `git push --no-verify origin master`, exit 0; same under `--remote-job` → `FAIL profile-tracked`, exit 1.
- The three grades live in one subtest inside the `doctor --remote-job` block rather than three cases, so the job-shaped fixture (plugin Read grant and directory present) proves the `--remote-job` exit 1 comes from `profile-tracked` alone.
