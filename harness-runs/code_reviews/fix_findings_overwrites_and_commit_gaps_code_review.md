# Code Review: fix_findings_overwrites_and_commit_gaps

## Context

**Branch:** `fix_findings_overwrites_and_commit_gaps`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev`: 37 files, +240/−162. That covers the 15 state-dir README templates under `cli/templates/state-dir/` (Tasks 1–2) and the agent and instruction contracts under `plugin/` (Tasks 3–17), plus the four architecture-review fixes already landed on the branch. 29 run-artifact files excluded from the reviewed diff.

All ten defects in the task prompt are addressed as the story index plans them:
- **Group A.** Every overwritten findings folder now keys new files by next-free index: the user-review gates, the B.2/C2.2/G.2 meta-reviews, the docs catalog and the per-unit layer reviews. Each fix iteration is handed the `findings_file:` its own layer returned. The done-when grep (`iteration = 0`, `start i=0`, "same folder" over `plugin/instructions/`) hits only cap counters and the now-true "same folder" sentence. No `start i=0` survives.
- **Group B.** `Override 5`, the `unit_findings_folder` committer argument with its reconciliation exclusion, and `Override L` each give an artifact one commit point. `commit-on-branch.sh` warns and skips a missing path, as both no-guard callers assume.
- **Group C.**
  - The `error: blocked — ` marker is parsed on its literal prefix at every caller: Phase E, the supervised QA flow, the user-review core's stop list, and the autonomous fork's `<escalate>` list.
  - `layer-reviewer`'s description matches its real dispatch sites.
  - The augment prompt is byte-identical at its three sites.

**Tests and parity.** The branch changes no `cli/src`, script or generator, so it adds no test and none is owed. No `cli/test` file pins the rewritten README prose or the ledger entry text, and `harness-run-lib.sh` parses only entry ids. Running the suite is Phase G's job. `phases.parity` is `false`, so no parity check applies.

**Pass 0.** The grep-sweep half finds nothing because its regex list is an unfilled stub. The new-exported-symbol caller check finds nothing because the diff adds no exported symbol.

**Pass 2 reconciliation.** It was a no-op: this autonomous run binds per-unit review `off`, so no per-unit review folder exists for the branch.

Four findings remain, all in the plugin layer:
- The user-review core still restates Phase QA's old Round PASS condition.
- The Done summary's blocked-test clause does not survive a resumed session.
- qa-tester's new PASS priority conflicts with its own setup-note instruction.
- Two heading citations in `Override L` give the wrong heading level.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, and the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** `[ ]` markers anywhere else, such as the sub-step bullets inside per-finding files, are informational only and are never the iteration source.

Each entry resolves to `harness-runs/code_reviews/fix_findings_overwrites_and_commit_gaps_code_review/finding_<K>.md` via its `**Finding K**` token. The list is sorted with the smallest, safest single-site edits first. The leading `N.` is the fix order. `K` is the finding's stable identity.

1. [x] **Finding 4** — Correct the heading level of `Override L`'s three `Override D` / `Override E` citations. _(layer: plugin)_
2. [ ] **Finding 1** — Restate E.2's blocked-remainder Round PASS in the user-review core's `### QA.1+` closing paragraph. _(layer: plugin)_
3. [ ] **Finding 3** — Make qa-tester's PASS priority turn on "no part blocked", and stop the setup sub-bullet asking for a note a PASS cannot carry. _(layer: plugin)_
4. [ ] **Finding 2** — Let both D.2 QA bullets derive the blocked clause off `<ui_test_index>` when the session did not walk the passing round. _(layer: plugin)_

---

## Must Fix

### 1. The user-review core's `### QA.1+` still states the old Round PASS condition, contradicting E.2's blocked-remainder PASS
→ [finding_1.md](fix_findings_overwrites_and_commit_gaps_code_review/finding_1.md)

---

## Should Fix

### 2. The Done summary's blocked-test clause is fed only from session memory, so a resumed session drops it and reports a clean QA pass
→ [finding_2.md](fix_findings_overwrites_and_commit_gaps_code_review/finding_2.md)

### 3. qa-tester's new priority rule admits PASS only when "nothing was noted", which conflicts with its own instruction to note a performed setup
→ [finding_3.md](fix_findings_overwrites_and_commit_gaps_code_review/finding_3.md)

---

## Nice to Have

### 4. `Override L` cites `## Override D` and `## Override E`, but both are level-3 headings
→ [finding_4.md](fix_findings_overwrites_and_commit_gaps_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section carries no divergence call-out.
