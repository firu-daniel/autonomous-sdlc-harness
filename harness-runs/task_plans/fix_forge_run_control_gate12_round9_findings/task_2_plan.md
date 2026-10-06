### Task 2 — A `stopped` report rewrites the progress comment's `in progress` line to `stopped`

**Goal:** After a run is stopped, its progress comment no longer reads `in progress`. Gate 12 round 9, finding 3: pull request #19's round-5 progress comment stayed at "Fix plan: in progress" after the run was stopped. The same stale line follows every stop, whatever the route (`@sdlc-harness stop`, a local `remote-run.sh stop`, closing the issue or the pull request, deleting the branch), because the cancelled job's last progress pass is withheld for a stopped branch. So this task makes every `stopped` report rewrite the progress comment on each pull request the report labels.

**Where this task stops.** This task adds the rewriting function and calls it from `forge_report`'s `stopped` path for `FORGE_PR` when that is set (a plain stop whose target is the pull request, and a close passing `--pr`). **Task 3** makes the deletion's stop find the run's pull requests, and calls this same function for each one. This task does not change which items a `stopped` report comments on or labels. A later resume needs nothing new: `forge_progress` re-renders the comment from the ledger on the resumed job's first progress pass, and its body then differs, so it edits the comment back.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - a new function `forge_progress_comment_var`, placed immediately before `forge_progress`: the one owner of finding the run's progress comment on a pull request;
  - `forge_progress`'s comment listing and selection (the `gh_call api --paginate …/comments` call and the `jq -s` pick), replaced by a call to `forge_progress_comment_var`, its observable behaviour unchanged;
  - a new function `forge_progress_stopped`, placed after `forge_progress`;
  - one call to it in `forge_report`, after the `forge_set_state` lines, on `stopped` only;
  - in the header's `report` paragraph, the sentence "A plain `stopped` on a pull request says its draft stays open and closing it discards the run.";
  - in the header's `progress` paragraph (the one stating "the only comment this file ever edits"), one added sentence.
- `cli/test/remote-progress.test.mjs`: new cases for `forge_progress_stopped`, driven through `report stopped`.

**Work:**

- [ ] **One owner for the lookup: `forge_progress_comment_var <pr> <marker> [any-round]`.** Today `forge_progress` alone lists a pull request's comments and picks the progress comment. Move that lookup, and only that, into this new function, placed immediately before `forge_progress` with its own function comment, so that `forge_progress_stopped` calls it rather than copying it (`.claude/context/conventions.md` → `### Where a new responsibility goes`).
  - **It owns:**
    - the listing, `gh_call api --paginate "repos/$FORGE_REPO/issues/<pr>/comments" --jq '.[] | {id, login: .user.login, body}'`, moved verbatim from `forge_progress`;
    - the selection: objects with `.login == "github-actions[bot]"` and a numeric `.id`, whose last non-empty line (after `gsub("\r"; "")`) matches the marker, then `max_by(.id)`. With no third argument the match is exact equality with `<marker>`, as today. With `any-round`, the last line also matches when it equals `<marker>` with its trailing ` -->` replaced by ` round=<digits> -->`. Build that test in `jq` from the `<marker>` argument (strip the ` -->` suffix, require the remainder to be ` round=` followed by digits). Never use a hand-typed marker literal.
  - **It sets** `PROGRESS_COMMENT_ID` and `PROGRESS_COMMENT_BODY` (the picked comment's id and body), both empty when nothing is picked.
  - **It returns** 0 when the listing parsed, whether or not a comment was picked; 1 when `gh_call` refused the listing, leaving `GH_ERR` as `gh_call` set it; 2 when the output is not the expected JSON. It prints nothing; each caller keeps its own lines.
  - **Not shared:** the temporary file. Each caller keeps creating and removing its own under `RUNNER_TEMP` or a `mktemp -d`, because `forge_progress` needs its file before the lookup (to render the wanted body) and `forge_progress_stopped` needs one only after it (for the `PATCH`). Say so in the new function's comment.
  - **`forge_progress` calls it** as `forge_progress_comment_var "$FORGE_PR" "$marker"`, keeping its observable behaviour byte for byte. Return 1 prints the existing "`listing the comments of #$FORGE_PR was refused, so the progress is not posted: $GH_ERR`" warning. Return 2 prints the existing "`… are not the expected JSON …`" warning. An empty `PROGRESS_COMMENT_ID` takes the existing create branch. Otherwise `forge_progress` itself makes the `same`/`differs` decision, comparing `PROGRESS_COMMENT_BODY` with `$file.full` under the same `norm` (`gsub("\r"; "") | sub("\n+$"; "")`) it uses today, for example with `jq -n --arg body … --arg want …`. That comparison stays in `forge_progress` because it is about the rendered ledger, not the lookup. The existing `same` and `PATCH` branches and their lines are unchanged.
- [ ] **`forge_progress_stopped <pr> <branch>`, and its call.** Always returns 0. Every problem is one line, `::warning::` for a refused `gh` call. Each gate below stops with one line:
  1. `hr_progress_comments` gates it, exactly as `forge_progress` does. When it is off or unreadable, make no `gh` call.
  2. Call `forge_progress_comment_var "<pr>" "$(forge_marker progress "<branch>")" any-round`. Return 1 or 2 prints one `::warning::` line naming `<pr>` (with `GH_ERR` on 1) and makes no edit.
  3. In `PROGRESS_COMMENT_BODY`, rewrite every line exactly matching `- <label>: in progress` to `- <label>: stopped`, and change nothing else. When no comment was picked, or no line matches, make no edit and print one `… nothing to mark stopped` line.
  4. Otherwise write the rewritten body to a temporary file under `RUNNER_TEMP` or a `mktemp -d` (this function's own, removed afterwards), and `PATCH` the comment: `gh_call api --method PATCH "repos/$FORGE_REPO/issues/comments/$PROGRESS_COMMENT_ID" -F "body=@<file>"`. A refusal is one `::warning::` line.

  **The call.** In `forge_report`, on `event = stopped` only, after the label lines: `[ -z "$FORGE_PR" ] || forge_progress_stopped "$FORGE_PR" "$br"`. No other event calls it.
- [ ] **The header.**
  - In the `report` paragraph, extend the sentence named above: a `stopped` report also rewrites the progress comment of each pull request it labels, its `in progress` line becoming `stopped` (`forge_progress_stopped`).
  - In the `progress` paragraph, add one sentence: after a stop, `forge_progress_stopped` edits that same comment, so it is still the only comment the file edits, and a resumed job's first progress pass renders it from the ledger again.
- [ ] **Tests.** In `remote-progress.test.mjs`, add cases that run `report stopped feat_x` with `STUB_PRS` set to an open pull request and `STUB_COMMENTS` carrying a progress comment:
  - **Task-run comment.** A task-run comment whose second line reads `- Implementation: in progress`. Exactly one `PATCH` of that comment's id, whose body reads `- Implementation: stopped`, with every other line byte-identical.
  - **Round comment.** A round comment (marker with ` round=2`) gets the same edit.
  - **Nothing in progress.** A comment with no `in progress` line gets no `PATCH`.
  - **Comments off.** `execution.progressComments` set to `false`: no comment listing.
  - **Not the bot's.** A comment from another login whose last line is the marker is not edited.
  - **The round matcher is anchored.** A bot comment whose last line is the marker for another branch (for example `feat_xy`), or the round form with a non-digit round, is not edited. The existing case "a round ledger with only the task run's comment listed posts a new comment marked with its round" already checks that the exact matcher, without `any-round`, keeps a round's comment apart from the task run's.

  The `report` fixture's other stubs stay as `remote-progress.test.mjs` already sets them.
- [ ] **The suites whose `stopped` path now makes a comment listing.** Run:

  ```
  git grep -nE "'stopped'|stop', 'feat_x'|action=stop" -- cli/test
  ```

  For each case where a `stopped` report has a pull request target and asserts an exact list or count of `gh` calls, add the new comment-listing call to its expectation. Change no other assertion. Name in your return each suite you edited and each one you judged and left alone.

**Verification:**

- `npm test --workspace cli -- test/remote-progress.test.mjs`, from the repository root, passes. Its existing `forge_progress` cases (a fresh ledger posts one, an unchanged ledger writes nothing, a moved phase edits in place, a round ledger with only the task run's comment posts a new one, comments off, no recognised pull request, docs engine, stopped branch) pass **with their assertions unchanged**. That is the check that the move into `forge_progress_comment_var` kept `forge_progress`'s behaviour byte for byte. This file is edited by this task, so running it is within the test-run rule. Run each further suite this task edited the same way, one file at a time.
- One owner: `git grep -nE "max_by\(\.id\)|issues/[^ ]*/comments\" --jq" -- cli/templates/scripts/remote-run.sh`. Every hit that selects or lists progress comments lies inside `forge_progress_comment_var`. Neither `forge_progress` nor `forge_progress_stopped` contains its own comment listing or `max_by(.id)` pick.
- `bash scripts/typecheck.sh` exits 0.
- End-to-end through the caller that matters: the *Task-run comment* case drives `report stopped`, the same entry point `verb_stop` reaches through `forge_report stopped`. Its single `PATCH` is the only write besides the comment and the labels.
- Grep `remote-run.sh` for `--method PATCH`. The only executable hits are the one in `forge_progress` and the one added here, and both edit the progress comment, so the header's "the only comment this file ever edits" still holds.
