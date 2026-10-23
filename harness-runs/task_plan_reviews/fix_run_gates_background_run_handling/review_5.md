# Task plan review — iteration 5

Round 4's Must Fix is applied:
- `task_1_plan.md` run-form steps 4–5 now end the start-up poll on `.verdict` as well as on `.running` holding `$!`, and the `OUTPUT CONTRACT` and start-up header bullets say the same.
- `task_2_plan.md` restates that contract under `**Depends on:**` and adds the un-held-stub case, **A worker that finishes inside the start-up poll.**

I re-ran D1, D2, D3 and D5 verbatim and re-walked D4. Every site they reach is a row, so there is no closure finding. The index has no `## Rejected findings` section. Structure, the 1:1 correspondence, layer tags and order, points and Work-bullet counts are all within bounds. I checked the watchdog claim in the Context against `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs` / `collect_descendants`, and it holds: the watchdog runs `kill -9` on the PID and the `pgrep -P` descendants it captured, not on a process group.

## Must Fix

1. **`task_4_plan.md`: the first Verification bullet cannot pass on a correct implementation**
   The bullet reads: `grep -nE 'moves the run to the background|torn down|foreground window|backgrounded run' plugin/instructions/plan_orchestration_instructions_core.md` prints nothing. The grep covers the whole file, and `torn down` also matches two passages outside G.1 that have nothing to do with this branch. Both are about the Phase E dev server, and neither is in this task's `### Targets`:
   - `**A run-mode skip happens before E.0, so no dev server is ever started, and none is torn down.**` (the run-mode-skip bullet before E.0);
   - `Confirm the dev server started in Phase E has been torn down.` (under `### D.2 Done summary`'s neighbourhood, the dev-server confirmation).

   After a correct G.1 rewrite the grep still prints those two lines. The implementer then has two bad choices: report a failed verification, or edit two out-of-scope dev-server sentences to make the grep go quiet.

   **Fix:** in `task_4_plan.md` → `**Verification:**`, narrow the pattern to the G.1 claims being removed. For example, `grep -nE 'moves the run to the background|torn down when its turn ends|monitor dies with it|foreground window|backgrounded run' plugin/instructions/plan_orchestration_instructions_core.md` prints nothing. Alternatively, keep `torn down` but scope the check to the `### G.1 Run the gates` section, read through once. Add the sentence: "The dev-server `torn down` sentences elsewhere in the file are out of scope and stay unchanged."

## Should Fix

1. **`task_11_plan.md`: the WF1 attribution quote does not match WF1 verbatim.** The task tells the implementer to attribute the figures "the way row WF1 already is: *"Taken 2026-10-23 by the maintainer (from the task prompt)"*". WF1 actually reads `Taken 2026-10-23 by the maintainer (from the task prompt and the session `A` capture).` Quote the real prefix (`Taken 2026-10-23 by the maintainer (from the task prompt`) or the full WF1 text, and state the form the BG rows use. Otherwise the implementer may go looking for a string that does not exist.

## Nice to Have
