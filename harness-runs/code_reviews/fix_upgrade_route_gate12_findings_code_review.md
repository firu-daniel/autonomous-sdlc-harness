# Code Review: fix_upgrade_route_gate12_findings

## Context

**Branch:** `fix_upgrade_route_gate12_findings`
**Date:** 2026-09-30
**Reviewed:** the whole branch diff against `dev`, covering 13 files. `cli`: `IN_FLIGHT_RUNS_NOTE` in `cli/src/generators/githubWorkflows.ts` and its two callers. `doctor`'s version-warning join in `cli/src/doctor/checks.ts` → `REMOTE_EXECUTION_CHECK`. The three `.bak` ignore rules in `cli/src/generators/repoRoot.ts` and `cli/templates/repo/gitignore`. The upgrade-specific report in `cli/src/commands/init.ts` → `reportWorkflowUpgrade`. The `advice.detachedHead` clone and reworded `upgrade_route` in `cli/templates/github/workflows/harness-run.yml`. Their cases in `cli/test/doctor.test.mjs`, `cli/test/init.test.mjs` and `cli/test/workflow-plugin-pin.test.mjs`. `general`: `docs/remote-execution.md` → `### Upgrading`, `docs/cli.md` and `docs/development.md`. 12 run-artifact files excluded from the reviewed diff.

**The `cli` work holds up.** The in-flight sentence has one producer, and both `init` and `doctor` import it. The double full stop is fixed at `doctor`'s join, and the unusable-`defaultBranch` form now ends in its own period. The ignore rules are exact paths built from the owning constants, and a test checks that an adopter's own workflow `.bak` stays visible. The upgrade's `git add` names only the in-repository targets of a merge policy that were merged or created: `.gitignore`, `.claude/settings.json` and `.mcp.json`, all of them committed files. The first-setup block is suppressed only when an upgrade replaced a workflow. The Pass 0 caller check found both callers of the one new exported symbol. The configured grep sweep has no regexes, so that half found nothing. Every change carries its test. Whether those tests pass is for the Run gates phase to establish, because this review runs no suite. `phases.parity` is `false`, so nothing was compared against a reference. Both findings are in the new `### Upgrading` prose. The route for moving a run in flight cannot start from a checkout while the run's mirror working copy holds the branch, and it pushes a stale local branch. **The commands** still shows a fenced `git add` that the reader is told not to run. Finding 6 of the task prompt is answered in the story index's `## Context` with no task, as that prompt allowed. Pass 2 found no per-unit review files under the supplied root, so reconciliation was a no-op.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Replace the fenced two-workflow `git add` in `### Upgrading` → **The commands** with the report's paths and reword the sentence after it _(layer: general)_
2. [ ] **Finding 1** — Make the in-flight move route detach onto `origin/<branch>` and push `HEAD:<branch>`, then return the checkout _(layer: general)_

---

## Must Fix

### 1. The route for moving a run in flight starts with `git switch <branch>`, which fails while the run's mirror working copy holds that branch, and pushes a stale local branch when one exists
→ [finding_1.md](fix_upgrade_route_gate12_findings_code_review/finding_1.md)

---

## Should Fix

### 2. `### Upgrading` still shows a fenced two-workflow `git add` among **The commands**, then tells the reader not to run it
→ [finding_2.md](fix_upgrade_route_gate12_findings_code_review/finding_2.md)

---

## Nice to Have

_None._

---

## Intentional divergences to confirm

_None. `phases.parity` is `false`, so there is no reference implementation to diverge from._
