### Task 4 — On a bubblewrap host, omit the trio from the per-run copy, check the run copy and write the manifest at every spawn, and cap the watcher at one run

**Goal:** Wire the spawn half of the route into `cli/templates/scripts/autonomous-watcher.sh`. On a host where `hr_placeholder_host_probe_var` answers `1`, the watcher:

- renders a clone's per-run copy with no exact `denyWrite` entry for the three `.git` rows marked `omit`, keeping their `Edit` rules;
- checks a clone with `hr_run_copy_check_var` in `spawn_engine`, before the render;
- after each successful render, writes this spawn's manifest;
- runs at most one run of this repository at a time, and `status` prints the cap it enforces.

On any other host every path is exactly as today. Job mode is untouched on every host.

**Where this task stops.** This task does **not** sweep leftovers. The sweep, its call sites and the watcher's start-up recovery are **Task 11's**. Task 11 calls the sweep at each pass start, after a stall-watchdog kill, before an inbox launch and at the head of the block this task adds to `spawn_engine`, ahead of the launch check. This task leaves that block's first line free for that call. It writes no `placeholder sweep:` log line.

**Depends on:**

- **Task 1's** `COPY_GIT_PATHS[].bubblewrapDenyWrite`, in `cli/src/generators/writeProtection.ts`: `true` for `.git/config`, `.git/hooks` and `.git/objects/info/alternates`, `false` for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`. This task writes the watcher's mirror of it and the test that holds the mirror equal.
- **Task 2's** library contracts, which this task calls and does not redefine:
  - `hr_placeholder_host_probe_var` sets `HR_PLACEHOLDER_HOST` to `1` or `0` and returns 0.
  - `hr_run_profile_absent_file <slug> <branch>` prints the manifest path beside `hr_run_profile_file`'s, or returns 1.
  - `hr_placeholder_manifest_write <manifest> <path>...` records the absent arguments.
- **Task 3's** `tick` option `placeholderHost: true`, which this task's cases use to take the bubblewrap arms. The default is off.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/test/watcher-run-profile.test.mjs`
- `cli/test/watcher-placeholder-host.test.mjs` (new)

**Work:**

- [ ] The per-run render:
  - `RUN_PROFILE_COPY_GIT_PATHS` rows become `<path> <kind> <deny|omit>`, mirroring `bubblewrapDenyWrite`. Update the declared-mirror comment to say so.
  - `run_profile_entries` prints `<path>\t<kind>\t<deny|omit>`: `omit` only for a clone row marked `omit` when `HR_PLACEHOLDER_HOST` is `1`, `deny` for every other line. Update its comment. The exit map is unchanged.
  - `run_profile_render`'s `jq` appends to `.sandbox.filesystem.denyWrite` only the `deny` lines, and appends the `Edit` rules of every line, so the kind → rule map and its mirror comment are unchanged.
  - `run_profile_check` is not edited. A copy that omits an exact entry still equals the base plus appended entries, because the base carries only the glob spelling of the trio.
- [ ] `spawn_engine`, outside job mode. Call `hr_placeholder_host_probe_var` once per spawn, before the render. On a placeholder host, open one block before `run_profile_render`, whose first statement is left for Task 11's sweep call, and in it the **launch check**: on a clone (`copy_kind` `clone`), refuse through `spawn_refuse` when `RUN_MAIN` is unplaced (`$RUN_MAIN_REFUSAL`), or when `hr_run_copy_check_var "$RUN_MAIN" "$worktree"` fails (`the run copy failed its trust check before launch: $HR_RUN_REFUSAL`). This is the check that refuses a planted `commondir`, `config.worktree` or `http-alternates` before Claude Code's own startup git reads the copy.
- [ ] `spawn_engine`, after `run_profile_check` passes, on a placeholder host outside job mode. Call `hr_placeholder_manifest_write "$(hr_run_profile_absent_file …)"` with:
  - every `denyWrite` string of `$RUN_PROFILE_FILE` that carries no `*`, read with one `jq`;
  - `.mcp.json` under each `--add-dir` root this spawn passes: the run copy and the main checkout's state directory.

  A failed write is one `log` line and does not refuse the launch. Without a manifest the next sweep removes nothing.
- [ ] The cap, and what `status` prints.
  - Add one pure reader, `effective_max_parallel_runs`, which prints `1` when `hr_placeholder_host_probe_var` answers `1` and the resolved `MAX_PARALLEL_RUNS` is above `1`, and `MAX_PARALLEL_RUNS` otherwise. A value of `0` or `1` is left as it is. `MAX_PARALLEL_RUNS_DEFAULT` remains the one declaration of the shipped number.
  - Hold the result in `RUN_CAP`, initialised to `MAX_PARALLEL_RUNS` at source time and set from `effective_max_parallel_runs` at the start of each `tick`, not at source time, so that a test's override of the seam takes effect. The three `-ge "$MAX_PARALLEL_RUNS"` comparisons and their `log` lines (`resume_parked_run`, `resume_paused_run`, `process_inbox_file`) read `RUN_CAP`. When the clamp applies, log once per watcher process: `bubblewrap host: at most one live run per repository (concurrent runs share the main checkout's sandbox placeholders; docs/cli.md §6)`.
  - **What is printed is what is enforced.** `print_status` sets `RUN_CAP` the same way before printing. Its `tunables:` line prints `MAX_PARALLEL_RUNS=$RUN_CAP`. When the clamp applies, one more line, `cap: 1 (MAX_PARALLEL_RUNS=<resolved> clamped on a bubblewrap host; docs/cli.md §6)`, is printed **after** the `keep-awake:` line, never between it and `tunables:`. A `status` call made directly, not through a pass script, takes the real probe, so on a Linux CI host it prints the clamp too; `watcher-keep-awake.test.mjs` asserts that the line after `tunables:` is the `keep-awake:` line, and this placement keeps that true. `machine_footprint_report`'s own-repository `cap_note` prints `cap=$RUN_CAP (this repository's own resolved value)`. `watch_loop`'s `watcher starting (… cap=…)` line prints the same value. On a host that is not a placeholder host, every printed line is byte-identical to today's.
- [ ] Tests:
  - `watcher-run-profile.test.mjs`:
    - The mirror case holds the third column equal to `bubblewrapDenyWrite` (`true` → `deny`).
    - The `run_profile_entries` case expects the three-column lines.
    - A new case: with `placeholderHost: true`, a clone's per-run copy carries no exact `denyWrite` for the three `omit` rows, keeps their `Edit` rules, keeps the three `deny` rows, and passes `run_profile_check`.
    - The existing clone launch case, unchanged, is the assertion that a non-placeholder host's per-run copy is what it was.
    - Header bullet for `RUN_PROFILE_COPY_GIT_PATHS` updated.
  - `watcher-placeholder-host.test.mjs`, new. This task creates the file and its first cases, and **Task 11 adds its sweep cases** to the same file. Its header states the rule *on a bubblewrap host the watcher launches no clone carrying a planted trust file, records what was absent before each session, and runs, and reports, one run at a time*. Task 11 extends that header with the sweep half. All cases use `placeholderHost: true` unless noted:
    1. A planted `.git/commondir` with content in the clone refuses the resume (`failed`, the refusal naming the file).
    2. After a launch, the manifest beside the per-run profile lists exactly the per-run copy's exact `denyWrite` paths and the two `--add-dir` `.mcp.json` paths that were absent at spawn, and no path that existed.
    3. A second queued run is deferred at cap 1, with the `bubblewrap host:` line logged once.
    4. `status` reports the enforced cap. Through a pass script that sources the watcher with `status`, installs the seam answering `1`, and calls `print_status`: the `tunables:` line carries `MAX_PARALLEL_RUNS=1`, the line after it is still the `keep-awake:` line, and a `cap: 1 (MAX_PARALLEL_RUNS=5 clamped …)` line follows that.
    5. With `placeholderHost` off, on the same fixtures, no manifest is written, two runs launch, and `print_status` prints `MAX_PARALLEL_RUNS=5` and no `cap:` line.

**Verification:**

- `npm test --workspace cli -- test/watcher-run-profile.test.mjs` and `npm test --workspace cli -- test/watcher-placeholder-host.test.mjs` pass.
- `git grep -n 'hr_placeholder_' -- cli/templates/scripts/autonomous-watcher.sh` shows every call site this task adds inside `spawn_engine`, `run_profile_entries` or `effective_max_parallel_runs`, with no job-mode path reaching one.
- `git grep -n -- '-ge "\$MAX_PARALLEL_RUNS"' -- cli/templates/scripts/autonomous-watcher.sh` prints nothing: no capacity comparison is left on the unclamped value.
- The wrappers and their checks are not touched: `git diff --name-only` lists no `commit-on-branch.sh`, `push-branch.sh` or `refresh-branch.sh`.
