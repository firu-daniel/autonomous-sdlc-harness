# Architecture review — iteration 0

Layer placement, responsibility ownership and dependency direction hold across all ten tasks. The `cli` layer gets Tasks 1–7: the templates under `cli/templates/scripts/` and `cli/templates/state-dir/`, the table rows in `cli/src/generators/`, and the suites under `cli/test/`. The `plugin` layer gets Task 8, which is read-only digest prose, list entries and a comment-only edit to the guard. The `general` catch-all gets Tasks 9–10: the self-adoption mirror under `scripts/` and `harness-runs/`, plus `docs/` and `ARCHITECTURE.md`. The run-analytics script sources `cli/templates/scripts/lib/harness-run-lib.sh` and not the plugin library, so neither shipped half reaches into the other at run time (`.claude/context/conventions.md` → `## The layers`). The three new files enter only through `OUTER_LOOP_SCRIPTS`, and the new directory only through `STATE_DIR_ENTRIES`. Both are single-source tables (`.claude/context/cli.md` → **One string, one producer.**). The outer-loop row carries `agentInvocable` set on purpose, with a stated reason for having no deny entry (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *An outer-loop script*). No `**Verification:**` bullet asks for a forbidden test run. Tasks 4, 6 and 7 each run only the test files they create or edit (`unit_loop_core.md` → `## The test-run rule`).

## Must Fix

_None._

## Should Fix

1. **The `stale-rule` entry for the new fixed subject points to a section that does not exist.** The offending files are `feat_run_analytics_story_plan.md` (scope register row 17) and `task_5_plan.md` (first Work bullet). Cited rule: `.claude/context/conventions.md` → `## Commit-message policy` → **Changing any fixed subject is a multi-file edit.**, together with the statement that a conventions-document change is raised as a `stale-rule` entry.
   Row 17 says the new subject `chore: Record run analytics for <branch>` is "raised as a `stale-rule` entry in `## Corpus staleness`". Task 5's comment says the subject is "raised by this branch's plan as a `stale-rule`". The story index has no `## Corpus staleness` section. As written, nothing carries the fixed-subject list's new obligation, and Task 5's comment cites a record that does not exist.
   **Fix:** Add a `## Corpus staleness` section to `feat_run_analytics_story_plan.md` with one `stale-rule` entry. The entry names `.claude/context/conventions.md` → `## Commit-message policy` → the fixed-form subject list, and the missing line `chore: Record run analytics for <branch>`, owned by `cli/templates/scripts/autonomous-watcher.sh` → `run_analytics_subject`. Alternatively, change row 17 and Task 5's comment to point at wherever the entry actually lives.

2. **Nothing asserts that `init` creates the new `run_analytics/` directory.** The offending file is `task_4_plan.md`. Cited rule: `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A generated or copied artifact*.
   Task 4 adds a `STATE_DIR_ENTRIES` row and a new contract README, `cli/templates/state-dir/run_analytics/README.md`. Its `init.test.mjs` work touches only `OUTER_LOOP_SCRIPT_FILES`. The suite's `ALWAYS_ON_DIRS` list (`'task_plans', 'code_reviews', 'flow_progress', 'branch_statistics', 'clarifications'`) drives the loop that checks each always-on directory and its `README.md`. As planned, no case checks that the new directory and its README land.
   **Fix:** In Task 4's `init.test.mjs` bullet, also add `'run_analytics'` to `ALWAYS_ON_DIRS`, so the existing existence and README loop covers the new row.

## Nice to Have

_None._
