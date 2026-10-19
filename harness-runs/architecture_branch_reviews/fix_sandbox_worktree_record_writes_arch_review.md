# Architecture review — fix_sandbox_worktree_record_writes

## Context

Branch `fix_sandbox_worktree_record_writes`, reviewed 2026-10-19 against `dev` (`git diff dev...HEAD`), implemented-solution mode, iteration 0. Reviewed: 33 files across `cli` (`cli/src/doctor/checks.ts`, `cli/src/generators/{outerLoopScripts,permissionProfile,writeProtection}.ts`, the `settings.autonomous.json` template, `commit-on-branch.sh`, `lib/harness-run-lib.sh`, `autonomous-watcher.sh`, two new suites and two edited ones), `plugin` (committer, layer-implementer, layer-reviewer, the user-review-fix command, `AUTONOMOUS_FLOW.md`, the shared commit-point modules and the autonomous forks) and `general` (`docs/` and the live `examples/notes-app` profile). 17 run-artifact files excluded from the reviewed diff.

Headline: the layering holds. The commit has a single owner. `hr_commit_paths_var` sits in the outer-loop run library, and both `hr_commit_placed` and the wrapper call it, so neither keeps its own copy (`.claude/context/conventions.md` → `### Where a new responsibility goes`). The excluded set and the write-protected set both come from the `runsUnsandboxed` flag on the one `OUTER_LOOP_SCRIPTS` row, so the table stays the single source (`.claude/context/cli.md` → **One string, one producer.**). No module or shell asset reaches across the `cli`/`plugin` boundary. The commit spelling that changed in the plugin corpus is carried by the autonomous forks and the shared commit-point modules, and the mode-free core gains no step. Each new behaviour has a test, and both new suites build their fixtures under `os.tmpdir()`. There is one non-blocking finding: a doc comment points to the wrong module as the owner of a rule.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — `runsUnsandboxed` doc comment cites a rule `sandboxProfile.ts`'s header does not hold _(layer: cli)_

## Must Fix

_None._

## Should Fix

### 1. `runsUnsandboxed` doc comment cites a rule `sandboxProfile.ts`'s header does not hold
→ [finding_1.md](fix_sandbox_worktree_record_writes_arch_review/finding_1.md)

## Nice to Have

_None._
