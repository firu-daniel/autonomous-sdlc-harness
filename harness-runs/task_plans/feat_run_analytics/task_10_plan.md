### Task 10 — Document run analytics in `docs/watcher.md`, `docs/cli.md`, `docs/remote-execution.md` and `ARCHITECTURE.md`

**Goal:** State, in this repository's documents of record, what the run-analytics record is, when and where it is written and committed, what it is not, and that it is the third reader of the stream-json schema — the scope register's `change` rows 1, 7, 11 and 12.

**Depends on:** Tasks 3, 4 and 5, restated so this file stands alone: `run-analytics.sh <stream_file> <branch> [--repo <checkout>]` (with `lib/run-analytics.jq` and `lib/run-analytics-report.jq`) writes `<state_dir>/run_analytics/<branch>/run-analytics.json` — one record per headless session, keyed by `session_id`, never rewritten once recorded — and `run-analytics.md`, regenerated from it every time; tunables `RUN_ANALYTICS_IDLE_SECS` (default 120) and `RUN_ANALYTICS_SUSPEND_SOURCE`; host suspend read from `pmset -g log` on macOS and `journalctl -k` on Linux when readable, else only `wall − duration_ms`; exit `0`/`1`/`2`. It is shipped as an outer-loop row with `agentInvocable: false` and no `DENY_SCRIPT_BASENAMES` entry. The watcher, in `spawn_engine`'s subshell between the engine's exit and `classify_run_exit`, runs it over `<log>.stream.jsonl` and commits each of the two files through `watcher_commit` (`hr_commit_placed`: one path, no hook, protected branch refused, index synced) with the subject `chore: Record run analytics for <branch>`; best-effort — a failure is one log line and changes no status, exit code or notification; no push of its own. Also Task 8, whose stay-allowed list now names seven scripts with `scratch-run.sh` last — the same set `docs/watcher.md` must name.

**Where this task stops.** Prose only, in the catch-all layer's documents; no script, test or plugin file. No measured figure is written anywhere (`harness-runs/lessons.md` → *A wall-clock figure in a document of record is never one a run measured inside its own session*).

### Targets

- `docs/watcher.md` — scope register row 11.
- `docs/cli.md` — row 7.
- `docs/remote-execution.md` — row 12.
- `ARCHITECTURE.md` — row 1.

**Work:**

- [ ] `docs/watcher.md` → `## 1. The loop in one page`: in step 7, one sentence before the classification — the session's run analytics are recorded and committed first, best-effort. `## 2. The scripts`: a table row for `run-analytics.sh` (*Records each headless session's time, cost and reliability from the teed stream into `<state_dir>/run_analytics/<branch>/`* · *the watcher, after every session; an operator by hand* · `no`) and one `lib/` row for its two `jq` programs (read by `run-analytics.sh`, never executed, no executable bit, `no`); in **Why only the `yes` rows carry a profile entry…**, add `run-analytics.sh` to the auto-allowed list and change *"Those six"* to the new count. `### Where the family runs git in a run's copy, and under what pins`: a row for the run-analytics commit — *new on this branch* in the class-before column, nothing reaching it, and the same plumbing commit of one path with no hook as the artifact commit's row (`hr_commit_placed`).
- [ ] `docs/watcher.md`: a new `### Run analytics` subsection at the end of `## 2. The scripts` stating what the record holds (link to the script header as the format of record rather than restating the keys), the idempotence and incomplete-session rules, why it is committed by the watcher rather than through `commit-on-branch.sh` or the remote state bundle (the story index's `## Context` reasoning, condensed), that locally it rides the run's next push and in a job the workflow's `Push the branch` step pushes it, that it is measurement only, and that its dispatch-duration rule is the one `harness-run.yml` → `THE SELF-PAUSE POINT, MEASURED` used, so a later re-measure reads `subagents[].duration_ms` from each run's JSON instead of re-running that `jq`. The by-hand invocation sits in its own fenced block, one command per line (`harness-runs/lessons.md` → *Every command an adopter is meant to run sits in a fenced block*):

  ```
  bash <scripts_dir>/run-analytics.sh <state_dir>/autonomous_logs/<branch>.stream.jsonl <branch>
  ```
- [ ] `docs/cli.md` → **Two families land in `scriptsDir`, and only one of them is generated.**: add *the run-analytics script with its two `jq` programs* to the outer-loop enumeration. `docs/remote-execution.md` → **The job runs `autonomous-watcher.sh job`, not `anthropics/claude-code-action`.**: add *the run-analytics record committed after each session* to the list of what the watcher already does for the job.
- [ ] `ARCHITECTURE.md` → the §5 row for `cli/templates/scripts/autonomous-format-stream.sh`: name `run-analytics.sh` (through `lib/run-analytics.jq`) as a third reader of the `stream-json` schema beside `usage_read_run`, and add to that row's schema cell the fields it reads that the row does not already list — event `timestamp`, `parent_tool_use_id`, `message.id`, the `result` event's `duration_ms` / `duration_api_ms`, and the `system` `api_retry` / `permission_denied` subtypes — stating the binding as best-effort: a stream lacking them degrades the record, never the run.

**Verification:**

- Re-run the story index's derivation entries D1 and D2 verbatim; every file they print appears in the scope register, and each `change` row owned by this task now names `run-analytics.sh`.
- In `docs/watcher.md`, the auto-allowed list and its count agree with `plugin/hooks/README.md`'s stay-allowed list (seven names, `scratch-run.sh` last).
- `git diff -U0 -- docs/watcher.md docs/cli.md docs/remote-execution.md ARCHITECTURE.md` adds no line matching `/(Users|home)/` and no measured duration or cost figure.
