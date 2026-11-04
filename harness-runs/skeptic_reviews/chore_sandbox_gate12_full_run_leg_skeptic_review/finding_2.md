### 2. Step 8's `<other branch>` is never created, and the job refuses on a GitHub default branch that does not carry the adoption

**File:** `docs/development.md` (**Gate 12** → **The sandbox series round (#170 step 4) — not yet run.** → **The steps.**, step 8, "**The default-branch leg.**"), the two fenced `gh repo edit <owner>/<scratch-repo> --default-branch …` blocks.

**The problem.** Step 8 tells the maintainer to set the GitHub default branch to `<other branch>`, but it never says which branch that is or how to make one. The leg only works when that branch carries the harness adoption.

- **The job's trusted configuration comes from the GitHub default branch.** `cli/templates/github/workflows/harness-run.yml` → `Record the default branch's commit` reads `refs/remotes/origin/$HARNESS_GITHUB_DEFAULT_BRANCH`, then `git show "$sha:harness.config.json" | jq -r '.defaultBranch // empty'`. When that branch has no `harness.config.json`, the step exits 1 with `::error::cannot read defaultBranch from the default branch's harness.config.json; nothing from this branch runs in this job.`
- **The step before it reads the same branch.** `Refuse a branch that changed the job's own files` runs `doctor --job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH"`, which reads the configuration from `refs/remotes/origin/<branch>`. Its failure modes include "a trusted configuration that is not usable" (`docs/cli.md` → the `--job-surfaces=<branch>` paragraph).
- **GitHub dispatches only a workflow its default branch carries.** The repository's own `docs/cli.md` says so where `doctor`'s `remote-execution` check warns that `origin/<defaultBranch>` does not carry `harness-run.yml`.

**Why it is reachable.** When step 8 runs, the round's throwaway branches from step 7 still exist, because step 10 deletes them. Each of them carries a planted job surface or a planted link. Seed-era branches carry no adoption. So the branches a maintainer is most likely to pick are exactly the ones that make the job refuse, or that hand the job a planted configuration. JS3 and JS3N then fail at setup for a reason unrelated to the watchdog. That is either recorded as a defect it is not, or it costs a re-run of the leg.

**Fix.** This is a documentation edit only, so no test runs for this fix.

1. In step 8, immediately before the first fenced block (`gh repo edit <owner>/<scratch-repo> --default-branch <other branch>`), insert the text below. Keep the indentation of the step's other fenced blocks.

   ````
   `<other branch>` is a new branch cut from the default branch's tip, so it carries the adoption and every job surface unchanged; never one of step 7's throwaway branches:

   ```
   git fetch origin
   git push --no-verify origin refs/remotes/origin/<default branch>:refs/heads/<other branch>
   ```
   ````

2. After the second fenced block (`gh repo edit <owner>/<scratch-repo> --default-branch <default branch>`), insert:

   ````
   Then delete it:

   ```
   git push --no-verify origin --delete <other branch>
   ```
   ````
