# Code Review: fix_observations_repo_relative_paths

## Context

**Branch:** `fix_observations_repo_relative_paths`
**Date:** 2026-09-25
**Reviewed:** the whole branch diff against `dev`, six files in all:
- the repo-relative path rule in the adopter-facing intake README template (Task 1);
- the **Every path in an entry is repo-relative.** rule in `## The entry format` (Task 2);
- the **Machine-path check — before every wrapper call.** paragraph in `## Commit mechanics`, plus its knock-on edits to the append, best-effort and Done-summary passages (Task 3);
- the forks' Override I **Commits + pushes** bullets, commit-point entries 5 and 8, and `plugin/docs/AUTONOMOUS_FLOW.md` → `## Improvement observations` (Task 4);
- this repository's re-copied `harness-runs/improvement_observations/README.md` (Task 5).

9 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**
- Every change is Markdown, so no test is required. `phases.parity` is `false`, so there was no parity check.
- The template README and its self-adopted copy are byte-identical, and so is the blob hash.
- The cited headings and bold leads all resolve.
- The three commands the check relies on each have an allow entry in `cli/templates/claude/settings.autonomous.json` → `permissions.allow`: `git worktree`, `jq` and `grep`.
- `jq -nr env.HOME` and the `worktree ` lines of `git worktree list --porcelain` were run as written and print what the check needs.
- The added lines contain no machine path, including the run artifacts that were excluded.
- The clarification digest is untouched, as the scope register requires.

**Pass 0:** the grep-sweep list is still the empty stub, so half (a) found nothing. Half (b) found no new exported symbols, because the diff is prose only.

**Pass 2:** the per-task findings root does not exist, because per-unit review is off in this fork. Reconciliation was a no-op.

Two findings are left. The check's command template leaves its literals unquoted, which defeats the check for any path containing a space. The exit-3 claims no longer hold now that the check can rewrite an earlier block.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Single-quote the machine-path check's needles and file path, and say why _(layer: plugin)_
2. [x] **Finding 2** — Qualify the "appends nothing → exit 3" claims for a check that rewrote an earlier block _(layer: plugin)_

---

## Must Fix

### 1. The machine-path check spells its needles and file path unquoted, so a path with a space turns the check into a status-2 "could not run" and the file is committed unchecked
→ [finding_1.md](fix_observations_repo_relative_paths_code_review/finding_1.md)

---

## Should Fix

### 2. "A re-entry that appends nothing yields exit 3" is no longer true once the check rewrites a path in an earlier block
→ [finding_2.md](fix_observations_repo_relative_paths_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
