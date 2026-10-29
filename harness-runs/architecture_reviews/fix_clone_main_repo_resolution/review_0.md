# Architecture review — iteration 0

## Must Fix

1. **The new module's closed citer roster leaves out three citers the plan itself adds** — `task_2_plan.md` (with the matching roster check in `task_8_plan.md`). Rule source: `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, row *A shared instruction module*: *"Its own activation or citation rule fixing who may point at it, and the roster of those documents inside the module itself"*, read with `## Cores, forks and the single-owner rule` → **A policy file is activated by pointer and never restated. … The same rule governs every shared module here.**

   Task 2 makes `## Who may cite this` a **closed** roster of exactly the 21 plugin files and has it *"state that a document not on the list does not point here"*. Three other tasks in the same plan point at `plugin/instructions/main_repo_resolution.md` → `## The fallback` from outside that list:
   - Task 5: `cli/src/doctor/checks.ts`, in the `PROFILE_MAIN_ANCHOR_CHECK` doc comment and in its `warn(…)` message.
   - Task 9: `docs/watcher.md` → `### The main-checkout anchor`, **Read.**. Its parenthesised source is repointed to the module, and it quotes the new clause with its `${CLAUDE_PLUGIN_ROOT}` pointer byte-for-byte.
   - Task 9: `docs/cli.md`, the anchor-rule bullet (*"falls back to the rule in `plugin/instructions/main_repo_resolution.md`"*).

   When the branch lands, the module's own roster is false on the day it ships, and three citers break a rule the module declares. The repository's existing shared module shows the correct shape: `plugin/instructions/unit_loop_core.md` → `## The test-run rule` → **Who may cite this.** lists its non-plugin citers (`docs/config.md`, `docs/cli.md`) repo-relative beside the `${CLAUDE_PLUGIN_ROOT}` entries. Task 8's roster check has the same gap: it asserts that the roster equals the first case row's `expected` keys (the 21 plugin files). So the roster cannot be corrected without breaking that check unless Task 8 changes as well.

   **Fix:**
   - In `task_2_plan.md` → `## Who may cite this`, add `docs/watcher.md`, `docs/cli.md` and `cli/src/doctor/checks.ts` to the roster. Write them repo-relative, never as `${CLAUDE_PLUGIN_ROOT}` paths, as `unit_loop_core.md`'s roster does. Keep the closing statement that no document beyond the roster may point at the heading.
   - Update that task's last **Verification:** bullet so it expects 21 `${CLAUDE_PLUGIN_ROOT}` entries plus the three repo-relative ones.
   - In `task_8_plan.md` → **The module's two checks**, compare only the roster's `${CLAUDE_PLUGIN_ROOT}/…` entries, mapped to `plugin/…`, with the first row's `expected` keys. State that the repo-relative entries are outside that row's `root` and are not compared by it.

## Should Fix

1. **Three citers restate the rule rather than pointing at it** (`task_5_plan.md`, `task_9_plan.md`). Rule source: `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` (*"a citer that paraphrases it becomes a second owner. The same rule governs every shared module here."*); `harness-runs/lessons.md` → `## Agent prose`, first entry. Three places paraphrase the alternates-plus-registry mechanism alongside the pointer: the Task 5 `warn(…)` message and doc comment, the `docs/cli.md` bullet, and Task 9's *"One sentence of what the fallback does"* in `docs/watcher.md`. Most of this is developer-document prose, so it is not graded Must Fix. Still, keep each one to the pointer plus the single outcome the reader needs: it reaches the main checkout from a registered run clone and otherwise stops, never using the copy. Do not re-walk the checks, so that a later change to `## The fallback` does not leave three stale descriptions.

## Nice to Have

None.
