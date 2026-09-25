## The committer rejected the unit loop's branch-derived `commit_prefix` on every task commit
- **category:** agent-contract
- **evidence:** Phase A passed `commit_prefix: fix` on all five `mode: task` dispatches, as `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` derives it from the `fix_` branch name. Each committer return stated that `.claude/context/conventions.md` → `## Commit-message policy` gives a story task's commit no prefix, so `fix` was not a legal value, and committed with none: 0f03dcb, 31c3d95, bc2ad8a, 6b33c7e, 214ef61 all carry an unprefixed subject.
- **cost this run:** none to the commits; five committer returns each spent a paragraph explaining the override.
- **hypothesis:** row `A`'s branch-name rule predates the committer's policy-first prefix resolution the five fix rows already defer to.

## `commands.test` exits 1 on every unit because two gates fail on the branch base
- **category:** tooling-gap
- **evidence:** every `layer-implementer` return (Tasks 1–5, code-review Findings 1–2, skeptic Finding 1) reported `bash scripts/test.sh` → `run-gates.sh` at 18 passed, 2 failed: `1a plugin manifest` (six unquoted `${CLAUDE_PLUGIN_ROOT}` warnings in `plugin/hooks/hooks.json`, errors under `--strict`) and `11 docs-retrieval relevance floor` (the retrieval runtime is not installed in this worktree). The planner recorded both as the pre-edit baseline in the story index `## Context`.
- **cost this run:** no unit had a passing test gate; each implementer compared against the baseline by hand to tell "no new failure" from a regression.
