---
description: Resume a paused autonomous run from its committed flow-progress ledger — one RESUME marker in a local run's worktree for the watcher, or a resume dispatch sent straight to GitHub for a run that executes there.
argument-hint: "[<branch>]"
---

# Scope: Resume a paused autonomous run

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<MAIN_REPO>`, `<worktree>`, `<tmp>`, `<engine>`, which this
file's own text resolves — `<MAIN_REPO>` in step 1, `<worktree>` from the registry record in step 4, `<tmp>` in step 2 and `<engine>` in step 6): they
resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this
table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the outer-loop scripts live in, repo-relative; a script is invoked from the root of the checkout this session runs in. This file names two of them: `remote-run.sh`, which it invokes — its `sync` verb, for a remote record, and its `fetch` verb, for a prefix naming a branch with no record, both in step 2, and its `dispatch` verb, on the GitHub route in step 6 — and `autonomous-watcher.sh`, **only** in the scope fence, as a file it must not modify and never invokes. It modifies neither. |

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
`completed` run is re-triggered by a fresh inbox drop). For a local run this command writes ONE marker file
and reports; for a run that executes on GitHub it writes no file and sends the resume dispatch itself. The
only scripts it invokes are `<scripts_dir>/remote-run.sh sync`, for a remote record,
`<scripts_dir>/remote-run.sh fetch`, for a prefix naming a branch with no record, and
`<scripts_dir>/remote-run.sh dispatch`, on the GitHub route. It must NOT modify
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
   - **A prefix naming a branch the registry does not hold** may name a run that executes on GitHub with no
     local record. Make a temporary directory with `mktemp -d`, run
     `bash <scripts_dir>/remote-run.sh fetch <branch> <tmp>` once, and remove that directory before this
     command ends, on every path. On exit 2, or on a printed `state: none`, report that no run of that name
     is known locally or on GitHub and stop — never write a file for an unknown branch. On exit 1 or 3,
     report its message and stop. Otherwise the branch takes the **GitHub route** with the printed `state:`,
     `pause_reason:` and `engine:`.
   - **The route.** A record carrying `execution: github-actions` takes the **GitHub route** (step 6) with its
     synced `status`, `pause_reason` and `engine`. A record without `execution` takes steps 3–5 below,
     unchanged.
3. **State check.** Read the target's status with `jq -r '.runs["<branch>"].status'`. If it is not
   `paused`, report the actual status and stop — RESUME only acts on a paused run (for a `parked` run use
   `/autonomous-sdlc-harness:branch-answer`; a `completed`/`failed` run needs a fresh inbox drop). If the **global kill switch**
   `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP` is present, warn that the watcher defers all resumes until it is
   removed.
4. From the registry record for `<branch>`, read the `worktree` field. Write an empty
   `<worktree>/<state_dir>/RESUME`.
5. Report: the watcher will detect RESUME within a poll tick (its configured interval, and its parallel-run
   cap permitting), clear the pause files, and re-launch the engine resuming from the flow-progress ledger —
   no re-launch by the operator. Optionally point the user at
   `tail -F <MAIN_REPO>/<state_dir>/autonomous_logs/<branch>.log`.

6. **GitHub route** — in place of steps 3–5. Never write `RESUME`. The local kill switch
   `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP` does not gate a dispatch to GitHub; the job-side brake is the
   repository variable `HARNESS_REMOTE_STOP` — say so when the local kill switch is present. `<engine>` is
   the record's `engine` field or `fetch`'s `engine:`; when it is empty, report the GitHub route
   (`docs/remote-execution.md` → `### Working a run from GitHub alone`) and stop — never guess the engine,
   since the workflow input defaults to `task`. By state:
   - **`paused`**, any `pause_reason`: run
     `bash <scripts_dir>/remote-run.sh dispatch <branch> --engine <engine> --resume pause --chain 0`.
     A `pause_reason: killed` — a job that ended mid-run — resumes exactly like any other paused run, from
     the committed ledger. A `pause_reason: expired` — its state bundle expired — resumes the same way; say
     that its carried park-loop, auto-resume and stall counts, its clarification history and any planning
     drafts not yet committed that it carried are lost, and that a run that was still planning runs its
     planning writer again from the committed ledger.
   - **`park_loop`**: explain that the run is held because its resumes made no progress, and ask via
     `AskUserQuestion` whether to clear the hold. On yes, run the `paused` dispatch above with
     `--park-loop-clear` added. On no, send nothing.
   - Any other state: report it and stop (for a `parked` run use `/autonomous-sdlc-harness:branch-answer`).

   Report the dispatch's result: exit 0, the resume was sent and the job resumes from the committed
   flow-progress ledger; exit 2 or 3, report its message — nothing reached the run.
