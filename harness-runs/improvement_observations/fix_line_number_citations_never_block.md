## The configured test gate cannot pass in a worktree run
- **category:** tooling-gap
- **evidence:** every `layer-implementer` dispatch this run that ran `bash scripts/test.sh` (Tasks 1–10, code-review items 1–4, skeptic item 1) reported 11 of 12 gates passing and gate `6a no machine paths` failing on the single hit `./.git:1:gitdir: <main checkout>/.git/worktrees/...` — the worktree's `.git` pointer file, which that gate's `--exclude-dir=.git` does not skip because in a worktree `.git` is a file, not a directory (Task 10's return).
- **cost this run:** `commands.test` exited 1 on every unit, so no unit of this branch shipped with a passing configured test gate; each implementer had to diagnose and explain the same failure.
- **hypothesis:** (guess) any autonomous run from a per-branch worktree hits this.

## `claude plugin validate --strict` is refused inside implementer dispatches
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Tasks 3, 4, 5, 6, 8, 9 and 10 each report `claude plugin validate --strict plugin` (Task 10 also `… .`) refused with "This command requires approval"; the task prompt's acceptance 4 asks to judge on the printed `✔ Validation passed` text, which no dispatch saw — the pass rests on gate `1a` / `1b` exit status inside `scripts/run-gates.sh`.
- **cost this run:** acceptance criterion 4 verified by exit status only, contrary to the prompt's "judge on the printed text"; Task 6's implementer reported the manifest check as not run at all.

## Row A's branch-name `commit_prefix` conflicts with this repository's commit policy
- **category:** agent-contract
- **evidence:** `unit_loop_core.md` row `A`'s `commit_prefix rule` maps branch `fix_…` to `fix`, so all ten Phase-A committer dispatches passed `commit_prefix: fix`; `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for a story task's commit, and the committer declined the passed value on every one (commits c8c4329, d7ccde4, 98112dc, c840b85, 3e02c30, 2c003e5, 3016215, 12ec86a, e999b76, e0bece9 carry no prefix; the returns for Tasks 2, 4, 5, 6, 8, 9 and 10 say so explicitly).
- **cost this run:** ten dispatches sent a value the receiving contract treats as illegal; the committer's override is the only reason the subjects match policy.

## The local default-branch ref was behind its remote during the branch reviews
- **category:** shared-state
- **evidence:** the Phase-B `branch-reviewer` return and Task 10's return both report `CONTRIBUTING.md` in `git diff dev...HEAD`; it comes from commit 43552bf (#1), which is on `origin/dev` but not in the local `dev` ref the implemented-solution reviewers diff against (`diff_base: dev`).
- **cost this run:** two dispatches had to identify and exclude an out-of-branch file from the reviewed diff by hand.
