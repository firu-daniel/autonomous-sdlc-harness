### 1. The tree-guard registration rule has no owner; four agents restate it and cite a point that does not carry it

**Severity:** Must Fix · **Layer:** plugin

**Sites:**
- `plugin/instructions/unit_loop_core.md` → `## The test-run rule`. Points 1 through 7 contain no registration rule. Point 7 covers only *When*, *The changed-path set*, *The match*, *The run*, *A failure*, and *A skip*.
- `plugin/agents/branch-reviewer.md` → the check-group bullet beginning *"A test the branch adds that reads a tree of repository files as text"*. It is graded **Must Fix** and cited to *"`## The test-run rule` point 7"*.
- `plugin/agents/layer-reviewer.md` → the **Testing** paragraph, in the clause *"a test the unit adds that reads a tree of repository files as text … (**Should Fix**, … `## The test-run rule` point 7)"*.
- `plugin/agents/task-plan-reviewer.md` → the test-run Must Fix bullet, in the sentence *"so is a plan adding a test that reads a tree of repository files as text … with no catch-all-layer task that adds its `treeGuards` entry"*.
- `plugin/agents/task-plan-writer.md` → `## Process` step 7, the `**Work:**` / `**Verification:**` bullet, in the sentence *"A task adding a test that reads a tree of repository files as text … names, in its own file, the separate, later catch-all-layer task that adds that test's `treeGuards` entry"*.

**Problem.** This branch adds a new responsibility to the plugin corpus. A test that reads a tree of repository files as text must add its `treeGuards` entry, and a reviewer must flag one that does not. That rule has no owning section. Four agent definitions each state it independently, and the copies disagree:

- **Severity.** It is **Must Fix** in `branch-reviewer` and `task-plan-reviewer`, and **Should Fix** in `layer-reviewer`.
- **Wording and condition.** `branch-reviewer` requires an entry *"anywhere in the branch diff"*. `layer-reviewer` accepts the unit's own diff or a `<task_file>` that names the registering task. `task-plan-reviewer` and `task-plan-writer` require a *"catch-all-layer task"*.
- **Citations.** `branch-reviewer` and `layer-reviewer` cite `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` **point 7** as the rule's source. `task-plan-reviewer` cites the section without a point. Point 7 governs only which guards a unit runs and how. It says nothing about registering one.

The rule this breaks:
- `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`: *"A policy file is activated by pointer and never restated … The same rule governs every shared module here."*
- `.claude/context/plugin.md` → `## Writing agent prose`: *"Each rule is stated once."*
- `.claude/context/plugin.md` → `## Citation`: *"A citation names the file *and* the heading it is taking content from"*. These citations name a heading that does not hold the content.
- `## The test-run rule`'s own roster clause: *"A citer **points and never restates**"*.

All four agents are on that roster, so each one is a citer restating a rule. None is pointing at the rule's owner. A later edit to any one copy will silently diverge from the other three, and a reviewer reading point 7 to check a finding will find no rule there.

**Fix.**
1. In `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, add the registration rule once, as a new numbered point after point 7 (for example **8. A tree-reading test registers itself.**). It must state all four of these:
   - **The rule.** A test that reads a tree of repository files as text, rather than one module or one fixed file, adds its `<tree_guards>` entry to `harness.config.json`. That happens in the same change, or in a later catch-all-layer task the adding task names.
   - **The scope boundary.** A test reading one fixed file is not a tree guard.
   - **The grading.** Use **one** severity, chosen once and applied by every reviewer.
   - **The planner obligation** that `task-plan-writer.md` currently carries: the task that adds such a test names the registering task.
2. Replace the restated clause in each of `plugin/agents/branch-reviewer.md`, `plugin/agents/layer-reviewer.md`, `plugin/agents/task-plan-reviewer.md` and `plugin/agents/task-plan-writer.md` with a bare pointer to the new point, for example *"a tree-reading test with no registration (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` point 8)"*. Each agent keeps only the scope words its own review unit needs: branch diff, unit diff, or plan. All four must carry the severity the owning point states.
3. Re-point the `docs/config.md` §5 `treeGuards` row's sentence *"A new test that reads a tree of source files as text adds itself here in the same change"* at the same point, so it cites the rule rather than stating it.

- **Deviations from plan:** Fix step 3 (re-pointing the `docs/config.md` §5 `treeGuards` row's sentence *"A new test that reads a tree of source files as text adds itself here in the same change"* at `## The test-run rule` point 8) lies outside the dispatched `plugin` layer path and was not done; it needs a `general`-layer unit. Steps 1 and 2 landed: point 8 grades a missing registration **Must Fix**, the majority grading of the four copies and the grade point 4 already gives every plan breach; `layer-reviewer`'s copy moves from **Should Fix** to **Must Fix** accordingly.
