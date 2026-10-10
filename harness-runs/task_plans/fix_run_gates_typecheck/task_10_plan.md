### Task 10 — Flow documents and the semi-autonomous command docs describe the two-gate Phase G

**Goal:** Make the plugin's flow documents and its two semi-autonomous command docs say that Phase G runs the whole-tree type check and the test command once per round and passes only when both pass. Today they say it "runs the configured test command once".

**Depends on:** Task 4, which makes `plan_orchestration_instructions_core.md` → `## Phase G — Run gates` the owner of the behaviour these documents summarise:

- one `run-test-suite.sh` call per round runs `commands.typecheck` (whole tree) and then `commands.test`, and the test runs even after a failing type check;
- a round passes only when both pass, and a `<none>` typecheck is recorded not run, never a pass;
- a failure loops through one test fix plan;
- `MAX_GATE_ROUNDS = 5` gate runs, unchanged.

These documents summarise and point at that section. They restate no step.

**Also depends on:** Task 6, whose `unit_loop_core.md` → `## The test-run rule` point 2 states the implementer side that §5 summarises in one clause: a unit type-checks the whole tree, and a failure wholly outside its change is an evidence downgrade that Phase G verifies. `AUTONOMOUS_FLOW.md` is on that section's citer roster, so it may point at it.

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md`: "**5. The Run gates phase (Phase G).**" and the phase-table row "Run gates phase — the test-suite wrapper, the fix-plan writer and its approving reviewer".
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`: the **Implementation.** paragraph's "**G** runs the configured test command once".
- `plugin/commands/branch-implement-plan-semi-autonomous.md`: the "**Phase G:**" bullet.
- `plugin/commands/branch-implement-user-review-semi-autonomous.md`: "After QA, **Phase G** runs the configured test command once".

**Work:**

- [ ] `AUTONOMOUS_FLOW.md` §5: rewrite "The configured test command runs here, once per round, and nowhere else in the flow: an implementer only type-checks and runs the test files it wrote." to say that the whole-tree type check and the test command run here, once per round through one wrapper call, and the round passes only when both pass. An implementer type-checks the whole tree and runs only the test files it wrote, and a type-check failure outside its change is recorded as a downgrade this phase verifies. Keep the fix-loop sentence, "Five gate runs is the cap" and the owning-section pointer. In the phase table, change "the test-suite wrapper" to "the Run gates wrapper"; the cell naming `run-test-suite.sh` keeps the file name.
- [ ] `AUTONOMOUS_FLOW_WHITEBOARD.md`: change "**G** runs the configured test command once and loops any failure through a fix plan" to "**G** runs the whole-tree type check and the test command once per round and loops any failure through a fix plan".
- [ ] `branch-implement-plan-semi-autonomous.md` → "**Phase G:**": change "Run the configured test command once through the `run-test-suite.sh` wrapper; if it fails" to "Run the whole-tree type check and the test command through one `run-test-suite.sh` call; if either fails". Keep the cap and the pointer.
- [ ] `branch-implement-user-review-semi-autonomous.md`: make the same change to "**Phase G** runs the configured test command once through the `run-test-suite.sh` wrapper". The `description:` line and the step-4 pointer only name the phase and are left alone.

**Verification:**

- `git grep -n 'configured test command once' -- plugin/docs plugin/commands` prints nothing.
- `git grep -n 'test-suite wrapper' -- plugin/docs` prints nothing.
- Cited headings stay wires: `grep -rn "AUTONOMOUS_FLOW" plugin/`, the citer sweep `plugin/docs/README.md` names, regenerates the citing set. `git diff -U0 -- plugin/docs/AUTONOMOUS_FLOW.md` shows no changed heading line (no changed line beginning with `#`) and leaves the "**5. The Run gates phase (Phase G).**" lead-in byte-identical, so every citer still resolves.
- Both command files keep only `description:` (and `argument-hint:` where present) in their frontmatter.
