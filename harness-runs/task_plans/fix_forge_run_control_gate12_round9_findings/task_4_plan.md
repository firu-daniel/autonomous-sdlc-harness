### Task 4 — A park that overtakes a requested pause says the pause is folded into it

**Goal:** When a run parks before it honours a pause someone asked for, its park comment says so, and the `control` reply's promise of a `paused` comment does not go quietly unmet. Gate 12 round 9, finding 2: `@SDLC-HARNESS pause` was accepted and the job dropped `PAUSE`, but the fix-plan writer parked first. The park comment said nothing about the pause, no `paused` comment came, and after the answer the run simply resumed.

**Depends on:** Task 3, the last task that edits `forge_report` before this one. Tasks 2 and 3 own its `stopped` path. This task touches only its `parked` / `park_loop` note, and does not change their code.

**The fact this rests on.** When the job's control poll finds a `harness pause <branch>` run, `job_control_poll` in `autonomous-watcher.sh` writes the registry's `pause_reason` as `user` and drops `PAUSE`. A park classified before the engine acknowledges that `PAUSE` sets `status parked` and calls `notify parked`. In job mode that becomes `job_report parked`, which runs `remote-run.sh report parked` while `pause_reason` still reads `user`: `run_job` clears a reason left on a non-`paused` exit only after its supervision loop ends ("A reason recorded for a pause the run finished before honouring"). `forge_report` already reads `pause_reason` from the job checkout's registry for every event. So the report can see that a pause is pending, and the watcher's code does not change.

**Where this task stops.** This task adds one fixed line to the `parked` and `park_loop` comments, and documents the registry fact above in the watcher's field list. `control`'s reply `Pause requested … and a paused comment follows.` is **not** changed: it is right whenever the pause is honoured, and this line covers the case where the park comes first. What happens after the answer is unchanged: the resumed run continues, and the pause is not re-applied. The adopter documents are **Tasks 5 and 7**.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - a constant `PAUSE_FOLDED_NOTE`, beside the other report text constants near `STATE_LABEL_PREFIX`;
  - in `forge_report`, the `note` it builds for `parked` and `park_loop`;
  - in the header's `report` paragraph, the `parked` sentences.
- `cli/templates/scripts/autonomous-watcher.sh`: the registry field list's `pause_reason` entry. This is comment only, and no code changes.
- `cli/test/remote-report.test.mjs`: new cases.

**Work:**

- [ ] **The line.** `PAUSE_FOLDED_NOTE='A pause was requested on this run before it parked, so it is folded into this park: the run waits for the answer and continues once it is answered, and no separate `paused` comment follows.'`. Write the backticks around `paused` literally inside the single-quoted value. It names no login: the job only sees the `harness pause` run, and that run's actor is the bot.
- [ ] **`forge_report`.** After `reason` is read from the registry, and before the comments are written: when `event` is `parked` or `park_loop` and `reason` is `user`, set `note` to `PAUSE_FOLDED_NOTE` when it is empty, else append it to the existing `note` after one blank line. `parked` passes `note` into every question comment through `forge_question_body`, and `park_loop` prints it after its text, so every park comment carries the line. No other event and no other reason adds it.
- [ ] **The headers.**
  - `remote-run.sh`'s `report` paragraph: after the `parked` sentences, state that `parked` and `park_loop` append `PAUSE_FOLDED_NOTE` when the registry's `pause_reason` is `user`, which is a pause the job dropped and the run never honoured.
  - `autonomous-watcher.sh`'s `pause_reason` entry: add that a `user` value still set when the run exits `parked` or `park_loop` is read by `remote-run.sh report` for that park's comment, and that `run_job` clears it at the job's end.
- [ ] **Tests in `remote-report.test.mjs`.** Using that suite's existing registry and question-file setup:
  - **One question.** `report parked` with `pause_reason` `user` in the registry and one open question: the question comment's body carries `PAUSE_FOLDED_NOTE` byte for byte, after the answer form.
  - **Two questions.** Both comments carry it.
  - **Reason `budget`.** Neither carries it.
  - **No reason.** Neither carries it.
  - **`park_loop`.** `report park_loop` with `pause_reason` `user` carries it.
  - **Not a park.** `report paused` with reason `user` does not carry it.

**Verification:**

- `npm test --workspace cli -- test/remote-report.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- Read `run_job`'s loop and the line after it in `autonomous-watcher.sh`, and confirm the ordering this task rests on, by symbol: `classify_run_exit` → `notify parked` → `job_report` runs inside the session's exit handling, and `[ "$final" = "paused" ] || registry_set "$branch" pause_reason ""` runs after the `while :` loop. If that ordering is not what the code does, stop and return a blocker naming it, rather than moving the clear.
- `git diff --stat cli/templates/scripts/autonomous-watcher.sh` shows only comment lines changed.
