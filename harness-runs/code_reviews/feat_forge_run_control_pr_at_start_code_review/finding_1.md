### 1. A thread the harness replied to in an earlier round is never replied to or resolved in a later round

**File:** `cli/templates/scripts/remote-run.sh` (`deliver_round_threads`) — "own_marker=$(forge_marker thread \"$branch\")"; and (`deliver_thread_reply`) — "forge_marker thread \"$branch\"; } >\"$file\""

`deliver_round_threads` leaves a thread alone when any comment in it carries `own_marker`, which is `forge_marker thread "$branch"` — `<!-- sdlc-harness event=thread branch=<branch> -->`. That marker carries no round, so the dedupe is per **branch**, not per **round**. The header states the intent as *"a thread already carrying the `thread` marker, so a re-run replies nothing twice"* — a re-run of the *same* round's `deliver`. What the code does is also block every later round.

The path that breaks, end to end:

1. Round 1 collects inline comment 101 (thread T). The fix plan files it under `## Out of scope / verified-OK`; round 1's `deliver` replies `Not changed in this round: <reason>` to T with the thread marker and leaves T open. (Or: Finding K is implemented, the reply is `Addressed in …` and T is resolved; the reviewer then unresolves it.)
2. The reviewer replies inside T (comment 105) as part of a new review requesting changes. `round_collect` takes every inline comment from `pulls/<n>/comments` that is unrecorded and carries no `COMMENT_MARKER`, thread replies included, so round 2 collects 105 (`comments=105`).
3. Round 2's fix plan implements the finding 105 became (`[x] **Finding K**`, `**Review comments:** 105`).
4. Round 2's `deliver`: 105 maps to thread T; `t_later` is `false` (105 is collected; the round-1 reply carries `COMMENT_MARKER`); `t_own` is `true` because round 1's reply contains `<!-- sdlc-harness event=thread branch=<branch> -->`. Result: `review comment 105's thread already carries this harness's reply; left alone` — no `Addressed in` reply and no `resolveReviewThread`.

That breaks the task prompt's acceptance criterion for item 13 (*"at a round's `completed`, every collected inline thread whose finding was implemented gets a reply naming the commit and is resolved"*), and it fails silently: the only trace is one ordinary log line.

**Fix:** scope the `thread` marker to the round, using the `round=<n>` field `forge_marker` already takes as its fifth argument, so the dedupe matches only a reply this same round already posted.

- [ ] In `deliver_thread_reply`, change the marker line from `forge_marker thread "$branch"` to:
  ```bash
  forge_marker thread "$branch" "" "" "$RC_MARKED_N"
  ```
  (`deliver_thread_reply` is called only from `deliver_round_threads`, after `round_markers_read` has set `RC_MARKED_N`.)
- [ ] In `deliver_round_threads`, change `own_marker=$(forge_marker thread "$branch")` to:
  ```bash
  own_marker=$(forge_marker thread "$branch" "" "" "$RC_MARKED_N")
  ```
  The marker string ends in ` -->`, so `round=1 -->` is never a substring of `round=12 -->`, and the `contains($own)` test stays exact.
- [ ] In the same file's header, `deliver` paragraph: replace *"and a thread already carrying the `thread` marker, so a re-run replies nothing twice"* with *"and a thread already carrying this round's `thread` marker (` round=<n>` included), so a re-run of the same round replies nothing twice while a later round still handles a thread an earlier round replied to"*; and change *"ending with `forge_marker thread <branch>`"* to *"ending with `forge_marker thread <branch>` and the round's ` round=<n>`"*.
- [ ] In `docs/github-run-control.md` → `## 2.`, the paragraph opening *"Each reply carries the hidden marker (`event=thread`)"*: change that opening to *"Each reply carries the hidden marker (`event=thread`, with the round's `round=<n>`)"*. In the bullet *"A thread already resolved, one the reviewer replied to after the round was collected, and one already carrying the harness's reply are left alone, so a re-run replies nothing twice."* replace *"one already carrying the harness's reply"* with *"one already carrying this round's reply"*.
- [ ] In `cli/test/remote-deliver-threads.test.mjs`: change `THREAD_MARKER` to `'<!-- sdlc-harness event=thread branch=feat_x round=1 -->\n'` (the fixture's round file is `feat_x_review.md`, round 1). Then add one case beside *"a thread already carrying the harness reply is not replied to again"*: the same page, but the pushed comment 106 carries another round's marker, `<!-- sdlc-harness event=thread branch=feat_x round=7 -->`. Assert one reply to 101 with the `Addressed in` body, `resolves(calls).length === 1`, and no `already carries` line in stdout. Run only that file: `npm test --workspace cli -- test/remote-deliver-threads.test.mjs`.
