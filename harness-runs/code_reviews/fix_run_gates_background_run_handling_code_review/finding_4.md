### 4. The `heartbeat_loop` comment still says the heartbeat reads the run form's fd 3

**File:** `cli/templates/scripts/run-test-suite.sh` (`heartbeat_loop`, the comment above it) — "runs on the read end of the run form's fd 3"; and its byte-identical copy `scripts/run-test-suite.sh`, same anchor.

**Problem.** After this branch, only the worker opens fd 3 (`exec 3> >(heartbeat_loop > /dev/null 2>&1)` sits below the `if [ "$worker_marker" != "$label" ]` block, which always exits). Only the worker writes and removes `.running`. The run form never holds either. The header was updated to match (*"The heartbeat process reads a pipe whose only write end is the worker's fd 3"*). The function's own comment still says:

> The heartbeat process: runs on the read end of the run form's fd 3 … `touch -c` never recreates a `.running` the run form already removed

A reader of that comment would look for the heartbeat's lifetime in the process that exits right after printing `pending`.

**Fix.** In the comment above `heartbeat_loop()`, change `the run form's fd 3` to `the worker's fd 3` and `a \`.running\` the run form already removed` to `a \`.running\` the worker already removed`. Make the identical edit in `scripts/run-test-suite.sh`, which Task 9 brought level with the template, so the two copies stay byte-identical. This is comment-only: verify with `bash -n` on both files and `cmp` of the pair. No test runs for it.
