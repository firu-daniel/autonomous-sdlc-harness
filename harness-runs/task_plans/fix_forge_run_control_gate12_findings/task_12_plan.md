### Task 12 — Close-and-delete suite for `control`

**Goal:** Cover item 5's acceptance criteria: *"suite cases for issue closed, PR closed, PR merged and branch deleted. Each stops a running run, posts `stopped` with the reason, sets the label, and keeps the workflow runs and artifacts. A close by an actor failing the §6 check is ignored with a log line. A completed run is left alone."* The absent-branch half of those criteria (*"`harness-resume.yml` and the automatic resume skip a branch absent on `origin`"*) is Task 10's, in `cli/test/remote-run.test.mjs`.

**Depends on:** Task 11, which makes `remote-run.sh control` handle `GITHUB_EVENT_NAME` `issues` (`.action` `closed`), `pull_request` (`closed`, same-repository head; `.pull_request.merged` picks the reason) and `delete` (`.ref_type` `branch`). Each is gated quietly, in order: the kill switch, `forge_on`, the actor (`authorise_actor`, or for a deletion only a `Bot` sender against `HARNESS_TRIGGER_ALLOWED_BOTS`), branch resolution and protection. Only `running`, `parked`, `park_loop` and `paused` are acted on, and a stopped branch is left alone. The action is the child `stop <b> --actor <login> --note <reason> [--pr <n>] [--branch-gone]` (Task 9). The notes are:
- *"Stopped because @<login> closed issue #<n>."*;
- *"Stopped because @<login> closed pull request #<n>."*;
- *"Stopped because @<login> merged pull request #<n>."*;
- *"Stopped because @<login> deleted the branch `<b>`."*

**Where this task stops.** A new test file only. The workflow's `on:` and `if:` are **Task 13**'s, with their own template assertions.

### Targets

- `cli/test/remote-control-close.test.mjs` (new).

**Work:**

- [ ] Header: the rule enforced — *a close or a branch deletion by an authorised actor stops an unfinished run exactly as `@sdlc-harness stop` does, says why, and deletes nothing; anything else is a log line with no write to GitHub.* Build the fixture and `gh` stub as `cli/test/remote-control.test.mjs` does. Copy its helpers rather than importing a test file. Use event files for the three new event names.
- [ ] Cases that stop. For each, the run list shows an in-flight `harness run <b>` run, and permission is `write`:
  - **issue #7 closed**: records `workflow run harness-run.yml --ref <b> -f action=stop -f branch=<b>`, a `run cancel` for the in-flight run, and a `stopped` comment whose body carries *"closed issue #7"*, and labels `sdlc-harness: stopped`;
  - **pull request #9 closed (not merged)**: the comment goes to #9 with *"closed pull request #9"*, and #9 is labelled;
  - **pull request #9 merged**: *"merged pull request #9"*;
  - **branch deleted**: the marker is dispatched with `--ref` equal to the stub's `defaultBranchRef`, the issue comes from the `contents/…?ref=<sha>` read, and the comment carries *"deleted the branch"* and *"cannot be resumed"*.
- [ ] In every stopping case, assert the stub recorded **no** `run delete`, **no** artifact `DELETE` and **no** `--method DELETE` on anything but a state label. The runs and artifacts are kept.
- [ ] Cases that do nothing, each asserting stdout's one line and that the stub recorded no `workflow run`, no `run cancel`, no comment POST and no label write:
  - a close by a `triage` user (permission `read`), whose line names the login and the reason;
  - a close of an issue with no start comment;
  - a closed pull request from a fork;
  - a `reopened` action;
  - a `delete` of a tag;
  - a run whose newest bundle says `completed`;
  - a branch already stopped (a `harness stop <b>` run newer than its `harness run <b>` run).
- [ ] A case where the `stop` child fails (the stub fails `run cancel`): exit 3, an `::error::` line, and no reply comment.

**Verification:**

- `npm test -- test/remote-control-close.test.mjs` from `cli/` passes.
- Every do-nothing case asserts on the recorded `gh` calls, the bytes the stub saw, not only on stdout. That is the layer's *"A refusal is asserted on the bytes"* rule, applied to GitHub writes.
- The file's header names what it does not cover — the workflow prefilter (Task 13) and the absent-branch skip (Task 10) — and where each is covered.

**Deviations from plan:**
- Also edited `cli/test/remote-control.test.mjs` → `another event name, or an unreadable event file, exits 1 with no gh call`: its "another event name" now sends `push`, since Task 11 made `issues` a handled event (Task 11's deviation note assigns that move to this task).
- The `gh` stub adds `repo view` (`STUB_DEFAULT_BRANCH`, `trunk`, so the deletion's `--ref` is shown to differ from the fixture's default branch) and a `contents/…` read (`STUB_CONTENTS`) to `remote-control.test.mjs`'s stub; the deletion case's run list carries `headSha`.
