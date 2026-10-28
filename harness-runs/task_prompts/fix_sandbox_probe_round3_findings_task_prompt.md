`fix_sandbox_probe_round3_findings` fixes the sandbox probe defects found after its second Gate 15 run, so the next macOS run can grade the rows that the first two runs passed without proof or never took. It takes no measurements and records no result. The maintainer reruns the probe after the merge, and the next record branch writes what that run settles.

The evidence: `docs/sandbox-verification.md` on `dev` (§0's two 2026-10-27 runs; §5 PD1–PD16), and a review of the merged probe (`dev` at `8204260c`, after #188 and #190).

> ⚠️ **Find every anchor in this prompt by its quoted text or function name, never by line number.**

## The defects

1. **CW6 passes without its call running.** In `scripts/lib/sandbox-probe/legs-wrappers.sh`, `sp__wr_prefix` runs P1b and CW6 in one session launched with `--allowed "Bash($p1b)"` only. The CW6 call (`GIT_DIR=<x> bash <main>/scripts/commit-on-branch.sh …`) has no allow rule, so in don't-ask mode it is refused at the permission layer, the way run 1's P1b was (PD9). P1b goes through `sp__wr_permission_screen`, but CW6 does not. Its judge checks only that the call was issued (`sp__wr_called`) and that both refs are unchanged, which is also exactly what a call that never ran looks like. Both runs printed `pass` with evidence `stayed sandboxed: clone … (unchanged); <x> … (unchanged)` and no layer named. Fix:
   - allow the exact CW6 call too;
   - screen it with `sp__wr_permission_screen`, so a permission-layer refusal grades `not run` with that reason;
   - make its pass evidence name the layer that answered the call, as P1b's does (`call answered by …`).

   Add fixtures for the permission-refused shape and the sandboxed shape.
2. **The same gap may exist elsewhere.** Audit every leg whose session issues more than one call under test, or a call carrying an assignment prefix, `${…}`, a compound, or anything else an `--allowedTools` rule may not match. For each, confirm that:
   - the call has an allow rule that matches it literally;
   - a permission-layer refusal grades `not run`, never `pass`.

   The lesson is already recorded in PD3, PD9, PD11 and PD16. List every leg checked in the plan, with the result, and fix any that fall short with a fixture each.
3. **CS8 (b), the watcher refusing an invalid profile, is a hand row, and F7 makes it the only guard.** CS8 (a) showed twice that a profile whose `sandbox.failIfUnavailable` is the string `"true"` is silently ignored, so the session runs unsandboxed. Find out whether the watcher's own check (`run_profile_check` in `scripts/autonomous-watcher.sh`, or whatever the watcher calls before a launch) can be driven by the probe on a scratch copy of a per-run profile with that value, without launching a run or touching the live watcher.
   - If it can, add CS8 (b) as a probe-graded half of the invalid-profile leg: `pass` when the check refuses, `fail` when it accepts.
   - If it cannot, say why in the plan and leave CS8 (b) a hand row.
   - If the plan finds the check would accept such a profile, that is a finding about the watcher. Report it as a follow-up task prompt, and do not change the watcher on this branch.
4. **N4 (link-local) cannot be graded on macOS as taken.** `curl: (7) Failed to connect to 169.254.169.254 port 80 after 0 ms` cannot tell a refused connect from an unreachable host. Find a form that can, for example an unsandboxed control call in the same session, where a refusal by the sandbox differs from the control's outcome. If no form on a stock Mac can tell the two apart, keep the `not run` and say so in N4's row. Do not bind anything to a link-local address.

## Rows to retake after the merge, with no probe change needed

- **CS7's `Edit` half** (PD16, fixed by #190): a probe run has not taken it since the fix.
- **The headless-parity checklist** (PD15, fixed by #190): its new launch lines and paste-ready requests have not been used.
- **The `Read(//<run profile>)` allow rule** that CS7 now relies on: not yet measured.

## Constraints

- **No measured result is invented.** This branch records no result. Rows in `docs/sandbox-verification.md` change only in their call and Expected columns, for the legs this branch changes.
- **No profile, generator, wrapper, guard or watcher behaviour changes.** In scope: the probe, its tests and fixtures, Gate 15's entry in `docs/development.md` → `## 5. Verifying a change`, and the call and Expected columns of the rows it amends.
- **The probe's own tests drive every fix against recorded stream fixtures.** No test launches `claude`.
- **Bash 3.2 floor.** `bash scripts/typecheck.sh` (which parses every shell script) and `scripts/run-gates.sh` must pass.

## After the merge

The maintainer reruns `bash scripts/sandbox-probe.sh run --leg wrappers --leg write-protection --leg network --leg invalid-profile` from the main checkout, then `run --leg headless-parity`. For the run's duration, the watcher is stopped, or no merged branch is waiting for its sweep (preflight refusal 5).
