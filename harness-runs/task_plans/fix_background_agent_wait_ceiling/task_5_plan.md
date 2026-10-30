### Task 5 — Show a paused run's reason and its way on in `/autonomous-sdlc-harness:branch-status`

**Goal:** `/autonomous-sdlc-harness:branch-status` prints a local record's `pause_reason` and names the way on for every `paused` run. For `unfinished` it says the session ended before its ledger finished and that `/autonomous-sdlc-harness:branch-resume <branch>` continues it from the ledger. Today step 6 names a way on for `parked`, `completed` and `park_loop`, but none for `paused`.

**Depends on:** Task 3, which writes the value this command reads. A run whose session exited 0 before its ledger finished becomes registry `status: "paused"` with `pause_reason: "unfinished"` in one write. The ledger is the flow-progress ledger for the task and user-review engines, and the checklist `<state_dir>/docs_catalog/<branch>_docs.md` for the docs engine. Locally such a record carries no `paused_by`, so nothing resumes it until `/autonomous-sdlc-harness:branch-resume` drops `RESUME`. A remote record gets the same value through `remote-run.sh sync` (Tasks 1 and 4). This task reads the field and changes no producer.

**Where this task stops.** `/autonomous-sdlc-harness:branch-resume`, `/autonomous-sdlc-harness:branch-answer` and `/autonomous-sdlc-harness:branch-pause` need nothing (the story index's `## Scope register`, rows 10–12). This command stays read-only: no new script call, no write.

### Targets

- `plugin/commands/branch-status.md` — `## Steps` step 3 and step 6.

**Work:**

- [ ] Step 3: after the per-run fields, add one clause. For a `paused` record, also print `pause_reason` when it is non-empty, and `paused_by` when it is `usage`. The **Remote record** arm already prints the synced `pause_reason`. Leave that arm as it is.
- [ ] Step 6: add a **`paused`** arm beside the `parked` / `completed` ones. For a local `paused` run, name `/autonomous-sdlc-harness:branch-resume <branch>` as the next action, with the real branch substituted. Then add one sentence per case:
  - `pause_reason` `unfinished`: the session ended (exit 0) before its ledger finished — the flow-progress ledger, or the docs checklist for a docs run — and the resume continues at the first `[ ]` entry. Show the last few lines of a bounded, single read of `<MAIN_REPO>/<state_dir>/autonomous_logs/watcher.log` naming this branch and `paused (unfinished)` or `stopped background tasks`, in the same form as the `park_loop` arm's read. Never `tail -f`.
  - `paused_by` `usage`: the watcher resumes it by itself after the recorded reset, so no action is needed.
  - The existing remote-record paragraph already covers `paused`. Do not restate it.
- [ ] Keep the closing read-only paragraph true. The new read is of `watcher.log`, which step 6 already reads for `park_loop`, so no new file, script or verb is added to what the command touches.

**Verification:**

- `git grep -n 'unfinished' -- plugin/commands/branch-status.md` shows the new step-6 sentence, spelled exactly `unfinished`, the registry value Task 3 writes. `git grep -n 'paused (unfinished)\|stopped background tasks' -- plugin/commands/branch-status.md` shows the two log substrings, which match the `watcher.log` lines Tasks 2 and 3 write, byte for byte.
- `git grep -n 'remote-run.sh' -- plugin/commands/branch-status.md` lists the same verbs as before (`list`, `status`, and `sync` only in the "never" sentence).
- `git diff -- plugin/commands/branch-status.md` touches no line of the frontmatter fence and no `## Resolved values` row.
