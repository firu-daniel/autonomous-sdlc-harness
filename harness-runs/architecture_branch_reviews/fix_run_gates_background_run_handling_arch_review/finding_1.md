### 1. The uncollected-gate-run clause is copied into the user-review fix core instead of cited from the plan core

**Site.** `plugin/instructions/user_review_fixes_instructions_core.md` → `### D.2 Done summary`, in the bullet opening `**Run gates (Phase G): passed on round N, covering <gates_covered>, …**`. The copied text starts at `Then report the gate runs this session saw go uncollected:` and runs to the end of that bullet, ending `never `none` for them.` The same text sits in `plugin/instructions/plan_orchestration_instructions_core.md` → `### D.2 Done summary`, in the same bullet.

**Problem.** This branch appended a new contract, byte-identically, to the Run gates bullet of both cores' `### D.2 Done summary`. The contract covers four things:
- the `; gate runs not collected: ` suffix;
- the `round <j> — <stopped|re-launched|lost> — <evidence>` entry shape;
- the definitions of **stopped**, **re-launched** and **lost**;
- the `none observed` and re-entry rules.

That gives the contract two owners in two cores. `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`, rule 5, forbids this: *"A core may cite another core by reference and may never copy it — a copy creates a second owner of the contract"*. `plugin/instructions/mode_contract.md` → `## (5) A core may cite another core` states the same rule.

The tree already treats the plan core as the owner:
- The new rule in `plugin/instructions/improvement_observations_instructions.md` (**A gate run stopped, re-launched or lost is always noted.**) takes the three event names from `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### D.2 Done summary` alone.
- The user-review fix core already runs Phase G by reference to the plan core (its opening citation of `## Phase G — Run gates`).

A later edit to the event definitions in the plan core would therefore leave the user-review flow reporting under different definitions, and nothing would flag the drift. The bullet text before this clause was already copied between the two cores before this branch. This finding covers only the clause this branch added.

**Fix.** In `plugin/instructions/user_review_fixes_instructions_core.md` → `### D.2 Done summary`, Run gates bullet:
1. Delete the appended clause, from `Then report the gate runs this session saw go uncollected:` through `never `none` for them.`
2. Put this pointer in its place: `Then report the gate runs this session saw go uncollected exactly as ${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md → ### D.2 Done summary's Run gates bullet defines it — the same suffix, entry shape, event names and none-observed and re-entry rules.` Write the path and the heading in backticks, as the surrounding prose does.
3. Leave the plan core's copy unchanged, because it is the owner.

After the edit, `grep -rn 'gate runs not collected' plugin` should match only the plan core and `plugin/instructions/improvement_observations_instructions.md`, and that file's citation should still resolve to the plan core.
