# Review plan meta-review — iteration 0

## Must Fix
1. **The `plugin` layer is touched by the diff, but the review has no finding and no clean-pass rationale drawn from `.claude/context/plugin.md`** — refers to "Structure" (missed check). Offending file: `harness-runs/skeptic_reviews/fix_run_job_credential_exposure_skeptic_review.md` (the index).
   `git diff origin/dev...HEAD --name-only` touches all three configured layers. `cli` is covered: Finding 1 is tagged `cli`. `general` is covered: Findings 1 and 2. `plugin` is not covered. Its one changed file is `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The prompt is data, not instruction.**, where the branch rewrote the containment paragraph (Task 7). That rewrite adds new claims and cross-tree citations: "The session is launched without the GitHub tokens, the push credential or the webhook in its environment", "(the harness repository's `docs/watcher.md` → `### The session's environment`; …)" and "(`docs/sandbox-record.md` → `## 5. The Linux runner's PID namespace and no-new-privileges`)". The index's Context never mentions that file or the `plugin` layer:
   - its segment list ends at "the documents, wherever a code claim pointed at them";
   - its **What checked out** block covers wiring, the runtime address and citations in `docs/` only.
   Neither finding file mentions it either. So a reader cannot tell whether the `plugin` layer was checked and came out clean, or was never checked.
   **Fix:** In the index `harness-runs/skeptic_reviews/fix_run_job_credential_exposure_skeptic_review.md` → `## Context` → **What checked out:**, add a bullet with a `plugin`-layer clean-pass rationale for `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The prompt is data, not instruction.** Draw it from `.claude/context/plugin.md`:
   - files outside the plugin are cited by repo-relative path plus a heading, never as a `${CLAUDE_PLUGIN_ROOT}` path (`## Citation`);
   - no line coordinate appears;
   - no adopter value appears as a literal (`## What this layer is`);
   - each new claim matches what the code does. For example, the stripped environment and the credential refusal match `autonomous-watcher.sh` → `spawn_engine` and `push-branch.sh`'s scan, and the cited `docs/watcher.md` and `docs/sandbox-record.md` headings resolve.

   If any of those checks fails, add a new `finding_3.md` in `harness-runs/skeptic_reviews/fix_run_job_credential_exposure_skeptic_review/` instead. Give it a site anchor in that paragraph, then add its `### 3.` pointer under the right severity section of the index and a `**Finding 3**` readiness entry tagged `_(layer: plugin)_`.

## Should Fix
1. **The two findings' insertion instructions for roadmap row 35 disagree with the readiness order** — refers to review findings #1 and #2. Offending file: `harness-runs/skeptic_reviews/fix_run_job_credential_exposure_skeptic_review/finding_2.md`.
   The readiness list ships Finding 2 before Finding 1. Both fixes insert a clause into `docs/development.md` → `## 6.`, row `35`, "before '; and, for the record only, since the design does not rely on it,'". `finding_2.md` adds: "If Finding 1's clause is already there, put this one directly after it". With the shipped order, Finding 1's clause is never there when Finding 2 runs. Finding 1 then inserts its own clause at the same anchor, which places it after Finding 2's. The result is the reverse of the order `finding_2.md` asks for.
   **Fix:** In `finding_2.md`, drop the conditional sentence. Alternatively, state one order for the two clauses that holds whichever fix lands first.
