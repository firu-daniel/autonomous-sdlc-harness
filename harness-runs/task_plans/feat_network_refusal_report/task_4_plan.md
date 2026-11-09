### Task 4 — Describe the network report in the adopter-facing READMEs under `cli/`

**Goal:** The READMEs an adopter receives, and the package's own README, say that the run analytics now list the network calls the sandbox refused, and the possible network attempts in finished gate logs as a best-effort section. They also stop saying that `run-analytics.sh` never reads a round's log.

**Depends on:** Tasks 1, 2 and 3. Use their names exactly:
- Each session record's `network_refusals` (Task 1, `lib/run-analytics.jq` → *Session record*). The record's `gate_logs` comes from mode `gate_logs` (Task 1).
- The Markdown sections `## Network refusals` and `## Possible network attempts in gate logs (best effort)`, and `schema: 3` when the document carries `gate_logs` (Task 2).
- The driver's `GATE LOGS` header paragraph (Task 3), the format of record for which logs are read.

**Where this task stops.** It changes no script and no test. The self-adopted copies `harness-runs/run_analytics/README.md` and `harness-runs/test_run_logs/README.md` are **Task 6's**, which copies this task's bytes. Prose under `docs/` is **Task 7's**.

### Targets

- `cli/templates/state-dir/run_analytics/README.md`
- `cli/templates/state-dir/test_run_logs/README.md`
- `cli/templates/scripts/README.md`
- `cli/README.md`

**Work:**

- [ ] **`cli/templates/state-dir/run_analytics/README.md`.**
  - In the opening paragraph, add two sentences:
    - every session record lists the network calls the sandbox refused, with the call's command, the host and port where the refusal names them and the refusal line, rendered as `## Network refusals`;
    - each finished Run gates round's log is scanned for possible network attempts, kept as the matching lines only with paths redacted and rendered as `## Possible network attempts in gate logs (best effort)`, which makes the JSON `schema: 3`.
  - Keep the existing statement that round timings are copied from the round's records and never from the log, and say that the log is read only for that scan. Name `lib/run-analytics.jq` (*Session record*, mode `gate_logs`) and `run-analytics.sh` (`GATE LOGS`) as the formats of record.
  - Add one sentence to the "mistake worth naming" paragraph: reading the gate-log section as complete, or a match in it as a refusal. A test that catches the error leaves no trace, a plain connect error looks the same as an unreachable host, and on macOS Seatbelt's own records go to the system log.
- [ ] **`cli/templates/state-dir/test_run_logs/README.md`.**
  - Replace "and never the log (`run-analytics.sh` → `GATE ROUNDS`)" with a sentence saying it also reads the round's `<label>.log` once the round has its `.verdict`, records only the lines that look like a network attempt, and replaces paths by the redaction pairs and home step (`run-analytics.sh` → `GATE LOGS`).
  - In the closing paragraph, keep "the log itself never reaches a commit", and add that only those redacted matching lines do, under `<state_dir>/run_analytics/<branch>/`.
- [ ] **`cli/templates/scripts/README.md` and `cli/README.md`.** In each, the run-analytics clause ("to record that session's time, cost and reliability under `<state_dir>/run_analytics/` and, where a Run gates round wrote its own timing records, that round's gate and test-file seconds") gains "the network calls the sandbox refused, and possible network attempts in finished gate logs". Keep the two clauses word-for-word identical to each other, as they are now.

**Verification:**

- `grep -n 'never the log' cli/templates/state-dir/test_run_logs/README.md` prints nothing.
- `grep -c 'Network refusals' cli/templates/state-dir/run_analytics/README.md` prints a non-zero count.
- `grep -c 'possible network attempts in finished gate logs' cli/templates/scripts/README.md cli/README.md` prints a non-zero count for each file.
- **By reading:** each edited README still says who writes the files and who reads them, and names the blind spots of the gate-log section only as the section's limits, not as measured results.
