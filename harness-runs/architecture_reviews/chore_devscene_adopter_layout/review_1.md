# Architecture review — iteration 1

Both iteration-0 Must Fix findings are resolved. The configuration contract now ships schema-first and consecutively (Task 15, then Task 1, then Task 36). Task 11 now moves the analyze command together with its three `plugin/agents/` citers.

## Must Fix

1. **The allowlist guard's absent-`scriptsDir` default changes, but its recorded measurement is neither re-taken nor corrected** — `task_10_plan.md` (`**Where this task stops.**`, third bullet: *"The rename leaves every guard's decision on every matrix row the same … So no matrix is re-measured"*), `task_31_plan.md` (`**Where this task stops.**`: *"no measurement is re-taken. The rename of the file a guard reads, and of a default value, changes no guard decision on any recorded matrix row"*, and its `docs/guard-verification.md` Work bullet, which applies only rows 1 and 2), and `chore_devscene_adopter_layout_story_plan.md` (`## Scope register` row 89). Rule sources:
   - `.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`: *"A change to any guard or to the library re-measures itself in `docs/guard-verification.md`"*. `plugin/hooks/README.md` closes on the same rule: *"which is also where a change to any guard or to the shared library records its own re-measurement"*.
   - `.claude/context/conventions.md` → `## Documents of record`: *"A measured fact states what was measured, the command and the exact message"*.

   Task 10 changes `autonomous-script-allowlist-guard.sh` from `hc_config_dir "$top" scriptsDir scripts` to `… scriptsDir devscene-scripts`. Both tasks justify skipping re-measurement by claiming no recorded decision moves. That claim is false. `docs/guard-verification.md` → `#### The single-guard configuration gates` has this row:

   `| scriptsDir absent | the same script under the schema default, <repo>/scripts/typecheck.sh | **allow** |`

   Against the guard as Task 10 leaves it, that probe is SILENT, because `<repo>/scripts/` is no longer the absent-key default. The paragraph under the table (*"The middle three are one measurement in three parts …"*) rests on this row. Task 31 applies only rows 1 and 2 of the spelling table to this document, so the `<repo>/scripts/typecheck.sh` cell survives unchanged. After the branch, the record would state a decision the shipped guard does not make. D3's pattern does not match that cell, so scope-register row 89 misses it too.

   **Fix:**
   - `task_31_plan.md`: add a Work bullet. Against the guard as Task 10 left it, re-drive the three `scriptsDir`-absent and `scriptsDir`-configured rows of `#### The single-guard configuration gates` by hand. Use a throwaway `git init` fixture under the system temp directory, per `plugin/hooks/README.md` → `## Reproducing a decision by hand`. Record what was measured, the payload and the decisions, with the schema-default probe at `<repo>/devscene-scripts/typecheck.sh`. Keep the paragraph's *"an absent `scriptsDir` is **not** a closed condition"* sentence only if the re-taken rows still show it.
   - `task_31_plan.md`: delete *"changes no guard decision on any recorded matrix row"* from `**Where this task stops.**`, and add a verification bullet: `git grep -nF '<repo>/scripts/typecheck.sh' -- docs/guard-verification.md` prints no schema-default row.
   - `task_10_plan.md`: delete *"The rename leaves every guard's decision on every matrix row the same … So no matrix is re-measured"*. State that the default change moves the schema-default row, and that Task 31 records its re-measurement.
   - Story index, `## Scope register` row 89: name the matrix row as a `change` owned by Task 31.

## Should Fix

1. **The CLI still names the renamed slash commands nine positions before the plugin ships them (carried from iteration 0, unrecorded)** — `task_1_plan.md` (`ANALYZE_COMMAND = /devscene:analyze`), `task_4_plan.md` (`MENTION_COMMAND_NAME = 'read-mention'`), `task_6_plan.md` (`remote-run.sh`'s `MENTION_COMMAND='/devscene:read-mention'`), against `task_11_plan.md` at position 13. Rule source: `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 3 (*"the asset itself …, then the instruction or command that dispatches it"*). `## Context` → *Order, and the tree guards that force it* names two places where the readiness list leaves the layer order, and this inversion is not one of them. Either record it there as a deliberate inversion with its reason, or move Task 11's two `git mv` steps (with their in-file respelling) ahead of Task 1.

## Nice to Have

_None._
