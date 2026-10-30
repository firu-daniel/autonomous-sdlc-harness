### Task 7 — Document the wait ceiling, the ledger check and `unfinished` in `docs/watcher.md` and `ARCHITECTURE.md`

**Goal:** The operator's document of the watcher states three things: every session is launched with the background-wait ceiling off; a zero exit is `completed` only over a finished ledger, else `paused` with `pause_reason` `unfinished`; and what the stopped-agents log line means. `ARCHITECTURE.md`'s launch-path inventory names the second environment variable the session now carries.

**Depends on:** Tasks 2, 3 and 4. What they built, restated so this task documents it without reading their files:
- **Task 2:** `spawn_engine`'s launch subshell exports `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` unconditionally, so neither an inherited value nor `watcher.env` reaches the session. When the session's own part of the run log carries the CLI's `Background tasks still running … stopping them` line, `watcher.log` gets `run '<branch>': the agent CLI stopped background tasks still running after the session's last turn — CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0 did not take: <line>`, whatever the classification.
- **Task 3:** after the unchanged pause → park order, a zero exit reads the run's ledger.
  - The task and user-review engines read `<state_dir>/flow_progress/<branch>_progress.md`. All four phases must be `done`, the header's engine must be the run's, and a user-review ledger's round must be the active round.
  - The docs engine reads `<state_dir>/docs_catalog/<branch>_docs.md`: no `[ ]` entry.
  - Finished → `completed`. Unfinished → `paused`, `pause_reason` `unfinished`, `watcher.log` `run '<branch>' paused (unfinished) — …`, and one `paused` notification naming `/autonomous-sdlc-harness:branch-resume <branch>`. Absent or unreadable → `completed`, plus one `classify: … has no readable ledger` line.
  - The local record carries no `paused_by`, so only `/autonomous-sdlc-harness:branch-resume` resumes it.
- **Task 4:** in a job, an `unfinished` pause is auto-resumed under `REMOTE_AUTO_RESUME_MAX` and `REMOTE_AUTO_RESUME_DELAY_SECS`, then ends `paused` / `stop` with one notification. `docs/remote-execution.md` is Task 8's.

### Targets

- `docs/watcher.md` — `## 1. The loop in one page` steps 6 and 7, the status table's `completed` and `paused` rows, and `## 4. Pausing, parking and the usage gate`.
- `ARCHITECTURE.md` — `## 5. Where the engine is reached — the launch path`, the `spawn_engine` row, and `## 7. The seam: what an adapter would have to carry`, item 1.

**Work:**

- [ ] `docs/watcher.md` §1:
  - step 6 adds `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` beside `HARNESS_MAIN_REPO` in the session's environment, with one sentence on why and that no operator value overrides it;
  - step 7 says the zero-exit case reads the run's ledger, per engine as above, and names the absent/unreadable rule;
  - in the status table, `completed` becomes *the session ended cleanly with no park or pause signal **and its ledger finished*** (an absent ledger keeps it, as stated in step 7), and `paused` gains *or its session exited 0 before its ledger finished (`pause_reason` `unfinished`)*, its *What ends it* cell naming `/autonomous-sdlc-harness:branch-resume`.
- [ ] `docs/watcher.md` §4: add a paragraph, **A zero exit over an unfinished ledger is a pause, not a completion.**, after the parking paragraphs. It covers:
  - the incident in one sentence, with the CLI's measured line, its version (Claude Code 2.1.314) and its date (2026-10-30), per `.claude/context/conventions.md` → `## Documents of record`, *"A measured fact states what was measured, the command and the exact message"*;
  - the ceiling setting and its no-override decision;
  - how the stall watchdog sees a session waiting on a background agent: the agent's tool calls reach the stream and the run log, so a working agent keeps liveness moving and a hung one is killed and resumed as before;
  - the `unfinished` record and its way on, with the resume command in a fenced block of its own (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*);
  - the `stopped background tasks` `watcher.log` line, as evidence the setting did not take.
  Give the remote case one sentence pointing at [`remote-execution.md`](remote-execution.md) → `### API errors`.
- [ ] `ARCHITECTURE.md` §5, the `spawn_engine` row:
  - *"The session is launched with one environment variable, `HARNESS_MAIN_REPO`, …"* becomes two: `HARNESS_MAIN_REPO` as now, and `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, which keeps the CLI from stopping the session's background sub-agents after its last turn;
  - its *binds* cell notes the second is one CLI's spelling of a behaviour;
  - its adapter cell adds *a way to make a headless session wait for its background sub-agents*.
  Keep the row's `[shipped]` status and the section's site count: this is no new site, it is the same `spawn_engine` row.
- [ ] `ARCHITECTURE.md` §7 item 1 (*Launch a session*): add that the launched session waits for its background sub-agents after its last turn, in the item's `[designed]` voice, still *forced by* §5's `spawn_engine` row.

**Verification:**

- `git grep -n 'with one environment variable' -- ARCHITECTURE.md` prints nothing, and `git grep -n 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS' -- ARCHITECTURE.md docs/watcher.md` shows the §5 row, §7 item 1, and `docs/watcher.md` §1 and §4.
- `git grep -n 'unfinished' -- docs/watcher.md` shows the status table's `paused` row, step 7 and the §4 paragraph, each spelled exactly as the registry value.
- Every command the new text gives an adopter sits alone in a fenced block, one per line.
