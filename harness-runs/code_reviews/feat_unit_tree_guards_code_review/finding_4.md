### 4. The adopter conventions template requires same-change registration, which a single-layer task in a layered repository cannot satisfy and point 8 does not require

**File:** `cli/templates/claude/context/conventions.md` → the **What belongs here** bullet beginning "**The rule that keeps `treeGuards` current**" — "adds itself to `harness.config.json` → `treeGuards` in the same change"

**Problem.** This template seeds the rule every adopter's cross-layer conventions document starts from. Planners and reviewers both read that document as authoritative. The bullet says a tree-reading test *"adds itself to `harness.config.json` → `treeGuards` in the same change"*. The harness rule it is meant to feed says otherwise. `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 8 accepts the entry *"in the same change, **or by a later catch-all-layer task the adding task names**"*. It needs that second clause because the plan cuts every task to a single layer. In a layered repository the test lives under a layer path and `harness.config.json` sits in the catch-all, so the adding task cannot write the entry. This branch is an example: its tests landed in `cli` tasks, and Task 8 (`general`) registered the guards.

An adopter who writes the template's rule down as stated ends up with a conventions document that forbids the plan shape point 8 sanctions. `task-plan-reviewer` and `layer-reviewer` read both documents, so they then have two contradictory rules to grade against.

**Fix.** In that bullet, replace

> adds itself to `harness.config.json` → `treeGuards` in the same change, with `test` spelled

with

> adds itself to `harness.config.json` → `treeGuards` — in the same change, or in a later task that edits `harness.config.json` and that the adding task names, since a task confined to one layer cannot reach that file — with `test` spelled

Leave the rest of the bullet unchanged. Files under `cli/templates/` are not compiled and no suite pins this sentence, so this fix runs no test.
