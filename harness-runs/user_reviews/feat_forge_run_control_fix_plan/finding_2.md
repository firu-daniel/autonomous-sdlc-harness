### 2. A round collects only the submitting reviewer's review and comments, so other reviewers' input and refused reviews are lost

**File:** `cli/templates/scripts/remote-run.sh` (`control_review_round`) — "select(.user.login == $who)"

Also touched by this finding: `cli/templates/scripts/remote-run.sh` (`verb_review`, the note block) — "note=\"Round $round\""; the header's `control` paragraph — "# THE REVIEW. A `pull_request_review` event reads" (the round rule sits a few lines below it, from "One submitted review is" onward); `cli/templates/state-dir/user_reviews/README.md` — "Its layout — the review's text, a provenance line"; `plugin/agents/user-review-fix-plan-writer.md` (`## Process`, step 1 and step 2's **Pull-request review comment** bullet) — "the review body above the `---` line is one more"; `cli/test/remote-control-review.test.mjs` — "a comment by another user is absent".

**Problem.** `control_review_round` builds the round from the event's own review body and keeps only inline comments whose `user.login` equals the submitting actor (`select(.user.login == $who)`). So:

- the body of a review that was refused while a run was in flight is never written anywhere;
- inline comments by every other reviewer are dropped unless each of them submits a review of their own;
- two reviews submitted at the same moment start two control jobs that each number the next round from the same branch tip, and both race to push `<branch>_review_<n>.md`.

The time boundary ("created after the committer time of the newest round file") is also a gap: an item created between one job's listing and its commit falls before the next boundary and is never collected.

The outdated-comment part of the observation is **already implemented and must be kept**. When `line` is null the heading reads `original line <n> (outdated)`, `Made on commit` uses `original_commit_id // commit_id`, and the `diff_hunk` is fenced (case `an outdated comment reads original line <n> (outdated)`). Carry that rendering over unchanged.

**Fix.** Replace the single-review builder with one cumulative collector that `control` (Finding 1) and the new `collect` verb (Finding 3) both call. Suggested name: `round_collect <pr_number> <out_file>`, acting on the global `branch`. It does the following:

1. **Take `collected_at` before any listing**: `date -u +%Y-%m-%dT%H:%M:%SZ`.
2. **Read what earlier rounds consumed, from origin's tip.** List the branch's round files under `<state>/user_reviews/` with the existing anchored rule (`^(.+)_review(_[0-9]+)?\.md$`, captured branch equal to `branch`). Read each one with `git show refs/remotes/origin/<branch>:<path>` and parse its marker line (item 6). Recorded review ids and comment ids are the union over **all** marked rounds. The boundary is the `collected_at` of the highest-numbered marked round, minus a new constant `ROUND_OVERLAP_SECS=300`, which absorbs runner-clock skew. An overlap re-lists items, and the id check drops them again. When no round carries a marker (rounds placed before this change, or local `branch-user-review` rounds, which consume no pull-request item), keep today's legacy boundary: the committer time of the newest round file, or no boundary when there is no round.
3. **List both endpoints, paginated**: `repos/$FORGE_REPO/pulls/<n>/reviews` and `repos/$FORGE_REPO/pulls/<n>/comments`, the latter as today (never the per-review endpoint, which carries no `line`). When called from `control`, merge the event's own review (id, body, `html_url`, `submitted_at`, sender) into the review list if the listing does not carry it yet.
4. **Decide what is pending**:
   - a review is pending when its state, lowercased, equals `REVIEW_ROUND_STATE`, its body does not contain `COMMENT_MARKER`, its id is not recorded, and `submitted_at` is at or after the boundary;
   - an inline comment is pending when its id is not recorded, `created_at` is at or after the boundary, and its body does not contain `COMMENT_MARKER`. This covers every author's comments, whatever the state of the review they belong to.
5. **Authorise every author.** Call `authorise_actor <login> <user.type>` once per distinct author of a pending item, caching the answer per login. Drop the items of an author it refuses, with one stdout line naming the login, `AUTH_WHY` and how many items were dropped. A permission call that fails (arm 4) fails the collection, exactly as a failed listing does today; a missing permission answer never counts as a pass.
6. **Write the round file**, in this order:
   - one section per pending review, oldest `submitted_at` first (ties by id): `## Review by @<login>`, a blank line, the body verbatim or `(The review carries no summary.)`, a blank line, then `Requested changes on pull request #<n> (<html_url>) at <submitted_at>.`;
   - `## Inline comments` when any comment is pending, each rendered exactly as today, with one added line after `` Made on commit `<sha>`. ``: `By @<login>: <html_url>`;
   - a final marker line: `<!-- sdlc-harness round collected_at=<collected_at> reviews=<id,id,…> comments=<id,id,…> -->`. It lists every review and comment written to the file, and no dropped one.

   Drop the `---` line and the single provenance sentence `Submitted as a review requesting changes by …`.
7. **Return what the callers need**: the number of pending reviews requesting changes, the comma-joined reviewer logins in order, and — when called from `control` — the round number whose marker already records the event's review id, if one does. When no review is pending, write no file, so the caller places nothing.

Rounds are numbered as before: `review` derives them from the branch tip.

**`review`'s note.** Add `--reviewers <login,login,…>` to `verb_review` and to the usage block. Under it the `report round` note reads `Round <n> from pull request #<pr> by @a, @b`. With `--source` it also names the pull-request URL. Without `--reviewers`, the `--actor` / local-session wording stays as it is.

**Header and template prose.** In the `control` paragraph's `# THE REVIEW.` block, rewrite the text from "One submitted review is" (it wraps onto the next line) down to "nobody else's." so it states this collection rule, the marker and the layout. Update `cli/templates/state-dir/user_reviews/README.md`'s layout sentence to match ("one section per review requesting changes, its provenance line, each inline comment with its file, line, commit, author and diff hunk, and a closing marker line").

**The fix-plan writer reads this shape.** In `plugin/agents/user-review-fix-plan-writer.md` → `## Process`:

- In step 1, replace "the review body above the `---` line is one more unless it reads `(The review carries no summary.)`" with: each `## Review by @<login>` section is one observation unless its body reads `(The review carries no summary.)`, and each comment under `## Inline comments` is one observation. The closing `<!-- sdlc-harness round … -->` line is bookkeeping and no observation.
- In step 2's **Pull-request review comment** bullet, add the `By @<login>: <url>` line after `` Made on commit `<sha>`. `` in the quoted shape.

That file is this agent's own definition in the `plugin` layer. Grep `plugin/` for `` `---` line `` and `Inline comments`, and update every file that quotes the old shape in the same edit.

**Tests.** In `cli/test/remote-control-review.test.mjs`:

- teach the stub a paginated `pulls/<n>/reviews` listing (for example `STUB_PR_REVIEWS`), and per-login answers from `STUB_PERMISSIONS`;
- replace `a comment by another user is absent` with two cases: an authorised second reviewer's review body and inline comment are present, and an unauthorised commenter's are absent;
- add a case where two reviews requesting changes become one round file with two `## Review by` sections and one marker listing both ids;
- add a case where an id already recorded in a previous round's marker is absent;
- re-express `a reviewer comment from before the previous round is absent, and one after it is present` against the marked boundary and keep a legacy-boundary case;
- update the provenance assertions at the `Submitted as a review requesting changes by @alice` line to the new `Requested changes on pull request #12 (…)` line;
- update the file's header rule sentence to the new collection rule.
