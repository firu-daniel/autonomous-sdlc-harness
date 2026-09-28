### 2. `test-fix-plan-writer` cannot flag a suspected shared cause between failing tests

> **Self-contained per-finding file** for `harness-runs/user_reviews/feat_run_gates_phase_fix_plan.md`. The implementer reads only this file to apply the fix. The committer flips this finding's entry in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `plugin/agents/test-fix-plan-writer.md` (`## Process` step 6) — "Sort lowest blast-radius first, and put a fix other fixes depend on ahead of them"

**Problem.** The writer writes one finding per failing test, which is correct and stays. But it has no way to record what it suspects when several failures look like one regression. Its only ordering rule is *"put a fix other fixes depend on ahead of them"*, which covers explicit dependency and not a suspected shared cause. So the likely root-cause finding can land late in the readiness list, and the units ahead of it each fix their own symptom. Once Finding 1's `already passing — ` close exists, putting the likely root cause first is what lets that close fire for the findings after it. The user wants this as **advice only**: a test log shows what failed, not why, so the writer's suspicion can be wrong and must never cost a failing test its own finding.

**Fix.** Edit `plugin/agents/test-fix-plan-writer.md` only:

- [ ] **`## Process` step 6, the readiness-list bullet** (anchor above). After the sort sentence, add: when the writer suspects several failures share one cause, it may put the finding it judges the likely root cause **ahead of** the findings that cause probably clears. This is an ordering choice and nothing more. Every failing test keeps its own readiness entry.
- [ ] **`## Process` step 6, the `**Per-finding files**` paragraph** (anchor: "the failure quoted from the log, rewritten per step 5"). Add an optional line a finding may carry after its diagnosis, in this form: `**Suspected shared cause:** likely the same cause as Finding <K> — <one-line reason>`. State these rules for it:
  - it is advice only;
  - it never merges findings, drops a finding or moves a failure to `## Not fixable on this branch`;
  - the finding it sits in still carries its own site anchor, diagnosis and concrete fix, so it can be implemented alone if the suspicion is wrong.
- [ ] **`## Quality checks before returning`.** Add one bullet: every `**Suspected shared cause:**` line names a `Finding <K>` that exists in this plan, and no failure lost its own finding because of one. The existing "exactly one readiness entry, one `### K. <title>` pointer and one `finding_<K>.md`" check already enforces the second half; the new bullet only adds the reference check.
- [ ] **`## Revision mode`** needs no change: a note is part of a finding's body and is preserved or revised like the rest of it.

This finding does **not** make the implementer act on the note. Finding 1 states that a `G.4` unit never closes on the note alone: its close rests on its own check of the named test.

**Verification.** Grep `plugin/agents/test-fix-plan-writer.md` for `Suspected shared cause` (it should hit the per-finding paragraph and the quality check) and confirm that the "one entry per fixable failure" wording is unchanged. Run `claude plugin validate --strict plugin`.

- **Deviations from plan:** The direct `claude plugin validate --strict plugin` call was refused by the permission layer (approval required). That claim rests instead on `bash scripts/test.sh` gate 1a (plugin manifest) passing, and `scripts/run-gates.sh` defines that gate as exactly `claude plugin validate --strict plugin`, so the command was executed through the wrapper, not invoked directly.
