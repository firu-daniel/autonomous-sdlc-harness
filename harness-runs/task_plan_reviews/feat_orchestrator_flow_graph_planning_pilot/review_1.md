# Task plan review — iteration 1

All three Must Fix items from review 0 are resolved: entry C was widened and its rows added, Task 10 now corrects both forks, and the `## Stop conditions` entry range is pinned in Tasks 9 and 10. The two items below are new.

## Must Fix

1. **Task 5 breaks `cli/test/init.test.mjs`'s wrapper-family assertions, so its own `bash scripts/test.sh` Verification cannot pass** — `task_5_plan.md`.
   `cli/test/init.test.mjs` has a hand-spelled exclusion list, `OUTER_LOOP_SCRIPT_FILES`. Its doc comment reads *"The outer-loop scripts that land in the same `scriptsDir` as the wrappers and reach the profile through the same three forms — excluded everywhere below"*. Two helpers subtract it:
   - `writtenWrappers(dir)` takes every top-level `*.sh` in `scriptsDir` and drops the names on the list.
   - `scriptPaths(profile, list)` takes every script-shaped permission entry and drops those whose basename is on the list.

   Task 5 puts `flow-walker.sh` directly in `scriptsDir`, with `agentInvocable: true`, which gives it three profile allow entries. It is not on that list, so both helpers now count it as a wrapper. These existing assertions then fail:
   - `assert.deepEqual(await writtenWrappers(dir), [])`, in two places;
   - `assert.deepEqual(scriptPaths(profile, 'allow'), [])`;
   - `assert.deepEqual(written, ['start-dev-server.sh', 'test.sh', 'typecheck.sh'])`.

   Task 5 lists `cli/test/init.test.mjs` as a target for its `RUN_CONTROL_ARTIFACTS` list only. Its Verification says `bash scripts/test.sh` exits 0, and that step runs `npm test`. The table-driven `cli/test/profile.test.mjs` is not affected, because it subtracts `OUTER_LOOP_SCRIPTS` itself. The hand-spelled list in `init.test.mjs` is what goes wrong. (`lib/flow-walker-gates.sh` sits in a subdirectory and the graph is not a `.sh` file, so neither one enters `writtenWrappers`.)
   **Fix:** In `task_5_plan.md`, add `'flow-walker.sh'` to `OUTER_LOOP_SCRIPT_FILES` in `cli/test/init.test.mjs`. Put it in the same Work bullet as the `RUN_CONTROL_ARTIFACTS` edit, so the bullet count stays at 4. Spell the name out rather than importing it, as that list's doc comment requires. Extend the `### Targets` line for `cli/test/init.test.mjs` to name `OUTER_LOOP_SCRIPT_FILES` as well. Add a Verification line saying that the wrapper-pairing cases in `init.test.mjs` still pass.

2. **Scope register: derivation entry C is still under-inclusive (disposition ii)** — story index (`feat_orchestrator_flow_graph_planning_pilot_story_plan.md`), `## Scope register`.
   Entry C's own site class is *"texts that enumerate the outer-loop script set, or state which of its rows are agent-invocable"*. I re-ran its command verbatim, and every site it reaches is a row. Three sites in that class enumerate the outer-loop set without any of its three phrases, so the command never reaches them, and none of them is a row:
   - `cli/test/init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES`: the enumeration behind Must Fix 1. It needs a `change` row owned by Task 5.
   - `plugin/hooks/README.md` → `## The deny list`: *"The other outer-loop scripts written into the same directory — `create-worktree.sh`, `setup-worktree.sh`, `autonomous-notify.sh`, `autonomous-format-stream.sh`, `docs-search-server.sh`, `scratch-run.sh` — stay allowed"*. After Task 5, `flow-walker.sh` and `lib/flow-walker-gates.sh` are two more outer-loop files the guard leaves allowed. Task 17 argues about this list in its own body (*"Those six are the left-allowed set `plugin/hooks/README.md` … name"*), so it is a site this plan has considered, but the register does not record it.
   - `plugin/hooks/autonomous-script-allowlist-guard.sh` → the `# LEFT ALLOWED, DELIBERATELY:` comment, which enumerates the same six. Task 17's *"Where this task stops"* declines it in prose, but there is no row.

   A command that is strictly wider, keeps entry C's three alternatives, and reaches exactly these three sites beyond the current rows: `git grep -lE "docs-retrieval server launcher|agent-invocable|Profile allow entry|LEFT ALLOWED|stay allowed|OUTER_LOOP_SCRIPT_FILES" -- . ':!harness-runs' ':!examples'`
   **Fix:** In the story index, replace entry C's command with the one above, or with an equivalent that is strictly wider. Add one row for each of the three sites:
   - `cli/test/init.test.mjs`: `change`, owned by Task 5.
   - `plugin/hooks/README.md` and the guard's `LEFT ALLOWED` comment: either `change` with an owning `plugin`-layer task, or `no-change` with the reason. Task 17 already gives that reason: the walker is reached through its `yes` row, the gate library is a sourced `lib/` file like `harness-run-lib.sh`, and the existing enumeration already leaves out the agent-invocable git wrappers and the shared library on that same ground.

## Should Fix

1. **Task 1's heartbeat Verification fails for two of its six templates by construction** — `task_1_plan.md`. The Verification says every heartbeat is a byte-for-byte substring of the base-commit core once `{iteration}` is read back as `<i>`. The core never spells `[plan-write · iter <i>] → task-plan-writer` or `[plan-write · iter <i>] → task-plan-reviewer`. It has the generic `[plan-write · iter <i>] → <agent_name>` (the `## Safety contract` step 3) and the example `[plan-write · iter 0] → task-plan-writer`. The Work bullet already says the reviewer's heartbeat uses *"the Safety contract's generic form"*. Change the Verification so these two are checked against the generic form with `<agent_name>` substituted, and only the other four by direct substring.

2. **Task 10's first Verification contradicts its own Work** — `task_10_plan.md`. The Work leaves the rest of the autonomous `<escalate>` row *"as written"*, and that row keeps *"the `iteration >= 5` non-convergence stops in `## Loop` steps 2, 3 and 5"*. The first Verification, `grep -n "iteration >= 5\|heartbeat format" …`, requires *"every hit names the planning graph or the walker as the cap's home"*. That row is a hit and names neither. Either exempt that row in the Verification (it names the escalation **sites**, not the cap's home), or reword the phrase in Work to *"the walker's cap `<escalate>` at `## Loop` steps 2, 3 and 5 …"*.

3. **Task 5 leaves statements in `outerLoopScripts.ts` that become false** — `task_5_plan.md`. `.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"*. Task 5 amends only the `agentInvocable` doc comment. After the three rows land, these become false:
   - the `OUTER_LOOP_SCRIPTS` doc, *"the shared library first, because every other row sources it"*: the graph row sources nothing, and `flow-walker-gates.sh` sources nothing either (Task 3);
   - the module header's opening, *"the shared library they all source"*;
   - the `mode` doc, *"`0o644` for one that is only ever sourced"*: the graph is `0o644` data, not a sourced file;
   - the `agentInvocable` doc's list of `false` rows the guard auto-allows without a deny entry, which the new gate library now joins.

   Add these to the doc-comment Work bullet.

4. *(Carried from review 0, still unaddressed.)* The new `flow-graph-schema-*` negatives are wired into `validate:flow-graph:negative`, but `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` names `validate:config:negative` — `task_12_plan.md`. Record the deviation in the task file, and raise the conventions row as a `stale-rule` entry in `## Corpus staleness`.

5. *(Carried from review 0, still unaddressed.)* `fw_id_in_list` states no whitespace-trimming rule, although the ledger's `- skipped:` line is comma-separated and Task 3's own Verification uses `parity, qa` — `task_3_plan.md`. State the trim, and add a REPRO line showing `fw_id_in_list qa "parity, qa"` exiting 0.

6. *(Carried from review 0, still unaddressed.)* `task_16_plan.md` records commands (`git cat-file -s …`, `wc -c …`) and edits the adopter-facing `docs/cli.md`, but it never states the lessons-ledger rule *"Every command an adopter is meant to run sits in a fenced block, one command per line"*. Register row 26 says Task 16 honours that rule. Say so in Task 16's Work and Verification, as Tasks 8 and 14 do.

## Nice to Have

1. `docs/watcher.md` §2's second intro bullet (*"Each one resolves `<repo_root>/harness.config.json` at run time through the one shared library beside them"*) becomes inexact once the table carries a JSON data row and a second library. Task 17 could qualify it in the same edit.
2. The autonomous fork's `<scripts_dir>` cell (*"The commit / push / watcher scripts named by path here …"*) lists the kinds of script that file names. Task 10 adds a `<scripts_dir>/flow-walker.sh` path to the file, so the cell could name the walker too.
3. `task_15_plan.md`'s second Verification bullet runs `flow-walker.sh start` in this checkout and overwrites `harness-runs/.flow_walker_state`. It is harmless, but the step could run in a scratch worktree.
