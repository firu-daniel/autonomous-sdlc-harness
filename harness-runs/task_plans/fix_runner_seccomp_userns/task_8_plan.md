### Task 8 — Describe the step, the check and the watcher's refusal as they now behave in `docs/cli.md`, `docs/remote-execution.md` and `docs/watcher.md`

**Goal:** The adopter-facing documents describe what Tasks 3, 4 and 5 shipped, including the hardening trade-off on a local Ubuntu 26.04 machine. That covers what the job's install step does and when it fails the job, what `doctor`'s `sandbox-prerequisites` check runs and when it fails, and when the watcher refuses a fresh local launch. An adopter can then fix a failing check from the docs alone.

**Depends on:** Tasks 3, 4, 5 and 7. The facts this task describes, restated so this file stands alone:

- **The install step (Task 3).**
  - On Linux, when `/etc/apparmor.d/bwrap-userns-restrict` exists, it runs `mkdir -p /etc/apparmor.d/disable`, `ln -sf /etc/apparmor.d/bwrap-userns-restrict /etc/apparmor.d/disable/bwrap-userns-restrict` and `apparmor_parser -R /etc/apparmor.d/bwrap-userns-restrict`, as root or through `sudo -n`.
  - It writes `/etc/apparmor.d/bwrap` whenever the stock profile was found, as well as where the sysctl is `1` and no `bwrap` file grants `userns`, and loads it with `apparmor_parser -r /etc/apparmor.d/bwrap`. It no longer runs `systemctl reload apparmor`.
  - It then always runs `bwrap --unshare-user --dev-bind / / -- unshare -U -r true`. On success it prints one line naming what it did. On failure it prints one `::error::` quoting the child's `/proc/self/attr/current` and the check's stderr, and fails the job before `Run the harness`, unless `sandbox.optOut` is taken, where it only warns.
  - A failed step leaves the `run` job's bundle-saving and reporting steps running, and the separate `collect` job, which runs under `!cancelled()` after the `run` job, as a failed preflight already did. The `run` job has started, so `remote-run.sh`'s `run_not_started_var` answers `started` and `collect` passes through its ordinary stops, never reporting the run as not started. The run's one notification is `continue`'s no-`status.json` arm: one `failed` naming the run URL, and no dispatch; `deliver` sends nothing. Do not write that the run is reported as not started.
  - On a Linux runner with nothing to install, the step prints only its present line and the check's success line.
- **`doctor` (Task 4).** On Linux and WSL2, when `bwrap` and `unshare` resolve, the check runs that same command, bounded at 10 s, with its output discarded.
  - A failure is a `FAIL` **in both modes**. It names `bwrap-userns-restrict` and the four-command remedy when that file exists, and otherwise names the profile and `sudo apparmor_parser -r /etc/apparmor.d/bwrap`.
  - Without `--remote-job`, it states that `doctor` changes nothing, and that disabling Ubuntu's restriction weakens a desktop's hardening, a trade-off that is the user's.
  - Where the check passed, an uncertain AppArmor file answer no longer warns and is printed as context.
  - Where the check did not run, the file-based grading is unchanged.
  - A taken `sandbox.optOut` still passes as not required.
- **The watcher (Task 5).** A fresh local launch on Linux or WSL2 is refused when that check fails, and the refusal points to `npx autonomous-sdlc-harness doctor`. The refusal takes the same `fail_before_launch` path a definite missing piece takes: the drop is archived as `failed_<ts>_<name>`, the record is set to `failed`, and one `failed` notification is sent. A resumed local session is not judged, and starts with Bash calls that all fail on such a host. The profile's `failIfUnavailable` does not catch this failure, because on a `bwrap-userns-restrict` host the sandbox starts.
- **The record (Task 7).** `docs/sandbox-verification.md` §9 now carries the round-13 cause and fix block, which these documents cite rather than restate.

**This is a catch-all task.** Its targets are documentation at the repository root. A command an adopter is meant to run sits in a fenced block, one command per line (lessons ledger, *Adopter-facing documentation*).

### Targets

- `docs/cli.md`: §6 (the AppArmor paragraph, its profile and load blocks, and the *"`doctor` reports all of this under `sandbox-prerequisites`"* paragraph), and §7 (the `profile-sandbox` bullet's watcher clause, the `sandbox-prerequisites` bullet and the **`--remote-job`** paragraph).
- `docs/remote-execution.md`: §4 **The permission profile.** (the preflight sentence), and §8 **The job installs them.** and **The step has not yet run on GitHub.**
- `docs/watcher.md`: §1 step 3's host-check clause, its archive sentence and its resume-and-job-mode sentence.

**Work:**

- [ ] **`docs/cli.md` §6.**
  - Rewrite the AppArmor paragraph. On Ubuntu 24.04 and later, the sysctl at `1` denies `bwrap` user namespaces unless a profile grants them. Ubuntu 26.04 also ships and loads `/etc/apparmor.d/bwrap-userns-restrict`, which confines every program `bwrap` runs and denies it every capability, so the sandbox cannot run a command there even with the documented profile in place. Cite `docs/sandbox-verification.md` §9 for the measurement.
  - Keep the profile block.
  - Replace the `sudo systemctl reload apparmor` block with `sudo apparmor_parser -r /etc/apparmor.d/bwrap`.
  - Add, for a host that has `bwrap-userns-restrict`, the four commands in their own fenced block, one per line.
  - Say plainly that on a desktop those commands weaken Ubuntu's hardening of unprivileged user namespaces, that the trade-off is the user's, and that neither `doctor` nor the watcher runs them.
- [ ] **`docs/cli.md` §6's *"`doctor` reports all of this"* paragraph, and §7.**
  - **§6:** add the nested check, its `FAIL` in both modes, the AppArmor file reading becoming context where the check ran, and the watcher's new refusal of a fresh local launch. State the resume case.
  - **§7, the `sandbox-prerequisites` bullet:** a definite missing piece is still a warning, or a failure under `--remote-job`. A failed nested check is a failure in both modes, naming its remedy and, locally, the trade-off. Replace *"it spawns nothing"* with the one bounded check it now spawns, and the `PATH` it answers for.
  - **§7, the `profile-sandbox` bullet's watcher clause:** the watcher also refuses on a failed nested check.
  - **§7, the **`--remote-job`** paragraph:** the uncertain AppArmor answer stays a warning only where the nested check did not run, and `sandbox-prerequisites` now spawns that check as well as reading local files and `PATH`.
- [ ] **`docs/remote-execution.md` §8.**
  - Rewrite **The job installs them.** to the step as Task 3 left it: install; disable the stock profile when present; write and load our profile; always verify on Linux. The step now **fails the job** on a failed verification, unless the opt-out is taken, so no session that cannot run Bash is started. `Preflight with doctor` then grades the same check.
  - Replace **The step has not yet run on GitHub.** with what is now true. It ran in Gate 12 round 13 (2026-11-05), where Ubuntu 26.04's stock profile defeated it (`sandbox-verification.md` §9). The fixed step has not yet run on GitHub, and its runner result is owed to the Gate 12 redo after the next release. Keep the existing pointers to observation (xvi) and §10 FR2.
  - Leave the self-hosted paragraph's install commands as they are. Add one sentence that a self-hosted Ubuntu 26.04 runner without non-interactive `sudo` needs the four commands from `docs/cli.md` §6 run once by its administrator.
- [ ] **`docs/remote-execution.md` §4, *The permission profile.*** Its preflight sentence gains the nested check: under `--remote-job`, `sandbox-prerequisites` also fails where `bwrap`'s child cannot create a user namespace. Name the install step as the one that already stopped the job in that case.
- [ ] **`docs/watcher.md` §1 step 3.** Three sentences change; leave the rest of step 3 as it is.
  - **The host-check clause** becomes: whether this machine can start the sandbox the run needs, judged against the table `doctor` grades as `sandbox-prerequisites`, and on Linux and WSL2 by the same nested user-namespace check (`cli.md` §6).
  - **The archive sentence** (*"a definite missing piece archives the drop as `failed_<ts>_<name>` … naming the piece and its install command"*) gains that a failed nested check archives the drop the same way, with a notification naming the check and pointing to `doctor`.
  - **The resume sentence** (*"A resume and job mode are not judged here; the profile's `failIfUnavailable` covers them"*) is restated. `failIfUnavailable` covers a missing piece only. For a failed nested check, a job is covered by its install step and `doctor --remote-job`. A resumed local session is not judged, and on such a host it starts with Bash calls that all fail (`cli.md` §6).

**Verification:**

- `grep -n "systemctl reload apparmor\|has not yet run on GitHub\|spawns nothing" docs/cli.md docs/remote-execution.md` prints no line that still describes today's behaviour. Any remaining hit must be a sentence about the round-13 step or the unfixed step, by its own words.
- Every command added to `docs/cli.md` §6 sits in a fenced block, one per line. The four remedy lines match `bwrapUsernsRestrictRemedy()` in `cli/src/doctor/sandboxPrerequisites.ts` byte for byte, and the load line matches `APPARMOR_LOAD_COMMAND`.
- Read each changed paragraph against Tasks 3–5's shipped code: the step's arms, the check's three grades, and the watcher's refusal. A sentence the code does not bear out is corrected, not kept.
- No new sentence offers `sandbox.optOut` as the fix for a failed nested check. It appears only as the existing exemption.
