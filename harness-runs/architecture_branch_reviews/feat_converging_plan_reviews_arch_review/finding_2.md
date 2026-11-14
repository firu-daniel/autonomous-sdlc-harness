### 2. `user_review_fixes_instructions_autonomous.md` cites `plan_review_rounds.md` but is missing from its roster

**Site:** `plugin/instructions/plan_review_rounds.md` → `## Who may cite this` (the bulleted roster ending with `` `${CLAUDE_PLUGIN_ROOT}/agents/skeptic-reviewer.md` ``); the citing site is `plugin/instructions/user_review_fixes_instructions_autonomous.md`, the bullet opening `- **(a) Fix-plan convergence gates**`, which carries `` (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_review_rounds.md` → `## The round file`) ``.

**Problem.** This branch adds `plugin/instructions/plan_review_rounds.md` as a shared instruction module. `.claude/context/plugin.md` → `## What accompanies a new unit of each kind` requires a shared instruction module to land with *"its own activation or citation rule fixing who may point at it, and the roster of those documents inside the module itself"*, and `## Cores, forks and the single-owner rule` adds that the activation-by-pointer rule *"governs every shared module here"*. The module declares its roster closed — *"no plugin asset beyond this list points at this file. A new citer joins this list."* — yet the same branch's edit to `plugin/instructions/user_review_fixes_instructions_autonomous.md` points at `plan_review_rounds.md` → `## The round file` without that file being on the roster. A later rename of `## The round file` that follows the module's own rule (*"updates every roster member in the same change"*) would strand this citer.

**Fix.** In `plugin/instructions/plan_review_rounds.md` → `## Who may cite this`, add the bullet

```
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md`
```

to the roster, grouped with the other instruction files ahead of the agents (after the bullet Finding 1 adds, if that one has landed). Do not remove the citation from `user_review_fixes_instructions_autonomous.md`; it is a pointer, not a restatement, and is a legitimate citer once listed.
