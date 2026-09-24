### Task 5 — Ship the walker and its graph through `init`: table rows, run-control ignore rule, profile entries

**Goal:** Make `npx autonomous-sdlc-harness init` write the walker, its gate library and the planning graph into an adopter's `scriptsDir`, byte for byte, and grant the walker in the generated autonomous permission profile in all three caller spellings. Also make the managed ignore block keep the walker's machine-local state file out of every commit, as it already does for `.dispatch_counter`.

**Depends on:** Task 4, which writes `cli/templates/scripts/flow-walker.sh` (executable). It sources `cli/templates/scripts/lib/flow-walker-gates.sh` (Task 3) and reads `cli/templates/scripts/flows/task_plan_writing.graph.json` (Task 1) from its own directory. It keeps its state flat at `<state_dir>/.flow_walker_state`. The three invocation forms it accepts (`start` / `next` / `current`, each `bash <scripts_dir>/flow-walker.sh …`) are what the profile entries must match as a prefix.

**Where this layer stops.** This task ships files and entries. It changes no walker behaviour, and it does not touch this checkout's own `scripts/` copies or root `.gitignore`: those are **Task 15**'s. The prose naming the walker in the cli package's READMEs and in the profile template's `_README` belongs to **Task 8**.

### Targets

- `cli/src/generators/outerLoopScripts.ts`: three rows, the `subdir` union and the `agentInvocable` doc comment.
- `cli/src/generators/repoRoot.ts`: `RUN_CONTROL_ARTIFACTS` and its doc comment.
- `cli/test/outer-loop-scripts.test.mjs`: the byte, mode and placement assertions for the three new rows.
- `cli/test/init.test.mjs`: its own `RUN_CONTROL_ARTIFACTS` list, and its hand-spelled `OUTER_LOOP_SCRIPT_FILES` exclusion list.

**Work:**

- [ ] In `OUTER_LOOP_SCRIPTS`, add three rows. `flow-walker.sh` gets mode `0o755` and `agentInvocable: true`. `flow-walker-gates.sh` gets `subdir: 'lib'`, mode `0o644` and `agentInvocable: false`: it is sourced, never run, as `harness-run-lib.sh` is. `task_plan_writing.graph.json` gets `subdir: 'flows'`, mode `0o644` and `agentInvocable: false`: it is data. Widen `OuterLoopScript.subdir` to `'lib' | 'flows'`.
  - The walker needs **no** `DENY_SCRIPT_BASENAMES` entry: it is meant to be reachable.
  - The row order keeps each library before the scripts that source it, per the table's own ordering rule.
  - Name the walker's file once as an exported constant (`FLOW_WALKER_SCRIPT_NAME`) only if a second consumer needs it. None does in this task, so a plain row literal is correct under the module header's *"a `.sh` name spelled as a string literal anywhere else in the CLI is a second source"*.
- [ ] Amend `OuterLoopScript.agentInvocable`'s doc comment, which today reads *"`true` exactly when a *dispatched agent* is the thing that runs the file"*, so it also covers **the orchestrating session**. That is who runs the walker, as the flow forks already run `commit-on-branch.sh`. The module header states the rule a reviewer holds a change to (`.claude/context/cli.md` → *A reviewer holds a change to its module's own header*). The permission profile derives its three allow forms from `agentInvocable` rows alone (`selectOuterLoopScripts`, `fromWrittenOuterLoop` in `cli/src/generators/permissionProfile.ts`). So adding the row **is** adding the profile entry, and no edit to `cli/templates/claude/settings.autonomous.json`'s `permissions` block is owed.
- [ ] Add `.flow_walker_state` to `RUN_CONTROL_ARTIFACTS` in `cli/src/generators/repoRoot.ts`, right after `.dispatch_counter`. Widen the constant's doc comment from *"stop, pause and dispatch-count control files"* to name the walker's state as well.
- [ ] Extend `cli/test/outer-loop-scripts.test.mjs`. Against a throwaway fixture wired at the default and at the relocated `scriptsDir`:
  - `scripts/flow-walker.sh` lands byte-identical to its template with mode `0o755`;
  - `scripts/lib/flow-walker-gates.sh` and `scripts/flows/task_plan_writing.graph.json` land byte-identical with `0o644`;
  - a second `init` leaves all three untouched.

  In `cli/test/init.test.mjs`, make two hand-spelled additions, each spelled out rather than imported, as each list's own doc comment requires:
  - add `'.flow_walker_state'` to `RUN_CONTROL_ARTIFACTS`;
  - add `'flow-walker.sh'` to `OUTER_LOOP_SCRIPT_FILES`. That list's doc comment reads *"The outer-loop scripts that land in the same `scriptsDir` as the wrappers and reach the profile through the same three forms — excluded everywhere below"*. The walker lands directly in `scriptsDir` with three allow entries, so without this entry `writtenWrappers(dir)` and `scriptPaths(profile, list)` count it as a wrapper, and the existing assertions `assert.deepEqual(await writtenWrappers(dir), [])`, `assert.deepEqual(scriptPaths(profile, 'allow'), [])` and `assert.deepEqual(written, ['start-dev-server.sh', 'test.sh', 'typecheck.sh'])` fail. `lib/flow-walker-gates.sh` sits in a subdirectory and the graph is not a `.sh` file, so neither enters `writtenWrappers` and neither is added.

**Verification:**

- `bash scripts/test.sh` exits 0. It runs `scripts/run-gates.sh`, whose gate 4 is `npm test`. `cli/test/profile.test.mjs`'s loop over `OUTER_LOOP_SCRIPTS` then asserts that the walker is allow-listed in exactly the three forms, and that the two `0o644` rows carry **no** entry, with no edit to that suite.
- Within that run, the wrapper-pairing cases in `cli/test/init.test.mjs` still pass unchanged: every `writtenWrappers(dir)` assertion, the `scriptPaths(profile, 'allow')` empty-list assertion and the `['start-dev-server.sh', 'test.sh', 'typecheck.sh']` wrapper-name assertion. That is the proof that `flow-walker.sh` is excluded as an outer-loop script rather than counted as a wrapper.
- In a throwaway fixture, `init` twice: the second run reports every new artifact as kept (idempotence), and `.gitignore`'s managed block carries `<stateDir>/.flow_walker_state`.
- In that fixture, `bash scripts/flow-walker.sh start --flow task_plan_writing --branch <fixture branch> --skipped none` prints `action: dispatch` for `task-plan-writer`. This exercises the shipped copy end to end: the graph resolves beside it and both libraries source.

**Deviations from plan:**
- `bash scripts/test.sh` exits 1, not 0. Gate 4 (`npm test`) passes, including `cli/test/profile.test.mjs` and every `init.test.mjs` wrapper-pairing case. The two failing gates are ones this diff does not touch. 1a: `claude plugin validate --strict` promotes six "`${CLAUDE_PLUGIN_ROOT}` without quotes" warnings on `plugin/hooks/hooks.json` to errors. 6a: the worktree's untracked `.git` pointer file and existing `harness-runs/` artifacts carry machine paths. The "exits 0" bullet therefore rests on gate 4 plus the gate log, not on a zero exit.
- The two fixture bullets were run as a scratch probe driving `cli/dist/cli.js init` twice in a temp repository. The second run reported `= kept` for all three new artifacts. `.gitignore` carried `sdlc-harness/.flow_walker_state`. The autonomous profile carried the walker in all three forms and neither `0o644` row. `flow-walker.sh start` printed `action: dispatch` / `agent: task-plan-writer`.
