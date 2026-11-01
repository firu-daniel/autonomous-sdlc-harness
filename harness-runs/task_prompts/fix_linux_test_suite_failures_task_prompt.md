`fix_linux_test_suite_failures` makes the CLI test suite pass on Linux, apart from the run-analytics failures sandbox3b1d covers. The suite was run on Linux for the first time while #212 (`fix_linux_sandbox_deny_placeholders`) was verified. Five failing tests are neither #212's nor jq's. They fall in three groups, and each may be a test that assumes macOS or a real Linux defect in the code under test. The plan says which, for each one.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What was measured (2026-10-30)

`npm test --workspace cli`, run as a non-root user in Gate 15's container (`docs/development.md`, *A Linux run, in a local container*). The container was Debian 12 (`node:22-bookworm`, so Node 22, with git 2.39.5), on a colima VM running Ubuntu 24.04, aarch64, kernel 6.8.0-117, on `dev` at `1a41540c`. Results: 2,850 tests, 2,807 passed, 21 failed (the count includes parent tests), 22 skipped. Apart from the five tests below, every failure is sandbox3b1d's jq error.

**The baseline is out of date.** `dev` has moved since `1a41540c`: #216, #223 and #224 merged, and #224 (`fix_linux_sandbox_sibling_glob_trio`) adds test files that have never run on Linux. Among them are `git-trust-file-guard.test.mjs`, `clone-trust-check.test.mjs`, `placeholder-sweep-lib.test.mjs` and `watcher-placeholder-host.test.mjs`, and `watcher-run-profile.test.mjs` grew. The run re-measures the suite on the current `dev` in the same container before planning, and plans against that measurement. A new failure that fits one of the groups below joins it; one that fits none is a fourth group, with the same test-or-code question.

## 1. `spawn E2BIG` (2 tests)

- `remote-control-mention.test.mjs`: *an oversized diff is cut at a whole line with the cut note*. `error: 'spawn E2BIG'`.
- `watcher-stall-reset-payloads.test.mjs`: *(J6) a forged base in the job checkout: the real doctor judges from the recorded commit and refuses*. `error: 'spawn E2BIG'`, plus *"generated asynchronous activity after the test ended"*.

Linux limits each single argument or environment string to 128 KiB (`MAX_ARG_STRLEN`), on top of the total `ARG_MAX`. macOS has only the total limit, so the same spawn succeeds there.

**Why it may matter beyond the tests.** The mention path runs on GitHub-hosted Linux runners (`remote-run.sh control`, `/autonomous-sdlc-harness:harness-read-mention`). If the code under test, rather than the test, passes an oversized diff or payload as one argument or environment value, a large enough diff fails there in real use.

**For the plan to verify:** find which spawn carries the oversized value, the test's own or the code's. If it is the code's, pass the value through a file or stdin and keep the existing cut. If it is only the test's, make the test pass it the way the code really does.

## 2. `Author identity unknown` (2 tests)

- `remote-start.test.mjs`: *a feat_x already on origin exits 4 and sends no workflow run*.
- `remote-start.test.mjs`: *a push of the prompt commit after origin/feat_x moved exits 4, names the commit and leaves nothing local*.

Both fail in fixture setup:

```
fixture setup: `git commit-tree <tree> -p <parent> -m someone else` exited 128: Author identity unknown
fatal: unable to auto-detect email address (got 'probe@b6e01aa5ca60.(none)')
```

The container's user had a global `user.name` and `user.email`, so the fixture runs git without them, presumably with an isolated `HOME`. macOS's git then falls back to an address it can build from the host name. A container, or a CI runner without a resolvable domain, cannot.

**For the plan to verify:** give these fixtures, and any other fixture that commits under an isolated `HOME`, an explicit identity (`GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL`/`GIT_COMMITTER_*` or `-c user.*`), wherever the shared fixture helper (`cli/test/helpers/fixture.mjs`, `runGit`) is the right place. Check whether other tests pass only because of the host's fallback. That includes #224's tests that commit in a fixture, `clone-trust-check.test.mjs` and `watcher-run-profile.test.mjs`, which postdate the measurement above.

## 3. The cleanup sweep's fetch bound does not release its pipe on Linux (1 test)

- `outer-loop-scripts.test.mjs`: *the sweep bounds a hanging fetch and releases its output pipe*.

```
the sweep took 300.1s against a 3s ceiling — the fetch's transport is still holding the pipe
```

The test puts a `git` shim first on `PATH` that runs `sleep 300` for `fetch`. It expects `cleanup-merged-worktrees.sh` to bound the fetch, at `HARNESS_FETCH_TIMEOUT` set to 3 s, and to return with its output pipe released. On macOS it passes. On Linux the sweep returned only when the `sleep` ended.

**Why it may matter beyond the test.** The watcher runs the sweep every five minutes. A real fetch whose transport hangs on Linux would stall it for as long as the transport lives, which is the case the bound exists for.

**For the plan to verify:** read how the sweep bounds the fetch, and which arm runs on Linux versus macOS (a `timeout` binary, a perl `alarm`, a background-and-kill). Find why a grandchild survives and keeps the pipe open there: a signal sent to one process rather than its process group, or a `timeout` that kills only its direct child. Fix the bound so it holds on both, and keep the test as the proof.

## Constraints

- The macOS results are unchanged. The suite passes on macOS as before.
- Each fix is shown to work on Linux by the same container run: `npm test --workspace cli` in Gate 15's container, on this branch's head before merge. `docs/development.md` → *The absent-path check, by hand* describes how: clone the branch, then `git checkout -B dev`. The branch records which group was a test assumption and which a code defect.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
