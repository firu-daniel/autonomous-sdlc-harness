---
description: Resume a paused autonomous run by dropping one RESUME marker into its worktree, so the watcher re-launches the same engine from the committed flow-progress ledger.
argument-hint: "[<branch>]"
---

# Scope: Resume a paused autonomous run

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<MAIN_REPO>`, `<worktree>`, which this
file's own text resolves — `<MAIN_REPO>` in step 1 and `<worktree>` from the registry record in step 4): they
resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this
table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the outer-loop scripts live in, repo-relative; a script is invoked from the root of the checkout this session runs in. This file names two of them: `remote-run.sh`, which it invokes — its `sync` verb, for a remote record in step 2 — and `autonomous-watcher.sh`, **only** in the scope fence, as a file it must not modify and never invokes. It modifies neither. |

---

## Context

A run that honored a `<state_dir>/PAUSE` request yielded its session at a clean boundary and is registry
`status: "paused"` (idle, zero dispatch cost). This command drops a **`<state_dir>/RESUME`** trigger into that
run's **worktree**. On its next poll tick the watcher detects RESUME, clears the pause protocol files
(`PAUSE` / `RESUME` / `PAUSE_ACK`) while keeping `PAUSE_PROGRESS.md`, flips the run back to `running`, and
**re-launches the same engine in the same worktree** — resuming strictly from the committed flow-progress
ledger (`<state_dir>/flow_progress/<branch>_progress.md`), skipping every phase already marked `[x]` or `[-]`. You do
not re-launch. Wraps "Pause / resume a run" in `${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md`.

Only a **paused** run can be resumed this way (a `parked` run resumes via `/autonomous-sdlc-harness:branch-answer`; a `failed` /
`completed` run is re-triggered by a fresh inbox drop). This command writes ONE marker file and reports.
The only script it invokes is `<scripts_dir>/remote-run.sh sync`, for a remote record. It must NOT modify
`<scripts_dir>/autonomous-watcher.sh`, `<scripts_dir>/remote-run.sh`, the engines, or the instruction forks.

**Usage:** type `/autonomous-sdlc-harness:branch-resume`, optionally targeting a branch with a leading `<branch>:` prefix, e.g.
`/autonomous-sdlc-harness:branch-resume feat_settings_search`.

## Steps

1. Resolve `<MAIN_REPO>` as the first entry of `git worktree list`; the registry is
   `<MAIN_REPO>/<state_dir>/autonomous_logs/registry.json` (shaped `{"runs": {"<branch>": {...}}}`).
2. **Which-branch resolution.** If `$ARGUMENTS` starts with `<branch>:` (or is just a bare `<branch>`),
   parse it. Otherwise read the registry: if **exactly one** run has `status: "paused"`, target it;
   otherwise list the paused candidates and ask via `AskUserQuestion`. Never guess when ambiguous.
   Enumerate with `jq -r '.runs | to_entries[] | select(.value.status=="paused") | .key'`.
   - **Remote records sync first.** Before building the candidate set — and before reading a prefix-named
     record — run `bash <scripts_dir>/remote-run.sh sync <branch>` for every record carrying
     `execution: github-actions` whose `status` is neither `completed` nor `failed`, then read the registry
     again, so the state check below acts on the job's real state. A `sync` that exits non-zero is reported
     with its message, and that record is left out of the candidates — or, when the prefix named it, the
     command stops — never guessed about.
3. **State check.** Read the target's status with `jq -r '.runs["<branch>"].status'`. If it is not
   `paused`, report the actual status and stop — RESUME only acts on a paused run (for a `parked` run use
   `/autonomous-sdlc-harness:branch-answer`; a `completed`/`failed` run needs a fresh inbox drop). If the **global kill switch**
   `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP` is present, warn that the watcher defers all resumes until it is
   removed.
   - **Remote record** synced as `paused` with `pause_reason: killed` — a job that ended mid-run — is
     resumable exactly like any other paused run: the watcher dispatches the resume from the committed ledger.
4. From the registry record for `<branch>`, read the `worktree` field. Write an empty
   `<worktree>/<state_dir>/RESUME`.
5. Report: the watcher will detect RESUME within a poll tick (its configured interval, and its parallel-run
   cap permitting), clear the pause files, and re-launch the engine resuming from the flow-progress ledger —
   no re-launch by the operator. Optionally point the user at
   `tail -F <MAIN_REPO>/<state_dir>/autonomous_logs/<branch>.log`.

   For a **remote record** (`execution: github-actions`), report instead that the local watcher relays the
   RESUME by dispatching the resume to GitHub Actions, so the local watcher must be running for that to
   happen; the job then resumes from the committed flow-progress ledger.
