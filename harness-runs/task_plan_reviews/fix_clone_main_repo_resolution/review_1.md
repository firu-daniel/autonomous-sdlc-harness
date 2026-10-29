# Task plan review — iteration 1

## Must Fix

1. **`task_4_plan.md`: the word-count hold cannot be met without breaking the task's own diff check.**
   - **Work:** → **Hold the agents' word counts.** says `committer.md` and `qa-tester.md` "must not grow", and claims "the new clause is about as long as the old one". It is not. `wc -w` counts the old clause at **20** words and the new clause at **26**, so each of the two agents grows by 6 words from the swap alone.
   - Holding the count therefore means cutting words elsewhere in those two files. Three other parts of the same task forbid that:
     - **Work:** → **The one replacement.**: *"Change no character before or after it at any site"*;
     - **Verification:**, fourth bullet: *"`git diff -- plugin` changes one substring per occurrence"*;
     - **Verification:**, fifth bullet: *"`wc -w plugin/agents/committer.md plugin/agents/qa-tester.md` is not higher than at this task's start"*.
   - So no implementation can pass all of the task's verification bullets. The implementer will either fail the task or quietly ignore one of the bullets.

   **Fix:** In `task_4_plan.md`, pick one route and make **Work:** and **Verification:** agree with it.
   - **(a) Keep the hold.** Name the compensating cut in each agent: the file, the sentence (as a quoted anchor) and the words that go, restatement only, per `harness-runs/lessons.md` → `## Agent prose`. Then change the diff bullet so it allows exactly those named cuts in `committer.md` and `qa-tester.md` besides the one substring.
   - **(b) Drop the hold.** Argue it from `.claude/context/plugin.md` → `## Writing agent prose` → *"An agent's growth is paid for by behaviour"*: the clause adds the clone-arm behaviour. Then remove the `wc -w` bullet and the "about as long" claim.

   Do not shorten the clause itself unless you also change it in `task_8_plan.md`, `task_9_plan.md` and every other file that quotes it.

2. **`task_8_plan.md`: the recorded mutation cannot turn the roster check red, so that test has no valid red run.**
   - **Work:** → **Mutation, recorded in the header.** says to revert `plugin/commands/branch-status.md` to the old clause, *"Run the file once and see both the first row and the roster check fail."*
   - Per **The module's two checks**, though, the roster check compares the `${CLAUDE_PLUGIN_ROOT}/…` entries under `## Who may cite this` in `plugin/instructions/main_repo_resolution.md` with *"the first row's `expected` keys"*. Those keys are a static map in `CASES`. Reverting a site changes neither the roster nor `expected`, so the roster test stays green.
   - Goal 7 of the task prompt requires *"For each test, the mutation that turns it red. Record that each one was actually run red once."* As written, the implementer must either record a red run that never happened or fail to meet goal 7 for the second `test(...)`.

   **Fix:** In `task_8_plan.md`, split the mutation into two:
   - Reverting one site turns the **first row** red only.
   - The **roster check** gets its own mutation: delete one `${CLAUDE_PLUGIN_ROOT}/…` entry from the module's `## Who may cite this` (or add a bogus one) in the working tree only.

   Record each mutation's red run separately in the header, and restore both before committing. Change the **Verification:** bullet *"The header … records the red run"* to *"records both red runs"*.

## Should Fix

1. **`task_1_plan.md`: say that `jq` is needed only on the clone arm** (re-raised from iteration 0, Should Fix 1). The finding is neither resolved in the file nor recorded in a `## Rejected findings` section. The **Work:** bullet *"Every other outcome exits non-zero. That includes … no git and no `jq`"* and the `CLAUDE.md` wording *"and so does a missing `jq`"* can still be read as silencing the offer in a main checkout that has no `jq`. That reading breaks *"Today's answer is unchanged in the main checkout and in a linked worktree"*. State that the F2 arm needs no `jq`, and optionally add a `task_7_plan.md` case that runs the F2 arm with `jq` off `PATH`.
2. **Story index → `## Scope register`, rows 24, 26 and 28: `line 5` is a line coordinate** (re-raised from iteration 0, Should Fix 2). Use the quoted anchor *"at the main worktree's root"* instead. The same applies to `task_1_plan.md` → `### Targets` (*"the line-5 paragraph"*) and `task_12_plan.md` → `### Targets`.
3. **`task_12_plan.md`: a possible README edit is missing from `### Targets`** (re-raised from iteration 0, Should Fix 3). **Work:** → **Recount only if needed.** may edit `examples/notes-app/README.md`. Either list that file as a conditional target, or say the task stops with a blocker if a recount differs.
4. **`task_6_plan.md`: case (f2) has no stated mutation.** The `qa-user-locks.test.mjs` mutation (*"make the clone arm return `<root>`"*) is recorded against case (f) only. It would also turn (f2) red, because the lock would land in the clone. Say so in the header and record (f2)'s red run alongside (f)'s.
5. **`task_2_plan.md`, fifth **Verification:** bullet: the whole-file `grep -o '\${CLAUDE_PLUGIN_ROOT}/…'` is likely to list more than the 21 roster files.** The same task asks for a sentence citing `dispatch_discipline_instructions.md`'s `## Activation`, and the module may cite `unit_loop_core.md` as the roster's model. Scope the check to the lines under `## Who may cite this`, as `task_8_plan.md` does.
6. **`task_10_plan.md`: *"Cite no roadmap item number"* conflicts with `.claude/context/conventions.md` → `## Documents of record`**, which says *"A deferral cites a numbered roadmap item, and the number owes a row"*. Either cite an existing `docs/development.md` → `## 6` item that owns the owed measurement, or state in the task why rows owed to a hand measurement are not deferrals under that rule.

## Nice to Have

1. **`task_3_plan.md`: say the tree is red between Tasks 3 and 6** (carried from iteration 0). After Task 3, `cli/test/qa-user-locks.test.mjs` case (f) fails until Task 6 rewrites it. No unit runs that file in between, but a sentence under **Where this task stops.** would spare a later reader from investigating it.
