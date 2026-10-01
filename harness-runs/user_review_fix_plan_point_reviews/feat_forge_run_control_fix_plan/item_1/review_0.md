# cli review — 1. A review requesting changes is refused while a run is in flight, and the reviewer is told to resubmit — iteration 0

Verified by running `node --test test/remote-control-review.test.mjs test/remote-run.test.mjs test/workflow-templates.test.mjs` from `cli/`: 165 pass, 0 fail.

## Should Fix
1. **The exit map's `3` clause for `review` does not name the new jobs read** — `cli/templates/scripts/remote-run.sh` (module header, exit map `3`) — "for review, the listing failed, or the dispatch failed AFTER the review was pushed"
   `branch_settled_var` now makes a second `gh` read before anything is written: `gh_call api "repos/{owner}/{repo}/actions/runs/$id/jobs" || gh_fail "reading the jobs of run $id failed"`. That read runs whenever the newest run is not `completed`, and a failed or malformed answer exits 3. The exit map's `3` clause for `review` still names only "the listing" and the dispatch. Plan item 6 requires the header to state what the code now does. `.claude/context/cli.md` → `## What "done" means here` says a header is "worth exactly what the code under it still does". No caller branches on this distinction: exit 3 is still a `gh` failure with nothing written. That is why this is Should Fix, not Must Fix. This finding comes from reading the code; no failing jobs read was run.
   **Fix:** Change the clause to "for review, the run listing or the newest run's jobs read failed, or the dispatch failed AFTER the review was pushed".

## Nice to Have
1. **A stray blank line splits the header comment block** — `cli/templates/github/workflows/harness-control.yml` (header, after the `THE CONCURRENCY GROUP SERIALIZES REVIEW JOBS PER BRANCH, NEVER COMMENT JOBS.` paragraph) — "#   the group under exactly that name, and both files' headers declare it."
   The edit added an empty, uncommented line between the closing `#` of the new paragraph and `# TWO RULES EVERY EDIT KEEPS.`. Every other paragraph in this header is separated by a bare `#` line. YAML ignores the blank line, and no test parses across it, but the header no longer reads as one block.
   **Fix:** Delete the empty line after that paragraph's closing `#`.
