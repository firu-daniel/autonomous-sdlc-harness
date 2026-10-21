## Row `A`'s branch-name `commit_prefix` rule names a token this repository's commit policy refuses
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A` derives `commit_prefix` from the branch name (`fix_` → `fix`). Both Phase-A `committer` dispatches on this branch carried `commit_prefix: fix`, and both returns reported overriding it: `.claude/context/conventions.md` → `## Commit-message policy` admits only `chore`, and only on fixed-form subjects, and requires `none` for a story-task commit. Commits `ecf5126a` (Task 1) and `1a3b5c6e` (Task 2) landed with no prefix.
- **cost this run:** none beyond two committer-side corrections; the orchestrator's dispatch carried a value the committer had to reject.
- **hypothesis:** (guess) the fix rows already defer to the committer's own designation, and row `A` does not.

## `branch-reviewer`'s Pass-0 grep-sweep list is an empty stub
- **category:** tooling-gap
- **evidence:** the Phase-B `branch-reviewer` return for `harness-runs/code_reviews/fix_run_copy_commit_identity_code_review.md` stated that the grep-sweep list in its agent definition is still an empty stub, so Pass 0 half (a) ran no regex; only half (b) (new-symbol wiring) ran.
- **cost this run:** Pass 0 half (a) contributed nothing to the end-of-branch review.

## A scratch-repo git measurement was refused for the implementer
- **category:** tooling-gap
- **evidence:** the Phase-C `layer-implementer` (layer `general`) for code-review Finding 1 reported that its re-run, in a scratch repository, of the `commit-tree` / `commit.gpgsign` measurement — plus a `-S` control — was refused by the permission check. It recorded the refusal as a `**Deviations from plan:**` note in `harness-runs/code_reviews/fix_run_copy_commit_identity_code_review/finding_1.md` and relied on the reviewer's own measurement.
- **cost this run:** the corrected signing text in `docs/cli.md` §6 rests on one measurement (the reviewer's) rather than two.

## The configured `defaultBranch` has no local ref in this checkout
- **category:** silent-failure
- **evidence:** `harness.config.json` names `dev` as `defaultBranch`; this checkout carries only `origin/dev`. The Phase-B `branch-reviewer` and the Phase-D `statistics-plan-writer` both reported that `dev..HEAD` failed and that each fell back to `origin/dev..HEAD`, saying so in its own artifact.
- **cost this run:** none — both agents fell back and disclosed it; the diff base each used is recorded in its artifact.
