### 2. The watcher's nested user-namespace check is unbounded, while the `doctor` probe it declares itself a mirror of is bounded at 10 s

**Site:** `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_probe_var`, the line `if bwrap --unshare-user --dev-bind / / -- unshare -U -r true </dev/null >/dev/null 2>&1; then`, and the comment block directly above the function (*"the nested user-namespace check `bwrap --unshare-user --dev-bind / / -- unshare -U -r true` (otherwise `not-run`)"*). The self-adopted copy is `scripts/lib/harness-run-lib.sh`, which is byte-identical on this branch.

**Problem.** The library header declares `hr_sandbox_prereq_probe_var` a mirror of `cli/src/doctor/checks.ts` → `probeSandboxHost`, *"its nested user-namespace check with that check's gate"*. The owner bounds that spawn with `NESTED_USERNS_PROBE_TIMEOUT_MS` (10 s) and reports a timeout as a failure, and `.claude/context/cli.md` → *"A **host** probe is additionally bounded"* requires that bound. The shell copy has no bound. The watcher calls it from `process_inbox_file` on every fresh local Linux and WSL2 launch. If `bwrap` hangs there (a stuck mount, an unresponsive FUSE path under `--dev-bind / /`), the whole `tick` blocks: no drop is processed, and no guard below it runs. The same library already has a pattern for this. `hr_keep_awake_hold_var` runs its host probe as `timeout 10 systemd-inhibit …` where `timeout` resolves, and runs it bare otherwise.

**Fix.**

- [ ] In `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_sandbox_prereq_probe_var`, add `rc=0` to the function's `local` line, giving `local uname_s uname_r have_bwrap=0 have_socat=0 nested="not-run" stock=0 rc=0`. Then replace the inner `if bwrap … then nested="passed" else nested="failed" fi` with:

  ```sh
        if [ "$have_bwrap" = "1" ] && command -v unshare >/dev/null 2>&1; then
          if command -v timeout >/dev/null 2>&1; then
            timeout 10 bwrap --unshare-user --dev-bind / / -- unshare -U -r true </dev/null >/dev/null 2>&1 || rc=$?
          else
            bwrap --unshare-user --dev-bind / / -- unshare -U -r true </dev/null >/dev/null 2>&1 || rc=$?
          fi
          if [ "$rc" = "0" ]; then
            nested="passed"
          else
            nested="failed"
          fi
        fi
  ```

- [ ] In the comment above that function, after *"(otherwise `not-run`)"*, add: *"bounded by `timeout 10` where `timeout` resolves, as `probeSandboxHost` bounds it with `NESTED_USERNS_PROBE_TIMEOUT_MS`, a timeout answering `failed`,"*.
- [ ] Copy the edited template byte for byte to `scripts/lib/harness-run-lib.sh`, so that `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` reports no difference.

The shell-mirror suite's stub `PATH` carries no `timeout`, so its cases take the unbounded branch. The argument vector the stub `bwrap` records is unchanged, and no test edit is needed.
