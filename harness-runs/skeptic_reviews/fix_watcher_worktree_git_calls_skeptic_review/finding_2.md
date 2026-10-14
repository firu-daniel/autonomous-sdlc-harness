### 2. The job-mode watchdog takes its merge base from the GitHub default branch rather than `defaultBranch`, so an honest stalled job is given up

**File:**
- `cli/src/doctor/checks.ts` → `JOB_SURFACES_CHECK`, at `const baseRef = commit ?? `refs/remotes/origin/${defaultBranch}`;`
- `cli/templates/github/workflows/harness-run.yml` → the step `Record the default branch's commit`, at `refs/remotes/origin/$HARNESS_GITHUB_DEFAULT_BRANCH^{commit}`
- `cli/templates/scripts/autonomous-watcher.sh` → `stall_job_surfaces_ok`, at `--job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH@$HARNESS_GITHUB_DEFAULT_COMMIT"`

**The problem.** The job-start step and the job-mode watchdog take different merge bases.

- **The job-start step** runs `doctor --job-surfaces=<GitHub default branch>`. It reads the trusted configuration from the GitHub default branch, then takes the merge base with `refs/remotes/origin/<defaultBranch>`, the **configured** integration branch. That is correct: `create-worktree.sh` cuts a run's branch from `defaultBranch`.
- **The watchdog** runs the `@<commit>` form. `<commit>` is what `Record the default branch's commit` recorded: `refs/remotes/origin/$HARNESS_GITHUB_DEFAULT_BRANCH`, the **GitHub** default branch's commit. `JOB_SURFACES_CHECK` then uses that one id for both the configuration and the merge base (`baseRef = commit ?? …`).

The GitHub default branch and `defaultBranch` can differ, and in this repository they do: GitHub's default is `main`, while `harness.config.json` → `defaultBranch` is `dev`. The `collect` job reads its configuration from the GitHub default branch precisely because the two can differ.

When they differ, the watchdog's merge base is the older point where `defaultBranch` forked from the GitHub default branch. Its diff therefore takes in every **default-branch** commit since then that touched a job surface: an outer-loop script, `harness.config.json` or `.claude/settings.json`. It reports those as "the run branch's own commits". So an honest run that stalls is given up `failed`, with a notification blaming the branch (`land that change on dev through a supervised route`), instead of being reset and resumed.

That breaks a constraint stated in both the task prompt and the story plan: "The watcher's outcomes stay the same on an honest copy … the watchdog's resume from the committed ledger". The two forms of the check also disagree about the same branch in the same job. The job-start step passes it; the watchdog fails it.

No test reaches this case:
- `(J6)` and every real-doctor case record the `defaultBranch` tip as the commit (`jobStall` → `defaultCommit` is `refs/heads/${config.defaultBranch}`).
- `(J3)` sets a differing branch name, but against an `npx` recorder rather than the real doctor.

**Proof.** The probe used the built `cli/dist/cli.js` with a bare `origin` holding three branches:
- `main`: this repository's own `harness.config.json` (`defaultBranch: dev`) and `scripts/remote-run.sh` = `echo v1`;
- `dev` = `main` + one commit changing `scripts/remote-run.sh` to `echo v2`;
- `feat` = `dev` + one commit adding `work.txt`, an honest run.

In a clone checked out on `feat`:
- `doctor --cwd <clone> --job-surfaces=main`, as the job-start step runs it, gave `PASS job-surfaces … change none of the 21 paths`, exit `0`.
- `doctor --cwd <clone> --job-surfaces=main@<origin/main commit>`, as the watchdog runs it with the commit the workflow records, gave `FAIL job-surfaces … changed a path …: scripts/remote-run.sh — land that change on dev through a supervised route`, exit `1`.

**Fix.** Record the configured default branch's commit as a separate base, and let the `@` form carry it. The configuration stays read from the GitHub default branch's recorded commit.

1. **`cli/src/doctor/checks.ts`.**
   1. Add a field to `JobSurfacesTarget`:

      ```ts
      /**
       * The configured `defaultBranch`'s commit, recorded before any session had the checkout. When present
       * it is the merge-base side in place of {@link commit}, which still supplies the configuration.
       */
      readonly base?: string;
      ```

   2. In `JOB_SURFACES_CHECK`, read `const { branch, commit, base } = target;`.
   3. Directly after the `commit !== undefined` block, add:

      ```ts
      if (base !== undefined && !commitResolves(root, base)) {
        return fail(
          `the recorded base commit ${base} is not a commit this checkout holds (${base}^{commit} does not resolve), so the merge base cannot be taken — pass the commit the workflow recorded`,
        );
      }
      ```

   4. Replace `const baseRef = commit ?? `refs/remotes/origin/${defaultBranch}`;` with:

      ```ts
      const baseRef = base ?? commit ?? `refs/remotes/origin/${defaultBranch}`;
      ```

   5. Amend the check's doc comment: "or the recorded commit for both under `@<commit>`" becomes "or, under `@<commit>`, the recorded commit for the configuration and — under `@<commit>@<base>` — the recorded `defaultBranch` commit for the merge base".

2. **`cli/src/commands/doctor.ts` → `parseJobSurfaces`.** After `target` is computed from the last `@`, and only when that produced a `commit`, test whether the remaining branch part itself ends in `@<id>`:

   ```ts
   if (target.commit !== undefined) {
     const head = target.branch;
     const at2 = head.lastIndexOf('@');
     const mid = at2 < 0 ? '' : head.slice(at2 + 1);
     if (COMMIT_ID_PATTERN.test(mid)) {
       const withBase: JobSurfacesTarget = { branch: head.slice(0, at2), commit: mid, base: target.commit };
       if (withBase.branch === '') throw refuse('names no branch');
       return withBase;
     }
   }
   ```

   Then update the user-facing text:
   - Extend the option comment above `JOB_SURFACES_FLAG`: "or `--job-surfaces=<branch>@<commit>@<base>`: `<commit>` supplies the configuration and `<base>` the merge-base side".
   - Change both usage strings from `<branch>[@<commit>]` to `<branch>[@<commit>[@<base>]]`.
   - Add two help lines after the `@<commit> (a full …` lines: `'With @<commit>@<base>, both full ids, the configuration is read from <commit> and the merge base'` and `'is taken with <base>, the configured defaultBranch\'s commit.'`.
   - In the `refuse` message, change "it takes … or …=<branch>@<commit>" to "… =<branch>@<commit> or …=<branch>@<commit>@<base>".

3. **`cli/templates/github/workflows/harness-run.yml` → `Record the default branch's commit`.** Append these lines after the existing `echo "HARNESS_GITHUB_DEFAULT_COMMIT=$sha" >> "$GITHUB_ENV"`:

   ```bash
             default_branch=$(git -C "$GITHUB_WORKSPACE" show "$sha:harness.config.json" | jq -r '.defaultBranch // empty') && [ -n "$default_branch" ] || { echo "::error::cannot read defaultBranch from the default branch's harness.config.json; nothing from this branch runs in this job."; exit 1; }
             base=$(git -C "$GITHUB_WORKSPACE" rev-parse --verify --quiet "refs/remotes/origin/$default_branch^{commit}") || { echo "::error::cannot read origin/$default_branch's commit from the job's fresh checkout; nothing from this branch runs in this job."; exit 1; }
             echo "HARNESS_DEFAULT_BRANCH_COMMIT=$base" >> "$GITHUB_ENV"
   ```

   In the header block `THE JOB'S OWN FILES.`, extend the `Record the default branch's commit` bullet: "…and the configured defaultBranch's commit to HARNESS_DEFAULT_BRANCH_COMMIT, the merge-base side, which differs from the GitHub default branch's when the two branches differ".

4. **`cli/templates/scripts/autonomous-watcher.sh` → `stall_job_surfaces_ok`.**
   - Add `[ -z "${HARNESS_DEFAULT_BRANCH_COMMIT:-}" ] ||` to the empty-value test.
   - Add `HARNESS_DEFAULT_BRANCH_COMMIT` to its `echo` line's list.
   - Change the argument to `--job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH@$HARNESS_GITHUB_DEFAULT_COMMIT@$HARNESS_DEFAULT_BRANCH_COMMIT"`.
   - Update the function comment: "The base is HARNESS_GITHUB_DEFAULT_COMMIT" becomes "The configuration is read from HARNESS_GITHUB_DEFAULT_COMMIT and the merge base taken with HARNESS_DEFAULT_BRANCH_COMMIT, the configured default branch's commit".
   - In the header's `THE WATCHDOG'S RESET IS GATED ON THE JOB SURFACES.` bullet, change `--job-surfaces=<default branch>@<commit>` to `--job-surfaces=<default branch>@<commit>@<base>`, and "The branch and commit are HARNESS_GITHUB_DEFAULT_BRANCH and HARNESS_GITHUB_DEFAULT_COMMIT" to "The branch, commit and base are HARNESS_GITHUB_DEFAULT_BRANCH, HARNESS_GITHUB_DEFAULT_COMMIT and HARNESS_DEFAULT_BRANCH_COMMIT".

5. **`docs/cli.md` → `## 7.`, the `**`--job-surfaces=<branch>`**` paragraph.** After the sentence ending "whose remote-tracking refs it could have moved.", insert:

   > With `--job-surfaces=<branch>@<commit>@<base>`, `<commit>` still supplies the configuration and `<base>` — the configured `defaultBranch`'s commit — is the merge-base side, which is what keeps the merge base the one a run's branch was cut from when the GitHub default branch and `defaultBranch` differ.

   Change "the job-mode stall watchdog runs the `@<commit>` form, with the commit `harness-run.yml` recorded" to "the job-mode stall watchdog runs the `@<commit>@<base>` form, with the two commits `harness-run.yml` recorded".

6. **`docs/remote-execution.md` → `## 11.` → the `**The step.**` bullet.**
   - Change "writes that branch's commit id from the same fresh checkout to the job's environment as `HARNESS_GITHUB_DEFAULT_COMMIT`" to "writes that branch's commit id, and the configured `defaultBranch`'s, from the same fresh checkout to the job's environment as `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`".
   - Change "`--job-surfaces=<branch>@$HARNESS_GITHUB_DEFAULT_COMMIT`, so its configuration and base come from that recorded commit" to "`--job-surfaces=<branch>@$HARNESS_GITHUB_DEFAULT_COMMIT@$HARNESS_DEFAULT_BRANCH_COMMIT`, so its configuration comes from the first recorded commit and its merge base from the second".
   - In `## 1. The lifecycle of a remote run`, item 4 ("**The job's setup**"), change "then record the default branch's commit;" to "then record the default branch's commit and the configured `defaultBranch`'s;".

7. **Tests.** These are the three files this fix edits, so they are the only ones it runs.
   1. **`cli/test/doctor-job-surfaces.test.mjs`: case "the @<commit>@<base> form takes the merge base from the configured default branch".** Build the probe's three branches: a GitHub default `main` with a configuration whose `defaultBranch` is `dev`; `dev` changing an outer-loop script; and an honest run branch off `dev`. Assert:
      - `--job-surfaces=main@<main commit>@<dev commit>` **passes**;
      - `--job-surfaces=main@<main commit>` **fails**, naming the script, which documents the old form's behaviour;
      - with a run-branch commit that changes `.claude/settings.json`, the three-part form **fails**, naming it.

      In `RED ONCE`, record: `base ??` dropped from `baseRef` → the first assertion fails.
   2. **`cli/test/watcher-stall-reset-payloads.test.mjs`.**
      - In `jobStall`'s environment, add `HARNESS_DEFAULT_BRANCH_COMMIT: defaultCommit`.
      - In `(J3)`, change the expected last argument to `` `--job-surfaces=${githubDefault}@${commit}@${commit}` `` and pass `HARNESS_DEFAULT_BRANCH_COMMIT: commit` in its env.
      - Update the `(J6)` `RED ONCE` line to name the three-part argument.
   3. **`cli/test/workflow-templates.test.mjs`.** In the `RECORD_STEP` expectation beside `'echo "HARNESS_GITHUB_DEFAULT_COMMIT=$sha" >> "$GITHUB_ENV"'`, add the three new lines in order. Assert that `HARNESS_DEFAULT_BRANCH_COMMIT` is written by that step and by no other.

- **Deviations from plan:**
  - (cli layer) Fix steps 5 and 6 (`docs/cli.md`, `docs/remote-execution.md`) lie outside `cli/`; left for the `general` dispatch this finding's `_(layer: cli, general)_` tag names.
  - `JOB_SURFACES_CHECK`'s existing local `base` (the merge-base id) is renamed `mergeBaseId`, since step 1.2 destructures `base` from the target in the same scope.
  - Beyond the listed text edits: the `CheckContext.jobSurfaces` and `JobSurfacesTarget` doc comments in `checks.ts`, `parseJobSurfaces`' and `COMMIT_ID_PATTERN`'s doc comments in `doctor.ts`, the workflow header bullet's "configuration and base from that id" sentence, and the watcher function comment's "The commit id sits" sentence were amended to the three-part form so none still states the old one.
  - The three single-file runs were read through a `grep` over their TAP summary lines rather than as one plain command; the counts and pass/fail lines are what was read.
