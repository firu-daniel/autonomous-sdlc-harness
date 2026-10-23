# Skeptic Review: fix_run_gates_answered_park_resume

## Context

**Branch:** `fix_run_gates_answered_park_resume`
**Date:** 2026-10-23

**What I reviewed.** The whole-branch diff against the default branch `dev`. This checkout has no local `dev` ref, so the base is `origin/dev`. The diff covers 14 files:
- `plugin/agents/test-fix-plan-writer.md` and `plugin/agents/layer-implementer.md`;
- `plugin/instructions/mode_contract.md`;
- both orchestration cores and their four forks;
- the autonomous forks of the task-plan-writing and user-review fix-plan-writing families;
- the `test_fix_plans/` and `clarifications/` README templates;
- the new `cli/test/run-gates-park-answer.test.mjs`.

22 run-artifact files excluded from the reviewed diff.

**Reviews de-duplicated against:**
- the code review `harness-runs/code_reviews/fix_run_gates_answered_park_resume_code_review.md`: Findings 1–4, all `[x]`;
- the architecture review `harness-runs/architecture_branch_reviews/fix_run_gates_answered_park_resume_arch_review.md`: Finding 1, `[x]`.

`phases.parity` is `false`, so there is no parity review and check 2's parity leg is inert.

**Headline.** G.0's pending-answer arm holds on the tree. I traced these paths, and each reaches its stated outcome:
- straight-through;
- a crash before G.3, judged on the committed version;
- a crash after G.3;
- answer-mode `## Questions`, which writes nothing, so two pairs reach the next G.0;
- answer-mode gate cap;
- no-code-change `fixable: 0`;
- the round-cap and no-verdict parks.

The lookup cannot match the wrong round's index. Every index path ends `_round_<j>.md`, and the pending test also requires the highest index with no readiness entry and no marker. The cap stays honest.

One net-new defect remains, outside the local lane:
- **Finding 1:** in a GitHub Actions answer resume, the round's test log is absent, because the remote state bundle never carries `test_run_logs/`. The branch excused the planner from that missing log but not the architecture reviewer. So the answer-mode gate returns `blocker:` in exactly the authorised-fix case the branch exists for.

**`cli` layer: clean pass.** Three of the changed files are in the `cli` layer's scope: `cli/test/run-gates-park-answer.test.mjs`, `cli/templates/state-dir/test_fix_plans/README.md` and `cli/templates/state-dir/clarifications/README.md`. I checked each against `.claude/context/cli.md` and `.claude/context/conventions.md` → `## The testing bar`, independently of the code review. Each rule holds.

- **The new test suite** (`.claude/context/conventions.md` → `## The testing bar`; `.claude/context/cli.md` → `## What "done" means here`):
  - **Its header states the rule first.** It opens with *"The rule this suite enforces"*, before any case.
  - **Its source guard is argued as a last resort.** It cites `## The testing bar` and gives the reason: no flow-graph fixture covers Phase G, and no other suite quotes G.0 or G.2.
  - **It names what it deliberately leaves out:** whether a live orchestrator session follows G.0's pending-answer arm.
  - **It asserts against the contract literally.** The pinned `LOOKUP` string is byte-identical to both forks' current `<park_answer_lookup>` rows, after Finding 1's glob-free fix (commit `3786eceb`):
    - `plan_orchestration_instructions_autonomous.md` → `## Mode contract — bindings`;
    - `user_review_fixes_instructions_autonomous.md` → `## Mode contract — bindings`.
  - **It is safe to run here.** It only reads tracked files through `WORKSPACE_ROOT`. It builds no fixture, runs no `init` against this checkout, and starts no service, browser or network call.
  - **Its name follows the *CLI test suite* pattern** in `.claude/CLAUDE.md` → `## File naming conventions`.
- **The two template READMEs** (`.claude/context/cli.md` → `## What this layer owns, and what it is not`, `## Naming and file layout`):
  - **Both edits stay inside existing files** in the `state-dir/` subdirectory. They add no `{{…}}` token, no dot-named file and no new artifact, so no `STATE_DIR_ENTRIES` row and no write-policy or idempotence assertion is owed.
  - **Their content matches the branch's plugin contract:**
    - the `Park answer consumed:` line;
    - the in-own-round revision;
    - the `answered/` read until the committed index records consumption.
- **The self-adopted copies are not a finding.** `harness-runs/test_fix_plans/README.md` and `harness-runs/clarifications/README.md` now differ from their templates by exactly this branch's added sentences.
  - `.claude/context/cli.md` says a `cli/templates/` edit "change[s] nothing here".
  - `.claude/context/conventions.md` → `## Documents of record` says `harness-runs/` is `init`'s output in this checkout.
  - No rule requires a branch to re-sync that output, and precedent is split. `543c854a` and `6d7e0518` updated the copy in the same commit. `92851f48` and `a4ae3c87` did not.
  - So I have no defect to prove, and I leave the copies alone.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only.

1. [ ] **Finding 1** — Let the architecture reviewer accept an unreadable test log on an answer-mode index, word-count neutral _(layer: plugin)_

---

## Must Fix

### 1. In a GitHub Actions answer resume, the answer-mode architecture gate gets a log path that does not exist and returns `blocker:`
→ [finding_1.md](fix_run_gates_answered_park_resume_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Call-outs (intentional divergences — not fixes)

None survived to call out. `phases.parity` is `false`, so there is no reference-implementation divergence. The branch's one claimed refinement is that the marker is written by `test-fix-plan-writer` rather than by G.3. It holds:
- the committer stages content and writes none (`plugin/agents/committer.md` → `review_plan_file`);
- the orchestrator edits no plan file (`plan_orchestration_instructions_core.md` → `## What you must NOT do`).
