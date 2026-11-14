# Architecture review — round 0

verdict: PASS
review_mode: full

## Should Fix

1. **The flow-graph schema (the format contract) lands after the graph and walker that consume it** — story index `feat_parallel_plan_reviews_story_plan.md`, `## Phase 2 Readiness — Ordered Fix List` entries 2–3 against entry 19 (Task 19); `task_2_plan.md` → **Where this layer stops.** Rule source: `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent` (*"Contract before consumer, always."*).
   The format-3 shape is defined in `schemas/flow-graph.schema.json` (Task 19, `general`, position 19). Its consumers are built first: the graph (Task 2) and the walker that refuses any other `formatVersion` (Task 3). Task 2 says so itself: *"Until they land, `npm run validate:flow-graph` and `check-flow-graph.sh` disagree with this file; that is expected inside the branch."* For 16 commits the branch has a graph its own schema rejects. The three shapes that section enumerates (config key, CLI subcommand, plugin contract) do not include a flow-graph format, so this is not graded Must Fix. But the general rule points the other way from the layer-order sequencing.
   **Raised against:** "Until they land, `npm run validate:flow-graph` and `check-flow-graph.sh` disagree with this file; that is expected inside the branch."
   **Must hold:** the schema change for format 3 (and, where practical, its fixtures and `package.json` wiring) is committed no later than the first task that writes a format-3 graph. Otherwise the plan names this as a deliberate departure from contract-before-consumer and gives its reason.
   **Fix:** Move Task 19 ahead of Task 2 in the readiness list, keeping its `_(layer: general)_` tag, and drop the "disagree inside the branch" sentence from Task 2. Alternatively, keep the order and state in the story index `## Context` why layer order wins over contract-before-consumer here.
