# Review plan meta-review — iteration 0

## Must Fix
1. **Finding 1's detail file names an absolute path on the writing machine, so committing the review breaks the self-containment gate** — refers to review finding #1. Offending file: `harness-runs/code_reviews/feat_converging_plan_reviews_code_review/finding_1.md`.
   The closing sentence of the `**Fix:**` section reads "Under `/Users/daniel/Work/devscene/plugin/instructions/unit_loop_core.md` → `## The test-run rule`, this prose-only fix runs no test." That is a home-directory path, and it also points at the main checkout rather than this run copy. The review index and its finding files are committed under `harness-runs/code_reviews/`, and `.claude/context/conventions.md` → `## The testing bar` states that "The self-containment gate binds every commit: nothing in this tree may name a location on the machine that wrote it." Gate 6a (`scripts/check-machine-paths.sh`, `grep -rn "$HOME" .`) does not exclude `harness-runs/code_reviews/`, so this line will be printed as a hit and fail the Run gates phase. It also breaks `.claude/context/plugin.md` → `## Citation`: a reference into the plugin is written as `${CLAUDE_PLUGIN_ROOT}/<path>` or repo-relative, never as an absolute machine path. No other file in the review has this problem (Findings 2 and 3 and the index carry no `/Users/` path).
   **Fix:** in `finding_1.md`, replace `/Users/daniel/Work/devscene/plugin/instructions/unit_loop_core.md` with `plugin/instructions/unit_loop_core.md`, so the sentence reads: "Under `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, this prose-only fix runs no test." Leave the rest of the finding as it is. Its substance checked out: the step-5 `fix_round = 0` reset was introduced on this branch (the default branch's core used a next-free-index resolution), and it contradicts the core's own counter paragraph and `docs/converging-plan-reviews.md`.

## Should Fix

None.

## Nice to Have

None.
