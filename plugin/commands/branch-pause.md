---
description: Pause a running autonomous run by dropping one PAUSE marker into its worktree, so it yields at a clean checkpoint and can be resumed later.
argument-hint: "[<branch>:] [reason]"
---

# Scope: Pause a running autonomous run so it yields cleanly and can be resumed later

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<MAIN_REPO>`, `<worktree>`, which this
file's own text resolves — `<MAIN_REPO>` in step 1 and `<worktree>` from the registry record in step 4): they
resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this
table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the outer-loop scripts live in. This file names one of them, `autonomous-watcher.sh`, **only** in the scope fence, as a file it must not modify; it never invokes it. |

---

## Context

The autonomous flow has no way to *suspend* a run short of the hard `STOP` (which ends it and cannot be
auto-resumed). This command drops a **`<state_dir>/PAUSE`** request into a running run's **worktree**. At its
next safety-contract checkpoint, if the tree has no uncommitted tracked changes (a clean boundary), the
orchestrator appends a note to `<state_dir>/PAUSE_PROGRESS.md`, writes `<state_dir>/PAUSE_ACK`, and **ends its
session** — the watcher marks the run `paused` and notifies. Resume later with `/autonomous-sdlc-harness:branch-resume <branch>`
(the watcher re-launches from the committed flow-progress ledger). Wraps "Pause / resume a run" in
`${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md`.

Only a **running** run can honor a PAUSE (the engine must be alive to see it). This command writes ONE
marker file and reports — it must NOT modify `<scripts_dir>/autonomous-watcher.sh`, the engines, or the
instruction forks.

**Usage:** type `/autonomous-sdlc-harness:branch-pause`. Optionally target a branch with a leading `<branch>: ` prefix and add a
free-text reason after it, e.g. `/autonomous-sdlc-harness:branch-pause feat_settings_search: session token window nearly full`. The
reason (everything after any `<branch>: ` prefix) is written verbatim as the PAUSE file's body for your
own audit — the orchestrator only checks the file's **presence**, never its content.

## Steps

1. Resolve `<MAIN_REPO>` as the first entry of `git worktree list`; the registry is
   `<MAIN_REPO>/<state_dir>/autonomous_logs/registry.json` (shaped `{"runs": {"<branch>": {...}}}`).
2. **Which-branch resolution.** If `$ARGUMENTS` starts with `<branch>: `, parse it and strip the prefix
   (the remainder is the optional reason). Otherwise read the registry: if **exactly one** run has
   `status: "running"`, target it; otherwise list the running candidates and ask via `AskUserQuestion`.
   Never guess when ambiguous. Enumerate with
   `jq -r '.runs | to_entries[] | select(.value.status=="running") | .key'`.
3. **State check.** Read the target's status with `jq -r '.runs["<branch>"].status'`. If it is not
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
