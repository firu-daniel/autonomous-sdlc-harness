### Task 7 — A never-started run takes its engine from its dispatch's marker

**Goal:** `@sdlc-harness resume`, and `answer` where it applies, recover a run whose job GitHub never started, without the Run workflow form. They do this whenever the dispatch that created the run left a comment recording its engine. That includes a branch's **first** run, which has no bundle anywhere. Gate 12 round 8, finding 3: after round 4's job was not acquired by a runner, `resume` was refused with *"the run on `feat_invoices_5` (`paused`, `killed`) records no engine, and the harness does not guess one"*. The engine lived only in a bundle that job never wrote.

The task prompt holds this branch to finding 3's **Expected** line, *"a run that ended without its job ever running is reported, as `failed` or as `stopped`, with a `resume` hint"*, and finding 6's, *"Every recovery path (`resume`, the poller, the form) works even when the failed job left no bundle."* A first run that GitHub never started meets them only if `resume` accepts it. So this task makes such a run `paused` once its engine is recovered. Resuming it is safe: with no bundle anywhere, `verb_restore` treats the job as the branch's first (`remote-run.sh: no previous bundle for $branch; this is its first job`), and `--resume pause` refuses nothing on that path.

A first run's branch carries no flow-progress ledger on origin, because `verb_start` commits only the task prompt. So `control_check_branch` refuses it before `resume` is reached until **Task 10** accepts the branch its issue's `started` marker names. The end-to-end resume of a first run on a branch with no ledger is therefore **Task 10's** test, not this task's. This task's tests run on branches that carry a ledger.

**Depends on:**
- **Task 6**, which gives `remote_state`:
  - `RS_NOT_STARTED=1` for a finished `harness run <branch>` run whose `run` job GitHub never started;
  - `RS_STATE` / `RS_PAUSE_REASON`: `paused` / `killed` in Case 4 (an older run carries a bundle), `failed` in Case 5 (no bundle anywhere);
  - `RS_RUN_CREATED_AT`, that run's `createdAt` in ISO 8601;
  - `RS_ENGINE` empty, since there is no bundle.

  Task 6 also edited the header paragraphs `` THE `killed` AND `expired` MAPPINGS `` and `` `sync` READS THE NEWEST `harness run <branch>` RUN ``. This task appends one sentence to each.
- **Task 5**, which makes `control`'s reply after a successful dispatch end with exactly `<!-- sdlc-harness event=reply branch=<branch> engine=<task|user_review|docs> -->`.
- **Task 4**, which edited the `start` and `review` clauses of the header paragraph `WHAT IT NEVER DOES.`. This task appends to the `review` clause after Task 4's text, leaving that text unchanged, and edits other clauses.

This task reads that form, and two forms that already exist:
- `<!-- sdlc-harness event=started branch=<branch> -->`, the trigger's comment, always engine `task`;
- `<!-- sdlc-harness event=round branch=<branch> -->`, `review`'s round comment, always engine `user_review`.

**Where this task stops.** This task fills `RS_ENGINE`, and moves a Case 5 never-started run with a recovered engine to `paused` / `killed`. It changes nothing that reads them. `control_resume` already sends every `paused` run to `control_resume_dispatch`, and that and `control_answer` already dispatch `--engine "$CS_ENGINE"`, which `fetch` prints from `RS_ENGINE`, and refuse when it is empty. Those refusals stay for a run with no usable marker. `sync`'s Case 4 arm already keys on `RS_STATE = paused`, so it records the promoted run as `paused (killed)` with no edit. `collect` reporting the run is **Task 8's**, and so is the `collect` clause of `WHAT IT NEVER DOES.`.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - a new reader, `forge_dispatch_engine_var`;
  - a new constant, `DISPATCH_MARKER_SLACK_SECS=120`, beside `ROUND_OVERLAP_SECS`;
  - one call in `remote_state`, and the Case 5 promotion after it;
  - the header's `THE ARMS.` sentence "An empty engine is refused, never guessed …";
  - one appended sentence in each of `` THE `killed` AND `expired` MAPPINGS `` and `` `sync` READS THE NEWEST `harness run <branch>` RUN ``;
  - the header paragraph `WHAT IT NEVER DOES.`: its `fetch`, `status`, `sync`, `control` and `review` clauses (for `review`, an appended sentence after Task 4's text), and `list`'s if `verb_list` reaches `remote_state`.
- `cli/test/remote-control.test.mjs`: `resume` of a never-started run, on a branch that carries its ledger.

**Work:**

- [ ] **`forge_dispatch_engine_var <branch> <created_at_iso>`** sets `FORGE_DISPATCH_ENGINE`, or leaves it empty, and never exits.
  - **Where it looks.** Unless `forge_on` holds and `forge_repo_var` succeeds, it returns `1`. It finds the run's issue (`forge_fetch_branch`, then `forge_issue_var`) and its open pull request (`forge_pr_var`). For each one known, it lists `gh_call api --paginate "repos/$FORGE_REPO/issues/<n>/comments" --jq '.[] | {login: .user.login, at: .created_at, body: .body}'`, the idiom `control_issue_branch_var` uses.
  - **Which comment it trusts.** The author is `github-actions[bot]`. The body's last non-empty line matches exactly `^<!-- sdlc-harness event=(started|round|reply) branch=<branch>( engine=(task|user_review|docs))? -->$`, with `<branch>` matched literally. For `reply`, the `engine=` field is required. `created_at` is no earlier than `<created_at_iso>` less `DISPATCH_MARKER_SLACK_SECS`.
  - **What it answers.** Take the newest qualifying comment across both items. `started` gives `task`, `round` gives `user_review`, and `reply` gives its `engine=` value.
  - A failed listing is one stderr line and an empty answer.

  `DISPATCH_MARKER_SLACK_SECS`'s comment says why the slack exists: a dispatcher posts its comment after its dispatch request, and GitHub creates the run asynchronously, so either may carry the earlier timestamp. It also says it is small enough that an older dispatch's comment falls outside it.
- [ ] **`remote_state`.** Right after Task 6 sets `RS_NOT_STARTED=1`, and only when `RS_ENGINE` is empty, call `forge_dispatch_engine_var "$branch" "$RS_RUN_CREATED_AT"` and set `RS_ENGINE` from `FORGE_DISPATCH_ENGINE`. Then:
  - **The Case 5 promotion.** When `RS_STATE` is `failed` (Case 5) and `RS_ENGINE` is now non-empty, set `RS_STATE=paused` and `RS_PAUSE_REASON=killed`. `RS_DETAIL` keeps Task 6's never-started text. With `RS_ENGINE` still empty, Case 5 stays `failed`, and `resume`'s existing "only a paused run can be resumed" refusal stands.
  - `fetch` prints `engine: <that engine>` and the promoted state;
  - `status` with no record prints them;
  - `control_resume` dispatches with them.

  No new key is printed. A run that started never takes this path.
- [ ] **The header.**
  - In `THE ARMS.`, change "An empty engine is refused, never guessed (the `engine` input defaults to `task`), naming the Run workflow form." to say three things:
    - a run whose job GitHub never started first takes the engine its dispatch's comment records, read by `forge_dispatch_engine_var`;
    - an engine still empty after that is refused, never guessed;
    - the refusal names the Run workflow form.
  - `` THE `killed` AND `expired` MAPPINGS ``: its closing reason, "while the ledger on the branch is intact and a resume continues from it", stays true for a job that ran. Append: "A never-started run with no bundle anywhere whose engine its dispatch's comment records maps to `paused` / `killed` too, so `resume` accepts it. When that run was the branch's first, the branch has no ledger yet: `restore` finds no previous bundle and the resumed job starts as the branch's first. With no such comment it stays `failed`."
  - The `sync` paragraph: in case 5, after "re-dropping the artifact is the recovery", append: "except a run whose job GitHub never started and whose engine its dispatch's comment records, which `sync` records as case 4 does, `paused (killed)`".
  - `WHAT IT NEVER DOES.`: for a run whose job GitHub never started, `remote_state` calls `forge_fetch_branch`, a `git fetch` that force-writes `refs/remotes/origin/<branch>` in the root checkout. Add that write to:
    - the `fetch` clause ("For `fetch`, <out_dir> only");
    - the clause "`pause-requested`, `run-created-at`, `list` and `status` write nothing", for `status`, and for `list` only if `verb_list` reaches `remote_state` (read it and say which in your return);
    - the `sync` and `control` clauses, where they do not already name a fetch;
    - the `review` clause. `verb_review` reaches `remote_state` through `branch_settled_var`, and for a local `/autonomous-sdlc-harness:branch-user-review` the root checkout is the main checkout. Append one sentence after Task 4's text, which names the landed check's fetch after a push that did not land, and leave Task 4's text unchanged.

    Leave the `start` and `collect` clauses alone: they are Task 4's and Task 8's.
- [ ] **`remote-control.test.mjs`.** Every case pushes `feat_x` with its ledger (`pushBranch`'s default). Stub the Task 6 shape: the newest run is completed, has no artifact, and its `run` job is `cancelled` with `steps: []`. Stub the issue's and pull request's comment listings. Cases:
  - **The acceptance case.** An older bundle exists. The pull request carries a bot `round` comment for `feat_x`, created 10 s after the run's `createdAt`. `@sdlc-harness resume` dispatches `engine=user_review resume=pause`, and the reply carries `engine=user_review`.
  - **No bundle in any run (Case 5), engine recovered.** No run carries a bundle, and the issue carries a bot `started` marker for `feat_x` 5 s after `createdAt`. `@sdlc-harness resume` on the issue dispatches `engine=task resume=pause`, and the reply carries `engine=task`. This case exercises the promotion; it is **not** the first-run case, because a real first run has no ledger. That case is Task 10's.
  - **The same with no qualifying marker** (the `started` marker 600 s before `createdAt`). The existing refusal ``only a paused run can be resumed, and the run on `feat_x` is `failed` ``, and nothing dispatched.
  - **A `reply` marker** with `engine=task`, 30 s **before** `createdAt`, inside the slack: it dispatches `engine=task`.
  - **A stale marker, the wrong author or a quoted marker, the wrong branch.** A `round` comment 600 s before `createdAt`; the same marker posted by a person, or quoted mid-body; `branch=feat_xy`. Each gives the existing `records no engine` refusal, naming the Run workflow form, and nothing dispatched.

**Verification:**

- `npm test --workspace cli -- test/remote-control.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- End to end, the acceptance case and the Case 5 case are the whole path on a branch that carries its ledger: Task 6's detection, then this read and promotion, then `control_resume_dispatch`'s dispatch. The same path on a first run's branch, which has no ledger, is exercised by Task 10's first-run case.
- Read `WHAT IT NEVER DOES.` against `remote_state`'s new call: every verb that reaches `forge_dispatch_engine_var` names the fetch's write.
