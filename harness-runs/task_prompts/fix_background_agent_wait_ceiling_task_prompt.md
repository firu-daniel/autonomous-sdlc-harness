`fix_background_agent_wait_ceiling` stops the watcher from reporting a run as finished when its headless session was cut short. It does two things. Headless engine sessions wait for their background sub-agents for as long as those agents run. And the watcher marks a run `completed`, and sends "branch ready for review", only when the run's flow-progress ledger says it finished.

## What happened

`fix_task_offer_check_script` was marked `completed` on 2026-10-30 at 14:37:47 and sent "branch ready for review". It had not written its task plan. Its ledger `harness-runs/flow_progress/fix_task_offer_check_script_progress.md` has every entry still `[ ]`, from P1 on.

The sequence, from the session transcript and the run log:

1. Session 2, the resume after the park answer, ran on Claude Code 2.1.314. It dispatched the `task-plan-writer` ("Write task plan with answers") with no `run_in_background` field. A dispatch without that field runs in the background, and the tool answered "Async agent launched successfully".
2. The orchestrator read instruction files for about 10 seconds. It then ended its turn with "The plan writer is still running. I'll keep going once it reports back."
3. Headless `claude -p` waits at most 10 minutes for background tasks after the last turn. The planner ran longer, so the CLI stopped it. The run log shows `Background tasks still running 10m after the last turn (subagent "Write task plan with answers"); stopping them. Set CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0 to wait indefinitely.`, followed by `✅ success turns=23`.
4. The process exited 0 without parking or pausing. The watcher's classification in `cli/templates/scripts/autonomous-watcher.sh` (the branch whose log line is `run '$branch' completed — branch ready for review`) treats that as completed.

Background dispatches themselves work in headless runs. In `feat_run_gates_flake_resilience` (2.1.310), the orchestrator dispatched the planner in the background and ended its turn. The planner finished 6 minutes later, a `<task-notification>` woke the session, and the run went on. What failed here was only the 10-minute limit. The ceiling and its message are present in every installed CLI build (2.1.311, 2.1.312, 2.1.314). The exit code then hid the failure.

> ⚠️ **Find every anchor in this prompt by its quoted text or function name, never by line number.** Sites were checked at `ef7e35be` (`dev`). Re-find each one, and verify every claim marked *verify* before planning on it.

## What is there today

- **The engine launch.** `spawn_engine` in `cli/templates/scripts/autonomous-watcher.sh` starts every engine session with `exec "$AGENT_CLI" -p "$launch_prompt" …`, where `AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"`. It covers the task, user-review and docs engines, fresh launches and every resume pass. GitHub job mode runs the same watcher (*verify* that job mode reaches `spawn_engine` and has no launch of its own, and that `cli/templates/github/workflows/harness-run.yml` starts no engine session directly). `scripts/` is this repository's render of `cli/templates/scripts/`.
- **The classification.** After an engine exits, the watcher checks pause first, then park, then `rc`. A pause is a `PAUSE_ACK`. A park is an unanswered question file. If neither applies, `rc -eq 0` sets `status completed`, clears the watchdog counters, logs "completed — branch ready for review" and notifies `completed`. Nothing reads the ledger at that point.
- **The ledger reader.** `scripts/lib/harness-run-lib.sh` → `hr_ledger_phases <ledger_file>` already parses the task-engine and user-review-engine ledgers. It prints each phase as `done` or `pending`, counting an id as settled only when it is `[x]` or `[-]`, and it returns 1 for any other ledger. Job mode's progress pass (`job_progress_pass`) is its one caller today (*verify*). The docs engine's ledger is not a format it reads (*verify* that ledger's shape and where the docs flow records that it finished).
- **The resume route.** `resume_paused_run` re-launches a `paused` record once `<state_dir>/RESUME` exists in its run copy. It passes the pause-resume clause, which resumes "strictly from the committed flow-progress ledger". That is how `fix_task_offer_check_script` is being restarted by hand: its record was set to `paused`, and `RESUME` was dropped into its run copy.

## The goal

1. **Headless sessions wait for their background agents.** Every engine session the watcher spawns runs with `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, set at the one launch in `spawn_engine` so that no session can miss it. Decide whether an operator's own value in the watcher's environment overrides it. The recommendation is that it does not: a nonzero ceiling is exactly the failure above. Record the decision in the watcher header. A background agent that hangs is the staleness watchdog's case. The plan states how the watchdog sees a session that is only waiting on a background agent: does the agent's tool output reach the run log and keep the mtime moving? (*verify* from the stream formatter.) It also states that a hung agent is still killed and restarted as before.
2. **`completed` means the ledger finished.** On the `rc -eq 0` path, the watcher reads the run's ledger before it classifies. The run is `completed` only when the ledger shows the run finished. For the task and user-review engines, that means every phase `done` according to `hr_ledger_phases`. For the docs engine, the plan settles the equivalent from that engine's own ledger. A ledger that is present and unfinished means the session stopped early. Such a run is not `completed`, and no "ready for review" notification goes out. It becomes a `paused` record with a new `pause_reason` (name it in the plan; `incomplete` is a placeholder), so that `/autonomous-sdlc-harness:branch-resume` resumes it from the ledger. That is the same route used by hand today. The log line and the notification name what happened and the resume command. Settle what an absent or unreadable ledger means, and justify it. Treating it as `completed` keeps today's behaviour for flows that write no ledger. Also settle what job mode does with the new state (*verify* how job mode handles a `paused` record with a `pause_reason` it does not know).
3. **The stopped-agents line is visible.** When the run log's last session contains the CLI's `Background tasks still running` … `stopping them` line, the watcher log records it with the run's branch, whatever the classification. With goal 1 the line should never appear again, so if it does, it is evidence that the setting did not take.
4. **Every reader of `pause_reason` knows the new value.** Find every consumer of `pause_reason` and of the `paused` status: the watcher's passes, `remote-run.sh`, `/autonomous-sdlc-harness:branch-status`, `/autonomous-sdlc-harness:branch-resume`, `/autonomous-sdlc-harness:branch-pause`, the docs, and the schema if the registry has one. Make each one handle the new value or say why it needs nothing. `/autonomous-sdlc-harness:branch-status` shows it with its way on.
5. **Tests.** Cover each of these through the watcher's existing test harness (*verify* which `cli/test/*.test.mjs` suites drive a classification with a fake `HARNESS_AGENT_CLI`):
   - the launch environment carries the ceiling, including when the watcher's own environment sets another value, if the plan decides that does not override;
   - an exit 0 with a finished ledger becomes `completed`;
   - an exit 0 with an unfinished ledger becomes `paused` with the new reason and sends no `completed` notification;
   - an exit 0 with no ledger behaves as the plan settled;
   - the docs engine's equivalent of each;
   - the stopped-agents log line.

   Record the mutation that turns each new case red, and confirm each was run red once.
6. **Renders and docs.** Re-render `scripts/` from `cli/templates/scripts/` by the route `docs/development.md` documents. Update `docs/watcher.md`, and every document that states when a run is marked `completed` or lists `pause_reason` values (`git grep -n 'ready for review'` and `git grep -n 'pause_reason'`, outside `harness-runs/`).

## Constraints

- **The classification order does not change.** Pause, then park, then the exit code. The ledger check only splits the existing `rc -eq 0` arm. A parked or paused run is classified exactly as today.
- **No orchestration-instruction change.** The plugin's flows keep dispatching sub-agents as they do now. This branch adds no rule about `run_in_background`.
- **Remote records are untouched** beyond what goal 2's job-mode decision requires. `remote-run.sh sync` still owns their status.
- Scripts stay bash 3.2-compatible. `scripts/run-gates.sh` must pass.
