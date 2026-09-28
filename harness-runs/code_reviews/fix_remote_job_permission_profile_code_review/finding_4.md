### 4. The upgrade step in `docs/remote-execution.md` §7 re-renders the workflows with `init --force` and does not say what else that replaces

**File:** `docs/remote-execution.md` (`## 7. Turning it on`, the **A repository adopted before this release** paragraph) — "Then re-render the workflows so the job's preflight is `doctor --remote-job`, and commit and push them as above:"

The paragraph added in this branch gives `npx autonomous-sdlc-harness init --force` as the way to re-render `.github/workflows/harness-run.yml`. `--force` suspends create-if-absent for **every** generated artifact, not only the two workflows. `docs/cli.md` §3 records what else it re-renders after a `.bak`: `.claude/CLAUDE.md`, whose sections filled by `/autonomous-sdlc-harness:harness-analyze` are lost to a single-generation `.bak`; the conventions stubs; `.claude/harness-task-offer.md`; `<githooksDir>/pre-push`; and the permission profile. Elsewhere, the project states that cost next to the command (`docs/cli.md` → the `task-offer-rules` bullet: "`init --force`, which re-renders the whole project file after a `.bak` and costs every section `/autonomous-sdlc-harness:harness-analyze` filled — a choice, which is why the warning names both"). It also offers the narrow route for a single file (`docs/cli.md` → the `pre-push-guard` bullet: "or deleting the hook and re-running `init`"). An adopter who follows this step as written wants two workflow files re-pinned, and ends up with their analyzed conventions corpus regenerated.

Both workflows are create-if-absent (`cli/src/generators/githubWorkflows.ts`, `policy: 'create-if-absent'`), so a plain `init` re-creates a deleted one. It renders it with the running CLI's version, which is what re-pins it. The deleted copies stay in git history, so any timeout, runner or cron tuning can be recovered from there.

**Fix:** replace the sentence and its fenced block

> Then re-render the workflows so the job's preflight is `doctor --remote-job`, and commit and push them as above:
>
> ```
> npx autonomous-sdlc-harness init --force
> ```

with

> Then re-render the two workflows so the job's preflight is `doctor --remote-job`. Delete them and run a plain `init`, which re-creates each one under create-if-absent at this CLI's version and touches nothing else. Re-apply any timeout, runner or cron tuning from the deleted copies in git history, then commit and push them as above. `init --force` would re-render them too, but it also regenerates every other generated file after a `.bak`, including `.claude/CLAUDE.md` and the conventions documents the analyze command filled.
>
> ```
> git rm .github/workflows/harness-run.yml .github/workflows/harness-resume.yml
> ```
>
> ```
> npx autonomous-sdlc-harness init
> ```

Each command goes in its own fenced block, one command per block, as the rest of §7 does (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line"*).
