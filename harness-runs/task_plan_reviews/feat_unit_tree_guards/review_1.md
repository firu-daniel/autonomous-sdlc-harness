# Task plan review — iteration 1

Both iteration-0 Must Fix findings are resolved: `task_4_plan.md` now scopes the point-4 amendment to a guard "the task neither creates nor edits" and walks the edited-guard case against point 7 (d), and `task_5_plan.md` scopes both planner and reviewer clauses the same way and keeps the reviewer bullet's closing sentence.

## Must Fix

1. **Scope register: derivation entry A misses a corpus site the branch falsifies** — story index (`feat_unit_tree_guards_story_plan.md`), `## Scope register`
   I re-ran entry A verbatim. Every site it reaches is a row (rows 1–12). However, the scope predicate as the register reads it ("every durable corpus site that states which test files a unit runs") also covers sites the entry's alternation does not match. Running a strictly wider pattern finds two sites that no entry reaches and no row lists:
   - `plugin/docs/AUTONOMOUS_FLOW.md` → `**5. The Run gates phase (Phase G).**` paragraph: *"an implementer type-checks the whole tree and runs only the test files it wrote"*. This is a restatement of the rule that the branch makes false. Once point 7 lands, an implementer also runs the tree guards its change reaches, so this sentence becomes stale. No task targets it. The file is also on `## The test-run rule`'s *Who may cite this* roster, whose rule is that a citer "points and never restates".
   - `plugin/instructions/plan_orchestration_instructions_autonomous.md` → the bullet *"The implementer runs `<typecheck_cmd>` and only the test files `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` admits"*. This is a pointer that carries the new rule, so it probably takes `no-change`, but it still needs a row.

   Corrected derivation entry A, strictly wider than the one on the page. It is the same command with two alternatives added, `only the test files?` and `test files? it wrote`:
   `git grep -lE "test file the unit did not create or edit|neither creates nor edits|neither created nor edited|runs only those files|runs only that file|created or edited, with its|only test file|Used only for test files|Used for a unit's own test files|runs the one test file it created or edited|only the test files?|test files? it wrote" -- plugin cli/templates docs README.md .claude/context`
   **Fix:**
   - In the story index, replace entry A with the command above. Add a `change` row for `plugin/docs/AUTONOMOUS_FLOW.md` (Phase G paragraph) with an owning plugin-layer task, and a row for `plugin/instructions/plan_orchestration_instructions_autonomous.md` (the implementer bullet) with its disposition and reason.
   - In the owning per-task file, add the `AUTONOMOUS_FLOW.md` target and a `**Work:**` bullet that rewords the sentence as a pointer, for example "runs only the test files `## The test-run rule` admits". Put this in `task_5_plan.md`, which has 4 `**Work:**` bullets, rather than `task_4_plan.md`, which is already at the 5-bullet ceiling.
   - Adjust that task's "No file outside these…" sentence to match.

## Should Fix

1. **One Verification grep can fail on correct work. This was raised in iteration 0 and is still not addressed or recorded** — `task_5_plan.md`
   *"`git grep -n "treeGuards" -- plugin/agents` names exactly these four files"* fails if Task 4's edit to `plugin/agents/layer-implementer.md` spells the key `treeGuards`, and nothing in `task_4_plan.md` forbids that spelling.
   **Fix:** Make it a subset check ("every file it names is one of these four or `layer-implementer.md`"), or record the rejection under `## Rejected findings` with a reason.

## Nice to Have

1. **Schema-after-model ordering versus the conventions document's key order** — story index `## Context`
   `.claude/context/conventions.md` → `### The order files are created…` item 1 puts the schema first. The plan puts it in Task 6, after the model, the check and the plugin consumers, and the Context paragraph argues for this from the layer order. That is acceptable. A sentence noting that the branch is incoherent only between Tasks 1 and 6, and coherent at its tip, would pre-empt a branch-review question.
