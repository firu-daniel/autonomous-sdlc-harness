### Task 12 — Test T3's launcher answer and the lane-state reading in the gates-leg suite

**Goal:** Pin the two functions Task 8 added to the probe's `gates` leg. A later edit then cannot turn T3 back into a row that grades a run the launcher never started, or one that waits on a dead worker's `.running`.

**Depends on:** Task 8, which added these to `scripts/lib/sandbox-probe/legs-local.sh`. Each reads only its arguments and the stream.

- **`sp__t3_grade <stream> <launch command> <verdict file> <log file>`.** It calls `sp__t2_grade` with its four arguments, then reads the launch call's first output line through `sp__first_line "$(sp__local_text)"`.
  - `pending`: it keeps `sp__t2_grade`'s verdict, its evidence prefixed `the launcher answered pending; `.
  - Any other line from a call that ran: `SP_VERDICT="not run"`, the evidence `the launcher answered '<line>', not pending, so no sandboxed gate run was started: ` followed by `sp__t2_grade`'s.
  - A call that did not run keeps `sp__t2_grade`'s `not run`.
- **`sp__t2_lane_state <has verdict 0|1> <has running 0|1> <running mtime> <now> <stale seconds>`** prints the first that applies: `verdict` when the first argument is `1`; `gone` when the second is `0`; `live` when `now - mtime` ≤ `<stale seconds>`; otherwise `stale`. A non-numeric mtime or now reads `stale`.

This task tests them and changes no probe file.

### Targets

- `cli/test/sandbox-probe-gates-legs.test.mjs`

**Work:**

- [ ] **The header's rule sentence.** Extend it: on Linux T3 is graded only when Phase G's launcher answered `pending`, and a stale heartbeat is read as a dead worker. Extend its *left out deliberately* note, if it has one, to say the session wiring of the T3 loop stays hand-run.
- [ ] **`sp__t3_grade`.** Reuse the file's existing T2 stream fixture shape and verdict/log setup. Write stream fixtures under the case's own `mkdtemp` directory, whose launch call's `tool_result` text is `pending`, `in-session`, or `launch-sandboxed-gates.sh: bwrap is not on PATH …`. Assert:
  - `pending` with a `pass` verdict gives `pass`, the evidence beginning `the launcher answered pending; `;
  - `in-session` with a `pass` verdict file present gives `not run`, the evidence carrying `the launcher answered 'in-session', not pending`;
  - the refusal line gives `not run`, quoting it.
- [ ] **`sp__t2_lane_state`.** Run a table of argument vectors, one `runBash` per case or one loop in a single `bash -c`. Assert:
  - `1 1 …` gives `verdict`, whatever the rest;
  - `0 0 …` gives `gone`;
  - age 30 with stale 30 gives `live`, and age 31 gives `stale`;
  - a non-numeric mtime gives `stale`.

**Verification:**

- `cli/test/sandbox-probe-gates-legs.test.mjs` passes, through the single-file command `.claude/context/conventions.md` → `## The testing bar` gives.
- No case launches a session, starts a worker, or creates anything outside its own temporary directory.

**Deviations from plan:**

- The plan says `sp__t3_grade` reads the line through `sp__first_line`. The shipped function in `legs-local.sh` reads it through `sp__message_line` and then removes a leading `Exit code <n>: `. The fixtures therefore use the launcher's real exit forms: `in-session` under `Exit code 4`, the refusal under `Exit code 2` with `is_error`, and `pending` both bare and under `Exit code 3`. That covers the header-stripping branch as well.
- The plan's third bullet ("a call that did not run keeps `not run`") had no assertion listed. A fourth `sp__t3_grade` case covers it with the `t2-run-form` fixture, which holds no launcher call.
- The lane-state table also covers an empty mtime and a non-numeric `now`, both expected to read `stale`.
