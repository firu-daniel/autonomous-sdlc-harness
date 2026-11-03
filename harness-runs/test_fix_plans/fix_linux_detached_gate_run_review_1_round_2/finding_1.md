### 1. `(q)` fails under full-suite load: the launcher's unscaled 30 s start window, and a gate log that drops the assertion

**Site:**
- `cli/test/launch-sandboxed-gates.test.mjs`:
  - the case `test('(q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding'` (near line 540, navigation hint only);
  - the fixture builder `launcherFixture`, at its library override `await appendFile(join(dir, LIB), \`\nhr_placeholder_host_probe_var() {` (near line 190);
  - the file header's sentence `The host answer is \`hr_placeholder_host_probe_var\` redefined at the end of the fixture's installed` (near line 20).
- The bound the launched-run path waits on: `HR_TEST_RUN_STALE_SECONDS=30` in `cli/templates/scripts/lib/harness-run-lib.sh` (self-adopted copy `scripts/lib/harness-run-lib.sh`). It is read by:
  - the launcher's start window, `deadline=$((SECONDS + HR_TEST_RUN_STALE_SECONDS))` and `did not start within ${HR_TEST_RUN_STALE_SECONDS}s` in `cli/templates/scripts/launch-sandboxed-gates.sh`;
  - `run-test-suite.sh`'s `STALE_SECONDS="$HR_TEST_RUN_STALE_SECONDS"`, which `run_alive` / `wait_for_verdict` use for `--wait`.
- The gate log's failure excerpt: `gate()` in `scripts/run-gates.sh`, the line `grep -E '^[[:space:]]*not ok ' "$log" | sed 's/^/        /' || true` (near line 67).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs`: `(q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding`

**Failure, as the log reports it:**

```
== gate 4 — init against a throwaway fixture
  FAIL  4 npm test (exit 1)
        not ok 356 - (q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding
        not ok 360 - (m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry
...
        # tests 3310
        # pass 3303
        # fail 2
        # skipped 5
        # duration_ms 2302661.677625
```

The log carries **no assertion detail** for test 356. `run-gates.sh` keeps only the `not ok` lines and the TAP tail, so it does not record which of the case's assertions failed.

**Diagnosis.**

1. **New this round, and not caused by a code change.** `(q)` passed in `review_1_round_1.log`. Between that run (started right after `90d8bdd9`) and this one (started right after `ac03c117`), `git diff --stat 90d8bdd9 ac03c117` lists only `harness-runs/test_fix_plans/fix_linux_detached_gate_run_review_1_round_1.md` and its `finding_1.md`. No script and no test changed.
2. **The failure moves between the launched-run cases.** On identical code:
   - round 1 failed `(g)(h)` and passed `(q)`, `(m)` and `(l)`;
   - round 2 failed `(q)` and `(m)` and passed `(g)(h)` and `(l)`.

   The round-1 fix pass showed that `(g)(h)` passes when its file is run alone (`# pass 16`, `# fail 0`, twice). These four cases all launch the main checkout as the target and collect a `pass`, and they share one path:
   - `f.launch` must answer `[3, 'pending\n']`;
   - `f.collect` must read `pass`;
   - `f.until(… 'bwrap-exited' …)` must see the stub exit.

   `(q)`'s other assertion, `assert.deepEqual(lines(f.record), expected)`, is deterministic: it passed in round 1 on the same tree. So the failure is load-dependent and sits on that shared path. That fits the suite's own record in `cli/test/helpers/timing.mjs`, choice 2: failures grow with host load. This run took about 38 minutes (`# duration_ms 2302661`).
3. **The one ceiling on that path that the suite cannot scale is the library's 30 s.** Every test-side ceiling in the file already goes through `scaleBound`: `RUN_TIMEOUT_MS = scaleBound(90_000)`, `POLL_LIMIT = scaleBound(600)`. The script-side ceilings do not:
   - The launch form gives its detached supervisor `HR_TEST_RUN_STALE_SECONDS` (30 s) to claim `.running`. Otherwise it refuses with exit 2: `the sandboxed gate run of gates_round_1 did not start within 30s`.
   - To get there, the supervisor runs a lot of shell work. It:
     - re-sources the 6 500-line library;
     - re-runs checks 1–9 and 11, which call `git`, `jq` and `hr_canonical_path_nogit` (one subshell per `denyWrite` entry and per credential path);
     - starts the `bwrap` stub.

     Then the target's `run-test-suite.sh` sources the library again and calls `hr_repo_root`, `hr_state_dir`, `hr_current_branch` and `hr_command` twice before it writes `.running`.

     That is hundreds of forks, on a host where the whole suite is running files in parallel.
   - The same constant is also `--wait`'s staleness bound (`run_alive`): a heartbeat older than 30 s reads as `no run in flight`.

   A load stall past either bound fails the first or the second assertion of every launched-run case. Which case it hits depends on when the stall happens, and that matches the case-to-case movement in point 2. The static reading names no other cause: `(q)`'s registry (`hr_registry_foreign_copy_var` over a record whose `worktree` is the fixture) took the job-mode branch in round 1 on the same code.
4. **Why round 1's fix did not hold.** Round 1 marked its finding "already passing" from a single-file run. That run cannot reproduce load, and the gate log could not say which assertion had failed. Without the second half of this fix, a recurrence would leave the next round just as blind.

**Fix.**

- [ ] **Scale the library bound in the fixture, not in the launcher.** In `launcherFixture`, in the same `appendFile(join(dir, LIB), …)` that redefines `hr_placeholder_host_probe_var`, also append `HR_TEST_RUN_STALE_SECONDS=<n>`. Take `<n>` from a new module constant, e.g. `const STALE_BOUND_S = scaleBound(30);`.
  - **Reach:** the fixture's launcher, its supervisor and the fixture's own `run-test-suite.sh` all source that one installed library. So this one line widens the launcher's start window, its check-10 live bound and `--wait`'s staleness for every case in the file.
  - **Why not an environment seam:** do **not** add one to `launch-sandboxed-gates.sh`. Its header states that `RUN_TEST_SUITE_STALE` is not honoured there and that no environment variable decides anything in it. It is an `excludedCommands` script, and an environment-read surface added for a test is a review finding.
  - **Check the value stays well below the launch's own runner ceiling,** so a broken run still fails on the launcher's refusal rather than on `runBash`'s kill. `scaleBound(30)` seconds and `RUN_TIMEOUT_MS = scaleBound(90_000)` ms scale by the same multiplier, so the 30 s : 90 s ratio holds at every accepted scale.
  - **Why this does not mask a defect:** this is a ceiling under `cli/test/helpers/timing.mjs`'s rule, not a bound under test. No case in this file asserts the 30 s value or the `did not start within` refusal. Case `(f)` writes a fresh `.running` and still answers `pending` under any wider bound. A launcher that never starts still fails `(q)` on its `[3, 'pending\n']` assertion, only later.
- [ ] **Amend the file header** (the paragraph beginning `The host answer is \`hr_placeholder_host_probe_var\` redefined …`) in the same edit:
  - say that the library's `HR_TEST_RUN_STALE_SECONDS` is redefined there too, scaled through `scaleBound`;
  - say why: the launcher's start window and `--wait`'s staleness are ceilings, and a fixed 30 s fails launched-run cases at random under full-suite load, as recorded in this finding.

  This follows `.claude/context/cli.md`: a reviewer holds a change to its module's own header.
- [ ] **Make the gate log carry the failing assertion.** In `scripts/run-gates.sh` → `gate()`, change the `grep -E '^[[:space:]]*not ok '` excerpt so that each `not ok` line is followed by its TAP YAML diagnostic block: the indented `---` … `...` lines that `node --test` writes right after it, carrying `error:`, `expected:`, `actual:` and `location:`.
  - Cap each block at a fixed line count, e.g. 40, so one huge diff cannot flood the log.
  - Keep the `|| true` semantics: no match is normal.
  - Keep the 25-line tail unchanged.
  - Use `awk` or a `while read` loop that is portable to `/bin/bash` 3.2 and BSD tools: gate 16 parses every shell file with bash 3.2.
  - `scripts/run-gates.sh` is repo-only. There is no `cli/templates/scripts/run-gates.sh` twin to keep byte-identical.
- [ ] **Do not touch the scripts' logic.** If any edit to `launch-sandboxed-gates.sh` or `harness-run-lib.sh` turns out to be needed after all, edit `cli/templates/scripts/…` **and** its self-adopted copy under `scripts/…` together and keep each pair byte-identical, as commits `08afd3af` and `8e3175bf` did.
- Do not delete, skip or weaken any assertion of `(q)`, and do not lower `HR_TEST_RUN_STALE_SECONDS` in the shipped library.
