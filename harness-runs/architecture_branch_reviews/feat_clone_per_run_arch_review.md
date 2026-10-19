# Architecture review — feat_clone_per_run

## Context

Branch `feat_clone_per_run`, reviewed 2026-10-19 against `dev` (`git diff dev...HEAD`), in implemented-solution mode. The reviewed diff is 22 files: `cli/src/doctor/checks.ts`, `cli/src/generators/stateDir.ts`, `cli/src/generators/writeProtection.ts`, the profile template, the run library and the four outer-loop wrappers under `cli/templates/scripts/`, seven `cli/test/` suites (six new, two edited), `docs/cli.md`, `docs/sandbox-verification.md`, `docs/watcher.md` and the worked example's live profile and README. 25 run-artifact files excluded from the reviewed diff. The rules applied are `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`, plus `harness-runs/lessons.md`.

Headline: the layering holds. Every change sits in the layer its path belongs to. The plugin layer is untouched and no import or `source` crosses the `cli`/`plugin` boundary. The clone logic lives in the shared run library, and the three wrappers and `setup-worktree.sh` only call into it. The run registry's two path segments moved to an owner (`cli/src/generators/stateDir.ts`), which `doctor` and the write-protection generator both import. Each new library behaviour has its own suite under the system temp directory. Nothing here is Must Fix. Two Should Fix findings remain, both of the "a value is imported from its owner rather than retyped" / "before adding a copy of anything, grep for it" kind: one leftover retype of the newly owned directory name in `cli/src`, and the git pin sets the library now spells in several bodies, which have already drifted.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Import `RUN_LOGS_DIR` in `repoRoot.ts` instead of retyping `'autonomous_logs'` _(layer: cli)_
2. [ ] **Finding 2** — Give the run library's main-side and clone-side git pins one body each _(layer: cli)_

## Must Fix

_None._

## Should Fix

### 1. Import `RUN_LOGS_DIR` in `repoRoot.ts` instead of retyping `'autonomous_logs'`
→ [finding_1.md](feat_clone_per_run_arch_review/finding_1.md)

### 2. Give the run library's main-side and clone-side git pins one body each
→ [finding_2.md](feat_clone_per_run_arch_review/finding_2.md)

## Nice to Have

_None._
