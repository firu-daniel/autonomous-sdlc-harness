# Architecture review — iteration 2

The iteration-1 Must Fix is resolved:
- `task_31_plan.md` now re-drives the three `scriptsDir`-absent and `scriptsDir`-configured rows of `docs/guard-verification.md` → `#### The single-guard configuration gates` against Task 10's guard. It records the re-drive in the dated-line form, drops the *"changes no guard decision"* claim, and adds the `<repo>/scripts/typecheck.sh` verification bullet.
- `task_10_plan.md` now states that the default change moves the schema-default row and hands the re-measurement to Task 31.
- Scope-register row 89 names the matrix re-measurement as Task 31's `change`.

Nothing else in the plan breaks layer placement or dependency direction:
- The configuration contract still lands schema-first and consecutively (Tasks 15, 1, 36).
- Task 11 still moves the analyze command together with its three `plugin/agents/` citers.
- Task 26's four suites now read `cli/templates/scripts/lib/harness-run-lib.sh` rather than the root's self-adopted copy. That is a `cli` → `cli` edge.
- No Verification bullet asks for a test run the rule forbids. The suite tasks name only their own edited files. Task 17 explicitly leaves the gate to Phase G, and Task 26 leaves `gate12-sandbox-round-docs.test.mjs` to Phase G as well.

## Must Fix

_None._

## Should Fix

1. **The CLI still names the renamed slash commands before the plugin ships them, and this has gone a third round with no fix and no record** — `chore_devscene_adopter_layout_story_plan.md` (`## Context` → *Order, and the tree guards that force it*), `task_1_plan.md` (`ANALYZE_COMMAND = /devscene:analyze`), `task_4_plan.md` (`MENTION_COMMAND_NAME = 'read-mention'`), `task_6_plan.md` (`remote-run.sh`'s `MENTION_COMMAND='/devscene:read-mention'` and its `commands/<basename>.md` existence check), against `task_11_plan.md` at readiness position 13.
   - Rule source: `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 3: *"the asset itself …, then the instruction or command that dispatches it … a dispatch of a contract that does not exist [is a defect]"*.
   - From readiness position 2 to position 12, `init`'s remedy text and the `remote-run.sh` template name `/devscene:analyze`, `/devscene:read-mention` and `plugin/commands/read-mention.md`, none of which the in-tree plugin carries yet.
   - `## Context` → *Order, and the tree guards that force it* still says the readiness list leaves `cli` → `plugin` → `general` order in exactly two places: the configuration contract and the suite tasks. This inversion is not one of them.
   - The story index has no `## Rejected findings` section. So the finding was neither applied nor rejected with a reason, which `harness-runs/lessons.md` → *Unattended control loops* requires of a reviewer's Should Fix in a revision round (*"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason"*).

   **Fix:** Do one of these:
   - Move Task 11 (its two `git mv` steps and their in-file respelling) ahead of Task 1 in the readiness list. Then update `## Context` → *Order, and the tree guards that force it* and the `**Depends on:**` lines that name Task 11 by position (Tasks 12, 13, 14, 23, 32, 33).
   - Or keep the order and record the inversion. Name it in `## Context` → *Order, and the tree guards that force it* as a third deliberate departure from layer order, with its reason. The reason would be that the CLI and template names are inert until the adopter's installed plugin is refreshed after merge, and no intermediate commit is run against the in-tree plugin. Also add a `## Rejected findings` entry for this finding citing that reason.

## Nice to Have

_None._
