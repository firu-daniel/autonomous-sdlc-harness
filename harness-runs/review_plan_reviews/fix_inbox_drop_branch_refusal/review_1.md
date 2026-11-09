# Review plan meta-review — iteration 1

## Must Fix
1. **Finding 1 is a Should Fix graded as a Must Fix** — refers to review finding #1. Offending file: `harness-runs/code_reviews/fix_inbox_drop_branch_refusal_code_review.md` (the index). `finding_1.md` itself is correct and needs no change.
   Finding 1 is accurate. The notification's remedy clause, "drop it again under an unprotected, valid branch name", is wrong for the third refusal reason that `hr_inbox_branch_refusal_var` gives ("whether '<branch>' is protected cannot be judged: the protected set in '<root>/harness.config.json' cannot be resolved"). But a wrong advisory clause in a notification fits none of the three Must Fix classes:
   - It is not a business-logic divergence from a reference implementation. `phases.parity` is `false`.
   - It is not broken architecture. No responsibility moved out of its layer, no boundary is crossed, and no required accompanying item is missing.
   - It does not violate a rule in `.claude/context/cli.md`, `.claude/context/conventions.md` or `harness-runs/lessons.md`. The notification still names its cause correctly through `$HR_INBOX_REFUSAL`, and the refusal behaviour itself is correct and tested.

   The review also grades this finding inconsistently with Finding 2. Finding 2 is a defect of the same kind in the same `notify` call: it names a run log that is never written. It misleads on **every** intake refusal, yet it sits under `## Should Fix`. Finding 1 misleads only when the configuration is unresolvable, which is the rarest of the three reasons, and it sits under `## Must Fix`. Grading the narrower defect higher than the wider one is severity inflation.
   **Fix:** in the index `harness-runs/code_reviews/fix_inbox_drop_branch_refusal_code_review.md`, make three changes:
   - Move the `### 1. The intake refusal's notification tells the user to rename the branch even when the cause is an unresolvable protected set` heading and its `→ [finding_1.md](…)` pointer from `## Must Fix` to `## Should Fix`. Place it after Finding 2's pointer, because Finding 2 has the wider blast radius.
   - Leave `## Must Fix` with a one-line "None." body. Do not delete the heading.
   - In the Context paragraph, replace "The one Must Fix is a wrong remedy in the new notification." with a sentence that matches the new grading, for example "There is no Must Fix. The two Should Fix findings on the new notification are the most consequential."

   The readiness entry `1. [ ] **Finding 1** — …` stays as it is, as do `finding_1.md` and the readiness order.
