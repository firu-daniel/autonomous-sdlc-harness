### 3. Pause, resume, answer and user-review on a remote run need a local copy, an adopt, a sync and a running watcher, though GitHub accepts every one of them directly

**Files:**
- `cli/templates/scripts/remote-run.sh`: `verb_dispatch` ("gh_call workflow run \"$WORKFLOW_RUN_FILE\" --ref \"$branch\" \"${inputs[@]}\""), `verb_sync` ("Case 3 — a newer run with a bundle."), the header's verb list and exit map ("remote-run.sh adopt [--list] [--repo <root>]"), and the dispatch `case "$verb"` ("start) verb_start ;;")
- `cli/templates/scripts/create-worktree.sh`: "--no-bootstrap is valid only when creating a new branch, not with --existing"; the header's `--no-bootstrap` paragraph ("Refused with `--existing`")
- `cli/templates/scripts/autonomous-watcher.sh`: `relay_remote_pauses`, `relay_remote_answers`, `remote_relay_call`, `resume_paused_run` ("A remote run is relayed, not re-launched"), `resume_parked_run` ("relay_remote_answers \"$branch\" \"$clar_dir\""), `clear_park_loops` ("record_is_remote \"$b\" && registry_set \"$b\" park_loop_clear_pending 1"), `tick` ("relay_remote_pauses"); the header's `REMOTE DISPATCH` bullet "THE RELAYS — EVERY ONE A USER'S ACTION RELAYED" and the registry field list ("park_loop_clear_pending", "pause_relayed_at")
- `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_task_prompt_subject`)
- `plugin/commands/branch-pause.md`, `plugin/commands/branch-resume.md`, `plugin/commands/branch-answer.md`, `plugin/commands/branch-user-review.md`; plus `plugin/commands/branch-status.md` step 6 ("For a **remote record** whose last-synced status is `parked`, `paused` or `park_loop`")
- `plugin/docs/AUTONOMOUS_FLOW.md`: `## Drop a user review (fix cycle)`, `## Answer a clarification (park-and-ask)`, `## Pause / resume a run`
- `plugin/instructions/autonomous_pause_and_ledger.md`: "A remote run's operator pause reaches the job as a relayed request"
- `docs/remote-execution.md` → `## 1. The lifecycle of a remote run`: "**What each local command does for a remote run.**", its table, "Each relay is a dispatch with `chain: 0`", "each is a user's action relayed"; and `### The kill switch and stopping` ("the relayed `remote-run.sh pause`")
- `docs/github-issue-trigger.md` → `## 5. Working the run`
- `docs/development.md` → Gate 12 observations "**(iv) A `pause` dispatch.**", "**(viii) Stopping, then resuming.**", "**(xi) A remote park answered and resumed.**"
- `cli/test/watcher-remote-dispatch.test.mjs`, `cli/test/remote-run.test.mjs`, `cli/test/create-worktree.test.mjs`

**Problem.** Verified in the current tree. For a remote record, each of the four commands only writes a file:

- `branch-pause` writes `PAUSE` into the mirror. `relay_remote_pauses` then sends `remote-run.sh pause`.
- `branch-resume` writes `RESUME`. `resume_paused_run`'s remote arm sends `dispatch --resume pause`.
- `branch-answer` writes `answer_<n>.md` into the mirror. `relay_remote_answers` sends `dispatch --resume answer --answers-from <clar_dir>`.
- `branch-user-review` writes the inbox. The watcher's inbox pass fast-forwards the mirror, commits `chore: add user review for <branch>`, pushes and dispatches `engine: user_review`.

So acting on a remote run needs a mirror, a record (hence `adopt` for a run started on GitHub, observation 1), a sync, and the local watcher running at that moment. Each command's own report says so ("the local watcher must be running for that to happen").

GitHub already accepts all four. `harness-run.yml`'s `workflow_dispatch` takes `action: pause`, `resume: pause`, `resume: answer` with `answers`, `park_loop_clear`, and `engine: user_review`. `remote-run.sh` already composes them in `verb_pause` and `verb_dispatch`, including the 65,535-character payload refusal.

**Fix — the decisions the review left open, settled here:**

- **Collecting the answers to a park with several open question files:** in one invocation. `branch-answer` shows every open question file of the park, takes `$ARGUMENTS` as the answer to its target, and asks the user for each other open file's answer in the same session. It sends one `resume: answer` dispatch only when every one has an answer. Nothing is stored between invocations, so no local copy is needed. A user who declines one gets nothing sent and is told the whole park is answered in one go. The usual park is one `question_<n>.md` holding several `## Q<k>` sections, answered by one labelled text (`Q1: … Q2: …`), and that case is unchanged.
- **Whether an existing local record is updated after a direct dispatch:** yes, by `remote-run.sh` itself, so no prose command writes the registry. After a sent `dispatch` with `--chain 0` and `--resume answer` or `--resume pause`, when the main checkout's registry file exists (`-f`, never created) and holds a record with `execution: github-actions` for the branch, it writes `status running`, `resumed_at <date '+%Y-%m-%dT%H:%M:%S'>` and `resume_kind <answer|pause>` in **one** `hr_registry_set` call. A failed write is one stderr line, and the exit stays 0 because the dispatch was sent. A job-side re-dispatch (`continue` / `poll`) has chain ≥ 1 and no registry, so it is untouched. `pause` writes nothing: the run stays `running` until it yields, and the next `sync` records the pause. The next `sync` stays the record's authority either way.
- **The watcher's relay passes:** removed. Once the commands send the dispatches themselves, nothing writes the files the relays read. The watcher must still never act on a remote record in those passes, so each pass gets an explicit skip rather than a fall-through. A fall-through would `spawn_engine` locally for a remote run.
- **Route for a run that executes on GitHub:** a record with `execution: github-actions`, **or** no record and a `harness run <branch>` run on GitHub. A run with no local record is reachable only through the `<branch>:` prefix. Without a prefix the candidate set stays the registry's, because nothing in these commands reads across branches (observation 1). Every job-side notification already names the branch.

**Fix — `cli/templates/scripts/remote-run.sh`:**

- [ ] **One shared derivation of a branch's newest remote state.** Extract the decision `verb_sync` makes in its cases 2–5 into one function, e.g. `remote_state <download_dir>`, that `sync`, `fetch` (below), `review` (below) and Finding 2's no-record `status` all call. Those cases are: the newest `harness run <branch>` run not `completed` → running; an expired bundle → `paused`/`expired`; a bundle → its `status.json`, with `running` → `paused`/`killed`; no bundle while an older run has one → `paused`/`killed`; no bundle in any run → `failed`. The function reads `list_runs`'s output and leaves its answer in variables: run id, url, GitHub status, state, pause reason, detail, engine, `usage_resume_at`, `park_loop_cycles`, and whether a bundle was downloaded into `<download_dir>`. `sync`'s writes, output lines and exit codes stay byte-identical, and its case 1 (already applied) stays in `sync`.
- [ ] **New verb `fetch <branch> <out_dir> [--repo <root>]`**, a read verb for the commands. It is gated like a sending verb (the default `*)` arm: `execution.target` must be `github-actions`, else exit 2, nothing sent). `<out_dir>` must be an existing, empty directory (else exit 1). It downloads the newest `harness run <branch>` run's `harness-state` bundle into `<out_dir>` when one applies, and writes nothing else anywhere: no registry, no state directory, no `remote_download`. It prints these fixed `key: value` lines, each always present and empty when unknown. The key names are a wire the commands parse:
  - `run_id:`, `run_url:`, `run_status:`
  - `state:` — `none` when no `harness run <branch>` run is listed, else the derivation's state
  - `pause_reason:`, `engine:`, `detail:`
  - `open_questions:` — space-separated `<n>` of every top-level `<out_dir>/clarifications/<branch>/question_<n>.md` (`^question_([0-9]+)\.md$`) with no `answer_<n>.md` beside it
  - `bundle_dir:` — `<out_dir>` when a bundle was downloaded, else empty

  Exit 0 printed (including `state: none`), 1 usage, 2 refused, 3 gh failed. Add it to `usage`, to the header verb list, to the exit map, and to the `WHAT IT NEVER DOES` writes list ("for `fetch`, `<out_dir>` only").
- [ ] **`verb_dispatch` — the record update** described in the decisions above, after the `echo "remote-run.sh: dispatched …"` line. Resolve the registry with `hr_state_path "$root" autonomous_logs/registry.json`, and test `-f` before any `hr_registry_get`, because `hr_registry_get` creates an absent registry. Name the write in the header's `WHAT IT NEVER DOES` paragraph.
- [ ] **New verb `review <branch> --review-file <file> [--repo <root>]`**, used by `branch-user-review`. In order, stopping at the first failure:
  1. Refuse a protected branch (`hr_branch_is_protected`, 0 or 2 → exit 2) and a review file that is not a readable regular file (exit 2). Resolve a relative `--review-file` against the caller's directory, as `--prompt-file` is.
  2. **Refuse a branch with a run in flight**, the remote form of the local candidate rule (`completed` or `failed` only). Run `list_runs` and `remote_state`. `state` must be `completed` or `failed`. `none` is refused ("no `harness run <branch>` run on GitHub"), `running`, `parked`, `park_loop` and `paused` are refused naming the state, and `paused`/`expired` is refused with `expired_line`. Each is exit 2, nothing written.
  3. **The copy.** When the main checkout's registry (tested `-f`) holds a remote record whose `worktree` exists and is on `<branch>` (`git -C <wt> symbolic-ref --short HEAD`), use that mirror: `git -C <wt> fetch origin <branch>` then `git -C <wt> merge --ff-only origin/<branch>`, as the watcher's remote inbox path does. The mirror is never removed. Otherwise run `create-worktree.sh --existing --no-bootstrap <branch>` (below) into `hr_worktree_dir`, recording first whether that directory and `refs/heads/<branch>` existed. Remove the copy on every exit with the same trap-and-explicit-call pattern as Finding 4's `start_remove_copy`: `git worktree remove --force`, `git worktree prune`, and `git branch -D` only for a local branch this verb's `--existing` DWIM-created. If the branch is checked out in another working copy, `create-worktree.sh` refuses and names it. That refusal is exit 4. **No bootstrap ever runs**: the copy holds one placed file and never builds or runs code.
  4. **The round, from the branch tip.** Resolve `state_rel=$(hr_state_dir <copy>)`. List the tracked files with `git -C <copy> ls-tree --name-only HEAD -- <state_rel>/user_reviews/`. That is `origin/<branch>`'s tree, which is the engine's own round source. Keep each basename matching `^(.+)_review(_[0-9]+)?\.md$` whose captured branch **equals** `<branch>` exactly. The unsuffixed file is round 1. Next round: `<branch>_review.md` when none matched, else `<branch>_review_<max+1>.md`. The computation lives here, not in prose, so the command and the engine cannot disagree.
  5. Place with `hr_place_artifact`. Commit with `hr_commit_placed` and the subject from a new library producer `hr_user_review_subject <branch>` → `chore: add user review for <branch>`, added beside `hr_task_prompt_subject`. Switch the watcher's existing call site (`"chore: add user review for $branch" "user review"`) to it, so the subject has one producer. Status 1 → exit 4. Status 3 cannot happen for a new round's file and reads as exit 4. Push with `hr_push_landed` (not landed → exit 4).
  6. Remove the temporary copy (not the mirror), then `engine=user_review resume=none chain=0` and `verb_dispatch`, with `dispatch_fail_note` naming the re-send `remote-run.sh dispatch <branch> --engine user_review` (exit 3 after the push, as in `start`). Print `remote-run.sh: placed <rel> (round <n>) on <branch>` before the dispatch line.
  7. When a remote record exists, write `status running` and `engine user_review` to it in one `hr_registry_set` call (a failure is one stderr line).

  Exit map: 0 sent; 1 usage or configuration; 2 refused, nothing written; 3 gh failed (the listing, or the dispatch after the push); 4 placement failed (the copy, the fast-forward, the commit or the push), nothing dispatched. Add `review` and `fetch` to the header with paragraphs of their own, as `start` and `adopt` have, and to `usage`.

**Fix — `cli/templates/scripts/create-worktree.sh`:**

- [ ] **Accept `--existing --no-bootstrap`**: check out the existing branch, skip the bootstrap, never push. Delete the mutual-exclusion refusal ("--no-bootstrap is valid only when creating a new branch, not with --existing"). Rewrite the header's `--no-bootstrap` paragraph: its callers are now `remote-run.sh start` (new branch) and `remote-run.sh review` (existing branch). Replace "Refused with `--existing` … so it always wants the bootstrap" with: an existing branch's copy that a person or a local run works in still wants the bootstrap, so `--existing` alone keeps it, and `--no-bootstrap` is for a copy that only places and commits one file. Update `usage`, the `Usage:` comment, and the line under exit 4 ("never under `--no-bootstrap`").
- [ ] **Test** in `cli/test/create-worktree.test.mjs`: `--existing --no-bootstrap` on a branch only on origin creates the copy on that branch, runs no `setup-worktree.sh` (assert no `deps.marker` or the suite's existing bootstrap sentinel), and pushes nothing.

**Fix — `cli/templates/scripts/autonomous-watcher.sh` (relays removed):**

- [ ] Delete `relay_remote_pauses` and its call in `tick`. Delete `relay_remote_answers`. Delete `remote_relay_call` once it has no caller (grep first). In `resume_parked_run` and `resume_paused_run`, replace the remote arm with an early `record_is_remote "$branch" && return 1`, placed before the kill-switch test so the pass logs nothing for it. In `clear_park_loops`, add `record_is_remote "$b" && continue` and drop the `park_loop_clear_pending` write.
- [ ] Header: replace the `REMOTE DISPATCH` bullet "THE RELAYS — EVERY ONE A USER'S ACTION RELAYED …" with one stating that nothing is relayed. The user's commands send pause, resume and answer to GitHub themselves through `remote-run.sh`, and the parked, paused and park-loop passes skip a remote record. Drop `park_loop_clear_pending` and `pause_relayed_at` from the registry field list. Edit the repro lines that describe "remote relays from that record" and "pause_relayed_at set" to the new skip behaviour. The inbox pass's remote dispatch of a dropped task, review or checklist is unchanged.
- [ ] **Tests** in `cli/test/watcher-remote-dispatch.test.mjs`. Replace the four relay cases ("a fully answered remote park is relayed …", "a RESUME in a paused remote mirror is relayed …", "a PAUSE in a running remote mirror is relayed …", "under AUTONOMOUS_STOP only the pause relay sends …", "a failing gh leaves every relay file …") with cases asserting that a `tick` makes **no** gh call, spawns no engine, and leaves every mirror file and the record's `status` unchanged for each of:
  - a fully answered remote park;
  - `RESUME` in a paused remote mirror;
  - `PAUSE` in a running remote mirror;
  - `PARK_LOOP_CLEAR` in a `park_loop` remote mirror.

  Update the suite's header comment ("hold the relays to the same line").
- [ ] **Tests** in `cli/test/remote-run.test.mjs`:
  - `fetch`: `state: none` with no runs; `running` for an in-progress newest run; a parked bundle printing `open_questions:` and the files under `<out_dir>`; expired; exit 2 under `execution.target: local`; nothing written under the fixture's state directory.
  - `dispatch --resume answer --chain 0` with a remote record: one registry write of `status running`, `resume_kind answer`. With `--chain 1`, or with no registry: no registry file is created.
  - `review`:
    - refused for a branch whose newest run is in progress, and for a `parked` bundle, both with origin unchanged;
    - the round is `_2` when `origin/feat_x` carries `feat_x_review.md` and `feat_x_extra_review_5.md` (exact equality);
    - the commit subject `chore: add user review for feat_x`, and one `engine=user_review` dispatch;
    - no copy and no local branch left when no mirror existed;
    - no bootstrap run.

**Fix — the five plugin commands** (route as decided above; GitHub-only runs need the prefix):

- [ ] **Common to `branch-pause`, `branch-resume`, `branch-answer`, `branch-user-review`:**
  - Delete the "**Runs started on GitHub are adopted first.**" bullet and every mention of `adopt`.
  - Keep "**Remote records sync first.**" for building candidates from records.
  - Replace "**A prefix naming an unknown branch stops.**" with this route rule. When the prefix names a branch the registry does not hold:
    1. make a temporary directory (`mktemp -d`);
    2. run `bash <scripts_dir>/remote-run.sh fetch <branch> <tmp>` once;
    3. on exit 2, or on `state: none`, report that no run of that name is known locally or on GitHub and stop;
    4. on exit 1 or 3, report its message and stop;
    5. otherwise the branch takes the GitHub route with the printed state.

    Remove the temporary directory before the command ends, on every path.
  - A branch with a remote record takes the GitHub route with its synced state. A record without `execution` keeps today's local marker-file steps exactly.
  - Update each `## Resolved values` `<scripts_dir>` row and the closing scope fence to list exactly the `remote-run.sh` verbs the command invokes now, and never `adopt`. Remove the "local watcher must be running" sentences.
  - The local kill switch `AUTONOMOUS_STOP` does not gate a remote dispatch; the job-side brake is `HARNESS_REMOTE_STOP`. `branch-resume`'s warning says so for the GitHub route.
- [ ] **`branch-pause`**, GitHub route: proceed only when the state is `running`, else report it and stop as today. Run `bash <scripts_dir>/remote-run.sh pause <branch>` and report its result (0 sent; 2 or 3 with its message). Never write `PAUSE`. Report that the job finds the `harness pause <branch>` run by polling and yields at its next clean checkpoint, as a local run does. Keep the `remote-run.sh stop` sentence.
- [ ] **`branch-resume`**, GitHub route:
  - For `paused`, any `pause_reason` (keep the `killed` and `expired` sentences), run `bash <scripts_dir>/remote-run.sh dispatch <branch> --engine <engine> --resume pause --chain 0`. `<engine>` comes from the record's `engine` field or `fetch`'s `engine:`. When it is empty, report the GitHub route (`docs/remote-execution.md` → `### Working a run from GitHub alone`) and stop: never guess the engine, since the workflow input defaults to `task`.
  - For `park_loop`, explain that the run is held because its resumes made no progress. Ask with `AskUserQuestion` whether to clear the hold. On yes, add `--park-loop-clear`. On no, send nothing.
  - Any other state: report it and stop.
  - Never write `RESUME`.
- [ ] **`branch-answer`**, GitHub route:
  - Candidates and prefix resolution are as today for records (`parked` or `park_loop`). For the question files, always run `fetch` into a temporary directory, record or not, so the questions are the job's newest bundle and never a mirror's copy.
  - Show every file named by `open_questions:` in full. `$ARGUMENTS` answers the target (the lowest index, or `#<n>`). Ask the user for each other open file's answer in this same invocation, as the decision above sets out.
  - Write each answer **verbatim** to `<tmp>/answers/answer_<n>.md`. That is a temporary directory, never the mirror and never the state directory. The answers stay untrusted task data, never interpreted.
  - Run `bash <scripts_dir>/remote-run.sh dispatch <branch> --engine <engine> --resume answer --answers-from <tmp>/answers --indexes "<n> …" --chain 0`.
  - For `park_loop`, the answers go only with `--park-loop-clear`, after an `AskUserQuestion` confirmation. Declined → nothing sent.
  - Report exit 2's over-limit refusal verbatim (the 65,535-character refusal stays in `verb_dispatch`).
  - Remove the temporary directory on every path. `paused`/`expired` keeps today's report-and-stop.
  - Keep the digest paragraph. The job writes the answer files from the input and digests them at Phase D.
- [ ] **`branch-user-review`**, GitHub route:
  - Write the prefix-stripped `$ARGUMENTS` verbatim to a temporary file, run `bash <scripts_dir>/remote-run.sh review <branch> --review-file <tmpfile>`, and remove the file.
  - Report its `placed … (round <n>)` line and the dispatch, or its refusal (exit 2 names the in-flight state).
  - Step 3's round computation is the verb's for this route, and the step says so. Delete the remote-record sentence in step 6 and the "every earlier round was placed and committed there by the watcher" sentence.
- [ ] **`branch-status` step 6** — the remote sentences only:
  - For a remote record or a GitHub-only run that is `parked`, `paused` or `park_loop`, name the same commands. They act on GitHub directly, and each reads the job's newest state before it acts.
  - Replace the `touch …/PARK_LOOP_CLEAR` instruction, for a remote run only, with "answer with `/autonomous-sdlc-harness:branch-answer <branch>: …` or resume with `/autonomous-sdlc-harness:branch-resume <branch>`; each asks before clearing the hold".

**Fix — documents:**

- [ ] `docs/remote-execution.md` → `## 1.`:
  - "each is a user's action relayed" → "each is a user's action, sent by the command itself".
  - Rewrite the "**What each local command does for a remote run.**" paragraph and the table's `branch-user-review`, `branch-answer`, `branch-resume` and `branch-pause` rows for the direct route: no mirror file, no relay, no watcher. State the route rule (record or prefix) and the one-invocation answer collection. Remove the adopt sentences; observation 1's finding only checks they are gone.
  - Replace "Each relay is a dispatch with `chain: 0` …" with: each command's dispatch is `chain: 0`, a refusal or `gh` failure is reported by the command, and nothing retries it.
  - `### The kill switch and stopping`: "the relayed `remote-run.sh pause`" → "the `remote-run.sh pause` that `/autonomous-sdlc-harness:branch-pause` sends".
- [ ] `docs/github-issue-trigger.md` → `## 5. Working the run`: the four commands act on GitHub directly when given the branch prefix, with no adopt, copy, sync or watcher. Keep the four fenced commands, one per block (ledger rule), and the "notifications name both routes" sentence. Leave `## 4.` to Finding 1.
- [ ] `plugin/docs/AUTONOMOUS_FLOW.md`: add one sentence each to `## Drop a user review (fix cycle)`, `## Answer a clarification (park-and-ask)` and `## Pause / resume a run`. For a run that executes on GitHub, the command commits and pushes the review and dispatches the fix cycle, sends the answers as the dispatch's input, or sends the pause or resume dispatch itself, and no local watcher takes part.
- [ ] `plugin/instructions/autonomous_pause_and_ledger.md`: "reaches the job as a relayed request" → "reaches the job as the `harness pause <branch>` dispatch the operator's command sends".
- [ ] `docs/development.md` Gate 12:
  - In (iv), (viii) and (xi), drop the `autonomous-watcher.sh tick` relay steps and the "relays" pass criteria. The commands' own dispatch is what is observed: (iv) the `harness pause` run appears after `/autonomous-sdlc-harness:branch-pause <branch>` alone; (viii) the resume dispatch follows `/autonomous-sdlc-harness:branch-resume <branch>`; (xi) the answer dispatch follows `/autonomous-sdlc-harness:branch-answer <branch>: …`, and its sync step is no longer needed.
  - Leave the dated round records as they are: they are history.
