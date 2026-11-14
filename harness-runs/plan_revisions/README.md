# plan_revisions/

One `<branch>/task_plan_revision_<n>.md` per revision of the task plan, and one `<branch>/fix_plan_<N>_revision_<k>.md` per revision of the fix plan of user-review round `<N>` (`1` for the unsuffixed review). One `<branch>` subdirectory holds one branch's notes for both loops. A note is numbered by the review round it **feeds**, not by the round whose findings it answers, so a converging reviewer of round `<n>` reads the note at its own index — the same number as the round file it is about to write.

A note is written by the plan writer — the task-plan writer or the fix-plan writer — as its last write of a revision: per finding of the round, the files it changed and whether the finding was resolved or rejected (a rejection's reason is in the plan's `## Rejected findings`), then every file it changed that no finding asked for. It is read by the next round's reviewers, which in converging mode check the changes it names. The orchestrator never reads it.

The directory is written whatever the phase toggles, because both plan loops write notes. Nothing supersedes an earlier note, and the whole directory is committed with the branch, since no ignore rule reaches it — in an unattended run at each round's end, with that round's findings files.

The mistake worth naming is treating a note as the record of which findings a reviewer raised. The findings files are that record; a converging reviewer that checks the note's account of its Must Fix items instead of its own previous file checks a paraphrase. The note records what the writer changed and why.
