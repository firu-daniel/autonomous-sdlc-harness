### Task 12 — Document the round's timings, record and failed-first phase in `docs/development.md` §5, and the reused verdict in `docs/watcher.md`

**Goal:** The two developer documents that describe the gate scripts say what this branch made them do: `docs/development.md` §5 for `scripts/run-gates.sh` (gate durations, the per-file record and the slowest-files section, the focused phase and its early stop, `pass` only from a full phase), and `docs/watcher.md`'s `run-test-suite.sh` row for the reused verdict.

**Depends on:** Task 9, `scripts/run-gates.sh`, and Task 1, `cli/templates/scripts/run-test-suite.sh` (copied to `scripts/` by Task 6). What they do, which this task describes and does not change:

- Every gate line ends `(<n> s)`. Run through `run-test-suite.sh`, the round writes `<label>.gates.tsv` and gate 4's `<label>.focused.tests.tsv` / `<label>.full.tests.tsv` beside its log under `<state_dir>/test_run_logs/<sanitized branch>/`, and the log carries `== slowest test files … ==`, the ten slowest by summed top-level test duration; run by hand, it writes no record and still prints both.
- When the previous round of the branch (the newest other `*.gates.tsv`) recorded failures, the round first runs only those units and test files — plus `2a` for a unit that needs its build — and stops with `fail` if any still fails, printing `run-gates: stopped early: …`; otherwise the rest and the whole suite run, and only that full phase can pass. An absent or unreadable record runs as before.
- The run form of `run-test-suite.sh` answers a finished verdict of its label at once when HEAD is the commit `<label>.commit` names and the tree is clean outside `<state_dir>` (the header paragraph opening `ONE RUN PER LABEL.`).

### Targets

- `docs/development.md` — §5's paragraph opening **Nine of the sixteen run unattended, and `scripts/run-gates.sh` is how.** and the **Gate 4 — `init` against a throwaway fixture.** paragraph.
- `docs/watcher.md` — the `run-test-suite.sh` row of the scripts table.

**Work:**

- [ ] `docs/development.md` §5, the `run-gates.sh` paragraph: add, after the sentence on `commands.test`, the round behaviour above — durations on every line, the records and where they live (and that they never leave `test_run_logs/`, which gate 6a skips by name), the slowest-files section, the focused phase, its stop line and that a round passes only through a full phase. Cite `scripts/run-gates.sh`'s header and `scripts/lib/gate-round-lib.sh` rather than restating the record format.
- [ ] `docs/development.md` → **Gate 4**: one sentence that `run-gates.sh` runs gate 4 as `npm run test --workspace cli -- …` with the `tap` reporter pinned beside the per-file reporter `scripts/lib/test-timing-reporter.mjs`, and that `npm test` by hand, as written, is unchanged. Record **no wall-clock figure** from any run of this branch (the lessons ledger: *"A wall-clock figure in a document of record is never one a run measured inside its own session"*).
- [ ] `docs/watcher.md`, the `run-test-suite.sh` row: after *"Its run form starts both gates detached from the calling session and prints `pending`"*, add that it instead prints the verdict of a run of its label that finished on the current commit with nothing changed outside the state directory, citing the wrapper's `ONE RUN PER LABEL` paragraph. Leave the `launch-sandboxed-gates.sh` row unchanged — the launcher still answers `pending`.

**Verification:**

- `git diff --stat` touches only the two documents, and `git diff -- docs/` adds no number followed by `s` or `min` that reads as a measured duration.
- `grep -n 'stopped early' docs/development.md` matches the library's stop line's wording (`grep -n 'stopped early' scripts/lib/gate-round-lib.sh`).
- Re-run the story index's `## Scope register` command entry verbatim; every file it lists is a register row (the closure invariant), and the rows owned by this task are the two targets above.
