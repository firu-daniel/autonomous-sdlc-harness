### 7. `github-run-control.md` says `answer` works on a run whose job never started; it is refused

**File:** `docs/github-run-control.md` → `## 1. Commands in a comment` → the command table's `answer [<n>]` row — "a run whose job GitHub never started is answered with the engine its dispatch's comment recorded"

The *Accepted when* cell of the `answer` row now reads: "The run is parked and `<n>` is an open question; a run whose job GitHub never started is answered with the engine its dispatch's comment recorded". A run whose newest job never started is never `parked`. `remote_state` derives `paused` / `killed` when an older run carries a bundle or the engine is recovered, and `failed` otherwise (`cli/templates/scripts/remote-run.sh` → `remote_state`, "Cases 4 and 5"). `control_answer` refuses `paused`, pointing at `resume`, and refuses `failed` by naming it. An adopter who reads this row and types `@sdlc-harness answer <n>` on such a run gets a refusal. The recovered engine reaches the run through `resume`, which the `resume` row already states.

The `## 8.` table carries the same claim: its new `DISPATCH_MARKER_SLACK_SECS` row's *What rests on it* cell reads "Resuming or answering a run whose job GitHub never started".

**Fix:**
- [ ] In the `answer [<n>]` row's *Accepted when* cell, delete the clause from "; a run whose job GitHub never started" through "([§5](#5-lifecycle-comments-and-state-labels))". The cell is then "The run is parked and `<n>` is an open question".
- [ ] In `## 8.`'s row that opens "A dispatcher's comment lands within `DISPATCH_MARKER_SLACK_SECS`", change "Resuming or answering a run whose job GitHub never started" to "Resuming a run whose job GitHub never started".

This is a documentation-only fix and runs no test.
