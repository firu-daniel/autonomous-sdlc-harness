## The plan's corpus staleness — `.claude/context/conventions.md` falsified by this branch
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` returns carried a `## Corpus staleness` section with two `stale-rule` entries. (1) `.claude/context/conventions.md` → `## The testing bar`: the rule "a unit's own verification runs the one test file it created or edited" is falsified once `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 7 makes a unit also run every `treeGuards` entry whose `covers` glob its change reaches; the document also lacks the registration rule (point 8) and a matching `## What accompanies a new unit of each kind` row. (2) `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 1 ("the schema lands first" for a new configuration key) conflicts with the layer order the same document mandates (the catch-all `general` layer, which owns `schemas/`, ships last); this branch landed the schema in Task 6, after Tasks 1–5.
- **cost this run:** both restatements are owed as a follow-up — a supervised `/autonomous-sdlc-harness:harness-analyze` run over `.claude/context/conventions.md` (answering `skip` for every other already-filled document), or a hand edit. No task in this branch edits the conventions document.

## Reviewers found no local `dev` ref and silently diffed against `origin/dev`
- **category:** tooling-gap
- **evidence:** `defaultBranch` is `dev`, but this checkout has no local `dev` branch. Three agents reported the same fallback in their returns: the Phase A2 `architecture-reviewer` ("diffed against `origin/dev` (`origin/dev...HEAD`)"), the Phase B `branch-reviewer` ("diffed against `origin/dev...HEAD`"), and the D.1 `statistics-plan-writer` ("`git log dev..HEAD` failed. I used `origin/dev..HEAD`").
- **cost this run:** none measured — each agent recovered on its own; the base each review used is recorded only in its return and, for statistics, in `harness-runs/branch_statistics/feat_unit_tree_guards/statistics.md`.
- **hypothesis:** the implemented-solution dispatch blocks pass `diff_base: <default_branch>` as a bare local ref, which a run copy cut from `origin/<default_branch>` need not carry.

## An implementer ran the type check inside a `cd` compound with a pipe
- **category:** agent-contract
- **evidence:** the Task 5 `layer-implementer` return (dispatch `[A · Task 5 · plugin · iter 0]`, commit `7c6037c4`) self-reported running `cd <repo_root> && bash scripts/typecheck.sh 2>&1 | tail -5`, and stated that this breaks point 6 of `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (no `cd`, no pipe).
- **cost this run:** none measured — the compound ran in this session; under an unattended profile that does not allow-list the compound it would have been refused.

## A single-layer finding tag left part of its fix undone across two units
- **category:** agent-contract
- **evidence:** architecture-review Finding 1 (`harness-runs/architecture_branch_reviews/feat_unit_tree_guards_arch_review.md`) was tagged `_(layer: plugin)_`, but its fix step 3 edits `docs/config.md` (the `general` layer). The plugin implementer (commit `41a1b947`) skipped step 3 as outside its layer and recorded a deviation note; the Finding 2 `general` implementer (commit `0f84444e`) also left it, as outside its own finding. It was re-raised by the Phase B `branch-reviewer` as code-review Finding 3 and fixed in commit `afa458a2`.
- **cost this run:** one extra code-review finding and its implement + commit dispatches (2 dispatches).

## Plan convergence took 4 failing review rounds
- **category:** optimization
- **evidence:** the plan unit's round artifacts across its three plan-gate folders: `harness-runs/architecture_reviews/feat_unit_tree_guards/` holds `review_0.md`, `review_1.md`; `harness-runs/task_plan_reviews/feat_unit_tree_guards/` holds `review_0.md`, `review_1.md`; the business-parity folder does not exist (`phases.parity` is `false`). Total 4 rounds. Per root, from the writer returns (the findings are not headings, so heading-level diffing was not possible): architecture review_1 vs review_0 — 1 Must Fix net-new, 0 re-raised; task-plan review_1 vs review_0 — 1 Must Fix net-new, 1 Should Fix re-raised (the `git grep -n "treeGuards" -- plugin/agents` "exactly four files" check, which the writer described as "raised twice").
- **cost this run:** 13 planning dispatches (4 writer, 5 architecture-reviewer, 3 task-plan-reviewer, counted from this session's heartbeats #1–#13), against a single-pass minimum of 3.
