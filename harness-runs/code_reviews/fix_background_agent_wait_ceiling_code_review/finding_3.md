### 3. The header and the docs say a local `unfinished` record carries no `paused_by` and only `branch-resume` resumes it, which is false when the usage gate had requested a pause

**File:** `cli/templates/scripts/autonomous-watcher.sh`, the registry field list → `pause_reason`: "Locally it waits for /autonomous-sdlc-harness:branch-resume and carries no"

On a local run, the usage gate tags a still-`running` record `paused_by=usage` (with `usage_resume_at`) before it drops `PAUSE`. If that session then exits 0 over an unfinished ledger without writing `PAUSE_ACK`, `classify_run_exit` writes `status paused pause_reason unfinished` and leaves both tags in place.

`usage_gate`'s resume side keys on `paused_by` alone (`[ "$pb" = "usage" ] || continue`), so it drops `RESUME` for this record at the recorded reset, and `resume_paused_run` relaunches it. That behaviour is right: the window was exhausted, and resuming at the reset is what the gate is for. The new prose says the opposite in four places, and a reader of `branch-status`, of the docs or of the header would wrongly conclude that nothing will pick the run up:

- the watcher header comment above: *"carries no `paused_by`, so the usage gate never resumes it"*;
- `docs/watcher.md` → `## 4. Pausing, parking and the usage gate`: *"The record carries no `paused_by`, so neither the usage gate nor any other local pass resumes it"*;
- `docs/watcher.md` → `## 1. The loop in one page`, the status table's `paused` row: *"an `unfinished` pause only by `/autonomous-sdlc-harness:branch-resume`"*;
- `plugin/instructions/autonomous_pause_and_ledger.md` → §2.5: *"nothing local resumes it on its own"*.

`plugin/commands/branch-status.md` step 6 already handles this case correctly (*"`paused_by` `usage`: … the watcher resumes it by itself after the recorded reset"*). The other four are what disagree. `.claude/context/cli.md` → `## What "done" means here` holds a change to its own module header: either the code satisfies the header or the header is amended.

**Fix:** keep the code and correct the four statements.

1. `cli/templates/scripts/autonomous-watcher.sh`, the `pause_reason` field comment: replace `Locally it waits for /autonomous-sdlc-harness:branch-resume and carries no \`paused_by\`, so the usage gate never resumes it.` with `Locally it waits for /autonomous-sdlc-harness:branch-resume, unless the usage gate had already tagged the run \`paused_by=usage\`, in which case the gate resumes it at the recorded reset.`, and re-wrap the comment lines. Then copy the file byte for byte over `scripts/autonomous-watcher.sh` and confirm with `cmp` that the two files are identical.
2. `docs/watcher.md` → `## 4.`: replace `The record carries no \`paused_by\`, so neither the usage gate nor any other local pass resumes it; the run continues from its ledger when you run:` with `No local pass resumes it, unless the usage gate had already asked the run to pause (\`paused_by=usage\`), in which case the gate resumes it at the recorded reset; otherwise the run continues from its ledger when you run:`.
3. `docs/watcher.md` → the status table's `paused` row, "What ends it" cell: replace `an \`unfinished\` pause only by \`/autonomous-sdlc-harness:branch-resume\`` with `an \`unfinished\` pause by \`/autonomous-sdlc-harness:branch-resume\`, or by the usage gate when it had requested that pause`.
4. `plugin/instructions/autonomous_pause_and_ledger.md` → §2.5, the paragraph opening *"In the nothing-pending case (BG1)"*: replace `the flow stops mid-phase, nothing local resumes it on its own, and it waits for` / `` `/autonomous-sdlc-harness:branch-resume`. `` with `the flow stops mid-phase and waits for \`/autonomous-sdlc-harness:branch-resume\`.`. Dropping the clause keeps the word count down, and the precise rule is the watcher's to state.

No test asserts these comments or this prose, so this fix runs none.
