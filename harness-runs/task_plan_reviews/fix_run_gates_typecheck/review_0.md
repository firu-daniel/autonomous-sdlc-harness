# Task plan review — iteration 0

## Must Fix
1. **Scope register: the corpus-files derivation misses this repository's own init-written state-directory READMEs** — story index (`fix_run_gates_typecheck_story_plan.md`), `## Scope register`.
   Disposition (ii): no derivation entry reaches these sites. The command entry's pathspec (`plugin docs cli schemas README.md ARCHITECTURE.md llms.txt`) leaves out `harness-runs/`, this repository's `stateDir`. The procedure entry walks only goal 8's list. Re-running the plan's own patterns over the tracked state-directory READMEs finds three durable corpus sites, none of them a row:
   - `harness-runs/test_run_logs/README.md` ("holding the full output of one run of the configured test command"; "A log is written by the harness's test-suite wrapper, `run-test-suite.sh`"). It is byte-identical to `cli/templates/state-dir/test_run_logs/README.md` (`diff` prints nothing), which is row 8, disposition `change`, Task 3. It carries the exact phrase the task prompt's goal 8 names. After Task 3 lands, this copy will still say the wrapper runs only the test command, and the test fix-plan writer reads this directory. This is the plan's own reason for Task 12 (this repository has adopted its own harness, so it keeps its own copy of a template byte-identical), and that reason applies here unchanged.
   - `harness-runs/scratch/README.md` ("the Run gates phase runs the full suite over the committed tree"). It is a copy of row 6's template.
   - `harness-runs/test_fix_plans/README.md` ("the Run gates phase's next run is what verifies it"). It is a copy of row 7's template.
   The register's `Copy` column exists for exactly this case: a rule written twice gets one row per copy. Every row currently carries `—`.
   **Fix:** In the story index, widen the command entry so it also reaches the state directory's tracked READMEs. For example, add `'harness-runs/README.md' 'harness-runs/*/README.md'` to the pathspec of:
   `git grep -lE 'Run gates|Phase G|test-suite wrapper|test_cmd|run-test-suite|configured test command' -- plugin docs cli schemas README.md ARCHITECTURE.md llms.txt 'harness-runs/README.md' 'harness-runs/*/README.md' ':(exclude)cli/src' ':(exclude)cli/test' ':(exclude)cli/templates/scripts/*.sh'`
   Then add one row per newly reached site:
   - Fill `Copy` on these rows, and on rows 6, 7 and 8, to name which copy each is (template vs. this repository's init-written copy).
   - Give `harness-runs/test_run_logs/README.md` a disposition. If it is `change`, a `general`-layer task owns it; Task 12 or a sibling catch-all task can bring it byte-identical to Task 3's template, with a `cmp` verification. If it is `no-change`, state a reason that holds against the plan's own Task 12 rationale.
   - Give the scratch and test_fix_plans copies `no-change`, with the same reasons as rows 6 and 7.

## Should Fix
- Task 7 (`task_7_plan.md`): the user-review fork's `<app_root>` sentence already reads "the core's Setup step 3 runs the configured `commands.typecheck` string, and the cited Phase G's wrapper runs the configured `commands.test` string, both from `$REPO_ROOT`". The planned replacement would put `commands.typecheck` in that sentence twice: once for the unit's Setup run and once for the wrapper. Its "both" would then refer to three runs. Word the replacement so the two `commands.typecheck` runs, the unit's and the wrapper's whole-tree run, read as distinct. Apply the same care to the task fork's row.

## Nice to Have
- Task 1 (`task_1_plan.md`): `cli/src/config/model.ts` says every consumer outside `config/check.ts` calls `answersNone`, the key-gated form. The shell mirror is applied only to `typecheck`, so it is key-gated too. Consider declaring the mirror on `answersNone` / `NONE_SENTINEL_KEY`'s doc comment, or on `COMMAND_NONE_SENTINEL`'s, rather than only on `isNoneSentinel`'s "sides that must agree" sentence.
