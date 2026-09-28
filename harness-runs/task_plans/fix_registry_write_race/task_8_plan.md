### Task 8 — Document the serialized registry writer, the lost-reset repair, the bounded usage wait and the bounded test suite

**Goal:** Every durable document that describes the registry writer, the job-mode usage wait, the local usage auto-resume and launch hold, or how the suite is run and bounded must say what the code now does. The story index's `## Scope register` rows marked `change` and owned by Task 8 are this task's exact site list. Every other row there is out of scope for it.

**Depends on:** Tasks 1–7, whose behaviour this task describes and never changes:
- **Task 1:** `hr_registry_set <file> <branch> <key> <value> [<key> <value> …]`, serialized by a `mkdir` lock at `<file>.lock`. Its temp file sits in the registry's directory, a stale lock is broken by age, and creation is atomic.
- **Tasks 2 and 3:** paired keys land in one write, the watcher records every pause tag or reason before its `PAUSE`, and `remote-run.sh stop` and `sync` each write their outcome in one step.
- **Task 4:** a `paused` + `paused_by usage` record with no usable `usage_resume_at` gets now + the gate's one-hour fallback, logged and notified once. `.usage_hold` is bounded by that time. Job mode repairs before choosing between waiting and the poller, and ends an in-job wait that passes max(reset, wait start) + `REMOTE_WAIT_MAX_SECS` with `wait-poller` and one notification, on every runner. An empty `usage_resume_at` with `paused_by` empty still means the gate already dropped `RESUME`.
- **Task 6:** `npm test` runs `node --test --test-timeout=300000`. `runBash` takes `{ timeoutMs, signal }` and kills the process group.
- **Task 7:** the opt-in repeat command `HARNESS_JOB_USAGE_REPEAT=40 node --test --test-timeout=300000 test/watcher-remote-job.test.mjs`, run from `cli/`.

Read each of those in the code before writing about it. This file is the contract, and the code is the ground truth.

**How this task's implementer reads the conventions.** This is the catch-all layer, so read `.claude/context/conventions.md` → `## Documents of record` (a measured fact states what was measured, the command and the exact message) and the lessons ledger's adopter-facing and measurement rules. An adopter-facing command sits in its own fenced block, one per line. No wall-clock figure measured in a session goes into a document.

### Targets

- `docs/watcher.md`: §1 `**The status vocabulary — one live state and five a session ends in.**`; §4 `**The usage gate acts on the one signal no run can observe about itself.**`, plus its knobs paragraph if the fallback is named there.
- `docs/remote-execution.md`: `### Resuming without the local watcher` (the **Wait in the job** and **Hand it to the poller** bullets), and the variables-table row `REMOTE_WAIT_MAX_SECS`.
- `docs/development.md`: `**Gate 4 — `init` against a throwaway fixture.**`, up to but not into `**Run time, measured.**`.

**Work:**

- [ ] `docs/watcher.md` §1: after *"`remote-run.sh` reads and writes it (`sync`, `stop`)"*, state the rules:
  - every writer, whether the watcher, the watcher's own session subshell or `remote-run.sh`, goes through the one library writer;
  - that writer serializes on a lock beside the file, and readers need no lock;
  - a pair of fields a reader decides on is written in one step;
  - `paused_by` / `pause_reason` are recorded before the `PAUSE` they describe.

  Cite `cli/templates/scripts/lib/harness-run-lib.sh` → `THE RUN REGISTRY.` as the place the rules live, rather than restating the lock's mechanics.
- [ ] `docs/watcher.md` §4: add that a run the gate paused whose reset time is missing is given the gate's one-hour fallback and reported once, never left paused indefinitely. Add that the hold marker is bounded by the recorded or repaired time and comes down on the pass that drops `RESUME`. Keep *"A run paused **by hand** is never auto-resumed"* as it is.
- [ ] `docs/remote-execution.md`: edit the **Wait in the job** bullet so it states:
  - a lost reset time is repaired with the one-hour fallback before the choice, which on a hosted runner means the poller;
  - every in-job wait, self-hosted included, ends with `wait-poller` and one notification once it passes the reset by `REMOTE_WAIT_MAX_SECS` without a resume.

  Make the `REMOTE_WAIT_MAX_SECS` row's meaning cover both uses.
- [ ] `docs/development.md` → Gate 4: add a paragraph stating:
  - `npm test` gives every test a 300-second timeout, and why that value: the whole suite's recorded 118 s on 10 cores under `**Run time, measured.**`, so no honest single case approaches it;
  - a hung case therefore fails by name in the TAP output;
  - the watcher suites also bound each shell run and kill its process group, so no watcher is left behind.

  Then add a sub-paragraph recording **how the job-mode usage race is shown closed**:
  - the repeat command in its own fenced block, with Task 7's spelling;
  - what it does: N concurrent job-mode watchers, each running the usage case whose stub exits within 0.1 s of `PAUSE`, which is the load that exposed the race;
  - what counts as a pass: every repetition `job: completed stop`;
  - that the figure is taken by hand, outside any headless session, on an otherwise idle machine, with the date, host, Node version, N and the pass count recorded here;
  - until then it reads **not yet measured**.

  It sits beside the existing `HARNESS_TEST_CONCURRENCY=1 npm test` diagnosis note, without editing that note.

**Verification:**

- Every `change` row of the story index's `## Scope register` owned by Task 8 (rows 5, 6, 8, 9 and 21) has been edited, and no `no-change` row was touched. Re-run derivation entries A and B, and confirm the file list is still ⊆ the register's rows.
- Each statement added is checked against the code it describes. For example, the bound's formula is read off `run_job`'s `usage)` arm and the timeout off `cli/package.json`, never off this file.
- The repeat command appears in a fenced block, one command per line, and matches the spelling in `cli/test/watcher-remote-job.test.mjs`'s header byte for byte.
- No figure measured in this session appears in any of the three documents.
