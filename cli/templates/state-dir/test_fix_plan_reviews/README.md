# test_fix_plan_reviews/

One `<branch>_<gate_key>_round_<gate_round>/review_<i>.md` per failed plan review, holding the findings against one round's test fix plan. The folder name repeats the suffix of the fix-plan index it reviews, under `<state_dir>/test_fix_plans/`. Inside it, `<i>` starts at `review_0.md` and increments once per failed review; a later number is added beside the earlier files, never written over them.

A file here is written by the architecture reviewer at its fourth insertion point, and read by the test fix-plan writer on its next iteration, which applies the Must Fix items to the index or to the named finding files. The reviewer creates the folder itself and only when it has findings to write, so a plan approved on the first pass leaves no folder behind.

Files appear one per failed review and stop when the plan is approved, or when the loop reaches its cap. Nothing supersedes an earlier file — the numbered set is how that round's plan converged — and the whole directory is committed with the branch, since no ignore rule reaches it.

The mistake worth naming is reading a file here as a review of the code. It holds the architecture gate's findings against one round's **plan**, before any of its fixes is implemented; the review of a finished fix is in `<state_dir>/test_fix_point_reviews/`.
