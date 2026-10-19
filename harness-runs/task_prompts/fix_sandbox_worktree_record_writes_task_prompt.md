`fix_sandbox_worktree_record_writes` makes ordinary git work again inside a sandboxed unattended run. `chore_sandbox_manual_verification` measured that under the profile `feat_unattended_bash_sandbox` shipped, no sandboxed git call in a linked worktree can write that worktree's record, `<main>/.git/worktrees/<name>/`. `git add`, `git commit`, `git fetch`, `git stash` and `git switch` all fail with `Operation not permitted` on `index.lock`, `FETCH_HEAD`, `index` or `HEAD.lock` (`docs/sandbox-verification.md` → the ordinary-git and full-flow rows). `commit-on-branch.sh` runs sandboxed, so an unattended run parks at its very first commit, the flow-progress ledger. This is the most urgent sandbox defect: until it is fixed, `dontAsk` plus the sandbox cannot complete any run.

It starts from a `dev` that carries `chore_sandbox_manual_verification` and `fix_sandbox_excluded_commands_form`, whose corrected `excludedCommands` form goal 3 relies on. Read `docs/sandbox-verification.md`'s rows and `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #1 before designing anything.

**What was ruled out, on Claude Code 2.1.299, macOS, headless `-p`:** the record write still fails with every one of these changes to a scratch copy of the profile:
- the `.git/worktrees/*` `name` entry removed;
- all four `.git/worktrees/...` entries removed plus `allowWrite += <main>/.git`;
- no `denyWrite` at all plus `allowWrite += <main>/.git`;
- `--add-dir <main>/.git`;
- `allowWrite +=` the exact record directory.

From the same session, `git branch <x>` succeeds, so the shared refs under `<main>/.git` are writable. With cwd = the main checkout, `git add` succeeds. Only a record outside the session's cwd is closed. A half-done state is possible: `git switch -c` created the branch ref and then failed on `HEAD.lock`.

## The goal

1. Find, by measurement, why the record is unwritable and what opens it, if anything does. Candidates to measure: a session launched with its cwd in the main checkout and the worktree as an `--add-dir`; a worktree whose git dir lives inside the worktree (`git worktree add` with a relocated record, or a `--separate-git-dir` clone per run); what Claude Code's sandbox does with a cwd's git common dir. Record each measurement in `docs/sandbox-verification.md`.
2. If a profile or launch-line change opens the record while keeping the protections `writeProtection.ts` lists, generate it and re-run the record-protection and ordinary-git rows.
3. If nothing in the profile can open it, route the run's git writes through the excluded main-checkout wrapper family, as push and refresh already are. That means `commit-on-branch.sh`, and anything else the flows call that writes the index or `HEAD`. Give each one the same target and per-working-copy configuration checks the excluded wrappers carry. Write-protect it on both sides.
4. Re-run the full-flow row: one small throwaway task under the regenerated profile and `dontAsk`, through to branch-ready-for-review, with its stream read for refusals.

## Constraints

- Do not widen `allowWrite` beyond what a measurement shows is needed, and keep every protected path protected.
- Linux is not measured yet. Do not rely on a glob `denyWrite` entry there.
