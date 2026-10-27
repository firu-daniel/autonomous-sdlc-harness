# Code Review: fix_run_analytics_token_accounting

## Context

**Branch:** `fix_run_analytics_token_accounting`
**Date:** 2026-10-27
**Reviewed:** the whole branch diff against the default branch (`origin/dev`; there is no local `dev`). That covers:

- the template `cli/templates/scripts/lib/run-analytics.jq`: the `modelUsage` session totals, null stream sub-agent usage, the `agent_id` links, dispatch-free `slowest`, and the new `transcripts` / `attach` modes (Task 1);
- the template `cli/templates/scripts/lib/run-analytics-report.jq`: the share-based token roll-up, `#### Token attribution`, and the relabelled `Agent` / `Task` rows (Task 2);
- the transcript location in the template `cli/templates/scripts/run-analytics.sh` (Task 3);
- the fixtures and the cases in `cli/test/run-analytics-tokens.test.mjs`, `cli/test/run-analytics.test.mjs` and `cli/test/watcher-run-analytics.test.mjs` (Task 4);
- the `scripts/` mirror, `docs/watcher.md`, `ARCHITECTURE.md`, and the `cli/src/machine/paths.ts` comment (Task 5).

8 run-artifact files were excluded from the reviewed diff.

`git diff --no-index` shows the three `scripts/` copies byte-identical to their templates. The jq 1.5 floor holds: no regex, `--rawfile` or `$ARGS.named`. No new exported TypeScript symbol was added, so the caller check had nothing to check. The four test cases the prompt requires are present, each with its red-turning mutation named. Whether they pass is for the Run gates phase to establish, because this review runs no suite. `phases.parity` is `false`, so no parity review was done.

The Pass 0 grep half did not run, because its sweep list has no regexes. The per-unit findings root `harness-runs/task_plan_point_reviews/fix_run_analytics_token_accounting_task_plan/` does not exist, so Pass 2 had nothing to reconcile.

The branch handles records written before it inconsistently, and that is what most of this review covers. The session totals treat such a record as not available, but the `### Sub-agents` table still shows its undercounted figures (Finding 1), and the per-session cache hit ratio still shows the old ratio (Finding 2).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Move the `claudeHome()` shell-mirror declaration into the `paths.ts` module header's point 2 _(layer: cli)_
2. [x] **Finding 2** — Compute the per-session `Cache hit ratio` from the share, not the stored record value _(layer: cli, general)_
3. [x] **Finding 1** — Render `—` for every non-transcript sub-agent token cell, name the legacy cause in both notes, and cover a legacy record with a case _(layer: cli, general)_

---

## Must Fix

### 1. A record written before token accounting still shows its undercounted sub-agent tokens, under a note saying none is shown
→ [finding_1.md](fix_run_analytics_token_accounting_code_review/finding_1.md)

---

## Should Fix

### 2. A session's `Cache hit ratio` is read from the record, not computed from the share the token rows beside it show
→ [finding_2.md](fix_run_analytics_token_accounting_code_review/finding_2.md)

### 3. The new shell mirror of `claudeHome()` is declared in the function's doc comment, not in the module header's inventory of shell mirrors
→ [finding_3.md](fix_run_analytics_token_accounting_code_review/finding_3.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
