# Task plan review — iteration 0

## Must Fix

1. **Index structure — `## Scope register` derivation D1 misses two corpus sites** — story index (`fix_run_gates_wait_form_sandbox_story_plan.md`), `## Scope register`.
   I re-ran D1 verbatim. It reaches 17 files, and every one of them is a row (rows 3–19). A wider sweep of the tracked tree for the same pattern (`git grep -lE 'run-test-suite|no run in flight|kill -0|run_alive|\.running\b|WAIT_SLICE'`) turns up two durable corpus sites that no derivation entry reaches and that have no row:
   - `cli/templates/scripts/README.md`: the adopter-facing template README. Its *"The other family in this directory is not generated."* paragraph names "the Run gates wrapper `run-test-suite.sh`", and then says that `run-test-suite.sh` "is run once per Run gates phase, runs the whole-tree type check `commands.typecheck` and then the test command `commands.test`, writes their output to a per-round log under `<state_dir>/test_run_logs/` and prints only `pass` or `fail <log path>`". D1's path list has `cli/templates/state-dir`, `cli/templates/claude` and `cli/templates/README.md`, but not `cli/templates/scripts/README.md`.
   - `examples/notes-app/.claude/settings.autonomous.json`: the worked example's copy of the profile `_README` line *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS"*, plus its `run-test-suite.sh` allow, deny and `denyWrite` entries. It is the mirrored counterpart of row 15 (`cli/templates/claude/settings.autonomous.json`), but row 15's `Copy` cell reads `—`, and D1 does not search `examples/`.
   Both would most likely be `no-change`: the first describes only the run form's lines, which do not change, and the second is the example's frozen profile. But the closure invariant (*every site D1, D2 or D3 reaches appears as a row*) needs a derivation that reaches them and a row for each.
   **Fix:** Replace D1's command with this one. It adds `cli/templates/scripts/README.md`, `examples/notes-app/.claude` and `examples/notes-app/README.md` and is otherwise identical. It is read-only, and it reaches the 17 current sites plus the two above:
   ```
   grep -rlE 'run-test-suite\.sh|kill -0|run_alive|<label>\.running' docs plugin cli/templates/state-dir cli/templates/claude cli/templates/scripts/README.md cli/templates/README.md cli/README.md README.md ARCHITECTURE.md examples/notes-app/.claude examples/notes-app/README.md harness-runs/test_run_logs/README.md
   ```
   Then add two rows: one for `cli/templates/scripts/README.md` (the *"The other family in this directory is not generated."* paragraph), and one for `examples/notes-app/.claude/settings.autonomous.json` (the `_README` line, with `Copy` = the example copy). Give each a disposition and a reason. Set row 15's `Copy` cell to name the template copy, so the pair is one row per copy.

## Should Fix

1. **Task 1's `RUN_TEST_SUITE_STALE` bound contradicts itself** (`task_1_plan.md`). The constants bullet accepts any value `>= 1`. The header bullet asks the header to "say why it must exceed `HEARTBEAT_SECONDS`" (1). If it must exceed the heartbeat, a value of `1` breaks that rule, and with whole-second mtimes it makes a live run's age flicker between 0 and 2, so the live-or-dead decision becomes flaky. Make the accepted range `>= 2` (strictly greater than `HEARTBEAT_SECONDS`), or drop the "must exceed" sentence. Then restate the chosen range in Task 2's `**Depends on:**` contract, which currently repeats `>= 1`.
2. **Task 4's `WF` grep check cannot pass as written** (`task_4_plan.md`). The check is `grep -nE 'WF[0-9]' docs/sandbox-verification.md shows no id outside them` (that is, outside the F5 row and the WF1–WF5 rows). But this same task puts WF ids in places that are not rows: the `**Stamp.**` line, the sentence under the table ("WF2 is also the first sandboxed measurement…"), the F5 row's own *"Owed: WF2–WF4. WF5 not run."*, and §6's *"and WF5"*. Reword the check so it lists every place where a WF id is allowed.
3. **Task 1's `kill |ps |pgrep` grep check is stated too tightly** (`task_1_plan.md`). `ps ` matches the ends of ordinary words such as "keeps " and "drops ", and the script has comment lines outside the header (for example, the comment inside `wait_for_verdict`). Anchor the pattern (for example `\b(kill|ps|pgrep)\b` on lines that are not comments), or say "comment lines" instead of "header comment lines".

## Nice to Have

1. `task_1_plan.md` `### Targets` says the run-form edit runs "through the two gate blocks". The `trap - TERM INT HUP` clear sits after them, just before the verdict rename, so name that line in the target range too.
2. `heartbeat_age`'s GNU-first `stat -c %Y` prints an "illegal option" error on BSD before the fallback runs. The plan already keeps stderr out of the wrapper's streams, but saying `2>/dev/null` explicitly on both probes would stop a stray stderr line from contradicting the one-stderr-line refusal contract.
