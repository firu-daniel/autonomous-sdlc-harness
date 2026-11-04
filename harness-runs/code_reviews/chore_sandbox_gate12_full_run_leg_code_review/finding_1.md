### 1. FR1's "Read from" names a launch line carrying `--settings` that the watcher never prints

**File:** `docs/sandbox-verification.md` (`## 10. The full-run leg and the Gate 12 sandbox round`, row FR1): "whose watcher launch line carries `--settings`". Also `docs/development.md` (**Gate 12** → **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** → **What it shows.**, the **FR1** bullet): "whose watcher launch line carries `--settings`" and "followed by the session's own output".

**The problem.** Both documents say FR1 is read from "the `Run the harness` step log, whose watcher launch line carries `--settings`". No such line exists. In job mode, `run_job` in `cli/templates/scripts/autonomous-watcher.sh` logs `job: launching run for '<branch>' (engine=…) in … (log: …)`, and that line names no flag. `spawn_engine` passes `--settings "$settings_file"` to `"$AGENT_CLI"` inside an `exec` that is never logged (the `exec "$AGENT_CLI" -p "$launch_prompt" \` block). The FR1 bullet in `docs/development.md` admits this itself: its **Source** sentence says "The engine's command line, `--settings` included, is not logged". So the byte-copied "Read from" contradicts the source sentence in the same bullet.

The same bullet also says the passing check "is read as `job: launching run for '<branch>'` followed by the session's own output". The session's output does not go to the step log. `spawn_engine` pipes the engine's stdout through the formatter into `"$log_path"` (`"$formatter" >>"$log_path"`), and its stderr goes to `2>>"$log_path"`. Only `log` lines reach the step's stdout, through `log()`'s `tee`.

The story index named this exact defect as its first `Top risks:` entry: a full-run leg citing a surface that does not show what the leg claims. A maintainer grading FR1 would look for a `--settings` line, fail to find one, and mark the row failed or *not run* when it actually passed.

**Fix.** Replace the FR1 "Read from" text with the sentence below, byte-identical in both places: the FR1 row's **Read from** cell in `docs/sandbox-verification.md` §10, and the `Read from:` clause of the **FR1** bullet in `docs/development.md` (xvi).

```
observation (xvi): the `Run the harness` step log's `job: launching run for '<branch>'` line, with no `not launching` line after it. The engine's command line, `--settings` included, is not logged: that the base profile is passed unchanged as `--settings` is read from `spawn_engine`'s job-mode arm in `cli/templates/scripts/autonomous-watcher.sh`, not from the log.
```

Then, in the **Source** sentence of the same `docs/development.md` FR1 bullet, replace

```
so it is read as `job: launching run for '<branch>'` followed by the session's own output with no `not launching` line.
```

with

```
so it is read as `job: launching run for '<branch>'` with no `not launching` line after it. The session's own output goes to the run's log file, which `spawn_engine` appends to, not to the step log.
```

Leave the rest of the bullet unchanged, including the `job mode: '<branch>' also gets --add-dir …` sentence, which is correct. These are documentation edits only, so no test runs for this fix.
