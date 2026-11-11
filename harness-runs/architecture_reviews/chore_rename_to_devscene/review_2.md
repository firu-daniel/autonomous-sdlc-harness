# Architecture review — iteration 2

Scope: the story index `harness-runs/story_plans/chore_rename_to_devscene_story_plan.md` (`## Context`, readiness list, scope register, `## Corpus staleness`, `## Rejected findings`) and all 28 `task_<N>_plan.md` files. I read them against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md`, `plugin/instructions/unit_loop_core.md` → `## The test-run rule` and `plugin/instructions/untrusted_input.md` → `## The laundering check`. I checked the cited sources against the task prompt `harness-runs/task_prompts/chore_rename_to_devscene_task_prompt.md` and `docs/development.md`.

**How iteration 1's findings were handled.**
- **Should Fix 1 (`const CLI = 'npx …'` duplication)** is recorded under `## Rejected findings`. I tested the reason and it holds. The duplication predates the branch: `git grep` shows eight module-local copies across `commands/`, `doctor/`, `generators/` and `retrieval/`. The prompt scopes the branch to the rename, and `task_2_plan.md` → `**Where this task stops.**` now names the follow-up `refactor` branch. Closed.
- **Should Fix 2 (`displayName` on record)** is applied: `task_22_plan.md` has a Work bullet for `docs/development.md` → `## 3.` and depends on Task 11. However, the sentence it records rests on a citation that is wrong. See Must Fix 1. The miscitation started in this reviewer's own iteration 0 and 1 wording (*"the 2026-10-22 check date the prompt gives"*), and that wording is corrected here.

**What still holds.**
- Every target sits inside the `layers[].path` its `_(layer: …)_` tag names.
- Task 18's `cli/test` → root-producer ordering is argued in the index and is a data read, not an import, so it does not breach `.claude/context/conventions.md` → `## The layers` (*"Neither shipped half may reach into the other at run time"*).
- Each shared constant changes once, in its owner (Task 1). Each shell mirror moves in its template (Tasks 5 and 6), and its owner's header keeps naming it.
- Rendered copies are edited at their header only (Task 17).
- No task writes a conventions document or anything under `.claude/**`. The two stale-rule entries are in `## Corpus staleness`, with exact old and new lines.
- No `**Verification:**` bullet or Work step asks for `commands.test`, a gate script, a tree guard, or a test file the task does not edit.
- No plan line fails the laundering check.

## Must Fix

1. **The `displayName` record cites a manifest-reference check that the task prompt does not contain** — `task_22_plan.md` (Work bullet 2, the `## 3.` sentence) and `task_11_plan.md` (first Work bullet). Rule sources:
   - `.claude/context/conventions.md` → `## Documents of record`: *"A measured fact states what was measured, the command and the exact message"*.
   - `.claude/context/conventions.md` → `## Plugin asset authoring`: *"Add only manifest fields the validator recognizes"*, whose record is `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover`.
   - This reviewer's justification-verification rule: a miscited authorization does not waive a rule.

   Task 11 says *"The task prompt records `displayName` as a recognised manifest field, checked against the plugin manifest reference on 2026-10-22."* Task 22 then writes into `docs/development.md` that `displayName` *"is a field the validator recognizes, checked against the plugin manifest reference (code.claude.com/docs/en/plugins/manifest-reference) on 2026-10-22"*. The prompt does not say that:
   - Its line 9 only *requires* the field (*"`plugin/.claude-plugin/plugin.json` gains `"displayName": "DevScene"`"*).
   - Its 2026-10-22 list (lines 12–16) records four facts: kebab-case names under `--strict`, `devscene` not being reserved, `/<plugin>:<command>` namespacing, and the `<plugin>@<marketplace>` key shape.
   - None of the four is `displayName`.

   So the branch would put a check that never happened into the document of record, and that is the one file `## 3.` tells contributors to trust instead of re-checking. Gate `1a` has not run either. It runs in the Run gates round, after Task 22 lands. So *"confirmed by gate `1a`'s `claude plugin validate --strict` run"* also states a result nobody has observed yet.

   **Fix:**
   - In `task_11_plan.md`, replace the miscited sentence with what the prompt actually says: the prompt requires the field, and its acceptance under `--strict` is graded by gate `1a` in the Run gates round.
   - In `task_22_plan.md`, rewrite the `## 3.` Work bullet so the recorded sentence claims only what is true when it is written. For example: *"`plugin/.claude-plugin/plugin.json` carries `displayName`, added when the product was renamed DevScene; gate `1` (`claude plugin validate --strict plugin`) is what establishes that the validator accepts it."* Drop the manifest-reference URL and the 2026-10-22 date unless the writer actually checks the reference now. If they do, cite the date of that check.
   - Keep the bullet's other constraints: a sentence rather than a bullet, and *"Six measured behaviours and one shipped contract"* unchanged.
   - Update Task 22's matching `**Depends on:**` line (Tasks 11 and 14) so it no longer says *"whose validator acceptance this task records"*. Say instead that this task records the field's presence and the gate that grades it.

## Should Fix

_(none)_

## Nice to Have

_(none)_
