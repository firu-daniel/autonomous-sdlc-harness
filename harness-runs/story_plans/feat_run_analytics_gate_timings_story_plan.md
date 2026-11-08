# Story: Gate and test-file durations in the run analytics

## Context

Each Run gates round of this repository writes two timing records beside its log under `<state_dir>/test_run_logs/<sanitized branch>/`: `<label>.gates.tsv`, written by `scripts/lib/gate-round-lib.sh` (header `THE RECORDS`), and `<label>.<phase>.tests.tsv` for the phases `focused` and `full`, written by `scripts/lib/test-timing-reporter.mjs` (header `THE RECORD`). Both are gitignored, so they are lost when the run copy is cleaned up. This branch copies the rows of every **finished** round into the run's committed analytics, `<state_dir>/run_analytics/<branch>/run-analytics.json` and `run-analytics.md`, which the watcher already writes and commits after every session (`autonomous-watcher.sh` → `record_run_analytics`, unchanged by this branch).

**Where the reading lives: in `run-analytics.sh` and its two jq libraries, not in a hook.** `THE MERGE` (the never-rewrite rule, the byte-identical re-run and the refusal of an unreadable document) is stated and enforced in one driver, and a second writer of the same document would be a second owner of that rule. The records are read **only when present**, so an adopter's run, which never writes them, gets the same bytes it gets today. `run-test-suite.sh` → `WHAT A GATE IS TOLD` already says a gate command may write its own `<label>.<suffix>` records beside the log, so a shipped reader of two named suffixes reads a shape the shipped lane already allows. It does not depend on this repository's `scripts/run-gates.sh`.

**The shapes, stated once here and defined in the task that owns each.**
- **Task 1** adds mode `rounds` to `cli/templates/scripts/lib/run-analytics.jq`. It parses and validates the records, and decides which rounds are new. Its output is `{"rounds": [<round record>…], "skipped": [{"record", "reason"}…]}`, where a round record is `{round_id, verdict, gates, tests, unreadable}`. The key names avoid `label` and `end`, which are jq keywords that the 1.5 floor forbids as keys.
- **Task 2** teaches `cli/templates/scripts/lib/run-analytics-report.jq` to accept the schema-2 document and render a `## Gate rounds` section.
- **Task 3** wires `cli/templates/scripts/run-analytics.sh`: it finds the lane, feeds mode `rounds`, merges, picks the schema and names what was skipped.
- **Task 4** updates the adopter-facing READMEs under `cli/`.
- **Task 5** updates the two plugin files that read or describe the document.
- **Task 6** makes the self-adopted copies byte-identical to the templates.
- **Task 7** updates `docs/`.

**Schema.** A document that carries at least one round is written as `schema: 2`, with a top-level `rounds` array. A document with no rounds stays `schema: 1` with no `rounds` key, byte for byte as today. An existing schema-1 document on `dev` is read as a document with no rounds. The first round recorded into it rewrites the top level as schema 2, with its `sessions` carried over untouched. The bump exists so that an older driver refuses a schema-2 document and leaves it as it is, rather than rebuilding it from `sessions` and silently dropping its rounds. `.run` is unchanged, so `/autonomous-sdlc-harness:branch-status`'s three lines read the same figures (Task 5 widens only its schema check).

**A resumed round under the same label.** A round is compared against the latest recorded occurrence of its label:
- Same verdict, gates, tests and unreadable list: nothing is recorded. This covers a re-run over the same inputs, and a resumed round that reused its finished verdict (`run-test-suite.sh` → `ONE RUN PER LABEL`).
- Any difference: the round is appended as a new occurrence `<label>#<N>`, the convention `run-analytics.jq` already uses for resumed sessions.

Either way the earlier occurrence is never rewritten. While a re-run is in flight its `.verdict` is gone, so it is skipped until it finishes.

A resumed attempt can leave an earlier attempt's `<phase>.tests.tsv` behind, because a round truncates only `<label>.gates.tsv` at its start. Task 1 therefore accepts a `<phase>.tests.tsv` only when the label's readable `gates.tsv` has at least one row of that phase. Otherwise the file is named in `skipped` (`no <phase> rows in gates.tsv`) and kept out of the round. Task 1's header states the residual and why no file-age test closes it: a stale record beside `gates.tsv` rows of its phase in which the test gate wrote nothing. The user accepted that residual as stated (`harness-runs/clarifications/feat_run_analytics_gate_timings/answer_1.md`), so no task closes it. **The recorded rounds reach jq through a file** (`--slurpfile known`), never an argument, because one recorded round carries every test file's row and the total outgrows Linux's 131072-byte per-argument limit (Task 1 defines the call, Task 3 makes it).

**Execution modes.** The driver is the same in a local run and in a GitHub Actions job, and so is the lane path. A round still running at a session's end is picked up by the next session's call. No change is made to how a round runs, to what it writes or to how its verdict is decided. `record_run_analytics` still always returns 0. A record, or the whole rounds step, that fails never stops the sessions from being written. Record paths are relative by `THE RECORD`. The round id, the gate id and the file path each also pass through the driver's existing redaction pairs (`PATHS IN THE RECORD`), through Task 1's `redact_path`: the same replace pairs as `redact`, without its home step and without its 160-character cut, because these are keys and record values, not display text, and the home step matches `/home/` anywhere in a string, so it would collapse relative paths such as `src/home/a.test.ts` and `src/home/b.test.ts` into one key.

**Top risks:**
1. **Bytes change for a run with no records.** That is every adopter, and every run before a round. Task 2 asserts that a schema-1 document renders without the new section. Task 3 asserts that a run whose lane holds only a log and a verdict writes bytes identical to a run with no lane at all.
2. **A malformed or planted record stops the analytics or carries a machine path into a commit.** Task 1 validates every field and refuses absolute and `..` paths. Task 3 refuses symlinked records, and degrades every rounds failure to a named stderr line with exit 0.
3. **A template and its self-adopted copy drift.** Task 6 copies the bytes over and verifies them with `cmp`, rather than editing the copies by hand.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_run_analytics_gate_timings/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, `cli` then `plugin`, with the catch-all `general` last.

1. [ ] **Task 1** — Add mode `rounds` to `run-analytics.jq`: parse, validate and de-duplicate Run gates round records _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Accept schema 2 in `run-analytics-report.jq` and render the `## Gate rounds` section _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Read finished rounds from the lane in `run-analytics.sh`, merge them and write schema 2 only when rounds exist _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Describe the round records in the adopter-facing READMEs under `cli/` _(layer: cli)_ _(points: 8)_
5. [ ] **Task 5** — Widen `branch-status`'s schema check to 1 or 2 and update the run-analytics row of `AUTONOMOUS_FLOW.md` _(layer: plugin)_ _(points: 5)_
6. [ ] **Task 6** — Bring the self-adopted run-analytics scripts and state-dir READMEs to the template bytes, and name the new reader in the record producers' headers _(layer: general)_ _(points: 10)_
7. [ ] **Task 7** — Update `docs/watcher.md` and `docs/development.md` for round records in the run analytics _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"adds each Run gates round's gate durations and test-file durations to the run's committed analytics, `run-analytics.json` and `run-analytics.md`"*. The prompt's goal 4 extends it: *"keeps each template and its self-adopted copy in step either way"*.

**Derivation entry 1: repository prose (command).** Re-run verbatim from the checkout root: `git grep -lE 'run-analytics|run_analytics|gates\.tsv|tests\.tsv' -- '*.md' '*.txt' ':!harness-runs/**'`. The `harness-runs/` exclusion leaves out past runs' own artifacts (plans, reviews, per-branch analytics), which are records of those runs and not standing text. The standing READMEs under it are entry 2's.

**Derivation entry 2: state-directory READMEs, template and self-adopted copy (command).** Re-run verbatim from the checkout root: `git grep -lE 'run-analytics|run_analytics|gates\.tsv|tests\.tsv|test_run_logs' -- 'harness-runs/README.md' 'harness-runs/*/README.md' 'cli/templates/state-dir/*/README.md'`.

**Derivation entry 3: the lessons ledger's rows (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that standing ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it governs a measurement record, its truncation, or a timing figure. Those are the three things this branch writes.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

**Revision round 1.** Tasks 3 and 6 gained `cli/templates/scripts/lib/harness-run-lib.sh` and `scripts/lib/harness-run-lib.sh` as targets, with comment edits only. Both are source files, so they are not corpus sites. All three entries were run again after the change, and every site they reach is still a row below.

**Revision round 2.** No target was added or removed. Entries 1 and 2 were re-run verbatim and reach only sites already in rows 1–18. Entry 3 was re-walked with its own decision rule, and it also reaches two *Evidence and measurement* rules that had no row. They are now rows 21 and 22, so every site each entry reaches appears as a row below.

**Revision round 5.** No task or target file was added, removed or split: the edits sit inside Tasks 1, 2 and 3's existing targets, so the derivation entries' reach is unchanged. Row 19's reason was updated for `redact_path`.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/state-dir/run_analytics/README.md` (the opening "Two files per branch" paragraph) | template | entries 1 and 2, `run_analytics` | `change` | Task 4 |
| 2 | `harness-runs/run_analytics/README.md` (the same paragraph) | self-adopted | entry 2, `run_analytics` | `change` | Task 6, the template's bytes |
| 3 | `cli/templates/state-dir/test_run_logs/README.md` ("A gate command may also write its own records for the round beside the log") | template | entry 2, `test_run_logs` | `change` | Task 4 |
| 4 | `harness-runs/test_run_logs/README.md` (the same sentence) | self-adopted | entry 2, `test_run_logs` | `change` | Task 6, the template's bytes |
| 5 | `harness-runs/README.md` ("the full output of each Run gates round … under `<state_dir>/test_run_logs/`") | — | entry 2, `test_run_logs` | `no-change` | it lists what git ignores; the lane stays ignored, and only rows copied out of it are committed, under `run_analytics/` |
| 6 | `cli/templates/scripts/README.md` ("to record that session's time, cost and reliability under `<state_dir>/run_analytics/`") | — | entry 1, `run-analytics` | `change` | Task 4 |
| 7 | `cli/README.md` ("to record that session's time, cost and reliability under `<state_dir>/run_analytics/`") | — | entry 1, `run-analytics` | `change` | Task 4 |
| 8 | `plugin/commands/branch-status.md` ("whose `schema` is not `1`") | — | entry 1, `run-analytics` | `change` | Task 5 |
| 9 | `plugin/docs/AUTONOMOUS_FLOW.md` (the "Run analytics — each headless session's time, cost and reliability" row) | — | entry 1, `run-analytics` | `change` | Task 5 |
| 10 | `docs/watcher.md` → `### Run analytics` ("**What it records.**") and the `lib/run-analytics.jq` / `run-analytics.sh` rows of the script table | — | entry 1, `run-analytics` | `change` | Task 7 |
| 11 | `docs/development.md` → `## 5. Verifying a change` ("the records never leave `test_run_logs/`, which gate 6a skips by name") | — | entry 1, `gates.tsv` | `change` | Task 7, because the sentence becomes false: the records' rows now reach `run_analytics/` |
| 12 | `docs/development.md` ("**The suite under jq 1.6, by hand.**", and the FR4 / `git show origin/<branch>:` lines) | — | entry 1, `run-analytics` | `no-change` | dated measurements and a read route, which stay true: no jq floor or record path changes |
| 13 | `ARCHITECTURE.md` (the `autonomous-format-stream.sh` coupling row: "a third by `cli/templates/scripts/run-analytics.sh`") | — | entry 1, `run-analytics` | `no-change` | that table lists couplings to the agent runtime's formats; the round records are this repository's own format, not the engine's |
| 14 | `docs/cli.md` ("the run-analytics script with its two `jq` programs") | — | entry 1, `run-analytics` | `no-change` | it names the shipped files, and their set is unchanged |
| 15 | `docs/remote-execution.md` ("the run-analytics record committed after each session") | — | entry 1, `run-analytics` | `no-change` | the commit point and its timing are unchanged |
| 16 | `docs/sandbox-verification.md` (rows CS1, FR4, JS3 and the 2026-10-27 sweep paragraph) | — | entry 1, `run-analytics` | `no-change` | dated evidence rows of past runs; editing them would falsify the record |
| 17 | `plugin/hooks/README.md` → `## The deny list` ("`run-analytics.sh`, `task-offer-check.sh`, `scratch-run.sh` — stay allowed") | — | entry 1, `run-analytics` | `no-change` | the basename set is unchanged |
| 18 | `examples/notes-app/README.md` ("added the main checkout's `scripts/run-analytics.sh` to `denyWrite`") | — | entry 1, `run-analytics` | `no-change` | the example profile's re-render history; no profile entry changes |
| 19 | `harness-runs/lessons.md` → *Evidence and measurement*: "A measurement script stores and reports every reading in full; truncation belongs to a display" | — | entry 3, measurement record and its truncation | `no-change` | a constraint this plan satisfies: the JSON keeps every row, and every round id, gate id and file path in full, through `redact_path`, which applies the replace pairs only, with neither the home step nor the 160-character cut, so no two paths merge into one key (Task 1). Only the Markdown shows the slowest N, sorted by the report itself (Task 2) |
| 20 | `harness-runs/lessons.md` → *Evidence and measurement*: "A wall-clock figure in a document of record is never one a run measured inside its own session" | — | entry 3, timing figure | `no-change` | the analytics are a run's measurement record, not a document of record, and no plan step uses an in-run timing as acceptance evidence: every test reads fixed fixture records |
| 21 | `harness-runs/lessons.md` → *Evidence and measurement*: "A figure measured under a test stub or a fixture-sized corpus never justifies a design decision" | — | entry 3, timing figure used for a decision | `no-change` | a constraint this plan satisfies: no design decision of this branch rests on a measured figure. The file route for the recorded rounds rests on Linux's stated `MAX_ARG_STRLEN` and on the record's shape (one row per test file), and the fixture tests assert record handling, never a timing. This branch ships the real-shape source, the rows of real rounds, and the shard decisions `feat_ci_gates` takes from them are that branch's to cite |
| 22 | `harness-runs/lessons.md` → *Evidence and measurement*: "When a check moves to reading a field one producer writes, the same change makes every path that stands in for that producer … write the field too" | — | entry 3, a new reader of measurement records | `no-change` | a constraint this plan satisfies: the new reader reads only fields the two producers already write, and no existing check moves to a new field. The paths standing in for the producers are this branch's own fixtures, and each writes every field mode `rounds` validates (Task 1's built input, Task 3's hand-written records in the `THE RECORDS` / `THE RECORD` shapes) |
