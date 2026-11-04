`fix_linux_gate_sandbox_findings` fixes what the third Linux run of the sandbox probe (Gate 15, 2026-11-03) found on `dev` at `df1b5619`, the merge of #239 (`fix_linux_detached_gate_run`, #232). Then the Linux rows that run could not take can be taken again.

The run confirmed #239's central claim. On Linux, a gate run that the main checkout's excluded launcher starts under its own `bwrap` sandbox outlives the session's Bash call and yields a verdict. But the verdict was `fail`, from gate failures inside the worker's sandbox. The rows that measure that sandbox's boundary (GS1–GS4: no network, writes only to the run copy, no credential read) printed `not run`, because the probe ran them on a clone an earlier leg had changed. Until GS1–GS4 pass, the boundary the user's ruling on #232 requires is unmeasured. This branch makes the next container run able to measure it, and makes a Linux gate run able to pass.

This is a follow-up in the sandbox3b1 family. The earlier ones are #212 (3b1b), #219 (3b1c), #220 (3b1d), #221 (3b1e), #229 (3b1f) and #232 (3b1g).

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `docs/sandbox-verification.md`:
  - §0, *The probe's third Linux run (2026-11-03)* and *The probe's fourth run (2026-11-03), macOS, the `gates` leg*.
  - §5, the rows **T3**, **F10**, **F11**–**F14**, **PD28**, **PD29** and **PD30**.
  - §8, **GS1**–**GS4**, **WF5** and **CL5 (Linux)**.

  These rows are written by `chore_record_linux_gate_launcher_probe`. If that branch has not merged when this runs, the results are quoted below.
- `scripts/launch-sandboxed-gates.sh`: the header (THE CHECKS, THE BWRAP VECTOR) and the vector's built-in protected paths.
- `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`, `legs-local.sh` (T3's grading), `legs-protection.sh` (CL5, `sp__git_lock_reading`) and `judge.sh` (`SP__LINUX_SANDBOX_STRINGS`).
- `scripts/run-gates.sh`, gate 6a (`machine_path_hits`).
- `cli/test/launch-sandboxed-gates.test.mjs` → `pathWithoutBwrap` and case `(c)`; `cli/test/doctor-profile-sandbox.test.mjs` → case `(d) warns when docs retrieval is on and the docs-search-server entry is gone`.

## What was measured (2026-11-03, verbatim from the run)

Claude Code 2.1.317, Debian 12 container on colima (Ubuntu 24.04 VM, aarch64), bubblewrap 0.8.0, git 2.39.5, `kernel.apparmor_restrict_unprivileged_userns` read `0`. Probe branch `chore_sbx_probe_20261103191423`, cut from `origin/dev` at `df1b5619`. Exit `4`, with 64 result lines: 52 `pass`, 2 `fail` and 10 `not run`. The macOS `gates` leg ran on the same host at the same time.

- **T3 `fail`.** The launcher answered `pending`, and the worker ran both gates and wrote a verdict after the session ended. The suite reported `# tests 3307`, `# pass 3283`, `# fail 2` and `# skipped 22`, with `# duration_ms 2358624.622577`. The lane log ends `== run-test-suite.sh: gate test exited 1 ==`. Gates that failed: `FAIL  4 npm test (exit 1)` and `FAIL  6a no machine paths (printed output, which is the finding)`.
- **GS1–GS4 and WF5 `not run`.** `the launcher answered 'launch-sandboxed-gates.sh: <clone>/.git/config sets branch.dev.remote, branch.dev.merge, which the clone allow-list does not hold, so this clone's configuration is not trusted', not pending`. T3's launcher call on the same clone, earlier in the run, was accepted.
- **CL5 `not run`.** `Exit code 255: error: could not lock config file .git/config: File exists; .git/config.lock read: before the session absent, inside the session crw-rw-rw- 1 nobody nogroup 1, 3 Nov  3 19:07 .git/config.lock, after it absent`.
- **CS14, CS8 and R3 `pass`.** PD25–PD27 are confirmed.
- **BG9 `fail` and LB5 `not run`.** These are expected: they record F10's fact that a process detached inside a sandboxed call dies with it.
- **macOS, `run --leg gates`.** T2 and W7 `pass`.

## The findings this branch fixes

1. **PD29: the `gate-sandbox` leg runs on a clone earlier legs changed.** Something between the `gates` leg and the `gate-sandbox` leg wrote `branch.dev.remote` and `branch.dev.merge` into the probe clone's `.git/config`, and the launcher's trust check correctly refused the clone. Find the leg that writes them; this run did not trace it. Then give `gate-sandbox` a clone no earlier leg has touched (its own extra clone, as `wrappers-refresh` and `planted-files` have), or move it before every leg that changes the clone, and say which in the leg's header. Add a fixture that fails if the leg's target carries keys outside the clone allow-list. The launcher's refusal is correct and does not change.
2. **PD28: decide CL5 on the readings.** Inside the session, `.git/config.lock` was a character device `1, 3`, which is `/dev/null`, and it was absent before and after the session. That is the placeholder bubblewrap mounts at an absent `denyWrite` path (§5 F9). So `could not lock config file .git/config: File exists` is a sandbox refusal on Linux. Add the shape to the judge's Linux table under the sandbox layer. Replace the `PD28:` fixture in `cli/test/sandbox-probe-judge.test.mjs` that pins the shape out, and grade CL5 from the shape plus the inside reading.
3. **PD30: T3's evidence quotes the wrong line.** After `the launcher answered pending;`, the evidence quoted a line of gate 6a's printed output, a passage of a document that gate 6a's search matched, instead of naming the gates that failed. T3's evidence should name each `FAIL` line of the lane log and the suite's counts. Add a fixture for this.
4. **F11: gate 6a fails inside the launcher's sandbox on its own `grep` errors.** Gate 6a printed `grep: ./.bash_profile: Permission denied`, `grep: ./.vscode: Permission denied` and `grep: ./.ripgreprc: Permission denied`. These are three of Claude Code's built-in protected root paths, which the launcher's vector binds read-only or pins with a placeholder. Gate 6a is read from its output, so these lines alone fail every unattended Linux Run gates round. Establish from the vector why a read is denied: the evidence does not show it. Then make gate 6a not fail on them without hiding a real hit, for example by excluding exactly the built-in paths the vector pins, or by keeping `grep`'s errors out of the graded output while still failing on an unreadable file that could hold a path. Fix it in both `scripts/run-gates.sh` and its template if the template carries the gate. Add a fixture.
5. **F12: `launch-sandboxed-gates.test.mjs` case `(c)` fails wherever `bwrap` and `bash` share a directory.** The failure is `spawn bash ENOENT`. `pathWithoutBwrap()` drops every `PATH` directory holding an executable `bwrap`, and on Debian 12 that is `/usr/bin`, where `bash` also lives. This is a test assumption that fails on any such host, and a GitHub-hosted Ubuntu runner is expected to be one. Make the case hide only `bwrap`, for example with a `PATH` built from stub directories that link every tool the launcher needs except `bwrap`. Keep what it asserts.
6. **F13: `doctor-profile-sandbox.test.mjs` case `(d)` fails inside the launcher's sandbox on Linux.** The failure is `init --force exited 2`, and its diagnostic was cut after 40 lines, before the cause. It passed on macOS and in #239's own Run gates. Reproduce it under the launcher's `bwrap` vector, or a stand-in carrying the same binds, find the cause, and fix the test or the code. If it can only be reproduced in Gate 15's container, have the case print the line that names the cause, so the next container run shows it. Do not mark it skipped on Linux.
7. **F14: gate 6a cannot pass in Gate 15's container.** The recipe runs as the user `probe`, and committed files name that user's home directory literally:
   - `docs/development.md`'s recipe and `docker cp` lines;
   - `docs/sandbox-verification.md`'s run records;
   - earlier sandbox-series run artifacts under `harness-runs/` (task prompts, plans, user reviews).

   Inside the container `$HOME` is that directory, so gate 6a finds them. Settle in the plan how the tree stops naming it: placeholders in the records, `~`/`$HOME` spellings in the recipe where a shell expands them, and a decision for the absolute `docker cp` source paths and the historical run artifacts. A gate 6a exclusion for that one path is not a fix. Recording it as a residual is acceptable only if the plan shows no rewrite works, and then the recipe says gate 6a is expected to fail in the container, and why.

## The goal

1. Every finding above is fixed, with a fixture in the suite, or, for F13 if its cause cannot be reproduced here, made to print its cause.
2. A Linux gate run started by the launcher can pass: none of F11–F14 is left to fail it.
3. `docs/sandbox-verification.md`'s §5 rows F11–F14 and PD28–PD30, and the §8 rows GS1–GS4, WF5 and CL5 (Linux), read as fixed by this branch, with confirmation owed to the next Gate 15 container run. **No measured result is invented.** GS1–GS4 stay `not yet measured` until that run takes them.
4. macOS behaviour and every macOS verdict are unchanged.

## Constraints

- The launcher's trust check, its refusal of a clone with untrusted configuration, and the `bwrap` vector's boundary (no network, writes only to the target, protected paths read-only, credentials masked) do not loosen. A fix that needs one of them changed parks with the reason.
- No new `excludedCommands` entry, and no `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
- The Linux result is taken by hand afterwards, in Gate 15's container, by `run --leg gates --leg git --leg gate-sandbox`. This branch does not take it.
