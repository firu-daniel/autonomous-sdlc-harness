### Task 6 — Copy the new install step into `scripts/sandbox-probe-runner.yml`, and correct IS3's write rule comment

**Goal:** Keep the Gate 12 probe workflow in step with the template. Its `Install the sandbox prerequisites` step must carry the template step's `run:` body byte for byte, so the probe measures exactly what a `harness-run.yml` job does up to its launch. The runner-install leg's IS3 comment must also stop asserting a write rule the step no longer follows.

**Depends on:** Task 3, which rewrote the body of `cli/templates/github/workflows/harness-run.yml` → `Install the sandbox prerequisites`. Its first four lines are `sysctl_file=`, `profile=`, `stock=` and `disable_dir=`. It disables `/etc/apparmor.d/bwrap-userns-restrict` when present, writes and loads `/etc/apparmor.d/bwrap` with `apparmor_parser -r`, and always runs `bwrap --unshare-user --dev-bind / / -- unshare -U -r true` on Linux. It fails with `::error::`, unless `sandbox.optOut` is taken, which it reads through `$SCRIPTS_DIR/lib/harness-run-lib.sh` → `hr_sandbox_opted_out`. Task 1 already holds this workflow to stopping before `Run the probe in job mode` when that step fails.

**This is the catch-all task for this file.** `scripts/` sits under no other layer's path. `scripts/sandbox-probe-runner.yml` is this repository's own Gate 12 workflow, not an `init` output. By its header, it is committed by hand to `firu-daniel/harness-gate12` and never to this repository's `.github/`.

### Targets

- `scripts/sandbox-probe-runner.yml`: the `Install the sandbox prerequisites` step only.
- `scripts/lib/sandbox-probe/legs-runner.sh`: the comment above `sp__is3_grade`'s first branch only.

**Work:**

- [ ] **Replace the step's `run: |` body** with the template step's body, byte for byte, at this file's indentation.
  - The step keeps no `if:`, per this file's header *"THE COPIED STEPS"*: it carries the body *"without its HARNESS_STOPPED condition"*. It adds no `continue-on-error`.
  - `SCRIPTS_DIR` is set in this workflow by the copied `Read the configuration` step, so the opt-out arm reads the same library a job reads.
  - Change no other step. In particular, `Record the readings after the install step` keeps its position and its keys.
- [ ] **Correct `legs-runner.sh`'s IS3 comment.** Replace *"The step writes /etc/apparmor.d/bwrap exactly when the sysctl reads 1 and the file is absent or carries no userns, line."* with the step's current rule: it writes the profile when the sysctl reads 1 and the file is absent or carries no `userns,` line, **or** when `/etc/apparmor.d/bwrap-userns-restrict` exists.
  - Add one line saying that IS3 grades on the sysctl and the `bwrap` profile alone. A write made only because the stock profile exists, with the sysctl not at 1, matches none of its rules and reads `not run`. The runner controls file records no stock-profile key.
  - No code line changes. The keys and every grade stay exactly as they are.

**Verification:**

- Compare the step's `run: |` block in both files by reading them side by side, de-indented. Every line is identical, the four path lines included.
- `bash -n scripts/lib/sandbox-probe/legs-runner.sh` exits 0, and `git diff` on that file shows comment lines only.
- Re-read the file around the step to check that its `run: |` block is indented under its `- name:` exactly as its neighbours' blocks are, and that the following `- name: Record the readings after the install step` line keeps its indentation. The YAML must still parse as the same list of steps.
