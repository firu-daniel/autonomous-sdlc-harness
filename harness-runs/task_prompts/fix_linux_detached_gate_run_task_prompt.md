`fix_linux_detached_gate_run` makes Run gates yield a verdict in a sandboxed session on Linux. Today it never does: the run form's detached gate worker dies with the Bash call that started it, so an unattended Linux run cannot pass Run gates. This is §5 F10 in `docs/sandbox-verification.md`, confirmed on the run form by T3 in the probe's second Linux run (2026-11-02). #170 puts this fix ahead of #195's Gate 12 round, whose full run executes on a Linux GitHub-hosted runner.

This is a follow-up in the sandbox3b1 family. The earlier ones are #212 (3b1b), #219 (3b1c), #220 (3b1d), #221 (3b1e) and #229 (3b1f).

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `docs/sandbox-verification.md`:
  - §0, *The probe's second Linux run (2026-11-02)*.
  - §5, the rows **F6**, **F10**, **T2**, **T3**, **BG2**, **BG9** and **WF5**. F6 explains why the run form detaches; F10 holds what Linux does to it.
  - §8, **LB5**: a listener started by a sandboxed call was gone when the probe called it, the same mechanism.
  - §9, **BG9 (runner)** and **WF5 (runner)**: the same question on a GitHub-hosted runner, not yet measured.
- `scripts/run-test-suite.sh` (and its template, `cli/templates/scripts/run-test-suite.sh`): the header comment on the run form, the `--wait` form, the worker, `.running` and its heartbeat, and the stale rule.
- `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` → `### G.1`: how a session starts and collects a round.
- `scripts/lib/sandbox-probe/legs-local.sh` (T2/T3) and `scripts/lib/sandbox-probe/legs-detached.sh` (BG9, WF5).

## What was measured

- **BG9, both Linux runs (2026-10-29, 2026-11-02):** a process started with `nohup … </dev/null >/dev/null 2>&1 &` plus `disown` inside a sandboxed call did not outlive the call: `worker pid none: the detached process did not outlive the session: no beat was written, no done marker`. On macOS the same shape ran its full 1524 s (BG2).
- **T3, the second Linux run:** `bash scripts/run-test-suite.sh sbx_probe_t2` started the worker, and the lane log ends partway through the typecheck gate's build, after `tsc -p tsconfig.json`. The session's next call, `bash scripts/run-test-suite.sh --wait sbx_probe_t2`, returned `run-test-suite.sh: no run in flight for sbx_probe_t2`, exit 2. A stale `.running` was left, and there was no verdict 1800 s later.
- **Not measured:** the cause. The likely reading is that bubblewrap ends every process in the call's PID namespace when the call's own process exits. Nothing in the evidence proves that.

## Folded in: probe defects PD25–PD28

The second Linux run also found four probe defects. They are recorded in `docs/sandbox-verification.md` §5 rows **PD25**, **PD26**, **PD27** and **PD28**, each with the fix it owes. All four are in the probe only, and this branch fixes them too:

- **PD25 (CS14):** Claude Code creates an empty `.git/config.worktree` at a session's start on Linux (§5 AP2, AP7). CS12's and CS13's sessions therefore leave one in `<clone>_files`, and CS14's own "exists before the session" check always stops on it. See `scripts/lib/sandbox-probe/legs-planted-files.sh`.
- **PD26 (CS8 (b)):** `sp__cs8b_check` in `scripts/lib/sandbox-probe/legs-settings.sh` calls the watcher's `run_profile_check` without first taking `hr_placeholder_host_probe_var`, as `spawn_engine` and `sp__render` do. So on a bubblewrap host the control refuses the unmodified per-run profile.
- **PD27 (R3):** `sp__rf_pick_conflict` in `scripts/lib/sandbox-probe/legs-refresh.sh` edits the first file `dev`'s tip commit modified. On `0fc4131f` that was `cli/package.json`, so the `_r3` clone's bootstrap failed (`create-worktree.sh` exit 4). This is not Linux-specific.
- **PD28 (CL5):** on Linux, `git config sbx.probe true` was refused with `error: could not lock config file .git/config: File exists`, a shape the judge does not know. **The plan decides from the evidence** whether that is a sandbox refusal. It adds the shape to the judge's Linux table under its layer only if so, with a fixture in `cli/test/sandbox-probe-judge.test.mjs`. What placed a file at `.git/config.lock` is not measured. If the evidence cannot decide it, the row says so and the shape stays out.

Each fix gets a fixture in the probe's tests. Each row is updated in §5 to read as fixed by this branch, with confirmation owed to the next Gate 15 container run. **No measured result is invented.** The macOS legs and their recorded verdicts don't change.

## The goal

1. On Linux, a sandboxed session's Run gates round reaches a verdict through `run-test-suite.sh`, on the same profile and under the same sandbox it has today. Nothing is moved outside the sandbox unless the plan shows there is no other route and records why.
2. macOS behaviour is unchanged: BG1–BG8, T2 and every macOS probe verdict keep their recorded results.
3. The probe's T3, BG9 and WF5 rows can show the fix: their expectations are updated where the mechanism changes, with fixtures in the probe's tests.
4. `docs/sandbox-verification.md` §5 F10 and PD25–PD28 read as fixed by this branch, saying what changed and that the next Gate 15 container run confirms it. **No measured result is invented.**

## Constraints

- **Do not set `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`** in any profile, and do not widen `excludedCommands` or the write roots to make the worker survive without saying so in F10's row.
- A gate run must still outlast the Bash tool's 10-minute cap and its background time limit (F6).
- No change to the watcher's launch or the per-run profile render beyond what the fix needs, each such change named in the plan.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
- The Linux result is taken by hand afterwards, in Gate 15's container. This branch does not take it.
