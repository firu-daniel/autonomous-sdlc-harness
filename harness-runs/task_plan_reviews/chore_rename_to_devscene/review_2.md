# Task plan review — iteration 2

## Must Fix

1. **The `lessons.md` passage Task 27 dictates puts a second old-name literal in the example README** — `task_27_plan.md`.
   The iteration-1 fix landed in the second `**Work:**` bullet. That bullet now says the replacement README passage states, for pair (b): *"the template's reads `devscene init` after Task 3, the capture's still reads `autonomous-sdlc-harness init`."* An implementer who writes that text faithfully adds an `autonomous-sdlc-harness` literal to `examples/notes-app/README.md` outside the historical-name line. The file is hard-wrapped at about 100 columns. The `lessons.md` passage sits at the `diff cli/templates/state-dir/lessons.md sdlc-harness/lessons.md` sentence, far from the paragraph opening **The capture is frozen; the fixture is live.** where the historical-name line goes. So the two hits cannot share a physical line. This conflicts with three other parts of the plan:
   - Task 27's own first `**Verification:**` bullet expects `git grep -n -F 'autonomous-sdlc-harness' -- examples/notes-app ':!examples/notes-app/.claude' ':!examples/notes-app/sdlc-harness'` to print *"exactly the one historical-name line in `README.md`"*.
   - The first `**Work:**` bullet calls the historical-name line *"the one line in the tree that keeps the old literal on purpose"*.
   - The task prompt's done-when admits only *"the one historical-name line in the example README"*. Task 28's `## Remaining hits` has no reason that covers a second README hit, so Task 28 would report it as a miss.

   The implementer can either write the passage as dictated and fail its own verification and the done-when, or depart from the bullet.
   **Fix:** In `task_27_plan.md`'s second `**Work:**` bullet, reword the dictated content for pair (b) so it does not quote the old literal. For example: *"the closing `_Written by …_` line, which differs only in the product name: the template's reads `devscene init` after Task 3, while the capture's keeps the product's earlier name."* Alternatively, cite the historical-name paragraph for the earlier spelling. Keep `**Verification:**` bullet 1 expecting exactly one README hit. Bullet 3 tests the `git diff` output, not README text, so it may keep quoting the old literal.

## Should Fix

1. **Iteration 1's Should Fix 1 was neither applied nor recorded** — `task_14_plan.md` (`**Where this task stops.**`) and the story index's `## Context` bullet on `projectName`.
   Both places still say only *"the watcher reads it from the main checkout"*. They do not mention the guard library's run-time read of `projectName` from the run copy (`plugin/hooks/lib/harness-config-lib.sh` → `hc_project_name`, which feeds the `<work_root>/<project_name>-*` sibling arms), or why that read is harmless for Tasks 15–28. The finding is not in `## Rejected findings` either. The lessons ledger says a reviewer's Should Fix is *"applied or recorded under `## Rejected findings` with its reason"* (`harness-runs/lessons.md` → `## Unattended control loops`). Apply it, or record the rejection.

## Nice to Have

1. The story index's `## Corpus staleness` entries still cite *"line 19 at `HEAD`"* and *"line 3 at `HEAD`"* beside their heading anchors and full quoted lines. The quoted line already locates each one (`.claude/context/plugin.md` → `## Citation`).
