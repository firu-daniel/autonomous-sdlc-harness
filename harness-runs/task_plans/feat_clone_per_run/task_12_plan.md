### Task 12 — Write-protect the run registry by exact path on both sides, keep it out of the job surfaces, and prove `doctor` grades the entry

**Goal:** The unsandboxed target check now reads the run registry (Task 1). A sandboxed write to that registry could therefore aim unsandboxed code at a forged copy. Close it: add `<repoRoot>/<stateDir>/autonomous_logs/registry.json` to the profile's write-protected set as a `file` entry, by its exact path rather than a glob. That puts it in `sandbox.filesystem.denyWrite` and in the `Edit` and `Write` deny rules. `doctor`'s `profile-write-protection` grades the entry with no change of its own, because it reads the same `protectedPaths`.

**Depends on:** Task 1, which makes `hr_wrapper_target_check_var`'s clone arm read `hr_state_path <main> autonomous_logs/registry.json`: `<main>/<stateDir>/autonomous_logs/registry.json`, with `stateDir` taken from the main checkout's configuration. This task protects exactly that path. Its shell spelling is `autonomous-watcher.sh`'s `REGISTRY="$LOGS_DIR/registry.json"`, the definition of record.

**What the task prompt asks to confirm first, and the answer the plan found.** *"First confirm that no sandboxed process writes it."* The registry's writers are `hr_registry_set`, `hr_registry_init` and `hr_registry_lock`, called from `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/remote-run.sh`. The watcher is a daemon. `remote-run.sh` is on the script-allowlist guard's deny-by-basename set and has no permission-profile rule. Neither runs inside a session's sandbox. No file under `plugin/` writes the registry: the `branch-*` commands read it, and `remote-run.sh sync`, which they invoke, is a supervised call. The first Work bullet re-runs that check rather than trusting this paragraph.

**Where this task stops.** The adopter-facing template sentence about which targets the wrappers accept is **Task 13's**. The worked example's re-rendered profile is **Task 17's**. The owed sandbox rows proving a sandboxed `dd` and `mv` onto the file are refused are **Task 14's** to write and a human's to take.

### Targets

- `cli/src/generators/stateDir.ts` — owner of the two exported constants.
- `cli/src/doctor/checks.ts` — import them instead of its private copies.
- `cli/src/generators/writeProtection.ts` — the entry, the `jobSurfacePaths` exclusion, the header.
- `cli/test/profile.test.mjs` — one case.
- `cli/test/doctor-profile-sandbox.test.mjs` — one case.

**Work:**

- [ ] **Confirm before protecting.**
  - Run `grep -rn 'hr_registry_set\|hr_registry_init\|hr_registry_drop\|registry_set ' cli/templates/scripts` and `grep -rln 'registry.json' plugin`. Read each hit.
  - Confirm that every writer is `autonomous-watcher.sh`, `remote-run.sh`, or the library functions they call, `hr_clone_create_var` included (Task 3), and that no `plugin/` file writes the file.
  - Record the result in this task's deviation notes. Stop with a blocker if a sandboxed writer is found.
- [ ] **One owner for the path's two segments.**
  - `cli/src/doctor/checks.ts` holds the private `RUN_LOGS_DIR = 'autonomous_logs'` and `RUN_REGISTRY_FILENAME = 'registry.json'`. Move both into `cli/src/generators/stateDir.ts` as exports, with a doc comment naming `autonomous-watcher.sh`'s `REGISTRY` as the definition of record, which the `checks.ts` comment says today. Have `stateDir.ts`'s own `autonomous_logs` entry use the constant.
  - Import both in `checks.ts` and in `writeProtection.ts`. No third spelling of either string is added (`.claude/context/conventions.md` → *"Before adding a copy of anything, grep for it."*).
- [ ] **The protected entry and the job-surface exclusion.**
  - In `protectedPaths`, push `{ path: join(repoRoot, normalizeRepoDir(config.stateDir ?? DEFAULTS.stateDir), RUN_LOGS_DIR, RUN_REGISTRY_FILENAME), kind: 'file', reason: "the unsandboxed wrappers' clone trust check reads which run copy each branch has from it" }` after the `harness.config.json` entry. Use the same state-directory normalisation the function's `stateDirAbs` already uses.
  - In `jobSurfacePaths`, exclude that entry, compared at the placeholder root: a remote job neither runs nor loads the registry, and the job-surfaces check must keep its current list. `copySurfacePaths` needs nothing, because the entry is not under the worktree glob, so `hr_run_protected_rel_paths` stays its mirror unchanged.
  - Extend the module header's write-protected list and `protectedPaths`' doc comment by one clause each.
- [ ] **Tests.**
  - In `cli/test/profile.test.mjs`, add a case using the file's existing "both sides of one protected path" helper. It asserts that the rendered profile protects `<fixture>/<stateDir>/autonomous_logs/registry.json` in `denyWrite` and with both `Edit` and `Write` deny rules. Repeat it under a non-default `stateDir`, so the path follows the configuration.
  - In `cli/test/doctor-profile-sandbox.test.mjs`, under its `profile-write-protection` suite, add a case: a profile with that one `denyWrite` entry and its two rules removed makes `profile-write-protection` warn, naming the path, and fail under `--remote-job`. Follow the suite's existing removal cases.
  - Leave `doctor-job-surfaces.test.mjs` unedited. It must keep passing, which shows the exclusion held.

**Verification:**

- `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
- `npm test --workspace cli -- test/profile.test.mjs` and then `npm test --workspace cli -- test/doctor-profile-sandbox.test.mjs`, each from the repository root as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status of each. Every case passes, and `# fail 0`.
- `grep -rn "'registry.json'\|'autonomous_logs'" cli/src` finds the literals only in `cli/src/generators/stateDir.ts` and in `cli/src/generators/repoRoot.ts`'s pre-existing `LOGS_DIR`, which this task leaves alone. A hit in `cli/src/doctor/checks.ts` or `cli/src/generators/writeProtection.ts` is a second source.
