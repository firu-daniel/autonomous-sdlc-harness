### 1. A "Comment" or "Approve" review's summary text is dropped from the round

**File:** `cli/templates/scripts/remote-run.sh` (`round_collect`) — "select(((.state // \"\") | ascii_downcase) == $state)"

Also touched by this finding:

- `cli/templates/scripts/remote-run.sh`, the doc comment above `round_collect` — "every review requesting changes and every inline comment no earlier round consumed".
- `cli/templates/scripts/remote-run.sh`, the header's `# THE REVIEW.` paragraph — "Pending: a review whose state is" down to "`Requested changes on pull request #<n> (<url>) at <submitted_at>.`".
- `cli/templates/state-dir/user_reviews/README.md` — "one section per review requesting changes, its provenance line".
- `plugin/agents/user-review-fix-plan-writer.md` → `## Process`, step 1 — "each `## Review by @<login>` section is one observation".
- `docs/github-run-control.md` → `## 2. A review that requests changes starts a round` — the opening paragraph ("*Approve* and *Comment* start nothing, whatever their text."), **What the round carries.** ("one `## Review by @<login>` section per review requesting changes"), and **Comments left while a round runs are not lost.** ("Inline comments alone start no round, as *Comment* starts none.").
- `cli/test/remote-control-review.test.mjs` (the header rule sentence — "the round collects every review requesting changes and every inline comment") and `cli/test/remote-collect.test.mjs` (`settled, with an inline comment but no review requesting changes: nothing pushed or dispatched`).

**Problem.** `round_collect` selects a pending review only when its state, lowercased, equals `REVIEW_ROUND_STATE` (`changes_requested`). A review submitted as *Comment* or *Approve* still has its inline comments collected, because the comment filter does not look at the review's state. Its summary body, though, is never written anywhere. A reviewer who puts their feedback in the summary of a *Comment* review loses it without being told.

**Fix.** Keep the body of every submitted review from an authorised reviewer since the previous round, whatever its state. Record its id in the round marker so it is never taken twice. Attribute it the way requested-changes reviews are attributed today, and name its state. Starting a round does not change: only a review requesting changes starts one, and a *Comment* or *Approve* review rides along in the next round that one starts.

1. **Which reviews are pending.** In the `jq` program that builds `kept`, replace the state filter with this one. Every other filter (the marker check, `unseen($seen_r)` and `since_ok(.submitted_at)`) stays as it is:
   ```jq
   | [ .[] | ((.state // "") | ascii_downcase) as $s
       | select($s != "" and $s != "pending")
       | select($s == $state or ((.body // "") | test("\\S")))
       | select(((.body // "") | contains($marker)) | not)
       | select(.id | unseen($seen_r))
       | select(since_ok(.submitted_at)) ]
   ```
   - A `PENDING` review is a draft that has not been submitted, so it is excluded.
   - A review that is not requesting changes and whose body is empty or only whitespace is skipped, and its id is not recorded.
   - A review requesting changes with an empty body is kept as it is today, rendered as `(The review carries no summary.)`. The empty-body skip applies only to the reviews that ride along: a review requesting changes is what starts the round, and the fix-plan writer already skips that placeholder.
   - The `pull_request_review_id` clause in the comment filter needs no change. It now also covers a kept *Comment* or *Approve* review's draft comments, and the id check still stops any comment being taken twice.
2. **What starts a round.** `RC_REVIEWS` becomes the number of kept reviews whose lowercased state equals `REVIEW_ROUND_STATE`, counted after the authorisation pass, for example `jq -r --arg s "$REVIEW_ROUND_STATE" '[.reviews[] | select(((.state // "") | ascii_downcase) == $s)] | length'`. `round_collect` still returns 1, writing nothing, when that count is 0. As a result, *Comment* and *Approve* reviews and inline comments on their own start no round, from `control` or from `collect`. They stay unrecorded, so a later round collects them. `RC_REVIEWERS` lists the distinct authors of every review section written to the file, oldest first, as it does today. The started-round note therefore names every reviewer whose review the round took.
3. **Rendering.** The heading `## Review by @<login>` and the body handling stay as they are. Choose the provenance line by the review's lowercased state:
   - `changes_requested` → `Requested changes on pull request #<n> (<url>) at <submitted_at>.` This is today's line, unchanged.
   - `commented` → `Commented on pull request #<n> (<url>) at <submitted_at>.`
   - `approved` → `Approved pull request #<n> (<url>) at <submitted_at>.`
   - `dismissed` → `Reviewed pull request #<n> (<url>) at <submitted_at>; the review has since been dismissed.`
   - any other state → `Reviewed pull request #<n> (<url>) at <submitted_at> (state <state>).`

   Pass `REVIEW_ROUND_STATE` into the render `jq` call if you need it there. Sort order stays oldest `submitted_at` first, with ties broken by id. The marker's `reviews=` already lists every review written, so these ids are recorded with no further change.
4. **Prose of record:**
   - Header `# THE REVIEW.` paragraph: rewrite the pending-review sentence ("Pending: a review whose state is `REVIEW_ROUND_STATE`, …") and the file-layout sentence. A pending review is any submitted review (never `PENDING`) whose id is unrecorded, whose body carries no `COMMENT_MARKER`, whose `submitted_at` is at or after the boundary, and which either requests changes or has a non-blank body. A round is placed only when at least one pending review requests changes. Each section's provenance line names the review's state, using the five forms above.
   - The `round_collect` doc comment: say the same, and say that `RC_REVIEWS` counts only reviews requesting changes.
   - `cli/templates/state-dir/user_reviews/README.md`: change "one section per review requesting changes, its provenance line" to "one section per review — every review requesting changes, and every other review that carries a summary — with a provenance line naming its state".
   - `docs/github-run-control.md` §2:
     - Opening paragraph: after "*Approve* and *Comment* start nothing, whatever their text.", add that their summary is not lost, because it rides along in the next round that a review requesting changes starts.
     - **What the round carries.**: say the round carries every review from an authorised reviewer since the previous round, not only reviews requesting changes. The first bullet reads: one `## Review by @<login>` section per review, oldest first. A review requesting changes always gets a section, with its body or `(The review carries no summary.)`. A *Comment* or *Approve* review gets one only when its body is not empty. Each section ends with a provenance line naming the review's state.
     - **Comments left while a round runs are not lost.**: extend it to the summaries of *Comment* and *Approve* reviews. They start no round, as inline comments start none.
5. **The fix-plan writer reads this shape.** In `plugin/agents/user-review-fix-plan-writer.md` → `## Process` step 1, after "each `## Review by @<login>` section is one observation unless its body reads `(The review carries no summary.)`", add: whatever the review's state. The section's closing provenance line names that state (`Requested changes on`, `Commented on`, `Approved`, or `Reviewed … dismissed`), and an *Approve* or *Comment* section is verified like any other observation. Grep `plugin/` for `Requested changes on` and `Review by @`, and update every other file that quotes the shape in the same edit.
6. **Tests.**
   - In `cli/test/remote-control-review.test.mjs`, update the header rule sentence. Add these cases:
     - A `COMMENTED` review with a body, by an authorised reviewer, listed beside the event's `CHANGES_REQUESTED` review: the round carries both `## Review by` sections, the commented one ending `Commented on pull request #12 (…) at …`, and the marker lists both ids.
     - An `APPROVED` review with a body: same as the previous case, with `Approved pull request #12`.
     - A `COMMENTED` review with an empty body: no section, and its id absent from the marker.
     - A `COMMENTED` review whose id an earlier marker records: absent.
     - A `PENDING` review: absent.
   - In `cli/test/remote-collect.test.mjs`, add a case beside `settled, with an inline comment but no review requesting changes`: a settled branch with only a `COMMENTED` review carrying a body places nothing and dispatches nothing, with the same `no review requesting changes is pending on #12` line.
