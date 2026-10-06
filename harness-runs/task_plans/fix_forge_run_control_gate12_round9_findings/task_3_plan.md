### Task 3 — `stop --branch-gone` reports on the run's unmerged pull requests that still read unfinished

**Goal:** After a branch deletion, the run's pull request, which GitHub closed with the deletion, reads `sdlc-harness: stopped`, carries the `stopped` comment, and has its progress comment marked `stopped`. Gate 12 round 9, finding 3: the deletion's job stopped the run, but posted and labelled on issue #17 only. Pull request #19 kept `sdlc-harness: running`, got no `stopped` comment, and its progress comment stayed at "Fix plan: in progress". Its own `pull_request` close job deferred to the deletion's job, as designed.

**Depends on:** Task 2, which adds `forge_progress_stopped <pr> <branch>` to `remote-run.sh`. It rewrites the newest bot progress comment on `<pr>` for `<branch>`, turning `- <label>: in progress` into `- <label>: stopped`. It always returns 0, and it makes no `gh` call when `execution.progressComments` is off. This task calls it once per pull request it reports on, with that signature. Task 2 also calls it for `FORGE_PR` on every other `stopped` report. Do not change that call.

**Which pull requests, and why.** Once the head branch is gone, no pull request of it is open, so the open-PR lookup (`forge_pr_var`) finds nothing, and `forge_recognised` cannot read a deleted branch either. This task adds a lookup of its own, `forge_gone_prs_var <branch>`, which sets `FORGE_GONE_PRS`, a space-separated list of numbers. It makes one call, `gh pr list --repo "$FORGE_REPO" --head "<branch>" --state all --json number,isCrossRepository,mergedAt,labels --limit 10`, and keeps each pull request that:
- comes from this repository (`isCrossRepository` is `false`);
- is not merged (`mergedAt` is null);
- carries a label `STATE_LABEL_PREFIX` + `running`, `parked` or `paused`. These are the labels of the states `control_close` stops (`running`, `parked`, `park_loop`, `paused`; `park_loop` is labelled `parked`).

The label test stands in for `forge_recognised`. It also excludes an earlier pull request of the same branch that a previous stop or a merge already settled, such as round 8's #13 and round 9's #18, which read `sdlc-harness: stopped`. A failed listing, or an answer that is not the expected JSON, is one stderr line and an empty list, and the issue is still reported.

**Where this task stops.** The issue keeps its comment and its label exactly as today, read from the task prompt at the newest run's `headSha`. This task adds the pull requests beside it. `control_close`'s quiet close of a pull request whose branch is gone stays quiet, because one job reporting one stop is the design. Only its log line and comment change, to say that the deletion's job reports on that pull request. The adopter documents are **Task 5's**.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - a new function `forge_gone_prs_var`, placed after `forge_pr_var`;
  - `forge_report`'s `gone` branch, its function comment ("`gone`, the branch deleted on GitHub, …") and the code comment "GitHub closes a pull request whose head is deleted, so none is open.";
  - the header's `stop` paragraph, at the `--branch-gone` sentences;
  - the header's `THE CLOSE.` gate 6;
  - `control_close`'s code comment above its `remote_branch_exists` check, and its `control_close_ignore` literal there.
- `cli/test/remote-run.test.mjs`: the `stop --branch-gone …` case and new cases beside it.
- `cli/test/remote-control-close.test.mjs`: the `branch deleted: …` cases and the `a pull request closed because its branch was deleted does nothing …` case, only as far as the new calls and the changed ignore line require.

**Work:**

- [ ] **`forge_gone_prs_var`.** As described above. Build the label names from `STATE_LABEL_PREFIX`, never a typed `sdlc-harness: ` literal. Use `gh_call`, so `GH_ERR` names a failure.
- [ ] **`forge_report`, `stopped` with `gone`.**
  - Keep the issue lookup (`forge_issue_at_commit_var`) and `FORGE_PR=""`.
  - Call `forge_gone_prs_var "$br"`.
  - The target rule for `gone` becomes:
    - the issue gets the comment and the label as today, when it is known;
    - **then**, for each number in `FORGE_GONE_PRS`, the same `stopped` text, with `<note>` and the run URL, is posted through `forge_comment <n> stopped "$br" <file>`, followed by `forge_set_state <n> stopped` and `forge_progress_stopped <n> "$br"`.
  - "Nothing posted" becomes the outcome only when neither an issue nor a pull request is known.
  - The closing line names every item reported on: `stopped on <br> reported on #<a>[, #<b>…]`.
  - Replace the comment "GitHub closes a pull request whose head is deleted, so none is open." with one saying that no pull request of a deleted head is open, so the run's unfinished ones are found in every state by `forge_gone_prs_var`.
- [ ] **The header and `control_close`.**
  - `stop` paragraph: at the sentence where `--branch-gone` makes (4) read the issue at `headSha`, append: (4) also reports on each pull request of the branch from this repository that is not merged and still carries `running`, `parked` or `paused`. Each gets the same comment, the `stopped` label and its progress comment marked stopped (`forge_gone_prs_var`, `forge_progress_stopped`).
  - `THE CLOSE.` gate 6: "the `delete` event's job stops the run" becomes "the `delete` event's job stops the run and reports it on this pull request".
  - `control_close`: the code comment likewise. The ignore literal becomes `the branch \`$b\` of pull request #$CONTROL_NUMBER is gone from origin; the deletion's own job stops the run and reports it here`. Its opening, up to `is gone from origin`, stays byte-identical, because suites match that part.
- [ ] **Tests in `remote-run.test.mjs`.** The `pr list` stub answers `STUB_PRS` whatever the arguments. If a case needs the `--state all` listing to differ from the open-PR listing, add an env-keyed answer to the stub for `--state all`, and say so in the suite header.
  - Extend `stop --branch-gone marks on the default branch …`: with `STUB_PRS` empty, the issue alone is reported, as before.
  - New case. `STUB_PRS` lists:
    - #19, same repository, unmerged, `sdlc-harness: running`;
    - #18, same repository, unmerged, `sdlc-harness: stopped`;
    - #13, merged;
    - #21, cross-repository, `sdlc-harness: running`.

    Expect `stopped` comments on issue #7 and on #19 only, a `sdlc-harness: stopped` label POST on #7 and #19 only, the progress comment listing of #19 (with `STUB_COMMENTS` carrying an `in progress` progress comment, one `PATCH` of it), and no write to #18, #13 or #21.
  - New case. With no issue known (the contents read fails) and #19 as above, #19 gets the comment and the label.
  - New case. A failing `pr list` still reports on the issue, with one stderr line naming the failed listing.
- [ ] **The suites whose deletion or quiet close now differs.** Run:

  ```
  git grep -nE "branch-gone|is gone from origin|'delete', deleted|pr list" -- cli/test
  ```

  Update each exact call list or count on a deletion path to include the `pr list --state all` call, and each match on the ignore line that runs past `is gone from origin`. Change no other assertion. Name in your return each suite you edited and each one you judged and left alone.

**Verification:**

- `npm test --workspace cli -- test/remote-run.test.mjs`, from the repository root, passes. So does `npm test --workspace cli -- test/remote-control-close.test.mjs` when this task edited it, and any further suite it edited, each run the same way, one file at a time.
- `bash scripts/typecheck.sh` exits 0.
- End-to-end through the real caller: one of `remote-control-close.test.mjs`'s `branch deleted` cases is run with `STUB_PRS` listing an unmerged same-repository pull request labelled `sdlc-harness: running`. It drives `control` on a `delete` event, through `control_close`, the `stop --branch-gone` child and `forge_report`, and shows that pull request commented and labelled `stopped`. Add that case if none of the existing ones can carry it.
- The story index's second `Top risks:` entry, a settled pull request relabelled, is shown by #18 and #13 receiving no write in the new `remote-run.test.mjs` case.

**Deviations from plan:**
- `remote-run.test.mjs`'s stub has no `STUB_COMMENTS`; its comment listing is `STUB_ITEM_COMMENTS`, used instead, and the stub now passes each comment's `id` through (absent ids still drop out of the JSON), because `forge_progress_comment_var` picks by `id`.
- The one-comment body write moved into a new helper `forge_report_text`, so the issue and each listed pull request get the same text without duplicating the block; `forge_report`'s temporary directory is now removed after the pull-request loop.
- The header's `stop` paragraph sentence following the inserted text now opens "The issue read rests on…" (was "That read…"), since "that" would otherwise point at the pull-request sentence.
- The `remote-control-close.test.mjs` end-to-end case does not assert the progress-comment edit: that suite's stub refuses any `--paginate` with a `--jq` other than its own, so `forge_progress_stopped` logs its "listing … refused" warning there and returns 0; the edit itself is asserted in `remote-run.test.mjs`.
