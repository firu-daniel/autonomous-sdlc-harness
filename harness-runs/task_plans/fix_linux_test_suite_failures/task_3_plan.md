### Task 3 — Bound the sweep's fetch by process group whenever its stdout is not a terminal, with a pseudo-terminal case as the proof

**Goal:** Fix group 3. When a hung `git fetch` is killed, `cleanup-merged-worktrees.sh` must release its output pipe whether or not a controlling terminal is attached. Prove it with a case that runs the sweep under a pseudo-terminal. That case skips, with a reason naming the refusal, only where `script` cannot get a pseudo-terminal, as in this run's command sandbox.

**Verdict to record (group 3): a code defect. It depends on whether a terminal is attached, not on Linux.**

- **The mechanism.** `cli/templates/scripts/cleanup-merged-worktrees.sh` → `run_bounded` picks its kill with `if { : > /dev/tty; } 2>/dev/null; then grouped=0; fi`.
  - **When `/dev/tty` opens:** it skips `set -m` and, on expiry, signals only the direct child.
  - **What the child leaves behind:** `git fetch` runs its transport as a child of its own. In the test, the shim's `sleep 300` plays that transport. The grandchild inherits the sweep's stdout and keeps the pipe open after its parent dies.
- **Why it failed in Gate 15's container and not in a headless macOS run.**
  - Gate 15's recipe (`docker run -it … bash`, then `su - probe`) gives the suite a controlling terminal, which is why the measured run took 300.1 s against a 3 s ceiling.
  - A macOS run with no terminal attached, such as a gate run from a Claude Code session, takes the group kill and passes.
- **The reproduction this task rests on: taken by hand, by the user, on macOS (park 2 answer, `harness-runs/clarifications/fix_linux_test_suite_failures/answer_2.md`).** This run's sandbox refuses `script` a pseudo-terminal, so the run cannot take it itself (see **Deviations from plan** below).
  - **Where:** from a macOS terminal, outside the sandbox, in this run copy with the **unchanged** `cleanup-merged-worktrees.sh` and this task's uncommitted proving case.
  - **The command:** `npm test --workspace cli -- --test-name-pattern="terminal is attached" test/outer-loop-scripts.test.mjs`.
  - **The result, verbatim:** `✖ the sweep releases its output pipe on a bounded fetch when a terminal is attached (53490.398708ms)`, failing with `AssertionError [ERR_ASSERTION]: the sweep took 53.0s against a 3s ceiling — the fetch's transport is still holding the pipe`.
  - **What it settles:** the ceiling was breached with a terminal attached, so the terminal mechanism is confirmed on macOS against the current script. The plan's earlier gate, *"this task must not fix a mechanism it has not reproduced"*, is met by this reproduction. **Do not try to reproduce it again inside the run.**
- **The real case.** `autonomous-watcher.sh` reads the sweep through a pipe (`"$CLEANUP_SCRIPT" 2>&1 | while IFS= read -r line; …`). Started from a terminal, the watcher would block for as long as a hung transport lives.
- **The fix.** Decide on what the kill has to release, the sweep's **stdout**, not on whether any terminal exists:
  - **stdout is a terminal (`[ -t 1 ]`):** a person is reading it directly. Keep the child in this script's group, so `ssh` can still prompt for a key passphrase on `/dev/tty`, and signal the child alone.
  - **stdout is anything else:** a pipe or a file can be held open by a surviving transport, so take the group kill, whether or not a controlling terminal exists.

**What already exists in the working tree.** An earlier attempt at this task left two uncommitted edits in `cli/test/outer-loop-scripts.test.mjs`, and this task owns and finishes both:

- the case *"the sweep releases its output pipe on a bounded fetch when a terminal is attached"*, with its `PTY_MARKER` constant, placed after *"the sweep bounds a hanging fetch and releases its output pipe"*;
- the paragraph *"TWO CASES, ONE WITHOUT A TERMINAL AND ONE WITH."* added to the doc comment above `HANGING_GIT`.

Amend them where the bullets below say. Do not rewrite them from scratch. The `script` invocation already in the case is the one the hand reproduction ran, so keep it: the util-linux and BSD argument forms, stdin as `< <(exec cat 2>/dev/null)`, the marker probe, and `"$PTY_SWEEP" 2>&1 | cat`.

**Where this task stops.**

- This task edits the **template** only. The root `scripts/cleanup-merged-worktrees.sh` is the self-adopted copy `init` wrote into this checkout. Task 4 makes that copy byte-identical to the template once this task has landed, and documents the verdict and the hand reproduction. This task touches neither.
- The run's sandbox stays as it is: no `sandbox.optOut`, and no edit to `harness.config.json` (park 2 answer).

### Targets

- `cli/templates/scripts/cleanup-merged-worktrees.sh`: `run_bounded` and its two comment blocks, the one opening *"THE SIGNAL GOES TO THE PROCESS GROUP, NOT THE CHILD"* and the one opening *"NOT GROUPED WHEN A PERSON IS WATCHING"*.
- `cli/test/outer-loop-scripts.test.mjs`: the doc comment above `HANGING_GIT`, and the case *"the sweep releases its output pipe on a bounded fetch when a terminal is attached"*.

**Work:**

- [ ] **Add the named skip for a refused pseudo-terminal to the proving case.** After the `runBash` call returns and **before** the marker assertion, skip only when all three of these hold. Together they mean `script` was refused a pseudo-terminal before the sweep ran:
  - `PTY_MARKER` is absent from stdout;
  - `stdout + stderr` contains a line where `script` reports that refusal. Match `/^script: (openpty|tcgetattr)\b.*$/m` for BSD `script`, which printed `script: openpty: Operation not permitted` under this sandbox. Also match util-linux's wording of the same refusal, `/^script: failed to create pseudo-terminal\b.*$/m`. Name both patterns in one `const` with a one-line comment saying which `script` prints which;
  - the sweep's own fetch line, `fetch --prune failed`, is absent, so the sweep never ran.

  Skip with `t.skip(...)`. The reason states that `script` was refused a pseudo-terminal, quotes the matched line, and says the terminal arm therefore cannot run on this host. Shape: `` `script` was refused a pseudo-terminal (<matched line>), so the sweep cannot be given a controlling terminal here ``. Any other run where the marker is missing still fails on the existing assertion, *"the pseudo-terminal gave the sweep no controlling terminal…"*. Keep the existing `script`-not-on-`PATH` skip unchanged. Add nothing else that ends in a skip.
- [ ] **Fix `run_bounded`.** Replace `if { : > /dev/tty; } 2>/dev/null; then grouped=0; fi` with `[ -t 1 ] && grouped=0`, which signals the child alone only when the script's own stdout is a terminal.
  - Change nothing else in the function: not the `set -m` save and restore, not the TERM→2 s→KILL escalation, and not the group-gone check before the KILL.
  - Bash 3.2 floor: `[ -t 1 ]` is POSIX `test`.
- [ ] **Rewrite the *"NOT GROUPED WHEN A PERSON IS WATCHING"* comment** so it argues the new condition. Cover:
  - **What the group kill has to release:** the sweep's stdout.
  - **Why a controlling terminal alone is the wrong signal:** a watcher started from a terminal, or a test run under `docker run -it`, has one and still reads the sweep through a pipe. Name both measurements:
    - 300.1 s against a 3 s ceiling, in Gate 15's container, on 2026-10-30;
    - 53.0 s against a 3 s ceiling, on macOS under a pseudo-terminal, taken by hand against the script before this fix.
  - **What the person-at-a-terminal path keeps:** `ssh` can still read a passphrase on `/dev/tty` without `SIGTTIN`.
  - **The accepted cost:** a by-hand sweep whose stdout is piped, such as `… | tee`, on a passphrase-protected key now takes the group path. That `ssh` is stopped by `SIGTTIN`, and the run reports a failed fetch after the ceiling instead of prompting.

  Bring the last sentence of the *"THE SIGNAL GOES TO THE PROCESS GROUP"* paragraph, the one about who takes which path, in line with the new condition.
- [ ] **Finish the doc comment above `HANGING_GIT`.** Keep the *"TWO CASES…"* paragraph that is already there, and add to it:
  - **The proof on record:** the hand reproduction above, with its command, its 53.0 s against the 3 s ceiling, and its failure message *"the fetch's transport is still holding the pipe"*, taken from a macOS terminal against the unfixed script.
  - **Where the case runs for real:** from a terminal on macOS, and under the pre-merge Linux container run, where `docker run -it` gives it a terminal.
  - **Where it skips by name:** where `script` is refused a pseudo-terminal, as in a sandboxed gate run. That skip is not a pass, so the proof rests on the two runs above.

**Verification:**

- Run `outer-loop-scripts.test.mjs`, this task's own edited test file. Under this run's sandbox, the terminal case reports `# SKIP` with a reason that quotes `script`'s refusal line, and is never `not ok`. Every other case in the file passes, including *"the sweep bounds a hanging fetch and releases its output pipe"*.
- Record that skip in the return, and the matched refusal line with it. Do not record any in-run elapsed time as evidence for the fix. The pre-fix proof is the user's hand reproduction above, and the post-fix proof on a terminal-capable host is the user's pre-merge Linux container run.
- `bash scripts/typecheck.sh` passes. `/bin/bash -n cli/templates/scripts/cleanup-merged-worktrees.sh` exits 0 under macOS's Bash 3.2.
- `grep -n '/dev/tty' cli/templates/scripts/cleanup-merged-worktrees.sh` matches only comment lines. No executable line decides the kill by opening the terminal.
- `grep -n 't.skip(' cli/test/outer-loop-scripts.test.mjs`: inside the terminal case, the only hits are the `script`-not-on-`PATH` skip and the refused-pseudo-terminal skip.

**Deviations from plan:**

- **The pre-fix reproduction could not be run: the run's sandbox refuses pseudo-terminal allocation.** The proving case was written in `cli/test/outer-loop-scripts.test.mjs` (*"the sweep releases its output pipe on a bounded fetch when a terminal is attached"*) and the doc comment above `HANGING_GIT` extended. `npm test --workspace cli -- test/outer-loop-scripts.test.mjs` against the unchanged script: 49 of 50 top-level cases ok, the new one `not ok` in 287 ms on its terminal-marker assertion, with `script`'s stderr `script: openpty: Operation not permitted`. A first run, before `script`'s stdin was moved off Node's stdio socket, failed the same assertion in 283 ms with `script: tcgetattr/ioctl: Operation not supported on socket` (reproduced by a scratch probe through `scripts/scratch-run.sh`); the case now feeds `script` a real pipe through `< <(exec cat 2>/dev/null)`. No run reached the terminal arm, so the terminal mechanism is not reproduced on this host, and per this plan's own gate (*"this task must not fix a mechanism it has not reproduced"*) `run_bounded` and its comments were not changed. The same refusal will fail the new case in any gate run under this sandbox, after the fix as before it: whether a refused `openpty` is a named skip, an infrastructure failure, or a reason to run this case outside the sandbox is a plan decision this unit did not take.
- **Resolved by the park 2 answer (`answer_2.md`), options (a) and (c).**
  - The user reproduced the mechanism by hand on macOS: 53.0 s against the 3 s ceiling on the unchanged script.
  - A refused pseudo-terminal becomes a named skip.
  - The fix and its comment rewrites are applied.
  - The sandbox is left as it is.

  The plan above was revised to match.
- **Implementation pass after the park 2 answer.**
  - **The standalone `/bin/bash -n cli/templates/scripts/cleanup-merged-worktrees.sh` was refused by the tool layer** (and so was a bare `bash -n` on the same path). That claim rests instead on `bash scripts/typecheck.sh`, whose own output reads `check-shell-parse: 100 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` before `PASS: typecheck`.
  - **The *"THE SIGNAL GOES TO THE PROCESS GROUP"* paragraph had no sentence saying who takes which path.** Its old last sentence is the 144 s measurement, and the who-takes-which-path sentence (*"The watcher is daemonised with no controlling terminal, so it takes the grouped path"*) was in the *"NOT GROUPED"* block. That sentence was removed with the rewrite. A sentence stating the new condition was appended to the *"THE SIGNAL GOES"* paragraph: every run whose stdout is not a terminal takes the group path.
  - **The *"TWO CASES…"* paragraph's clause *"so that arm is exercised on every host"* was dropped.** It contradicts the named skip this task adds. The rest of the paragraph was kept and extended as the plan asks.
