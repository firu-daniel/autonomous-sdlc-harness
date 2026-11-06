### 2. "because that line … and outside job mode …" reads as if the `run_profile` fact were part of the reason, and "that line" points at the wrong line

**File:** `docs/watcher.md` (`### The per-run profile`) — "because that line is logged before `spawn_engine` renders and checks, and outside job mode"

The added sentence ends: "…with no `not launching '<branch>'` line after it, because that line is logged before `spawn_engine` renders and checks, and outside job mode the run-registry record's `run_profile` field names the rendered file, which job mode neither renders nor records."

This wording causes two misreadings:

- **"that line"** comes straight after `not launching '<branch>'`, so it reads as the refusal line. The refusal line is logged *after* the render and check (`spawn_refuse`, called from inside `spawn_engine`). The clause means the launch line (`launch_run` logs `launching headless run for …` and then calls `spawn_engine`).
- **", and outside job mode …"** sits under the same `because`, so the `run_profile` field reads as a second reason for the log-line claim. It is actually a separate fact: a second record of a passing render and check (`spawn_engine` → `registry_set "$branch" run_profile "$settings_file"`, written only when `JOB_MODE` is not `1` and only after `run_profile_check` passed).

**Fix:** in that sentence, replace

```
because that line is logged before `spawn_engine` renders and checks, and outside job mode the run-registry record's `run_profile` field names the rendered file,
```

with

```
because the launch line is logged before `spawn_engine` renders and checks; outside job mode the run-registry record's `run_profile` field also names the rendered file,
```

This keeps it one sentence. Apply it after Finding 1's edit, which touches a different substring of the same sentence. Change nothing else. This is a prose-only change, so it owes no test run.
