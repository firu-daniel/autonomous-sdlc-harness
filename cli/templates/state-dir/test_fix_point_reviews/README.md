# test_fix_point_reviews/

One `<branch>_<gate_key>_round_<gate_round>/item_<N>/review_<i>.md` per failed unit review, holding the findings against a single implemented fix. `<N>` is that fix's number in the round's readiness list — the same number its `finding_<N>.md` carries under `<state_dir>/test_fix_plans/`. Inside the item's folder, `<i>` starts at `review_0.md` and increments once per failed review of that fix; the counter is per item, so it restarts rather than running on across the round.

A file here is written by the layer reviewer the fix's layer routed to, and read by that fix's layer implementer on the fix iteration, which is handed the folder's most recent file. The reviewer creates the folder itself and only when it has findings to write, so a fix that passed on the first review leaves no folder behind.

Nothing supersedes an earlier file — the numbered set is that fix's convergence history — and the whole directory is committed with the branch, since no ignore rule reaches it.

The mistake worth naming is reading an empty directory as a missed step. Files appear only where the flow's per-unit review is on; in a flow where it is off, fixes go straight from implementer to committer, and this directory stays empty by design.
