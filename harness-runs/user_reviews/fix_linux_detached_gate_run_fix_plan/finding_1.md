### 1. The gate launcher accepts the main checkout as its target in local mode

**Severity:** Must Fix (user observation 1)

**File:** `cli/templates/scripts/launch-sandboxed-gates.sh`, at check 6, `hr_wrapper_target_check_var "$main" "$target" || refuse "$HR_TARGET_REFUSAL"`, and at check 8, `if [ "$HR_TARGET_KIND" = main ]; then`. Also:

- `cli/templates/scripts/lib/harness-run-lib.sh`, beside `hr_registry_live_count()` and `hr_registry_peek()`;
- `cli/test/launch-sandboxed-gates.test.mjs`, after the case `'(k) a registered clone takes its protected paths from the per-run profile, and refuses without one'`;
- `docs/cli.md`, §6, residual 13, *"On a bubblewrap host the gate run is sandboxed by the launcher, not by Claude Code."*, and the §6 sentence *"so it checks its target exactly as the wrappers do (the next paragraph)"*;
- the root copies `scripts/launch-sandboxed-gates.sh` and `scripts/lib/harness-run-lib.sh`, which are byte-identical to their templates today (`cmp` is silent).

**The problem, verified.** `hr_wrapper_target_check_var` (`lib/harness-run-lib.sh`) accepts a target equal to the main checkout outright: `if [ "$target" = "$main" ]; then … HR_TARGET_KIND=main; return 0`. The launcher's check 8 then treats `HR_TARGET_KIND=main` as job mode. It takes the base profile as "the session's own profile" (`profile="$base"`), and `lsg_bwrap_args_var` adds `--bind "$target" "$target"` with `<target>` set to the main checkout. That gives a local-mode session real write access to the main checkout through the worker, because the call:

- comes from a run copy, which the profile allows as `bash <MAIN_REPO>/<scripts_dir>/launch-sandboxed-gates.sh:*` with any argument;
- names `<MAIN_REPO>` itself as `<target>`.

The main checkout holds the outer-loop scripts, `lib/`, the base profile, `harness.config.json` and the run registry. Only exact `denyWrite` entries of the base profile under it are re-bound read-only, and the base profile states the main checkout's protected surface through `<repoRoot>`-rooted entries. Everything else under the main checkout that the base does not name is writable by session-written gate code. Nothing that the argument shape or the environment decides can tell local mode from job mode.

**What job mode writes to the registry (checked first, as the user asked).** The registry can tell the two modes apart, so no job-mode marker is needed:

- **Job mode.** `cli/templates/scripts/autonomous-watcher.sh` → `run_job` sets `local worktree="$MAIN_REPO"`, calls `registry_init`, and then writes `registry_set "$branch" worktree "$worktree"` and `registry_set "$branch" status running` before `spawn_engine`. The registry is the job checkout's own: `<checkout>/<stateDir>/autonomous_logs/registry.json`, where the checkout is the main checkout. Its only record is this job's, whose `worktree` is the main checkout.
- **Local mode.** `launch_run` writes `registry_set "$branch" worktree "$worktree"`, with the run copy's path, and `status running` for the calling session's own run. The registry is `<MAIN_REPO>/<stateDir>/autonomous_logs/registry.json`.
- **In both modes the registry is protected.** The base profile write-protects it by exact path (`docs/cli.md` §6, *"the main checkout's run registry, `<stateDir>/autonomous_logs/registry.json`, by its exact path"*; refusal of a rename onto it and of its directory is owed, rows RG1–RG3). The clone arm of the target check already trusts it the same way (`hr_clone_target_check_var`).

**Fix:**

- [ ] **1. A library reader, in `cli/templates/scripts/lib/harness-run-lib.sh`, beside `hr_registry_live_count`.** Add `hr_registry_foreign_copy_var <registry> <main>`. It sets `HR_REGISTRY_FOREIGN` and returns:
  - **0**, with `HR_REGISTRY_FOREIGN` empty, when no live record names a working copy other than `<main>`;
  - **1**, with `HR_REGISTRY_FOREIGN` set to `'<branch>' in '<worktree>'` for the first such record, when one exists;
  - **2** when the registry is present but cannot be read as one JSON object (`hr_json_single_object`), or `jq` fails.

  An absent registry holds no record, so it is 0. It reads the file without creating it, as `hr_clone_target_check_var` does, through `hr_registry_branches` and `hr_registry_get`.
  - **What counts as live.** A record is **live** when its `status` is `running`, `parked`, `park_loop` or `paused`, whatever its `pid` and its `execution`. The function's comment states why this differs from `hr_registry_live_count`'s slot rule (`running` with a `pid` answering `kill -0`): this is a trust decision, so it does not hang on a pid's liveness. A parked or paused record naming a clone is as much evidence of local mode as a running one.
  - **How a record is compared with `<main>`.** A live record "names a working copy other than `<main>`" when its `worktree` is empty, or when `hr_canonical_path_nogit` of its `worktree` is not the canonical `<main>`, or fails. The empty and unresolvable cases are fail-closed. In job mode the only record's `worktree` is the main checkout, written before its `status running`.
  - Add the function to the library header's list of registry readers.
- [ ] **2. The launcher's new check, in `cli/templates/scripts/launch-sandboxed-gates.sh`.** Directly after check 6's `hr_wrapper_target_check_var … || refuse "$HR_TARGET_REFUSAL"`, when `"$HR_TARGET_KIND" = main`:
  - Resolve the registry from the main checkout as the clone arm does: `registry="$(hr_state_path "$main" autonomous_logs/registry.json)"`, refusing when it cannot be resolved.
  - Call `hr_registry_foreign_copy_var "$registry" "$main"`. Exit 1 is a refusal: `the target '$target' is the main checkout, accepted only in job mode, and the run registry records the live run $HR_REGISTRY_FOREIGN`. Exit 2 is a refusal: `cannot read the run registry '$registry' to tell job mode from local mode`.
  - It runs before anything is started, and the supervisor's re-run of checks 1–9 includes it.
  - Update the header:
    - In `THE CHECKS`, extend item 6 with *"and, when the target is the main checkout, `hr_registry_foreign_copy_var` over the main checkout's run registry: a live record naming another working copy is a refusal (local mode); the main checkout is the target only in job mode"*.
    - In item 8, change *"the base when the target is the main checkout (job mode)"* to say that check 6 has already established job mode.
    - Add *"the main checkout as the target outside job mode, or an unreadable run registry"* to the exit-map refusal list.
- [ ] **3. Fixtures, in `cli/test/launch-sandboxed-gates.test.mjs`.** Every path sits under the fixture and the case's `mkdtemp` root, with no real home path. Add two cases:
  - **Local-mode refusal.** Write `<f.dir>/sdlc-harness/autonomous_logs/registry.json` with a record for `BRANCH`, `status` `running`, whose `worktree` is a directory under `f.root` (the run copy). Launch `[f.dir, LABEL]`. Assert `assertRefusal(r, 'accepted only in job mode')`, that the `bwrap` stub recorded nothing (`f.record` absent), and that no lane file was written. Repeat with `status` `parked`, which is refused too.
  - **Job-mode acceptance.** Write the registry as `run_job` leaves it: one record for `BRANCH`, with `worktree` equal to `f.dir` and `status` `running`. Add a second record with `status` `completed` naming a directory under `f.root`, which is not live and does not refuse. Launch `[f.dir, LABEL]`. Assert `pending`, exit 3, and the vector equal to `expectedVector(f, f.dir, join(f.dir, BASE_PROFILE))`.
  - Add a third assertion in either case: a registry holding `not json` is refused with `cannot read the run registry`.
  - Cases (a)–(j), (l) and (m) launch against `f.dir` with no registry, which holds no live record, so they still pass unchanged. Run only this test file to confirm.
- [ ] **4. Docs, in `docs/cli.md`.**
  - **Residual 13.** Add a bullet under **What that sandbox holds**: *"the main checkout as `--bind`'s target only in job mode: the launcher reads the main checkout's run registry, which the profile write-protects by exact path (RG1–RG3 owed), and refuses a main-checkout target while any live record (`running`, `parked`, `park_loop`, `paused`) names another working copy, as the calling session's own record does in local mode (derived from the code, `hr_registry_foreign_copy_var`)"*.
  - **§6.** In the sentence *"so it checks its target exactly as the wrappers do (the next paragraph)"*, add *"and, beyond them, refuses the main checkout as its target outside job mode (residual 13)"*.
- [ ] **5. Root copies.** Apply the same edits to `scripts/launch-sandboxed-gates.sh` and `scripts/lib/harness-run-lib.sh`, and confirm `cmp` is silent against both templates. `cp` may be refused in this session. If it is, edit both copies by hand.
  - **Deviations from plan:** (cli-layer dispatch) Sub-step 1 asked the reader to go "through `hr_registry_branches` and `hr_registry_get`" while also reading "without creating it". Both call `hr_registry_init`, which creates the file, and both swallow a `jq` failure, so exit 2 ("`jq` fails") could not be detected through them. Implemented as one guarded `jq` call over the file, as `hr_clone_target_check_var` does: absent file → 0; present but not a readable regular file holding one JSON object (`hr_json_single_object`), `.runs` not an object, a record not an object, or `jq` failing → 2. A `<main>` with no canonical form also returns 2.
  - **Deviations from plan:** (cli-layer dispatch) The library has no explicit list of registry readers. The function was added to the header sentence "It also implements the run registry's reads and writes", which now names the readers `hr_registry_get`, `hr_registry_branches`, `hr_registry_live_count`, `hr_registry_peek` and `hr_registry_foreign_copy_var`.
  - **Deviations from plan:** (cli-layer dispatch) The new fixtures are cases `(p)` (local-mode refusal, plus the `not json` refusal) and `(q)` (job-mode acceptance), placed after case `(k)`. Case `(q)` also collects the run with `--wait` so teardown does not race the supervisor.
  - Sub-steps 4 (`docs/cli.md`) and 5 (root `scripts/` copies) lie outside this dispatch's path `cli`. They are left for the `general` layer dispatch of this unit.
  - **Deviations from plan:** (general-layer dispatch) Sub-steps 4 and 5 implemented. In sub-step 4 the residual-13 bullet sits second under **What that sandbox holds**, right after the `--bind <target> <target>` bullet it qualifies. In sub-step 5 `cp` was refused (don't-ask mode), so both root copies were edited by hand from the template diff. `cmp` against both templates is now silent.
