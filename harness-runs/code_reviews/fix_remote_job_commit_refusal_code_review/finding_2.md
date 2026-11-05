### 2. The shipped library comment cites this repository's task prompt as the source of a measured fact, instead of the document of record

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (the comment above `hr_worktree_config_drop_inert_sparse_var`) — "(the task\n# prompt `fix_remote_job_commit_refusal` →"; and its self-adopted copy `scripts/lib/harness-run-lib.sh`, at the same anchor.

**The problem.** The new function's header gives the source of the shape it removes as:

```
# The shape it removes is what `actions/checkout` v7.0.1 leaves (the task
# prompt `fix_remote_job_commit_refusal` → `## What was measured (2026-11-05,
# verbatim)`): `git sparse-checkout disable` writes all three at `false`, then
```

That citation points at a run artifact under `harness-runs/task_prompts/`. `.claude/context/conventions.md` → `### Where a new responsibility goes` gives a measured fact one home: "`docs/`, and nowhere else". This branch already recorded that measurement there, in `docs/sandbox-verification.md`'s §9 row `CS6 (runner)` and §10 row `FR3` (Task 8).

The comment also names no path. It names a branch, and a reader has to know the run-artifact layout to find the file. The same library already sets the precedent a few lines below, in the clone allow-list comment: it cites `docs/sandbox-verification.md`, row CL5.

**Fix.** Make the same edit in both files, so that they stay byte-identical. Replace the three lines quoted above with:

```
# The shape it removes is what `actions/checkout` v7.0.1 leaves
# (`docs/sandbox-verification.md`, rows CS6 (runner) and FR3, measured in Gate
# 12 round 13): `git sparse-checkout disable` writes all three at `false`, then
```

Leave the rest of the comment unchanged. This edit changes a comment only, so it owes no test run of its own.
