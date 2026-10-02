### Task 3 — Add the forge-surface helpers and `remote-run.sh report` for lifecycle comments and state labels

**Goal:** Build the one place `remote-run.sh` talks to an issue or a pull request: finding the run's issue and its pull request, telling a harness branch from any other, posting a marked comment, and setting the one state label. Expose it as `remote-run.sh report <event> <branch>`, which turns a lifecycle event into a comment naming the next **GitHub** action and moves the state label on both the issue and the pull request (goals 5 and 6). Every later task that writes to GitHub — the trigger (Task 5), `deliver` (Task 6), the watcher (Task 7), `continue`/`poll`/`stop` (Task 8), `review` (Task 9) and `control` (Tasks 10–13) — calls these functions and never re-derives them.

**Depends on:** Task 1's shell variables in `remote-run.sh`: `COMMENT_MARKER='<!-- sdlc-harness'`, `STATE_LABEL_PREFIX='sdlc-harness: '`, `RUN_STATES='running parked paused done failed stopped'`, and `COMMAND_HANDLE='@sdlc-harness'` for the reply text.

**Where this task stops.** `report parked` posts a short notice and the label here; posting the question files themselves is Task 4's. `report` is not called by anything yet: the watcher's job-mode calls are Task 7's, `remote-run.sh`'s own `notify()` is Task 8's, and the workflow steps that call it are Task 14's. The `round` event is Task 9's. `completed` is `deliver`'s (Task 6), and `report completed` only prints that.

### The interface this task defines, which later tasks call by these names

Every function sets globals rather than printing, so a caller can keep its own exit code. None of them ever exits the script, and each failure prints one `remote-run.sh: …` line to stderr naming `GH_ERR`.

- `forge_on` → 0 when `hr_forge "$root"` prints `github` **and** `hr_execution_target "$root"` prints `github-actions`, else 1. This is the shell mirror of `forgeTriggerApplies`.
- `forge_repo_var` → sets `FORGE_REPO` (owner/name) and `FORGE_SERVER`. They come from `GITHUB_REPOSITORY` and `${GITHUB_SERVER_URL:-https://github.com}` when the first is set. Otherwise one `gh_call repo view --json nameWithOwner` is made, memoised for the invocation. Returns 1 on failure.
- `forge_fetch_branch <branch>` → `git -C "$root" fetch --quiet origin "+refs/heads/<branch>:refs/remotes/origin/<branch>"`, at most once per branch per invocation; a failure is one line, tolerated. The refspec is explicit because a job's `actions/checkout` may configure a single-branch fetch, under which a bare `fetch origin <branch>` updates only `FETCH_HEAD` (the resume poller checks out the default branch at depth 1).
- `forge_marker <event> <branch> [<question>]` → prints `<!-- sdlc-harness event=<event> branch=<branch> -->`, or with ` question=<n>` before the closing `-->`. It is built from `COMMENT_MARKER` and is the **one producer** of that line.
- `forge_issue_var <branch>` → sets `FORGE_ISSUE` to the issue number, or empty. It reads the task prompt at `hr_task_prompt_rel "<state_rel>" "<branch>"` from `refs/remotes/origin/<branch>` with `git show`, and takes the last line matching `^Started from <FORGE_SERVER>/<FORGE_REPO>/issues/([0-9]+) by @`. That is the provenance line `trigger` writes (`remote-run.sh` → `verb_trigger`'s `printf '# %s\n\n%s\n\n---\n\nStarted from %s by @%s, …'`). A URL naming another repository never matches.
- `forge_recognised <branch>` → 0 when `refs/remotes/origin/<branch>` carries `<state_rel>/flow_progress/<branch>_progress.md` (`git cat-file -e`), else 1. **This is the harness-branch test**, read from committed state, never from a registry.
- `forge_pr_var <branch>` → sets `FORGE_PR` to the number of the open pull request whose head is `<branch>` in this repository, or empty. It makes one `gh_call pr list --repo "$FORGE_REPO" --head <branch> --state open --json number,isCrossRepository --limit 10` and keeps the first with `isCrossRepository` false. Returns 1 on a `gh` failure.
- `forge_comment <number> <event> <branch> <body_file> [<question>]` → appends a blank line and `forge_marker …` to `<body_file>`. Then it posts with `gh_call api --method POST repos/$FORGE_REPO/issues/<number>/comments -F body=@<body_file>`, which serves an issue and a pull request alike. Returns `gh`'s status.
- `forge_set_state <number> <state>` → `<state>` must be a `RUN_STATES` word, else 1. It reads `gh_call api repos/$FORGE_REPO/issues/<number>/labels`. Every label starting with `STATE_LABEL_PREFIX` other than the target is removed with `--method DELETE …/labels/<name>`, the name URI-encoded with `jq -rn --arg s … '$s|@uri'`. Then it adds `${STATE_LABEL_PREFIX}<state>` with `--method POST …/labels -f "labels[]=<label>"`. When the add fails, it creates the label once (`--method POST repos/$FORGE_REPO/labels -f name=… -f color=… -f description=…`, the description saying the harness sets it and overwrites a hand-applied one) and retries the add **once**. That retry is the ledger's bounded-retry rule.
- `forge_report <event> <branch> [<note>]` → always returns 0; specified below.

### Targets

- `cli/templates/scripts/remote-run.sh` — a new `THE FORGE SURFACE` section, the `report` verb, its usage line, option parsing, header paragraph and REPRO.
- `cli/test/remote-report.test.mjs` (new) — the verb's contract.

**Work:**

- [ ] **The helper functions** listed above, in one section with a comment block stating the target rule:
  - A comment goes to the open pull request when `forge_recognised` holds for its head, else to `FORGE_ISSUE`, else nowhere.
  - The state label goes on `FORGE_ISSUE` and on that pull request, each when known.
  - The block says why the label is a view and never an authority: the run list is the authority (`remote_state`), and the harness overwrites any state label set by hand.
- [ ] **`forge_report <event> <branch> [<note>]`**:
  - It returns at once, with one line, when `forge_on` fails, when `forge_repo_var` fails, or when neither target exists.
  - It maps the event to a state: `parked` and `park_loop` → `parked`; `paused` → `paused`; `resumed` → `running`; `failed` → `failed`; `stopped` → `stopped`.
  - On `failed` it first calls the existing `remote_branch_stopped "$branch"`. When that answers 0, it prints that the stop already reported the run and posts nothing, so a stopped run's cancelled job never overwrites `stopped`.
  - `completed` and `launched` print one line naming the producer of each and post nothing: `completed` is `deliver`'s, and `launched` is the trigger's own comment. Any other event prints one line and posts nothing.
  - The reason and reset time come from the job's registry record when the file `hr_state_path "$root" autonomous_logs/registry.json` exists. Test it with `-f` first, because `hr_registry_get` creates an absent registry. It reads `pause_reason` and `usage_resume_at`.
- [ ] **The comment text**, one short paragraph per event, then `<note>` when given, then `Run: $(this_run_url)` when `GITHUB_RUN_ID` is set. Each names the next GitHub action and never a slash command:
  - `paused` with reason `usage` names the reset as a UTC time and says it resumes by itself;
  - any other `paused` ends `Comment \`${COMMAND_HANDLE} resume\` to continue.`;
  - `park_loop` names the hold and `${COMMAND_HANDLE} clear`;
  - `parked` says the run waits for an answer and its questions are in the run's `harness-state` artifact (Task 4 replaces this text with the questions themselves);
  - `resumed` says it resumed;
  - `failed` names the run's log and the way to start again: on a pull request, a review requesting changes; on an issue, re-applying the trigger label, which starts a new run on the next indexed branch;
  - `stopped` says nothing runs until a new review or label starts another round or run.

  Write the body to a `mktemp` file under `${RUNNER_TEMP:-<a mktemp -d directory>}`, as `trigger` does, and post it with `forge_comment`. Then call `forge_set_state` on each target.
- [ ] **The verb `report <event> <branch> [--note <text>] [--repo <root>]`.**
  - Add it to the verb list, `usage()` and the argument parser. `--note` is a `report` option only.
  - It is job-side for root resolution: `hr_repo_root` of the working directory unless `--repo`, as `trigger` is. It takes no part in the sending-verb gate, and it exits 0 whatever happened, 1 only on a usage error. It is a reporter: it must never fail the step or the watcher that calls it.
  - The header gains a `report` paragraph: the target rule, the state map, the stop check, and its writes (comments and labels on the issue and the pull request; nothing local). Add it to the `WHAT IT NEVER DOES` paragraph's write list.
  - Add REPRO lines for a paused report on an issue and a forge-off no-op.
- [ ] **`cli/test/remote-report.test.mjs`** opens with its rule: *a lifecycle event reaches the run's pull request, else its issue, as one marked comment naming a GitHub action, and leaves exactly one state label on each; with the forge coupling off it calls no `gh` at all.*
  - **Fixture**, in `remote-trigger.test.mjs`'s shape: `init`, `execution.target` `github-actions`, `forge` `github`, the adopted tree pushed to a bare `origin`. A branch `feat_x` is pushed carrying its task prompt, with the provenance line naming `https://github.com/octo/fixture/issues/7`, and its `flow_progress/feat_x_progress.md`.
  - **`gh` stub** through `HARNESS_GH_CLI`. It logs each argument vector plus the content of any `body=@<path>`. It answers `pr list` from `STUB_PRS`, default `[]`; `api …/issues/<n>/labels` (GET) from `STUB_LABELS`, default `[]`; and `run list` from `STUB_RUN_LIST`, default `[]`. A call starting `STUB_FAIL_ON` exits 4. Set `GITHUB_REPOSITORY=octo/fixture`.
  - **Cases:**
    - forge unset → no `gh` call, exit 0;
    - `paused`, registry reason `user` → one comment on 7 carrying `@sdlc-harness resume` and the marker line, and one label add of `sdlc-harness: paused`;
    - reason `usage` with `usage_resume_at` → the UTC time, and no `resume` command;
    - an existing `sdlc-harness: running` plus `bug` → one DELETE of `sdlc-harness%3A%20running`, `bug` untouched;
    - an open same-repository pull request 12 → the comment on 12, and labels on 7 and 12;
    - a pull request whose head lacks the ledger → the comment on 7 only;
    - a cross-repository pull request → ignored;
    - `failed` with a newer `harness stop feat_x` run → nothing posted;
    - `completed` → nothing posted;
    - a failing add → one label create, then one retry;
    - no provenance line and no pull request → nothing posted, exit 0;
    - a `--note` carrying `` $(touch pwned) `` → posted byte for byte, no `pwned` file.

**Verification:**

- `npm test -- test/remote-report.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n -e '--method POST' -e '--method DELETE' -- cli/templates/scripts/remote-run.sh` has every code hit inside `forge_comment` and `forge_set_state`: no other function writes a comment or a label.
- `git grep -n -F '<!-- sdlc-harness' -- cli/templates/scripts/remote-run.sh` has its only code hit in the `COMMENT_MARKER=` assignment: the marker has one producer.

**Deviations from plan:**

- A pull request whose head fails `forge_recognised` is dropped as a target for the label as well as the comment (`forge_report` clears `FORGE_PR`), reading "that pull request" in the target rule as the recognised one; the suite asserts no label on 12 in that case.
- `report`'s `<event>` is checked against `^[a-z][a-z_]*$` (usage error, exit 1), because it is interpolated into the marker line; and `setup_fail` exits 0 for `report` as it does for `save`, so an unresolvable root or configuration never fails the calling step.
- Evidence downgrade: `bash -n cli/templates/scripts/remote-run.sh` was refused by the session's permission layer (twice). The syntax claim rests instead on `test/remote-report.test.mjs` executing the script through to its final `case "$verb"` dispatch in all 14 cases (pass), which bash cannot do with a parse error in the file.
