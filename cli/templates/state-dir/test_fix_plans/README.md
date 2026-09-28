# test_fix_plans/

One `<branch>_<gate_key>_round_<gate_round>.md` index plus one `<branch>_<gate_key>_round_<gate_round>/finding_<N>.md` per fix, planned from one failing gate run. `<gate_key>` is `task` in the task flow and `review_<n>` in the user-review fix flow, and `<gate_round>` is the round whose log failed, so the index and its folder always carry the same suffix as the log they answer. The index is thin — a context paragraph, the `## Phase 2 Readiness — Ordered Fix List`, and one pointer per fix — while each finding file carries the failure it addresses and the concrete fix, self-contained enough to implement from alone. A failure judged not fixable on the branch is listed under the index's `## Not fixable on this branch` rather than given a finding file.

The set is written by the test fix-plan writer, from the round's log. The architecture reviewer approves it in plan-review mode before any fix is implemented; the unit loop's row `G.4` walks the readiness list and hands one implementer one `finding_<N>.md`; the committer flips the item's readiness entry as the fix lands.

An index appears when a gate run fails and a fix round opens. **Each round is a new index, never an edit of the previous one**: the next failure is planned under the next round's suffix, beside the earlier ones, and the accumulated rounds are the branch's gate-fix history. The whole directory is committed with the branch, since no ignore rule reaches it.

The mistake worth naming is reading an index here as a review. It is a fix plan: nobody graded the branch to produce it. It is the writer's plan for making one failing run pass, and the Run gates phase's next run is what verifies it.
