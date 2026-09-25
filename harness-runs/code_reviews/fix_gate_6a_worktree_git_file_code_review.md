# Code Review: fix_gate_6a_worktree_git_file

## Context

**Branch:** `fix_gate_6a_worktree_git_file`
**Date:** 2026-09-24
**Reviewed:** the whole branch diff against `dev`: 8 files, +30/-15. That covers `scripts/run-gates.sh` (gate 6a's new `machine_path_hits` function and the `gate()` comment, Task 1), `docs/development.md` → `## 5` → **Gate 6 — self-containment.** (the quoted command and its one clause, Task 2), and the home-prefix redaction in six committed files under `harness-runs/` (Task 3). All three tasks are in the `general` layer, and no `cli/` or `plugin/` file changes. 6 run-artifact files excluded from the reviewed diff.

**Headline conclusions.** The filter is correct and portable. `grep -v '^\./\.git:[0-9][0-9]*:'` was probed with sample lines: it drops only `./.git:1:…` and still prints `./a/.git:1:gitdir: …`, `./.gitignore:3:…` and a file that quotes a `gitdir:` line. That matches the prompt's first deliverable. In a main checkout `--exclude-dir=.git` already skips the directory, so the second stage never matches there, and the command is the same in both kinds of checkout (the second deliverable). The pipe is safe because `gate_silent` grades only the output and redirects `2>&1`, so the first grep's error lines still reach the log. `docs/development.md` and `scripts/run-gates.sh` quote the new command byte-for-byte, and `git grep` finds no other live quotation outside `harness-runs/`.

The redaction is complete: `git grep -nF "$HOME"` over the tracked tree prints nothing. The new pipeline, run with the system grep in this worktree, also prints nothing.

`bash scripts/test.sh` in this worktree reports `ok    6a no machine paths`, which meets acceptance 1. The only failure is `1a plugin manifest`. It comes from the local `claude plugin validate --strict` promoting 6 unquoted-`${CLAUDE_PLUGIN_ROOT}` warnings in `plugin/hooks/hooks.json` to errors. This branch does not touch that file, and the prompt puts any other gate out of scope. `phases.parity` is `false`, so no parity cross-check applies.

The paragraph at `docs/development.md` that opens *"The `$HOME` half is a different matter, and self-adoption breaches it."* is stale. The story index reports it as stale and leaves it unchanged, as the prompt directs. That is not a finding here.

**No findings.** Pass 2 reconciliation was a no-op: `harness-runs/task_plan_point_reviews/fix_gate_6a_worktree_git_file_task_plan/` does not exist.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` when that fix's commit lands.

_No entries — this review raised no fixable finding._

---

## Must Fix

_None._

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
