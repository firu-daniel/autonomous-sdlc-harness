### 2. The heartbeat's touch loop never ends if its stop file cannot be written

**File:** `cli/templates/scripts/run-test-suite.sh` (`heartbeat_loop`): "while [ ! -e \"$heartbeat_stop_file\" ]; do". The same bytes are in this checkout's self-adopted copy, `scripts/run-test-suite.sh`, which must stay byte-identical to the template.

**The problem.** The touch loop inside `heartbeat_loop` has one exit condition: the stop file `<label>.running.stop.<pid>` exists. That file lives in the log directory. `heartbeat_loop` writes it only after its `read` reaches end of file. If the log directory has gone by then, the write `: > "$heartbeat_stop_file"` fails. This happens when `<state_dir>/test_run_logs/<branch>/` is removed while a run is in flight: a cleaned state tree, a `git clean`, or a run copy torn down under a live run.

When the write fails, the stop file never appears. The loop keeps running `touch -c` and `sleep 1` forever, and `wait "$toucher"` blocks forever too. The result is two orphaned processes that outlive the run indefinitely.

Reproduced by hand during this review. A copy of `heartbeat_loop` ran under a script that removed the directory and then exited. Four seconds later, `pgrep -fl` still listed both heartbeat processes. With the guard below in place, nothing was left over, and a live run's `.running` still had a current mtime.

**Fix.** End the loop when `.running` itself is gone as well. The run form removes `.running` only once the run has finished or been stopped. A label with no `.running` already reads as free, so stopping the heartbeat then loses nothing. Make the same edit in both files:

```bash
# The heartbeat process: runs on the read end of the run form's fd 3 and ends at
# that pipe's end of file. `read` without `-t`, because bash 3.2's `read -t`
# returns 1 on both timeout and EOF; hence the separate touch loop. `touch -c`
# never recreates a `.running` the run form already removed, and the loop also
# ends once `.running` is gone, so a stop file that cannot be written (its
# directory removed mid-run) never leaves it touching forever.
heartbeat_loop() {
  local toucher _
  (
    while [ ! -e "$heartbeat_stop_file" ] && [ -e "$running_file" ]; do
      touch -c "$running_file"
      sleep "$HEARTBEAT_SECONDS"
    done
  ) &
```

Leave the rest of the function unchanged. Then confirm the two copies are identical: `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh`. This fix creates and edits no test file, so it runs no test; the suite runs in the Run gates phase. The `cmp` check above is not a test run.
