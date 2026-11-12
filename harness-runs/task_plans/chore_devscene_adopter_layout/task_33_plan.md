### Task 33 — Respell the work-report research documents

**Goal:** Make the per-agent work-report research documents and their reviews name `/devscene:analyze`, `plugin/commands/analyze.md`, `devscene.config.json` and the `devscene/` state directory.

**Depends on:** Tasks 1, 11 and 12, which make those names true of the command, its file and the agents these documents describe.

**Where this task stops.** These are research records about agent definitions. They are respelled silently (`## Context` → *Dated records are respelled, silently*). No finding, figure or recommendation changes, and no sentence says a name changed.

### Targets

The twenty-seven files under `docs/work-report-research/` the scope register lists (rows 104–130): `README.md`, `_brief.md`, `business-parity-reviewer.md`, `conventions-reviewer.md`, `conventions-writer.md`, `docs-reviewer.md`, `docs-writer.md`, `layer-implementer.md`, `layer-reviewer.md`, `qa-tester-mobile-maestro.md`, `qa-tester-mobile-mcp.md`, `qa-tester.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `test-fix-plan-writer.md`, `ui-tests-plan-reviewer.md`, `user-review-fix-plan-writer.md`, and under `reviews/`: `conventions-reviewer.md`, `conventions-writer.md`, `docs-reviewer.md`, `layer-implementer.md`, `layer-reviewer.md`, `qa-tester-mobile-mcp.md`, `qa-tester.md`, `task-plan-reviewer.md`.

**Work:**

- [ ] `README.md`, `_brief.md`, `conventions-reviewer.md`, `conventions-writer.md` and their two reviews: apply rows 1, 2 and 6 of `## Context`'s spelling table (`/devscene:analyze`, `${CLAUDE_PLUGIN_ROOT}/commands/analyze.md`, `devscene.config.json`, `devscene/`).
- [ ] Every other target: apply rows 1 and 2.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-analyze|harness:unfilled' -- docs/work-report-research` prints nothing.
