### Task 1 — Hold the probe runner to stopping before its session when the install step fails

**Goal:** Extend `cli/test/sandbox-probe-runner-workflow.test.mjs` with the probe runner's half of the branch's first goal. When `Install the sandbox prerequisites` fails, the probe workflow must stop before `Run the probe in job mode`, so a probe session that cannot run Bash is never started.

**Why this task ships first.** Task 3 changes the template's install step, and Task 6 later copies it into `scripts/sandbox-probe-runner.yml`. Between those two tasks, this file's existing byte-for-byte case (*"the job's own steps are copied, byte for byte"*) is red. This task's assertion holds on today's tree and after Task 6 alike, so it lands now, while the file is still green.

### Targets

- `cli/test/sandbox-probe-runner-workflow.test.mjs`. This is the only file this task creates or edits.

**Work:**

- [ ] Add one rule to the header's **"The rules these tests exist to enforce"** list. Name it **Stops before its session:** the copied install step is not `continue-on-error`, and no step from it up to `Run the probe in job mode` runs after a failure. Keep the header's other rules and its *"Left out deliberately"* paragraph as they are.
- [ ] Add one `test(...)` case that enforces the rule from the parsed workflow (`STEPS`, `step()`, `at()`), with no retyped step names beyond the file's existing constants (`RUN`, and the literal `'Install the sandbox prerequisites'` the file already uses):
  - `step('Install the sandbox prerequisites')['continue-on-error']` is not `true`.
  - Every step whose index lies from `at('Install the sandbox prerequisites')` up to and including `at(RUN)` either has no `if:`, or has an `if:` that names none of `always()`, `failure()` and `cancelled()`. An `if:` without a status function carries GitHub's implicit `success()`, so a failed step skips it.
  - Each failing assertion message names the step.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-runner-workflow.test.mjs` passes on the tree as this task finds it. The existing cases still pass, and the new case passes against today's `scripts/sandbox-probe-runner.yml`.
- Flip the install step's entry to carry `continue-on-error: true` in a scratch copy, read through the same parse. The new case then fails, naming the step. Revert the scratch copy afterwards. Never commit a change to `scripts/sandbox-probe-runner.yml` here: that file is Task 6's.
