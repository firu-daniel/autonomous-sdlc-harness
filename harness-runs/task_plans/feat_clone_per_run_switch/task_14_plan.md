### Task 14 — Prove the per-run profile, its launch check and its three mirrors in a new `cli/test/watcher-run-profile.test.mjs`

**Goal:** Lock in Task 13. The suite proves four things:
- every launch passes a per-run copy of the profile carrying the run's own exact entries, at the lane-directory path;
- the launch check refuses every shape it must refuse, and accepts the opt-out `init` renders;
- the run's exit syncs a clone into the main checkout;
- the watcher's mirrors — the three named in the title, with the sandbox clause's strict values and opt-out shape counted under the opt-out mirror — equal their TypeScript owners.

**Depends on:** Task 13, for these functions in `autonomous-watcher.sh`:
- **`run_profile_entries <copy> <kind>`:**
  - the copy-surface paths as `entry`;
  - on a clone, the six `COPY_GIT_PATHS` rows with their kinds;
  - on a legacy worktree, `<copy>/.git`;
  - always, every other linked worktree's `.git` pointer.
- **`run_profile_render`:** writes the path Task 1's `hr_run_profile_file <repo slug> <branch>` prints (`<lane dir>/run-profiles/<slug>/<sanitized branch>.json`), and turns each entry into the `Edit` / `Write` rules of its mirror of `fileToolDenyRules`.
- **`run_profile_check`:** refuses a non-object, a sandbox whose `enabled` / `failIfUnavailable` / `allowUnsandboxedCommands` differ from `shippedSandboxSettings()` when no opt-out marker line is present, or differ from `applySandbox`'s opt-out shape (`false`, `false`, `false`) when one is, a delta that is not only appended strings, and a non-string entry.
- **`spawn_engine`:** on a refusal, logs `not launching '<branch>': <reason>`, and the record goes to `failed`.
- **`classify_run_exit`:** syncs a clone in.

It also depends on **Task 5**'s exports, `COPY_GIT_PATHS` and the already-exported `fileToolDenyRules` from `cli/src/generators/writeProtection.ts`, and `SANDBOX_OPT_OUT_MARKER` and the already-exported `shippedSandboxSettings` from `cli/src/generators/sandboxProfile.ts`, which this suite imports from `cli/dist`, and on **Task 1**'s `hr_run_profile_file`, which it calls by sourcing `cli/templates/scripts/lib/harness-run-lib.sh` with the fixture's environment.

### Targets

- `cli/test/watcher-run-profile.test.mjs` (new)
- `cli/test/helpers/watcher.mjs` (only if a fixture needs a seam it lacks; no other task edits it)

**Work:**

- [x] Build fixtures through `cli/test/helpers/watcher.mjs` (a real `init`, the recorder notifier, the stub agent CLI), with `XDG_STATE_HOME` inside the fixture, as the helper already sets it. If a case needs the stub to record its `--settings` argument and the helper's stub cannot, add that seam to the helper here, and only here. Open the file with the rule: *a session is launched only on a per-run copy that equals the base profile plus that run's exact entries, with the sandbox on and strict or the named opt-out taken*.
- [x] **Launch cases.**
  - **A task drop → a clone:** the stub's `--settings` argument equals what `hr_run_profile_file` prints for the fixture's slug and branch, under the fixture's `XDG_STATE_HOME`. `jq` shows the base's arrays plus the clone's six `.git` paths, its surface paths re-rooted, and both `Edit` and `Write` rules for each. `_README` and every other key equal the base's.
  - **A parked legacy worktree run, resumed:** its pointer `<wt>/.git` is in the file and no `COPY_GIT_PATHS` entry is.
  - **A second live linked worktree in the fixture:** its pointer appears in the clone run's file.
- [x] **Refusal cases.** Each asserts the `not launching` log line, the record `failed`, a `failed` notification, and no stub call:
  - the base's `sandbox.enabled` set to `false` with no marker;
  - `failIfUnavailable` set to `false`;
  - an empty base file;
  - a base that is two JSON documents;
  - a per-run file tampered between render and check, through a seam or by calling `run_profile_check` directly on a crafted file with one extra key changed or one non-string entry appended. This is the automated twin of Task 23's invalid-profile row.

  Add the perturbation: the opt-out profile a real `init` renders from `sandbox.optOut` — `enabled` `false` and `failIfUnavailable` `false` with the marker line, as `applySandbox` writes it — launches. Never hand-edit the profile for this case.
- [x] **The exit sync.** After the stub commits in the clone through the main checkout's `commit-on-branch.sh`, then commits once more directly in the clone from the test, the main checkout's `refs/heads/<branch>` equals the clone's once the session exits.
- [x] **The mirrors.**
  - `run_profile_entries` on a clone yields exactly `COPY_GIT_PATHS` (paths and kinds, in order) after the surface paths.
  - `run_profile_render`, driven on a minimal base profile with one entry of each kind (`file`, `directory`, `entry`), appends to `.permissions.deny` exactly the rules `fileToolDenyRules({ path, kind })` returns for each, imported from `cli/dist`.
  - The watcher's opt-out literal equals `SANDBOX_OPT_OUT_MARKER`.
  - The watcher's expected strict values for `sandbox.enabled`, `sandbox.failIfUnavailable` and `sandbox.allowUnsandboxedCommands` equal `shippedSandboxSettings()` filtered to those three paths, imported from `cli/dist`. Drive `run_profile_check` on a minimal profile carrying exactly those values (accepted), then on one with each key flipped in turn (refused). The opt-out shape is held by the Refusal cases' perturbation above, a profile `applySandbox` produced through a real `init`, not by a hand-written copy here.
  - Name every owner in the header (`writeProtection.ts` for `COPY_GIT_PATHS` and `fileToolDenyRules`; `sandboxProfile.ts` for `SANDBOX_OPT_OUT_MARKER`, `shippedSandboxSettings` and `applySandbox`'s opt-out branch), as `outer-loop-scripts.test.mjs` names the `copySurfacePaths` mirror.

**Verification:**

- `npm test --workspace cli -- test/watcher-run-profile.test.mjs` passes.
- If this task edited `cli/test/helpers/watcher.mjs`, the suite above is the run that exercises the change. `node --test` loads the helper as a file of its own, and it runs nothing at import.
- Every per-run profile the suite writes lands under the fixture's `XDG_STATE_HOME`. After the run, nothing named `run-profiles` exists under the real `$HOME/.local/state/autonomous-sdlc-harness`.
- **Deviations from plan:**
  - `cli/test/helpers/watcher.mjs` is unchanged: the stub sources its body in its own shell, so a body of `printf '%s\n' "$@"` records the `--settings` argument with no new seam.
  - The exit-sync case's second commit, "directly in the clone from the test", is made by the stub body the test writes, after its `commit-on-branch.sh` commit: `tick` returns only once the session has exited and been classified, so a commit from the test itself would land after the sync it is meant to precede.
  - The tampered-file refusal calls `run_profile_check` directly in a shell that sourced the watcher, on two files crafted from a real `run_profile_render` output: one with `permissions.allow` extended (refused as a delta), one with a number appended to `denyWrite` (refused as a non-string entry); the untampered render is asserted accepted.
  - Per-run profiles are compared by `JSON.parse` in the suite rather than by `jq`; the assertions are the plan's.
  - Each owner check was shown to bite by a throwaway mutation of `cli/templates/scripts/autonomous-watcher.sh` (`harness-runs/scratch/t14_mutate.py`, run with `bash scripts/scratch-run.sh`), reverted before the final run: the clone sync disabled in `classify_run_exit` failed the exit-sync case; the `directory` rule cut to `Edit` only failed the clone launch cases and the render mirror; `RUN_PROFILE_SANDBOX_STRICT`'s `failIfUnavailable` set `false` failed the strict-values mirror and every strict launch.
  - The real `$HOME/.local/state/autonomous-sdlc-harness` held only `repos.json` and `usage-state.json` before and after the suite runs; no `run-profiles` entry appeared.
