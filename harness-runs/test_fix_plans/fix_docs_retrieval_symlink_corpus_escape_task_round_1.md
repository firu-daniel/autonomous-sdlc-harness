# Test Fix Plan: fix_docs_retrieval_symlink_corpus_escape — task round 1

## Context

**Branch:** `fix_docs_retrieval_symlink_corpus_escape`
**Test log:** `harness-runs/test_run_logs/fix_docs_retrieval_symlink_corpus_escape/task_round_1.log`
**Summary:** The typecheck gate passed; the test gate failed on two `run-gates` checks: gate 6a found the running user's home path in two committed task-plan files, and gate 4's `npm test` failed one case, `cli/test/run-test-suite.test.mjs`'s "a finished `pass` run leaves its verdict, and --wait reads it without re-running" (2786 pass, 1 fail, 4 skipped).

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below top-to-bottom; only the committing role flips a marker. `[ ]` markers anywhere else (sub-step bullets inside the per-finding files) are informational only and are never the iteration source.

Each entry resolves to a self-contained `harness-runs/test_fix_plans/fix_docs_retrieval_symlink_corpus_escape_task_round_1/finding_<K>.md` via its `**Finding K**` reference. Sorted lowest blast-radius first.

1. [ ] **Finding 1** — Replace the home-directory path in `task_2_plan.md` and `task_3_plan.md` with a machine-neutral form. _(layer: general)_
2. [ ] **Finding 2** — Make `run-test-suite.test.mjs` wait for `.running`'s removal instead of asserting it the instant the verdict appears. _(layer: cli)_

---

## Must Fix

### 1. Task plans 2 and 3 quote an absolute home-directory path (gate 6a)
→ [finding_1.md](fix_docs_retrieval_symlink_corpus_escape_task_round_1/finding_1.md)

### 2. `run-test-suite.test.mjs` asserts `.running` is gone in the window between the verdict's rename and `.running`'s removal
→ [finding_2.md](fix_docs_retrieval_symlink_corpus_escape_task_round_1/finding_2.md)

---

## Not fixable on this branch

Run-gates did not count these entries as failures (`run-gates: 2 failed, 23 passed`). They are listed here so every non-pass line in the log is accounted for. None of them yields a finding.

- **Gate 13a / 13b / 13c, Python lint, typecheck and tests: BLOCKED.** `BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync` / `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/227539081; run bash scripts/python-service.sh sync`. 13b and 13c report the same cause. The Python environment lives outside the tree and provisioning it needs the network. Operator remedy: run `bash scripts/python-service.sh sync` on a networked machine, then re-run the gates.
- **Gate 13d, Python container tests: SKIPPED.** `SKIPPED 13d Python container tests — opt in with HARNESS_GATES_CONTAINERS=1 on a machine with Docker`. This is opt-in and needs a host resource (Docker).
- **Gate 14d, zizmor: SKIPPED.** `SKIPPED 14d zizmor over the rendered workflows — zizmor 1.30.1 is available neither on PATH nor through uvx`. A tool is missing from the host.

---

## Source failures

Earlier logs: none. Every failure below is classed *first round (no earlier log to compare)*.

- **typecheck gate** (`commands.typecheck`): `exited 0`, no failures.
- **test gate** (`commands.test`): `exited 1`.
  - **Gate 4 `npm test`, `not ok 1038 - a finished \`pass\` run leaves its verdict, and --wait reads it without re-running`** (`cli/test/run-test-suite.test.mjs`) → Finding 2. First round.
  - **Gate 6a `no machine paths`**, hits in `harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/task_2_plan.md:41` and `task_3_plan.md:30` → Finding 1. First round.
  - Gates 13a, 13b, 13c (BLOCKED), 13d and 14d (SKIPPED) → `## Not fixable on this branch`. Not counted as failures by run-gates.
