# Code Review: fix_remote_pause_state_and_gate12_record

## Context

**Branch:** `fix_remote_pause_state_and_gate12_record`
**Date:** 2026-09-29
**Reviewed:** the whole branch diff against `dev`, 11 files:
- the planning-draft family in the remote state bundle: `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_planning_paths`, `hr_remote_bundle_write` and `hr_remote_bundle_restore` (Task 1);
- `remote-run.sh restore`'s placed/kept report, the expiry wording, and the two-checkout walk test (Task 2);
- the Node 24 action pins and their headers in both workflow templates (Task 3);
- `branch-resume`'s expired-bundle report (Task 4);
- round 2's record in `docs/remote-execution.md` (Task 5) and in Gate 12 of `docs/development.md` (Task 6).

12 run-artifact files excluded from the reviewed diff.

**Tests.** Every `cli` change ships with the cases its layer requires, but this review ran no suite:
- `cli/test/outer-loop-scripts.test.mjs` covers write/restore of the drafts, never-overwrite, mirror exclusion, and symlink and out-of-set entries.
- `cli/test/remote-run.test.mjs` covers pause-then-restore across two job checkouts with the walk's pending node and the drafts on disk, plus a kept committed file.
- `cli/test/workflow-templates.test.mjs` ties each `# ACTION PINS.` block to the file's `uses:` values.

**What was checked and holds.** The eight planning paths match `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3` / `## Override 4` staging lists and the four `findingsFolder` values in `cli/templates/scripts/flows/task_plan_writing.graph.json`. Every new major is the lowest whose `action.yml` declares `node24` in the maintainer's runtime record. `setup-node@v5`'s automatic cache is disabled explicitly. The `ROADMAP.md` *Cloud QA* row is cited by name. Restoring drafts on a re-drop (`resume: none`) onto a reused branch matches a local worktree, which keeps its untracked drafts, and that is the design the story states.

**Parity.** `phases.parity` is `false`, so there was no parity check. Pass 2 found no per-unit review files under the supplied root and carried nothing over.

Three findings remain.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, and the committing role flips each one to `[x]` as that fix's commit lands. That role is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only.

Each entry resolves to `harness-runs/code_reviews/fix_remote_pause_state_and_gate12_record_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable number.

1. [x] **Finding 3** — Make `branch-resume`'s expired-bundle clause about the planning writer conditional on the run still planning _(layer: plugin)_
2. [x] **Finding 1** — Make Gate 12 observation (iii)'s push probe tell the watcher's own push from the job's _(layer: general)_
3. [ ] **Finding 2** — State the Actions Runner 2.327.1 minimum the Node 24 majors require, in both pins headers and the self-hosted setup _(layer: cli, general)_

---

## Must Fix

### 1. Gate 12 observation (iii)'s push probe always lists a run from the watcher's own push, so the push half reads as "a `GITHUB_TOKEN` push started a workflow"
→ [finding_1.md](fix_remote_pause_state_and_gate12_record_code_review/finding_1.md)

---

## Should Fix

### 2. The Node 24 majors all require Actions Runner 2.327.1, and neither the pins header nor the self-hosted setup says so
→ [finding_2.md](fix_remote_pause_state_and_gate12_record_code_review/finding_2.md)

### 3. `branch-resume`'s expired-bundle report says the planning writer starts again even for a run that had finished planning
→ [finding_3.md](fix_remote_pause_state_and_gate12_record_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
