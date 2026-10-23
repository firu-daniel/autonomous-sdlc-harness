# Task plan review — iteration 4

Round 3's Must Fix (copy the library beside the wrapper in the `SIGNALS` fixture, plus the pre-flight check) is applied in `task_1_plan.md`. All five of round 3's Should Fix items are resolved in the artifact:
- the start-up refusal case is now in `task_2_plan.md`;
- the late-claim residual is in `task_1_plan.md`;
- the `. ` separator is in `task_4_plan.md`;
- G.1 step 2 now says the run form is issued once per label (`task_4_plan.md` / `task_8_plan.md`);
- the start-up window is never shortened in `task_2_plan.md`.

I re-ran the scope register's D1, D2, D3 and D5 command entries verbatim and re-walked D4. Every site they reach is a row, so there is no closure finding. The index has no `## Rejected findings` section.

## Must Fix

1. **`task_1_plan.md` (and the restatement in `task_2_plan.md`): a worker that finishes inside the start-up poll is reported as "did not start"**
   Task 1's run-form steps 4–5 end the start-up poll in only one way: `.running` holds the worker's PID (`$!`). Otherwise the poll ends in the exit-2 refusal `the detached run of <label> did not start` once `STALE_SECONDS` passes. But the worker body is today's body unchanged, and that body removes `.running` as soon as it has renamed `.verdict` into place (`cli/templates/scripts/run-test-suite.sh` → `printf '%s\n' "$verdict" > "$verdict_file.tmp" && mv -f …`, then `if [ "$(cat "$running_file" …)" = "$$" ]; then rm -f "$running_file"; fi`). The poll runs once a second. So a worker whose gates finish between two polls is never seen holding `.running`: it has already left a verdict, and the run form refuses anyway. G.1 escalates that refusal on a run that actually completed.
   - **This is the normal case in this repository's own suite, not a rare one.** Most of the cases Task 2 re-grounds run un-held stubs that finish in milliseconds: the `pass` / `fail <log path>` pair, one log per round, `<none>`, and the typecheck-only `fail`. Task 2's shared collect helper asserts `pending` / exit 3 from the run form. For these cases it would get the exit-2 refusal instead, so the suite as planned fails, or the implementer has to invent a start-up rule the plan does not state.
   - **An adopter is exposed too.** A fast gate pair, such as `<none>` plus a short suite, hits the same refusal.

   **Fix:**
   - **In `task_1_plan.md`, run-form steps 4–5:** the start-up poll also ends successfully when `.verdict` exists. Step 2 has just removed any stale `.verdict` / `.verdict.tmp`, so a `.verdict` seen afterwards can only be this worker's. In that case print `pending`, exit 3, and let the next `--wait` read the verdict. That keeps the run form's normal answer `pending` and leaves the wire unchanged. Only a poll that sees neither `.running` holding `$!` nor `.verdict` within the window is the refusal. Say the same in the `OUTPUT CONTRACT` / `HOW THE RUN FORM WAS STARTED` header text this task rewrites.
   - **In `task_2_plan.md`, `**Depends on:**`:** restate that start-up contract, including the `.verdict` branch.
   - **In `task_2_plan.md`, `**New: detaching and immediate collection.**`:** add a case with an **un-held** stub. Assert that the run form prints `pending`, exit 3, never the refusal, and that the next `--wait` prints the verdict without re-running anything, with the counter still at one line.

## Should Fix

## Nice to Have
