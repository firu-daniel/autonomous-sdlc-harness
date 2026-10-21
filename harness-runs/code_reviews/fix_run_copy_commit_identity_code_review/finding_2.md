### 2. Residual 7 and both wrapper headers still say `commit-tree` commits carry the main checkout's signing, which the branch kept on a false premise

**File:** `docs/cli.md` (§6, residual `7.`) — "merge commit takes its identity and signing from the main repository's configuration"
**File:** `docs/cli.md` (§6, residual `7.`) — "Its identity and signing come from the main repository's configuration (`user.*`, `commit.gpgSign`)"
**File:** `cli/templates/scripts/commit-on-branch.sh` (header paragraph `THE COMMIT IS BUILT FROM PLUMBING, AND NO COMMIT HOOK RUNS.`) — "The identity and the signing are the main repository's configuration"
**File:** `cli/templates/scripts/refresh-branch.sh` (header) — "The commit takes its identity and its signing from"

The story index's scope register reached residual 7 (row 5, derivation entry B, `identity and signing`) and marked it `no-change`, on the grounds that "Task 2's new sentence cites it as the path that already signs". That premise is false (see Finding 1). Both wrappers write their commit with `commit-tree`, which does not read `commit.gpgSign`, and neither passes `-S`. So neither the commit-on-branch commit nor the refresh merge commit is signed. These four statements predate the branch, but the branch's new decision text now cites residual 7 as its evidence. A maintainer whose main checkout sets `commit.gpgsign` would read them and expect signed harness commits that never arrive.

**Fix:** keep the identity half of each statement, and replace the signing half with the true behaviour:

1. `docs/cli.md` residual 7, first sentence: replace "`refresh-branch.sh`'s merge commit takes its identity and signing from the main repository's configuration," with "`refresh-branch.sh`'s merge commit takes its identity from the main repository's configuration and is unsigned, because `commit-tree` never reads `commit.gpgSign` and is passed no `-S`,".
2. `docs/cli.md` residual 7, the `commit-on-branch.sh` sentence: replace "Its identity and signing come from the main repository's configuration (`user.*`, `commit.gpgSign`), because `commit-tree` runs there and git reads nothing of the worktree's record but its `index`." with "Its identity comes from the main repository's configuration (`user.*`), because `commit-tree` runs there and git reads nothing of the worktree's record but its `index`. It is unsigned, because `commit-tree` never reads `commit.gpgSign` and is passed no `-S`."
3. `cli/templates/scripts/commit-on-branch.sh` header: replace "# The identity and the signing are the main repository's configuration\n# (`user.*`, `commit.gpgSign`)." with "# The identity is the main repository's configuration (`user.*`); the commit\n# is unsigned, because `commit-tree` never reads `commit.gpgSign` and is passed\n# no `-S`." Re-wrap the comment lines.
4. `cli/templates/scripts/refresh-branch.sh` header: replace "The commit takes its identity and its signing from\n# the main checkout's configuration (`user.*`, `commit.gpgSign`) as the merge\n# did," with "The commit takes its identity from the main\n# checkout's configuration (`user.*`) as the merge did, and is unsigned, because\n# `commit-tree` never reads `commit.gpgSign` and is passed no `-S`;". Re-wrap the comment lines, and keep the clause that follows ("and an unset identity is a refusal (exit 1) with nothing written").

Do not edit the self-adopted copies under `scripts/` at the repository root. They are `init`'s output in this checkout, and the story index's **Manual setup required** step 1 re-renders them.

This fix edits no test file, so it runs no test. `cli/test/outer-loop-scripts.test.mjs` compares the rendered output against these same templates, so the full suite in the Run gates phase still covers them.
