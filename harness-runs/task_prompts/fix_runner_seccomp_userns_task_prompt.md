`fix_runner_seccomp_userns` makes a session's sandboxed Bash calls run again on GitHub-hosted runners. In the Gate 12 sandbox series round (#170 step 4, round 13, 2026-11-05), every sandboxed Bash call on `ubuntu-latest`, now Ubuntu 26.04, failed before it ran. That covered the sandbox probe's sessions and the harness job's own session alike, so an unattended remote run could run no shell command at all.

**The cause is established, and so is a fix that works.** A supervised session took the measurements on 2026-11-05 (below). This branch implements the fix. It needs no web research and no runner access. Confirming it on a runner is the Gate 12 redo's job, after the next release.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `cli/templates/github/workflows/harness-run.yml` → `Install the sandbox prerequisites`: its early `The sandbox prerequisites are present.` exit, its `needs_profile` test, the `/etc/apparmor.d/bwrap` profile it writes, its `systemctl reload apparmor` and its `::warning::` arms. Then `Preflight with doctor` and the steps after it that check `HARNESS_STOPPED`.
- `scripts/sandbox-probe-runner.yml` → its own copy of `Install the sandbox prerequisites`, and the probe's `runner-install` legs (IS1–IS4).
- `cli/src/doctor/sandboxPrerequisites.ts`: `judgeAppArmor`, `AppArmorAnswer`, `describeAppArmor`, `bwrapAppArmorProfile` and the header comment on what `/etc/apparmor.d/bwrap` does and does not prove. Then the `sandbox-prerequisites` check in `cli/src/doctor/checks.ts`.
- `cli/test/workflow-sandbox-install.test.mjs` and `cli/test/sandbox-probe-runner-workflow.test.mjs`, and the doctor tests that cover `sandbox-prerequisites`.
- `docs/sandbox-verification.md` §9, *The GitHub-hosted runner legs*; `docs/remote-execution.md`, where it describes the install step; `docs/cli.md`, where it describes the doctor check.

## What was measured

### The failure (round 13)

- **Probe** run `41980588326`. Stamps: `claude 2.1.318`, `ubuntu26` `20261026.180.1`, kernel `7.0.0-1017-azure`, `bubblewrap 0.11.1`, `kernel.apparmor_restrict_unprivileged_userns: 1`. IS1–IS4 pass, `doctor --remote-job` reports `PASS sandbox-prerequisites`, and then every sandboxed command answers:

  ```
  apply-seccomp: write /proc/self/setgroups (nested userns is capability-restricted; caller must provide CAP_SYS_ADMIN): Permission denied
  ```

  Result: 11 pass, 3 fail, 33 not run.
- **Harness job**, resumed run `41981613528` (`ubuntu-26.04` `20261101.186.1`): its session stopped after 8 turns, because "Every Bash call fails the same way, including the bare command `true`".

### The diagnosis (throwaway workflow on `firu-daniel/harness-gate12`, branch `diag_seccomp_userns`, runs `41985478942`, `41985774282`, `41985915463`)

`srt` is the CLI of `@anthropic-ai/sandbox-runtime@0.0.81`, the runtime Claude Code's sandbox uses, which runs a command sandboxed without any Claude credential. It carries `vendor/seccomp/<arch>/apply-seccomp`. Its `dist/sandbox/linux-sandbox-utils.js` says "apply-seccomp obtains CAP_SYS_ADMIN for its nested PID+mount unshare by creating a nested user namespace", and its README notes that on Ubuntu 24.04+ "both bubblewrap and the seccomp isolation layer need capability-bearing user namespaces".

1. **Ubuntu 26.04 ships and loads `/etc/apparmor.d/bwrap-userns-restrict`; 24.04 does not.** Read on the runner (abi 5.0, AppArmor parser 5.0.2):

   ```
   profile bwrap /usr/bin/bwrap flags=(attach_disconnected,mediate_deleted) {
     allow capability, … allow userns, …
     allow pix /** -> &bwrap//&unpriv_bwrap,
     include if exists <local/bwrap-userns-restrict>
   }
   profile unpriv_bwrap flags=(attach_disconnected,mediate_deleted) {
     … allow userns, …
     allow pix /** -> &unpriv_bwrap,
     audit deny capability,
     include if exists <local/unpriv_bwrap>
   }
   ```

   Every program bwrap executes runs stacked under `unpriv_bwrap`, which denies every capability. So a user namespace created inside bwrap has none, and that is the setgroups refusal. `audit deny capability` cannot be overridden by an `allow` in `local/unpriv_bwrap`, because in AppArmor a deny wins.
2. **The install step's own profile is also named `bwrap`, for the same path, and the stock one wins.** After the step's `tee` and `systemctl reload apparmor`, bwrap's child read `bwrap//&unpriv_bwrap (enforce)` from `/proc/self/attr/current`. A nested `bwrap --unshare-user --dev-bind / / -- unshare -U -r true` failed (`unshare: write failed /proc/self/uid_map: Operation not permitted`). That held on 18 of 18 reloads across three runners. Round 2 once read `bwrap (unconfined)` on the same image; that is not explained, and the fix below does not depend on it.
3. **The sysctl is not the cause.** With `sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` and the stock profile still loaded, the nested `unshare -U -r` inside bwrap still failed on 26.04. On 24.04 it passed with the sysctl at 1, because only our profile exists there.
4. **It is the image, not Claude Code.** `srt` with no Claude involved shows the same 24.04/26.04 split.
5. **The fix, 9 of 9** (three 26.04 runners on builds `20261026.180.1` and `20261101.186.1`, three reloads each):

   ```
   sudo mkdir -p /etc/apparmor.d/disable
   sudo ln -sf /etc/apparmor.d/bwrap-userns-restrict /etc/apparmor.d/disable/bwrap-userns-restrict
   sudo apparmor_parser -R /etc/apparmor.d/bwrap-userns-restrict
   sudo apparmor_parser -r /etc/apparmor.d/bwrap        # the profile the step already writes
   ```

   Afterwards, through further `systemctl reload apparmor` calls, bwrap's child read `bwrap (unconfined)` and the nested `unshare -U -r` exited 0. `srt -c 'echo ok'` ran, and the sandbox still held:
   - inside `srt`, `unshare -U -r true` → `unshare: unshare failed: Operation not permitted`;
   - with `denyWrite: [<dir>/protected]`, `touch <dir>/protected/x` → `Read-only file system`, while an allowed write landed;
   - `curl https://example.com` → `CONNECT tunnel failed, response 403`.
6. **`doctor` cannot see it.** `sandbox-prerequisites` judges from files (`judgeAppArmor`). It reported `PASS` on the runner where nothing could run.

## What this branch does

1. **The install step makes the profile deterministic, and then verifies it.** Do this in the template and in `scripts/sandbox-probe-runner.yml`, keeping them in step.
   - When `/etc/apparmor.d/bwrap-userns-restrict` exists, run the four commands above, with root or passwordless sudo, as the step already requires. Load our profile with `apparmor_parser -r` instead of relying on `systemctl reload apparmor`. Write our profile whenever the stock one was found, not only when the sysctl reads 1 and no `bwrap` file grants `userns`.
   - Then, on Linux, **always** verify, whatever earlier branch the step took, including the `The sandbox prerequisites are present.` path: run `bwrap --unshare-user --dev-bind / / -- unshare -U -r true`.
   - On failure, print an `::error::` that quotes bwrap's child's `/proc/self/attr/current` and the command's stderr, and fail the step. The job must stop before `Run the harness`, so that a session that cannot run Bash is never started and never reported on. Check how the later steps' `if:` conditions treat a failed step, so that `Save the state bundle`, `Push the branch` and `collect` still behave as they should for a job that never launched.
   - Print one plain line on success naming what the step did: stock profile disabled or not, our profile loaded, and the verification passed.
2. **`doctor`'s `sandbox-prerequisites` check becomes behavioural on Linux.**
   - When `bwrap` and `unshare` resolve, run the same nested probe, through the existing injectable host-facts seam, so tests need no real bwrap.
   - **FAIL** when it fails. Name `bwrap-userns-restrict` when that file exists, and give the four commands as the remedy. On a local machine `doctor` only reports and never changes the system: say that disabling Ubuntu's restriction weakens a desktop's hardening, and that the trade-off is the user's.
   - Keep the file-based reading as context in the message, not as the verdict.
   - Correct the header comment and `describeAppArmor` where they say a profile in `/etc/apparmor.d/bwrap` is what is needed.
   - `doctor --remote-job` therefore fails on a runner where the sandbox cannot run a command.
3. **Tests.**
   - The rendered step carries the disable, unload and load sequence, the verification and the failing `::error::` arm, and the probe runner's copy matches the template's. Extend `workflow-sandbox-install.test.mjs` and `sandbox-probe-runner-workflow.test.mjs`.
   - Doctor's verdict for each of: probe passes, probe fails with the stock file present, probe fails without it, and no bwrap.
4. **Docs.**
   - `docs/sandbox-verification.md` §9: the cause, with the run ids and readings above, and the fix, with the runner result owed to the Gate 12 redo. **No measured result is invented.**
   - `docs/remote-execution.md` and `docs/cli.md`: describe the step and the check as they now behave, including the hardening trade-off on a local Ubuntu 26.04 machine.

## The goal

1. On `ubuntu-24.04` and `ubuntu-26.04` alike, the rendered job's install step leaves bwrap's children able to create a capability-bearing user namespace, or fails the job before any session starts.
2. `doctor` fails, on a runner or a local Linux machine, wherever a nested user namespace inside bwrap cannot be created.
3. The sandbox's own refusals are untouched: the sandboxed command's user-namespace, write and network refusals.

## Constraints

- No `allowNestedUserNamespaces`, no `enableWeakerNestedSandbox`, no `sandbox.enabled: false`, no new `excludedCommands` entry, and no sysctl change, since it does not fix 26.04. A fix that needs one of them parks with the reason.
- `doctor` never changes a local system.
- The Linux local container route (Gate 15) and macOS keep their verdicts.
- Bash 3.2 floor for any script; `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
