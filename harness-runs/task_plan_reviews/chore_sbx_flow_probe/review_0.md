# Task plan review — iteration 0

## Must Fix
1. **The plan's list of spawn paths misses two that render and check the profile: the stall-watchdog relaunch and the job-mode auto-resume.** Fix goes in `task_1_plan.md`, plus the matching claim in the story index (`chore_sbx_flow_probe_story_plan.md`) → `## Context`, item 2.
   The plan calls its code facts complete ("What the code says. Task 1 writes from this…"). `task_1_plan.md` → `**Work:**` (b) lists "Other spawn paths [that] log their own line in place of `launching headless run`" as only four: park-resume, pause-resume, `job: launching run for '<branch>'` and `job: resuming …`. The template `cli/templates/scripts/autonomous-watcher.sh` has two more `spawn_engine` callers. Each renders, checks and records the profile like the others, and each puts its own line in front:
   - the stall-watchdog relaunch: `log "stall-watchdog: '$b' -> reset to the last commit and resume (restart #…)"`, then `if ! spawn_engine "$b" "$worktree" "$log_path" "" 1`;
   - the job-mode automatic resume: `log "job: auto-resume $count/$REMOTE_AUTO_RESUME_MAX of '$branch' after $why, …"`, then `spawn_engine "$branch" "$worktree" "$log_path" "" 1 || spawn_refused …`.

   The Work bullet tells the implementer to "Name, or cover in a clause, the line a resume and a job log instead". The suggested sentence then names an exact set of lines. If the implementer follows the plan's list, the new sentence is incomplete on the job-mode path, which the task prompt explicitly requires the sentence to stay true for ("keep the sentence true for the job mode … paths"). It is also incomplete on the stall-watchdog relaunch. That puts the false statement into a document of record that the plan's own `Top risks:` names as the failure to avoid.
   **Fix:**
   - In `task_1_plan.md` → `**Work:**` (b), add both lines to the enumeration: `stall-watchdog: '<branch>' -> reset to the last commit and resume (restart #<n>)` and `job: auto-resume <n>/<max> of '<branch>' after <why>, …`.
   - Either require the sentence to cover every non-fresh spawn with a generic clause (for example "or the line a resume, a stall-watchdog restart or a job logs in its place"), or require it to name all six lines. Change the suggested sentence to match.
   - Add to `**Verification:**` a bullet that enumerates every `spawn_engine` call site in the template and confirms the sentence holds for each one.
   - In the story index → `## Context` item 2, extend the bulleted list the same way.

## Should Fix

## Nice to Have
