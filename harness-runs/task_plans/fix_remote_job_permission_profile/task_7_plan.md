### Task 7 — Pass the profile's `additionalDirectories` as `--add-dir` at a job-mode launch

**Goal:** In job mode only, make the watcher's `spawn_engine` pass every entry of the permission profile's `permissions.additionalDirectories` as an `--add-dir` on the engine launch line, beside the two it already passes, so the plugin roots `init --plugin-root-entries` wrote there reach the session as launch flags as well as through the `--settings` file (task prompt → `## What is wrong`, findings 1 and 5; candidate approach *"have job mode pass `--add-dir <plugin root>` to the launch"*).

**Depends on:** Task 3, which makes `init --plugin-root-entries` append every resolved plugin root, normalized and de-duplicated, to the generated profile's `permissions.additionalDirectories`, after the template's own state-directory entry. This task reads the **file** Task 3 writes — `.permissions.additionalDirectories[]` of `$SETTINGS_PROFILE` — and calls no CLI code: the watcher is a shell template and never imports from `cli/src` (`.claude/context/cli.md` → `## Dependencies, and which way they point`).

**Why the launch flag as well as the profile entry.** Run 3 put a `Read` rule and an `additionalDirectories` entry for the plugin cache into the committed `.claude/settings.json`; the session confirmed both were in the file and was refused a `Read` and a `head` there anyway, and nothing established why. An `--add-dir` on the command line is the one grant that does not depend on how a settings file is merged, which is the same reasoning the watcher already records for the state directory (`spawn_engine` → *"this mirrors the profile's additionalDirectories entry (belt and braces if the two ever diverge)"*). Reading the entries out of the profile, rather than resolving the plugin root in shell, keeps one producer of the directory list — `init` — and needs no second copy of the plugin-record navigation `cli/src/machine/plugins.ts` owns.

**The launch contract after this task — restated by Task 9 in `ARCHITECTURE.md` and Task 8 in `docs/remote-execution.md`.** Outside job mode the launch line is **byte-identical** to today's: `--add-dir <worktree>` then `--add-dir <main checkout's state dir>`. In job mode (`JOB_MODE=1`) those two come first, unchanged, followed by one `--add-dir <dir>` per `permissions.additionalDirectories` entry of `$SETTINGS_PROFILE`, in file order, skipping an entry equal to either of the first two and any empty string. A profile that is absent, unparseable or carries no such key adds nothing and never blocks the launch — `doctor --remote-job` (Tasks 4–6) is what refuses an unusable profile, before this step is reached.

**Where this task stops.** It changes `spawn_engine` and the header block documenting its flag string. It does not change the profile (Task 3), the job's preflight (Task 6), or the local launch in any way.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`, and the header block above it that writes the flag string out in full (*"The flag string, in full:"*).
- `cli/test/watcher-remote-job.test.mjs` — the launch-line assertions.

**Work:**

- [ ] `autonomous-watcher.sh` → `spawn_engine`: when `JOB_MODE` is `1`, build an array of extra directories from `jq -r '.permissions.additionalDirectories[]? // empty'` over `$SETTINGS_PROFILE`, reading it line by line into the array with no pipeline into the loop and no `mapfile` (the bash 3.2 floor, `.claude/context/conventions.md` → `## The stack…`), filtering per the contract above; append them to the launch as `--add-dir` pairs using the `${arr[@]+"${arr[@]}"}` form the function already uses for `model_args`, so an empty array is safe under `set -u`. Log one line naming the directories added when there are any.
- [ ] `autonomous-watcher.sh`: update the header's full flag string and the comment above the `"$AGENT_CLI"` call (*"`--add-dir "$worktree"` is NOT redundant with the profile"*) to state the job-mode extras and why they exist.
- [ ] `cli/test/watcher-remote-job.test.mjs`: keep the existing `deepEqual(addDirs, [j.dir, join(j.dir, STATE_DIR)])` assertion passing for a fixture profile whose only `additionalDirectories` entry is the state directory (the de-duplication case). Add a case that writes an extra directory into the fixture profile's `permissions.additionalDirectories` before the job runs and asserts the recorded argv carries it as one more `--add-dir`, after the first two, exactly once; and one with a profile lacking the key, asserting the job still launches with the two. Extend the file header's rule if it enumerates what job mode passes.

**Verification:**

- The new and edited cases in `cli/test/watcher-remote-job.test.mjs` pass.
- `commands.typecheck` passes (the watcher is outside the compiler; this confirms nothing else moved).
- Reading `spawn_engine`, every added line sits under the `JOB_MODE` test, so a local launch cannot change — and the change adds no `mapfile` and no `set -e`.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` exits 0.

**Deviations from plan:**

- The `cli/test/watcher-remote-job.test.mjs` cases were not executed by the implementer: `.claude/context/conventions.md` → `## The testing bar` states no single-file test command, so per `unit_loop_core.md` → `## The test-run rule` the run is deferred to the Run gates phase. The pass claim rests on reading only. Untested assumption carried by the de-duplication case: the profile's `{{stateDirAbs}}` (`join(repoRoot, stateDir)` in `permissionProfile.ts`) is the same string as the watcher's `hr_state_path "$MAIN_REPO"`, modulo a trailing slash, which the comparison strips.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` was refused by the permission layer (approval required) and not run; the syntax claim rests on reading the edit. Deferred to the Run gates phase.
- The file header of `watcher-remote-job.test.mjs` does not enumerate what job mode passes, so it was left unchanged.
