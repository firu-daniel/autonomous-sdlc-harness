# cli review — ### 3. Pause, resume, answer and user-review on a remote run need a local copy, an adopt, a sync and a running watcher, though GitHub accepts every one of them directly — iteration 0

Verification run: `npm test -- test/remote-run.test.mjs test/create-worktree.test.mjs test/watcher-remote-dispatch.test.mjs` from `cli/` passed (`# tests 98`, `# pass 98`, `# fail 0`). The findings below come from reading the code, not from a probe.

## Should Fix
1. **The watcher's kill-switch header paragraph still describes the removed pause relay** — `cli/templates/scripts/autonomous-watcher.sh` (header paragraph `THE KILL SWITCH IS THE OPERATOR'S, AND THIS SCRIPT NEVER DELETES IT.`) — "Relaying a remote run's pause is the one action that still runs under the brake, because it starts nothing (see REMOTE DISPATCH)."
   The unit deleted `relay_remote_pauses` and its call in `tick`, and rewrote the `REMOTE DISPATCH` bullet to "NOTHING IS RELAYED". Every other mention of the relay was updated, but this header paragraph still says the script sends something while the brake is on. A reader of the header would think a remote pause still goes out under `AUTONOMOUS_STOP`, and `.claude/context/cli.md` → `## What "done" means here` holds a change to its module's own header.
   **Fix:** Delete that sentence. If the paragraph should still say something about remote runs, use: "A remote run's pause is sent by `/autonomous-sdlc-harness:branch-pause` itself and is not gated by this switch (see REMOTE DISPATCH)."

2. **`review`'s in-flight refusals say "nothing written" after writing the bundle cache** — `cli/templates/scripts/remote-run.sh` (`verb_review`) — "refused, nothing written: $branch is $RS_STATE on GitHub"; also the header exit map's "2  refused, nothing sent or written: execution.target is not github-actions (sending verbs, fetch, review and adopt); for review, … or a run in flight"
   Step 2 of `verb_review` calls `remote_state ""`. Whenever the newest run is `completed` and has a bundle, that call does `mkdir -p` and `gh run download` into `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/` before the state is judged. This is the plan deviation the implementer recorded, and the `review` header paragraph says so ("the one write a refusal makes"). But the `parked`, `park_loop`, `paused` (bundle) and `completed`-bundle-says-running refusals still print "refused, nothing written", and the exit-map line for 2 still promises "nothing sent or written". An operator or a command reading the message would wrongly conclude that nothing changed on disk.
   **Fix:** In `verb_review`'s in-flight refusal arms (`none`, `paused` and `*`), change "refused, nothing written:" to "refused, nothing pushed or sent:". In the exit map's code-2 entry, add "(for review's in-flight refusal, nothing pushed or sent; the bundle may be cached under `remote_download/`, as `sync` caches it)". The protected-branch and review-file refusals come before any download, so they keep "nothing written".

3. **A library comment still says a mirror answer is waiting to be relayed** — `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_remote_bundle_restore` header) — "leaves the target alone: in a mirror it may hold an answer not yet relayed."
   After this unit, nothing relays a mirror's `answer_<n>.md`: `branch-answer` writes its answers to a temporary directory and sends them itself. So the reason this comment gives for leaving the target alone no longer holds.
   **Fix:** Replace the clause with "leaves the target alone: in a mirror it is the last synced bundle's copy, and the next bundle that carries one replaces it."

## Nice to Have
1. **`start_remove_copy`'s comment names only `start`** — `cli/templates/scripts/remote-run.sh` (`start_remove_copy`) — "remove the working copy and the local branch `start` cut … may leave the placed, uncommitted prompt, which is only a copy of --prompt-file."
   `verb_review` now installs the same trap for the copy it cuts, and that copy may hold an uncommitted review rather than a prompt.
   **Fix:** "remove the working copy and the local branch `start` or `review` cut … may leave the placed, uncommitted prompt or review, which is only a copy of --prompt-file / --review-file."

---

# plugin review — ### 3. Pause, resume, answer and user-review on a remote run need a local copy, an adopt, a sync and a running watcher, though GitHub accepts every one of them directly — iteration 0

This section is appended below the `cli` layer's iteration-0 findings, which share this file name; neither section replaces the other. Verification run: `claude plugin validate --strict plugin` passed. The findings below come from reading the commands against `cli/templates/scripts/remote-run.sh` (`verb_pause`, `verb_dispatch`, `setup_fail`), not from a probe.

## Should Fix
1. **The park-loop resume sentence in `branch-status` still applies to a remote run** — `plugin/commands/branch-status.md` (step 6, the `park_loop` bullet list) — "say the run then resumes on the watcher's next pass once every open question file has its answer, and point at `/autonomous-sdlc-harness:branch-answer` when one does not;"
   The unit scoped the `touch …/PARK_LOOP_CLEAR` bullet to "for a local run" and added a separate remote bullet. The bullet between them is still unscoped, though. A digest for a remote `park_loop` run would therefore say that the watcher resumes the run on its next pass. After this unit, no watcher takes part in a remote run: the resume comes only from the command's own `--park-loop-clear` dispatch.
   **Fix:** Start that bullet with "for a local run, " (as was done for the bullet above it), so the remote bullet is the only one that applies to a remote run.

2. **The GitHub routes leave exit 1 from `remote-run.sh pause` / `dispatch` unhandled** — `plugin/commands/branch-pause.md` (step 5, **GitHub route**) — "exit 0, the pause dispatch was sent; exit 2 or 3, report its message"; also `plugin/commands/branch-resume.md` (step 6) — "exit 0, the resume was sent …; exit 2 or 3, report its message", and `plugin/commands/branch-answer.md` (step 8.5) — "exit 2 — the over-limit refusal included — or 3, report its message verbatim"
   Both verbs can exit 1. `setup_fail` exits 1 on an unresolvable `harness.config.json`. `verb_dispatch` exits 1 on an unreadable answer file or a payload it cannot build, and on any usage error. None of the three routes says what to report in that case. `branch-user-review` step 7 and every step-2 `fetch` handler already list exit 1.
   **Fix:** In each of the three report sentences, change "exit 2 or 3" to "exit 1, 2 or 3" (and in `branch-answer` change "exit 2 — the over-limit refusal included — or 3" to "exit 1, 2 — the over-limit refusal included — or 3"). Keep "nothing reached the run".

---

# general review — ### 3. Pause, resume, answer and user-review on a remote run need a local copy, an adopt, a sync and a running watcher, though GitHub accepts every one of them directly — iteration 0

This section is appended below the `cli` and `plugin` layers' iteration-0 findings, which share this file name; neither section replaces the other. Scope: the files under `.` that no other layer owns (`docs/`, the task file). These findings come from reading the docs against `cli/templates/scripts/autonomous-watcher.sh` (`resume_parked_run`, `resume_paused_run`, `clear_park_loops`), `cli/templates/scripts/remote-run.sh` (`verb_review`, `verb_dispatch`) and `plugin/commands/branch-resume.md` / `branch-answer.md`. No probe was run. `docs/github-issue-trigger.md` → `## 4.` ("adopts **every** candidate once before it acts") and `docs/development.md` (xiii)(c) are also stale now, but the fix plan assigns both to Finding 1, so they are not raised here.

## Must Fix
1. **The park-loop guard still tells the operator to clear a remote hold with `PARK_LOOP_CLEAR` in the mirror** — `docs/remote-execution.md` (`### The park-loop guard`) — "A clear taken locally (`PARK_LOOP_CLEAR` in the mirror) reaches the job as the input `park_loop_clear`."
   This unit removed the relay that read that file. `clear_park_loops` now does `record_is_remote "$b" && continue`, and `docs/watcher.md` → `## 4.` (edited by this unit) says a `PARK_LOOP_CLEAR` in a remote mirror "is never acted on". An operator who follows `### The park-loop guard` will touch the file, and the hold will never clear. Nothing is reported. After this unit the only local clear is `--park-loop-clear`, which `/autonomous-sdlc-harness:branch-resume` or `/autonomous-sdlc-harness:branch-answer` adds after an `AskUserQuestion` confirmation.
   **Fix:** Replace the sentence with: "A clear taken locally — `/autonomous-sdlc-harness:branch-resume <branch>` or `/autonomous-sdlc-harness:branch-answer <branch>: …`, each after the user confirms clearing the hold — reaches the job as the input `park_loop_clear`; a `PARK_LOOP_CLEAR` file in the mirror is never read (§1)."

## Should Fix
1. **`docs/watcher.md` §6 still says the daemon relays answers, resumes and pauses** — `docs/watcher.md` (`## 6. What a human must do, and what ships unexercised`, the **Remote execution adds steps only the adopter can take** paragraph) — "it is what dispatches a remote run's start and relays each answer, resume and pause"
   This unit removed every relay. `## 4.` of the same file now says "Nothing is relayed", so the file contradicts itself. Someone setting up remote execution would read §6 and conclude that answering a remote park needs the daemon running.
   **Fix:** "The daemon from step 1 is still needed: it is what dispatches a remote run's start from a drop; an answer, resume, pause or user review is sent by the command itself, and nothing local has to be running while the job executes."

2. **The `remote-run.sh` row in the scripts table still names the relays as a caller, and omits the two new verbs** — `docs/watcher.md` (`## 2. The scripts`, the `remote-run.sh` row) — "the watcher, for a remote drop and each relay; the remote job; the trigger job; a `branch-*` command, for `adopt`"
   After this unit the watcher calls `remote-run.sh` only for a remote drop. The `branch-*` commands call `fetch`, `pause`, `dispatch` and `review`. The row's verb list ("locally `dispatch`, `pause`, `stop`, `sync`, `status` and `warm`, and `adopt`") also lacks `fetch` and `review`. A reader of the caller column would look for the relay in the watcher. Finding 1 removes the `adopt` clause from this row, but it does not cover the relay or the two new verbs, which are this unit's.
   **Fix:** In the verb list, add "`fetch`, a read of one branch's newest state, and `review`, which places, commits and dispatches a user review" after `warm`. In the caller column, change "the watcher, for a remote drop and each relay; … a `branch-*` command, for `adopt`" to "the watcher, for a remote drop; … a `branch-*` command, for `adopt`, `fetch`, `pause`, `dispatch` and `review`". Finding 1 then drops `adopt`.

3. **Lifecycle step 3 says only `sync` writes to the mirror, but `review` now commits into it** — `docs/remote-execution.md` (`## 1. The lifecycle of a remote run`, step 3 **Dispatch.**) — "From here the local working copy is a **mirror** that only `remote-run.sh sync` fills."; also the mermaid edge `RR -->|"sync fills"| M`
   `verb_review` fast-forwards the record's mirror to `origin/<branch>`, then places and commits the review in it. The `branch-user-review` row in the same section says so ("in the record's mirror fast-forwarded to `origin/<branch>`"). So step 3's "only" is false.
   **Fix:** "From here the local working copy is a **mirror** that only `remote-run.sh sync` fills, and that `remote-run.sh review` fast-forwards to place a user review." Label the diagram edge `"sync fills; review commits"`.
