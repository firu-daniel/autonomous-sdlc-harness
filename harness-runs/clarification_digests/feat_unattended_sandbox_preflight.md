## question_1 — How to resolve three test failures that occur only under the session's command sandbox
- **raised by:** Phase G (Run gates), round 3: `test-fix-plan-writer` returned `fixable: 0` (`harness-runs/test_fix_plans/feat_unattended_sandbox_preflight_task_round_3.md` → `## Not fixable on this branch`).
- **asked:** Q1 — how should the three sandbox-environment test failures be resolved? The failures, persisting across rounds 1–3 while the type check passed every round:
  - `cli/test/outer-loop-scripts.test.mjs`: `probe.dart under dart`, plus its parent case. `dart` is installed on this host but fails under the session's command sandbox. The python3 and node probes pass through the same runner. Neither the runner nor this test is touched by the branch.
  - `cli/test/test-timeout.test.mjs`: `a hung watcher case fails by name with a timeout and leaves no process behind`. Its final assertion shells out to `pgrep`, which the sandbox blocks (`sysmon request failed with error: sysmond service not found` / `pgrep: Cannot get process list`, exit 3). Assertions 1–3 pass. The branch does not touch this path.

  Why it was the operator's call: the only routes past the gate change what the gate certifies, or how sandboxed the harness's own gate runs are; the task prompt says *"The opt-out is never the default"*; marking the gate passed without a `pass` verdict is forbidden. Options:
  1. **Verify outside the sandbox, then let the run continue.** Run `bash scripts/test.sh` yourself in an unsandboxed shell on this branch (or just `npm test --workspace cli -- test/outer-loop-scripts.test.mjs test/test-timeout.test.mjs`). If those pass, say so, and say how the run should then treat Phase G:
     - (a) leave `G.` unresolved and stop at a hand-off, or
     - (b) you will rerun the gates yourself outside the sandbox before merging, and the run should proceed to Phase D with the gap disclosed.
  2. **Change the gate's environment.** For example, allow `pgrep` and the `dart` probe's write paths in the unattended profile's sandbox for gate runs, then answer, and the run re-runs round 4. (Setting `sandbox.optOut` would also work, but it turns the sandbox off for every unattended run in this repository.)
  3. **Change the tests in this branch.** For example, make the `pgrep` survivor check and the `dart` probe skip with a recorded reason when the process list or toolchain is unavailable under a sandbox. This widens the branch's scope beyond its task prompt. If you choose it, say which of the two tests it covers.
  4. **Something else.** Describe it.
- **answered:**

  > **Q1:** Option 3, covering both tests, in this branch.
  >
  > Evidence: run unsandboxed on this branch at its current tip, `npm test --workspace cli -- test/test-timeout.test.mjs test/outer-loop-scripts.test.mjs` gives 75 pass, 0 fail, 1 skipped; both `probe.dart under dart` and `a hung watcher case fails by name with a timeout and leaves no process behind` pass. The failures are sandbox-only.
  >
  > Rules for both changes:
  > - Skip only on a capability the test itself measures at the moment it needs it, never on detecting the sandbox. Record the reason in the skip message, worded like the existing "not on PATH" skips, and quote the tool's own output in it.
  > - Do not loosen or delete any assertion. Add no sandbox profile entry and do not touch `sandbox.optOut`.
  >
  > **Hung-watcher case** (`cli/test/test-timeout.test.mjs`): keep the survivor assertion exactly as it is when `pgrep` exits 0 or 1. Only when `pgrep` exits with any other status (exit 3 with `Cannot get process list` under the sandbox) does the case skip, quoting `pgrep`'s stderr. Exit 0 with matches still fails the case.
  >
  > **`probe.dart`** (`cli/test/outer-loop-scripts.test.mjs`, the scratch-runner case): drive each interpreter through the runner first, unchanged. Only when that run fails, run the same probe file directly with its interpreter (`<interpreter> <probe file> forwarded-argument`, no runner) as a control:
  > - if the direct run also fails to exit 7 with the argument echoed, the interpreter cannot run here: skip, quoting its output;
  > - if the direct run succeeds, the runner is at fault: the subtest fails with the original assertions.
  > Hosts where the runner run passes pay nothing extra. Apply this to every probe in the table, not to dart by name.
  >
  > Then re-run the gates.
- **carries beyond this branch:** a standing rule for a test that fails only under the command sandbox: it may skip only on a capability the test itself measures at the moment it needs it, never on detecting the sandbox; the skip message quotes the tool's own output in the existing "not on PATH" style; no assertion is loosened or deleted; and the fix adds no sandbox profile entry and does not touch `sandbox.optOut`.
