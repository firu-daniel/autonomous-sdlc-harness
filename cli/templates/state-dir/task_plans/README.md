# task_plans/

One self-contained `<branch>/task_<N>_plan.md` per readiness entry, holding everything one task's implementer and reviewer read. One `<branch>` subdirectory holds one branch's set. `<N>` is the task's number in the story index's readiness list, and the same number appears in the filename and in the file's own `### Task N` heading — all three agree, which is also what lets a per-unit review folder key off it. The count of files here and the count of readiness entries in `<state_dir>/story_plans/<branch>_story_plan.md` are 1:1 by contract.

A file is authored by the plan writer in the same invocation as the story index, so that cross-task dependency links and shared citations stay coherent across the set. It is read by that task's layer implementer and, where the mode in force runs one, by that task's layer reviewer — and by nobody else in the unit loop: the orchestrator routes from the readiness entry and never opens the file, and the committer stages it only when the implementer appended deviation notes to it.

The set appears with the index and is revised in place through the planning loop's revision iterations, where the writer opens only the files a finding names and leaves the rest untouched. Nothing supersedes a file afterwards; the whole directory is committed with the branch, since no ignore rule reaches it.

The mistake worth naming is reading a per-task file as a progress ledger. Its `**Work:**` and `**Verification:**` bullets may be written as `- [ ]` sub-steps, and those are informational markers for the one implementer executing them — the committer never flips them and the orchestrator never counts them. Treating them as the iteration source is the exact confusion the thin-index-plus-per-task-file split exists to prevent.
