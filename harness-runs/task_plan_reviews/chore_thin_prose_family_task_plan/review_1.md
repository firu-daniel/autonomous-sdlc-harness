# Task plan review — iteration 1

## Must Fix
1. **Scope register derivation C3 is still under-inclusive: its fixed search roots miss sites under `evals/`, `schemas/`, `examples/` and `.claude/`** — story index (`chore_thin_prose_family_task_plan_story_plan.md`), `## Scope register`.
   I re-ran C1–C3 verbatim. Every path they print is a row, so the closure invariant holds for the entries as written. The miss is in C3 itself. Its pattern is right, but it searches only `plugin cli/templates cli/src cli/test scripts docs ARCHITECTURE.md`, and some tracked files outside those roots cite the family by name.

   One of them cites a section this branch edits. `evals/plan-shape/scaffold.sh` (header comment, "the plan writer's mandated first read (`plugin/agents/task-plan-writer.md` → `## Read first`)") relies on the writer's `## Read first` naming the conventions documents as a mandatory up-front read. Task 1 rewrites that section and moves `sample_task_plan.md` out of it. That makes it a real site, so no derivation entry may leave it out.

   Re-running the wider command below reaches these sites, and none of them is a row:
   - `evals/plan-shape/scaffold.sh` — cites `task-plan-writer.md` → `## Read first` (likely `no-change`, because Task 1 keeps the conventions bullet and its "Read **all** of them" clause; the reason cell should say so).
   - `schemas/flow-graph-check/flow-graph-check-cap-matches-core.json`
   - `schemas/flow-graph-check/flow-graph-check-fail-cycle-capped.json`
   - `schemas/flow-graph-check/flow-graph-check-findings-folder-in-core.json`
   - `schemas/flow-graph-check/flow-graph-check-ledger-id-known.json`
   - `schemas/flow-graph-check/flow-graph-check-reachable-from-start.json`
   - `schemas/flow-graph-check/flow-graph-check-reaches-terminal.json`
   - `schemas/flow-graph-check/flow-graph-check-run-mode-id-known.json`
   - `schemas/negative/flow-graph-schema-ask-without-resume.json`
   - `schemas/negative/flow-graph-schema-skip-construct-mixed.json`
   - `schemas/negative/flow-graph-schema-unknown-binding.json`
   - `schemas/negative/flow-graph-schema-unknown-outcome.json`
     (each of the eleven fixtures above holds writer and reviewer nodes that dispatch by agent name, and no `name:` line changes)
   - `examples/notes-app/sdlc-harness/flow_progress/feat_note_updated_at_progress.md` and `examples/notes-app/sdlc-harness/improvement_observations/feat_note_updated_at.md` — frozen capture (`.claude/context/conventions.md` → `## Documents of record`), never edited.
   - `.claude/context/conventions.md` — its `_Written by …_` provenance line names `task-plan-writer.md`. It is a conventions-document site, so `no-change` with no exception.

   **Fix:** In the story index's `## Scope register`, replace C3 with this strictly wider read-only command, which searches every tracked file instead of a fixed root list:
   `git grep -l -E 'task-plan-(writer|reviewer)' -- . ':!harness-runs' ':!docs/work-report-research'`
   Update C3's explanatory paragraph to match. Then add one row for each site above, with `Evidence` C3, a `Disposition` and a reason. Give each schema fixture its own row, or one row per fixture directory if every file is listed by name in the `Site` cell. Re-run C1–C3 and confirm that every path they print is a row. Task 8's last `**Verification:**` bullet re-runs these commands, so `task_8_plan.md` needs no change.

## Should Fix
1. **The iteration-0 Should Fix on the "caller reads back" clause is still unresolved and not recorded** — `task_1_plan.md` and `task_4_plan.md`.
   - Task 1 reduces **How the caller consumes your return** to the frozen `## Questions` sentence plus a pointer, on the grounds that `## Output contract` already states the rest.
   - At `4cbe7f72`, `## Output contract` does not carry *"reads back `story_file`, `task_files_dir` and `tasks_count` … without opening the plan files"*.
   - Task 4 still says to "Keep" that clause there, so an implementer cannot tell whether to add it or drop it.

   Either name it in Task 1 as moving into `## Output contract`, with Task 4 saying "add", or remove it from Task 4's keep list. If you reject this finding, record it in `## Rejected findings`.
2. **Task 3 drops the "Work bullets sit within the tagged layer's `layers[].path` scope" rule with no surviving home** — `task_3_plan.md`.
   - Task 3's (b) bullet drops the **Single-layer per task** bullet as a restatement of the readiness bullet.
   - Its step-9 rewrite also drops the item *"matching the single layer the task's `**Work:**` bullets touch"*.
   - The readiness-bullet keep list only says the tag carries exactly one layer and that a cross-layer capability is split. The constraint that the per-task file's `**Work:**` bullets stay inside that layer's path scope is not on it. The reviewer still grades that constraint (`### Architecture`: "a per-task file whose `**Work:**` bullets span more than one layer").

   Add it to the readiness-bullet keep list.
3. **Register row 7 holds three sites in one row** — story index, `## Scope register`. C3 prints `plugin/samples/sample_story/task_1_plan.md`, `task_2_plan.md` and `task_3_plan.md` as three separate paths. The register shape asks for one row per candidate site. Split the row in three, or accept the combined row and record why.

## Nice to Have
1. **Task 8's literal list still omits the reviewer's cross-file anchor and the writer's step numbers** — `task_8_plan.md`.
   - Add `step 5's conventions-document prohibition` to `LIT['task-plan-reviewer.md']`.
   - Optionally assert that the writer's `## Process` still has numbered lines `1.` through `9.`.

   The story index's Context names both as anchors that must survive.
