`fix_background_test_wait` stops an agent from waiting forever on a test run that has already finished. Today an agent can start the per-unit test in the background and then poll its output file for a line the file never contains.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> ⚠️ **The fix below is a suggestion, not a decision.** Check the diagnosis against the repository and the Claude Code tool behaviour first. Change the fix wherever that check shows it is wrong or lives in the wrong place.

---

## Why

Observed on 2026-10-05 in the headless `/autonomous-sdlc-harness:branch-start-plan-autonomous` run on `feat_remote_run_actor_allow_list`. The agent was the `layer-implementer` dispatched for Task 8, verifying its unit (sub-agent transcript `agent-a46a8648323c1fb5a`). Times are local (UTC+3):

1. **Why the test went to the background at all.** At 17:28:53 and 17:28:55 the agent tried a plain foreground run, `cd <checkout>/cli && npm test -- test/doctor.test.mjs > /tmp/doctor-t8.log`, with `timeout: 600000`. Both attempts were refused by the permission layer, the first with "A variable in this command can't be checked before it runs" and the second with "Commands that change directories and write via output redirection require explicit approval …". With no human to approve in a headless run, the agent dropped the redirect and re-issued the command with `run_in_background: true` at 17:29:00. The command, `npm test -- test/doctor.test.mjs` from `cli/`, is the per-unit command `.claude/context/conventions.md` → `## The testing bar` prescribes, so the scope was right. The **shape** of the command (a `cd` compound plus output redirection) is what pushed it into the background. The Task 6 dispatch earlier in the same run hit the same two refusals and took the same background route.
2. The background run compiled (`pretest` → `tsc`) and ran `node --test --test-timeout=1800000 test/doctor.test.mjs`. It finished at about 17:30: **281 tests, 281 pass, 0 fail**, suite `duration_ms` 83432. The output file ends with the harness's own line `[exited with code 0]`.
3. At 17:29:07 the agent ran a foreground Bash call, "Wait for test run to finish", again with `timeout: 600000`:

   ```
   until grep -qE "^ℹ duration_ms" <tasks>/bvssx116n.output; do sleep 15; done; grep -E "^ℹ (tests|pass|fail|skipped)" <tasks>/bvssx116n.output
   ```

4. That loop **cannot terminate on its own.** `ℹ duration_ms` is printed by Node's `spec` reporter, which `node --test` uses only when stdout is a TTY. Redirected to a file, as a background task's output is, `node --test` uses the **TAP** reporter, whose summary reads `# duration_ms 83432.517625`, `# tests 281`, `# pass 281`.
5. **What it cost: the full 10 minutes of the agent's own timeout.** The test was done by about 17:30. The wait call returned only at 17:39:08, when the 600 s timeout expired. Even then the tool did not kill the loop: it moved it to the background as a new task (`buokwf9di`). At 17:39:14 the agent tried `pkill -f "until grep -qE"` ("Stop the leftover wait loop"), but that needed approval, which a headless run cannot give. The loop lived on until the sub-agent gave its final response at 17:39:32. The agent did report the 281/281 pass, but its report does not mention the lost time. The explicit `timeout: 600000` is why the 2-minute default did not cut it short. Without a working completion signal, any timeout the agent picks is simply how long the run waits for nothing.
6. **The loop is improvised per dispatch, and whether it works is luck.** The Task 6 dispatch, same file and same route, wrote `until grep -qE "^# (fail|duration_ms) |ℹ duration_ms" …` instead. That pattern matches TAP, so it returned after 70 s with `# tests 271 / # pass 271 / # fail 0`.

What probably primed the Task 8 pattern (unconfirmed): nothing in `plugin/`, `cli/templates/` or `.claude/context/` contains `ℹ duration_ms` or tells a per-unit verification how to wait (see the next section). But `.claude/context/conventions.md` → `## The testing bar`, in the bullet starting "A unit's own verification runs the one test file", quotes **spec-reporter** output (`ℹ tests 1`, `ℹ pass 1`) as what a run looks like. An agent that reads that line can easily expect `ℹ` lines in a captured output file.

## The poll pattern that already exists, and where it stops

The harness already has a sanctioned way to wait on a backgrounded command. It covers only the full suite.

- **`run-test-suite.sh --wait <label>`** (`cli/templates/scripts/run-test-suite.sh`, header paragraph "THE WAIT FORM, AND WHY IT EXISTS"). The run form runs `commands.test` once, writes its output to a per-round log, and prints one verdict line (`pass`, `fail <log>`, or `pending`). The wait form polls for one bounded slice and prints `pending` or the verdict. The caller re-issues it as a plain foreground command until a verdict appears. The verdict comes from the wrapper's `<label>.verdict` file, never from the suite's own output, so the reporter format cannot matter.
- **Who is told to use it:** `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`, in the paragraph starting "If the tool layer moves the run to the background". The same instruction appears in `code_review_instructions.md`, `code_review_fixes_instructions.md` and `user_review_fixes_instructions.md`. G.1 also says, under "Forbidden here, by name": **no `Monitor`, no `sleep` of any length in your own command, and never end the turn with the run in flight.** The reason: a headless `claude -p` session is torn down when its turn ends, and the run would then be classified `completed` (`autonomous_pause_and_ledger.md` → §2.5, "A backoff is not a resumption mechanism, and neither is a `Monitor`.").
- **What is not covered: everything outside those gate runs.** `plugin/agents/layer-implementer.md` and `plugin/instructions/unit_loop_core.md` say nothing about a verification command the Bash tool moves to the background. The wrapper also takes no file argument (it only runs `commands.test`), so a unit's single-file test cannot use it as it stands. The observed agent therefore improvised. Its loop broke exactly the rules G.1 forbids by name (`sleep 15` in its own command), and it also keyed on reporter text.

## The goal (suggested; verify each point)

1. **Inventory every place an agent runs a command that can outlast the Bash tool's foreground window**, and check whether that place says what to do when the command is backgrounded. Places to check: the unit loop's per-unit verification (`layer-implementer`, `unit_loop_core.md`, and the orchestrator if it ever verifies itself), `commands.typecheck`, builds, the review flows' gate re-runs, the docs flow, and the QA phase (already covered by `poll-dev-server.sh`). Also check whether the agents running each one are the headless top-level session or dispatched sub-agents, because the turn-teardown risk differs.
2. **Close the gap with the existing pattern rather than a new one, if it fits.** The likely shape is to let the wrapper run a unit-scoped command (for example a file argument, or a configured `commands.unitTest`-style string). The per-unit run then gets the same label, log, verdict file and `--wait` loop. Check whether that is right for adopters, whose per-unit command differs per runner, or whether a smaller rule is enough: run the per-unit test as a plain foreground command and, if backgrounded, collect it through a wait form.
3. **Whatever the rule, it must carry G.1's prohibitions:** no `Monitor`, no `sleep` in the agent's own command, no ending the turn with the run in flight. Waiting for a background task's completion notification is **not** a safe default. In a headless session that means ending the turn, which tears the session down. Confirm whether this also holds for a dispatched sub-agent, whose turn ending returns to its parent rather than ending the process.
4. **Never key completion to the runner's output.** The observed loop waited for `^ℹ duration_ms`, which `node --test` prints only to a terminal. Captured to a file it prints TAP (`# duration_ms`), so the loop could not match. A verdict file written by a wrapper on exit, as `run-test-suite.sh` already does, avoids this whole class of bug.
5. **Fix the priming text.** `.claude/context/conventions.md` → `## The testing bar` quotes spec-reporter output (`ℹ tests 1`, `ℹ pass 1`) in the bullet starting "A unit's own verification runs the one test file". Either say that this is terminal output and a captured run prints TAP, or quote both forms. Point that bullet at whatever the wait rule becomes.
6. **Put the rule where the waiting agent reads it.** `.claude/context/conventions.md` binds only this repository. The gap is in the plugin, and adopters hit it with any runner. The rule belongs in the plugin, and in `cli/templates/` if the wrapper changes.

## Constraints

- Every claim about tool behaviour (when `node --test` picks TAP, when the Bash tool backgrounds a command, how background completion is delivered to a headless session and to a sub-agent, what a Bash timeout does to a foreground loop) must be confirmed by a command run in this session or by a primary source, not repeated from this prompt.
- The rule must not name a specific runner's output as the completion signal. The harness is runner-agnostic for adopters.
- Keep it short: one rule plus its reason, at whichever level owns it. Cite G.1's rule rather than restating it where a pointer is enough.
- The rule must not depend on a wall-clock constant being large enough, just as G.1's `--wait` loop does not.

## Out of scope

- Changing the test runner, its reporter flags, or `cli/package.json`'s `test` script to force a reporter. Consider it only if checking the points above shows nothing at the agent-instruction level works.
- Any change to the per-unit scope rule (one test file per unit), which behaved correctly here.
