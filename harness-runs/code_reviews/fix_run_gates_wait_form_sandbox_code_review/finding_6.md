### 6. The header's `BESIDE THE LOG` list omits the heartbeat's stop file

**File:** `cli/templates/scripts/run-test-suite.sh` (the header's `# BESIDE THE LOG, in the same directory:` block): "#   <label>.verdict  the verdict line, renamed into place whole once both gates". The same bytes are in `scripts/run-test-suite.sh`, which must stay byte-identical to the template.

**The problem.** The run form now also writes `<label>.running.stop.<pid>` in the log directory (`heartbeat_stop_file="$running_file.stop.$$"`). `heartbeat_loop` creates it at end of file and removes it once its touch loop has ended. If the heartbeat process is killed between those two steps, the file is left behind. The header's list of what sits beside the log names only `.running` and `.verdict`, so a reader who finds a stray `.stop.<pid>` file has nothing to identify it by.

**Fix.** After the `<label>.verdict` entry's two lines, and before "# A refusal writes neither file, and no log.", insert:

```bash
#   <label>.running.stop.<pid>
#                    transient: the heartbeat's own stop signal, written at the
#                    end of a run and removed once the heartbeat has stopped
```

Make the same edit in both files, then check `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh`. This is a comment-only change, so no test runs for it.
