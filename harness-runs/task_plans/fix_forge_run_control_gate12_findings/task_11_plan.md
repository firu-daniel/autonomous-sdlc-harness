### Task 11 — Stop the run when its issue or pull request is closed or its branch deleted

**Goal:** Implement item 5's decision in `remote-run.sh control`. In any phase (initial run, park, pause, user-review round), the run stops when any of three things happens:
- its issue is closed;
- its pull request is closed or merged;
- its branch is deleted.

The stop is the same as `@sdlc-harness stop`, with a `stopped` comment naming the actor and the reason. Workflow runs and their `harness-state` artifacts are kept. A close by an actor who fails the §6 check is **ignored**. A run that already finished is left alone. Reopening resumes nothing.

**Depends on:** Task 9, which defines the `stop` interface this task calls as a child. Task 10 is the previous editor of `cli/templates/scripts/remote-run.sh`.

```
remote-run.sh stop <branch> --actor <login> --note <text> [--pr <n>] [--branch-gone] --repo <root>
```

`--note` replaces the `stopped` comment's note. `--pr <n>` sends the comment and label to that pull request, closed or not. `--branch-gone` dispatches the marker from GitHub's default branch, reads the issue from the newest run's `headSha`, and says the run cannot be resumed.

**Where this task stops.** The script side only:
- the workflow must listen to the three events, and that is **Task 13**'s — until it lands, nothing sends `control` these events;
- the cases are **Task 12**'s;
- the docs are **Tasks 17 to 19**'s.

### Targets

- `cli/templates/scripts/remote-run.sh` — `verb_control`, three new intake functions, a quiet form of `control_branch_from_issue`, a `control_close` arm, and the header's `` `control` IS THE COMMENT AND REVIEW ADAPTER `` paragraph and the `control` exit map.

**Work:**

- [ ] **Intake.** `verb_control` accepts `GITHUB_EVENT_NAME` `issues`, `pull_request` and `delete` beside the two it handles. Each event's fields are read by `event_field` (data, never shell source), each ignore is one line and exit 0 with no `gh` call, and each sets `CONTROL_VERB=close`:
  - **`issues`** reads `.action`, `.issue.number`, `.sender.login` and `.sender.type`; `.action` must be `closed`.
  - **`pull_request`** reads `.action`, `.pull_request.number`, `.pull_request.merged`, `.pull_request.head.ref`, `.pull_request.head.repo.full_name` and the sender. It requires `closed`, and a head repository equal to `GITHUB_REPOSITORY`.
  - **`delete`** reads `.ref`, `.ref_type` and the sender. It requires `ref_type` `branch` and a `valid_branch` ref.
- [ ] **Quiet gates — a close is never replied to.** Every refusal path for a `close` is one line and exit 0, with no comment, no label and no dispatch. In order:
  1. `HARNESS_REMOTE_STOP` is set;
  2. `forge_on` fails;
  3. the actor. For `issues` and `pull_request`, `authorise_actor` refused — the line names the login and `AUTH_WHY`, for example a triage user. For `delete`, only a `Bot` sender is checked, by `trigger_bot_listed` against `HARNESS_TRIGGER_ALLOWED_BOTS`, because deleting a branch already needs write access;
  4. the branch cannot be resolved. For an issue that is no start comment, through a quiet variant of `control_branch_from_issue`: refactor its search into `control_issue_branch_var <number>`, which sets the branch or returns 1, and have the comment path keep its refusal on top. For a pull request it is the head ref. For a deletion it is `.ref`;
  5. `hr_branch_is_protected` does not answer 1.
- [ ] **State.** Read the state with `control_state_var`. Act only on `running`, `parked`, `park_loop` and `paused`. `completed`, `failed` and `none` are *"left alone: the run on `<b>` is `<state>`"*, and a branch `remote_branch_stopped` already finds stopped is *"already stopped"*. Skip the ledger-at-tip check (`forge_recognised`) for a close: a deleted or merged branch may not carry one any more, and a listed `harness run <b>` run is what proves a harness run.
- [ ] **The stop.** Run the `stop` child, through `control_child`, with `--actor <login>` and `--note`:
  - *"Stopped because @<login> closed issue #<n>."*;
  - *"Stopped because @<login> closed pull request #<n>."* plus `--pr <n>`;
  - *"Stopped because @<login> merged pull request #<n>."* plus `--pr <n>`;
  - *"Stopped because @<login> deleted the branch `<b>`."* plus `--branch-gone`.

  For a run that can still resume, each note adds *"Its workflow runs and their `harness-state` artifacts are kept; comment `@sdlc-harness resume` while the branch exists to continue it."* Child exit 0 is exit 0. Any other is an `::error::` line naming `CHILD_LAST`, and exit 3, with no reply, because the item is closed.
- [ ] **Header.** Add a `THE CLOSE` paragraph to `control`'s header:
  - the three events and their fields;
  - the quiet gates, in order;
  - the state rule;
  - the four notes;
  - that reopening does nothing;
  - that a `pull_request` close job runs the pull request's merge-commit copy of the workflow, as a review job does (C2), while the script stays the default branch's.

  Extend the exit map's 0 and 3 lines for `close`.

**Verification:**

- Read `verb_control` against the header's `THE CLOSE` paragraph: every gate it names is present, in that order, and none of them calls `control_reply` or `control_refuse`.
- `grep -n "control_refuse\|control_reply" cli/templates/scripts/remote-run.sh` shows no new call reachable when `CONTROL_VERB` is `close`.
- `bash -n cli/templates/scripts/remote-run.sh` passes. The behavioural cases are Task 12's suite, which this task's own edits must satisfy.
