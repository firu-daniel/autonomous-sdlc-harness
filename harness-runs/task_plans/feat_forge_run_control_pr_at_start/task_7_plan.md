### Task 7 — `report`: turn the pull request back to draft when a round starts, and say the draft stays open on `failed` and `stopped`

**Goal:** The rest of item 4's draft-state rule. When a user-review round starts, its `round` report turns the run's pull request back to a draft (`gh pr ready <pr> --undo`). A park, a pause or a stop changes no draft state. A run that fails or is stopped leaves its draft pull request open, and the `failed` and `stopped` comments say so, naming the way on: close it to discard the run, or resume.

**Depends on:** Task 6, the previous editor of `cli/templates/scripts/remote-run.sh`. Through Task 3, `forge_pr_var` sets `FORGE_PR_DRAFT` (`true`/`false`/empty) beside `FORGE_PR`, and this task branches on `"$FORGE_PR_DRAFT" = false`.

**Where this task stops.** `forge_report`'s `round`, `failed` and `stopped` arms only. The flip to ready on `completed` is Task 6's, and the docs are **Task 15's** (the §5 table's draft-state column and these rows).

### Targets

- `cli/templates/scripts/remote-run.sh` — `forge_report` (`round`, `failed`, `stopped` arms; after the labels for `round`), and the header's `report` paragraph.
- `cli/test/remote-report.test.mjs` — cases for the three arms.

**Work:**

- [ ] `round`: after the comment and the labels, when the target is the pull request and `FORGE_PR_DRAFT` is `false`, run `pr ready "$FORGE_PR" --repo "$FORGE_REPO" --undo` through `gh_call`, with the token the caller runs with: the control job's or the `collect` job's token, or a person's own `gh` for a local `branch-user-review`. Success adds nothing more. A refusal is one `::warning::` line naming `GH_ERR`, never a non-zero exit, since `forge_report` always returns 0. On a plan without drafts the undo is refused, and that warning is the whole cost. Append *This pull request is a draft again until the round completes.* to the round comment's text only when `FORGE_PR_DRAFT` was `false` before the call. The comment is written before the call, so state the intent: the warning line records a refusal.
- [ ] `failed`: read the run's engine from the registry record (`hr_registry_get "$registry_file" "$br" engine`, read only when the registry file exists, as `pause_reason` already is). On a pull request, for a round (`user_review`), keep today's text and add *This pull request stays open.* For a run, write: *The harness run on `<branch>` failed. Its log is `run.log` in the run's `harness-state` artifact. This draft pull request stays open: close it to discard the run* followed, when `FORGE_ISSUE` is set, by *, or re-apply the label `<trigger label>` to issue #<n> to start a new run on the next indexed branch*. A review requesting changes is not offered as the way on for an unfinished task run, because it would start a round over work that never completed. The issue-target text stays as it is.
- [ ] `stopped`: on the plain pull-request path (no `--pr`, not `gone`), append *Its draft pull request stays open; closing it discards the run.* The closed-pull-request path (`--pr`) and the deleted-branch path (`gone`) stay as they are, since that pull request is already closed. Leave the `parked`, `park_loop`, `paused`, `resumed` and `not_started` arms untouched: none of them flips anything.
- [ ] The header's `report` paragraph: state the `round` undo and its refusal line, the engine-dependent `failed` text, and the `stopped` sentence. Add one line that no other event changes a pull request's draft state.
- [ ] `cli/test/remote-report.test.mjs`: make the stub answer `pr ready` and log it. Cases: `report round feat_x` with pull request 12 `"isDraft":false`, which gives one `pr ready 12 … --undo` and a round comment carrying the *draft again* sentence; with `"isDraft":true`, which gives no `pr ready` call; with the undo refused, which gives one `::warning::` line, exit 0, and the label still `running`; `report failed` with the registry engine `task` and an issue, which gives the pull-request comment naming *close it* and the label re-apply route; with the engine `user_review`, which gives the review-requesting route plus *stays open*; `report stopped` with a pull request, which gives the *stays open* sentence; and `report paused` with a ready pull request, which gives no `pr ready` call.

**Verification:**

- `npm test --workspace cli -- test/remote-report.test.mjs` passes, run once from the repository root as one plain foreground command.
- `bash scripts/typecheck.sh` passes.
- Grep `remote-run.sh` for `pr ready` call sites (outside comments) and find them only in `verb_deliver` (Task 6's ready flip) and in `forge_report`'s `round` arm (this task's `--undo`). The draft state has one owner per transition.
