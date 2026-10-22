### Task 4 — Refuse a fresh local launch on a host that cannot sandbox it

**Goal:** A local inbox drop on a host with a definite missing piece never starts a session. The watcher refuses it before it creates a working copy, naming what is missing and how to install it, unless the main checkout's configuration takes the opt-out. It never runs silently unsandboxed, and it never refuses on anything but a definite missing piece.

**Depends on:** Task 3, which adds these to `cli/templates/scripts/lib/harness-run-lib.sh`:

- `hr_sandbox_opted_out <root>`, which returns 0 when the opt-out is taken and 1 for every other state, unreadable included;
- `hr_sandbox_prereq_probe_var`, which takes no argument, reads `uname -s`, `uname -r` and `command -v bwrap` / `command -v socat` on the caller's `PATH`, and returns 1 exactly when a definite piece is missing. It sets `HR_SANDBOX_MISSING` (the space-separated ids `bwrap`, `socat`, `wsl1`, `unsupported-platform`) and `HR_SANDBOX_REFUSAL` (a one-line sentence naming each piece and its install command, and never the opt-out).

This task calls them and owns the refusal. It does not change them.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`: the refusal in `process_inbox_file`, its header paragraph and its repro line.
- `cli/test/helpers/watcher.mjs`: the default probe override in `tick`, plus an option to replace it.
- `cli/test/watcher-sandbox-refusal.test.mjs` (new): the refusal's cases.

**Work:**

- [ ] **The refusal, in `process_inbox_file`.** It goes after the `park_loop` rejection and immediately before the `lane_blocks_start` call. That keeps it below every cheaper guard and above the lane, which is consulted last.
  - Guard it with `if [ "$remote" != 1 ] && ! hr_sandbox_opted_out "$MAIN_REPO" && ! hr_sandbox_prereq_probe_var; then`. A drop sent to GitHub is not judged by this host, and the opt-out is read from the main checkout only.
  - On refusal, `log "this machine cannot sandbox an unattended run — not launching '$branch': $HR_SANDBOX_REFUSAL"`, then `fail_before_launch "$branch" "$file" "$fname" "(this machine cannot sandbox the run: $HR_SANDBOX_REFUSAL — nothing launched; npx autonomous-sdlc-harness doctor reports it under sandbox-prerequisites)"`, then `return 0`.
  - It archives and does not defer, because a host does not install its own packages. A deferral would retry the drop on every pass, with no bound.
- [ ] **The watcher header.** Add a paragraph, **THE SANDBOX PREFLIGHT**, under the shared-guards comment. It states:
  - where the check sits in the guard order and why it is below the branch-owning-record rejections, which archive while preserving status;
  - that only a fresh local launch is judged. Resumes, job mode and a remote drop are left to the profile's `failIfUnavailable`, and the remote job is refused by its own `doctor --remote-job` preflight;
  - that an `uncertain` AppArmor answer never refuses;
  - the opt-out exemption, and the owners: `cli/src/doctor/sandboxPrerequisites.ts` through the library's mirror.

  Add a repro line to the header's REPRO block: a pass whose sourced probe is overridden to report `bwrap socat` leads to a `failed` record, a `failed_` archive and no stub launch.
- [ ] **`cli/test/helpers/watcher.mjs`.** In `tick`, after the watcher is sourced and before `tick; wait`, define a default override: `hr_sandbox_prereq_probe_var() { HR_SANDBOX_HOST=macos; HR_SANDBOX_MISSING=; HR_SANDBOX_REFUSAL=; return 0; }`. Every suite that drives a pass through `tick` then launches on any host, a Linux host without `bubblewrap`/`socat` included. Let `tick` accept a second argument, `{ sandboxProbe }`: a shell function body that replaces the default. Add a module-header choice (a fifth) stating that the override is test-only, and that the watcher carries no environment switch for it, because such a switch would be a bypass. Grep the other watcher-driving suites (`cli/test/watcher-*.test.mjs`, `run-copy-migration.test.mjs`, `registry-writer.test.mjs`, `test-timeout.test.mjs`, `restart-watcher-*.test.mjs`) for a pass that reaches `process_inbox_file` outside `tick`. Name any you find in your return as host-dependent, and edit none of them.
- [ ] **`cli/test/watcher-sandbox-refusal.test.mjs` (new).** Its header states the rule. Every case uses `createWatcherFixture`, drops `<branch>_task_prompt.md` into the inbox, and runs one `tick`:
  - (a) With a probe override reporting `bwrap socat` and a refusal sentence naming `bubblewrap`: no prompt is recorded, so the stub was never launched. The record's `status` is `failed`, the inbox holds nothing, the watcher's `ARCHIVE_DIR` (`autonomous_inbox/.processed/`) holds one `failed_*` file, one `failed` notification names `bubblewrap`, and `watcher.log` carries `not launching`.
  - (b) The same override, with `sandbox.optOut: { reason: 'r' }` written into the fixture's `harness.config.json`: the stub is launched.
  - (c) The same override, with `sandbox.optOut: { reason: '   ' }`: refused as in (a), because a blank reason is not a taken opt-out.
  - (d) The default override: the stub is launched.
  - (e) With `execution.target` `github-actions`, if `watcher-remote-dispatch.test.mjs`'s setup can be reused cheaply: the missing-piece override is never consulted. Otherwise state in the header that the remote arm's exemption is covered by reading only.

**Verification:**

- `npm test --workspace cli -- test/watcher-sandbox-refusal.test.mjs` passes. It is this task's own new test file. `cli/test/helpers/watcher.mjs` is a helper, not a test file, and the Run gates round runs the suites that import it.
- Read the refusal block back against the guard order in the watcher's shared-guards comment. It sits below the `park_loop` rejection and above `lane_blocks_start`, and it is inside `[ "$remote" != 1 ]`.
- `git diff --name-only` for this task names no file under the repository-root `scripts/`.
