### Task 4 — Describe the round records in the adopter-facing READMEs under `cli/`

**Goal:** Make the four READMEs under `cli/` that describe the run analytics or the Run gates lane say what the analytics now hold. They should say that `run-analytics.sh` copies a finished round's record rows, never its log, into the committed analytics, and only where the round wrote such records.

**Depends on:** Task 3. That task states the behaviour in `cli/templates/scripts/run-analytics.sh` → `GATE ROUNDS`:
- A finished round is a `<label>.verdict` in `<state_dir>/test_run_logs/<sanitized branch>/`.
- The records read are `<label>.gates.tsv`, `<label>.focused.tests.tsv` and `<label>.full.tests.tsv`.
- They are recorded once per label, and a changed re-run is appended as `<label>#<N>`.
- The document is schema 2 only when it carries a round.

These READMEs describe that behaviour and cite the header as the format of record. They restate no field list.

**Where this task stops.** The self-adopted copies `harness-runs/run_analytics/README.md` and `harness-runs/test_run_logs/README.md` are **Task 6's**: it copies this task's bytes over. `docs/` is **Task 7's**.

### Targets

- `cli/templates/state-dir/run_analytics/README.md`
- `cli/templates/state-dir/test_run_logs/README.md`
- `cli/templates/scripts/README.md`
- `cli/README.md`

**Work:**

- [ ] `cli/templates/state-dir/run_analytics/README.md`:
  - **Opening paragraph:** extend it to say that, where a Run gates round wrote its own timing records, the JSON also keeps one entry per finished round with every gate's and test file's seconds, and `run-analytics.md` gains a `## Gate rounds` section showing the slowest test files. Name `run-analytics.sh`'s header as the format of record.
  - **Closing "mistake worth naming" paragraph:** add one sentence. A test-file total is a sum of each file's own seconds, not the gate's wall time.
- [ ] `cli/templates/state-dir/test_run_logs/README.md`: after "A gate command may also write its own records for the round beside the log", add a sentence. `run-analytics.sh` reads a finished round's `<label>.gates.tsv` and `<label>.<phase>.tests.tsv` rows into `<state_dir>/run_analytics/<branch>/`, and never the log. Keep the "machine-local and gitignored" paragraph as it is: the files stay ignored.
- [ ] `cli/templates/scripts/README.md` and `cli/README.md`: in each, extend the clause "to record that session's time, cost and reliability under `<state_dir>/run_analytics/`". Add "and, where a Run gates round wrote its own timing records, that round's gate and test-file seconds". Change nothing else in either paragraph.

**Verification:**

- `grep -n "Gate rounds\|gates.tsv" cli/templates/state-dir/run_analytics/README.md cli/templates/state-dir/test_run_logs/README.md` shows the new sentences.
- Neither README names a branch, a machine path or a gate id of this repository. The template texts use `<state_dir>` and `<label>`, so they are true in every adopting repository.
- No command an adopter is meant to run is added inline.
