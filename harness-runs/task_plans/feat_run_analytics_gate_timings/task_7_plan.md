### Task 7 — Update `docs/watcher.md` and `docs/development.md` for round records in the run analytics

**Goal:** Make the developer documentation say what the run analytics now hold, and correct the one sentence this branch makes false. `docs/development.md` says the round records "never leave `test_run_logs/`". After this branch the files still never leave it, but their rows are copied into the committed `run_analytics/` record.

**Depends on:** Tasks 3 and 6.
- **Task 3** fixes the behaviour in `cli/templates/scripts/run-analytics.sh` → `GATE ROUNDS` and `THE MERGE`:
  - A finished round is a `<label>.verdict` with at least one of `<label>.gates.tsv`, `<label>.focused.tests.tsv` and `<label>.full.tests.tsv` beside it.
  - It is recorded once per label, and a changed re-run is appended as `<label>#<N>`.
  - A refused record is named on stderr and never stops the write.
  - The document is `schema: 2` exactly when it carries a round.
- **Task 6** makes `scripts/run-analytics.sh` byte-identical to that template, so a reader of this repository's own `scripts/` finds the same text.

These documents cite those headers as the format of record and restate no field list.

**How this task's implementer reads the conventions.** This is a catch-all task. Read every configured layer's conventions document. Two rules bind it most: `.claude/context/conventions.md` → `## Documents of record` (a measured fact states what was measured and how; this task adds none), and `.claude/context/plugin.md` → `## Citation` (cite a heading or a quoted substring, never a line number).

### Targets

- `docs/watcher.md`: `### Run analytics`, and the `lib/run-analytics.jq` / `run-analytics.sh` rows of the script table.
- `docs/development.md`: `## 5. Verifying a change`, the paragraph beginning "**Nine of the sixteen run unattended, and `scripts/run-gates.sh` is how.**"

**Work:**

- [ ] `docs/watcher.md` → `### Run analytics`, in "**What it records.**":
  - Add, after the per-session sentence, that the record also keeps one entry per finished Run gates round of the branch where that round wrote its own timing records: each gate's seconds and every test file's seconds, tests and failures, keyed by the round's label.
  - Say that `run-analytics.md` renders those as `## Gate rounds` with the slowest test files only.
  - Say that the record is `schema: 2` when it carries a round and `schema: 1` otherwise.
  - Name `run-analytics.sh` → `GATE ROUNDS` as the format of record beside the existing pointers.
- [ ] **The two `docs/watcher.md` script-table rows.** In the `run-analytics.sh` row, extend "Records each headless session's time, cost and reliability from the teed stream" with "and each finished Run gates round's timing records from `<state_dir>/test_run_logs/`". In the `lib/run-analytics.jq`, `lib/run-analytics-report.jq` row, add "and round records" after "per-session records from the stream".
- [ ] **`docs/development.md`.** In the named paragraph, replace "the records never leave `test_run_logs/`, which gate 6a skips by name" with this: the record files never leave `test_run_logs/`, which gate 6a skips by name, and once a round has finished, `run-analytics.sh` copies their rows, with no machine path, into the committed `<state_dir>/run_analytics/<branch>/` record, which gate 6a does scan (`docs/watcher.md` → `### Run analytics`). Change no other sentence of the paragraph.

**Verification:**

- `grep -n "never leave" docs/development.md` shows only the reworded sentence, which now says the files stay and the rows are copied.
- `grep -n "Gate rounds\|schema: 2\|GATE ROUNDS" docs/watcher.md` shows the new text under `### Run analytics`.
- Neither edit carries a line number, an absolute path or a measured figure: both are statements of behaviour, each citing the header that states it.
