# Architecture review — iteration 0

The layering of the plan is sound. Each of the nine tasks lands in the layer its tag names:

- **The `cli` tasks.** Tasks 1–4 stay under `cli/src`, `cli/templates` and `cli/test`.
- **The `general` tasks.** Tasks 5–6 add hand-written scripts under the root `scripts/`, alongside `publish-main.sh` and `measure-suite.sh`. Tasks 7–9 edit `docs/`.
- **Where the decisions live.** The upgrade decision sits in the generator (Task 1). The command only wires the flag and reports (Task 2), which is what `.claude/context/cli.md` → *"Commands order and report; they decide nothing"* asks for.
- **Where the replacement goes through.** It goes through the write engine's existing per-request `forceOverride`, and Task 1 amends `cli/src/core/writer.ts`'s re-run table to match.
- **Dependency direction.** `doctor → generators` and `generators → remote` follow existing edges. `PLUGIN_ROOT_ENTRIES_FLAG` in `cli/src/generators/permissionProfile.ts` is the precedent for a flag constant owned by a generator.
- **The cli/plugin boundary.** No new coupling appears between `cli/` and `plugin/`.

## Must Fix

1. **Task 1's Verification names a test file the task neither creates nor edits** — `task_1_plan.md`, `**Verification:**`, the bullet *"Task 2's `init.test.mjs` cases exercise this path end to end through the compiled CLI"*. This breaks the rule in `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 4: a `**Verification:**` bullet may not name a test file the unit neither creates nor edits. Task 1's Targets are only `cli/src/remote/githubActions.ts`, `cli/src/generators/githubWorkflows.ts` and `cli/src/core/writer.ts`, so `cli/test/init.test.mjs` is outside this unit. As written, the bullet invites the Task 1 implementer to run that file to verify its unit. Point 1 of the same rule forbids that run.
   **Fix:** Delete that bullet from Task 1's `**Verification:**`. Move the information into `**Where this task stops.**`, which already says that "the tests that drive the mode through the compiled CLI land there too [in Task 2]", as a statement of where coverage lands, not as a verification step. Leave the other three Verification bullets as they are. They are the typecheck, the `git grep` and the signature check, and none of them is a test run.

## Should Fix

1. **The route string's template mirror is declared only on the template side** — `task_1_plan.md` (the `githubWorkflows.ts` header work) and `task_4_plan.md` (`DECLARED MIRRORS.`).
   - **What Task 4 does.** It makes `harness-run.yml` spell `--upgrade-workflows` and the whole route `npx autonomous-sdlc-harness@<version> init --upgrade-workflows` literally, and declares them as mirrors in the template header.
   - **What Task 1 does not do.** It does not add the reverse declaration to `cli/src/generators/githubWorkflows.ts`'s module header. That module owns `UPGRADE_WORKFLOWS_FLAG` and `upgradeWorkflowsCommand`, the single producer of the route.
   - **The rules involved.** `.claude/context/cli.md` → *"One string, one producer"*. `.claude/context/conventions.md` → `## Configuration is the source of truth…`: the owning module's header declares a template mirror, as `cli/src/remote/githubActions.ts` already does for `harness-run.yml`.
   - **The risk.** Without that declaration, someone renaming the flag in `githubWorkflows.ts` has nothing at the owner telling them the YAML must change too.

   **Fix:** In Task 1's fourth-choice header addition, add one sentence naming `cli/templates/github/workflows/harness-run.yml` (the install step's two refusal messages) as the byte-for-byte mirror of `UPGRADE_WORKFLOWS_FLAG` and `upgradeWorkflowsCommand`'s output.
