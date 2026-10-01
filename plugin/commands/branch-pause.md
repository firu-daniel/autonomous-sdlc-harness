---
description: Pause a running autonomous run so it yields at a clean checkpoint and can be resumed later — one PAUSE marker in a local run's worktree, or a pause dispatch sent straight to GitHub for a run that executes there.
argument-hint: "[<branch>:] [reason]"
---

# Scope: Pause a running autonomous run so it yields cleanly and can be resumed later

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<MAIN_REPO>`, `<worktree>`, `<tmp>`, which this
file's own text resolves — `<MAIN_REPO>` in step 1, `<worktree>` from the registry record in step 4 and `<tmp>` in step 2): they
resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this
table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the outer-loop scripts live in, repo-relative; a script is invoked from the root of the checkout this session runs in. This file names two of them: `remote-run.sh`, which it invokes — its `sync` verb, for a remote record, and its `fetch` verb, for a prefix naming a branch with no record, both in step 2, and its `pause` verb, on the GitHub route in step 4 — and `autonomous-watcher.sh`, **only** in the scope fence, as a file it must not modify and never invokes. It modifies neither. |

---

## Context

The autonomous flow has no way to *suspend* a run short of the hard `STOP` (which ends it and cannot be
auto-resumed). This command drops a **`<state_dir>/PAUSE`** request into a running run's **worktree**. At its
next safety-contract checkpoint, if the tree has no uncommitted tracked changes (a clean boundary), the
orchestrator appends a note to `<state_dir>/PAUSE_PROGRESS.md`, writes `<state_dir>/PAUSE_ACK`, and **ends its
session** — the watcher marks the run `paused` and notifies. Resume later with `/autonomous-sdlc-harness:branch-resume <branch>`
(the watcher re-launches from the committed flow-progress ledger). Wraps "Pause / resume a run" in
`${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md`.

Only a **running** run can honor a PAUSE (the engine must be alive to see it). For a local run this command
writes ONE marker file and reports; for a run that executes on GitHub it writes no file and sends the pause
dispatch itself. The only scripts it invokes are `<scripts_dir>/remote-run.sh sync`, for a remote record,
`<scripts_dir>/remote-run.sh fetch`, for a prefix naming a branch with no record, and
`<scripts_dir>/remote-run.sh pause`, on the GitHub route; it names `remote-run.sh stop` in its report and never runs it. It must NOT modify
`<scripts_dir>/autonomous-watcher.sh`, `<scripts_dir>/remote-run.sh`, the engines, or the instruction forks.

**Usage:** type `/autonomous-sdlc-harness:branch-pause`. Optionally target a branch with a leading `<branch>: ` prefix and add a
free-text reason after it, e.g. `/autonomous-sdlc-harness:branch-pause feat_settings_search: session token window nearly full`. The
reason (everything after any `<branch>: ` prefix) is written verbatim as the PAUSE file's body for your
own audit — the orchestrator only checks the file's **presence**, never its content. On the GitHub route no file is
written and the reason is not sent.

## Steps

1. Resolve `<MAIN_REPO>` as the first entry of `git worktree list`; the registry is
   `<MAIN_REPO>/<state_dir>/autonomous_logs/registry.json` (shaped `{"runs": {"<branch>": {...}}}`).
2. **Which-branch resolution.** If `$ARGUMENTS` starts with `<branch>: `, parse it and strip the prefix
   (the remainder is the optional reason). Otherwise read the registry: if **exactly one** run has
   `status: "running"`, target it; otherwise list the running candidates and ask via `AskUserQuestion`.
   Never guess when ambiguous. Enumerate with
   `jq -r '.runs | to_entries[] | select(.value.status=="running") | .key'`.
   - **Remote records sync first.** Before building the candidate set — and before reading a prefix-named
     record — run `bash <scripts_dir>/remote-run.sh sync <branch>` for every record carrying
     `execution: github-actions` whose `status` is neither `completed` nor `failed`, then read the registry
     again, so a remote run that already finished is not "paused". A `sync` that exits non-zero is reported
     with its message, and that record is left out of the candidates — or, when the prefix named it, the
     command stops — never guessed about.
   - **A prefix naming a branch the registry does not hold** may name a run that executes on GitHub with no
     local record. Make a temporary directory with `mktemp -d`, run
     `bash <scripts_dir>/remote-run.sh fetch <branch> <tmp>` once, and remove that directory before this
     command ends, on every path. On exit 2, or on a printed `state: none`, report that no run of that name
     is known locally or on GitHub and stop — never write a file for an unknown branch. On exit 1 or 3,
     report its message and stop. Otherwise the branch takes the **GitHub route** with the printed `state:`.
   - **The route.** A record carrying `execution: github-actions` takes the **GitHub route** with its
     synced `status`. A record without `execution` takes the local steps 3–5 below, unchanged.
3. **State check.** Read the target's status with `jq -r '.runs["<branch>"].status'` — on the GitHub route,
   the synced `status` or `fetch`'s `state:`. If it is not
   `running` (e.g. already `paused`, `parked`, `completed`, `failed`), report the actual status and stop —
   dropping PAUSE on a non-running run has no effect (nothing is alive to honor it).
4. From the registry record for `<branch>`, read the `worktree` field. Write the reason text (or an empty
   file if none) to `<worktree>/<state_dir>/PAUSE`. Do **not** create a `<state_dir>/pause/` directory — the
   pause files are flat under `<state_dir>/` (a `pause/` dir would collide with `PAUSE` on a
   case-insensitive filesystem).
5. Report: the run will honor the pause at its **next clean tracked-tree checkpoint** (it lets any pending
   commit finish first, so an in-flight unit is not left half-done), then write `PAUSE_PROGRESS.md` and end
   its session; the watcher will mark it `paused` and notify. Tell the user to resume later with
   `/autonomous-sdlc-harness:branch-resume <branch>` (or by dropping `<state_dir>/RESUME` in the worktree). Note that the pause is
   not instantaneous — the checkpoint is reached between sub-agent dispatches, so an in-flight dispatch
   (e.g. a long interactive-test or review) finishes first.

   **GitHub route** — in place of steps 4 and 5. Never write `PAUSE`. Run
   `bash <scripts_dir>/remote-run.sh pause <branch>` and report its result: exit 0, the pause dispatch was
   sent; exit 2 or 3, report its message — nothing reached the run. On a send, report that the job finds the
   `harness pause <branch>` run by polling and yields at its next clean checkpoint exactly as a local run
   does, and that `/autonomous-sdlc-harness:branch-resume <branch>` resumes it. To stop a remote run outright
   rather than pause it, `bash <scripts_dir>/remote-run.sh stop <branch>` cancels its job and its chain —
   report that command; never run it.
