### Task 4 — Phase G in the task orchestration core runs and reports both gates

**Goal:** Make `plugin/instructions/plan_orchestration_instructions_core.md` say that each Run gates round runs the whole-tree `<typecheck_cmd>` and `<test_cmd>` through the one wrapper call, that a round passes only when both pass, why the test still runs after a failing type check and what that means for `MAX_GATE_ROUNDS`, and that the Done summary reports both gates. The orchestrator stays blind to gate output.

**Depends on:** Task 1, whose wrapper contract this section describes and must not contradict:

- `bash <scripts_dir>/run-test-suite.sh <gate_key>_round_<gate_round>` runs `commands.typecheck` with no path argument and then `commands.test`, each exactly once, and **the test runs even when the typecheck failed**;
- it prints one line, `pass` (both passed, or typecheck not run for `<none>` and test passed), `fail <log path>`, or `pending`, and `--wait <label>` is unchanged;
- with `commands.typecheck` = `<none>` the log records the type check as not run, and that never fails the round;
- `commands.typecheck` unset → exit-2 refusal with one stderr line, which G.1 already treats as the no-verdict-line case.

**Where this task stops.** This section is cited **verbatim** by `plugin/instructions/user_review_fixes_instructions_core.md` → `## Phase G — Run gates`. That file's own intro, row and Done line are **Task 5's**. The test-run rule and the implementer's downgrade rule are **Task 6's**: cite `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, never restate it. The ledger wording is **Task 7's**. G.0, G.2–G.4 and the `<gate_key>` / `<gate_round>` / log-path shapes do not change.

### Targets

- `plugin/instructions/plan_orchestration_instructions_core.md`

**Work:**

- [ ] Opening paragraph: change "the Run gates phase, which runs the configured test command once and loops its failures back" to say that the phase runs the whole-tree type check and the test command once per round and loops failures back. `## Resolved values` → the `<test_cmd>` / `<typecheck_cmd>` row: keep "**Only `## Phase G — Run gates`'s wrapper consumes `<test_cmd>`**" and add that the same wrapper also runs `<typecheck_cmd>` over the whole tree, with no path argument, once per round. That is distinct from a unit's own `<typecheck_cmd>` run, and the `<none>` rule already in the row ("run nothing for that gate … record it as not run, never as a pass") is what the wrapper applies.
- [ ] `## Phase G — Run gates` intro: replace "**It is the only place in the flow `<test_cmd>` runs**, and it runs only through the `run-test-suite.sh` wrapper" with: it is the only place `<test_cmd>` runs, and the only place `<typecheck_cmd>` runs over the whole tree on the flow's behalf, both through one `run-test-suite.sh` call per round. Keep "You never learn what the gates are and never read their output".
- [ ] `### G.1 Run the gates`: after step 2, add one sentence: the wrapper runs the type check then the suite, and its one line is the round's verdict for both. `pass` means both passed, or the type check was not run for `<none>` and the suite passed. `fail <log>` means at least one failed. The orchestrator does not learn which, and the log names it for `test-fix-plan-writer`. The run form, the wait form, the forbidden `Monitor` / `sleep` and the verdict branches are unchanged.
- [ ] `### G.5 Re-run, and the round cap`: add the decision and its effect on the cap. The wrapper runs the suite even after a failing type check (run both, report both), so a round broken both ways produces one log and one fix plan for everything broken, and spends **one** gate run of `MAX_GATE_ROUNDS = 5` where fail-fast would spend at least two. The cap value and "counts **gate runs**, not fix loops" are unchanged.
- [ ] `## Phase D — Done`: in the Done-summary bullet "**Run gates (Phase G): passed on round N, with X test fixes landed across the rounds**", add which gates the pass covered, taken from configuration and never from the log. It is "type check and tests" or, where `commands.typecheck` is `<none>`, "tests; type check not run (`commands.typecheck` is `<none>`)". Change the closing sentence "Phase G is where the suite runs" to "Phase G is where the type check and the suite run".

**Verification:**

- `grep -n 'only place in the flow' plugin/instructions/plan_orchestration_instructions_core.md` prints a line naming both `<test_cmd>` and `<typecheck_cmd>`.
- `grep -nE 'runs the configured test command once' plugin/instructions/plan_orchestration_instructions_core.md` prints nothing.
- `grep -n 'test-run rule' plugin/instructions/plan_orchestration_instructions_core.md` shows the rule is still cited by pointer, with no copied rule text.
- The orchestrator still reads only the wrapper's line: no added sentence tells it to open `<log>`.
- Cited headings are wires (Task 5's verbatim citation and the roster of `## The test-run rule` point at them): `git diff -U0 -- plugin/instructions/plan_orchestration_instructions_core.md` shows no changed line beginning with `#`.
