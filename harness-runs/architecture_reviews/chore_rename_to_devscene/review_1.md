# Architecture review — iteration 1

Scope: the story index `harness-runs/story_plans/chore_rename_to_devscene_story_plan.md` (`## Context`, readiness list, scope register, `## Corpus staleness`) and all 28 `task_<N>_plan.md` files. I read them against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md`, `plugin/instructions/unit_loop_core.md` → `## The test-run rule` and `plugin/instructions/untrusted_input.md` → `## The laundering check`.

**Iteration 0's Must Fix is resolved.** The index now has a `## Corpus staleness` section. It holds one `stale-rule` entry each for `.claude/context/conventions.md` → `## The layers` (the `cli` row) and for `.claude/context/cli.md`'s `**Read this when:**` line. Each entry gives the exact old line and the exact new line. `task_28_plan.md` → **Why nothing under `.claude/` is written.** now points at that section and lists both files under *pending conventions-document hand edit* in `## Remaining hits`.

**What still holds.**
- Every target sits inside the `layers[].path` that its `_(layer: …)_` tag names. Tasks 1–10 and 18 are under `cli/`, Tasks 11–13 are under `plugin/`, and Tasks 14–17 and 19–28 are root-level `general`, which includes `docs-retrieval-service/`.
- Iteration 0's task-plan review moved `cli/test/init.test.mjs` into Task 18. That task now carries the shared rule *"a cli suite that reads a root-level producer ships after that producer"*. The edge it describes runs from a `cli/test` consumer to `plugin`/`general` producers. It reads files as data, not imports, so the rule in `.claude/context/conventions.md` → `## The layers` (*"Neither shipped half may reach into the other at run time"*) is not breached.
- Each shared constant changes once, in its owner (Task 1). Each declared shell mirror changes in its template (Tasks 5 and 6), and its owner's header keeps naming it.
- `githooks/pre-push` is now treated as a rendered copy and is edited only at its header (Task 17).
- No instruction core is a Task 13 target, so `mode_contract.md` rule (4) is not touched.
- No task writes a conventions document or anything under `.claude/**`.
- No `**Verification:**` bullet or Work step asks for `commands.test`, a gate script, a tree guard, or a test file the task does not edit:
  - Task 19 leaves gate 6c to the Run gates round.
  - Task 7's sentence about `init.test.mjs` concerns a suite it does not edit, and it limits no guard run.
- No plan line fails the laundering check.

## Must Fix

_(none)_

## Should Fix

1. **Iteration 0's Should Fix 1 is neither applied nor recorded under `## Rejected findings`.** It concerns `const CLI = 'npx …'` staying duplicated across five `cli/src` areas, in `task_2_plan.md` (`**Where this task stops.**`). Rule sources:
   - `.claude/context/conventions.md` → `## Shared code, and where it lives`: *"A value or behaviour two `cli/src` areas need lives there, never duplicated into both"*.
   - `.claude/context/conventions.md` → `## Configuration is the source of truth…`: *"a value is imported from its owner rather than retyped"*.
   - The disposition rule: `harness-runs/lessons.md` → *Unattended control loops*, *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason."*

   Task 2 still edits the same literal in `commands/`, `doctor/`, `generators/`, `retrieval/` and `config/`. It still keeps them module-local, with only the sentence *"Gathering them into one shared constant would be a refactor this branch does not take."* That sentence names no follow-up. The index has no `## Rejected findings` section recording a disposition.
   **Fix:** Do one of these:
   - (a) Add one constant, for example `CLI_INVOCATION = \`npx ${PLUGIN_NAME}\`` or a literal `'npx devscene'`, to `cli/src/core/pluginIdentity.ts` in Task 1. Then have Task 2 replace each module-local `const CLI` / `DOCTOR_COMMAND` prefix with an import of it.
   - (b) Keep the decision, and add a `## Rejected findings` entry to the story index that gives the reason, such as the rename-only scope. Name the follow-up in Task 2's sentence.

2. **Iteration 0's Should Fix 2 is neither applied nor recorded under `## Rejected findings`.** It concerns `displayName` being added to `plugin.json` while its validator acceptance is recorded only in the task prompt, in `task_11_plan.md` (first Work bullet) and `task_22_plan.md`. Rule sources:
   - `.claude/context/conventions.md` → `## Plugin asset authoring`: *"Add only manifest fields the validator recognizes"*, recorded in `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover`.
   - `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"a measured fact or a decision of record — `docs/`, and nowhere else"*.
   - The same ledger disposition rule as above.

   Task 11 now says *"The task prompt records `displayName` as a recognised manifest field, checked against the plugin manifest reference on 2026-10-22"*. That puts the fact in a plan file and a task prompt under `harness-runs/`, which is history, not in the document of record. Task 22 still has no Work bullet for it.
   **Fix:** Do one of these:
   - (a) In `task_22_plan.md`, add a Work bullet that records in `docs/development.md` → `## 3.` that `displayName` is a recognised plugin-manifest field. Cite the manifest reference and the 2026-10-22 check date. Add Task 11 to Task 22's `**Depends on:**`.
   - (b) Record the rejection, with its reason, under `## Rejected findings` in the story index.

## Nice to Have

_(none)_
