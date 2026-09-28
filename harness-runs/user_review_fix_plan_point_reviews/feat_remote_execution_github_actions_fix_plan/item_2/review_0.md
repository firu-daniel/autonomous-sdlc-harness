# cli review — 2. A failing re-dispatch keeps the resume poller ticking forever, with no notification — iteration 0

Verified by running `npm run build` and `node --test` in `cli/`. All 955 tests pass, including the five new `poll` cases in `cli/test/remote-run.test.mjs` and the new `POLL_STATE_ARTIFACT_NAME` case in `cli/test/workflow-templates.test.mjs`.

## Nice to Have
1. **The `HARNESS_GH_CLI` mirror row lost its column alignment for no reason** — `cli/templates/scripts/remote-run.sh` (header, `MIRRORS OF \`cli/src/remote/githubActions.ts\``) — "#   HARNESS_GH_CLI      mirrors  GH_CLI_VARIABLE"
   The diff removed one space from this unrelated row (7 spaces became 6). It now lines up with neither the three rows above it (their `mirrors` starts at column 21) nor the new `POLL_STATE_ARTIFACT_NAME mirrors POLL_STATE_ARTIFACT_NAME` row. It is whitespace churn on a line this finding does not otherwise touch.
   **Fix:** Put back the original `#   HARNESS_GH_CLI       mirrors  GH_CLI_VARIABLE (the binary run as \`gh\`)` spacing. You can leave the new longer row unaligned, or realign all five rows to its width.

---

> The `cli` review above was already in this file when the `general` (catch-all) review for the same iteration ran. The `general` review is added below it so the `cli` findings are kept.

# general review — 2. A failing re-dispatch keeps the resume poller ticking forever, with no notification — iteration 0

## Must Fix
1. **A new shelled-out recursive removal** — `cli/templates/scripts/remote-run.sh` (`poll_state_load`) — "if ! rm -rf \"$previous\" || ! mkdir -p \"$previous\"; then"
   `.claude/context/conventions.md` → `## Shell assets` says: "**Never shell out to a recursive removal.**" That rule applies in every layer. This is the first `rm -rf` or `rm -r` in any shipped template under `cli/templates/scripts/`, and `HEAD` has none. The other scripts only use `rm -f` on named files. The recursive removal is also unnecessary. The directory only ever holds the one file the artifact carries (`$POLL_STATE_FILE_NAME`), and on the fresh checkout of a hosted tick, `previous/` does not exist at all.
   **Fix:** Replace the removal with a non-recursive one on the known file: `if ! mkdir -p "$previous" || ! rm -f "$previous/$POLL_STATE_FILE_NAME"; then`. Keep the existing "cannot create" line and the empty-state return. Then `gh run download` writes into an empty slot, and a stale copy from an earlier run on a reused self-hosted workspace cannot be read as this tick's state.

## Should Fix
1. **The docs overstate the retry count by one** — `docs/remote-execution.md` (`### Resuming without the local watcher`) — "A failed dispatch is retried on later ticks, at most `HARNESS_POLL_MAX_DISPATCH_FAILURES` times (default 3)"
   `poll_branch` counts every failed dispatch, including the first, and gives up when `failures -ge POLL_MAX_FAILURES`. With the default of 3, that is three attempts in total: the first dispatch plus two retries. The new test asserts exactly this: `assert.equal(workflowRuns(fx).length, 3)` after the fourth tick, in 'poll gives up on a dispatch that always fails…'. So "retried … at most 3 times" is wrong. An adopter who sets the variable to `1` and expects one retry gets none, because the first failure already notifies and stops. The table row and the script header ("failed re-dispatches of one paused run before it gives up") state it correctly. Only this paragraph is off. (Confirmed by reading `poll_branch` and the test assertion. The suite was not re-run for this review; the `cli` review above records a passing run.)
   **Fix:** Reword it as: "A failed dispatch is retried on later ticks until `HARNESS_POLL_MAX_DISPATCH_FAILURES` dispatches of the same paused run have failed (default 3, counting the first), or until the recorded reset is more than …".
