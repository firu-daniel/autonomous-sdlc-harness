## `bash scripts/test.sh` exits 1 in this worktree on three gates no unit touched
- **category:** tooling-gap
- **evidence:** Every `layer-implementer` return this run (Tasks 1–4, arch Findings 1–2, code-review Findings 1–3; nine dispatches) reported `bash scripts/test.sh` exit 1 with 17 gates passed and 3 failed: `1a plugin manifest` (strict-mode warnings on unquoted `${CLAUDE_PLUGIN_ROOT}` in `plugin/hooks/hooks.json`), `6a no machine paths` (hits on the worktree's own `.git` pointer file and `harness-runs/` artifacts), `11 docs-retrieval relevance floor` (retrieval runtime not installed). Gate 4 (`npm test`) passed in each report.
- **cost this run:** no dispatch saw a clean full-suite exit; each implementer recorded the deviation in its detail file and the verification claim rested on gate 4 alone.
- **hypothesis:** (guess) 6a and 11 are environmental to a worktree without the retrieval runtime; 1a may be a validator-version change.

## `npm test` failed once and passed on an immediate rerun
- **category:** silent-failure
- **evidence:** The `layer-implementer` for architecture Finding 1 (dispatch #11) reported that on its second `bash scripts/test.sh` run, gate 4 (`npm test`) failed with 786 of 787 passing, the failing test was not captured, and a standalone `npm --prefix cli test` rerun passed 787 of 787.
- **cost this run:** none measured; one unidentified intermittent test in the `cli` suite.

## Story-task commit prefix rule disagrees with the repository's commit-message policy
- **category:** agent-contract
- **evidence:** `unit_loop_core.md` row `A`'s `commit_prefix rule` derives `feat` from the `feat_` branch name, and this run passed `commit_prefix: feat` on the four Task commits (e0fbe82, 8ace858, bb24936, 0f91bc5). The `committer` return for Task 1 flagged that `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for the "Adding new work — a story task's commit" class. The fix-row commits this run used `none` per that same policy.
- **cost this run:** four commits on the branch carry a `feat:` prefix the repository's own policy says story tasks do not take.
