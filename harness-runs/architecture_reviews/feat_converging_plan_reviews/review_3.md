# Architecture review — iteration 3

Iteration 2's Must Fix is resolved. Task 1 now adds `fw_fail_count` beside `fw_round_count` and keeps the old function. Task 3 deletes `fw_round_count` and its REPRO lines in the same commit that moves `take_binding` off it, and lists `cli/templates/scripts/lib/flow-walker-gates.sh` among its `### Targets`. So contract-before-consumer holds at every commit. Iteration 2's Should Fix 1 was applied as its option (b): the story index's `## Context` records the four new fixed subjects as a `stale-rule` item.

Task 32 is new in this revision, and it raises the one finding below.

## Must Fix

1. **`task_32_plan.md` (and its readiness entry in `feat_converging_plan_reviews_story_plan.md`): a task tagged `general` edits a file under `cli/`.** Rule source: `.claude/context/conventions.md` → `## The layers` → *"A change whose files sit under `cli/` or `plugin/` belongs to that layer and never to `general`."*
   The readiness entry is `28. [ ] **Task 32** — … _(layer: general)_`. But Task 32's `### Targets` include `cli/test/gate12-sandbox-round-full-run.test.mjs`. Its third Work bullet edits that file: the header comment, a new `WITHHELD` extraction, a `withheld` option on `fullRun`, and a new `FR6: a withheld line over a bundle holding two planning files …` case. That file sits under `cli/`, so it belongs to the `cli` layer (`devscene.config.json` → `layers[0].path` `cli`, rules in `.claude/context/cli.md`). The tag routes the whole task to the `general` implementer and reviewer, so the `cli` layer's rules would never be applied to this test edit. The task's other targets — `scripts/lib/gate12-sandbox-round/grade-full-run.sh`, `docs/sandbox-verification.md` and `docs/development.md` — are correctly `general`.
   **Fix:** Split Task 32 by layer.
   - Keep Task 32 as the `general` task. Its targets become `grade-full-run.sh`, `docs/sandbox-verification.md` and `docs/development.md`. Drop the `cli/test/gate12-sandbox-round-full-run.test.mjs` Work bullet and Verification bullet. Its **Where this task stops** names the new task as the owner of the test edit.
   - Add a new `_(layer: cli)_` task that owns the `cli/test/gate12-sandbox-round-full-run.test.mjs` edit exactly as Task 32's third Work bullet states it now. Its `**Depends on:**` names Task 32, whose grader the new case pins, and Task 7, whose `verb_restore` withheld line it extracts. Its Verification is `npm test --workspace cli -- test/gate12-sandbox-round-full-run.test.mjs`, its own edited test file.
   - Order the new task directly after Task 32 in the readiness list. The test consumes the grader, and contract-before-consumer (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`) puts it after the grader. Note this exception in the readiness preamble, in the same way Task 32's own placement is already noted there.
   - Update every reference to the moved edit: Task 7's **Where this task stops** (*"the `cli/test/gate12-sandbox-round-full-run.test.mjs` case that pins a withheld restore as an FR6 pass"* now names the new task) and the story index's `## Context` paragraph that names Task 32.

## Should Fix

None.

## Nice to Have

None.
