### Task 2 — Launch every engine session with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` and log the CLI's stopped-agents line

**Goal:** Every headless engine session waits for its background sub-agents for as long as they run. If the CLI ever does stop them, `watcher.log` says so, naming the branch.

**The fact this rests on, as measured.** The run log of `fix_task_offer_check_script` (Claude Code 2.1.314, 2026-10-30) carries the CLI's own stderr line: `Background tasks still running 10m after the last turn (subagent "Write task plan with answers"); stopping them. Set CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0 to wait indefinitely.` It is followed by `✅ success turns=23` and an exit 0. The engine's stderr reaches the run log through the launch line's `2>>"$log_path"`. That is why the line is found in `<branch>.log` and not in the `.stream.jsonl`.

**Where this task stops.** The exit classification is untouched here, and so is the classification order. Splitting the `rc -eq 0` arm on the ledger is **Task 3's**, in the same file, after this task lands. This task touches only `spawn_engine`'s launch subshell, one new helper and the header.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — the export in `spawn_engine`'s subshell, the log-offset capture and the stopped-agents scan, a new header paragraph and a `REPRO` entry.
- `cli/test/watcher-background-wait.test.mjs` (new) — the suite for both behaviours.

**Work:**

- [ ] In `spawn_engine`'s launch subshell, directly after `export HARNESS_MAIN_REPO="$MAIN_REPO"`, add `export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`. Give it a comment in the existing one's form: set unconditionally inside the subshell, so a value inherited from the watcher's environment, or sourced from `watcher.env`, is overwritten for the session and seen by no other child of the watcher.
  - **Decision recorded here: an operator's own value does not override it.** A nonzero ceiling is exactly the `fix_task_offer_check_script` failure.
  - This is the one launch every engine, every resume pass and job mode go through. `run_job` reaches the engine only through `spawn_engine`, and `harness-run.yml` starts no session itself.
- [ ] In the same subshell, before the `{ … exec "$AGENT_CLI" … }` pipeline, record the run log's current byte length: `wc -c` on `"$log_path"`, with a missing file read as 0, and the value normalised through `$(( … ))` because BSD `wc` pads with spaces. Directly after `rc=${PIPESTATUS[0]}` and before `record_run_analytics`, call a new function `log_stopped_background_tasks <branch> <log_path> <offset>`. Define it next to `record_run_analytics`.
  - It reads only the bytes appended since `<offset>` (`tail -c +$((offset + 1))`).
  - It looks for a line carrying both `Background tasks still running` and `stopping them`.
  - For each such line it writes one `log` line: `run '<branch>': the agent CLI stopped background tasks still running after the session's last turn — CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0 did not take: <the CLI's line>`.
  - It always returns 0, reads and writes no registry field, and never notifies, so it cannot change `rc` or the classification. This holds whatever `classify_run_exit` then decides, the pause and park arms included.
- [ ] Add a header paragraph after `THE STALENESS WATCHDOG HEALS WHAT THE RECONCILE PASS CANNOT SEE.`, headed `BACKGROUND SUB-AGENTS ARE WAITED FOR.` It states:
  - the CLI's default 10-minute wait after the last turn, with the measured line above, its version and its date, and what it cost (a stopped planner and an exit 0);
  - the export and the decision that no operator value overrides it;
  - how the watchdog sees a session that is only waiting on a background agent: the agent's `tool_use` events reach the `.stream.jsonl` and, through the formatter, which keeps every assistant `tool_use` whatever agent produced it, the run log. The incident log shows the background planner's `→ Read` / `→ Bash` lines arriving after the orchestrator's last turn. So a working agent keeps the liveness mtime moving;
  - that a hung background agent emits nothing, and so is warned about, killed, reset and resumed from the ledger exactly as before, under the same `STALL_*` tunables and busy-CPU gate;
  - the stopped-agents line as the tripwire that the setting did not take.
- [ ] Add a `REPRO` entry, `bg wait`, in the existing entries' form: a stub that saves `"${CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS-unset}"` → `0`, also with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=600000` in the watcher's environment; a stub that writes the CLI's stopped line to stderr → one `stopped background tasks` line in `watcher.log` naming `feat_x`.
- [ ] Create `cli/test/watcher-background-wait.test.mjs` on `createWatcherFixture` (`cli/test/helpers/watcher.mjs`). Launch each session by `seedRecord({ status: 'paused' })` plus an empty `sdlc-harness/RESUME`, then one `tick`, as the existing pause-resume suites do. Its header opens with the rule: *every engine session the watcher spawns carries a zero background-wait ceiling whatever the watcher's own environment says, and a session whose CLI stopped background tasks is named in `watcher.log`, whatever its classification*. Cases:
  - **env, default:** the stub body writes `${CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS-unset}` to a fixture file → `0`.
  - **env, inherited:** the same, with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '600000'` passed to `tick` → still `0`.
  - **env, override file:** the same, with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=600000` in `<dir>/home/.config/autonomous-sdlc-harness/watcher.env` → still `0`.
  - **stopped line:** the stub body prints the measured line above to stderr → exactly one `watcher.log` line containing `stopped background tasks` and `feat_x`, and the record is `completed`. The case writes no ledger, so the outcome is today's, before Task 3 and after it (Task 3 keeps a ledger-less zero exit `completed`).
  - **stopped line, paused:** the same, plus the body writes `sdlc-harness/PAUSE_ACK` → the record is `paused` and the `watcher.log` line is still there.
  - **earlier session only:** the run log already holds that line before the `tick`, and the stub prints nothing → no `stopped background tasks` line in `watcher.log`.
  - The header records each case's red mutation and states each was run red once against the fixture's installed copy of the watcher, never the tracked template: the export removed → the default case; the export written as `"${CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS:-0}"`, so an operator value wins → the inherited and override-file cases; the offset dropped (whole-log scan) → the earlier-session case; the scan call removed → both stopped-line cases.

**Verification:**

- `npm test --workspace cli -- test/watcher-background-wait.test.mjs` passes.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` exits 0.
- `git grep -n 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0' -- cli/templates/scripts/autonomous-watcher.sh` shows exactly one `export` line, inside `spawn_engine`'s subshell, plus the header and `REPRO` text. There is no second launch site.

**Deviations from plan:**
- The launch-contract header above `spawn_engine` ("The flag string, in full:") now lists `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` under `HARNESS_MAIN_REPO=<MAIN_REPO>`, and its "The environment line is exported…" sentence is pluralised. The plan named only the new header paragraph, but that block states the engine's invocation contract and would otherwise be false (`.claude/context/cli.md` → a reviewer holds a change to its module's own header).
- The `git grep` bullet's hits are: the export (one), the new header paragraph (two lines), the flag-string line above, and the `log` message in `log_stopped_background_tasks`, which names the setting. The `REPRO` entry spells the variable as `"${CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS-unset}"` and `=600000`, as the plan worded it, so it is not a hit for `=0`.
- Evidence downgrade: `bash -n cli/templates/scripts/autonomous-watcher.sh` was refused by the tool layer (don't-ask mode), twice. The claim rests instead on `bash scripts/typecheck.sh`, whose output read `check-shell-parse: 97 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` then `PASS: typecheck`, and on the fixture sourcing the installed watcher in each of the suite's six passing cases.
- Red runs: run once through `bash scripts/scratch-run.sh harness-runs/scratch/bg-wait-red.mjs`, which applies each of the four header-named mutations to the fixture's installed watcher copy and asserts the mutated outcome. All 6 of its cases passed (the default case read `unset`; the inherited and override-file cases read `600000`; whole-log scan → 1 line; scan removed → 0 lines in both stopped-line cases). The scratch file is not committed.
