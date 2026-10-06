### Task 10 — `control` accepts a branch the issue's `started` marker names, or whose `harness run` is queued or in progress

**Goal:** A branch the harness itself started a run on can be commanded from GitHub before its job has pushed a flow-progress ledger. Two cases need this.
- **Gate 12 round 8, finding 5.** The trigger said "Started a harness run on the branch `feat_invoice_currency_symbol`" at 04:46:41Z, and run `37415300051` was in progress. The owner's `@sdlc-harness stop` at 04:46:59Z was refused: *"`feat_invoice_currency_symbol` is not a harness branch: its tip carries no flow-progress ledger."*
- **A first run GitHub never started** (finding 3, and finding 6's Expected line, *"Every recovery path (`resume`, the poller, the form) works even when the failed job left no bundle"*). `verb_start` commits only the task prompt, so such a branch never gets a ledger on origin. Task 7 makes its state `paused` / `killed` once the trigger's `started` marker gives it engine `task`, and Task 8's comment tells the user to comment `@sdlc-harness resume`. Without this task that comment leads straight to a "not a harness branch" refusal, because the run is `completed` and not in flight.

**The rule this task ships.** It uses the task prompt's own alternative, *"or when the issue carries the `started` marker for it"*, together with the in-flight test. When `forge_recognised` fails, a branch is still a harness branch when:
- **(a)** the command was typed on an issue, `control_branch_from_issue` took the branch from that issue's genuine `started` marker, **and the branch still exists on origin** (`remote_branch_exists "$b"` answers `0`). `control_issue_branch_var` has already verified that marker: it is bot-authored, its first line is the trigger's sentence, and its last non-empty line is exactly `forge_marker started <b>`. So the harness started a run on exactly this branch. This covers finding 5 on the issue, and a never-started first run, which has no pull request. The existence condition is load-bearing: an issue keeps its `started` marker after its branch is deleted (Gate 12 round 8, leg (h)), and without the check `resume`, `answer` and `clear` on that issue would reach `verb_dispatch`'s `gh workflow run … --ref "$branch"` against a ref that no longer exists and tell the user to retry, contradicting the `delete` job's own comment (*"its branch was deleted, so the run cannot be resumed"*). Today a deleted branch is refused because `forge_recognised` finds no remote-tracking ref; this task keeps it refused, with a reason that names the deletion;
- **(b)** or, on any path, a `harness run <branch>` run is `queued`, `in_progress`, `waiting`, `requested` or `pending`. This covers a pull request whose head has no ledger yet.

On a pull request a finished run with no ledger stays refused. On an issue, (a) holds once `control_branch_from_issue` has found a branch **that still exists on origin**, because an issue with no genuine `started` marker is already refused earlier ("no harness run was started from this issue"). A branch the issue's marker names that is gone from origin is refused with a reason naming the deletion, never "not a harness branch".

**Depends on:**
- **Task 9**, the previous task to edit `cli/templates/scripts/remote-run.sh`.
- **Task 7**, the previous task to edit `cli/test/remote-control.test.mjs`. It also gives `remote_state`, for a never-started run with no bundle anywhere, the promotion to `paused` / `killed` when the trigger's `started` marker lies no earlier than `DISPATCH_MARKER_SLACK_SECS` (120) before the run's `createdAt`. With no qualifying marker the run stays `failed`. This task's first-run cases rely on that state.
- **Task 5**, whose reply after a successful dispatch ends with exactly `<!-- sdlc-harness event=reply branch=<branch> engine=<engine> -->`.

**Where this task stops.** This task changes which branch `control_check_branch` accepts, and nothing after it. Once a branch passes:
- `stop` already reads the state with a `fetch` child, and `remote_state` answers `running` for an unfinished newest run;
- `pause` accepts `running`;
- `resume` already sends a `paused` run to `control_resume_dispatch`, which dispatches with the engine `fetch` prints.

So no arm changes. `forge_recognised`, the ledger test, is unchanged. The report target rule (`forge_report`'s pull-request check) keeps using it alone, because a pull request is recognised by its ledger.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - `control_check_branch` and its comment;
  - `control_branch_from_issue`'s call to it, and its comment;
  - a new helper, `control_run_in_flight`;
  - the header paragraph `THE BRANCH.`
- `cli/test/remote-control.test.mjs`: the recognition cases, and the end-to-end resume of a first run GitHub never started.

**Work:**

- [ ] **`control_run_in_flight <branch>`.** List `gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch <branch> --json displayTitle,status --limit "$RUN_LIST_LIMIT"`, with the branch passed explicitly. Don't use `list_runs`, which reads the global `branch`, and don't leave `GH_OUT` changed for a later reader: save and restore it if needed. It returns:
  - `0` when a run titled exactly `harness run <branch>` has `status` `queued`, `in_progress`, `waiting`, `requested` or `pending`;
  - `1` when none does;
  - `2` with `GH_ERR` set when the listing failed or was not a JSON array.
- [ ] **`control_check_branch <branch> [started]`.** The optional second argument is the word `started`, and only `control_branch_from_issue` passes it: change its call to `control_check_branch "$ISSUE_BRANCH" started`. `control_branch_from_pr` and the review path (`control_check_branch "$REVIEW_HEAD"`) pass nothing. After `forge_fetch_branch`, when `forge_recognised` fails:
  - `$2` is `started` → call the existing helper `remote_branch_exists "$b"` (the one `continue_redispatch` and `continue_wait_poller` already use; `git ls-remote --exit-code --heads origin refs/heads/<b>`, answering `0` present, `1` absent, `2` failed with `REMOTE_BRANCH_ERR` set). No `run list` call is made on this path:
    - `0` → accepted. Fall through to `CONTROL_BRANCH="$b"`;
    - `1` → `control_refuse "$EXIT_REFUSED" "\`$b\` no longer exists on origin, so its run cannot be resumed or commanded" "Start a new run from a new issue or the Run workflow form."`, exit 2, nothing dispatched;
    - `2` → `control_refuse "$EXIT_GH" "whether \`$b\` still exists on origin could not be read ($REMOTE_BRANCH_ERR)" "Comment again to retry."`.

    Neither refusal says "not a harness branch".
  - Otherwise call `control_run_in_flight "$b"`:
    - `0` → accepted;
    - `1` → refuse, exit 2, with ``\`$b\` is not a harness branch: its tip carries no flow-progress ledger, and no `harness run $b` run is queued or in progress``, and the existing way on, "Only a branch a harness run works on can be commanded.";
    - `2` → `control_refuse "$EXIT_GH" "whether \`$b\` has a harness run in flight could not be read ($GH_ERR)" "Comment again to retry."`. A failed read never says "not a harness branch".

  Update both functions' comments: a branch passes with the ledger, with the issue's verified `started` marker while the branch still exists on origin, or with a `harness run` in flight; the refusal reads "no ledger and no `harness run` in flight", and a marker-named branch gone from origin is refused as deleted.
- [ ] **The header's `THE BRANCH.`** Replace "and one whose origin tip carries no flow-progress ledger (`forge_recognised`) is not a harness branch" with the rule above, in three parts:
  - a branch is a harness branch when its origin tip carries the ledger (`forge_recognised`);
  - or, for a command typed on an issue, when the branch is the one that issue's genuine `started` marker names **and it still exists on origin** (`remote_branch_exists`). That marker shows the harness started a run on it, so a first run that GitHub never started, which committed only its task prompt, is still commandable. An issue keeps its marker after its branch is deleted, so a marker-named branch gone from origin is refused as deleted, and a failed existence check is a refusal naming the read;
  - or when a `harness run <branch>` run is queued, waiting, requested, pending or in progress (`control_run_in_flight`), so a run is commandable from its first minute on its pull request too.

  End with: a failed listing is a refusal naming the read.
- [ ] **`remote-control.test.mjs`: recognition.** On a **pull request** comment whose head carries no ledger on origin (`pushBranch('feat_y', { ledger: false })`, with the `pr view` stub answering `headRefName: feat_y`, not cross-repository, `OPEN`):
  - **In flight.** The run list has `harness run feat_y` `in_progress`. `@sdlc-harness stop` is accepted: a `stop feat_y` child runs (the `action=stop` dispatch is made), and the reply is `Stop requested by @…`.
  - **The same with `queued`, for `pause`.** The `action=pause` dispatch is made.
  - **Only a `completed` run.** The new refusal text, exit 2, and nothing dispatched.
  - **The listing fails** (`STUB_FAIL_ON` on `run list`, where the suite supports it). The `could not be read` refusal, and nothing dispatched.
  - **On the issue** (finding 5's own case). `feat_y` is pushed to origin with no ledger (`pushBranch('feat_y', { ledger: false })`), and issue 7 carries a bot `started` marker for `feat_y`. `@sdlc-harness stop` on the issue is accepted with no `run list` call made by `control_check_branch`; assert that if the suite records call lists.
  - **On the issue, the branch is gone from origin.** Issue 7 carries a bot `started` marker for `feat_y`, and `feat_y` is **never pushed** to origin. `@sdlc-harness resume` on the issue gives the ``\`feat_y\` no longer exists on origin`` refusal, exit 2, with no `workflow run` dispatch made and the reply not containing "not a harness branch".

  A branch with a ledger is accepted with no extra `run list` call. Assert that, if the suite records call lists.
- [ ] **`remote-control.test.mjs`: a first run GitHub never started, end to end.** `pushBranch('feat_y', { ledger: false })`. No pull request is open. The run list has one run, `harness run feat_y`, `completed`, with no artifact listed, and its `run` job `completed` / `cancelled` with `steps: []`. No run carries a bundle. Cases, each a comment on issue 7:
  - **The acceptance case.** Issue 7 carries a bot `started` marker for `feat_y`, created 5 s after the run's `createdAt`. `@sdlc-harness resume` dispatches `engine=task resume=pause`, and the reply's last line is exactly `<!-- sdlc-harness event=reply branch=feat_y engine=task -->`.
  - **The marker is too old.** The same, with the `started` marker 600 s before `createdAt`. The branch is accepted, because the marker is genuine, but no engine is recovered, so the run stays `failed`. The refusal is the existing ``only a paused run can be resumed, and the run on `feat_y` is `failed` ``, and nothing is dispatched.

**Verification:**

- `npm test --workspace cli -- test/remote-control.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- End to end, the first-run acceptance case is the whole path a user takes after Task 8's `not_started` comment on a first run: this task's recognition, then Task 6's detection, Task 7's engine read and promotion, and `control_resume_dispatch`'s dispatch, on a branch with no ledger, as `verb_start` leaves it.
- Grep `remote-run.sh` for `its tip carries no flow-progress ledger"`: no refusal ends there without the in-flight clause.
- Grep `remote-run.sh` for `control_check_branch "`: only `control_branch_from_issue`'s call passes `started`.
- Read `control_check_branch`: the `started` path reaches `CONTROL_BRANCH="$b"` only after `remote_branch_exists "$b"` answered `0`, and its `1` and `2` arms both call `control_refuse` with text that does not contain "not a harness branch".
