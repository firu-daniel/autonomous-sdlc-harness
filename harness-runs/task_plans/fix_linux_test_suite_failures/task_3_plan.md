### Task 3 — Bound the sweep's fetch by process group whenever its stdout is not a terminal, with a pseudo-terminal case as the proof

**Goal:** Fix group 3. When a hung `git fetch` is killed, `cleanup-merged-worktrees.sh` must release its output pipe whether or not a controlling terminal is attached. Prove it with a case that runs the sweep under a pseudo-terminal. The case must fail against the current script on this macOS host, and pass once the script is fixed.

**Verdict to record (group 3): a code defect. It depends on whether a terminal is attached, not on Linux.**

- **The mechanism.** `cli/templates/scripts/cleanup-merged-worktrees.sh` → `run_bounded` picks its kill with `if { : > /dev/tty; } 2>/dev/null; then grouped=0; fi`.
  - **When `/dev/tty` opens:** it skips `set -m` and, on expiry, signals only the direct child.
  - **What the child leaves behind:** `git fetch` runs its transport as a child of its own. In the test, the shim's `sleep 300` plays that transport. The grandchild inherits the sweep's stdout and keeps the pipe open after its parent dies.
- **Why it failed in Gate 15's container and not on macOS.**
  - Gate 15's recipe (`docker run -it … bash`, then `su - probe`) gives the suite a controlling terminal, which is why the measured run took 300.1 s against a 3 s ceiling.
  - A macOS run with no terminal attached, such as a gate run from a Claude Code session, takes the group kill and passes.
- **The real case.** `autonomous-watcher.sh` reads the sweep through a pipe (`"$CLEANUP_SCRIPT" 2>&1 | while IFS= read -r line; …`). Started from a terminal, the watcher would block for as long as a hung transport lives.
- **The fix.** Decide on what the kill has to release, the sweep's **stdout**, not on whether any terminal exists:
  - **stdout is a terminal (`[ -t 1 ]`):** a person is reading it directly. Keep the child in this script's group, so `ssh` can still prompt for a key passphrase on `/dev/tty`, and signal the child alone.
  - **stdout is anything else:** a pipe or a file can be held open by a surviving transport, so take the group kill, whether or not a controlling terminal exists.

**Where this task stops.** This task edits the **template** only. The root `scripts/cleanup-merged-worktrees.sh` is the self-adopted copy `init` wrote into this checkout. Task 4 makes that copy byte-identical to the template once this task has landed, and documents the verdict. This task does not touch either.

### Targets

- `cli/templates/scripts/cleanup-merged-worktrees.sh`: `run_bounded` and its two comment blocks, the one opening *"THE SIGNAL GOES TO THE PROCESS GROUP, NOT THE CHILD"* and the one opening *"NOT GROUPED WHEN A PERSON IS WATCHING"*.
- `cli/test/outer-loop-scripts.test.mjs`: the doc comment above `HANGING_GIT`, and a new case beside *"the sweep bounds a hanging fetch and releases its output pipe"*.

**Work:**

- [ ] **Write the proving case first, and run it before you touch the script.** Add the case *"the sweep releases its output pipe on a bounded fetch when a terminal is attached"* beside the existing sweep case. Reuse that case's fixture (`fixtureFor` + `initOk`), its `HANGING_GIT` shim on `PATH`, and its `HARNESS_FETCH_TIMEOUT` of 3. The case:
  - **Gives the sweep a real controlling terminal through `script`.** Spell the call for the host's `script`:
    - util-linux, as on Debian: `script -q -e -c <command> /dev/null`;
    - BSD, as on macOS: `script -q /dev/null <argv…>`.

    Pick the form by `uname -s` or by util-linux's `script --version`, never by guessing.
  - **Keeps `script`'s stdin an open pipe for the whole run.** util-linux `script` ends the session when its stdin reaches EOF, so stdin must not be `/dev/null`.
  - **Sends the sweep's stdout into a pipe inside the terminal**: `"<sweep>" 2>&1 | cat`. This is the watcher's shape, a reader that waits for EOF.
  - **Proves the terminal was present before it asserts on timing.** Inside the terminal, run `{ : > /dev/tty; } 2>/dev/null && echo <marker>` before the sweep. Fail, naming that the pseudo-terminal gave no controlling terminal, when the marker is missing. A run that never reached the terminal arm proves nothing.
  - **Asserts the skip line, and that the whole `script` run returned within** `ceiling + scaleBound(20)`. Use the same bound the existing case uses, and the same failure-message shape: *"the fetch's transport is still holding the pipe"*.
  - **Skips with a named reason only when `script` is not on `PATH`.** `node:22-bookworm` ships util-linux `script` and macOS ships BSD `script`, so a skip on either is a defect, not a pass.

  Run `outer-loop-scripts.test.mjs` against the **unchanged** script, and record in your return that the new case fails there and how long it took. That result is what turns the explanation above into a measurement on this host. If the new case passes against the unchanged script, stop and report a blocker naming that result. The terminal explanation does not hold then, and this task must not fix a mechanism it has not reproduced.
- [ ] **Fix `run_bounded`.** Replace `if { : > /dev/tty; } 2>/dev/null; then grouped=0; fi` with `[ -t 1 ] && grouped=0`, which signals the child alone only when the script's own stdout is a terminal.
  - Change nothing else in the function: not the `set -m` save and restore, not the TERM→2 s→KILL escalation, and not the group-gone check before the KILL.
  - Bash 3.2 floor: `[ -t 1 ]` is POSIX `test`.
- [ ] **Rewrite the *"NOT GROUPED WHEN A PERSON IS WATCHING"* comment** so it argues the new condition. Cover:
  - **What the group kill has to release:** the sweep's stdout.
  - **Why a controlling terminal alone is the wrong signal:** a watcher started from a terminal, or a test run under `docker run -it`, has one and still reads the sweep through a pipe. Name the measurement: 300.1 s against a 3 s ceiling, in Gate 15's container, on 2026-10-30.
  - **What the person-at-a-terminal path keeps:** `ssh` can still read a passphrase on `/dev/tty` without `SIGTTIN`.
  - **The accepted cost:** a by-hand sweep whose stdout is piped, such as `… | tee`, on a passphrase-protected key now takes the group path. That `ssh` is stopped by `SIGTTIN`, and the run reports a failed fetch after the ceiling instead of prompting.

  Bring the *"THE SIGNAL GOES TO THE PROCESS GROUP"* paragraph's last sentence about who takes which path in line with the new condition.
- [ ] **Extend the doc comment above `HANGING_GIT`** so it covers both cases. Say why the terminal case exists: the group kill used to depend on whether `/dev/tty` opened, so a run with a terminal attached took the child-only kill and waited for the orphan. Record group 3's verdict: a code defect, depending on the terminal, not on Linux.

**Verification:**

- Before the fix, the new case fails on this host, with an elapsed time above `ceiling + scaleBound(20)`. The value is recorded in the return.
- After the fix, `outer-loop-scripts.test.mjs` passes, with both sweep cases among the passing ones. The new case's terminal marker was printed, so the terminal arm was really exercised.
- `bash scripts/typecheck.sh` passes. `/bin/bash -n cli/templates/scripts/cleanup-merged-worktrees.sh` exits 0 under macOS's Bash 3.2.
- `grep -n '/dev/tty' cli/templates/scripts/cleanup-merged-worktrees.sh` matches only comment lines. No executable line decides the kill by opening the terminal.
