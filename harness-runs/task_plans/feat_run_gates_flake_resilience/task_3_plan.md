### Task 3 — Scale the remaining suites' ceilings through `scaleBound`

**Goal:** Move every remaining "until X happens" ceiling under `cli/test/`, outside the watcher suites, onto the multiplier: the polled-wait attempt budgets, an exit ceiling, a slack allowance and a child runner's timeout. No assertion, retry or skip changes. Only the time allowed changes.

**Depends on:** Task 1. That task creates `cli/test/helpers/timing.mjs`, which exports `scaleBound(base)`. For a positive-integer `base` it returns `Math.ceil(base * TIME_SCALE)`, a positive integer. It is unit-agnostic: it scales milliseconds, attempt counts and seconds alike, and it throws for a base that is not a positive integer. Its cap is `MAX_TIME_SCALE = 5`, and this task's largest bound, `CHILD_TEST_TIMEOUT_MS`, is the one that cap was sized against. Import as `import { scaleBound } from './helpers/timing.mjs';`. This task does not edit `timing.mjs`, `watcher.mjs` or any watcher suite, because those belong to Tasks 1 and 2.

**What stays fixed in these files.** Leave the following unchanged. They are listed in Task 1's helper header, so do not duplicate the list here.
- `init.test.mjs` → `RETURNS_PROMPTLY_MS` and `DEV_SERVER_STUB_SECONDS`.
- `outer-loop-scripts.test.mjs`, the sweep case's `ceiling = 3` and `HANGING_GIT`'s `sleep 300`.
- `run-test-suite.test.mjs` → `sleep(10000)`, `sleep(5000)`, `sleep(1000)` and every `STALE_ENV` / `RUN_TEST_SUITE_WAIT_SLICE` value.
- `test-timeout.test.mjs` → `CHILD_BOUND_MS` and `REAP_GRACE_MS`.
- Every poll interval: `sleep(20)`, `sleep(50)` and the 20 ms `setTimeout`.

### Targets

- `cli/test/init.test.mjs`
- `cli/test/run-test-suite.test.mjs`
- `cli/test/outer-loop-scripts.test.mjs`
- `cli/test/docs-retrieval.test.mjs`
- `cli/test/test-timeout.test.mjs`

**Work:**

- [ ] **`init.test.mjs`, `eventually`.** Replace the literal `100` attempt count with a module constant `EVENTUALLY_ATTEMPTS = scaleBound(100)`. Change its doc comment from *"Poll a predicate for up to two seconds"* to *"…for up to two seconds times `HARNESS_TEST_TIME_SCALE`"*.
- [ ] **`run-test-suite.test.mjs`.** Set `POLL_LIMIT = scaleBound(600)`, and add a clause to its doc comment saying the attempt budget is scaled. It serves both `pollUntil` and `drainWorker`.
- [ ] **`outer-loop-scripts.test.mjs`.** Two sites change:
  - **The INT-exit case.** Bind `const exitBoundMs = scaleBound(10_000);` and use it for the `setTimeout` delay. Use it in the rejection message too, as `within ${exitBoundMs / 1000} s of an INT`.
  - **The sweep case.** Replace the slack `20` in `elapsed < ceiling + 20` with `scaleBound(20)`, and amend the comment above the assertion to say the slack is scaled while `ceiling` is not. At the cap the slack is 100 s, so the bound is 103 s. That still sits below `HANGING_GIT`'s `sleep 300` and the 144 s child-only kill the case header records, so the case can still fail. State that in the comment.
- [ ] **`docs-retrieval.test.mjs`, `waitForStderr`.** Replace the literal `100` attempt count with `scaleBound(100)`, taken from a module constant `STDERR_WAIT_ATTEMPTS`.
- [ ] **`test-timeout.test.mjs`.** Set `CHILD_TEST_TIMEOUT_MS = scaleBound(240_000)`. Amend its doc comment: the value is scaled, it is still always above the fixed `CHILD_BOUND_MS`, and at the cap of 5 it is 1 200 000 ms, below the parent suite's `--test-timeout` of 1 800 000 ms. Also state in the module header that `CHILD_BOUND_MS` stays fixed because it is the bound under test. The child inherits the parent's `HARNESS_TEST_TIME_SCALE`, but the child's `runBash` bound is the literal `CHILD_BOUND_MS`, so nothing in the child scales it.

**Verification:**

- Each of the five edited files passes when run alone through the per-file command, one plain foreground command each, from the repository root:
  - `npm test --workspace cli -- test/init.test.mjs`
  - `npm test --workspace cli -- test/run-test-suite.test.mjs`
  - `npm test --workspace cli -- test/outer-loop-scripts.test.mjs`
  - `npm test --workspace cli -- test/docs-retrieval.test.mjs`
  - `npm test --workspace cli -- test/test-timeout.test.mjs`
- `bash scripts/typecheck.sh` exits 0.
- `git diff dev -- cli/test/init.test.mjs cli/test/run-test-suite.test.mjs cli/test/outer-loop-scripts.test.mjs cli/test/docs-retrieval.test.mjs cli/test/test-timeout.test.mjs` adds or removes no `assert` call. The only `assert`-adjacent edits allowed are the outer-loop rejection message text and the `+ 20` slack operand.
- `grep -nE "RETURNS_PROMPTLY_MS = 3000|CHILD_BOUND_MS = 2_000|REAP_GRACE_MS = 500|sleep\((10000|5000|1000)\)" cli/test/init.test.mjs cli/test/test-timeout.test.mjs cli/test/run-test-suite.test.mjs` still returns every one of those fixed declarations and waits, unchanged.
