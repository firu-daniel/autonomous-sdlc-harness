# Architecture review — fix_run_gates_background_run_handling

## Context

Branch `fix_run_gates_background_run_handling`, reviewed 2026-10-23 against the diff base `dev`. No local `dev` ref exists in this checkout, so the diff was taken against `origin/dev...HEAD`. The review covered 18 changed files in three segments:
- `cli`: `cli/templates/scripts/run-test-suite.sh`, `cli/templates/scripts/README.md` and `cli/test/run-test-suite.test.mjs`.
- `plugin`: eleven files under `plugin/instructions/`.
- `general`: `scripts/run-test-suite.sh`, `docs/watcher.md` and `docs/sandbox-verification.md`.

22 run-artifact files excluded from the reviewed diff.

Headline: layer placement and dependency direction hold throughout.
- The detached run form stays inside the outer-loop template. It is still a byte-for-byte copied script that reads `harness.config.json` at run time through `lib/harness-run-lib.sh`.
- The self-adopted `scripts/run-test-suite.sh` is byte-identical to its template.
- The suite builds its repositories through `cli/test/helpers/fixture.mjs` rather than in this checkout.
- No `plugin/` file reaches into `cli/src` except by prose citation.

One violation of the plugin layer's single-owner rule for cores: the new uncollected-gate-run clause is a second copy in the user-review fix core.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — The uncollected-gate-run clause is copied into the user-review fix core instead of cited from the plan core _(layer: plugin)_

## Must Fix

### 1. The uncollected-gate-run clause is copied into the user-review fix core instead of cited from the plan core
→ [finding_1.md](fix_run_gates_background_run_handling_arch_review/finding_1.md)
