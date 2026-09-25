### 2. `GUIDED_ENDPOINT_EXAMPLE` stays exported with no importer, and its doc comment claims one

**Site:** `cli/src/generators/notifications.ts` → `GUIDED_ENDPOINT_EXAMPLE`, the doc comment *"exported so every surface that shows it quotes one spelling"* (around line 95; navigation hint only).

**Problem.** Before this branch, `cli/src/commands/init.ts` imported `GUIDED_ENDPOINT_EXAMPLE` for its prompt. This branch removes that import: the prompt now interpolates `PUSH_DESTINATION_FORMS`, which carries the example inside it. After the branch, nothing outside `generators/notifications.ts` imports the constant (`grep -rn GUIDED_ENDPOINT_EXAMPLE cli/src cli/test` finds only its declaration and its use in `PUSH_DESTINATION_FORMS`). The doc comment still says it is exported for other surfaces. This is not a placement violation, because the value still has one owner. But the comment now describes a consumer that does not exist, and `.claude/context/cli.md` → `## What "done" means here` asks that a doc comment a review reads as a guarantee still match the code under it. Non-blocking.

**Fix.**
- [ ] Either remove the `export` keyword and change the doc comment to say the constant is interpolated into `PUSH_DESTINATION_FORMS`, which is the surface every caller quotes, or keep the export and change the comment to name its real role: the one spelling of the posted-to address that `PUSH_DESTINATION_FORMS` embeds.
