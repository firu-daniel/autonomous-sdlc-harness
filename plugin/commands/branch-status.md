---
description: Print a read-only, on-demand digest of autonomous runs from the registry and a bounded log tail — and, for a focused branch past review, the points needing your attention.
argument-hint: "[<branch>]"
---

# Scope: On-demand status digest of autonomous runs (registry + log tail), no polling

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<n>`, `<MAIN_REPO>`, `<worktree>`, which this file's own text resolves — `<MAIN_REPO>` in step 1 and `<worktree>` from the registry record in step 3): they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<parity_vocabulary>` | config value | `parity.referenceName` — the name of the reference implementation this project is kept in parity with. Read **only** when `phases.parity` is `true`. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the outer-loop scripts live in. This file names one of them, `autonomous-watcher.sh`, **only** in the closing read-only fence, as a file it must not edit; it never invokes it. |

---

## Context

A **read-only, on-demand** digest of autonomous runs. It reads the run registry and a bounded tail of the central per-run log, prints a human summary, and exits. With no argument it summarizes all runs in the registry; with a branch argument it focuses on that one — and for a focused branch that has reached review, it also distills a **"Points needing your attention / recorded deviations"** section from that branch's own review + plan artifacts (parity/architecture/skeptic/code-review findings, intentional divergences, documented assumptions/blocks, and the success-rate). It does **not** spawn a background process, start a `tail -f`, or poll in a loop; it writes no file and sends no notification (the watcher owns notifications). Wraps "Watch a run" / "Concurrency" in `${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md`.

**Usage:** `/branch-status` for all runs, or `/branch-status <branch>` (the trailing text is `$ARGUMENTS`) to focus on one.

## Steps

1. Resolve `<MAIN_REPO>` as the first entry of `git worktree list`; registry = `<MAIN_REPO>/<state_dir>/autonomous_logs/registry.json`; logs dir = `<MAIN_REPO>/<state_dir>/autonomous_logs/`.
2. Selection: if `$ARGUMENTS` names a branch, focus on that run's record; with no argument, summarize **all** records in the registry (the registry is the live set — do not invent an archive filter beyond what it contains). The registry is shaped `{"runs": {"<branch>": {...}}}`, so records live under the `.runs` wrapper — enumerate with `jq -r '.runs | to_entries[] | …'` and read one with `jq -r '.runs["<branch>"].status'` (the same `.runs["<branch>"]` form `/branch-prompt` uses); a bare `.["<branch>"]` or top-level `to_entries` returns empty.
3. Per run, print: `status`, `engine` (absent → `task`), `started_at` / `updated_at` (and `resumed_at` when present), and `worktree`.
4. Read a **bounded** tail of `<MAIN_REPO>/<state_dir>/autonomous_logs/<branch>.log` (e.g. the last ~40 lines, read **once** — never `tail -f`) and distill it into a short human summary, not a raw dump. Surface: the current phase / heartbeat line (e.g. `[A · Task 3 · …]`), any `PARKED: …` line plus the outstanding `<state_dir>/clarifications/<branch>/question_<n>.md` path, the last error line, or the Done / convergence summary if completed.
5. **Points needing your attention / recorded deviations (focused single-branch view only; read-only, best-effort).** When `$ARGUMENTS` focuses one branch **and** that run has reached review (status `completed`/`failed`, or review artifacts exist), append a **"Points needing your attention / recorded deviations"** section distilled from that branch's own artifacts under its `worktree` (the `worktree` field from step 3 — never main; read-only, never write). Read whichever of the following exist for `<branch>`, and **summarize, do not dump** (glob the branch name under each dir — end-of-branch filenames vary, e.g. `_code_review.md` / `_parity_review.md` / `_arch_review.md`):
   - **End-of-branch reviews** — `<state_dir>/code_reviews/`, `<state_dir>/architecture_branch_reviews/` (fall back to `<state_dir>/architecture_reviews/<branch>/` when no branch-level file exists), `<state_dir>/skeptic_reviews/`, `<state_dir>/review_plan_reviews/`, and — **only when `phases.parity` is `true` in `harness.config.json`** — `<state_dir>/business_parity_branch_reviews/`. From each, pull the **Must Fix / Should Fix** items and mark each as **resolved in-run** when its Ordered-Fix-List checkbox is `[x]` or **STILL OPEN** when `[ ]`; list **Nice to Have** in one line each. When `phases.parity` is `true`, also surface any **"Intentional divergences / call-outs"** section (deliberate deviations from `<parity_vocabulary>` the user should know about — flagged as *not bugs*).
   - **User-review rounds** (when present) — the same from `<state_dir>/architecture_user_review_reviews/`, `<state_dir>/business_parity_user_review_reviews/` and `<state_dir>/user_reviews/`.
   - **Documented assumptions / blocks** — scan the branch's plan + review artifacts for `BLOCKED`, `assumption`, `deferred`, `unreachable`, `PARKED`, `out-of-scope` and list them.
   - **Statistics** — the success rate + tasks/points/issue-cost from `<state_dir>/branch_statistics/<branch>/statistics.md`.

   Order the output: **Must Fix (open)** → **Should Fix (open)** → **resolved-in-run** (one line each) → **intentional divergences** → **documented assumptions/blocks** → **statistics**. Lead with a one-line verdict (e.g. "clean — 0 open findings, 1 parity fix landed in-run"). If the run has not yet reached review (still planning/implementing), skip this section with a one-line note (e.g. "no review artifacts yet — run still in <phase>"). If the `worktree` was removed (branch merged / cleaned up), say the artifacts are unavailable rather than erroring. This step reads only — it must not write, commit, or edit any artifact.
6. For a **parked** run, point the user at `/branch-answer` (and the question path) as the next action; for a **completed** run, note `/branch-user-review` is how to start a fix round.

This command is read-only: no background process, no polling, no file writes, and no edits to `<scripts_dir>/autonomous-watcher.sh`, the engines, or the instruction forks.
