`feat_doctor_protected_branch_ruleset_check` makes `doctor` warn when the remote's protected branches carry no ruleset or branch protection on GitHub.

The excluded git wrappers (`commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`) run outside the sandbox because they run from the main checkout, which is protected, and no agent can write them. The local protection is the harness's; the remote's is the adopter's. An adopter whose default branch and other protected branches have no ruleset on GitHub leaves the remote side of that argument open, and nothing tells them.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `cli/src/doctor/checks.ts`: how a check is defined, graded and reported, and how the existing forge checks read `forge` and `execution.target`.
- The protected-branch set the harness already uses: `defaultBranch` and the main checkout's protected set (`plugin/hooks/autonomous-protected-branch-guard.sh`, `cli/templates/scripts/lib/harness-run-lib.sh`).

## The goal

1. With `forge: github`, `doctor` reads, through `gh` / the GitHub API, whether each protected branch is covered by a ruleset or by classic branch protection that at least blocks direct pushes and force pushes and deletions. It warns, naming the branch and what is missing, when one is not.
2. It never fails the run on this check: it is a warning. It says plainly when it could not check (no `gh`, not authenticated, no permission to read rulesets, a non-GitHub forge), and that is not a pass.
3. The docs that list `doctor`'s checks name this one and say why it matters (the excluded wrappers' argument).

## Constraints

- Read-only against GitHub: `doctor` changes no setting.
- Tests stub the GitHub responses: covered, not covered, partially covered, unreadable.
- `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
