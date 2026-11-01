# Clarification digest — fix_linux_test_suite_failures

## question_1 — Fresh Linux measurement before planning, or plan against the recorded one?
- **raised by:** `task-plan-writer`, planning phase, first iteration (no plan written yet); the writer's `docker` call was refused, and the prompt required a re-measurement before planning.
- **asked:** Q1 — how the plan gets its Linux baseline. (a) The operator runs the Gate 15 container recipe on current `dev`, pastes every non-jq failing test plus the output of `tty` and `bash -c ': > /dev/tty && echo has-controlling-terminal'` in the `probe` shell; (b) plan against the 2026-10-30 measurement at `1a41540c` plus the code reading, with the pre-merge container run as the only Linux check and any failure outside the three groups returning as a plan revision. The writer's code-reading diagnosis at the time: group 1 (`spawn E2BIG`) and group 2 (`Author identity unknown`) test assumptions; group 3 (the sweep's fetch bound) probably a code defect that depends on a controlling terminal (`{ : > /dev/tty; }` in `run_bounded`), not on Linux.
- **answered:**
  > Q1: (b) — plan without a fresh measurement. The re-measurement was already done before this session, on `dev` at `66e1e6c5` (#224's merge, so #224's new test files are covered); the prompt's "re-measure before planning" line was an oversight. Since `66e1e6c5` only #227 has landed, and it touches the run-analytics jq files, `jq-floor.test.mjs`, `task-offer-fence.test.mjs`, docs and gate wording — nothing in the three groups' paths. Plan against the failures the task prompt lists. The Linux container run (`npm test --workspace cli` in Gate 15's container) will be re-run by us after this branch's work completes and before merging it; a failure there that fits none of the three groups comes back as a plan revision.
- **carries beyond this branch:** the pre-merge Linux container run of `npm test --workspace cli` on this branch's head is the operator's to take; a failure there outside the three groups returns as a plan revision.

## question_2 — How Task 3 proceeds when the sandbox refuses a pseudo-terminal
- **raised by:** `layer-implementer` (layer `cli`), implementation Phase A, Task 3; `script` failed with `script: openpty: Operation not permitted` under the run's command sandbox, so the new terminal case could not reproduce the mechanism before the fix.
- **asked:** Q1 — (a) a named skip for a refused pty and apply the `[ -t 1 ]` fix from the code reading (recommended); (b) run the unit outside the sandbox via `sandbox.optOut` + `init --force` (a security-boundary change, the operator's decision); (c) the operator reproduces the case by hand from an unsandboxed macOS terminal against the unchanged script and pastes the result line (combinable with (a)); a pass on the unchanged script would mean the explanation is wrong and Task 3 should stop.
- **answered:** (the one absolute path in the quoted stack line is rewritten to its repo-relative form; nothing else is changed)
  > Q1: (a) + (c). The reproduction was run by hand from a macOS terminal (not sandboxed), in this run copy as it stood — unchanged `cleanup-merged-worktrees.sh`, Task 3's uncommitted test case — with `npm test --workspace cli -- --test-name-pattern="terminal is attached" test/outer-loop-scripts.test.mjs`. Result:
  >
  > ```
  > ✖ the sweep releases its output pipe on a bounded fetch when a terminal is attached (53490.398708ms)
  > AssertionError [ERR_ASSERTION]: the sweep took 53.0s against a 3s ceiling — the fetch's transport is still holding the pipe
  >     at TestContext.<anonymous> (file://cli/test/outer-loop-scripts.test.mjs:2039:12)
  > ```
  >
  > It breached the ceiling, so the terminal mechanism is confirmed on macOS against the current script: apply the `[ -t 1 ]` fix in `run_bounded` and its comment rewrites. Add the named skip for a refused pty (`openpty` / `tcgetattr` refusal before the sweep runs), with a reason that says so, so the sandboxed Run gates do not fail on it. Record this hand reproduction as the proof in the branch, alongside the pre-merge Linux container run, where `docker run -it` gives the case a terminal and it runs for real. Leave the sandbox as it is — no `sandbox.optOut`.
- **carries beyond this branch:** the run's command sandbox stays as it is — no `sandbox.optOut` — and a test needing a pseudo-terminal skips by name in sandboxed gate runs, so a sandboxed skip is not a pass; the group-3 fix is proven only by the hand reproduction above and the operator's pre-merge `docker run -it` container run.
