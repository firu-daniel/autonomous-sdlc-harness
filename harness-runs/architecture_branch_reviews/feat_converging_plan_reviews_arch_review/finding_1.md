### 1. `plan_orchestration_instructions_autonomous.md` cites `plan_review_rounds.md` but is missing from its roster

**Site:** `plugin/instructions/plan_review_rounds.md` → `## Who may cite this` (the bulleted roster ending with `` `${CLAUDE_PLUGIN_ROOT}/agents/skeptic-reviewer.md` ``); the citing site is `plugin/instructions/plan_orchestration_instructions_autonomous.md`, the bullet opening `- **(a) Plan-convergence gates**`, which carries `` (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## The round file`) ``.

**Problem.** This branch adds `plugin/instructions/plan_review_rounds.md` as a shared instruction module. `.claude/context/plugin.md` → `## What accompanies a new unit of each kind` requires a shared instruction module to land with *"its own activation or citation rule fixing who may point at it, and the roster of those documents inside the module itself"*, and `## Cores, forks and the single-owner rule` adds that the activation-by-pointer rule *"governs every shared module here"*. The module carries that roster and declares it closed: *"no plugin asset beyond this list points at this file. A new citer joins this list."* But the same branch's edit to `plugin/instructions/plan_orchestration_instructions_autonomous.md` points at `plan_review_rounds.md` → `## The round file`, and that file is not on the roster. The roster is therefore incomplete, and the module's own heading-rename rule (*"An edit that rewords or moves a heading updates every roster member in the same change"*) would miss this citer.

**Fix.** In `plugin/instructions/plan_review_rounds.md` → `## Who may cite this`, add the bullet

```
- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md`
```

to the roster, after the `user_review_fix_plan_writing_instructions_autonomous.md` bullet so the instruction files stay grouped ahead of the agents. Do not remove the citation from `plan_orchestration_instructions_autonomous.md`; it is a pointer, not a restatement, and is a legitimate citer once listed.
