### 1. FR4 says no shipped surface carries a denied call's input off the runner, but the `harness-state` artifact's `run.log` carries a descriptor of every call

**File:** `docs/sandbox-verification.md` (`## 10. The full-run leg and the Gate 12 sandbox round`, row FR4, the **Read from** cell): "No shipped surface carries the denied call's input off the runner (`docs/cli.md` §6, residual 1, item 5)." Also `docs/development.md` (**Gate 12** → **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** → **What it shows.**, the **FR4** bullet): the same sentence in its `Read from:` clause, and the **Source** sentences "What is not: the denied call's input, because the raw `<stateDir>/autonomous_logs/<branch>.stream.jsonl` stays on the runner and is not a source of the state bundle. A leg that needs that input records that it is not carried, never a guess at it."

**The problem.** The claim is false. The raw stream does stay on the runner, but the formatted run log does not:

- `spawn_engine` in `cli/templates/scripts/autonomous-watcher.sh` pipes the engine's stream through the formatter into the run log: `tee -a "${log_path%.log}.stream.jsonl" |` then `"$formatter" >>"$log_path"`, where `log_path` is `$LOGS_DIR/$branch.log`.
- The formatter, `cli/templates/scripts/autonomous-format-stream.sh`, keeps every `tool_use` as `"→ " + .name + "  "` followed by `(.input.subagent_type // "") + " " + (.input.description // .input.command // .input.file_path // "")`, clipped to 160 characters. So every call has a line naming its tool and part of its input, and that includes a denied call. For a `Read` or `Edit`, the part shown is the `file_path`. For a `Bash` call it is the `description`, or the `command` when there is no description.
- The state bundle carries that log. `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_write` copies `$base/$HR_REMOTE_LOGS_DIR/$branch.log` to `run.log` in the bundle (`HR_REMOTE_LOG_FILE='run.log'`; the bundle layout comment reads `<bundle>/run.log  <state_dir>/autonomous_logs/<branch>.log; never restored`). `harness-run.yml` uploads that bundle as the artifact `harness-state`.

The citation does not support the sentence either. `docs/cli.md` §6, residual 1, item 5 lists the bundle's sources, and the list includes `autonomous_logs/<branch>.log`. It says nothing about a call's input not being carried.

**Why it matters.** FR4 is the story's first `Top risks:` entry: a full-run leg citing a surface that does not show what the leg claims. As written, FR4 tells the maintainer to record the denied call's input as "not carried". That puts a false statement into a document of record, and it sends the maintainer away from the one off-runner surface that shows what each denied call asked for.

**Fix.** These are documentation edits only, so no test runs for this fix.

1. In `docs/sandbox-verification.md` §10, row FR4, **Read from** cell, replace

   ```
   No shipped surface carries the denied call's input off the runner (`docs/cli.md` §6, residual 1, item 5).
   ```

   with

   ```
   The denied call's full input is not carried off the runner: the raw `<stateDir>/autonomous_logs/<branch>.stream.jsonl` is not a state-bundle source (`docs/cli.md` §6, residual 1, item 5). Each job's `harness-state` artifact does carry `run.log`, the formatted `<stateDir>/autonomous_logs/<branch>.log`, which holds one `→ <tool>  <descriptor>` line per call. The descriptor is the call input's `subagent_type`, then the first of its `description`, `command` or `file_path`, clipped to 160 characters (`cli/templates/scripts/autonomous-format-stream.sh`). That line is the only off-runner trace of what a denied call asked for.
   ```

2. In `docs/development.md` (xvi), the **FR4** bullet, make the same replacement in its `Read from:` clause, byte-identical to step 1.

3. In the same bullet, replace

   ```
   What is not: the denied call's input, because the raw `<stateDir>/autonomous_logs/<branch>.stream.jsonl` stays on the runner and is not a source of the state bundle. A leg that needs that input records that it is not carried, never a guess at it.
   ```

   with

   ```
   What is not: the denied call's full input, because the raw `<stateDir>/autonomous_logs/<branch>.stream.jsonl` stays on the runner and is not a source of the state bundle; `run.log` in the job's `harness-state` artifact carries only its clipped descriptor. A leg that needs more than that descriptor records that it is not carried, never a guess at it.
   ```

4. In the same observation, in the fenced block after "Read each job's log, then the branch it pushed:", add this line after `gh run view <run id> --log`:

   ```
   gh run download <run id> -n harness-state -D <dir>
   ```
