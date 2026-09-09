# task_plan_reviews/

One `<branch>/review_{iteration}.md` per planning iteration, holding the plan-gate review of the task plan. `{iteration}` is this directory's own index, and the index a new file takes is the **next free one in that branch's directory** rather than a restart at zero. The numbers in one directory are consecutive: each plan gate resolves its index in its own directory, so this directory holds its own series — a gap is a file that went missing, not a round another gate owned.

A file here is written by the plan reviewer and read by the plan writer on the next iteration, which applies its Must Fix items to the story index or to the named per-task files. The reviewer creates the branch directory itself and only when it has findings to write: a verdict of PASS touches no disk, so a plan that converged on the first pass leaves this directory empty.

Files appear one per failed gate and stop when the loop ends — at convergence, or at the iteration cap, where the flow halts and reports the latest path here. Nothing supersedes an earlier file; the accumulated set is the record of how the plan converged, and the whole directory is committed with the branch, since no ignore rule reaches it.

The mistake worth naming is a second pass over the same branch that inherits the first pass's "start at zero". It writes over `review_0.md` instead of beside it, the earlier round's findings are gone, and the commit records the loss as an ordinary modification to a file that already existed — so nothing flags it, and the convergence history reads as one round shorter than it was.
