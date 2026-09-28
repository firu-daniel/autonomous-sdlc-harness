### Task 4 — Add `doctor --remote-job`, under which an unusable profile fails the preflight

**Goal:** Give `doctor` an option of its own, `--remote-job`, that the remote job's `Preflight with doctor` step passes (Task 6), under which a profile that cannot work on the runner is a **`fail`** — so `doctor` exits 1 and the job stops before it spends a session — instead of the warnings that let Run 1 launch and park (task prompt → `## What is wrong`, findings 3 and 4; acceptance criteria two and three).

**Depends on:** Task 2, which made `pluginRootEntries(root, { isRuntimeRoot, helpers })` return a `Read` entry at the runtime root iff `isRuntimeRoot`, then one helper entry per name, and removed `plugin-permissions`' *not graded* disposition. Task 3, which exports `pluginRootDirectories(roots: readonly string[]): readonly string[]` from `cli/src/generators/permissionProfile.ts` — every root normalized and de-duplicated — and makes `init --plugin-root-entries` write each of those into `permissions.additionalDirectories`. This task grades exactly that list and computes it only through that function.

Also on **Task 12**, which made `buildCheckContext` read the profile from `mainWorktreeRoot(repoRoot) ?? repoRoot` (`cli/src/core/git.ts`) — the main checkout's profile when `doctor` runs in a linked worktree, since a worktree carries none once Task 1 ignores it — while `ctx.repoRoot` stays the checkout `doctor` runs in, and rewrote `PROFILE_PATHS_CHECK`'s worktree paragraph accordingly. Keep that resolution as Task 12 left it when adding the fourth parameter. The job's checkout is a main checkout, never a linked worktree, so under `--remote-job` the profile graded is always the job checkout's own; the `fail` arms below never fire because a worktree was graded against a profile it does not carry.

**Why a flag and not an environment probe.** The job sets `HARNESS_JOB_MODE=1` for the whole job, but no `cli/src` module owns that name today, and a grade that flips on an inherited environment variable is one an operator can trip by accident in their own shell. An explicit option is what the job states and what a test can pass, and it follows `doctor`'s existing own-option pattern (`cli/src/commands/doctor.ts` → `OWN_FLAGS`).

**What `--remote-job` changes, exactly — the contract Tasks 6, 8 and 9 cite.**

- **`profile-paths`** → `fail` instead of `warn` when no path or pattern covers the repository root. The message names the job's cause — the profile was generated elsewhere and the job's create-if-absent `init` kept it — and the remedy, the **untrack route**, so the job generates its own. It does **not** print the local remedy `init --force` under the flag: in a job that rewrites a tracked file and the step that runs `init` refuses it.
- **The untrack route — defined here, reused by Task 5, restated by Tasks 8 and 9.** A module-private helper in `checks.ts`, `profileUntrackRemedy(ctx: CheckContext): string`, returns the three commands, in this order and spelling:

  ```
  git rm --cached .claude/settings.autonomous.json
  git commit -m "Stop tracking the machine-local permission profile"
  git push --no-verify origin <defaultBranch>
  ```

  with `<defaultBranch>` substituted from `ctx.config.defaultBranch` when it is a non-empty string and printed as the literal `<defaultBranch>` otherwise, each command in backticks and joined as the neighbouring remedies join theirs, followed by the reasons, one sentence each: the commit must land on the **default branch**, because every run's branch is cut from `origin/<defaultBranch>` (`cli/templates/scripts/create-worktree.sh` → `worktree add -b "$branch" "$worktree_dir" "origin/$default_branch"`), so an untrack pushed only to a run branch covers that one run and the next branch carries the profile again; and the `--no-verify` reason. **The helper spells neither the push nor its `--no-verify` reason itself:** it takes the third command from `defaultBranchPushCommand(branch)` and that reason from `defaultBranchPushReason(branch)`, both from the new core module below, passing the same substituted-or-literal `<defaultBranch>` value to each. No `git push origin ` form without `--no-verify` appears in it.
- **The setup push has one owner — `cli/src/core/defaultBranchPush.ts` (new).** The push to the default branch that the adopter makes on purpose is printed by two `cli/src` areas — `doctor/` here and in Task 5, `commands/` in Task 11 — so it lives in `cli/src/core/` and every printer imports it (`.claude/context/conventions.md` → `## Shared code, and where it lives`; `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"*). This task creates the module with exactly two exports, and **Task 11 adds the `workflow`-scope pair to it**:

  ```ts
  export function defaultBranchPushCommand(branch: string): string
  // returns `git push --no-verify origin ${branch}` — no backticks, no trailing punctuation
  export function defaultBranchPushReason(branch: string): string
  // returns one sentence: `--no-verify` skips the `pre-push` hook `init` installed, which refuses a push to `${branch}`; this push is yours to make on purpose, and the harness never makes it.
  ```

  Its module header states what it owns and, in the words *"The rule this module exists to enforce"* (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, the `cli/src/` module row), the rule: the spelling of the default-branch setup push and the reason it skips the hook live here and nowhere else in `cli/src`, so `init`'s note and `doctor`'s remedies cannot drift apart. It imports nothing from above `core/` and invokes no `git` (it only spells a command for a person to run).
- **`plugin-permissions`** → `fail` instead of `warn` when any required `permissions.allow` entry is missing; `fail` when **no** plugin root resolves (the job installed the plugin one step earlier, so no record is itself the fault); and, under the flag only, each directory `pluginRootDirectories(<the graded roots>)` returns is **required** in `permissions.additionalDirectories`, a missing one being a `fail` that prints the directory to add. The pass text under the flag says the shell-readable grant was graded too.
- **Without the flag nothing changes** from what Task 2 left: both checks keep their warnings and `additionalDirectories` is not graded, because on a person's machine a missing shell grant has not been observed to stall a run and a version-carrying directory would go stale at every upgrade.

**Where this task stops.** It does not add the `profile-tracked` check (**Task 5**, which reads the `remoteJob` field this task adds), edit the workflow (**Task 6**) or any document (**Tasks 8–10**). In `checks.ts` it edits `CheckContext`, `buildCheckContext`, `PROFILE_PATHS_CHECK` and `PLUGIN_PERMISSIONS_CHECK`, and adds `profileUntrackRemedy`, only. It creates `cli/src/core/defaultBranchPush.ts` with the push pair only; the `gh auth refresh -s workflow` pair and the switch of `init.ts` → `reportGithubSteps` and `checks.ts` → `REMOTE_EXECUTION_CHECK` onto the module are **Task 11's**.

### Targets

- `cli/src/core/defaultBranchPush.ts` (new) — `defaultBranchPushCommand`, `defaultBranchPushReason` and the module header. **Shared file:** Task 11 extends it after.
- `cli/src/commands/doctor.ts` — the `--remote-job` option.
- `cli/src/doctor/checks.ts` — `CheckContext.remoteJob`, `buildCheckContext`, `PROFILE_PATHS_CHECK`, `PLUGIN_PERMISSIONS_CHECK`, `profileUntrackRemedy` (new). **Shared file:** Tasks 12 and 2 edited it before; Task 5 edits it after.
- `cli/test/doctor.test.mjs` — the `--remote-job` cases. **Shared file** with Tasks 12, 2 and 5.

**Work:**

- [ ] Thread the option: in `cli/src/commands/doctor.ts` declare `const REMOTE_JOB_FLAG = '--remote-job'` with a doc comment in the style of `CHECK_GITHUB_FLAG`'s; add it to `OWN_FLAGS`, to `DoctorOptions` as `readonly remoteJob: boolean`, to `parseOptions`, and to `DOCTOR_USAGE` (one option line plus a short paragraph: what it turns into failures, that the remote workflow passes it, and that it reaches no network); pass it to `buildCheckContext`, and amend the module header where it enumerates the flags. In `cli/src/doctor/checks.ts` add `readonly remoteJob: boolean` to `CheckContext` and a fourth parameter `remoteJob = false` to `buildCheckContext(cwd, probeRegistry, probeGithub, remoteJob)`, documented beside the other two.
- [ ] Create `cli/src/core/defaultBranchPush.ts` with its header and the two exports, per the contract above.
- [ ] `checks.ts` → `PROFILE_PATHS_CHECK`: add `profileUntrackRemedy` — importing `defaultBranchPushCommand` and `defaultBranchPushReason` from `../core/defaultBranchPush.js` for its third command and its `--no-verify` reason — with a doc comment carrying the default-branch reason, naming the core module as the owner of the push, and naming `PROFILE_TRACKED_CHECK` (Task 5) as its second caller, then the `fail` arm under `ctx.remoteJob` per the contract above, its remedy taken from that helper; extend its doc comment, whose *"A `warn`, because the fix is a re-run"* stops being the whole story. Leave its worktree paragraph as Task 12 rewrote it.
- [ ] `checks.ts` → `PLUGIN_PERMISSIONS_CHECK`: the three `ctx.remoteJob` arms per the contract above, with `additionalDirectories` read through the same pure read of the profile the check already uses for `allow` and the required list from `pluginRootDirectories`. Amend the doc comment's *"**It never fails**"* paragraph to *"It never fails outside `--remote-job`"* and state why the job differs: the plugin was installed and the profile generated moments earlier on a machine that exists for one run, so a gap is a launch that parks rather than an operator's paste.
- [ ] `cli/test/doctor.test.mjs`: cases driving `doctor --remote-job` against throwaway fixtures — a profile rendered for another root → `FAIL profile-paths` and exit 1, naming `git rm --cached` and `git push --no-verify origin <the fixture's defaultBranch>`, and containing no `git push origin ` substring; a GitHub-sourced plugin record (the helper Task 2 added) with `phases.qa` off and a profile lacking the `Read` → `FAIL plugin-permissions` naming the `Read` line, exit 1; the same profile carrying the `Read` but not the root in `additionalDirectories` → `FAIL` naming the directory; both present → `PASS`; no plugin record → `FAIL`; and the same fixtures **without** the flag keep their `WARN`s and exit 0. An unknown-option refusal case, if the suite has one, lists `--remote-job`.

**Verification:**

- The new cases in `cli/test/doctor.test.mjs` pass.
- `commands.typecheck` passes.
- `doctor --remote-job` on the runner-shaped fixture (GitHub-sourced record, `phases.qa` off, no `Read`) exits 1 with `FAIL plugin-permissions` naming the missing `Read` line — the prompt's third acceptance criterion, and the exact state Run 1's preflight passed with `exit 0`.
- `doctor --help` lists `--remote-job`.
- `profileUntrackRemedy`'s text contains `git push --no-verify origin` and no `git push origin ` form.
- `grep -rn "no-verify origin" cli/src` finds the spelling only in `cli/src/core/defaultBranchPush.ts` — not in `cli/src/doctor/checks.ts`.

**Deviations from plan:**

- The `cli/test/doctor.test.mjs` cases were written but not run: neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command, so the run is deferred to the Run gates phase (`unit_loop_core.md` → `## The test-run rule`, point 3). The verification bullets *"The new cases … pass"* therefore rest on a throwaway scratch probe instead (`bash scripts/scratch-run.sh` over a `.mjs` under `harness-runs/scratch/`, deleted after), which drove the compiled CLI against temp fixtures and observed: runner shape without `Read` → `FAIL plugin-permissions` naming the `Read` line, exit 1 (default run: `WARN`, exit 0); `Read` without the root in `additionalDirectories` → `FAIL` printing the directory, exit 1; both present → `PASS` whose text names `additionalDirectories`, exit 0; profile moved → `FAIL profile-paths`, exit 1; no plugin record → `FAIL`, exit 1; `doctor --help` lists `--remote-job`; the unknown-option refusal lists it.
- Under `--remote-job`, a profile missing both an `allow` entry and a plugin-root directory prints the directories in the same `FAIL`, after the `allow` blocks under a `permissions.additionalDirectories:` heading, rather than reporting only the `allow` gap first — so one preflight names every line the job's profile lacks.
