### 1. Remove the home-directory path quoted in this branch's architecture review

**Site:** `harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md`, under `## Should Fix`, item `1. **The story index quotes an absolute machine path**`. The offending text is the substring right after `the test-run-rule bullet, cites `. It is around line 9; use that only as a navigation hint.

**Failing test:** none — test (`scripts/run-gates.sh` gate 6a, `6a no machine paths`)

**Failure (from the log, home prefix rewritten to `<home>`):**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md:9:1. **The story index quotes an absolute machine path** — `fix_docs_retrieval_bm25_index_state_typescript_story_plan.md` → `## Context` → **Constraints that bind every task**, the test-run-rule bullet, cites `<home>/Work/autonomous-sdlc-harness/plugin/instructions/unit_loop_core.md`. ...
```

**Diagnosis:** This is the first round, so there is no earlier log to compare against. Gate 6a (`machine_path_hits` in `scripts/run-gates.sh`) runs `grep -rn "$HOME"` over the tree, minus a few excluded directories (`node_modules`, `dist`, `.git`, `test_run_logs`, `scratch`, `__pycache__`). Any line it prints fails the gate. The architecture review for this branch was committed in `3bf658b8`. While flagging that the story index cited an absolute machine path, it quoted that path in full. The story index has since been fixed: line 46 of `harness-runs/story_plans/fix_docs_retrieval_bm25_index_state_typescript_story_plan.md` now cites `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md`. The review's quotation is now the only tracked file in the tree that contains the home directory. `.claude/context/conventions.md` → `## The testing bar` says the self-containment gate binds every commit, and `harness-runs/` artifacts are committed, so the review must not name the machine's location either. Other architecture reviews follow the same convention and write such paths as `<home>/…` (for example `harness-runs/architecture_reviews/chore_gate_10_real_catalog_measurement/review_0.md`).

**Concrete fix:**

- [ ] In `harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md`, `## Should Fix` item 1, replace the absolute path inside the backticks after `the test-run-rule bullet, cites `. Its prefix is the home directory followed by `/Work/autonomous-sdlc-harness/plugin/instructions/unit_loop_core.md`. Replace it with `<home>/Work/autonomous-sdlc-harness/plugin/instructions/unit_loop_core.md`. Change nothing else. The finding's meaning (the index quoted a machine path) and its `**Fix:**` sentence stay as they are.
- [ ] Confirm by reading only: a `grep -nF` of the home directory (from a bare `printenv HOME`) over that file prints nothing.

Do not add the file or its directory to gate 6a's exclusions, and do not change `scripts/run-gates.sh`. The gate is right, and the committed artifact is what has to change.

**Deviations from plan:** The finding names no test file (`none — test`, gate 6a of `scripts/run-gates.sh`), so per the row-`G.4` fix-site fallback no gate was run. The fix site still carried the home-directory path, so the fix was implemented. Evidence: a `grep -nF` of the `printenv HOME` value over `harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md` printed nothing (exit 1) after the edit. Gate 6a itself is deferred to the Run gates phase.
