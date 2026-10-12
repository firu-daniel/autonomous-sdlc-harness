### Task 2 — Rewrite the eight per-item point-review state-dir READMEs for next-free keying, own-layer reads and unit commits

**Goal:** Make the eight README contracts for the per-unit `layer-reviewer` findings folders describe the behaviour this branch gives them:

- every layer of a unit writes into the unit's one folder at the next free index, so no layer overwrites another;
- a fix iteration is handed the file **its own layer's** reviewer returned, never "the folder's most recent file";
- the folder is committed in the unit's own commit.

**Where this layer stops.** README text under `cli/templates/state-dir/` only. The loop that implements the behaviour is the `plugin` layer's: Task 7 for the keying and reader, Tasks 9 and 10 for the commit. Describe the contract below as stated. Cite plugin assets by `${CLAUDE_PLUGIN_ROOT}/…` and heading, the form these READMEs already use, and never by line or step number.

**The contract these READMEs describe:**

- **Keying.** Immediately before each `layer-reviewer` dispatch, the unit loop lists the unit's folder and passes one past the highest `review_<n>.md` there, or `0` if none, as `iteration:`. The loop's per-layer counter only caps the loop and labels the heartbeat. So a `**Finding K**` / `**Test K**` unit whose tag spans two layers keeps both layers' files in one interleaved series, and none is overwritten.
- **The reader.** On a FAIL the implementer is handed the `findings_file:` path that **this layer's** reviewer returned, not a folder listing, which under interleaving can belong to the other layer. Each file's title names its layer (`# <layer> review — <task_heading> — iteration <n>`).
- **The commit.** The unit's commit stages the folder explicitly, so the files are tracked from that commit on. The committer leaves them out of its "did this commit land any work" test, so a unit whose only change is the readiness flip is still reported as index-only.
- **When it runs.** Unchanged: only where the flow runs the per-unit review step (`<per_unit_review>` `on`).

### Targets

- `cli/templates/state-dir/task_plan_point_reviews/README.md`
- `cli/templates/state-dir/review_plan_point_reviews/README.md`
- `cli/templates/state-dir/skeptic_review_point_reviews/README.md`
- `cli/templates/state-dir/architecture_branch_review_point_reviews/README.md`
- `cli/templates/state-dir/business_parity_branch_review_point_reviews/README.md`
- `cli/templates/state-dir/qa_review_point_reviews/README.md`
- `cli/templates/state-dir/test_fix_point_reviews/README.md`
- `cli/templates/state-dir/user_review_fix_plan_point_reviews/README.md`

**Work:**

- [ ] Numbering sentence, in all eight files. Each currently says `review_<iteration>.md` / `review_<i>.md` is "numbered from `review_0.md` and incremented on each failed one", and `task_plan_point_reviews` adds "The counter is per task, and per layer within a task, so it restarts". Rewrite it to the next-free keying above. In `task_plan_point_reviews` say that a story task is single-layer, so its folder is one layer's series. In the seven fix-item folders say that a multi-layer item's folder interleaves its layers' files.
- [ ] Reader sentence, wherever a file says the implementer "is handed the folder's most recent file" or the equivalent (`task_plan_point_reviews`, `review_plan_point_reviews`, `test_fix_point_reviews`, `user_review_fix_plan_point_reviews`, and any other of the eight carrying it). Replace it with the own-layer returned-path rule.
- [ ] Commit sentence, wherever a file says "the whole directory is committed with the branch, since no ignore rule reaches it". Replace it with the unit's-own-commit rule and the reconciliation exclusion. Keep each file's mistake-worth-naming paragraph unchanged unless it states the overwritten numbering.

**Verification:**

- `git grep -n -E -e 'most recent' -e 'restarts' -e 'numbered from .?review_0' -- cli/templates/state-dir/*_point_reviews` prints no line asserting most-recent reading or per-layer restart.
- Each of the eight files keeps its `# <dir>/` heading, its writer/reader/mistake paragraphs and its `item_<N>` / `item_<K>` / `task_<N>` keying facts unchanged. Only the numbering, reader and commit sentences move.
- No `{{…}}` token and no line number is introduced.
