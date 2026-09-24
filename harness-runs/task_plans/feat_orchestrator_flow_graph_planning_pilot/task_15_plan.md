### Task 15 — Mirror the walker into this checkout's `scripts/` and ignore its state

**Goal:** This repository has adopted its own harness, so its `scripts/` holds the outer-loop scripts `init` would write, and its root `.gitignore` holds `init`'s managed block (`.claude/context/conventions.md` → `## Documents of record`). Give this checkout the walker, its gate library, the planning graph and the phase reader the walker sources, as byte copies of their templates, the way `scripts/commit-on-branch.sh` mirrors `cli/templates/scripts/commit-on-branch.sh`. Add the walker's state file to the managed block. A planning run in this repository can then call `bash scripts/flow-walker.sh …` as the rewritten core instructs.

**Depends on:** Task 5, which ships these rows through `init`:

- `flow-walker.sh`: `0o755`;
- `lib/flow-walker-gates.sh`: `0o644`;
- `flows/task_plan_writing.graph.json`: `0o644`.

Task 5 also adds `.flow_walker_state` to `RUN_CONTROL_ARTIFACTS`, so the managed block `init` generates carries `<stateDir>/.flow_walker_state` right after `<stateDir>/.dispatch_counter`. The walker sources `lib/harness-run-lib.sh` and calls `hr_phase_enabled`, which Task 2 added to the template library.

**Where this task stops.** These are copies. The source of truth is `cli/templates/scripts/`, so a later fix lands in the template first and is re-copied. This checkout's `.claude/` is not a target: nothing here edits a path under it, and no `settings.autonomous.json` exists in this checkout to regenerate. The run's unattended access to the walker comes from the script-allowlist guard, which auto-allows a `.sh` under `scriptsDir` that is not on its deny list.

### Targets

- `scripts/flow-walker.sh` (new)
- `scripts/lib/flow-walker-gates.sh` (new)
- `scripts/flows/task_plan_writing.graph.json` (new)
- `scripts/lib/harness-run-lib.sh`: refreshed to its template's bytes
- `.gitignore`: one line in the managed block

**Work:**

- [ ] Copy `cli/templates/scripts/flow-walker.sh`, `cli/templates/scripts/lib/flow-walker-gates.sh` and `cli/templates/scripts/flows/task_plan_writing.graph.json` byte-for-byte to the same relative paths under `scripts/`, with modes `0o755` / `0o644` / `0o644`. Use the `Write` tool, or `cp` with an explicit source and destination, and no redirect.
- [ ] Replace `scripts/lib/harness-run-lib.sh` with `cli/templates/scripts/lib/harness-run-lib.sh`'s bytes. The mirror already trails its template: `diff` shows the template's `hr_cache_dir` and its header lines absent here. The walker needs Task 2's `hr_phase_enabled`, and a whole-file copy is the verbatim contract, whereas a hand-merged function would be a fourth variant. Say so in the commit description.
- [ ] Add `harness-runs/.flow_walker_state` to `.gitignore`, directly after `harness-runs/.dispatch_counter`, inside `init`'s managed block. It goes inside the block so `scripts/publish-main.sh`, which cuts that block, removes it with the rest.

**Verification:**

- `cmp cli/templates/scripts/flow-walker.sh scripts/flow-walker.sh` exits 0, and so does the same `cmp` for `lib/flow-walker-gates.sh`, `flows/task_plan_writing.graph.json` and `lib/harness-run-lib.sh`. `ls -l` shows `scripts/flow-walker.sh` executable and the other three not.
- From this checkout's root, `bash scripts/flow-walker.sh start --flow task_plan_writing --branch feat_orchestrator_flow_graph_planning_pilot --skipped none` prints `action: dispatch` naming `task-plan-writer`. Afterwards, `git status --porcelain` does **not** list `harness-runs/.flow_walker_state`: it is ignored, and it is machine-local, so it stays where it is.
- `bash scripts/run-gates.sh` shows no new failure. Gate 6a (*no machine paths*) stays as it was, because the copies carry no absolute path.
