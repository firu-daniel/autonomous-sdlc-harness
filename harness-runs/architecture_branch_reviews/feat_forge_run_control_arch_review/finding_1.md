### 1. Build the `branch-user-review` command spelling in `core/pluginIdentity.ts`

**Severity:** Must Fix

**Site:** `cli/src/commands/init.ts` → `reportGithubSteps`, the new pull-request step's `ctx.report.info(...)` line containing `"starts review rounds locally with /autonomous-sdlc-harness:branch-user-review."` (around line 2640, as a navigation hint only).

**Problem.** The new step that `init` prints types the plugin-qualified slash command `/autonomous-sdlc-harness:branch-user-review` as a string literal. `cli/src/core/pluginIdentity.ts` exists to own exactly this kind of spelling. Its header states *"The rule this module exists to enforce: the plugin's name and every plugin-qualified command spelling the CLI prints are built here, once."* It gives the reason too: a private copy *"could be respelled without the others, and an adopter would be told two different commands with no compile error and no test to say so."* `init.ts` already follows the rule for the analyze command. It imports `ANALYZE_COMMAND` from that module, and that constant is built from `PLUGIN_NAME`. The new line bypasses the owner and freezes the plugin name `autonomous-sdlc-harness` into `init`'s output a second time.

That breaks `.claude/context/conventions.md` → `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"*, together with `## Configuration is the source of truth…` → *"The shared constants have owners, and a value is imported from its owner rather than retyped"*. It also breaks the module-header contract that `.claude/context/cli.md` → `## What "done" means here` holds a change to: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit."*

`doctor/checks.ts` has older literals of the same kind (`branch-resume`, `branch-qa-test`). They are on `dev` already and outside this diff, so this finding does not cover them. They do not license a new one.

**Fix.**
1. In `cli/src/core/pluginIdentity.ts`, next to `ANALYZE_COMMAND`, add an export built from `PLUGIN_NAME`:
   ```ts
   /** The user-review command as every line addressing the adopter names it, plugin-qualified. */
   export const USER_REVIEW_COMMAND = `/${PLUGIN_NAME}:branch-user-review`;
   ```
2. In `cli/src/commands/init.ts`, add `USER_REVIEW_COMMAND` to the existing `import { ANALYZE_COMMAND } from '../core/pluginIdentity.js';` line. In `reportGithubSteps`, replace the literal `/autonomous-sdlc-harness:branch-user-review` with `${USER_REVIEW_COMMAND}`, leaving the rest of the sentence byte-identical.
3. Run `commands.typecheck`. If a test asserts this line's text, the rendered output does not change, so no assertion needs editing.
