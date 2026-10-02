# cli review — 1. A "Comment" or "Approve" review's summary text is dropped from the round — iteration 0

Verified by execution: `node --test --test-timeout=1800000 test/remote-control-review.test.mjs test/remote-collect.test.mjs` (run from `cli/`) reported 40 pass, 0 fail. The new ride-along, empty/whitespace/PENDING, marker-recorded and collect-side cases are among those 40. A grep of `cli/test` found no other suite that quotes the replaced header or README wording.

## Nice to Have
1. **Doc comment line not reflowed** — `cli/templates/scripts/remote-run.sh` (`round_collect` doc comment) — "review rides along in the next round one requesting changes starts; 3 a listing or a permission call failed; 4 the"
   The inserted clause was appended to an existing line, which now runs to about 120 columns. Every other line in the comment wraps at about 80.
   **Fix:** Reflow lines 4625–4628 of the comment so they wrap at the block's usual width.

2. **Nested em-dash parentheticals make the layout sentence hard to parse** — `cli/templates/state-dir/user_reviews/README.md` — "Its layout — one section per review — every review requesting changes, and every other review that carries a summary — with a provenance line naming its state"
   The sentence now has four em dashes. A reader can pair the first two ("— one section per review —") as the whole aside, which leaves "every review requesting changes … — is set by" reading as the subject. The finding dictated this wording, but punctuation is the implementer's to choose.
   **Fix:** Use parentheses for the inner aside: "Its layout — one section per review (every review requesting changes, and every other review that carries a summary) with a provenance line naming its state, each inline comment …, and a closing marker line — is set by …".

3. **"pending" now carries two senses side by side** — `cli/templates/scripts/remote-run.sh` (`round_collect` doc comment, and the header's `# THE REVIEW.` paragraph) — "submitted review (never `PENDING`)" next to "A comment belonging to a pending review is pending whatever its `created_at`"
   The new text uses `PENDING` for GitHub's draft state, while the surrounding prose uses "pending" to mean "not yet collected". A reader could take "a comment belonging to a pending review" to cover a GitHub `PENDING` draft, which is now excluded. The code is correct: `$ids` holds only kept reviews.
   **Fix:** Name the draft state as "a draft (`PENDING`) review", or call the collection sense "a kept review" in the comment-ownership sentence.

---

# general review — 1. A "Comment" or "Approve" review's summary text is dropped from the round — iteration 0

The `general` layer's own section, added below the `cli` layer's because both layers' iteration-0 reviews of this item share this path. Nothing above this rule was changed. Scope: `docs/github-run-control.md` and the two `harness-runs/` artifacts. Checked by reading the diff against the `jq` filter and render in `remote-run.sh` → `round_collect`, and by grepping the tracked tree outside `harness-runs/` and `examples/` for `Requested changes on`, `Review by @`, `every review requesting changes` and `carries no summary`. No probe was run. The `cli` suite result above covers the behaviour the doc describes.

## Nice to Have
1. **"every review" overstates what the round carries** — `docs/github-run-control.md` (`## 2. A review that requests changes starts a round` → **What the round carries.**) — "carries every review and every inline comment on the pull request, from every authorised reviewer, made since the previous round and not recorded by any earlier round, not only the reviews requesting changes"
   The round does not carry every review: `round_collect` skips a review that is not requesting changes when its body is empty or blank. The bullet two lines below says so, so a reader of the whole paragraph gets it right. The lead sentence alone is still false, and the trailing "not only the reviews requesting changes" repeats what "every review" already says.
   **Fix:** "carries every review requesting changes, every other review that carries a summary, and every inline comment on the pull request, from every authorised reviewer, made since the previous round and not recorded by any earlier round." This drops the trailing "not only …" clause and uses the wording of `cli/templates/state-dir/user_reviews/README.md`.
