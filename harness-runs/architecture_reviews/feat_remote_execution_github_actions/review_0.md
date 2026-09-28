# Architecture review — iteration 0

## Must Fix

1. **The outer-loop library gains writers inside the repository without amending the rule in its own header** — offending files: `task_3_plan.md`, `task_4_plan.md`. Rules violated: `.claude/context/cli.md` → `## What "done" means here`, *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit"*; `.claude/context/conventions.md` → `## Shell assets` (the sourced-library rule, which the library's header extends).

   `cli/templates/scripts/lib/harness-run-lib.sh` states its scope as a rule in its header. `JURISDICTION` says *"nothing here writes anything inside a repository"*, and `THE ONE EXCEPTION TO "WRITES NOTHING", AND ITS FENCE` says the machine-level lane is the only writer (*"nothing else here writes at all, so a caller that never calls an `hr_lane_*` function still gets a library that only reads"*). The plan breaks that rule twice:
   - Task 3 moves `hr_registry_init` / `hr_registry_set` into the library. Both write `<state_dir>/autonomous_logs/registry.json` inside the repository.
   - Task 4 adds `hr_remote_status_write`, `hr_remote_bundle_write` and `hr_remote_bundle_restore`. These write `remote_status.json`, rewrite `<state_dir>/clarifications/<branch>/`, restore `.flow_walker_state` and `PAUSE_PROGRESS.md`, and `mv` a superseded directory into `autonomous_logs/remote_superseded/`. They also read `GITHUB_RUN_ID` from the environment for provenance, which the header's list of environment reads does not include.

   Neither task lists the header's `JURISDICTION` or "one exception" paragraphs as a target. The header's first line, *"the one place every generated outer-loop script resolves … reads … answers … derives the anchors"*, also stops describing the file once the registry and bundle sections are added.

   **Fix:** Pick one of two routes:
   - **Amend the header in the same tasks.** Add the header's opening scope sentence, `JURISDICTION`, and `THE ONE EXCEPTION TO "WRITES NOTHING"` to the **Targets** of `task_3_plan.md`, and state in its **Work** that the registry section becomes a second named write exception, fenced to `<state_dir>/autonomous_logs/registry.json` through the `hr_registry_*` functions only. Add the same header paragraphs to the **Targets** of `task_4_plan.md`, and state that the bundle section is a third exception. Its fence is the files the bundle format lists, inside `<root>/<state_dir>/`, written only by `hr_remote_*` functions. Also add `GITHUB_RUN_ID` to the header's enumerated environment reads as a provenance value, never a configured one.
   - **Keep the library read-only.** Put the writers somewhere else, and name that location and its header in both tasks.

   Either way, the verification in each task must include a grep showing that the header's write-exception list names every section that writes.

2. **New run-registry fields and a new `pause_reason` value are named only where they are used, not in the registry's owning contract** — offending files: `task_5_plan.md`, `task_6_plan.md` (and `task_4_plan.md` for the vocabulary). Rules violated: `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`, *"a new persisted artifact joins the module that owns it rather than being named at its use site"*, and `### Where a new responsibility goes`, *"A responsibility that already has a home does not get a second one"*.

   Task 3 itself says the registry's JSON shape is *"the watcher header's contract"*. That contract is the field-set comment above `registry_init` in `cli/templates/scripts/autonomous-watcher.sh`, together with `THE REGISTRY IS A CONTRACT, NOT AN IMPLEMENTATION DETAIL.`, and Tasks 9–12 each extend it for the fields they add. Two tasks add persisted fields without adding them there:
   - Task 5's `stop` writes `remote_stopped_at`.
   - Task 6's `sync` writes `remote_run_id`, `remote_run_url` and `remote_synced_at`, and introduces the value `pause_reason: killed`.

   The `pause_reason` vocabulary in Task 4's format of record (`usage | budget | user | overload | empty`) leaves out `killed`. Task 10 documents `pause_reason` in the watcher without it. The plugin commands in Tasks 22–23 still read `killed`, `remote_run_url` and `remote_synced_at`, so a plugin contract would read a shape its owner does not declare.

   **Fix:**
   - In `task_5_plan.md`, add `cli/templates/scripts/autonomous-watcher.sh` → the registry field-set comment to **Targets**, with a Work bullet documenting `remote_stopped_at`: who writes it (`remote-run.sh stop`), and what it means.
   - In `task_6_plan.md`, add the same target with a Work bullet documenting `remote_run_id`, `remote_run_url` and `remote_synced_at`, plus the `killed` value of `pause_reason` and why a killed job maps to `paused`.
   - In `task_4_plan.md`, either add `killed` to the stated `pause_reason` vocabulary, or state that `killed` is a registry-only value that `sync` derives and never appears in `status.json`.
   - In `task_10_plan.md`, make the `pause_reason` entry it writes into the field-set comment list the full vocabulary, including `killed`.

3. **The planned `cli/src/doctor/remoteExecution.ts` cannot reuse `daemon-path`'s reader and `resolvesOnPath` without either a runtime import cycle or a second copy** — offending files: `task_18_plan.md` (and `task_19_plan.md`, which extends the same module). Rules violated: `.claude/context/cli.md` → `## Dependencies, and which way they point`, where a module imports shapes declared above it `import type` so no runtime cycle forms; `.claude/context/conventions.md` → `### Where a new responsibility goes`, *"Before adding a copy of anything, grep for it"*; `cli/src/doctor/checks.ts` → choice 1, *"Nothing here is re-derived from a second copy"*.

   Task 18 says the new module imports `type Check` and the context type-only, *"so no runtime cycle forms"*. The same task also requires that module to resolve `gh` *"the way the browser-wiring check resolves a launch command"*, and to read the installed unit's `PATH` *"reusing `daemon-path`'s reader … never a second one"*.

   All of those are private, non-exported values inside `cli/src/doctor/checks.ts`:
   - `resolvesOnPath` and `locateOnPath`.
   - The `renderUnit` → `readFileSync(unit.targetPath)` → `unitEnvValue(…, 'PATH')` sequence written inline in `DAEMON_PATH_CHECK`.
   - The `pass` / `warn` / `fail` / `unevaluated` outcome builders.

   `checks.ts` must import `REMOTE_EXECUTION_CHECK` as a value for `CHECKS`. So `remoteExecution.ts` either imports those values back from `checks.ts`, which is the runtime cycle the task says it avoids, or re-implements them, which is the second copy that choice 1 forbids. The plan does not settle which, so the implementer is left with a choice between two violations.

   **Fix:** Rewrite `task_18_plan.md` → the second bullet under the check table, and its **Targets**, to take one explicit route:
   - **(a)** Define `REMOTE_EXECUTION_CHECK` in `cli/src/doctor/checks.ts` beside the other checks. Its header opens *"`doctor`'s questions: what is asked of an adopted repository, and how each answer is graded"*, and every existing check lives there. Drop `cli/src/doctor/remoteExecution.ts` from Tasks 18, 19 and 27 (Task 27's verification grep included).
   - **(b)** Extract `locateOnPath`, `resolvesOnPath`, the outcome builders and a new exported `installedUnitPath(ctx)` reader into a new shared module, for example `cli/src/doctor/grading.ts`, with a module header. Switch `DAEMON_PATH_CHECK` to it with no change in output, and have both `checks.ts` and `remoteExecution.ts` import from it.

   Either way, the daemon-PATH row could instead be served by adding `gh` to `requiredBinaries` when `remoteExecutionApplies(config)`, so `daemon-path` itself reports it. If you take that route, say so and drop the row from the new check.

4. **`init` resolves plugin roots and builds permission entries itself, alongside the generator's existing resolver** — offending file: `task_14_plan.md`. Rules violated: `.claude/context/cli.md` → `## How a module in this layer is written`, *"Commands order and report; they decide nothing. Every value a command writes comes from detection or from a generator"*; `.claude/context/conventions.md` → `### Where a new responsibility goes`, *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it"*.

   Task 14's Work says: *"In `init`, resolve the roots only when the flag is given, hand the entries to the profile generator"*, and its Targets list `cli/src/commands/init.ts` for *"passing the entries to the generator"*. Plugin-root resolution for the profile already lives in the generator: `cli/src/generators/permissionProfile.ts` → `resolvedPluginRoots(repoRoot)` calls `pluginRuntimeRoot` / `pluginInstallRoot`, runtime root first, de-duplicated. The plan's route puts a second resolver in the command and makes the command decide the values it writes.

   The planned signature `pluginRootEntries(root: string)` also cannot reproduce `PLUGIN_PERMISSIONS_CHECK`'s output unchanged, which the task promises. That check's per-root list depends on whether `root === installRoot` (the `Read` rule is omitted for the install root) and on `phases.qa` (helper `Bash` rules only when QA is on). Neither is visible from `root` alone.

   **Fix:** In `task_14_plan.md`:
   - `init` passes only the boolean (`pluginRootEntries: flags.pluginRootEntries === true`) to `writePermissionProfile`.
   - The generator resolves the roots through its existing `resolvedPluginRoots` and appends `pluginRootEntries(…)` on the create path only.
   - `init` receives back from the generator whether any root resolved and whether the profile was kept, and reports the warning or the note.
   - `pluginRootEntries` takes the inputs the doctor builder actually depends on, for example `(root, { isInstallRoot, qaOn })` or the full roots list plus config. Name its exact signature once, so `PLUGIN_PERMISSIONS_CHECK` can call it with byte-identical output.
   - Update the Targets line for `init.ts` accordingly.

## Should Fix

- **`task_15_plan.md`: the workflow re-spells `retrievalApplies` in its own `jq`.** `cli/src/config/model.ts` → `retrievalApplies` says *"Declared once, here … Import it; do not re-spell it"*. A YAML step can't import it, so the template will need a copy. Declare that copy the way Task 1 declares `hr_execution_target` for `remoteExecutionApplies`: name the exact `jq` expression (`.phases.docs == true and .docs.retrieval == true`) in the template header as a mirror, and add the template to `retrievalApplies`' doc comment as a declared mirror. Otherwise, restore the cache unconditionally and let `init` decide, so no second spelling exists.
- **`task_26_plan.md` / `task_29_plan.md`: the named owner of the GitHub-side names doesn't hold them all.** Task 26 attributes `HARNESS_MAX_CHAIN`, `HARNESS_SELF_PAUSE_AFTER_MINUTES` and `HARNESS_STEP_TIMEOUT_MINUTES` to *"Task 2's"* names, and its verification checks every name against the schema or Task 2's constants. Task 2's export table does not carry them. Either add them to `task_2_plan.md`'s table as declared names with shell and YAML mirrors, or have Tasks 26 and 29 name `harness-run.yml`'s header as their owner and verify against it.
- **`task_2_plan.md` / `task_6_plan.md` / `task_7_plan.md`: the `harness-state` artifact name is not declared as a mirror in `remote-run.sh`.** Task 2's `STATE_ARTIFACT_NAME` lists `remote-run.sh` as a mirror, but only Task 5 (for `harness-run.yml` and `HARNESS_GH_CLI`) and Task 8 (for `harness-resume.yml`) declare their literals as named mirrors. Tasks 6 and 7 use `-n harness-state` and should declare it once in the script as a named mirror of `STATE_ARTIFACT_NAME`.

## Nice to Have

- `task_5_plan.md` → `task_21_plan.md`: between these two commits, `remote-run.sh` is in the shipped table with `agentInvocable: false` but is not yet on `DENY_SCRIPT_BASENAMES`, which `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` says must land with it. The configured layer order forces the split. One sentence in Task 5 naming the window, and that no adopter receives the script until the branch merges, would make the half-built state explicit.
