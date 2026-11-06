### Task 1 — Make `hr_clone_target_check_var` refuse an unresolvable configuration as such, not as a missing registry record

**Goal:** On the clone arm of the target check, an `hr_state_path` lookup that fails because the main checkout's `harness.config.json` cannot be resolved gets its own refusal sentence, one that names the configuration. A registry that can be read but holds no matching record keeps today's `… and the run registry records no clone of <main> at that path` sentence unchanged.

**Where this layer's work stops.** This task changes the shared library and its library-level suite only. It does not reorder anything in the three git wrappers. **Task 2** moves each wrapper's configuration read ahead of the target check, so after Task 2 a wrapper prints its own `cannot resolve` line before it reaches this arm. This sentence is then what the callers that reach the check without having loaded the configuration first print: `launch-sandboxed-gates.sh` through `refuse "$HR_TARGET_REFUSAL"`, `setup-worktree.sh` in `--target` mode (its target check runs before `hr_config_load "$cfg_root"`), and the wrappers themselves if the configuration became unreadable between their own load and this check. `cleanup-merged-worktrees.sh` is **not** among them: it runs `hr_config_load "$main_repo"` near its top and, on failure, refuses with its own `cleanup-merged-worktrees.sh: cannot resolve '$main_repo/harness.config.json' — refusing to delete anything` line at exit 0, before `own_worktree_check` ever calls `hr_wrapper_target_check_var`, so an unresolvable configuration never reaches this arm from that script. `task-offer-check.sh` calls `hr_clone_target_check_var` directly with an empty prefix and reads only the status, so it is unaffected.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: `hr_clone_target_check_var` and its header comment (condition 1).
- `cli/test/clone-trust-check.test.mjs`: new cases for the configuration refusal, plus the header's rule sentence.

**Work:**

- [ ] `hr_clone_target_check_var`: split today's combined condition `if [ -n "$branch" ] && registry=$(hr_state_path "$main" autonomous_logs/registry.json) && [ -f "$registry" ] …`.
  - When `branch` is non-empty and `hr_state_path` returns non-zero, set `HR_TARGET_REFUSAL="$refused: its .git is not a regular pointer file, and the run registry that would record a clone of $main cannot be located, because '$main/harness.config.json' cannot be resolved"` and `return 1`.
  - Do this before the `kind` / `wt_c` comparison.
  - Every other path is byte-for-byte today's: an empty `branch` (detached or unreadable `HEAD`); a resolved registry path whose file is absent or unreadable; a `jq` read that fails on the record; a record whose `copy_kind` or `worktree` does not match. Each still yields the existing "records no clone" sentence.
  - The return status stays `1`. Do not add a status `2`: every caller treats any non-zero status as a refusal, and none would read a new one.
- [ ] Keep the function's own invariants intact. The registry is never created, every record is read once, and the sentence names the configuration path, never its contents. Call `hr_state_path` exactly once, as today, and keep it inside `$(…)` as today, so a cache the caller warmed is reused rather than a second `jq` being run (the header's one-`jq`-per-process note).
- [ ] Header of `hr_clone_target_check_var`: amend condition 1 in place, keeping the numbering, because `plugin/instructions/main_repo_resolution.md` points at "its conditions are numbered in that function's header comment". State that a registry path that cannot be derived because the configuration cannot be resolved is refused with its own sentence naming `<main>/harness.config.json`, and that only a resolvable configuration with no matching record gets the "records no clone" sentence.
- [ ] `cli/test/clone-trust-check.test.mjs`: add one case with three variants, each against the fixture's created clone, using the existing `assertRefused` and `NO_CLONE_RECORD` helpers where they fit:
  - **truncated:** the main checkout's `harness.config.json` truncated to `{"version":`;
  - **absent:** the file removed;
  - **old `jq`:** a `jq` stand-in first on `PATH` that answers `--version` with `jq-1.4` and exits 3 for any program (the shim `docs/outer-loop-verification.md` §0 describes).

  Each variant asserts all of these:
  - the refusal matches `/cannot be located, because '.*\/harness\.config\.json' cannot be resolved$/`;
  - it does **not** match `NO_CLONE_RECORD`;
  - `HR_TARGET_KIND` is empty;
  - the registry file and its lock are not created, if absent before;
  - with the configuration restored (or the shim dropped), the same clone is accepted again. This is the perturbation that attributes the refusal to the configuration.

  Extend the header's rule sentence to cover this refusal.

**Verification:**

- `cli/test/clone-trust-check.test.mjs` passes. That covers the new case and the existing cases (c), (d), (e) and (g): with a readable configuration and no matching record, they still match `NO_CLONE_RECORD`.
- In `hr_clone_target_check_var`, the new sentence is reachable only through a non-zero `hr_state_path`. A `HEAD` that names no branch never reaches it.
- `hr_clone_target_check_var` still returns only `0` or `1`.
