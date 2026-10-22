### Task 5 — Install the sandbox prerequisites in the `harness-run.yml` job before its preflight

**Goal:** A remote job on a GitHub-hosted Linux runner gets what the sandbox needs before the agent starts. The job installs `bubblewrap` and `socat` when they are absent. Where AppArmor restricts unprivileged user namespaces and no `bwrap` profile grants them, it writes the profile rather than refusing. Whatever it cannot install, the existing `Preflight with doctor` step then refuses, through `sandbox-prerequisites` failing under `--remote-job` (Task 2). This step is the third copy of the prerequisite list, declared in the workflow header's existing `# DECLARED MIRRORS` block.

**Depends on:** Task 1, which exports these from `cli/src/doctor/sandboxPrerequisites.ts` and already names this step, `Install the sandbox prerequisites`, in its header's DECLARED MIRRORS paragraph. The step name is a wire: spell it exactly so.

- `SANDBOX_HOST_BINARIES` = `bwrap` from package `bubblewrap`, then `socat` from package `socat`;
- `SANDBOX_INSTALLERS` = `{ family: 'Ubuntu/Debian', command: 'sudo apt-get install' }` then `{ family: 'Fedora', command: 'sudo dnf install' }`. The step mirrors its installer families and their order (`apt-get`, then `dnf`), not its byte-for-byte commands: the step's flags (`-y -qq`, `sudo -n`) legitimately differ;
- `APPARMOR_USERNS_SYSCTL_PATH` = `/proc/sys/kernel/apparmor_restrict_unprivileged_userns`;
- `BWRAP_APPARMOR_PROFILE_PATH` = `/etc/apparmor.d/bwrap`;
- `bwrapAppArmorProfile()`, the profile text granting `userns` to `/usr/bin/bwrap`;
- `APPARMOR_RELOAD_COMMAND` = `sudo systemctl reload apparmor`.

This task mirrors them. It does not grade the runner, which is Task 2's `doctor` check, run by the step after this one.

### Targets

- `cli/templates/github/workflows/harness-run.yml`: the new step, its `# DECLARED MIRRORS` entry and a header paragraph.
- `cli/test/workflow-sandbox-install.test.mjs` (new): the step pinned and run.

**Work:**

- [ ] **The step.** Add `- name: Install the sandbox prerequisites` to the `run` job, immediately before `Preflight with doctor` (after `Generate the job's permission profile`). It takes `if: env.HARNESS_STOPPED != '1'`, like its neighbours, and a `run: |` body:
  - Collect the missing binaries with `command -v bwrap` and `command -v socat`, mapped to the packages `bubblewrap` and `socat`.
  - When any is missing on `uname -s` `Linux`, pick root: no prefix when `id -u` is `0`, else `sudo -n` when `sudo -n true` succeeds, else emit `::warning::` naming the packages and skip. Hold the prefix in a bash array, `as_root=(sudo -n)`, expanded as `"${as_root[@]}"`, so shellcheck reads no unquoted expansion.
  - Then install through `apt-get` when present (`"${as_root[@]}" apt-get update -qq` and `"${as_root[@]}" apt-get install -y -qq <missing packages>`), else through `dnf` when present (`"${as_root[@]}" dnf install -y <missing packages>`), in `SANDBOX_INSTALLERS`' family order, else emit `::warning::`.
  - For AppArmor: declare `sysctl_file=/proc/sys/kernel/apparmor_restrict_unprivileged_userns` and `profile=/etc/apparmor.d/bwrap` as the first two lines of the body. When `sysctl_file` reads `1` and `profile` is absent or lacks a `userns,` line, write the profile with `"${as_root[@]}" tee "$profile" >/dev/null <<'PROFILE'` carrying exactly `bwrapAppArmorProfile()`'s text, then run `"${as_root[@]}" systemctl reload apparmor`. A failure there emits `::warning::`.
  - The step never exits non-zero on its own. The refusal is the next step's.
  - The body carries no `{{` and no GitHub expression, so the template's own two rules hold.
- [ ] **The header.** In `# DECLARED MIRRORS`, add an entry for `cli/src/doctor/sandboxPrerequisites.ts`: *SANDBOX_INSTALLERS' families in its order (apt-get, then dnf), SANDBOX_HOST_BINARIES' packages, APPARMOR_USERNS_SYSCTL_PATH, BWRAP_APPARMOR_PROFILE_PATH, bwrapAppArmorProfile() and APPARMOR_RELOAD_COMMAND, in `Install the sandbox prerequisites`*. Match the block's existing column layout. Add a paragraph, `# THE SANDBOX PREREQUISITES.`, stating three things:
  - the generated profile sets `failIfUnavailable`, so a runner without `bubblewrap`/`socat` would end its session at startup. The step installs them where the runner lets it, and writes the `bwrap` AppArmor profile where Ubuntu 24.04's policy would block user namespaces;
  - `Preflight with doctor` refuses the job on what is still missing, through `sandbox-prerequisites`, unless `sandbox.optOut` is taken;
  - the step has **not yet run on GitHub**: it runs first in a job whose workflow a CLI carrying it rendered (`docs/remote-execution.md`, section 8).
- [ ] **`cli/test/workflow-sandbox-install.test.mjs` (new).** Its header states the rule: the step installs exactly the owner's packages and writes exactly the owner's profile, before the preflight. It imports `WORKFLOW_RUN_FILE` and `WORKFLOW_TEMPLATE_DIR` from `../dist/remote/githubActions.js` and the Task 1 exports from `../dist/doctor/sandboxPrerequisites.js`. It extracts the step body the way `cli/test/workflow-plugin-pin.test.mjs` → `stepBody` does, written as a local copy, because that helper is file-local. Its cases:
  - (a) Order: the `run` job's step names place `Install the sandbox prerequisites` directly before `Preflight with doctor`.
  - (b) The `# DECLARED MIRRORS` block names `cli/src/doctor/sandboxPrerequisites.ts`.
  - (c) The body's first two lines are the `sysctl_file=` and `profile=` assignments equal to the owner's two path constants.
  - (d) A run in a stub world: rewrite those two lines to temp paths, then run the body with `bash` under a `PATH` of a stub directory only. That directory holds `uname` printing `Linux`, `id` printing `1000`, a `sudo` that accepts `-n` and runs the rest, an `apt-get` recording its arguments, a `systemctl` recording its arguments, and symlinks to the resolved `bash`, `cat`, `grep` and `tee`. With the sysctl file holding `1` and no profile, `apt-get install` receives exactly the owner's packages in table order, the profile file equals `bwrapAppArmorProfile()`, and `systemctl` receives `reload apparmor`.
  - (e) With the sysctl file holding `0` and both binaries stubbed present, nothing is installed or written.
  - (f) Installer order, derived from the owner. Compute the expected tool order from the imported `SANDBOX_INSTALLERS`: each entry's `command` with its leading `sudo ` and trailing ` install` removed, in array order; never retype `apt-get` or `dnf` in the test. Assert that the step body's first install-line occurrence of each tool appears in that order. Then, in the case (d) stub world with each tool from that derived list stubbed as a recorder, run the body with all of them present and assert only the first records an `install`; drop the first and rerun, asserting the next one in the derived order receives exactly the owner's packages in table order.
  - (g) Every case exits 0.
  - Skip, naming why, when `bash` does not resolve.

**Verification:**

- `npm test --workspace cli -- test/workflow-sandbox-install.test.mjs` passes. It is this task's own new test file.
- The rendered template still parses and passes actionlint and zizmor. `node scripts/check-rendered-workflows.mjs` is gate 14's leg, run by the Run gates round, and not by this unit.
- Read the new step back against the header's `TWO RULES EVERY EDIT KEEPS`. No input reaches the shell outside `env:`, and the step has no `{{`.
