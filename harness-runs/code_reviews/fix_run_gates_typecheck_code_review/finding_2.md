### 2. The Done-summary Run gates bullet uses a bare `G` as a placeholder, and that letter is also the phase's name

**File:** `plugin/instructions/plan_orchestration_instructions_core.md` (`## Phase D`, the Done-summary bullet "**Run gates (Phase G): passed on round N, covering G, with X test fixes landed across the rounds**"), and the identical bullet in `plugin/instructions/user_review_fixes_instructions_core.md` (its `## Phase D` Done summary)

Both cores now template the bullet as "passed on round N, covering G, …". They then define `G` as "taken from configuration, never from the log: "type check and tests", or … "tests; type check not run (`commands.typecheck` is `<none>`)"". The bullet's own label is "Run gates (Phase G)", and the autonomous forks' ledger entry is also named `G`. So the same letter means the phase, the ledger row and a substitution slot within one line, and the orchestrator that renders the summary has to work out which `G` it should replace. `.claude/context/plugin.md` → `## The placeholder vocabulary` requires a placeholder to be `<snake_case>` in angle brackets, "and its spelling is its identity". A bare capital letter that collides with a phase id breaks that rule. (`N` and `X` are older bare slots in the same bullet, and this finding leaves them alone. Neither collides with anything.)

**Fix:** in **both** files, edit the bullet the same way:

- [ ] Replace `passed on round N, covering G, with X test fixes landed across the rounds` with `passed on round N, covering <gates_covered>, with X test fixes landed across the rounds`.
- [ ] Replace the definition's opening `` `G` is taken from configuration, never from the log: `` with `` `<gates_covered>` is taken from configuration, never from the log: ``.

Leave every other word of both bullets unchanged. `git grep -n "covering G" -- plugin` should then print nothing.
