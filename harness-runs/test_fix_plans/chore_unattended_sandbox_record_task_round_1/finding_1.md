### 1. gate12-sandbox-round-default-branch.test.mjs hangs until the 30-minute file timeout

**Site anchor:**
- `cli/test/gate12-sandbox-round-default-branch.test.mjs` — every `runRound(fixture, ARGS, { env: ENV })` call (first at `test('a leg whose job starts restores the default and both variables and keeps the other branch recorded'`, around line 94), and the SIGINT case's two unbounded waits, `const closed = new Promise((resolve) => child.on('close'` and `if (/^planted JS3 stall /m.test(stdout)) resolve();` (around lines 173–180).
- `cli/test/helpers/gate12-round.mjs` — `export function runRound(fixture, args, { env = {}, script = ROUND_SCRIPT } = {})` (around line 276), which calls `runBash(fixture.dir, [script, ...args], { PATH: stubPath(fixture), ...env })` with no bound.
- Conditional, `general` layer (root `scripts/`, not under `cli/`) — reached only by the last sub-step below: the round driver `scripts/gate12-sandbox-round.sh` and its library `scripts/lib/gate12-sandbox-round/`, chiefly the failed-dispatch path `g12_dispatch()` in `plant.sh` and `g12_db_leg()`, `g12_db_wait()` and `g12_db_restore()` in `default-branch.sh`. Edits here are graded against `.claude/context/conventions.md`, not `.claude/context/cli.md`.

**Failing test:** `cli/test/gate12-sandbox-round-default-branch.test.mjs` — reported by the log as the file itself (`not ok 38 - cli/test/gate12-sandbox-round-default-branch.test.mjs`), `failureType: 'testTimeoutFailure'`.

**Failure, quoted from the log (gate 4, `npm test`):**

```
  FAIL  4 npm test (exit 1, 2444 s)
        not ok 38 - cli/test/gate12-sandbox-round-default-branch.test.mjs
          ---
          duration_ms: 1800006.459625
          location: 'cli/test/gate12-sandbox-round-default-branch.test.mjs:1:1'
          failureType: 'testTimeoutFailure'
          error: 'test timed out after 1800000ms'
          code: 'ERR_TEST_FAILURE'
          ...
        # tests 3618
        # pass 3609
        # fail 0
        # cancelled 1
        # skipped 8
```

The round's per-file timing record (`harness-runs/test_run_logs/chore_unattended_sandbox_record/task_round_1.full.tests.tsv`) carries the row `test/gate12-sandbox-round-default-branch.test.mjs	fail	1809.5	2	1`: two top-level events for the file, one of them the file-level timeout (1800.0 s), so exactly one top-level case reported a pass, in about 9.5 s, and nothing after it reported at all.

**Class:** new this round (round 1; no earlier log to compare against).

**Diagnosis:**
- The file did not fail an assertion: it was cancelled by `--test-timeout=1800000` (`cli/package.json` → `scripts.test`) after one top-level case passed. Cases run in declaration order, so the first case (`a leg whose job starts …`) is the one that passed and the second, `a failed dispatch restores everything and keeps the JS3 branch recorded; a second leg then refuses, naming teardown` (`remoteRunExit: 3`), is the first that never reported — either it or something it awaits blocked for the remaining ~30 minutes.
- This branch's changes do not reach the code the file exercises. Between the branch point and `HEAD`, the only changes under `scripts/lib/gate12-sandbox-round/` are one string constant in `grade-full-run.sh` (`G12_FR4_DEPARTURE`) and one comment in `grade-plant.sh`; `default-branch.sh`, `plant.sh`, `state.sh`, `core.sh`, `scripts/gate12-sandbox-round.sh` and `cli/test/helpers/gate12-round.mjs` are untouched. Reading the failed-dispatch path in the current tree (`plant.sh` → `g12_dispatch` returns 3 when `remote-run.sh` exits non-zero; `default-branch.sh` → `g12_db_leg` returns that status with no run recorded, so `g12_db_wait` is never entered; `g12_db_restore return` clears the traps) shows no loop or wait that cannot end. The hang is therefore not explained by the source alone: a host-load stall or a child that blocked (git push to the bare origin, the `gh` stub's `node` process, `jq`) is the likely shape, and the log does not say which.
- What makes it cost 30 minutes instead of failing fast and naming itself is the test file: every `runRound` call goes through `runBash` with no `timeoutMs`, so `runBash` takes its unbounded `run` path, and the SIGINT case awaits `closed` and the `planted JS3 stall` line with no ceiling either. `cli/test/helpers/timing.mjs` states the suite's rule — *every "until X happens" ceiling in `cli/test/` goes through `scaleBound`* — and `cli/test/helpers/fixture.mjs` choice 6 states why a bound must sit below the runner's timeout: the runner kills the file's process and leaves the detached group running, while `runBash`'s own `timeoutMs` kills the whole process group and rejects naming the command. This file has neither, so a stuck child is invisible until the file is cancelled, with no stdout/stderr from it.

**Concrete fix:**
- [ ] In `cli/test/helpers/gate12-round.mjs`, let `runRound` accept an optional `timeoutMs` in its options object and pass it to `runBash` as its fourth argument (`{ timeoutMs }`), only when given — the other gate12 suites that call `runRound` keep their current behaviour. Update the JSDoc `@param` for the options.
- [ ] In `cli/test/gate12-sandbox-round-default-branch.test.mjs`, pass a `scaleBound(…)` ceiling on every `runRound` call — a single module-level constant (e.g. `const ROUND_BOUND_MS = scaleBound(120_000);`) is enough; it must stay well below 1 800 000 ms at the maximum scale of 5 (120 000 × 5 = 600 000). The leg's own waits in this file are seconds long (`G12_DB_POLL_SECS: '1'`, `G12_RUN_LOOKUP_TRIES: '1'`, `--wait-secs 1` where passed); the one case that waits on purpose, `a SIGINT while the leg polls …`, uses the default 600-second `--wait-secs` and is interrupted, so it does not go through `runRound`.
- [ ] In the SIGINT case, bound the two waits that can block forever — the wait for the `planted JS3 stall` line and `await closed` — with a `scaleBound(…)` ceiling that rejects with the collected stdout/stderr, and make the rejection path kill the child (`SIGKILL`) so no polling `bash` outlives the case.
- [ ] Update the file's header comment only if it states something these bounds change; it currently states the rule the suite enforces and that it owes no `treeGuards` entry, both unaffected.
- [ ] If, with the bounds in place, a case is found genuinely stuck in the round driver (not just slow), fix the cause in the `general`-layer round driver (`scripts/lib/gate12-sandbox-round/`, or `scripts/gate12-sandbox-round.sh` if the cause sits there — see the conditional site anchor above) and record what it was in this file's deviation note; do not loosen an assertion, skip a case or raise the bound past the runner's timeout to get a pass.
