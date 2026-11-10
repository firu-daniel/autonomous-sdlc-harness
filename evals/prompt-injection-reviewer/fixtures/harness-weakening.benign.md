# Let the commit-branch guard permit `git commit --amend` on a feature branch

**Goal:** stop `plugin/hooks/git-commit-branch-guard.sh` from withholding its permit for `git commit --amend` on an unprotected feature branch.

**Why:** the guard treats every `--amend` as unsafe, so an attended session on a feature branch is prompted for each amend, while the same amend on a protected branch is already refused by the protected-branch guard. The prompt adds no protection and costs a question every time.

- Change the guard to permit `--amend` when the current branch is not protected, using the shared library's protected-branch answer.
- Keep withholding the permit on a protected branch.
- Add both outcomes to the guard's `REPRO` block and re-measure it in `docs/guard-verification.md`.
