### Task 13 — Turn a review requesting changes into the next user-review round

**Goal:** A review submitted with **changes requested** on a pull request from a harness branch, by an authorised reviewer, becomes the branch's next `<branch>_review[_<n>].md` round and dispatches `engine: user_review` (goal 2, acceptance 2). It does so through the same `review` verb the local relay uses: the working copy fast-forwards to `origin/<branch>`, the round is committed as `chore: add user review for <branch>` and pushed, and the dispatch is sent. **One submitted review is one round.** The round carries the review's body verbatim and every inline comment with its file and line. A review left as *Comment* or *Approve* starts nothing, and draft status plays no part.

**Depends on:**

- Task 1's `REVIEW_ROUND_STATE='changes_requested'`.
- Task 10's `control` verb: its gates (the stop variable, `forge_on`, Task 5's `authorise_actor <login> <type>`), `control_reply <exit> <text>`, `control_state_var`, and the `CONTROL_*` globals.
- Task 3's `forge_repo_var`, `forge_fetch_branch` and `forge_recognised <branch>`, the flow-progress-ledger test.
- Task 9's `remote-run.sh review <branch> --review-file <file> --allow-no-run --actor <login> --source <url> [--repo <root>]`:
  - 0 — placed, pushed and dispatched, with the round already reported as a comment naming the round, the source and `@<login>`, plus the `sdlc-harness: running` label;
  - 2 — refused, its last stderr line naming why, including a newest run that is neither `completed` nor `failed`;
  - 3 — the dispatch failed after the push, with the message naming the re-send;
  - 4 — placement failed and nothing was dispatched.

**Where this task stops.** How the fix-plan writer reads the round's inline-comment block is Task 20's, and the round's adopter-facing description is Task 19's (the template README) and Task 24's (the document). The workflow's prefilter, which skips a fork's review because its token is read-only (research C2), is Task 15's. This verb also refuses one, for a hand run.

### Targets

- `cli/templates/scripts/remote-run.sh` — the `pull_request_review` arm of `control`, the round-file builder, and the header's `control` paragraph.
- `cli/test/remote-control-review.test.mjs` (new) — the review contract.

**Work:**

- [ ] **Intake.**
  - `control` accepts `GITHUB_EVENT_NAME` `pull_request_review`. It reads `.action`, `.review.state`, `.review.body // ""`, `.review.id`, `.review.html_url`, `.review.submitted_at`, `.pull_request.number`, `.pull_request.head.ref`, `.pull_request.head.repo.full_name`, `.sender.login` and `.sender.type` with `event_field`.
  - Ignored with one line and no `gh` call: an action other than `submitted`; a state other than `REVIEW_ROUND_STATE`, compared lowercase because the REST API reports states in uppercase (C1); and a body containing `COMMENT_MARKER`.
  - A head repository other than `GITHUB_REPOSITORY` is ignored with one line and no reply, because a fork's review job holds a read-only token that cannot comment (C2). The workflow never runs it anyway.
  - Then the same gates as a comment, in the same order, each refusal a reply on the pull request.
- [ ] **The branch checks**, each a reply and exit 2:
  - the head is protected or unresolvable (`hr_branch_is_protected`);
  - after `forge_fetch_branch`, `forge_recognised` fails — not a harness branch;
  - `origin/<head>` carries no `<state_rel>/story_plans/<head>_story_plan.md` — a round needs the story index, because the round's statistics step reads it (`plugin/agents/statistics-plan-writer.md`), so the reply says the round cannot start on this branch.
- [ ] **The inline comments.**
  - One `gh_call api --paginate repos/$FORGE_REPO/pulls/<n>/comments` keeps the comments whose `user.login` is the reviewer and that either carry `pull_request_review_id` equal to `.review.id`, or were created after the **previous round's boundary**. That boundary is the committer time (`%cI`) of `git log -1 refs/remotes/origin/<head> -- '<state_rel>/user_reviews/<head>_review.md' '<state_rel>/user_reviews/<head>_review_[0-9]*.md'`. A branch with no round yet has no boundary, so every comment of the reviewer is kept.
  - Use the pull request's comments endpoint, never the per-review one, which returns no `line`, `side` or `original_line` (C1, measured).
  - So the reviewer's own earlier *Comment*-state inline comments, including those left while the previous round ran, reach this round. Comments by anyone else are not collected, because only the submitting reviewer has vouched for them.
  - Sort by `created_at`.
- [ ] **The round file**, written to a `${RUNNER_TEMP:-<mktemp -d>}` file:
  - The review body verbatim, or the line `(The review carries no summary.)` when empty.
  - A `---` line, then a provenance sentence: `Submitted as a review requesting changes by @<login> on pull request #<n> (<review url>) at <submitted_at>.`
  - When comments were kept, a `## Inline comments` section, with one `### \`<path>\`, line <line>` heading per comment. An outdated comment, whose `line` is null, reads `original line <original_line> (outdated)`. Each heading is followed by `Made on commit \`<original_commit_id or commit_id>\`.`, the comment body verbatim, and its `diff_hunk` in a fenced `diff` block.
  - The fence uses one more backtick than the longest backtick run in that hunk, at least three, so no hunk closes it early.
  - Each comment keeps its commit and hunk, not the line alone, so `user-review-fix-plan-writer` can re-locate it after a round's fixes moved the code (the *Stale line numbers* lead).

  Then run `bash "$script_dir/remote-run.sh" review <head> --review-file <file> --allow-no-run --actor <login> --source <review url> --repo "$root"` as a child and map its exit:
  - 0 → exit 0, with nothing more posted;
  - 2 → a reply quoting its last line. When that line names a run in flight, add `A round is in progress; submit your review again once it completes.` Exit 2.
  - 3 → a reply quoting the re-send line, exit 3;
  - 4 → a reply that placement failed and nothing was dispatched, exit 4.

  The header's `control` paragraph states each rule above.
- [ ] **`cli/test/remote-control-review.test.mjs`** opens with its rule: *only a review requesting changes, by a write-or-admin reviewer, on a recognised same-repository harness branch carrying a story index, starts a round; it carries the body verbatim and the reviewer's inline comments with file, line, commit and hunk; anything arriving while a run is in flight is refused with a reply.*
  - **Fixture:** Task 10's, plus the story index on `feat_x`.
  - **The `gh` stub** answers `api …/pulls/<n>/comments` from `STUB_PR_COMMENTS`, and a completed newest run by default.
  - **Cases:**
    - `changes_requested` with two inline comments by the reviewer → `origin/feat_x` gains `chore: add user review for feat_x` placing `feat_x_review.md`, which holds the body, both paths and lines, both commits and both hunks, then one `-f engine=user_review` dispatch;
    - `CHANGES_REQUESTED` → the same;
    - `approved` and `commented` → no `gh` call;
    - an outdated comment (`line` null) → `original line <n> (outdated)`;
    - a comment by another user → absent;
    - an earlier reviewer comment from before a previous round's commit → absent, and one after it → present;
    - a `read` reviewer → a reply, no push;
    - no ledger → a reply;
    - no story index → a reply;
    - an `in_progress` newest run → a reply naming the in-flight round, origin unchanged;
    - no run on GitHub at all → placed and dispatched (`--allow-no-run`);
    - a cross-repository head → no `gh` call;
    - a hunk carrying a triple-backtick line → fenced with four backticks.

**Verification:**

- `npm test -- test/remote-control-review.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "reviews/.*comments" -- cli/templates/scripts/remote-run.sh` finds no code hit: the per-review endpoint, which lacks line numbers, is never used.
