### Task 10 — Add `remote-run.sh control` for comment commands, with `pause` and `stop`

**Goal:** Build the comment adapter, the twin of `trigger`: a GitHub event becomes a harness action on exactly one branch. `remote-run.sh control` is the one step of `harness-control.yml`'s job (Task 15). This task handles `issue_comment`: it reads the comment, decides whether it is a command, authorises the commenter, resolves the branch, and carries out `pause` and `stop` with the same dispatches the local relays send (goal 4, acceptances 4 and 6). The command syntax is the maintainer's decision of 2026-10-01: `@sdlc-harness <verb> [args]`, the handle as the **first word of the first line**, matched case-insensitively.

**Depends on:**

- Task 1's shell variables: `COMMAND_HANDLE='@sdlc-harness'`, `COMMAND_VERBS='answer pause resume stop clear'` and `COMMENT_MARKER='<!-- sdlc-harness'`.
- Task 3's functions: `forge_on`; `forge_repo_var` (`FORGE_REPO`); `forge_marker <event> <branch> [<question>]`, the one producer of the line `<!-- sdlc-harness event=<event> branch=<branch> -->`; `forge_fetch_branch <branch>`; `forge_recognised <branch>`, which answers 0 when `origin/<branch>` carries `<state_rel>/flow_progress/<branch>_progress.md`; `forge_comment <number> <event> <branch> <body_file>`; and `forge_set_state <number> <state>`.
- Task 5's `authorise_actor <login> <type>`, which answers 0 when authorised, else 1 (`ghost` or not a login), 2 (an unlisted bot), 3 (a permission other than `admin`/`write`, held in `AUTH_PERMISSION`) or 4 (the permission call failed), with `AUTH_WHY` holding one sentence. Task 5 also fixes the trigger's start comment, posted as `github-actions[bot]`: its body opens with the existing fixed sentence `Started a harness run on the branch \`<branch>\`:` (`cli/templates/scripts/remote-run.sh`, `trigger_finish`'s start call), and its last non-empty line is `forge_marker started <branch>`, appended by `trigger_finish` after a blank line.
- Task 8's `remote-run.sh stop <branch> --actor <login> [--repo <root>]`. It answers 0 after a complete stop, which it reports as a `stopped` comment naming `@<login>` and the `sdlc-harness: stopped` label, and 3 for a partial stop, which it does not report.
- The existing `remote-run.sh pause <branch>`, which answers 0 when sent and 3 on a `gh` failure, and `remote-run.sh fetch <branch> <out_dir>`, whose key lines are `run_id:`, `run_url:`, `run_status:`, `state:`, `pause_reason:`, `engine:`, `detail:`, `open_questions:` and `bundle_dir:`.

**Where this task stops.** `resume` and `clear` are Task 11's, `answer` is Task 12's, and a `pull_request_review` event is Task 13's. Each adds an arm to what this task builds, and until then those verbs get the not-yet-handled reply below. The workflow and its `if:` prefilter are Task 15's. This task is the authority: the prefilter only saves a runner, and every rule here holds without it.

### The contract this task defines, which Tasks 11–13 extend

- **Root and gate.** Job-side, as `trigger`: `hr_repo_root` of the working directory unless `--repo`. It takes no part in the sending-verb gate and gates itself after reading the event, so a refusal can still be replied to.
- **`control_reply <exit> <text>`** posts `<text>` with `forge_comment <number> reply <branch> <file>` on the issue or pull request the event came from, then exits `<exit>`. A reply that cannot be posted prints `::error::` with `GH_ERR` and makes the exit 3. Refusals read `@<login>: \`<verb>\` was not run: <reason>. <way on>`.
- **`control_state_var <branch>`** runs `bash "$script_dir/remote-run.sh" fetch <branch> <dir> --repo "$root"` as a child, into a fresh directory under `${RUNNER_TEMP:-<mktemp -d>}`. It sets `CS_STATE`, `CS_REASON`, `CS_ENGINE`, `CS_OPEN`, `CS_DETAIL`, `CS_URL` and `CS_RUN_STATUS` from those lines. A non-zero exit returns 1 with `CS_ERR` holding the child's last stderr line.
- **`CONTROL_BRANCH`, `CONTROL_NUMBER`, `CONTROL_ACTOR`, `CONTROL_VERB` and `CONTROL_ARGS`** are set before a verb arm runs. `CONTROL_ARGS` is the rest of the first line after the verb, and `CONTROL_BODY` the whole comment body.
- **Exit map:** 0 handled, or ignored; 1 not an event `control` handles, or an unreadable event file; 2 refused, with a reply; 3 a `gh` step failed — the reply could not be posted, or the action failed and was replied to.

### Targets

- `cli/templates/scripts/remote-run.sh` — the `control` verb, its functions, `usage()`, the root-resolution list, the header paragraph with its exit map, and the REPRO.
- `cli/test/remote-control.test.mjs` (new) — the adapter's contract.

**Work:**

- [ ] **Intake and the command test.**
  - Add `control [--repo <root>]` to the verb list. It takes no branch.
  - `GITHUB_EVENT_NAME` other than `issue_comment` exits 1; Task 13 adds `pull_request_review`. An unreadable `GITHUB_EVENT_PATH` exits 1.
  - Read `.action`, `.comment.body`, `.issue.number`, `.issue.pull_request.url // ""`, `.sender.login` and `.sender.type` with the existing `event_field`, so each field is data, never shell source.
  - Ignore, with one line and **no `gh` call**: an action other than `created`; a body containing `COMMENT_MARKER` anywhere (the harness's own comment, ignored silently whoever posted it); and a body whose first line, with a trailing CR stripped and leading spaces and tabs skipped, does not begin with a word equal to `COMMAND_HANDLE` compared lowercase. Lowercase with `tr`, not `${x,,}`, which needs bash 4. So `pause`, `pause this`, `Let's @sdlc-harness pause` and `> @sdlc-harness pause` all start nothing.
  - The verb is the second word, lowercased, and `CONTROL_ARGS` the rest of the line.
- [ ] **The gates**, in this order, each a reply and exit 2:
  1. `HARNESS_REMOTE_STOP` is set.
  2. `forge_on` fails, naming `forge` and `execution.target` as the trigger's refusal does. This comes before any authorisation, so a disabled coupling asks GitHub nothing about the commenter.
  3. `authorise_actor "$login" "$type"` fails: `AUTH_WHY`, and that only a collaborator with write, maintain or admin access, or a bot listed in `HARNESS_TRIGGER_ALLOWED_BOTS`, commands a run.
  4. The verb is empty, or not a `COMMAND_VERBS` word: a reply listing the five as `@sdlc-harness answer [<n>]`, `pause`, `resume`, `stop` and `clear`, and naming the harness documentation's `docs/github-run-control.md`. A known verb no arm handles yet gets the same reply.
- [ ] **The branch.**
  - **On a pull request** (`.issue.pull_request.url` non-empty): `gh_call pr view <n> --repo "$FORGE_REPO" --json headRefName,isCrossRepository,state`. A fork is refused with a reply, because an `issue_comment` on a fork's pull request runs with this repository's secrets (research C2), and nothing from its head is ever checked out or run. A pull request that is not `OPEN` is refused. A head that `hr_branch_is_protected` does not answer 1 for is refused. Then `forge_fetch_branch`, and a head that `forge_recognised` rejects gets the reply that the branch is not a harness branch, because its tip carries no flow-progress ledger.
  - **On an issue:** `gh_call api --paginate repos/$FORGE_REPO/issues/<n>/comments`. A comment is a **genuine start** only when all three hold: its `user.login` is `github-actions[bot]`; its body, with a trailing CR stripped from each line, **opens with** the fixed sentence `Started a harness run on the branch `, followed by the same `<b>` in backticks; and its **last non-empty line** equals, byte for byte, the line `forge_marker started <b>` prints for the `<b>` it captures — so a marker quoted mid-body, or in any comment not opening with the start sentence (another workflow posting with `GITHUB_TOKEN`, or the harness posting a question file or a reply verbatim as `github-actions[bot]`), is never a start. Do the filtering in the shell over each comment's body (the `--jq` only projects `user.login` and `body`), comparing against `forge_marker`'s own output rather than a second spelling of the marker. The last genuine start is the branch; an empty `branch=` is ignored. None gets the reply that no harness run was started from this issue. A marker in a comment by anyone else is never trusted.
  - **The same refusals on both paths.** The branch resolved from an issue goes through exactly the checks a pull request's head does: a branch `hr_branch_is_protected` does not answer 1 for is refused, then `forge_fetch_branch`, and a branch `forge_recognised` rejects gets the not-a-harness-branch reply. Factor the three into one `control_check_branch <branch>` called from both paths, so the two cannot drift.
- [ ] **`pause` and `stop`.**
  - `pause`: `control_state_var`. With `CS_STATE` `running`, run `remote-run.sh pause <branch> --repo "$root"` as a child. On 0, reply `Pause requested by @<login>; the run on \`<branch>\` yields at its next clean checkpoint, and a paused comment follows.` and exit 0. With any other state, reply that only a running run can be paused, naming the state, and exit 2. A child failure is a reply naming its last line, and exit 3.
  - `stop`: `CS_STATE` `none` gets the reply that there is no run, and exit 2. Otherwise run `remote-run.sh stop <branch> --actor <login> --repo "$root"`. On 0, **always** reply on `CONTROL_NUMBER` with `control_reply 0 "Stop requested by @<login>; the run on \`<branch>\` is stopped."`. Task 8's `stopped` comment does not stand in for this reply: it posts to Task 3's target, the branch's open recognised pull request when there is one, else `FORGE_ISSUE`, so a `stop` typed on the issue of a branch that already has a pull request would otherwise get no reply where it was typed (goal 4: every accepted command gets a reply). When `CONTROL_NUMBER` is the item `stopped` also went to, both comments appear there; that duplication is accepted, so the arm needs no target comparison. On 3, reply that the stop was partial and to comment `@sdlc-harness stop` again, and exit 3.
  - State every rule above in a header paragraph `control IS THE COMMENT AND REVIEW ADAPTER`, with the exit map and REPRO lines for a pause and an ignored comment.
- [ ] **`cli/test/remote-control.test.mjs`** opens with its rule: *only the handle as the first word of the first line is a command, only a write-or-admin human or a listed bot is obeyed, the harness's own comments and every pull request from a fork are never acted on, and a refusal always replies.*
  - **Fixture:** Task 3's — `forge` `github`, `feat_x` on origin with its ledger.
  - **The `gh` stub** answers `pr view` from `STUB_PR` (default a same-repository `OPEN` pull request with head `feat_x`), `api …/issues/<n>/comments` from `STUB_COMMENTS`, the permission call from `STUB_PERMISSIONS`, `run list` from `STUB_RUN_LIST`, and the labels GET with `[]`. It logs each argument vector and `body=@` contents.
  - **Cases:**
    - a `write` user's `@sdlc-harness pause` with a running run → `workflow run harness-run.yml --ref feat_x -f action=pause -f branch=feat_x`, and one reply naming `@alice`;
    - `@SDLC-Harness PAUSE` → the same;
    - each of `pause`, `pause this`, `Let's @sdlc-harness pause`, `> @sdlc-harness pause`, a body carrying the marker, and an `edited` action → no `gh` call, exit 0;
    - a `read` answer, a failed permission call, `ghost`, an unlisted `Bot` (no permission call), `HARNESS_REMOTE_STOP=1`, and `forge` `none` (no permission call) → one reply each, no `workflow run`;
    - `@sdlc-harness merge` → a reply listing the five verbs;
    - a cross-repository pull request, and a head without the ledger → a reply, no `workflow run`;
    - an issue whose `github-actions[bot]` genuine start comment (the start sentence, then `forge_marker started feat_x` as its last line) → acts on `feat_x`; the same comment by `mallory` → the no-run reply;
    - an issue with that genuine start for `feat_x`, followed by a later `github-actions[bot]` comment carrying `<!-- sdlc-harness event=started branch=feat_evil -->` **mid-body** (a quoted question file), and another whose last line is that marker but which does not open with the start sentence → both ignored, acts on `feat_x`;
    - an issue whose genuine start names `main` (protected), and one whose genuine start names a branch on origin without the ledger → a reply each, no `workflow run`;
    - `stop` → the stop marker, `run cancel`, then the `stopped` comment naming `@alice`, and a reply naming `@alice` on the item the command was typed on;
    - `stop` commented on issue 7 whose genuine start names `feat_x`, with `STUB_PR` and the pull-request list answering an open same-repository pull request 12 for `feat_x` → the `stopped` comment is posted on 12, and a reply naming `@alice` and `feat_x` is posted on 7;
    - `pause` on a parked run → a reply naming `parked`, no `workflow run`.

**Verification:**

- `npm test -- test/remote-control.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "workflow run" -- cli/templates/scripts/remote-run.sh` shows no new `workflow run` composed outside `verb_dispatch`, `verb_pause`, `verb_warm` and `verb_stop`: `control` dispatches only through child verbs.
- `git grep -n "pull_request_target" -- cli/templates` finds nothing.
