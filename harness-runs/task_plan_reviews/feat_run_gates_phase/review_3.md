# Task plan review — iteration 3

The Must Fix from `review_2.md` is resolved. Task 23's criterion-5 set is now the ten agent members of the `## The test-run rule` roster, and the bullet excludes `committer.md` by name and says why.

Every derivation entry was executed again:
- E1–E6 were re-run verbatim.
- E7 was re-walked across all 23 `### Targets` lists.
- E8 was re-walked over `harness-runs/lessons.md`.

Every site an entry reaches is a row, so the closure invariant holds. The only exceptions are the two `cli/src` hits, which are application source and outside the register's definition. Index↔file correspondence is 1:1 (23 entries, 23 files). Every task is single-layer, tagged, and within 20 points and 5 `**Work:**` bullets. The tasks run cli → plugin → general.

## Must Fix

1. **G.1 says "wait for it to exit" but names no way to wait that the autonomous fork allows** — `task_9_plan.md` (and the `Top risks:` bullet in the story index, `feat_run_gates_phase_story_plan.md`, that relies on it)
   The story index's third `Top risks:` bullet says: *"Task 9 makes the orchestrator wait on a backgrounded run and never end the session with one in flight"*. But Task 9's `### G.1 Run the gates` bullet says only: *"If the tool layer moves the run to the background, wait for it to exit and read its one line. Never end the session with it in flight."* It gives no mechanism.
   In this repository that branch is always taken. The prompt records one full run at about 220 s, and a foreground Bash call is moved to the background once it passes its window. The canonical pause document rules out the obvious ways to wait. `plugin/instructions/autonomous_pause_and_ledger.md` → §2.5 says: *"⚠️ **A backoff is not a resumption mechanism, and neither is a `Monitor`.** Do **not** schedule a `Monitor`, do **not** sleep for minutes, and above all do **not** end the turn … A headless `claude -p` session is torn down when the turn ends: the process exits, any pending monitor dies with it, and nothing re-invokes the run. That exit is `rc=0` with no `PAUSE_ACK`, so `classify_run_exit` stamps the run **`completed`**"*. The autonomous fork repeats that prohibition (`plan_orchestration_instructions_autonomous.md` → `## Override G` → **Self-pause on API overload.**).
   So Task 9's implementer has to pick a way to wait. The candidates the tree names are all forbidden. If the wrong one is picked, every autonomous run here ends at Phase G with ledger `G` still `[ ]`, no Phase D, and a success notification. That defeats acceptance criteria 1 and 3 in exactly the flow this branch exists for. It was raised as a Should Fix in `review_2.md` (item 8). It is raised to Must Fix here because the pause document states outright that the run dies when the turn ends with a monitor or a background task pending, and because this repository's own gate run always reaches that branch.
   **Fix:** In `task_9_plan.md`, name in the G.1 bullet one waiting mechanism that keeps the wait inside the turn and uses none of the forbidden ones (no `Monitor`, no multi-minute sleep, no ending the turn). The mechanism must not depend on any wall-clock constant being large enough for the suite. One option is a bounded, repeated foreground wait on a verdict the wrapper leaves behind. For example, the wrapper records its verdict line in a file next to the log, and a `--wait <label>` mode blocks for a bounded interval and prints `pending`, `pass` or `fail <log>`. G.1 re-issues that call until it prints a verdict. If the mechanism needs wrapper support, add it to Task 1's contract in `task_1_plan.md`, restate it in `task_2_plan.md` with a test case, and restate it in Task 9's and Task 17's **Depends on** blocks. State in G.1 why the chosen mechanism survives a headless session, citing §2.5, and make the story index's `Top risks:` bullet name the mechanism.

## Should Fix

1. **The log path's branch segment is still spelled two ways** (carried over from `review_0.md`–`review_2.md`; not addressed, and not recorded under `## Rejected findings`).
   - `task_1_plan.md` and `task_2_plan.md` → **Depends on** write `<sanitized branch>`.
   - `task_2_plan.md` → **Pass and fail cases**, `task_3_plan.md`, `task_9_plan.md`, `task_17_plan.md` and the Context's log bullet write `<branch>`.

   Pick one spelling and use it everywhere. Otherwise record a rejection with a reason.
2. **Task 2 still has no case for two of the five refusals** (carried over). They are an unresolvable configuration and an unset `commands.test`. The **Depends on** block lists both, but the **Refusals.** bullet does not test either.
3. **Where `G` / `RG` sit in the ledger's `[-]` paragraph** (carried over) — `task_11_plan.md`. The paragraph puts them in the safety-floor list, but the reason it gives is the other category's (*"a step no directive addresses and no flag gates"*, where `P3` / `A` sit). Move them to the `P3` / `A` list, or add the gate run to `run_mode_instructions.md` → `## The safety floor — what a run mode may never skip` as a target.
4. **Task 11's rule for a ledger with no `G.` / `RG.` line covers only a resume that lands on `D.` / `R5.`** — `task_11_plan.md`. A run on such a ledger whose first `[ ]` is earlier, for example `C`, still reaches Phase G through the core's order. Task 12's and Task 14's flip bullets would then look for a line that does not exist. State the no-entry rule once for any arrival at Phase G on such a ledger: run the phase and record no flip. Have Tasks 12 and 14 point at that rule.
5. **The "five fix rows" rename still names only the table cells** (carried over) — `task_5_plan.md`. Two more mentions are in prose:
   - the ⚠️ note's *"the five fix rows `task_heading: <finding_heading>`"*;
   - `#### Row UR-A` → **Review prompt first line.** (*"aligned with the five fix r…"*).

   `grep -rn "five fix rows" plugin/instructions` must print nothing, so name both in the Work bullet.
6. **Task 8 does not extend the other parts of `architecture-reviewer.md` that are split by sub-case** (carried over) — `task_8_plan.md`. Three parts are missed:
   - `### Plan-review mode FAIL (insertion points 1 and 3)` gets no (c) → `test-fix-plan-writer` bullet;
   - the key table's `story_path` row (*"the story index in sub-case (a), the fix-plan index in sub-case (b)"*) gets no (c) value;
   - *"Neither dispatch carries a `diff_base`, so the mode selector resolves both"* still counts two dispatches.
7. **Criterion 6's pointer may name a ledger entry this branch never writes** (carried over) — `task_23_plan.md`. `harness-runs/flow_progress/feat_run_gates_phase_progress.md` has no `G.` line, and the plugin a run loads comes from the main checkout. State a pointer that resolves either way.
8. **Task 9's and Task 13's `test_cmd` grep expectation conflicts with what the Setup step 3 edit leaves** (carried over). Each edit drops only *"`<test_cmd>` (with the path to test appended) and"*. The same step still says *"the `<test_cmd>` / `<typecheck_cmd>` row above states what to run then"*. Say how that clause is reworded, or widen the grep expectation.
9. **The supervised gate run cannot pass in this repository's main checkout** (carried over) — `task_17_plan.md`. `docs/development.md` → gate 6 records that 6a is red there by design. State that limit, or give the human a named way past an environmental `fail`.
10. **Two doc comments in `outerLoopScripts.ts` go stale, and Task 1 already edits that file** — `task_1_plan.md`.
    - `OuterLoopScript.agentInvocable`'s doc comment lists the `true` rows: *"the git wrappers …, the scratch runner … and the flow walker the orchestrating session steps a flow with"*.
    - The module header's opening line lists the set: *"the run watcher, the git wrappers, the worktree tooling, the flow walker with its gate library and flow graph, and the shared library"*.

    Neither list names the new test-suite runner. Add a Work sub-bullet to update both.
11. **`cli/templates/state-dir/README.md`'s opening list of artifact families** names neither the test-run logs nor the test fix plans, reviews and point reviews. That README describes the template directory Task 3 adds four children to — `task_3_plan.md`. Add it to Task 3's targets, or record why that list is not meant to be complete.

## Nice to Have

1. `task_21_plan.md`: the verification command expands `$HOME` in the command text, which an unattended allow-list may refuse. Task 7 already uses a bare `printenv HOME` for this; do the same here. Also delete the planted `probe.log` after the check.
2. Adopters who upgrade the plugin without re-running `init` have no `<scripts_dir>/run-test-suite.sh`, so Phase G escalates on its "no verdict line" path. Add one sentence in Task 4's or Task 22's adopter-facing text telling them to re-run `init`, with the command in a fenced block (per the lessons ledger) (carried over).
3. `task_12_plan.md`: `## Override I`'s sentence listing the per-item layer-reviewer roots could add `<test_fix_findings_root>` (carried over).
4. `task_13_plan.md`: the phase list in `## Setup` step 5 could add Phase G (carried over).
