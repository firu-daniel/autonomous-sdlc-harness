# Code Review: feat_run_analytics

## Context

**Branch:** `feat_run_analytics`
**Date:** 2026-10-26
**Reviewed:** the whole branch diff against the default branch `dev`. The checkout has no local `dev` ref, so the diff base is `origin/dev`, merge base `c7d4cec4`. The diff covers:
- the three run-analytics files: `cli/templates/scripts/run-analytics.sh`, `lib/run-analytics.jq` and `lib/run-analytics-report.jq` (Tasks 1-3);
- their `OUTER_LOOP_SCRIPTS` rows and the `run_analytics` `STATE_DIR_ENTRIES` row with its contract README (Task 4);
- the watcher's `record_run_analytics` hook in `spawn_engine` (Task 5);
- the two new suites, `cli/test/run-analytics.test.mjs` and `cli/test/watcher-run-analytics.test.mjs`, with their fixture stream (Tasks 6-7);
- the `branch-status` digest and the plugin script lists (Task 8);
- the `scripts/` and `harness-runs/` mirrors (Task 9);
- the documentation in `docs/` and `ARCHITECTURE.md` (Task 10).

28 files were reviewed. 17 run-artifact files were excluded from the reviewed diff.

**Tests.** Every accompanying test the conventions documents require is present. The metrics suite pins per-request latency, the suspended-time arithmetic, the idle-gap classes, redaction and byte-identical idempotence against values worked out by hand. The watcher suite pins the two plumbing commits and an unchanged outcome when the analytics step fails. The outer-loop and `init` suites cover the new rows. This review ran no suite; whether they pass is for the Run gates phase to establish.

**Mirrors.** The `scripts/` mirror of all four shipped files is byte-identical to `cli/templates/scripts/`, and `harness-runs/run_analytics/README.md` matches its template.

**Other checks.**
- No new export was added under `cli/src`, so the caller check had nothing to grade. Both new watcher functions have call sites.
- The Pass 0 grep half had no effect: this agent's sweep table carries no project regexes yet.
- `phases.parity` is `false`, so no parity cross-check ran.
- `per_task_findings_root` (`harness-runs/task_plan_point_reviews/feat_run_analytics_task_plan/`) does not exist, so Pass 2 had nothing to reconcile.

**Findings.** One Must Fix: the remote arm of the `branch-status` digest reads a file that `remote-run.sh sync` never refreshes. The other three are prose that misstates what the code does.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else (sub-step bullets inside individual per-finding files) are informational progress markers for the implementer agent — they are NEVER the iteration source and the committer does NOT touch them.

Each entry resolves to a self-contained `harness-runs/code_reviews/feat_run_analytics_code_review/finding_<K>.md` file via its `**Finding K**` reference. Sorted lowest blast-radius first; the leading `N.` is the fix order and `K` is the finding's stable number.

1. [x] **Finding 3** — Drop the claim about this repository's conventions document from the shipped watcher's `run_analytics_subject` comment, in the template and its `scripts/` mirror _(layer: cli, general)_
2. [ ] **Finding 2** — Correct the `branch-status` digest's description of `slowest_subagent.session`, which is a 1-based position, never a `#<n>`-suffixed id _(layer: plugin)_
3. [ ] **Finding 4** — Restate the allow justification for `run-analytics.sh` in `OUTER_LOOP_SCRIPTS` and the script-allowlist guard so that it matches what the script can write _(layer: cli, plugin)_
4. [ ] **Finding 1** — Read a remote record's analytics digest from `origin/<branch>`, not from the mirror that `sync` never refreshes _(layer: plugin)_

---

## Must Fix

### 1. The `branch-status` digest reads a remote run's analytics from the mirror, which `remote-run.sh sync` never refreshes
→ [finding_1.md](feat_run_analytics_code_review/finding_1.md)

---

## Should Fix

### 2. The `branch-status` digest says `<session>` can carry a `#<n>` suffix, but `.run.slowest_subagent.session` is an integer position
→ [finding_2.md](feat_run_analytics_code_review/finding_2.md)

### 3. The shipped watcher says `.claude/context/conventions.md` "does not list it yet and owes it a line", which is a claim about this repository written into every adopter's copy
→ [finding_3.md](feat_run_analytics_code_review/finding_3.md)

### 4. The allow justification "writes only its own branch's analytics files" overstates the bound: the script writes for whatever branch and checkout it is given
→ [finding_4.md](feat_run_analytics_code_review/finding_4.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
