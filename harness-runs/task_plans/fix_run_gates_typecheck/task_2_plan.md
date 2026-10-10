### Task 2 — Pin the two-gate wrapper in `cli/test/run-test-suite.test.mjs`

**Goal:** Add the cases goal 7 of the task prompt names, so the two-gate behaviour of `run-test-suite.sh` is asserted against the bytes `init` writes into a throwaway fixture: the outcome matrix, `<none>`, the per-gate log markers, and each command running exactly once.

**Depends on:** Task 1, which makes `cli/templates/scripts/run-test-suite.sh` behave as follows. These are the facts the new cases assert, restated so this task does not guess:

- Typecheck runs first, then test, each exactly once per run form, and the test runs even when the typecheck failed.
- Verdict `pass` only when both pass, otherwise `fail <log path>` (exit 1). Stdout carries only that line, and stderr is empty.
- Log marker lines, byte-exact:
  - `== run-test-suite.sh: gate typecheck (commands.typecheck) ==` … `== run-test-suite.sh: gate typecheck exited <status> ==`
  - with `<none>`: `== run-test-suite.sh: gate typecheck not run: commands.typecheck is <none> ==` after the typecheck header
  - `== run-test-suite.sh: gate test (commands.test) ==` … `== run-test-suite.sh: gate test exited <status> ==`
- `commands.typecheck` unset → exit 2, stderr exactly `run-test-suite.sh: commands.typecheck is not set in harness.config.json\n`, nothing written.

### Targets

- `cli/test/run-test-suite.test.mjs`

**Work:**

- [ ] Header and fixture. Amend the header's rule sentence to *"runs `commands.typecheck` and then `commands.test` exactly once each per invocation, decides one verdict for the pair, …"*, and say that `<none>` is asserted as not run and never as a pass. Add a second counting stub, `typecheck-stub.sh`, with its own counter file and markers (e.g. `TC-STUB-STDOUT-MARKER` / `TC-STUB-STDERR-MARKER`) and its exit status from `TC_STUB_EXIT`. Give `seededConfig()` / `wiredFixture()` an optional typecheck override. The **default stays `typecheck: 'echo typecheck'`**, so every existing case runs unchanged and keeps passing, which is the deliberate choice: none is altered.
- [ ] The outcome matrix, one case each, wired with `typecheck: 'bash typecheck-stub.sh'`:
  - typecheck fails / test passes;
  - typecheck passes / test fails;
  - both fail;
  - both pass.

  Each asserts the exact stdout (`fail <LOG_DIR>/task_round_1.log\n` or `pass\n`), the exit status, an empty stderr, **both counters equal to `['ran']`** (the "exactly once" assertion, and in the both-fail and typecheck-fail cases the proof that the test still ran), and both stubs' markers in the log.
- [ ] Log markers and their order. In the both-pass case and in one failing case, assert the literal marker lines above, with `<status>` substituted (`exited 0` / `exited 1`), and that the typecheck header's index in the log is below the test header's index.
- [ ] `<none>`. Seed `typecheck: '<none>'`; `init` accepts the sentinel and writes no `typecheck.sh`. With the test passing, assert `pass\n`, the not-run marker line in the log, no typecheck counter file, and the test counter `['ran']`. With the test failing (`STUB_EXIT: '1'`), assert `fail …`, which shows `<none>` neither passes nor masks a failing round.
- [ ] Refusal and wait. For the refusal, after `init`, rewrite `harness.config.json` without `commands.typecheck` and assert exit 2, the exact stderr line, empty stdout, neither counter written, and `snapshotTree` unchanged. For the wait form, after a run that failed on typecheck alone, assert that `--wait task_round_1` reprints the same `fail` line and that both counters are still `['ran']`.

**Verification:**

- `npm test --workspace cli -- test/run-test-suite.test.mjs`, from the repository root, as one plain foreground command. It is this task's own edited test file, so the test-run rule admits it, and `pretest` compiles first. Read the counts and the exit status. Every existing case and every new case passes.
- This file is where Task 1's wrapper is exercised end to end: each case runs the template `init` copied into a fixture, so a passing run is the evidence that the wrapper is wired as Task 1 states.
