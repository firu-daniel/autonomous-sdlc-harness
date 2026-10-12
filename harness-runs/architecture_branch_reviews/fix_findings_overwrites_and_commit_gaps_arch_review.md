# Architecture review — fix_findings_overwrites_and_commit_gaps

## Context

Branch `fix_findings_overwrites_and_commit_gaps`, reviewed 2026-10-12 against `dev` (`git diff dev...HEAD`), in implemented-solution mode. The diff touches 37 files: 15 adopter state-dir README templates under `cli/templates/state-dir/` (`cli` layer) and 22 agent and instruction contracts under `plugin/` (`plugin` layer). Nothing lands in `general`. 24 run-artifact files excluded from the reviewed diff. Rule sources: `.claude/context/conventions.md`, `.claude/context/plugin.md`, `.claude/context/cli.md`, `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors`, and `harness-runs/lessons.md`. No ledger entry reaches this diff.

Headline: the layering holds. Every adopter-facing change sits in `cli/templates/` at the path it lands on in the adopting repository. Every flow contract sits in `plugin/`. No file reaches across the cli/plugin boundary at run time. The two new commit points (`Override 5`, `Override L`) live in their autonomous forks and are registered as entries 13 and 14 of the single-source clean-tree list. The new `unit_findings_folder` committer argument and the `error: blocked — ` qa-tester marker are each carried by their producer and their main consumers. Two contract-placement defects block:

- `Override L` adds a fork→fork citation that no class in the closed sanctioned-anchor list covers.
- One fork-held `<escalate>` closed list still treats every `qa-tester` `error:` as an escalation, which contradicts the new blocked marker.

Two smaller consumer-consistency gaps are Should Fix.

Observation, not a finding: the new fixed subject `chore: Record lessons for <branch>` is not on the fixed-form list in `.claude/context/conventions.md` → `## Commit-message policy`. That list states it is re-derived by probe on the next `/harness-analyze` pass, so a run is not the place to edit it.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Remove the unsanctioned fork→fork citation from `Override L` _(layer: plugin)_
2. [ ] **Finding 2** — Qualify the autonomous fork's closed `<escalate>` list to the unmarked `qa-tester` `error:` _(layer: plugin)_
3. [ ] **Finding 3** — Qualify the supervised QA flow's teardown halt list to the unmarked `qa-tester` `error:` _(layer: plugin)_
4. [ ] **Finding 4** — Extend the unit loop's `<per_unit_review>` `Used at` cell to step 5 and the two committer-staging bullets _(layer: plugin)_

## Must Fix

### 1. Remove the unsanctioned fork→fork citation from `Override L`
→ [finding_1.md](fix_findings_overwrites_and_commit_gaps_arch_review/finding_1.md)

### 2. Qualify the autonomous fork's closed `<escalate>` list to the unmarked `qa-tester` `error:`
→ [finding_2.md](fix_findings_overwrites_and_commit_gaps_arch_review/finding_2.md)

## Should Fix

### 3. Qualify the supervised QA flow's teardown halt list to the unmarked `qa-tester` `error:`
→ [finding_3.md](fix_findings_overwrites_and_commit_gaps_arch_review/finding_3.md)

### 4. Extend the unit loop's `<per_unit_review>` `Used at` cell to step 5 and the two committer-staging bullets
→ [finding_4.md](fix_findings_overwrites_and_commit_gaps_arch_review/finding_4.md)

## Nice to Have

None.
