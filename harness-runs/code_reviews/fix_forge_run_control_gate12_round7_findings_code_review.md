# Code Review: fix_forge_run_control_gate12_round7_findings

## Context

**Branch:** `fix_forge_run_control_gate12_round7_findings`
**Date:** 2026-10-05
**Reviewed:** the whole branch diff against `dev`: 21 files, 1219 insertions and 59 deletions. 15 run-artifact files are excluded from the reviewed diff. The review covers these segments:

- **Item 1, the High.** Three parts:
  - the job `if:` rewritten as a folded block scalar in `cli/templates/github/workflows/harness-control.yml`;
  - the byte-identical 0.6.1 repair in `cli/src/generators/githubWorkflows.ts`, with its reporting in `cli/src/commands/init.ts` and its re-run row in `cli/src/core/writer.ts`;
  - the `doctor --check-github` listed-by-path failure in `cli/src/doctor/checks.ts`.
- **Gate 14.** `scripts/check-rendered-workflows.mjs` and `scripts/run-gates.sh`, with `js-yaml` declared as a root devDependency.
- **Item 3.** The `forge_report` stop guard in `cli/templates/scripts/remote-run.sh`.
- **Item 2.** `control_status` and `control_round_newer_than_ledger` in the same script.
- **Tests.** The suites `doctor`, `remote-control`, `remote-report`, `trigger-workflow-init` and `workflow-templates`, and the `cli/test/fixtures/harness-control-0.6.1.yml` fixture.
- **Item 4 and the adopter docs.** The round's record in `docs/development.md` and `docs/github-run-control.md`, and the repair-route text in `docs/remote-execution.md`, `docs/github-issue-trigger.md` and `docs/cli.md`.

**Headline.** Every acceptance criterion in the task prompt has a matching change and a matching test. This review ran no suite; whether the tests pass is the gates phase's to establish. Specific checks:

- The fixture's git blob equals 0.6.1's template blob, `1b4f0fc`, at `31a2d55`.
- The repair has a second-`init`-changes-nothing case, a CRLF case, an edited-copy case and a `--dry-run` case.
- The stop guard is driven for `resumed`, `paused`, `parked`, `park_loop` and `round`, and for a failing listing.
- `status` is driven for a round commit newer than the ledger, for no round commit, for a ledger rewritten after the round commit, and for a subject that only contains the round text.
- No `console`, `process.exit`, shell string or `fs` write was added under `cli/src`.
- The `plugin` layer is untouched.

The caller check found one new export with no importer (Finding 4). `phases.parity` is `false`, so no parity cross-check ran. Pass 2 found no per-unit review files under the supplied root, so its reconciliation was a no-op.

The six findings below remain:

- one Must Fix: an adopter command named inline, which breaks the lessons ledger's fenced-command rule;
- two Should Fix: contradictory `.bak` output when an upgrade and the repair coincide, and a truncated workflow listing graded as a pass;
- three Nice to Have.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 5** — Put the `failing` table's closing `];` in `cli/test/doctor.test.mjs` on its own line _(layer: cli)_
2. [x] **Finding 4** — Drop the `export` from `UNPARSEABLE_CONTROL_IF_LINE` _(layer: cli)_
3. [x] **Finding 6** — Replace "committed by Task 2" in `scripts/check-rendered-workflows.mjs` with the fixture's blob provenance _(layer: general)_
4. [x] **Finding 1** — Fence the edited-copy `init --force` route in `docs/remote-execution.md` → `### Upgrading` _(layer: general)_
5. [ ] **Finding 2** — Keep the repaired control workflow out of the upgrade block's diff lines and `.bak` claim, and assert its diff line prints once _(layer: cli)_
6. [ ] **Finding 3** — Warn *cannot tell* when the workflow listing does not reach a judged harness workflow _(layer: cli, general)_

---

## Must Fix

### 1. `docs/remote-execution.md` names the edited-copy route `init --force` inline instead of in a fenced block
→ [finding_1.md](fix_forge_run_control_gate12_round7_findings_code_review/finding_1.md)

---

## Should Fix

### 2. Under `--upgrade-workflows`, the upgrade block also lists the repaired control workflow and says its `.bak` is ignored, which contradicts the repair block
→ [finding_2.md](fix_forge_run_control_gate12_round7_findings_code_review/finding_2.md)

### 3. `remote-github` treats a harness workflow missing from a truncated workflow listing as parsed, where it cannot tell
→ [finding_3.md](fix_forge_run_control_gate12_round7_findings_code_review/finding_3.md)

---

## Nice to Have

### 4. `UNPARSEABLE_CONTROL_IF_LINE` is exported, but nothing outside its own module imports it
→ [finding_4.md](fix_forge_run_control_gate12_round7_findings_code_review/finding_4.md)

### 5. `doctor.test.mjs`'s `failing` table closes its array on the same line as its last row
→ [finding_5.md](fix_forge_run_control_gate12_round7_findings_code_review/finding_5.md)

### 6. `check-rendered-workflows.mjs` cites "Task 2", a plan this branch's run artifacts own, in a durable comment
→ [finding_6.md](fix_forge_run_control_gate12_round7_findings_code_review/finding_6.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section is empty.
