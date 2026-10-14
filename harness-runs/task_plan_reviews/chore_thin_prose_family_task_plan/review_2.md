# Task plan review — iteration 2

## Must Fix
1. **Scope register derivation C3 is under-inclusive: it misses sites that name the family by its role name ("the plan writer", "the plan reviewer", "task-plan writer")** — story index (`chore_thin_prose_family_task_plan_story_plan.md`), `## Scope register`.
   I re-ran C1–C3 verbatim. Every path they print is a row, so the closure invariant holds for the entries as written. The miss is in C3's pattern. It matches the hyphenated agent name only. Several tracked files cite the writer's or the reviewer's contract under the role name instead, and no entry reaches them.

   The clearest case is `plugin/instructions/plan_orchestration_instructions_core.md`, the Done-summary bullet *"**Corpus staleness: each entry's type and what it owes …**"*. It reads *"taken from the `## Corpus staleness` section of the plan writer's return (that literal heading …), each entry summarised with its type as its first token, the way the writer emitted it"*. That is the same contract row 22 rows for the autonomous fork. Task 4 rewrites the section it consumes (`## Output contract` → `## Corpus staleness`), and Task 4's last `**Verification:**` bullet checks only the autonomous file. Other real couplings:
   - `cli/templates/state-dir/task_plan_reviews/README.md` describes the reviewer creating the branch folder and the writer applying Must Fix items. Task 5 edits that paragraph of `## Invocation contract`.
   - `cli/templates/state-dir/story_plans/README.md` and `cli/templates/state-dir/task_plans/README.md` describe the writer authoring the index and every per-task file in one invocation, which Tasks 1 and 3 restate.
   - `evals/plan-shape/case.yaml` (the comment *"those documents are the plan writer's …"*) cites the writer's mandated conventions read. That is the same reliance as row 41, on the `## Read first` that Task 1 rewrites.

   Re-running the wider command below reaches these sites, and none of them is a row:
   - `plugin/instructions/plan_orchestration_instructions_core.md`
   - `plugin/instructions/user_review_fixes_instructions_core.md`
   - `cli/templates/state-dir/task_plan_reviews/README.md`
   - `cli/templates/state-dir/story_plans/README.md`
   - `cli/templates/state-dir/task_plans/README.md`
   - `cli/templates/state-dir/task_prompts/README.md`
   - `cli/templates/state-dir/architecture_reviews/README.md`
   - `cli/templates/state-dir/business_parity_reviews/README.md`
   - `cli/src/commands/init.ts`
   - `evals/plan-shape/case.yaml`
   - `docs/development.md`
   - `docs/remote-execution.md`
   - `docs/retrieval-eval-results.md`
   - `README.md`
   - `ROADMAP.md`
   - `schemas/harness.config.schema.json`

   I expect every one of them to be `no-change`. The reason cell names the contract each relies on and the task that keeps it: for example, the `## Corpus staleness` heading and type tokens are kept by Task 4, the create-folder-only-on-findings rule by Task 5, and the conventions read by Task 1. Sites that only name the role in passing need a reason saying so: the docs-retrieval roster in `init.ts`, `README.md`, `ROADMAP.md` and the schema, and the run histories in `docs/development.md` and `docs/remote-execution.md`.

   **Fix:** In the story index's `## Scope register`, replace C3 with this read-only command. It is strictly wider than the current one, because its first alternative is the current pattern:
   `git grep -l -E 'task-plan-(writer|reviewer)|[Tt]ask[- ]plan (writer|reviewer)|(^|[^-A-Za-z])([Tt]he|[Aa]) plan (writer|reviewer)' -- . ':!harness-runs' ':!docs/work-report-research'`
   - Update C3's explanatory paragraph so it says the pattern also matches the role name.
   - Add one row for each site above, with `Evidence` C3, a `Disposition` and a reason.
   - Re-run C1–C3 and confirm every path they print is a row.
   - Add `plugin/instructions/plan_orchestration_instructions_core.md` (its Corpus-staleness Done-summary bullet) beside the autonomous file in two places: Task 4's last `**Verification:**` bullet in `task_4_plan.md`, and the `## Corpus staleness` anchor sentence of the index's `## Context`.

## Should Fix
1. **Still unresolved and not recorded (raised in iterations 0 and 1): the "caller reads back" clause** — `task_1_plan.md` and `task_4_plan.md`.
   - Task 1 cuts **How the caller consumes your return** on the grounds that `## Output contract` already states the rest.
   - At the current tree (`plugin/agents/task-plan-writer.md` line 54) the clause *"It reads back `story_file`, `task_files_dir` and `tasks_count` … without opening the plan files"* lives only in `## Invocation contract`.
   - Task 4 still says "Keep" it in `## Output contract`.

   Say "move" in Task 1 and "add" in Task 4, or drop it from Task 4's list. If you reject this finding, record it in `## Rejected findings`.
2. **Still unresolved and not recorded (raised in iteration 1): the `layers[].path`-scope constraint loses its home** — `task_3_plan.md`.
   - Task 3 drops the **Single-layer per task** bullet ("its `**Work:**` bullets all sit within that layer's `layers[].path` scope").
   - It also drops the step-9 item "matching the single layer the task's `**Work:**` bullets touch".
   - The readiness-bullet keep list does not carry that constraint, and the reviewer's `### Architecture` still grades it.

   Add it to the keep list.
3. **Register row 7 holds three sites** — story index. C3 prints the three `sample_story/task_<N>_plan.md` files as separate paths. Split the row into three, or record why the combined row stands.

## Nice to Have
1. **Task 8's literal list still omits the reviewer's cross-file anchor** — `task_8_plan.md`. Add `step 5's conventions-document prohibition` to `LIT['task-plan-reviewer.md']`, and optionally assert that the writer's `## Process` still numbers `1.` through `9.`.
