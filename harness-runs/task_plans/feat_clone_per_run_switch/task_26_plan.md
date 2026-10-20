### Task 26 — Hold job mode to the base profile and an untouched lane, and prove its launch check, in `watcher-remote-job.test.mjs`

**Goal:** The job-mode suite asserts what Task 13 decided for job mode:
- the session's `--settings` is still the base profile;
- nothing is written under `XDG_STATE_HOME`, so the machine lane stays off and no per-run profile is rendered;
- the launch check refuses a base profile whose sandbox is off without the opt-out marker, so nothing is launched and the run ends `failed`.

Story goal 6 (*"Every suite that runs … the watcher's payload paths … moves"*) is met for this suite by keeping both existing assertions true, each with its reason stated, and adding the refusal case.

**Depends on:** Task 13. These are the job-mode behaviours this task asserts:
- **Job mode renders no per-run copy.** `spawn_engine` runs `run_profile_check "$SETTINGS_PROFILE"` and passes `$SETTINGS_PROFILE`, the checkout's own `.claude/settings.autonomous.json`, to `--settings` unchanged. It never calls `hr_run_profile_file` or `run_profile_render`, and creates nothing under `$XDG_STATE_HOME`. The reasons: `autonomous-watcher.sh` → header *JOB MODE* keeps *"the machine lane (both halves)"* off, and in a job the copy is the main checkout with no other linked worktree, so a per-run copy would equal the base.
- **The launch check, in job mode.** It refuses when the base profile does not parse as one JSON object, or when its sandbox clause fails. That clause is Task 13's declared mirror of `cli/src/generators/sandboxProfile.ts`:
  - with no `_README` line beginning `THE SANDBOX IS OFF BY THIS REPOSITORY'S OWN CHOICE` (Task 5's `SANDBOX_OPT_OUT_MARKER`), `.sandbox.enabled`, `.sandbox.failIfUnavailable` and `.sandbox.allowUnsandboxedCommands` must equal `shippedSandboxSettings()`' values (`true`, `true`, `false` today);
  - with that marker line, they must equal the opt-out shape `applySandbox` writes: `enabled` `false`, `failIfUnavailable` `false`, `allowUnsandboxedCommands` `false`.
- **A refusal** logs `not launching '<branch>': <reason>`, launches nothing, and reaches `run_job`'s `|| registry_set "$branch" status failed` arm. The job's status write then records `status` `failed` in `remote_status.json`.

**Where this task stops.** It changes no script. The local-mode per-run profile is Task 14's suite.

### Targets

- `cli/test/watcher-remote-job.test.mjs`

**Work:**

- [ ] Case *"a stub exiting 0 is completed / stop under the watcher launch line"*: keep `assert.equal(after('--settings'), join(j.dir, '.claude', 'settings.autonomous.json'))`. Add a comment above it saying why the base profile is right in job mode: the lane is off, and the job copy would add nothing. Keep `j.assertLaneUntouched()` in that case and in every case that calls it today.
- [ ] Update the file's header paragraph that says every case points `XDG_STATE_HOME` at an empty directory. It now also covers the per-run profile: a job-mode render under the lane would land there and be seen, so the same assertion holds both the lane and the per-run profile off.
- [ ] Add a case *"launch check: a base profile with the sandbox off and no opt-out marker launches nothing and ends failed"*. Set the fixture's `.claude/settings.autonomous.json` `sandbox.enabled` to `false` with `jq`-equivalent JSON editing in the test, leaving no marker line in `_README`, then run `j.job([j.branch, 'task', 'none'])`. Assert:
  - `j.argv()` is `null`: the stub was never launched;
  - `j.status().status` is `failed`;
  - the watcher log or stdout carries `not launching '<branch>'`;
  - `j.assertLaneUntouched()`.
- [ ] Add a perturbation in the same case, in a fresh fixture: the opt-out profile `applySandbox` writes — `sandbox.enabled` `false` **and** `sandbox.failIfUnavailable` `false`, **with** a `_README` line beginning `THE SANDBOX IS OFF BY THIS REPOSITORY'S OWN CHOICE`. Produce it from the fixture's `init` with `sandbox.optOut` in `harness.config.json` where the job helper's fixture allows it; otherwise write exactly that shape in the test, `failIfUnavailable` included. The stub is launched, with `--settings` the base profile's path, and the lane is untouched. This shows the refusal comes from the check and not from the fixture.
- [ ] Add a `RED ONCE` note to the header for the new case: confirmed red once with `run_profile_check`'s sandbox clause skipped in a fixture copy of the watcher, never by editing the tracked template.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-job.test.mjs` passes.
- Every fixture, its bare `origin` and its `XDG_STATE_HOME` live under the system temp directory. No case writes under the real home directory.
