`fix_job_mode_scripts_git_placeholder` fixes a release defect that the Gate 12 sandbox series round redo (#170 step 4, round 14, 2026-11-05) found in 0.6.9. On a GitHub-hosted runner, every sandboxed call that places its repository root from inside the scripts directory fails, so no implementer can type-check or test, and Run gates cannot start. No remote run can reach "branch ready for review": every task run in the round parked at Run gates on it. Call it **F15**.

It also takes a probe defect the round found (PD31) and the route gap that left JS3 unmeasured, so that the scoped round after the next release can take GS1–GS4, PN1–PN3, NN2 and JS3.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## The constraint

**The gates stay sandboxed.** The fix must not exclude a gate, a wrapper or `launch-sandboxed-gates.sh`'s worker from the sandbox, must not drop the `<scriptsDir>/.git` write protection, and must not add any route that runs session-written code outside a sandbox. That is the #232 ruling (Run gates on a bubblewrap host run sandboxed or refuse, never pass unsandboxed), and it holds here. If no route below is proven, Run gates keep refusing on a GitHub-hosted runner, as they do now, and the run keeps parking rather than reporting a pass.

## What to read first

- `cli/src/generators/writeProtection.ts` → `protectedPaths`: the loop over `scriptsDirLevels(repoRoot, scriptsDir)` that adds `join(level, GIT_DIR)` with the reason "a .git here would make this directory the main checkout the unsandboxed wrappers place themselves in", and the doc comment above it on why the `.git` levels are protected.
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_repo_root`, `hr_wrapper_main_of`.
- `cli/templates/scripts/launch-sandboxed-gates.sh` → `lsg_bwrap_args_var`: the `denyWrite` loop that turns an exact, absent entry under the target into `--ro-bind /dev/null <path>`, and its `case "$c" in "$target"/?*) ;; *) continue ;; esac` filter.
- `cli/templates/scripts/autonomous-watcher.sh`: the per-run profile's handling of F9's trio (`RUN_PROFILE_COPY_GIT_PATHS`, the `omit` set), the precedent for an exact entry that cannot be enforced by a placeholder on Linux.
- `docs/sandbox-verification.md` §5 F9 (an exact `denyWrite` entry for an absent path is enforced on Linux by a placeholder at that path) and the gate-sandbox section (#232, #242).
- Every script that places its root from its own directory, with `hr_repo_root "$script_dir"` or `git -C "$script_dir" rev-parse --show-toplevel`: `typecheck.sh`, `test.sh`, `run-test-suite.sh`, `scratch-run.sh`, `docs-search-server.sh`, `start-dev-server.sh`, `deploy.sh`, `autonomous-notify.sh`, `setup-worktree.sh`, `create-worktree.sh`, `cleanup-merged-worktrees.sh`, `restart-watcher.sh` (all under `cli/templates/scripts/`).

## What was measured (2026-11-05, verbatim)

`firu-daniel/harness-gate12`, adopted at 0.6.7, upgraded to 0.6.9. Runner `ubuntu-26.04` (`20261025.179.1` and `20261101.186.1`), kernel 7.0, bubblewrap 0.11.1, Claude Code 2.1.318.

- **The probe's `gate-sandbox` leg** (`sandbox-probe-runner.yml`, run `42030719431`, `probe_commit` `9ae681cd`, job mode): the one call `bash …/harness-scripts/launch-sandboxed-gates.sh /home/runner/work/harness-gate12/harness-gate12 sbx_probe_gs` answered

  ```
  launch-sandboxed-gates.sh: the sandboxed gate run of sbx_probe_gs did not start: run-test-suite.sh: '/home/runner/work/harness-gate12/harness-gate12/harness-scripts' is not inside a git repository
  ```

  so GS1–GS4 and WF5 printed `not run`.
- **The full run** (`feat_money_split_even`, (xvi)): the answered job `42032652140` planned, implemented two tasks, passed the architecture review, fixed two code-review findings and passed the skeptic review, then parked at Phase G, round 1, with the same refusal from `launch-sandboxed-gates.sh <run-copy root> task_round_1`. The park reports that every implementer's `typecheck.sh` / `scratch-run.sh` hit the same root-resolution failure inside the session's own sandbox, where `harness-scripts/.git` is a character device (`/dev/null`, `1, 3`, owned by `nobody:nogroup`), so `git -C harness-scripts rev-parse --show-toplevel` fails with `fatal: not a regular file`. "None of the branch's code or tests has been executed yet."
- **Three more runs parked on it** at Run gates, round 1: SB2's answered job `42037167631`, JS3's `42039003130` and RJ3's `42040752442`.
- The run parked rather than reporting a pass, which is correct.

## The cause

1. The base profile write-protects `<checkout>/<scriptsDir>/.git` at each scripts-directory level by exact path, by design. Locally: `/Users/daniel/Work/harness-gate12/harness-scripts/.git`. The path does not exist.
2. On Linux, an exact entry for an absent path is enforced by a placeholder mounted at that path (F9). Claude Code's own bubblewrap sandbox does it for the session, and `lsg_bwrap_args_var` does the same for the gate worker (`--ro-bind /dev/null <path>`). So inside both sandboxes, `<scriptsDir>/.git` is an empty non-directory.
3. Every script listed above places its root with `git -C <scriptsDir> rev-parse --show-toplevel`. Git's discovery stops at a `.git` that is not a directory and fails: `fatal: invalid gitfile format` for an empty file (reproduced on macOS with `: > r/harness-scripts/.git`, rc 128), `fatal: not a regular file` for the character device. `hr_repo_root` returns 1.
4. **Why only job mode.** In the clone layout the entry names the *main* checkout, and the run copy is a sibling: the session's and the launcher's placeholders land in the main checkout, which no sandboxed call places its root from, and the launcher's `"$target"/?*` filter skips the entry outright. Gate 15's container (#242, #249) passed GS1–GS4 that way. In job mode the run copy *is* the checkout the base profile was generated for, so the entry lands in the scripts directory the session's wrappers run from. Every job is hit, whatever the task.

## Candidate routes (not decided; measure before choosing)

The plan picks a route and proves it on a runner. Rejecting all of them is an acceptable outcome, per the constraint above.

- **(a) Place the root without walking through `<scriptsDir>/.git`.** Each script derives its candidate root by stripping the configured scripts-directory levels from its own path, and confirms it with `git -C <candidate> rev-parse --show-toplevel` (equal to the candidate). The placeholder stays where it is and keeps doing its job. This touches the twelve scripts, or one library function they all call; a script that cannot read the configuration needs another way to know its depth. Check that an unsandboxed wrapper's main-checkout placement (`hr_wrapper_main_of`) keeps its current meaning, and that a planted `<scriptsDir>/.git` is still refused.
- **(b) A placeholder git skips.** An empty, read-only *directory* at `<scriptsDir>/.git` is skipped by git's discovery (checked on macOS: `mkdir r/harness-scripts/.git` → `git -C r/harness-scripts rev-parse --show-toplevel` answers `r`, rc 0). But Claude Code chooses its own placeholder, so this can only fix the launcher half. And `hr_wrapper_main_of` takes a real `.git` directory without a `commondir` as the main checkout, so a directory left on disk is exactly the redirect the protection exists to stop. Weigh that before using it even in the launcher.
- **(c) The F9 precedent.** Carry the job-mode `<scriptsDir>/.git` entries the way the per-run copy carries F9's trio on Linux, protected by another route that needs no placeholder. Only if that route is as strong as the exact entry: the wrappers run unsandboxed in the same job and would follow a planted `.git`.

Whichever route is taken, `launch-sandboxed-gates.sh` must still start its worker with every protected path closed, and GS2 (writes outside the roots and to `.git/config` refused on disk) must still pass.

## Also in this branch: the probe and the driver

- **PD31 — the probe's `/proc` controls never run.** In `runner-pid` and `runner-privs`, every Bash call naming a `/proc` path was refused at the permission layer in `dontAsk` mode, although each was named verbatim in `--allowedTools`: `grep -a -c SBX_PROBE_CANARY= /proc/<pid>/environ`, `ls /proc`, the control `grep -a -c PATH= /proc/self/environ`, and `grep NoNewPrivs /proc/self/status`. The same sessions' `dd` and `sudo -n true` calls ran. So PN1–PN3 and NN2 printed `not run` ("control did not succeed: … Permission to use Bash has been denied because Claude Code is running in don't ask mode"). Find a route Claude Code 2.1.318 allows (the `Read` tool on the `/proc` path, `/proc` as an `--add-dir`, or another), prove it on a runner, and keep each control in the same session as its probe.
- **LB5 is not this branch's.** `loopback` LB5 printed `not run` again: "the listener was no longer running when the probe called it, so no reply proves nothing" (session C ran 10 s). That is F10, as on the container's Linux runs 1 and 2 (`docs/sandbox-verification.md` §5 F10, the LB5 rows): a listener a sandboxed call starts does not outlive that call on Linux. It is not a probe defect, and it is input to #236, not a fix here. LB1–LB4 passed in the same run.
- **JS3 has no way to stall.** `gate12-sandbox-round.sh default-branch` ran clean (default branch and both stall variables restored, job `42039003130` started with `STALL_WARN_SECS 60` / `STALL_KILL_SECS 120`). But the honest JS3 task ran 8 minutes without ever going 120 s silent, so `grade` printed JS3 `not run` ("no stall happened, so the arm was not exercised"). Give the JS3 plant a way to stall that stays inside the job's profile, for example a task prompt asking for one allow-listed command that stays silent past `STALL_KILL_SECS`. Or settle JS3 from the source, as RJ2 is, and say so in Gate 12's round text.

## Acceptance

- In job mode on a Linux runner, a session's `bash <scriptsDir>/typecheck.sh` and `bash <scriptsDir>/test.sh` place their root, and `launch-sandboxed-gates.sh` starts its worker and reaches a verdict, with the sandbox on and every `<scriptsDir>/.git` level still write-protected.
- A planted `<scriptsDir>/.git`, file or directory, still cannot move an unsandboxed wrapper's main checkout.
- The clone layout (macOS and Gate 15's container) behaves as before.
- Tests: a job-layout fixture with an absent `<scriptsDir>/.git` and a placeholder at it (empty file and character device) for root placement, and the launcher's argument vector for the same case. The probe's suites cover PD31, and the driver's suites cover JS3's plant.

## Afterwards (hand steps, not this branch's)

A release, then a scoped Gate 12 round: step 5's runner legs again (GS1–GS4, WF5, PN1–PN3, NN2), step 6's full run to "branch ready for review" with FR1–FR7 graded, JS3 and RJ3's `review` half. Round 14's record is `~/Work/harness-gate12-test-steps/steps-round14.md` and `gate12-round14-issues.md`; nothing is written into `docs/sandbox-verification.md` yet.
