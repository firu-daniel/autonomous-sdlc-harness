# Story: Report the network calls a run's sandbox refused

## Context

An unattended run's profile sets `sandbox.network.strictAllowlist: true`, and its `allowedDomains` holds only what `harness.config.json` → `sandbox.allowedDomains` lists, plus `127.0.0.1` where the interactive-test browser wiring applies (`cli/src/generators/sandboxProfile.ts` → `expectedSandbox`). The shipped list is empty, so a sandboxed call reaches no domain (`docs/sandbox-verification.md` rows N1 and N5). A refusal is visible today only in the run's raw `<state_dir>/autonomous_logs/<branch>.stream.jsonl`, and the only code that recognises a refusal string is the sandbox probe's judge (`scripts/lib/sandbox-probe/judge.sh` → `sp__layer`, the `network` arm, and `SP_N5_CANNOT_WIDEN`). This branch surfaces those refusals in the run's committed analytics, `<state_dir>/run_analytics/<branch>/run-analytics.json` and `run-analytics.md`, and in `/autonomous-sdlc-harness:branch-status`.

**Where the reading lives: in `run-analytics.sh` and its two jq programs, not in a new script.** The watcher already runs `run-analytics.sh` over the stream after every session, locally and in a GitHub Actions job alike (`autonomous-watcher.sh` → `record_run_analytics`, unchanged by this branch), and the driver already reads the branch's Run gates lane. So the report needs no new script, no new `OUTER_LOOP_SCRIPTS` row and no new permission in any profile. Every program keeps its floor: bash 3.2 for the driver, jq 1.5 for both programs (no regex, so every match is `contains` / `split` / `index`).

**Two parts, with different trust.**
- **From the session stream — reliable.** Mode `sessions` of `lib/run-analytics.jq` gives each new session record a `network_refusals` array: one entry per tool call whose result carries a refusal string, with the context, the tool, the call's command, the host and port where the refusal names them, and the refusal line. The strings are the judge's `network` arm plus N5's `allowed_domains cannot widen network access`, each quoted from a measured row: N1 (`CONNECT tunnel failed, response 403`, as `curl: (56)` on macOS and Linux and `curl: (7)` on the runner; `<sandbox_violations> deny network-outbound <host>:<port> (host is not on the allow list)`), N5, CS3 (`sandbox proxy: <host>:<port>: 403 host is not on the allow list`) and P1 (`This proxy requires authentication`). N3 and N4 record no refusal string and are not matched. A session record written before this branch has no such key and is reported as *not scanned*, never as *none*.
- **From the gate logs — best effort, labelled so.** A new mode `gate_logs` of `lib/run-analytics.jq` scans each finished round's `<label>.log` for the proxy strings and for the plain connect errors a gate run under the bubblewrap launcher would print instead (`launch-sandboxed-gates.sh` → `NO NETWORK`): `ECONNREFUSED`, `ENETUNREACH`, `EHOSTUNREACH`, `EAI_AGAIN`. Those four are Node's and libc's error-code names, **not strings any recorded run measured** — no row in `docs/sandbox-verification.md` records a gate reaching for a host. Each match is listed as a *possible network attempt*, with the test file where the log names one. The report states its blind spots: a test that catches the error and passes leaves no trace; a plain connect error cannot be told apart from an unreachable host; on macOS, Seatbelt's own violation records go to the system log, not to the test output; and a test whose name or output quotes one of these strings is listed too.

**The shapes, stated once here and defined in the task that owns each.**
- **Task 1** owns `cli/templates/scripts/lib/run-analytics.jq`: the string table, the session record's `network_refusals` key, and mode `gate_logs`, whose output is `{"gate_logs": [{log_id, matches: [{kind, test_file, line, count}]}]}`.
- **Task 2** owns `cli/templates/scripts/lib/run-analytics-report.jq`: schema 3, the `.run.network` roll-up, and the two Markdown sections `## Network refusals` and `## Possible network attempts in gate logs (best effort)`.
- **Task 3** owns `cli/templates/scripts/run-analytics.sh`: it hands each finished round's log to mode `gate_logs`, merges `gate_logs`, picks the schema and widens the document check.
- **Task 4** updates the adopter-facing READMEs under `cli/`.
- **Task 5** updates `branch-status` and the flow document's run-analytics row.
- **Task 6** brings the self-adopted copies to the template bytes and names the mirror in the judge's header.
- **Task 7** updates `docs/watcher.md`, `docs/cli.md` and `ARCHITECTURE.md`.

**Schema.** A document that carries `gate_logs` is written as `schema: 3`, with both a `gate_logs` array (non-empty) and a `rounds` array (possibly empty). Schema 2 (rounds, no `gate_logs`) and schema 1 (neither) keep their meaning. The bump exists for the reason schema 2 did: an older driver refuses a schema-3 document and leaves it as it is, rather than rebuilding it and silently dropping its `gate_logs`. Every finished round's log is scanned whether or not the round wrote timing records, so an adopter's record becomes schema 3 once its first round finishes, and its Markdown can then say *no possible network attempt in N round logs*. The session part needs no bump: a session record is carried over verbatim by every driver.

**Read-only.** Nothing in this branch changes a verdict, an exit status, a notification or what a round runs or writes. `run-analytics.sh` keeps its stdout forms, and `branch-status` stays read-only.

**Top risks:**
1. **False positives from text that merely quotes a refusal string.** This repository's own sessions read and grep `docs/sandbox-verification.md`, and its tests name these strings. Task 1 counts a result only when it is an error result carrying a table string, or carries a line that *begins* `<sandbox_violations>`. In gate logs, the TAP test-name lines (`ok `, `not ok `, `# Subtest: `) are used only to attribute a test file, never matched. Its fixture includes a non-error read that quotes a refusal string and must not be listed.
2. **A machine path carried into a commit.** Gate-log lines carry absolute paths by construction (`cli/templates/state-dir/test_run_logs/README.md`). Task 1 sends every recorded line, command and test-file name through the driver's redaction pairs plus the home step, uncut, and Task 3's end-to-end case asserts that neither output file carries the fixture root.
3. **Silent drift between the judge's strings and the report's.** Task 1's table mirrors `judge.sh`. Its test fails when a judge string is missing from the table, and Task 6 names the mirror in the judge's own header.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_network_refusal_report/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, `cli` then `plugin`, with the catch-all `general` last.

1. [ ] **Task 1** — Recognise network refusals in `run-analytics.jq`: each session's `network_refusals`, and mode `gate_logs` _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Accept schema 3 in `run-analytics-report.jq`, roll up `.run.network` and render the two network sections _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Hand finished rounds' logs to mode `gate_logs` in `run-analytics.sh`, merge them and write schema 3 _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Describe the network report in the adopter-facing READMEs under `cli/` _(layer: cli)_ _(points: 8)_
5. [ ] **Task 5** — Show the network report in `branch-status` and name it in `AUTONOMOUS_FLOW.md`'s run-analytics row _(layer: plugin)_ _(points: 8)_
6. [ ] **Task 6** — Bring the self-adopted run-analytics scripts and state-dir READMEs to the template bytes, and name the mirror in `judge.sh` _(layer: general)_ _(points: 10)_
7. [ ] **Task 7** — Document the network report in `docs/watcher.md`, `docs/cli.md` and `ARCHITECTURE.md` _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Every refused network call in a run's sessions is listed with the session, the tool call's command, the host and port where the refusal names them, and the refusal line. It is shown in `/autonomous-sdlc-harness:branch-status` and in the run's `run-analytics.md`."* Goal 2 extends it: *"From the gate logs, a best-effort section, labelled as such."*

**Derivation entry 1: prose naming the run analytics (command).** Re-run verbatim from the checkout root: `git grep -lE 'run-analytics|run_analytics' -- '*.md' '*.txt' ':!harness-runs/**'`. The `harness-runs/` exclusion leaves out past runs' own artifacts; the standing READMEs under it are entry 3's.

**Derivation entry 2: prose naming a network refusal or the allowlist (command).** Re-run verbatim from the checkout root: `git grep -lE 'sandbox_violations|CONNECT tunnel failed|host is not on the allow list|strictAllowlist|allowedDomains' -- '*.md' '*.txt' ':!harness-runs/**'`.

**Derivation entry 3: state-directory READMEs, template and self-adopted copy (command).** Re-run verbatim from the checkout root: `git grep -lE 'run-analytics|run_analytics|test_run_logs' -- 'harness-runs/README.md' 'harness-runs/*/README.md' 'cli/templates/state-dir/*.md' 'cli/templates/state-dir/*/README.md'`. The `cli/templates/state-dir/*.md` pathspec reaches the root README template, `cli/templates/state-dir/README-root.md`, whose self-adopted copy is `harness-runs/README.md`.

**Derivation entry 4: the lessons ledger's rows (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that standing ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it sits under `## Evidence and measurement`, because this branch writes a measurement record derived from a run's stream and logs.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/state-dir/run_analytics/README.md` (the opening "Two files per branch" paragraph and the "mistake worth naming" paragraph) | template | entries 1 and 3, `run_analytics` | `change` | Task 4 |
| 2 | `harness-runs/run_analytics/README.md` (the same paragraphs) | self-adopted | entry 3, `run_analytics` | `change` | Task 6, the template's bytes |
| 3 | `cli/templates/state-dir/test_run_logs/README.md` ("reads that round's `<label>.gates.tsv` … and never the log"; "It never reaches a commit") | template | entries 1 and 3, `run-analytics`, `test_run_logs` | `change` | Task 4: the sentence becomes false, because the driver now reads each finished log for matching lines |
| 4 | `harness-runs/test_run_logs/README.md` (the same sentences) | self-adopted | entry 3, `test_run_logs` | `change` | Task 6, the template's bytes |
| 5 | `harness-runs/README.md` ("the full output of each Run gates round … under `<state_dir>/test_run_logs/`") | self-adopted | entry 3, `test_run_logs` | `no-change` | it lists what git ignores; the lane stays ignored, and only redacted matching lines are committed, under `run_analytics/` |
| 5a | `cli/templates/state-dir/README-root.md` (the same "full output of each Run gates round … under `<state_dir>/test_run_logs/`" sentence) | template | entry 3, `test_run_logs` | `no-change` | it lists what git ignores; the lane stays ignored, and only redacted matching lines are committed, under `run_analytics/` |
| 6 | `cli/templates/scripts/README.md` ("to record that session's time, cost and reliability under `<state_dir>/run_analytics/`") | — | entry 1, `run_analytics` | `change` | Task 4 |
| 7 | `cli/README.md` (the same clause) | — | entry 1, `run_analytics` | `change` | Task 4 |
| 8 | `plugin/commands/branch-status.md` → step 4's **Run analytics** bullet ("whose `schema` is neither `1` nor `2`") | — | entry 1, `run-analytics` | `change` | Task 5 |
| 9 | `plugin/docs/AUTONOMOUS_FLOW.md` (the "Run analytics — each headless session's time, cost and reliability" row) | — | entry 1, `run-analytics` | `change` | Task 5 |
| 10 | `docs/watcher.md` → `### Run analytics` ("**What it records.**") and the `lib/run-analytics.jq` / `run-analytics.sh` rows of the script table | — | entries 1 and 2, `run-analytics` | `change` | Task 7 |
| 11 | `docs/watcher.md` ("**`PERMISSION_MODE` defaults to `dontAsk`.**", "a profile gap shows up as a refusal in the run's stream") | — | entry 2, `strictAllowlist` | `no-change` | it states where a refusal happens, which is unchanged; Task 7's new paragraph in `### Run analytics` of the same file says where it is now reported |
| 12 | `docs/cli.md` → §6 "**The network.**" and "**The domain list ships empty but for one conditional entry.**" paragraphs | — | entry 2, `strictAllowlist` | `change` | Task 7: one sentence naming where a refused host is reported, and that an intended host is added to `sandbox.allowedDomains` |
| 13 | `docs/cli.md` ("**Two families land in `scriptsDir`**", the run-analytics script with its two `jq` programs) | — | entry 1, `run-analytics` | `no-change` | it names the shipped files, and their set is unchanged |
| 14 | `docs/cli.md` ("**Headless parity, measured on three calls:**", the `profile-sandbox` bullet) | — | entry 2, `strictAllowlist` | `no-change` | dated measurements and a `doctor` grading, both unchanged |
| 15 | `ARCHITECTURE.md` (the `autonomous-format-stream.sh` coupling row: "a third by `cli/templates/scripts/run-analytics.sh` through `lib/run-analytics.jq`") | — | entry 1, `run-analytics` | `change` | Task 7: the reader now binds `tool_result` text and `is_error`, and the engine's refusal strings |
| 16 | `docs/development.md` ("**The suite under jq 1.6, by hand.**", the `git show origin/<branch>:` read route, FR4) | — | entry 1, `run-analytics` | `no-change` | dated measurements and a read route, which stay true: no jq floor or record path changes |
| 17 | `docs/sandbox-verification.md` (rows N1, N3, N4, N5, CS3, P1 and their Linux and runner rows; CS1, FR4, JS3) | — | entries 1 and 2 | `no-change` | dated evidence rows; this branch quotes their strings and measures nothing, so editing them would falsify the record |
| 18 | `docs/sandbox-record.md` ("**What the list is.**", "**`strictAllowlist` is honoured from `--settings`:**") | — | entry 2, `strictAllowlist`, `allowedDomains` | `no-change` | a record of measured containment, unchanged by a report |
| 19 | `docs/config.md` (the `sandbox.allowedDomains` row) | — | entry 2, `allowedDomains` | `no-change` | the key's meaning and default are unchanged; the row links `docs/cli.md` §6, which row 12 extends |
| 20 | `docs/remote-execution.md` ("the run-analytics record committed after each session") | — | entry 1, `run-analytics` | `no-change` | the commit point and its timing are unchanged |
| 21 | `plugin/hooks/README.md` → `## The deny list` ("`run-analytics.sh` … stay allowed") | — | entry 1, `run-analytics` | `no-change` | the basename set is unchanged |
| 22 | `plugin/agents/layer-implementer.md` ("**A sandbox refusal is the boundary working, in every mode.**") | — | entry 2, `allowedDomains` | `no-change` | an implementer's reading of a refusal inside its own unit; the report is written after the session and changes nothing an implementer does |
| 23 | `examples/notes-app/README.md` (the profile re-render history) | — | entry 1, `run-analytics`; entry 2, `strictAllowlist` | `no-change` | no profile entry and no token-carrying template changes |
| 24 | `ROADMAP.md` (the "`doctor` sandbox checks" row) | — | entry 2, `allowedDomains` | `no-change` | it records shipped `doctor` checks, none of which changes |
| 25 | `schemas/negative/README.md` (the negative-fixture description) | — | entry 2, `allowedDomains` | `no-change` | no schema key or fixture changes |
| 26 | `harness-runs/lessons.md` → *Evidence and measurement*: "A figure measured under a test stub or a fixture-sized corpus never justifies a design decision" | — | entry 4 | `no-change` | a constraint this plan satisfies: no decision rests on a measured figure; every recognised string is quoted from a measured row, and the four connect-error names are labelled unmeasured wherever they appear |
| 27 | `harness-runs/lessons.md` → *Evidence and measurement*: "A feature that ships as \"not yet measured\" ships the seam that will measure it" | — | entry 4 | `no-change` | the session part matches measured strings only; the gate-log part ships on by default because the task prompt's goal 2 asks for it in every run, labelled best effort, and its recorded lines are the data a later measurement of the connect shapes starts from |
| 28 | `harness-runs/lessons.md` → *Evidence and measurement*: "A decision rule's outcome is a proposal to the maintainer" | — | entry 4 | `no-change` | the report decides nothing and writes no pending work |
| 29 | `harness-runs/lessons.md` → *Evidence and measurement*: "A wall-clock figure in a document of record is never one a run measured inside its own session" | — | entry 4 | `no-change` | this branch records no timing figure |
| 30 | `harness-runs/lessons.md` → *Evidence and measurement*: "Attribute a measured effect to one rule family only after a control run" | — | entry 4 | `no-change` | the report attributes nothing to a rule family; a host and port are recorded only where the refusal line names them |
| 31 | `harness-runs/lessons.md` → *Evidence and measurement*: "A measurement script stores and reports every reading in full; truncation belongs to a display" | — | entry 4 | `no-change` | a constraint this plan satisfies: commands, refusal lines, gate-log lines and test-file names are stored uncut (Task 1's `redact_text`), and identical gate-log lines are kept as one entry with a `count`, never dropped |
| 32 | `harness-runs/lessons.md` → *Evidence and measurement*: "Grade a write probe on what reached the disk" | — | entry 4 | `no-change` | no write probe is graded |
| 33 | `harness-runs/lessons.md` → *Evidence and measurement*: "When a check moves to reading a field one producer writes, the same change makes every path that stands in for that producer … write the field too" | — | entry 4 | `no-change` | a constraint this plan satisfies: Task 2's roll-up reads `network_refusals`, which mode `sessions` writes; an absent key is the defined *not scanned* state for records predating it, and Task 2's new suite builds its stand-in session records with the key |
