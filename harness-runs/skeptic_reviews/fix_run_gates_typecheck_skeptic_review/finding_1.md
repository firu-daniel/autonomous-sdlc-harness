### 1. The `G` / `RG` ledger rows record "printed pass for typecheck" on a round whose type check was `<none>` and never ran

**File:** `plugin/instructions/autonomous_pause_and_ledger.md` (`### 1.3 Templates`) — "Run gates passed (the Run gates wrapper printed pass for typecheck and test)", twice (the `G.` line of the task-engine template and the `RG.` line of the user-review template); and the two flip rules that quote it: `plugin/instructions/plan_orchestration_instructions_autonomous.md` (the `` `G` — flip once Phase G's wrapper prints `pass` `` bullet) — "which covers both gates (the entry's", and `plugin/instructions/user_review_fixes_instructions_autonomous.md` (the `` `RG` — once the cited Phase G's wrapper prints `pass` `` bullet) — the same clause.

**The problem.** The wrapper prints `pass` when `commands.typecheck` is `<none>` and the test passes. The type check is not run at all in that case. `cli/templates/scripts/run-test-suite.sh` sets `typecheck_status=0` and writes only the `gate typecheck not run: commands.typecheck is <none>` marker, and `cli/test/run-test-suite.test.mjs` pins this ("commands.typecheck `<none>` runs nothing and is logged as not run — with the test passing, the round passes on the test alone" expects `pass\n`). The `G` / `RG` flip rule fires on that `pass`. So for every `<none>` repository the ledger gets a committed `[x]` row whose text says the wrapper "printed pass for typecheck and test", and the flip rule says the `pass` "covers both gates". Neither is true.

That breaks the rule the same cores apply to `<none>` everywhere else. `plan_orchestration_instructions_core.md` → `## Resolved values`, the `<test_cmd>` / `<typecheck_cmd>` row, says: "run nothing for that gate … and record it as not run, never as a pass". Task prompt goal 4 says "`<none>` is not run and not a pass". The Done-summary bullet this branch rewrote does get it right: `<gates_covered>` becomes "tests; type check not run (`commands.typecheck` is `<none>`)". So after a `<none>` run the ledger and the Done summary disagree about the same round. The ledger is the record that stays on the branch, and it is the one claiming a check that never ran. That is the defect class this branch exists to remove: in the scenewise case, the record said something was covered when it was never checked.

**Why it is reachable.** `<none>` is a schema-valid value for `commands.typecheck` (`schemas/harness.config.schema.json`; `cli/src/config/model.ts` → `isNoneSentinel`). Every autonomous task run and user-review round in such a repository reaches the `G` / `RG` flip on its first passing round.

**Why it is Should Fix and not Must Fix.** `hr_ledger_phases` (`cli/templates/scripts/lib/harness-run-lib.sh`) parses rows by id only (`id=${rest%% *}`), and resume keys on the id too. No automated consumer makes a decision from the row text. The harm is a false human-readable record.

**Fix.** Make the row text and the flip-rule clause true in both cases. Change the four sites together, with identical row text. The row ids `G` / `RG`, their markers and their positions stay as they are.

1. In `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates`, in the task-engine template, replace the line

   ```
   - [ ] G.      Run gates passed (the Run gates wrapper printed pass for typecheck and test)
   ```

   with

   ```
   - [ ] G.      Run gates passed (the Run gates wrapper printed pass: test passed, typecheck passed or not run for <none>)
   ```

   and in the user-review template replace

   ```
   - [ ] RG. Run gates passed (the Run gates wrapper printed pass for typecheck and test)
   ```

   with

   ```
   - [ ] RG. Run gates passed (the Run gates wrapper printed pass: test passed, typecheck passed or not run for <none>)
   ```

2. In `plugin/instructions/plan_orchestration_instructions_autonomous.md`, in the `` `G` `` flip bullet, replace

   ```
   which covers both gates (the entry's *"Run gates passed (the Run gates wrapper printed pass for typecheck and test)"*)
   ```

   with

   ```
   which covers the test and, unless `commands.typecheck` is `<none>`, the whole-tree type check (the entry's *"Run gates passed (the Run gates wrapper printed pass: test passed, typecheck passed or not run for <none>)"*)
   ```

3. In `plugin/instructions/user_review_fixes_instructions_autonomous.md`, in the `` `RG` `` flip bullet, make exactly the same replacement as step 2.

Change no other sentence. After the edit, `git grep -n "printed pass for typecheck and test" -- plugin` prints nothing, and `git grep -n "typecheck passed or not run for <none>" -- plugin` prints exactly four lines. The fix touches no test file and asks for no run.
