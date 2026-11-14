### Task 4 — Test the probe's grading and its teardown against a temp work base

**Goal:** Pin `scripts/gate-worker-start-probe.sh`'s grading for every verdict class, its refusal, and its promise to remove only what it created. These are the parts a later re-take of F17 depends on, and none of them needs a sandbox to exercise.

**Depends on:** Task 1, which ships the probe with this interface. This task restates it and tests it.

- `bash scripts/gate-worker-start-probe.sh [--work <base>]`. It creates one `gwsp.XXXXXX` directory under `<base>`, which defaults to `<root>/<state_dir>/scratch`, and removes that directory and nothing else on every exit path. A `<base>` that is absent is a refusal: exit 2, nothing created.
- Seven legs in order: `env`, `sandbox`, `nohup`, `detach`, `launch-line`, `run-form`, `tmpdir`. Each prints a `== gwsp: <leg> ==` block and then one `gwsp: <leg>: <verdict> — <evidence>` line. Verdicts:
  - `env`: `info`.
  - `sandbox`: `sandboxed` | `unsandboxed` | `not run`.
  - `tmpdir`: `pass` | `fail`.
  - All others: `pass` | `fail` | `not run`.
- `bash scripts/gate-worker-start-probe.sh judge <leg> <records dir>` re-grades one leg from the records Task 1's header names, reading only that directory.
- The `launch-line` leg first creates the fixture's lane directory (through the copied library's `hr_test_run_lane_dir`) and clears stale `gwsp_launch.*` files, as the run form does. A failed setup grades `not run`, quoting the failing command. Its records include the setup's status and message, the lane listing, and whether `gwsp_launch.running` and `gwsp_launch.verdict` are present. `pass`: the verdict is on disk. `fail`: the lane exists and no verdict reached it.
- Exit map: 0 when every leg printed its line, 1 for usage, 2 for a refusal before any leg ran, 5 when teardown left something.
- The `sandbox` leg writes under `$HOME`, the `tmpdir` leg under `$TMPDIR`, and the `env` leg runs `claude --version`.

**Where this layer stops.** This task adds a test and changes no probe code. A grading defect it finds is reported in its return for Task 1's owner, and is not fixed here.

### Targets

- `cli/test/gate-worker-start-probe.test.mjs` (new) — opens with the rule it exists to enforce, *"the probe grades each leg from its records alone, refuses a work base it cannot use, and leaves its work base, `$HOME` and `$TMPDIR` as it found them"*. It also says what it does not cover: whether any verdict is right under a real sandbox, which only an in-session run measures (Task 6's record).

**Work:**

- [ ] **`judge`, per leg, per verdict class.** For each of `sandbox`, `nohup`, `detach`, `launch-line`, `run-form` and `tmpdir`, plant a records directory under the test's `os.tmpdir()` fixture for every verdict that leg can print, and assert the exact summary line `judge` prints. That includes `detach: fail` (the `nohup` arm wrote no marker, the trap arm did), `launch-line: not run` (a non-zero lane-setup status, its message quoted), `launch-line: fail` (setup succeeded, the lane listing holds no `gwsp_launch.verdict`, with the stderr record and the listing quoted in the evidence) and `run-form: fail` (exit 2 with `the detached run of gwsp_run did not start`, with a planted `gwsp_run.start` quoted in the evidence).
- [ ] **One live run against a temp work base**, unsandboxed as the test runner is. Use `--work <tmp base>`, with `HOME` and `TMPDIR` set to their own fresh temp directories and a `claude` stub first on `PATH` that prints a fixed version line. Assert exit 0 and exactly seven summary lines, in the leg order above, each carrying a verdict from that leg's vocabulary. Do **not** assert any particular verdict: this suite also runs inside Phase G's sandboxed gate run, where the `nohup` legs may read `fail`. Do assert the one structural fact that holds sandboxed or not: the `launch-line` block's lane listing shows the lane directory existing, so the leg's setup ran.
- [ ] **Teardown, on disk.** After the live run, the work base, `HOME` and `TMPDIR` each hold exactly the entries they held before it, compared as directory listings.
- [ ] **Refusal.** `--work <absent path>`: exit 2, nothing on stdout, and nothing created at or under that path. A bad argument gives exit 1.

**Verification:**

- `npm test --workspace cli -- test/gate-worker-start-probe.test.mjs`, from the repository root, as one plain foreground command, passes.
- The suite builds every fixture under `os.tmpdir()` and never points `--work` at this checkout. Grep the file for a literal `harness-runs` path, or for a `--work` value built from the repository root, and find none.
