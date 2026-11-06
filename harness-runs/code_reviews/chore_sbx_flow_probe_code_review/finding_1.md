### 1. The stall-watchdog restart line can be followed by a `-> failed` line with no spawn, so "no `not launching` line after it" does not prove the profile passed

**File:** `docs/watcher.md` (`### The per-run profile`) — "with no `not launching '<branch>'` line after it"

The added paragraph says the `watcher.log` record that the render and the check both passed is the line logged before the spawn (the fresh-launch line, "or the line a resume, a stall-watchdog restart or a job logs in its place") with no `not launching '<branch>'` line after it. That holds for every path except the stall-watchdog restart.

In `cli/templates/scripts/autonomous-watcher.sh`, the stall-watchdog branch logs `stall-watchdog: '$b' -> reset to the last commit and resume (restart #…)` ("reset to the last commit and resume"), then runs `hr_run_reset_var`. A reset refusal (`1) why="stalled ${staleness}s, the reset was refused …"`) or an unsafe state directory (`why="stalled ${staleness}s, the state directory in $worktree is not safe to write"`) then sets `why`, and the block logs `stall-watchdog: '$b' -> failed ($why)`, sets the record `failed` and `continue`s. It never calls `spawn_engine`. So `run_profile_render` and `run_profile_check` never run, and no `not launching '<branch>'` line is logged.

That `watcher.log` therefore holds the restart line with no `not launching '<branch>'` line after it, which the new sentence says is the record that the render and the check both passed. In fact nothing was rendered or checked. The task prompt asks for the sentence to be checked against the code on every path the section describes. The story plan's claim 2 says every `spawn_engine` caller logs its line "before a spawn that renders, checks and records the same way", and this path does not.

**Fix:** in that same sentence of `docs/watcher.md`, replace

```
with no `not launching '<branch>'` line after it,
```

with

```
with no `not launching '<branch>'` line after it — nor, after a stall-watchdog restart line, a `stall-watchdog: '<branch>' -> failed` line, which that restart logs instead when it gives the run up before the spawn —
```

Keep it one sentence, as the task prompt's `## Done when` requires. Change nothing else in the document. This is a prose-only change, so it owes no test run.
