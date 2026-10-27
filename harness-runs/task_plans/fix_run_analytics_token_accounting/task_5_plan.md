### Task 5 — Mirror the three run-analytics files into `scripts/` and document the token sources

**Goal:** Bring this checkout's own adoption level with the shipped templates, so the watcher here records true tokens too. Then correct the two corpus statements that describe what run analytics reads: rows 1 and 8 of the story index's `## Scope register`.

**Depends on:** Tasks 1, 2 and 3. Their final versions are the source of each copy:

- `cli/templates/scripts/lib/run-analytics.jq` (Task 1);
- `cli/templates/scripts/lib/run-analytics-report.jq` (Task 2);
- `cli/templates/scripts/run-analytics.sh` (Task 3).

This task copies them and changes not one byte of any of them. It restates what they read for the documentation:

- **Session token totals** come from `result.modelUsage`.
- **Per-sub-agent and per-request sub-agent figures** come from `<claude home>/projects/*/<session_id>/subagents/agent-<agentId>.jsonl`. The claude home is `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`.
- **The transcript link** is `tool_use_result.agentId` on the orchestrator's `user` event, or a `system` `task_*` event's `task_id` + `tool_use_id`.
- **With no transcript**, the figures are `null`, rendered `—`.
- **`Agent` / `Task` rows in `### Tool time`** are labelled sub-agent wall time and excluded from slowest calls.

**Which parity route, and why.** Nothing automated compares `scripts/` with `cli/templates/scripts/`. `cli/test/outer-loop-scripts.test.mjs` compares only `init`'s output with the templates. This repository has two routes: a hand mirror in the same change, as `d6bdbdaa` edited both copies of `run-analytics.jq`, or the forced self-adopt run in `docs/development.md` → *Regenerating this repository's adoption*. That run also overwrites and needs restoring for `.claude/` documents, `githooks/pre-push` and `scripts/typecheck.sh`, so this task takes the hand mirror. This is the catch-all task, so it ships last.

### Targets

- `scripts/lib/run-analytics.jq`, a byte copy of the template.
- `scripts/lib/run-analytics-report.jq`, a byte copy of the template.
- `scripts/run-analytics.sh`, a byte copy of the template. It keeps mode `100755` as committed.
- `ARCHITECTURE.md`. The `autonomous-format-stream.sh` row of the engine-binding table.
- `docs/watcher.md`. `### Run analytics`.

**Work:**

- [ ] Copy each template over its `scripts/` counterpart with `cp`. Use one plain `cp <template> <mirror>` per pair, run from the repository root.
- [ ] **`ARCHITECTURE.md`, in the row whose *What it binds* cell ends "…the `system` subtypes `api_retry` and `permission_denied`."**
  - Extend that sentence with what the reader now also takes: the `result` event's `modelUsage`, the orchestrator `user` event's `tool_use_result.agentId`, and the `system` `task_*` events' `task_id` and `tool_use_id`.
  - Add one sentence binding the on-disk sub-agent transcripts, `<claude home>/projects/*/<session_id>/subagents/agent-<agentId>.jsonl`, read for final per-message usage. This is a second engine-specific binding.
  - In *What a second runtime must supply*, add "and, for true sub-agent token figures, a per-sub-agent record of final usage; without one those figures are reported unavailable".
  - Keep the row's other cells and the table's shape unchanged.
- [ ] **`docs/watcher.md` → `### Run analytics`.** Add one paragraph, **Where the token figures come from.**, after **Measurement only.**. It states:
  - session totals from `result.modelUsage`, summed across models;
  - sub-agent figures from that sub-agent's transcript, found by `session_id` and `agentId` under the agent runner's home and read, never written;
  - that a run with none, such as a session recorded by a later job on a fresh runner or transcripts since removed, shows `—` rather than the stream's partial sub-agent usage;
  - that `#### Token attribution` shows how the orchestrator, the sub-agents and the remainder add up to the session total;
  - that `### Tool time`'s `Agent` / `Task` rows are sub-agent wall time.

  Point to `lib/run-analytics.jq` → *Record* as the format of record, as the section already does. Change no other paragraph.

**Verification:**

- `cmp scripts/lib/run-analytics.jq cli/templates/scripts/lib/run-analytics.jq` exits 0. So do `cmp scripts/lib/run-analytics-report.jq cli/templates/scripts/lib/run-analytics-report.jq` and `cmp scripts/run-analytics.sh cli/templates/scripts/run-analytics.sh`. Run each as its own command.
- `git diff --name-only HEAD -- cli/templates` prints nothing, because this task changed no template.
- `git diff --summary HEAD -- scripts/run-analytics.sh` reports no mode change.
- Re-run both corpus derivation commands in the story index's `## Scope register` verbatim. Every file they print appears as a row there.

**Deviations from plan:**

- The work bullet's `cp <template> <mirror>` was refused by the session's permission layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`), in both absolute-path and repo-relative spellings. Each mirror was instead overwritten with the template's content through the file-write tool. The byte-copy claim rests on the three `cmp` verification commands, each run as its own command and each exiting 0. `git diff --summary HEAD -- scripts/run-analytics.sh` printed nothing, and the working-tree file keeps mode `100755`.
