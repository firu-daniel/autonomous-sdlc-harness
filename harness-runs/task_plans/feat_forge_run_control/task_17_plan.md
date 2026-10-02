### Task 17 — Grade the control workflow in `doctor`'s `forge` check

**Goal:** `doctor`'s `forge` check, the key's reporter, grades the second forge workflow from local evidence, as it grades the trigger. Its `github` pass then states that the whole coupling is delivered — the issue trigger, comment commands, review rounds, lifecycle comments, state labels and the draft pull request — and stops calling the last two parts "still to come" (acceptance 8). This keeps `ARCHITECTURE.md` → `## 8. Declaring a seam before building it`'s rule true: every reader of `forge` has a reporter that names its state.

**Depends on:**

- Task 1's `WORKFLOW_CONTROL_FILE` and `WORKFLOW_CONTROL_PATH`, and `COMMAND_HANDLE`, in `cli/src/remote/githubActions.ts`.
- Task 16, which writes `harness-control.yml` under `forgeTriggerApplies`.
- Task 2's `DEFAULT_TRIGGER_LABEL = 'sdlc-harness'`, which the pass text already reads.

**Where this task stops.** What GitHub says — whether it knows the control workflow, the pull-request setting, and the effective trigger label — is `remote-github`'s, Task 18's. This check stays offline (`cli/src/doctor/checks.ts` → the module header's choice 3), and its worst grade stays `warn`.

### Targets

- `cli/src/doctor/checks.ts` — `FORGE_CHECK` and its doc comment.
- `cli/test/doctor.test.mjs` — the `forge` cases.

**Work:**

- [ ] **The doc comment of `FORGE_CHECK`**: the two forge workflows are graded the same way. Delete the paragraph *"Draft-pull-request output and comment park-and-ask are not graded, because nothing implements them yet …"*, and replace it with what is now graded and what is left to `remote-github`.
- [ ] **Presence**, for `forge` `github` with remote execution on: `harness-control.yml` absent is a `warn` — comments and reviews start nothing; re-run `init`, which writes it create-if-absent. This sits beside the existing `harness-trigger.yml` warn. Each absent file is named, and both absent is one warning naming both.
- [ ] **Carried by `origin/<defaultBranch>`**: `harness-control.yml` not at that ref is a `warn` with the trigger's push remedy (`WORKFLOW_SCOPE_COMMAND`, `defaultBranchPushCommand`) and its reasons. GitHub runs an `issue_comment` workflow only from the default branch (research C2's `issue_comment` table). The two *not graded* notes for an unresolvable `defaultBranch` or a missing `origin/<defaultBranch>` cover both files.
- [ ] **The pass text**: both workflows are present and carried.
  - Labelling an issue with the `HARNESS_TRIGGER_LABEL` label (default `` `sdlc-harness` ``) starts a task run.
  - A `` `@sdlc-harness <verb>` `` comment, spelled from `COMMAND_HANDLE`, answers, pauses, resumes, stops or clears it.
  - A review requesting changes on the run's pull request starts a user-review round.
  - A completed run opens a draft pull request.
  - What this cannot see lives on GitHub: the label, the workflows GitHub knows, and the pull-request setting. Keep the existing `asked` clause pointing at `--check-github` or at `remote-github`.

  The words "still to come" no longer appear.
- [ ] **`doctor.test.mjs`**:
  - both workflows present and carried → a pass naming `harness-control.yml`, `@sdlc-harness` and the pull request, and not containing `still to come`;
  - `harness-control.yml` absent → a warn naming it and `init`;
  - present but not on `origin/<defaultBranch>` → a warn naming the push;
  - `forge` `none` with both files left behind → the existing pass, naming both as unused;
  - every pre-existing `forge` case adjusted to the new pass text.

**Verification:**

- `npm test -- test/doctor.test.mjs` from `cli/` passes.
- `git grep -n "still to come" -- cli/src` finds nothing.
