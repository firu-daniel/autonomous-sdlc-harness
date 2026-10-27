# Story: Fix the sandbox probe defects the first Gate 15 run exposed

## Context

This branch fixes the thirteen defects the first run of `scripts/sandbox-probe.sh` exposed (2026-10-27, `dev` at `214efebe`, Claude Code 2.1.311, macOS). In each one the probe, not the sandbox, gave the wrong verdict or gave none. The goal is that the maintainer can re-measure the rows the probe could not grade. The branch **takes no measurement and records no result**. After the merge the maintainer re-runs the affected legs from the main checkout. `chore_record_sandbox_probe_round1` already holds what the first run settled, in `docs/sandbox-verification.md` §0 *The probe's first run* and §5 *The probe's own defects* (PD1–PD13).

**Constraints that bind every task.**

- **No measured result is invented.** A row this branch amends changes only its call (check) column and its expected column. Its Observed and Verdict cells stay byte-identical.
- **No profile, generator, wrapper, guard or watcher behaviour changes.** The probe (`scripts/sandbox-probe.sh`, `scripts/lib/sandbox-probe/*.sh`) is in scope, and so are its tests and fixtures (`cli/test/sandbox-probe-*.test.mjs`, `cli/test/fixtures/sandbox-probe/`), Gate 15's entry in `docs/development.md` and the amended rows. Nothing under `cli/templates/`, `cli/src/`, `plugin/`, `scripts/lib/harness-run-lib.sh`, `scripts/autonomous-watcher.sh` or the wrappers is touched.
- **The probe's own tests drive every fix against recorded stream fixtures. No test launches `claude`.** So each leg fix puts its decision in a **named grading function**. The function reads a stream file and, where needed, a file on disk, and sets `SP_VERDICT` / `SP_EVIDENCE` or a stated pair of variables. It calls only functions from `core.sh`, `judge.sh` and `controls.sh`, never `hr_*`, `sp_session` or `git`, so a test can source those files plus the leg file and call it directly. Each leg task names its function's exact signature, and the test task restates it.
- **Bash 3.2 floor** (macOS `/bin/bash`): no associative array, no `test -v`, no `${var,,}`. The whole-tree type check parses every shell script. Fixtures hold no machine path. `@FIXTURE_ROOT@` stands in for every path, as in the existing fixtures.
- **Find every anchor by its quoted text or function name, never by a line number.** That includes in the docs this branch edits.

**Who owns which file.** Exactly one task owns each file.

- `scripts/lib/sandbox-probe/core.sh` and `docs/development.md` (Gate 15): Task 1.
- `scripts/lib/sandbox-probe/judge.sh`: Task 2.
- `scripts/lib/sandbox-probe/session.sh` and `scripts/sandbox-probe.sh`: Task 3.
- `scripts/lib/sandbox-probe/legs-local.sh`: Task 4.
- `scripts/lib/sandbox-probe/legs-protection.sh`: Task 5.
- `scripts/lib/sandbox-probe/legs-network.sh`: Task 6.
- `scripts/lib/sandbox-probe/legs-settings.sh`: Task 7.
- `scripts/lib/sandbox-probe/legs-wrappers.sh`: Task 8.
- `scripts/lib/sandbox-probe/legs-refresh.sh`: Task 9.
- The test suites:
  - `cli/test/sandbox-probe-judge.test.mjs`: Task 10.
  - `cli/test/sandbox-probe-git-and-legs.test.mjs`: Task 11.
  - `cli/test/sandbox-probe-evidence.test.mjs` (new): Task 12.
  - `cli/test/sandbox-probe-gates-legs.test.mjs` (new): Task 13.
  - `cli/test/sandbox-probe-protection-legs.test.mjs` (new): Task 14.
  - `cli/test/sandbox-probe-remote-legs.test.mjs` (new): Task 15.
  - Each test task also owns the fixtures it names.
- `docs/sandbox-verification.md`: Task 16.

**Cross-task interfaces, stated once.** Each per-task file restates the part it produces or consumes.

- **Row check (Task 1).** `sp_result_line <leg> <row> …` refuses a row that is not one of `sp_leg_rows <leg>`. The one exception is leg `judge` with row `-`. The refusal prints no line, writes `sandbox-probe: sp_result_line: row '<row>' is not a row of leg '<leg>' (<rows>)` on stderr, counts as a fail and returns 1.
- **Non-pass record (Task 1).** Every line whose verdict is `fail` or `not run`, and every refused line, adds its leg to `SP_NONPASS_LEGS`, a newline-separated list. `sp_leg_nonpass <leg>` returns status 0 when the leg is in that list.
- **Session registry and evidence (Task 3).**
  - The entry point sets `SP_CURRENT_LEG` before each leg runs.
  - `sp_session` records the current leg's stream, stderr, prompt and `--debug-file` paths.
  - `sp_keep_file <path>` adds an extra file to the current leg's record.
  - `sp_track_pid <pid>` registers a process for teardown to stop.
  - Teardown's first step moves the files of every leg `sp_leg_nonpass` names into `${TMPDIR:-/tmp}/sandbox-probe-evidence.XXXXXX/<leg>/`. As its last stderr line it prints `sandbox-probe: evidence of the legs that did not pass kept in <dir>`.
- **`SP_W7_DEBUG` (Task 4 → Task 5).** The path of the W7 session's `--debug-file` log, `$SP_TMP/gates-w7.debug.log`. It is set only once that session launched, and is empty otherwise.
- **Grading functions** (each leg task, consumed by Tasks 13–15):
  - Task 4: `sp__t2_grade`, `sp__td2_tmpdir`, `sp__td2_grade`.
  - Task 5: `sp__wp_w8`, `sp__wp_cs7_edit`, `sp__git_cs3_fetch`, `sp__wp_tracked`.
  - Task 6: `sp__net_n3_grade`, `sp__net_n4_grade`.
  - Task 7: `sp__cred_issued`.
  - Task 8: `sp__wr_permission_screen`.
  - Task 9: `sp__rf_r4_local_grade`.

**Ship order, and why it departs from the configured layer order.** The configured order is `cli → plugin → general`, with the catch-all last. As on `feat_unattended_sandbox_measurement`, the `cli`-layer suites test a `general`-layer script, so the dependency runs against that order. The ship order is:

1. Tasks 1–9 fix the probe (`general`).
2. Tasks 10–15 test it (`cli`).
3. Task 16 amends the record's rows (`general`).

Task 1 ships first because the leg table in `core.sh` is the probe's single declaration of what each leg expects: the contract the legs are written against (`.claude/context/conventions.md` → *Contract before consumer, always*). Its Gate 15 restatement has to change in the same task, because `cli/test/sandbox-probe-git-and-legs.test.mjs` compares the two row for row.

**Interpretations this plan takes rather than asks about.**

- **Defect 8 takes the keep-on-non-pass form, not `--keep`.** The prompt names it first. It needs no flag, and it keeps exactly the evidence a re-run needs.
- **Defect 9 (CS3) grades `git fetch origin` as an expected refusal rather than dropping it.** Keeping the call keeps §7 OR2's design measured: a run copy reaches its remote only through `<main>/scripts/` wrappers.
- **Defect 12 takes all three halves rather than naming them as not taken:**
  - CS7's `Edit` goes into the write-protection session.
  - W7's session gains a `--debug-file`, and W8 reads both logs.
  - R4's `--local` half runs as a second session of its own, so the fetch half's `ref unchanged` check is not disturbed by a merge.
- **Defect 13 (CS4) needs no code change.** `legs-wrappers.sh` → `sp__wr_cs4` already accepts exit 3 (`refresh exit 3 (…)`). Task 8 confirms this, and Task 16 amends the row's expected column.
- **Defect 7's presence-only form is `printenv <NAME> >/dev/null`.** It is judged by exit status alone and never prints a value. If the permission layer refuses that spelling, S4 reads `not run`, as it does today, and nothing is ever printed.
- **Defect 6's listener is `python3 -u -m http.server --bind 127.0.0.1 --directory <dir under SP_TMP> 0`.** It reads its port from its own startup line (`Serving HTTP on 127.0.0.1 port <n>`). Where `python3` is missing, or the listener does not answer the probe's own request, N3 reads `not run` and names why.
- **CS8 (a) needs no follow-up.** The watcher's `run_profile_check` (`scripts/autonomous-watcher.sh`) compares each strict key with jq's JSON equality against `RUN_PROFILE_SANDBOX_STRICT`, whose `sandbox.failIfUnavailable` is the boolean `true`. A string `"true"` is therefore refused with *"does not carry sandbox.enabled true, sandbox.failIfUnavailable true …"*. CS8 (b) stays a hand row, unchanged.

**Top risks:**

- **A grading function that cannot be driven from a stream.** If any leg's new decision lives inline beside `sp_session`, `git` or `hr_*`, the "tests drive every fix" constraint is broken silently. Each leg task names its function's signature and states that it calls only `core.sh` / `judge.sh` / `controls.sh`. Tasks 13–15 call those functions directly.
- **Leg table and Gate 15 drift.** Task 1 changes both in one edit, with texts that carry no `|` or tab. Task 11 keeps the existing row-for-row comparison.
- **Teardown keeping too much, or racing a live process.** Task 3 moves evidence before anything is removed and stops every registered PID. Task 12 drives three cases: a non-pass leg, a passing leg and a tracked PID. Task 4 bounds T2's waits so teardown never removes a clone under a live gate worker without first waiting for its verdict.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.**

- The orchestrator walks the `[ ]` entries below top-to-bottom.
- **Only the committing role flips a marker to `[x]`:**
  - the `committer` agent, in every flow that dispatches one;
  - the orchestrator itself, in the supervised flow, which dispatches none.
- No implementer changes a marker, or edits any other line of this section, in an index a run is iterating.
- `[ ]` markers elsewhere, such as the sub-step bullets in per-task files, are informational only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_sandbox_probe_round1_findings/task_<K>_plan.md`.

1. [x] **Task 1** — Refuse a result line whose row is not its leg's, record non-passing legs, and restate the changed legs' expected results in the leg table and Gate 15 _(layer: general)_ _(points: 20)_
2. [x] **Task 2** — Judge the denied-directory text before `permission_denials`, and grade N5's `allowed_domains cannot widen` refusal as a pass _(layer: general)_ _(points: 10)_
3. [x] **Task 3** — Keep the evidence of every leg that did not pass, stop the probe's own processes at teardown, and drop the pipe in `sp_extra_clone` _(layer: general)_ _(points: 20)_
4. [x] **Task 4** — Fix T2's result line and run the gates through `run-test-suite.sh`, give W7 a debug log, and spell TD2's control as a literal _(layer: general)_ _(points: 20)_
5. [x] **Task 5** — Take CS7's `Edit` and W7's debug log, grade CS3's fetch as an expected refusal, and drop the pipe in `sp__wp_tracked` _(layer: general)_ _(points: 20)_
6. [x] **Task 6** — Aim N3 at a loopback listener the probe owns, and grade N4 on curl's full error line _(layer: general)_ _(points: 15)_
7. [x] **Task 7** — Make the credentials session follow its prompt, check presence only, and grade a session that issued no calls as not run _(layer: general)_ _(points: 10)_
8. [x] **Task 8** — Allow P1b's prefixed call and grade a permission-layer refusal of it as not run _(layer: general)_ _(points: 10)_
9. [x] **Task 9** — Take R4's `--local` half in a session of its own _(layer: general)_ _(points: 15)_
10. [x] **Task 10** — Test the judge's file-tool precedence and N5's `cannot widen` refusal against recorded streams _(layer: cli)_ _(points: 15)_
11. [x] **Task 11** — Test that a fused or foreign row is refused and that non-passing legs are recorded _(layer: cli)_ _(points: 10)_
12. [x] **Task 12** — Test teardown's evidence keeping and its stopping of tracked processes _(layer: cli)_ _(points: 15)_
13. [x] **Task 13** — Test T2's and TD2's grading against recorded streams _(layer: cli)_ _(points: 15)_
14. [ ] **Task 14** — Test W8, CS7's `Edit`, CS3's fetch and `sp__wp_tracked` against recorded streams and logs _(layer: cli)_ _(points: 15)_
15. [ ] **Task 15** — Test N3, N4, the credentials no-calls check, P1b's permission screen and R4's `--local` grading against recorded streams _(layer: cli)_ _(points: 20)_
16. [ ] **Task 16** — Amend the rows whose call or expected result the probe now names: T2, TD2, CS3, CS4, P1b, R4, N3, N4, N5, S4, W7 _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"The probe, its tests and fixtures, Gate 15's entry and the amended rows' call and expected columns are in scope."* The rows it reaches are the ones the prompt's defects name. Where a defect says *"Amend … to the call it now names"*, or changes the call a row describes, that row's call and expected columns are `change`.

**Derivation entry 1 — the rows the defects name (command).** Re-run verbatim from the checkout root:
`grep -nE '^\| (T2|TD2|W6|W7|W8|CS3|CS4|CS7|CS8|R4|N3|N4|N5|S1|S2|S4|S5|P1b|PD[0-9]+) \|' docs/sandbox-verification.md`

**Derivation entry 2 — Gate 15's entry and its leg table (command).** Re-run verbatim:
``grep -nE '^\*\*Gate 15|^\| `(gates|mktemp|scratch|retrieval|wrappers|wrappers-refresh|planted-config|planted-files|write-protection|git|network|retry|repo-settings|credentials|invalid-profile|headless-parity)` \|' docs/development.md``

**Derivation entry 3 — other prose quoting a call or expectation this branch changes (command).** Re-run verbatim:
``git grep -nE 'http://127\.0\.0\.1/|http://169\.254\.169\.254/|harness-gates\.XXXXXX"`|printenv <name>|bash scripts/test.sh` as one exact call|exits 0 or 4|git fetch origin`; `git stash|nothing outside its own temp area' -- docs README.md ARCHITECTURE.md``

**Derivation entry 4 — the lessons ledger (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that ledger.
- **Traversal:** topic headings in file order, then each rule under its heading.
- **Decision rule:** a rule is reached when it names a temporary working copy or process, a bounded retry or wait, a measurement or a document of record, or a command an adopter runs.

**Closure invariant:** every site any derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` → row T2 (§5) | — | entries 1 and 3 | `change` | Task 16 — check and expected columns name the `run-test-suite.sh` route, and say why |
| 2 | row TD2 (§5) | — | entries 1 and 3 | `change` | Task 16 — the explicit form is a literal path, and a permission-layer refusal is `not run` |
| 3 | row CS3 (§2 *The clone layout (owed)*) | — | entries 1 and 3 | `change` | Task 16 — `git fetch origin` is an expected refusal |
| 4 | row CS4 | — | entries 1 and 3 | `change` | Task 16 — expected names exits 0, 3 or 4 |
| 5 | row CS7 | — | entry 1 | `no-change` | its check and expected already name the `Edit` (after `Read`); Task 5 takes it; the Observed cell is the maintainer's after the re-run |
| 6 | row CS8 | — | entry 1 | `no-change` | not a probe defect (task prompt *Not a probe defect: CS8 (a)*); `run_profile_check` refuses the string `"true"`, so no follow-up |
| 7 | row P1b (§3) | — | entry 1 | `change` | Task 16 — the `--allowedTools` departure and the permission-layer `not run` |
| 8 | row R4 (§3) | — | entry 1 | `change` | Task 16 — the clone-layout calls, `--local` in a session of its own |
| 9 | row N3 (§4) | — | entries 1 and 3 | `change` | Task 16 — the probe-owned listener and the body test |
| 10 | row N4 (§4) | — | entries 1 and 3 | `change` | Task 16 — curl's full error line, and `not run` where it cannot tell |
| 11 | row N5 (§4) | — | entry 1 | `change` | Task 16 — expected adds the `allowed_domains cannot widen network access` refusal |
| 12 | row S1 (§4) | — | entry 1 | `no-change` | the call and expected are unchanged; the leg's prompt and no-calls check are the probe's (Task 7), not the row's |
| 13 | row S2 (§4) | — | entry 1 | `no-change` | as row 12 |
| 14 | row S4 (§4) | — | entries 1 and 3 | `change` | Task 16 — the presence-only `printenv <name> >/dev/null` call |
| 15 | row S5 (§4) | — | entry 1 | `no-change` | as row 12 |
| 16 | row W6 (§4) | — | entry 1 | `no-change` | the judge's fix (Task 2) changes no call or expectation |
| 17 | row W7 (§4) | — | entry 1 | `change` | Task 16 — the session's `--debug-file` departure |
| 18 | row W8 (§4) | — | entry 1 | `no-change` | its check already names *"W6's and W7's sessions"* |
| 19 | rows PD1–PD13 (§5 *The probe's own defects*) | — | entries 1 and 3 (PD3, PD13) | `no-change` | each Follow-up already names this branch (`#185`); the re-run's record, not this branch, closes them (the *no measured result* constraint) |
| 20 | row F2 (§5) | — | entry 3 | `no-change` | describes `run-gates.sh`'s own explicit template, not the probe's control |
| 21 | row TD1 (§5) | — | entry 3 | `no-change` | an unsandboxed measurement of record, untouched by the probe |
| 22 | §6 → *Loopback and link-local destinations* | — | entry 3 | `no-change` | it names what would settle it (a listener), which stays owed until the re-run |
| 23 | `docs/development.md` → `**Gate 15 — the unattended sandbox probe (macOS).**` paragraph | — | entry 2 | `change` | Task 1 — the evidence-keeping paragraph, after the fenced command block and before `**The rows this probe does not take…**` |
| 24 | Gate 15 leg-table rows `gates`, `mktemp`, `wrappers`, `wrappers-refresh`, `write-protection`, `git`, `network`, `credentials` | — | entry 2 | `change` | Task 1 — mirrored from `core.sh` |
| 25 | Gate 15 leg-table rows `scratch`, `retrieval`, `planted-config`, `planted-files`, `retry`, `repo-settings`, `invalid-profile`, `headless-parity` | — | entry 2 | `no-change` | those legs' behaviour is unchanged |
| 26 | `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path…"* | — | entry 4 | `no-change` | a constraint Task 3 satisfies for the listener process; the evidence directory is deliberately kept and printed, and is not a working copy |
| 27 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded…"* | — | entry 4 | `no-change` | a constraint Tasks 4 and 6 satisfy (T2's waits, the listener's start-up poll) |
| 28 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session…"* | — | entry 4 | `no-change` | this branch records no figure |
| 29 | `harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam…"* | — | entry 4 | `no-change` | amended rows keep their grade; nothing is newly declared measured |
| 30 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block…"* | — | entry 4 | `no-change` | Gate 15's command block is unchanged; Task 1 adds no inline command |
| 31 | `docs/development.md` → Gate 15 paragraph's sentence *"It changes nothing outside its own temp area, the probe clone and the probe branch"* | — | entries 2 and 3 | `change` | Task 1 — names the kept evidence directory under `TMPDIR` (non-passing legs only, printed last) as the one exception; Task 3 corrects the same sentence in `scripts/sandbox-probe.sh`'s header (source comment, not a corpus site) |
| 32 | `harness-runs/lessons.md` → *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision…"* | — | entry 4 | `no-change` | this branch makes no design decision from a stubbed or fixture-sized figure; its fixtures test grading, not a measurement |
| 33 | `harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future…"* | — | entry 4 | `no-change` | this branch writes no decision-rule outcome into another document; the amended rows keep their Observed and Verdict cells |
| 34 | `harness-runs/lessons.md` → *"A process that turns off a shared switch another actor can turn on must check the enabling condition again…"* | — | entry 4 | `no-change` | the probe switches off no shared switch; the only process it stops is its own tracked listener (Task 3) |
