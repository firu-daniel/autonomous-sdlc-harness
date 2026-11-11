## Plan verification bullets asked for a bare `bash -n`, which the unattended profile refuses
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Tasks 3, 4, 16, 17 and 18 each report the plan's `bash -n <file>` verification call refused at the permission layer, and each recorded the substitute (the shell-parse step of `bash scripts/typecheck.sh`) as a deviation note in `harness-runs/task_plans/chore_devscene_github_surface/task_3_plan.md`, `task_4_plan.md`, `task_16_plan.md`, `task_17_plan.md` and `task_18_plan.md`.
- **cost this run:** five units shipped with a downgraded syntax-check claim; two of the five implementers state they did not confirm the typecheck's 124-file list includes the edited script.
- **hypothesis:** the plan writer does not know which verification commands the unattended profile allows.

## `git hash-object` and `cp` refused for agents that needed byte-identity evidence
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` revision return (iteration 1) reports `git hash-object` refused and switches Task 16's check to `cmp`; the Phase C Finding 2 `general`-layer `layer-implementer` return reports `git hash-object` refused (don't-ask mode) for the blob-id comparison its finding asked for; the Task 16 `layer-implementer` return reports `cp <template> <copy>` refused, so the five self-adopted copies were rebuilt with Edit-tool replacements instead of a copy.
- **cost this run:** one plan revision rewrote a check around the refusal; the Task 16 copies were hand-edited against the plan's "hand-edit nothing" instruction, verified afterwards with `cmp`.

## Edit-tool replacements silently dropped a significant space in the new label and command spellings
- **category:** tooling-gap
- **evidence:** `layer-implementer` returns for Tasks 3, 10, 12 and 14 each report a first edit that lost a space — `devscene: ` became `devscene:` (Tasks 3 and 12), `<!-- devscene event=` became `devscene event=` with the space lost (Task 10), and `devscene-run.yml --ref` became `devscene-run.yml--ref` (Task 14). Tasks 10, 12 and 14 found it through a failing suite run (33 failures in `cli/test/remote-control.test.mjs`, 8 in `cli/test/remote-run.test.mjs`, the three dispatch-string suites in Task 14); Task 3 found it by inspecting the diff.
- **cost this run:** four units each needed a repair edit and a re-run before they passed; Task 14's implementer took ~17 minutes.

## Implementers piped single-file test runs through `grep` / `tail` against the foreground-run rule
- **category:** agent-contract
- **evidence:** the `layer-implementer` returns for Tasks 9, 11, 14 and 19 and for the Phase C Finding 2 `cli`-layer dispatch each self-report piping a `npm test --workspace cli -- test/<name>.test.mjs` run through `grep` or `tail`, which `.claude/context/cli.md` and `unit_loop_core.md` → `## The test-run rule` point 6 forbid; Tasks 9 and 14 re-ran unpiped, the others did not.
- **cost this run:** three units' test evidence rests on filtered output (Task 14's deviation note records it in `harness-runs/task_plans/chore_devscene_github_surface/task_14_plan.md`).

## Task 2's plan prescribed `git mv`, which the implementer's output contract forbids
- **category:** agent-contract
- **evidence:** the Task 2 `layer-implementer` return states the plan suggests `git mv` for the four workflow-template renames but its output contract forbids it, so each move was done as a Write of the new file plus `rm` of the old one, with a `git diff --no-index` check before deletion.
- **cost this run:** none beyond the workaround; the rename landed in commit `116c3df9`.
