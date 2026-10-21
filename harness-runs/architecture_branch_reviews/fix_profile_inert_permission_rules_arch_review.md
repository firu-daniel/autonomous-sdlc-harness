# Architecture review — fix_profile_inert_permission_rules

## Context

Branch `fix_profile_inert_permission_rules`, reviewed 2026-10-21 against `dev` (resolved as `origin/dev`: this checkout has no local `dev` branch). The review covered the 22 changed files across all three configured layers. **`cli`:** `cli/src/generators/permissionProfile.ts`, `cli/src/generators/writeProtection.ts`, `cli/src/doctor/checks.ts`, the two profile templates, `cli/templates/scripts/autonomous-watcher.sh`, `cli/scripts/README.md` and four suites under `cli/test/`. **`plugin`:** `plugin/hooks/autonomous-script-allowlist-guard.sh`, `plugin/hooks/README.md` and `plugin/instructions/autonomous_pause_and_ledger.md`. **`general`:** five documents under `docs/` and the `examples/notes-app/` fixture profile and README. 16 run-artifact files excluded from the reviewed diff.

**Headline:** the layering holds.
- Every change sits in the layer whose `layers[].path` owns it.
- The `cli` → adopter coupling stays one-way. The watcher derives its wrapper prefix at run time through `hr_scripts_dir` and freezes no configured value.
- Both new mirrors of `cli/src` shapes in the watcher template, `run_profile_wrapper_prefixes` and the `Edit`-only kind → rule map, are declared in their owners' headers (`permissionProfile.ts`, `writeProtection.ts`) and held by `cli/test/watcher-run-profile.test.mjs`.
- The guard's narrowing to the judged checkout's own scripts directory now matches `.claude/context/conventions.md` → `## Shell assets` (*"one under the session's own scripts directory"*).
- The guard's decision rows land in `docs/guard-verification.md`, as `.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts` requires.

One non-blocking finding: the watcher's new refusal of unsafe run-copy path characters copies the command shapes of `profileEntries.ts` → `FORBIDDEN_IN_ENTRY`. That copy is not declared in the owner's header and no suite holds it equal to the owner.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Declare and test the watcher's copy of `FORBIDDEN_IN_ENTRY`'s command shapes _(layer: cli)_

## Must Fix

_None._

## Should Fix

### 1. Declare and test the watcher's copy of `FORBIDDEN_IN_ENTRY`'s command shapes
→ [finding_1.md](fix_profile_inert_permission_rules_arch_review/finding_1.md)

## Nice to Have

_None._
