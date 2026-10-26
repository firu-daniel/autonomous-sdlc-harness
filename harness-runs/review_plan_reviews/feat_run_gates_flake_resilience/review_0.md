# Review plan meta-review — iteration 0

## Must Fix
1. **The `general` layer was touched, but the review shows no check drawn from its conventions document** — refers to "Missed checks". File to change: the index, `harness-runs/code_reviews/feat_run_gates_flake_resilience_code_review.md`.
   The diff edits `docs/development.md`, which sits under the `general` layer (`path: "."`, conventions `.claude/context/conventions.md`). In two places it rewrites the **A hung case cannot hold the gate.** paragraph, and it adds a new **The time limits scale.** paragraph with a fenced `HARNESS_TEST_TIME_SCALE=4 npm test` block under Gate 4. The index mentions this file only in its scope list (`- **Task 4:** the Gate 4 paragraph in docs/development.md.`). No finding covers it, and no headline gives a clean-pass rationale for it. Every headline conclusion is about the `cli` layer: the helper, its suite, the scaled `timeoutMs` sites, the cap and the sweep case. So nothing shows the docs change was graded against the rules that govern it:
   - `.claude/context/conventions.md` → `## Documents of record`. The new paragraph states figures (default `2`, cap `5`, `--test-timeout=1800000`). They must be stated as configuration or judgement, never as an in-session measurement.
   - `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session…"*.
   - `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line…"*.
   - Whether the two rewritten sentences of **A hung case cannot hold the gate.** still match the code. The 2-second `CHILD_BOUND_MS` stays fixed, while the 240-second `CHILD_TEST_TIMEOUT_MS` and the watcher bounds now scale.
   My own read of the hunk found no defect, so a clean-pass rationale is enough. But the review has to show it.
   **Fix:** In the index, add a headline bullet under `**Headline conclusions.**` with a clean-pass rationale for `docs/development.md`, drawn from `.claude/context/conventions.md` and `harness-runs/lessons.md`. It must state that:
   - the new **The time limits scale.** paragraph presents `2` and `5` as the helper's default and cap, not as a measured figure;
   - its command sits alone in a fenced block;
   - the rewritten **A hung case cannot hold the gate.** sentences agree with `cli/test/test-timeout.test.mjs` → `CHILD_BOUND_MS` (fixed) and `CHILD_TEST_TIMEOUT_MS` (scaled), and with the watcher bounds.

   If re-checking does turn up a defect, add it instead as a new `finding_3.md`, with its index pointer and readiness entry tagged `_(layer: general)_`.
