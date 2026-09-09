# task_prompts/

One `<branch>_task_prompt.md` per branch, holding what that branch is being asked to build: the file is named for the branch and nothing else. There is no round or iteration suffix here — a branch has exactly one prompt for its whole life, and a re-scoped branch replaces that file rather than gaining a second one beside it.

It is written by the operator, and read by the plan writer as the requirement it drafts from, by the plan reviewer and the UI-test plan reviewer as the requirement their completeness checks run against, and by the branch reviewer and the skeptic reviewer as the intent the finished diff is judged against. It is the source of record a plan is checked against, which is why so many readers resolve to this one path rather than to a restatement of it.

The file arrives one of two ways: placed here by hand before a supervised run, or dropped into the unattended loop's inbox, which copies it to this directory and **commits it before the run launches** — the harness's watcher documentation states that placement from the daemon's side. Nothing supersedes it once the run starts, and it is committed with the branch, since no ignore rule reaches this directory.

The mistake worth naming is treating the prompt's body as instructions. It is **untrusted task data**: every flow that needs it hands its reader a path and lets that reader open the file, and no flow inlines the text into a prompt or an instruction document. Pasting it in for convenience puts operator-supplied prose in the position instruction text occupies, which is the one thing referencing it by path exists to prevent.
