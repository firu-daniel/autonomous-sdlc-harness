### 2. Both planning forks say the `no_ui` short-circuit and the `phases.qa` gate are canonical in the core, but the graph owns them now

**Files:**
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` (`## What this file does NOT redefine`)
- `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` (`## What this fork does NOT redefine`)

Both carry the same bullet: "`## UI-test-plan write loop` — steps 1–3, including the `no_ui: true` short-circuit and the `phases.qa` gate. Canonical in the core."

**Problem.** This branch updated the neighbouring bullets in both lists so that each routing fact points at its new owner:
- the `## Loop` bullet says every `iteration >= 5` cap is *"canonical in the planning graph"*;
- the `## Safety contract` bullet says the heartbeat format is *"canonical in the planning graph"*.

The UI-test-plan bullet was not updated, and it now makes two false ownership claims:
- **The `phases.qa` gate** is gone from the core's `## UI-test-plan write loop`. The pre-change *"Skip this loop unless `phases.qa` is `true`"* was removed, and the gate is now the graph's `nodes.ui_writer.skip[0]` (`"construct": "skipped", "phase": "qa"`).
- **The `no_ui: true` short-circuit** is now the walker's routing, via the graph's `nodes.ui_writer.outcomes.no_ui` edge. The core only tells the orchestrator to pass `no_ui` and to note the writer's `reason` for the hand-off (`### 1. Spawn ui-tests-plan-writer` → **No-UI short-circuit.**).

A reader who checks the fork's claim against the core finds no `phases.qa` gate. Routing still works, because the walker applies the gate; that is why this is Should Fix and not Must Fix.

**Fix.** Replace that bullet with the following text, in both files:

```markdown
- `## UI-test-plan write loop` — steps 1–3, including every prompt, every dispatch block and the `no_ui: true` hand-off note, canonical in the core; the `no_ui: true` short-circuit, the `phases.qa` gate and the `qa` run-mode skip, canonical in the planning graph the walker walks.
```

**Verification:** `grep -n 'short-circuit and the `phases.qa` gate. Canonical in the core' plugin/instructions/task_plan_writing_instructions_autonomous.md plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` prints nothing.
