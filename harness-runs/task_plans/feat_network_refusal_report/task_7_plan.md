### Task 7 — Document the network report in `docs/watcher.md`, `docs/cli.md` and `ARCHITECTURE.md`

**Goal:** The maintainer-facing documents say where a refused network call is now reported, how far that report can be trusted, and that the run-analytics reader now binds the engine's `tool_result` text and its refusal strings.

**Depends on:** Tasks 1, 2, 3 and 5. Use their names exactly:
- **Task 1:** `lib/run-analytics.jq` → *Session record*'s `network_refusals`, and its mode `gate_logs`. The strings it matches are quoted from `docs/sandbox-verification.md` rows N1, N5, CS3 and P1. A session result counts when it is an error result carrying a string, or carries a line beginning `<sandbox_violations>`.
  - The four connect-error names `ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH` and `EAI_AGAIN` are unmeasured.
  - The four blind spots:
    - a test that catches the error and passes leaves no trace;
    - a plain connect error cannot be told apart from an unreachable host;
    - on macOS, Seatbelt's own violation records go to the system log, not to the test output;
    - a test whose name or output quotes a string is listed too.
- **Task 2:** `schema: 3` when the document carries `gate_logs`, and the sections `## Network refusals` and `## Possible network attempts in gate logs (best effort)`.
- **Task 3:** `run-analytics.sh` → `GATE LOGS`.
- **Task 5:** the `Network refusals:` and `Possible network attempts in gate logs (best effort):` lines of `/autonomous-sdlc-harness:branch-status`.

**How this task's implementer reads the conventions.** This is the catch-all task: read every configured layer's conventions document, since the prose describes a `cli` template's behaviour and a `plugin` command's output. A measured fact states what was measured, so every refusal string cited here names its row in `docs/sandbox-verification.md`, and the connect-error names are said to be unmeasured.

### Targets

- `docs/watcher.md`: `### Run analytics`, and the `lib/run-analytics.jq, lib/run-analytics-report.jq` and `run-analytics.sh` rows of the script table.
- `docs/cli.md`: §6, the "**The network.**" paragraph.
- `ARCHITECTURE.md`: the coupling row whose first cell begins `cli/templates/scripts/autonomous-format-stream.sh`.

**Work:**

- [ ] **`docs/watcher.md` → `### Run analytics`.**
  - **"What it records."** Add the network refusals per session and the gate-log scan. Replace the schema sentence with: `schema: 3` when the document carries gate-log entries, `schema: 2` when it carries rounds but none, `schema: 1` otherwise. Add `run-analytics.sh` → `GATE LOGS` to the formats of record it names.
  - **New `**Network refusals.**` paragraph** after "**Measurement only.**":
    - what counts, with the rows each string is quoted from;
    - that N3's and N4's results are not refusals;
    - the residuals of the counting rule (a swallowed error with no `<sandbox_violations>` line is missed; a failing command that quotes a string is listed);
    - that a session recorded before the report is shown as not scanned;
    - that the section and `branch-status` show the list.
  - **New `**Possible network attempts in gate logs.**` paragraph:**
    - what is scanned, and that it is best effort;
    - the bubblewrap launcher's `NO NETWORK` reason for the plain connect errors;
    - that those names are unmeasured;
    - the four blind spots;
    - that the log itself still never reaches a commit, only redacted matching lines.
  - **Script table.** The `lib/run-analytics.jq` / `lib/run-analytics-report.jq` row and the `run-analytics.sh` row each gain the network refusals and the gate-log scan in their description cell. The other cells are unchanged.
- [ ] **`docs/cli.md` §6, "**The network.**".** Add one sentence at its end: a call refused there is listed in the run's `run-analytics.md` → `## Network refusals`, and by `/autonomous-sdlc-harness:branch-status`, with its command and the host where the refusal names one; a host the repository's own commands are meant to reach goes in `sandbox.allowedDomains` (link `config.md`'s row as the paragraph's neighbours do).
- [ ] **`ARCHITECTURE.md`, the coupling row.**
  - In the second cell's sentence listing what the run-analytics reader also reads, add: each `tool_result`'s `is_error` and text, and the engine's network-refusal strings (the sandbox's `<sandbox_violations>` block, the proxy's `CONNECT tunnel failed` / `host is not on the allow list` / `This proxy requires authentication`, and the Bash tool's `allowed_domains cannot widen network access`), quoted from `docs/sandbox-verification.md` rows N1, N5, CS3 and P1.
  - In the third cell, add that a changed refusal string silently empties the network report rather than failing the run, and that the sandbox probe's judge, which reads the same strings, is the place a change shows first.

**Verification:**

- `grep -c 'GATE LOGS' docs/watcher.md` prints a non-zero count, and `grep -c 'schema: 3' docs/watcher.md` prints a non-zero count.
- `grep -c 'Network refusals' docs/cli.md` prints a non-zero count.
- `grep -c 'allowed_domains cannot widen network access' ARCHITECTURE.md` prints a non-zero count.
- **By reading:** no sentence added here presents the four connect-error names, or any gate-log shape, as a measured result. Every refusal string cited names its `docs/sandbox-verification.md` row. No line coordinate is written.
