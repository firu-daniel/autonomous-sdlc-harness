# Review plan meta-review — iteration 0

## Must Fix
1. **The `cli` layer is touched but the review shows no check drawn from `.claude/context/cli.md`** — refers to "Structure" (missed check). File: the index, `harness-runs/skeptic_reviews/fix_run_gates_answered_park_resume_skeptic_review.md`.
   The branch diff touches three paths under the `cli` layer's scope (`layers[]` → `cli`, path `cli`): `cli/test/run-gates-park-answer.test.mjs`, `cli/templates/state-dir/test_fix_plans/README.md` and `cli/templates/state-dir/clarifications/README.md`. The index's Context lists them among the reviewed files, but no finding and no clean-pass rationale draws on that layer's conventions document. The only finding (Finding 1) is a `plugin` finding, judged against `.claude/context/plugin.md`. The rule says that each touched layer must show at least one finding, or an explicit clean-pass rationale drawn from its own `conventions` document. De-duplicating against the code review does not meet it, because the index does not say the code review covered the `cli` layer's rules. Several of that document's rules apply to these files and are judgeable from the diff:
   - `.claude/context/cli.md` → `## What "done" means here`, together with `.claude/context/conventions.md` → `## The testing bar`. These cover the test header stating the rule it enforces, and source-guarding as an argued last resort.
   - `.claude/context/cli.md` → `## What this layer owns, and what it is not`. A `cli/templates/` edit changes what a future adopter receives, not this checkout. This applies to the self-adopted copies, `harness-runs/test_fix_plans/README.md` and `harness-runs/clarifications/README.md`, which the diff leaves untouched.
   **Fix:** In the index's `## Context`, after the **Headline** paragraph, add a short clean-pass rationale for the `cli` layer. It must cite `.claude/context/cli.md` (and, as needed, `.claude/context/conventions.md` → `## The testing bar`) and state what was checked in the new test file and the two template READMEs, and that each holds. If one of them does not hold, add it as a new `finding_<N>.md` with a site anchor, plus its index pointer and its readiness entry, instead. Leave `finding_1.md` unchanged. The meta-review found Finding 1's claims accurate against the tree:
   - the `prompt_path` row text;
   - the `blocker:` rule;
   - `hr_remote_bundle_write` / `hr_remote_planning_paths` carrying no `test_run_logs/`;
   - the planner's answer-mode exception;
   - 4095 words, and both rows are 40 words.
