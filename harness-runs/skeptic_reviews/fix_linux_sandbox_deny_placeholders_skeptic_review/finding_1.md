### 1. The sandbox probe renders its per-run profile without the placeholder-host answer, so the owed Linux re-take measures the pre-change profile

**Severity:** Must Fix · **Layer:** general

**File:** `scripts/lib/sandbox-probe/session.sh` → `sp__render`, the `bash -c` body `. "$1" status >/dev/null 2>&1` followed by `if ! run_profile_render "$2" "$3" clone; then`

**Problem.** The branch's route on a bubblewrap host leaves the clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` out of `denyWrite`. That omission is decided in `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_entries`, by the line

```bash
      [ "$a" = omit ] && [ "${HR_PLACEHOLDER_HOST:-0}" = 1 ] || a=deny
```

`run_profile_entries` does not probe the host itself. It reads the global `HR_PLACEHOLDER_HOST`, and the only thing that sets that global is `hr_placeholder_host_probe_var`. In the watcher, `spawn_engine` calls that probe in its own shell just before `run_profile_render` (`# Read by run_profile_entries, and by the manifest write below.`), so the watcher's own launches are correct.

The sandbox probe does not take that path. `sp__render` is documented as *"the watcher's own render and check"*. It sources `autonomous-watcher.sh status` in a child `bash -c` and then calls `run_profile_render` directly. Sourcing with `status` never sets `HR_PLACEHOLDER_HOST` at the top level:

- The `status)` arm of the entry point runs `print_status` only.
- `print_status` reaches the probe only through `RUN_CAP="$(effective_max_parallel_runs)"`. That is a command substitution, so the `HR_PLACEHOLDER_HOST=1` it sets is lost when the subshell exits.
- Nothing else that runs at source time probes the host (`placeholder_start_recover` and `keep_awake_resolve` do not).
- `grep -rn -e hr_placeholder_host_probe_var -e HR_PLACEHOLDER_HOST scripts/sandbox-probe.sh scripts/lib/sandbox-probe scripts/sandbox-absent-path-check.sh` finds nothing.

So in Gate 15's Linux container, `${HR_PLACEHOLDER_HOST:-0}` reads `0` inside `sp__render`. Every row comes out `deny`, and the probe's per-run profile still carries the trio's `denyWrite` entries, exactly as it did before this branch.

**Why it is reachable, and what it breaks.** `sp__render` is the probe's one renderer. `session.sh` calls it for the main probe clone (`SP_RUN_PROFILE="$SP__RENDERED"`) and for every extra clone (`SP_EXTRA_PROFILE="$SP__RENDERED"`). The branch's owed Linux evidence depends on that profile:

- `docs/sandbox-verification.md` → §5 *The route's re-take (owed)*: AP1–AP5 are taken *"while `sandbox-probe.sh run --leg headless-parity` holds its clone"*. `scripts/sandbox-absent-path-check.sh` → `resolve` reads `P` as the first `run-profiles/*/*.json`, which is the profile `sp__render` wrote. With the trio still denied:
  - **AP1** (*"Sandboxed `git status` in the clone … exits 0"*) fails, with the same `fatal: failed to read <clone>/.git/commondir: Permission denied` that F9 recorded.
  - **AP2** (*"none of the three exists"*) fails.
  - Then **the decision rule** fires. It attributes the creation to *"the base profile's sibling-glob `denyWrite` entry for that path, or Claude Code's own"*. Both are wrong: the cause is the probe's own exact entry. The maintainer gets a false proposal, and a correct route looks as if it failed.
- The task prompt's *Constraints* require the blocked legs (T3, SR1, SR2, CS3, CS4, CL5, R1–R4, C2, K2, CW4, CS15, CS12) to be re-taken on Linux after the fix. Each of them runs in the probe's clone on this profile, so each fails again for the same F9 reason.
- `docs/sandbox-verification.md` §8 `CS1 (Linux)` predicts *"CS1's set, read off the profile, no longer includes them"*. Against the probe's profile that is false.

macOS is unaffected either way, because the probe answers `0` there.

**Fix.** In `scripts/lib/sandbox-probe/session.sh` → `sp__render`, make the child shell take the placeholder-host answer the way `spawn_engine` does, before it renders:

1. Replace

   ```bash
     out="$(bash -c '
       . "$1" status >/dev/null 2>&1
       if ! run_profile_render "$2" "$3" clone; then printf "%s\n" "$RUN_PROFILE_REFUSAL"; exit 1; fi
   ```

   with

   ```bash
     out="$(bash -c '
       . "$1" status >/dev/null 2>&1
       hr_placeholder_host_probe_var
       if ! run_profile_render "$2" "$3" clone; then printf "%s\n" "$RUN_PROFILE_REFUSAL"; exit 1; fi
   ```

   Leave the rest of the body unchanged. `hr_placeholder_host_probe_var` is defined once the watcher has been sourced, because the watcher sources `lib/harness-run-lib.sh`. It always returns 0 and sets `HR_PLACEHOLDER_HOST` to `0` on macOS, so macOS output does not change.

2. In `sp__render`'s header comment, replace

   ```
   # sp__render <branch> <clone> — the watcher's own render and check, in a child shell that sourced
   # `autonomous-watcher.sh status`. Sets SP__RENDERED, or SP__RENDER_REFUSAL quoting RUN_PROFILE_REFUSAL.
   ```

   with

   ```
   # sp__render <branch> <clone> — the watcher's own render and check, in a child shell that sourced
   # `autonomous-watcher.sh status` and then took the placeholder-host answer
   # (`hr_placeholder_host_probe_var`) as `spawn_engine` does before its render, so on a bubblewrap host
   # the clone's commondir, config.worktree and http-alternates are left out of denyWrite as in a real
   # launch. Sets SP__RENDERED, or SP__RENDER_REFUSAL quoting RUN_PROFILE_REFUSAL.
   ```

Do not move the probe call into `run_profile_entries`. `cli/test/watcher-run-profile.test.mjs` drives that function with `HR_PLACEHOLDER_HOST=<0|1>; run_profile_entries "$1" clone` and relies on the global it sets. A probe call inside the function would overwrite that global on a Linux CI host.

This fix edits no test file and no suite drives `sp__render`, so it runs no test of its own. The by-hand AP1–AP5 re-take in Gate 15's container verifies it.
