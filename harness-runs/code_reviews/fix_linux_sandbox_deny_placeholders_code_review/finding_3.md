### 3. Remove "this branch" and the run-artifact citation from `docs/cli.md` §6 residual 12

**Site:** `docs/cli.md` → §6, item `12. **Linux placeholders: the interim position on a bubblewrap host (Linux, WSL2), until Claude Code changes.**`, at three substrings:

- `until they are, this branch's effect on Linux is predicted, not observed.` (the item's opening paragraph);
- `This branch's sweep, launch check and start-up recovery do not run in job mode` (the **Job mode** sub-list, point 2, **What a stall kill leaves.**);
- `That change is not on this branch, and `harness-runs/story_plans/fix_linux_sandbox_deny_placeholders_story_plan.md` → `## Context` lists job mode as a goal case the route does not meet.` (point 4, **What lifts it.**).

**Problem.** `docs/cli.md` is the standing reference for adopters, and residual 12 says it is *"the one statement"* of the Linux interim position, which three other documents cite. After merge, "this branch" refers to nothing. A reader of the merged document cannot tell which change "this branch's sweep" means, or what "not on this branch" rules out. The third sentence also sends that reader to a run artifact under this repository's own `stateDir`. `.claude/context/conventions.md` → `## Documents of record` says such an artifact *"describes a run, not this project"*. An adopter's checkout does not have it, and the sentence adds nothing the item does not already state.

**Fix.** Make three replacements in `docs/cli.md` and change nothing else:

1. Replace `until they are, this branch's effect on Linux is predicted, not observed.` with `until they are, the route's effect on Linux is predicted, not observed.`
2. Replace `This branch's sweep, launch check and start-up recovery do not run in job mode` with `The watcher's placeholder sweep, launch check and start-up recovery do not run in job mode`
3. Replace `That change is not on this branch, and `harness-runs/story_plans/fix_linux_sandbox_deny_placeholders_story_plan.md` → `## Context` lists job mode as a goal case the route does not meet.` with `No such change has landed.`
