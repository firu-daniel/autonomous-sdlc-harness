### Task 11 — Fix probe defects PD25, PD26 and PD27, and add PD28's `.git/config.lock` readings to the git leg

**Goal:** Fix the four probe defects the second Linux run found (`docs/sandbox-verification.md` §5 PD25–PD28), each in the probe only and each as narrowly as its row prescribes. No macOS leg changes. Every new branch is Linux-only, or touches only what the macOS path never meets.

**Depends on:** nothing earlier in this plan. The tests for every change here are **Task 14's**, which reads the functions and signatures named below. The rows are recorded by **Task 15**.

**This is a catch-all task** (`path` `"."`). Its implementer reads every configured layer's conventions document.

### Targets

- `scripts/lib/sandbox-probe/legs-planted-files.sh`: PD25.
- `scripts/lib/sandbox-probe/legs-settings.sh`: PD26.
- `scripts/lib/sandbox-probe/legs-refresh.sh`: PD27.
- `scripts/lib/sandbox-probe/legs-protection.sh`: PD28.

**Work:**

- [ ] **PD25, CS14 on Linux.** Add `sp__pf_inert_worktree_config <path> <clone>`. It accepts exactly what the trust check accepts, which is `scripts/lib/harness-run-lib.sh` → `hr_clone_target_check_var`'s condition 3, run through `hr_run_copy_check_var`. Its comment names `hr_run_copy_check_var` as the shape it mirrors. It returns 0 only when both hold:
  - `<path>` is a regular file, not a symbolic link, of 0 bytes;
  - `git -C / config --file <clone>/.git/config --bool --get extensions.worktreeConfig` exits 1 (key absent), or exits 0 printing `false`.

  Every other outcome returns 1. That includes an unparseable value (exit 128) and `true`. It reads the clone's own `.git/config` file only, never the config cascade.
  - In `sp__pf_row`'s *"exists before the session"* test, plant over it and do not stop the row when all of these hold: `SP_PLATFORM` is `linux`, the row's `name` is `config.worktree`, `$abs` is absent, and the plant path passes that predicate.
  - Append `; Claude Code's own empty .git/config.worktree was present and was planted over (§5 PD25)` to the row's departure.
  - The plant is removed after the session exactly as today, so the clone is left without one.
  - Every other shape still stops the row with today's sentence. macOS never takes the branch.
- [ ] **PD26, CS8 (b) on a bubblewrap host.** In `sp__cs8b_check`'s child shell, after sourcing the watcher and before `run_profile_check`, require that `hr_placeholder_host_probe_var` is defined, and call it, as `sp__render` (`session.sh`) and `spawn_engine` do. When it is not defined, print `<watcher> defines no hr_placeholder_host_probe_var` and exit 2, as the existing `run_profile_check` guard does. Update the function's comment to cite PD26. Nothing else in the leg changes.
- [ ] **PD27, R3's conflict file.** Add `sp__rf_bootstrap_read <path>`. It returns 0 when the path's basename is one the bootstrap's install reads: `package.json`, `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock` or `pnpm-lock.yaml`, matched exactly, at any depth.
  - In `sp__rf_pick_conflict`'s file loop, `continue` past such a path right after the protected-set test.
  - Extend its comment, *"outside the protected set"*, to say that it also skips the files the bootstrap reads, citing PD27.
  - The no-candidate message is unchanged.
- [ ] **PD28, the seam that decides it.** The decision: **the evidence cannot decide it.** The record holds one refusal line and nothing about what was at `.git/config.lock`. So the judge's Linux table, `SP__LINUX_SANDBOX_STRINGS` in `judge.sh`, does **not** change, and `File exists` stays unknown. On Linux only, `sp_leg_git` gains three readings:
  - **Before and after.** A reading of `$SP_CLONE/.git/config.lock` from the probe's own shell, before the session and after it, through a new `sp__git_lock_reading <path>`. It prints `absent` when neither `-e` nor `-L` holds. Otherwise it prints the whole first line of `ls -ld -- <path>`: type, mode, owner, and size or device numbers. It is never truncated, and it is portable to the BSD `ls` the test host runs.
  - **Inside.** One session call after the `git config` call: `ls -ld .git/config.lock`, allowed through `--allowedTools "Bash(ls -ld .git/config.lock)"`. Its result is read through `sp_judge_call … ran` and quoted whole, its `No such file or directory` included.
  - **In the evidence.** All three are appended to CL5's evidence by `sp__git_cl5_grade`, which gains optional third, fourth and fifth arguments: before, inside, after. They are appended only when the `git config` result carries `File exists`, as `; .git/config.lock read: before the session <x>, inside the session <y>, after it <z>`.

  The verdict logic is unchanged: a `File exists` refusal still grades through `sp_judge_call` as today, `not run` on Linux. The macOS session's prompt, its allowed rules and its grading are byte-identical. Guard every new line on `SP_PLATFORM` = `linux`.
- [ ] **Headers.** Each file's header names its new function, with its signature, where that file lists its functions or describes the row. `legs-protection.sh`'s header states two things: the PD28 readings exist to decide whether `File exists` is a sandbox refusal, and the shape is kept out of the judge until a run's readings decide it.

**Verification:**

- `bash scripts/typecheck.sh` passes, with the Bash 3.2 shell-parse gate over the four files.
- `git diff -- scripts/lib/sandbox-probe/judge.sh` is empty.
- In each of the four diffs, every new line a macOS run would execute is either inside a new function the macOS path never calls, or behind `SP_PLATFORM` = `linux`. Two exceptions, platform-neutral by their rows: `sp__rf_bootstrap_read`'s skip (PD27: *"Not platform-specific"*), and the `hr_placeholder_host_probe_var` call, which on macOS leaves `HR_PLACEHOLDER_HOST` `0`, what the check assumed before. Read every hunk against this.
- `sp__pf_inert_worktree_config`'s body reads `extensions.worktreeConfig` with `git -C / config --file … --bool --get`, the call `hr_clone_target_check_var` makes, and accepts only exit 1, or exit 0 with `false`. Compare the two by reading them side by side.
