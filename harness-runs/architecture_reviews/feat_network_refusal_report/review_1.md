# Architecture review — iteration 1

Reviewed: `harness-runs/story_plans/feat_network_refusal_report_story_plan.md` (`## Context`, `## Phase 2 Readiness — Ordered Fix List`, `## Scope register`) and every file in `harness-runs/task_plans/feat_network_refusal_report/` (`task_1_plan.md` to `task_7_plan.md`). The plan was checked against `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md`, `plugin/instructions/unit_loop_core.md` → `## The test-run rule` and `plugin/instructions/untrusted_input.md` → `## The laundering check`. The index carries no `## Rejected findings` section. Iteration 0's Should Fix (the gate-log `test_file` home step) is resolved in `task_1_plan.md`: it adds `redact_file` with an anchored home step, a matching header sentence and two gate-log cases.

Placement, ownership and dependency direction hold:
- **Layers.** Tasks 1–4 sit under `cli/` and are tagged `cli`. Task 3's one `cli/src` edit is a comment in `cli/src/generators/outerLoopScripts.ts`. Task 5 sits under `plugin/` and is tagged `plugin`. Tasks 6–7 sit at the root (`scripts/`, `harness-runs/`, `docs/`, `ARCHITECTURE.md`) and are tagged `general`, last in the order.
- **Decision logic.** It stays in the two jq programs. The driver discovers logs, makes the call and merges the result, and the lane is still resolved only by `hr_test_run_lane_dir`.
- **Contract before consumer.** The order is Tasks 1–2, then Task 3, then the `plugin` reader of `.run.network` in Task 5, then the self-adopted copies in Task 6. The plugin command reads only what the `cli` templates write. This is the direction `.claude/context/conventions.md` → `## The layers` allows.
- **The mirror.** `judge.sh` ↔ `network_refusal_strings` is declared in both headers and guarded by the new suite. That suite reads two fixed files and is not a tree guard; existing suites such as `cli/test/sandbox-probe-judge.test.mjs` already read `scripts/lib/sandbox-probe/judge.sh` the same way.
- **No new surface.** The plan adds no new script, `OUTER_LOOP_SCRIPTS` row, written artifact or permission.
- **Verification.** No `**Verification:**` bullet asks for a test run outside the unit's own new or edited test files. No line fails the laundering check.

## Must Fix

None.

## Should Fix

1. **`task_3_plan.md`: the header edits leave four existing `run-analytics.sh` statements false.** `.claude/context/cli.md` → `## What "done" means here` says a change either satisfies the rule its module's header states or amends the header in the same edit. Task 3 → **The header, the generator comment, and the two existing cases** lists the opening paragraph, `THREE FILES, ONE DRIVER`, a new `GATE LOGS`, one added sentence in `THE MERGE`, the exit map's stderr line and a REPRO line. It does not touch these statements in `cli/templates/scripts/run-analytics.sh`, each of which the task makes false:
   - **`GATE ROUNDS`:** "Only a label with at least one of the three counts, so a lane of logs and verdicts alone contributes nothing." After the task, a lane of logs and verdicts adds `gate_logs` entries. Task 3's own renamed case says so: *a lane of logs and verdicts adds gate-log entries and no round*.
   - **`THE MERGE`:**
     - "A document is schema 2 exactly when it carries a round" is false once a document with rounds and `gate_logs` is schema 3.
     - The refusal sentence ("does not parse as one schema-1 document without `rounds`, or one schema-2 document whose `rounds` …") does not admit the schema-3 shape the widened check now accepts.
   - **`PATHS IN THE RECORD`:** "file paths pass through … `redact_path`: the pairs only, without the home step and without the 160-character cut free-text fields get". Gate-log `test_file` now takes `redact_file`'s anchored home step, and gate-log `line` takes `redact_text` uncut.
   - **Exit map:** the `no session in <stream_file>` parenthetical "(no session, no new round and no record: nothing written)" omits the new condition that no gate-log entry was recorded either.

   (This is a header-accuracy issue spotted in passing, not a layering violation, so it is graded Should Fix.)
   **Fix:** In `task_3_plan.md` → the header bullet, add one sub-bullet per statement above:
   - Reword `GATE ROUNDS`' closing clause so that it covers only round records and points to `GATE LOGS` for the log.
   - Restate `THE MERGE`'s schema sentence and its refusal enumeration for schemas 1, 2 and 3. Use the rule given under Task 2's **Depends on**.
   - Add the gate-log split to `PATHS IN THE RECORD`: `test_file` through `redact_file`, `line` through `redact_text` uncut. Cite `lib/run-analytics.jq` → `Mode gate_logs` instead of restating it.
   - Add "no new gate-log entry" to the exit map's `no session in` condition, matching the Work bullet that sets the early exit on n, m and g.

   Add a **Verification** reading bullet: no sentence of the header still says that a lane of logs and verdicts contributes nothing, or that schema 2 is the only shape carrying rounds.

## Nice to Have

1. **`task_2_plan.md`: the edited refusal case keeps a title that names schema 3 as refused.** In `cli/test/run-analytics-report-rounds.test.mjs`, the case titled `schema 3, a schema-1 document carrying rounds and a schema-2 one without an array are refused` gets `schema: 4` input under Task 2 → Work bullet 4. Its title then states something schema 3 no longer does. Task 3 renames the parallel title in `cli/test/run-analytics-rounds.test.mjs`. **Fix:** in Task 2's Work bullet 4, also rename that title so it says `schema 4`.
