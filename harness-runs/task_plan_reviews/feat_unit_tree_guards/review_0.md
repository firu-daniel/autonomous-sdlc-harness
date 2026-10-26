# Task plan review — iteration 0

## Must Fix

1. **The amended point 4 forbids a plan from naming a tree guard even when it is the unit's own new or edited test file** — `task_4_plan.md`
   The third `**Work:**` bullet amends `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 4 so that *"a plan never names a tree guard"*, with no carve-out. Point 4 as it stands also says *"naming the unit's own new or edited test file is allowed, subject to (3)"*, and point 3 makes a unit that creates or edits a test file run that file. So a task that edits a guard file (say, a new case in `cli/test/main-anchor-isolation.test.mjs`) is both required to name it (points 3 and 4) and forbidden to name it (the new clause). Task 4's own clause (d), *"a guard whose file the unit already ran under point 3 is not run twice"*, assumes this case is legal, so the amended point 4 would contradict the point 7 written in the same task. The prompt asks only that a plan not **add** guards to a task's Verification (Proposal item 3: *"does not list guards in a task's Verification"*). It does not ask that a plan stop naming its own test file.
   **Fix:** In `task_4_plan.md`, reword the point-4 amendment so it forbids naming a tree guard **the task neither creates nor edits**, and state that a guard file the task itself creates or edits stays the unit's own test file under point 3. Add one `**Verification:**` bullet that walks this case against point 7(d): the guard runs once, under point 3.

2. **The planner and reviewer clauses forbid what point 3 requires, and they contradict the reviewer's own existing sentence** — `task_5_plan.md`
   The first `**Work:**` bullet (task-plan-writer, clause (i)) asks the writer to name *"no `treeGuards` test"*. The second (task-plan-reviewer) makes *"a bullet naming a `treeGuards` test"* a **Must Fix**. Neither excludes the task's own new or edited test file. The bullet that Task 5 extends in `plugin/agents/task-plan-reviewer.md` ends with *"A bullet running the task's own new or edited test file is not a finding."* After this edit, a plan whose task edits a guard file and runs it, as point 3 requires, would get a Must Fix it can never clear. That stalls the task-plan loop until it escalates at iteration 5.
   **Fix:** In `task_5_plan.md`, limit both clauses to a `treeGuards` test **the task neither creates nor edits**, in the words of Task 4's corrected point 4. Add a `**Verification:**` grep showing that the reviewer bullet still ends with its "own new or edited test file is not a finding" sentence.

## Should Fix

1. **One Verification grep can fail on correct work** — `task_5_plan.md`
   *"`git grep -n "treeGuards" -- plugin/agents` names exactly these four files"* fails if Task 4's edit to `plugin/agents/layer-implementer.md` spells the key `treeGuards`, and nothing in `task_4_plan.md` forbids that spelling. A unit would then report a false failure.
   **Fix:** Either include `layer-implementer.md` in the expected set, or turn the check into a subset check ("every file it names is one of these four or `layer-implementer.md`").
