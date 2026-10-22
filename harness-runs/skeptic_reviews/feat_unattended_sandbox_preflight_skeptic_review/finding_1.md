### 1. The stall-watchdog suite ticks the real watcher without overriding the sandbox probe, so all nine of its local cases fail on a Linux host without `bubblewrap` or `socat`

**File:** `cli/test/watcher-stall-reset-payloads.test.mjs` (`localStall`), at "'. \"$1\" status >/dev/null',". The test-only override it bypasses is in `cli/test/helpers/watcher.mjs` (`DEFAULT_SANDBOX_PROBE`, and `tick`'s "hr_sandbox_prereq_probe_var() {").

**Problem.** This branch puts a host check in `process_inbox_file` (`cli/templates/scripts/autonomous-watcher.sh`, after "The sandbox preflight (THE SANDBOX PREFLIGHT above)"). On a fresh local drop it calls `hr_sandbox_prereq_probe_var`. On Linux, that function runs `command -v bwrap` and `command -v socat` against the watcher's `PATH`. When either is missing, `fail_before_launch` archives the drop as `failed_<ts>_…` and nothing launches.

The story plan names this as its third top risk: "on a Linux host without `bubblewrap`/`socat`, the existing watcher suites would hit the new refusal". Its mitigation is: "Task 4 overrides the probe by default in the shared watcher test helper". Task 4 did that only inside `createWatcherFixture(...).tick` in `cli/test/helpers/watcher.mjs`. That `tick` defines `hr_sandbox_prereq_probe_var() { HR_SANDBOX_HOST=macos; …; return 0 }` after sourcing the watcher.

`watcher-stall-reset-payloads.test.mjs` does not use that `tick`. `localStall` writes its own `bash -c` script: source the watcher, then `tick`, then `until [ -e "$2" ]; …`, then a second `tick`, then `wait`. It runs that script through `stalled(...)` → `runBash`. It never redefines the probe, so the watcher's first `tick` runs the real probe.

**Why it is reachable.** Every case that calls `f.localStall(...)` sends a fresh local task drop through `process_inbox_file`. There are nine `await f.localStall(` call sites in the file. On a Linux host without `bwrap` or `socat` on `PATH`, the drop is refused. No session launches and no `hung` marker is ever written. `stalled` then fails each case with "the session did not hang within … ms". The job-mode cases are unaffected: job mode never reaches the preflight.

macOS is unaffected, because the real probe answers `macos` with nothing missing. That is why this branch's own gate runs on darwin did not show the failure. On such a Linux host, `scripts/run-gates.sh` goes red. The task prompt's constraints say it passes, and the plan says the watcher suites are host-independent.

**Proof.**
- `grep -rnE "'tick'|; tick|tick; " cli/test/`, excluding `cli/test/helpers/watcher.mjs`, finds only `watcher-stall-reset-payloads.test.mjs` lines 264 and 267. These are the two `'tick',` lines of `localStall`'s script array. No other suite ticks the watcher outside the helper.
- `grep -n "sandbox\|DEFAULT_SANDBOX_PROBE" cli/test/watcher-stall-reset-payloads.test.mjs` finds no probe override. The file imports only `createWatcherFixture` from `./helpers/watcher.mjs`.

**Fix.**

1. In `cli/test/watcher-stall-reset-payloads.test.mjs`, change the helper import from

   ```js
   import { createWatcherFixture } from './helpers/watcher.mjs';
   ```

   to

   ```js
   import { createWatcherFixture, DEFAULT_SANDBOX_PROBE } from './helpers/watcher.mjs';
   ```

2. In `localStall`, override the sourced probe right after the watcher is sourced, the same way the shared helper's `tick` does:

   ```js
         const script = [
           '. "$1" status >/dev/null',
           `hr_sandbox_prereq_probe_var() {\n${DEFAULT_SANDBOX_PROBE}\n}`,
           'tick',
           'until [ -e "$2" ]; do sleep 0.1; done',
           'touch -t 202001010000 "$3" "$4"',
           'tick',
           'wait',
         ].join('\n');
   ```

3. In `cli/test/helpers/watcher.mjs`, add one sentence at the end of choice 5 of the module header: "A suite that runs its own `tick` script instead of this `tick` (`cli/test/watcher-stall-reset-payloads.test.mjs` → `localStall`) defines the same override from {@link DEFAULT_SANDBOX_PROBE}." This tells the next suite to bypass the helper what it owes.

That test file is the one this fix edits, so it is the only one the fix runs: `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs`. The header edit in `cli/test/helpers/watcher.mjs` is comment-only and runs nothing.
