### Task 18 — `remote-execution.md` and `watcher.md` state the new archive rule, the scoped pause note, the wrong-ref refusal and the close-and-delete stop

**Goal:** Make `docs/remote-execution.md` and `docs/watcher.md` state this branch's behaviour, as the acceptance criteria require (*"`docs/github-run-control.md` (§1–§5, §8) and `docs/remote-execution.md` state the new behaviour"*), for the parts of a remote run's lifecycle these two documents own.

**Depends on:** Task 17, the previous docs task. Its §5 and §6 are what this task cites for the close-and-delete stop rather than restating. This task documents:
- **Task 1:** a non-pause exit archives every top-level answered pair present when the session launched (`launch_answered_set`), together with `resumed_for_index`, so a job boundary loses nothing and `status.json` (schema `1`) is unchanged;
- **Task 5:** the pause-note rule, word for word: *"In job mode, a carried `PAUSE_PROGRESS.md` is kept only when the job's `resume` is `pause`, the restored `remote_status.json` says `status: paused`, and its `engine` equals the job's engine. In every other case — a fresh launch (`resume none`), an answer resume (`resume answer`), a pause resume whose previous job did not pause (a stop or a kill), or a different engine — it is moved aside, never deleted, to `<state_dir>/autonomous_logs/remote_superseded/<epoch>[-<n>]/PAUSE_PROGRESS.md`."* and its clause sentence, also word for word: *"A pause resume whose previous job did not pause, or paused for a different engine, is re-launched with a clause saying there is no pause note, whether or not a note was carried."*;
- **Task 6:** `harness-run.yml` fails fast for a `run` or `pause` dispatched from a ref other than its `branch`, with `stop` and `warm` exempt;
- **Task 10:** the poller and `continue` skip a branch absent on `origin`.

**Where this task stops.** These two files only. The Gate 12 legs are **Task 19**'s. `docs/outer-loop-verification.md` stays as it is, because its paragraphs describe the local watcher (story index `## Scope register`, row 17).

### Targets

- `docs/remote-execution.md` → `### Working a run from GitHub alone` (under `## 1.`), `### The kill switch and stopping` and `### Resuming without the local watcher` (under `## 3.`), and `## 4. What the local design assumed, and what changed` (*Central state*).
- `docs/watcher.md` → `## 4. Pausing, parking and the usage gate`.

**Work:**

- [ ] `remote-execution.md` → *Working a run from GitHub alone*. Where it says to pick the run's branch under *Use workflow from*, add that a `run` or `pause` dispatched from another ref now fails at once in a `wrong-ref` job naming the ref to use, and why: GitHub lists a run under its dispatch ref, so no lookup of the branch would find it (Gate 12 round 6, finding 6). A `stop` is accepted from the default branch, because that is how a deleted branch is stopped.
- [ ] `remote-execution.md` → *The kill switch and stopping*:
  - closing the run's issue or pull request, or deleting its branch, stops the run as `stop` does, citing `github-run-control.md` §5 and §6 for who and what;
  - a deleted branch's marker is dispatched from the default branch;
  - the resume poller and a job's `continue` never re-dispatch a branch absent on `origin`;
  - after a stop, command replies name the run `stopped` even though its bundle reads `paused` / `killed`.
- [ ] `remote-execution.md` → *Resuming without the local watcher*, plus *Central state* in `## 4.`:
  - which pairs a job archives and why the bundle does not need `resumed_for_index`: the set is re-derived at launch;
  - that `PAUSE_PROGRESS.md` travels in the bundle, then Task 5's rule sentence, word for word as quoted under **Depends on:**, its answer-resume case included;
  - Task 5's clause sentence, word for word as quoted under **Depends on:** — not limited to a note that was moved, since a run stopped before it ever paused carries none and is still told there is no pause note.
- [ ] `watcher.md` §4:
  - the watcher's archive is every pair answered when the session launched, the resume's named set among them, after any non-pause exit;
  - name `launch_answered_set` beside `resumed_for_index`;
  - say that the job-mode pause-note rule lives in `remote-execution.md`, and do not restate it.

**Verification:**

- `grep -n "resumed_for_index" docs/watcher.md docs/remote-execution.md` shows no sentence still calling it the only record of what was consumed.
- `grep -n "an answer resume" docs/remote-execution.md` finds the rule sentence under *Resuming without the local watcher*, and it matches Task 5's sentence word for word; `grep -n "whether or not a note was carried" docs/remote-execution.md` finds Task 5's clause sentence beside it.
- `grep -n "Use workflow from" docs/remote-execution.md` shows the wrong-ref sentence beside the existing instruction.
- No paragraph restates `github-run-control.md` §5's close-and-delete table. Each cites it. This file owns the lifecycle, and that one owns the GitHub events (`docs/github-run-control.md`, opening: *"It cites rather than restates"*).
