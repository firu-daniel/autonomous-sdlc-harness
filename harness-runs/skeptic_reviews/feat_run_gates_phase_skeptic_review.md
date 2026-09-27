# Skeptic Review: feat_run_gates_phase

**Context.** Branch `feat_run_gates_phase`, reviewed adversarially on 2026-09-28 against `dev` (`defaultBranch`) with `git diff dev...HEAD`: 68 files, +1345 / −154. 40 run-artifact files excluded from the reviewed diff.

This review is de-duplicated against the committed code review, `harness-runs/code_reviews/feat_run_gates_phase_code_review.md`, and its six findings. Its round-1 findings are all `[x]`. No parity review applies (`phases.parity` is `false`), and no branch-level architecture review is on disk. The lessons ledger entries were treated as out of scope.

**Checks run first-hand:**

- **Wiring.** Phase G is reachable in every flow that claims it:
  - the task-engine autonomous and semi-autonomous forks;
  - the user-review fix core, which cites G by reference, with `<gate_key>` and the four test-fix paths bound in its own `## Setup`;
  - both ledgers (`G.` / `RG.`), with their flip points and the pre-G ledger resume rule;
  - the three supervised statistics points.
- **Wrapper.** `run-test-suite.sh` is an `agentInvocable` `OUTER_LOOP_SCRIPTS` row. It is reachable headless through `autonomous-script-allowlist-guard.sh` even under a stale profile. Its mirror is byte-identical and mode 100755.
- **Log path.** The log path composes to a repo-relative `harness-runs/test_run_logs/<sanitized branch>/<label>.log`.
- **Ignore rule.** The log is gitignored, and gate 6a excludes it.
- **Registration.** `test-fix-plan-writer` is discovered and dispatched from G.2 with a browser-free `tools:` allowlist.
- **Ledger.** The ledger completion check (§1.8) is entry-generic.
- **Citations.** Every citation the branch leans on resolves. This includes §2.5's *"A backoff is not a resumption mechanism, and neither is a `Monitor`."* and the test-run rule's 16-member roster, which matches `grep` exactly.
- **Regressions.** Nothing else still runs `<test_cmd>` per unit:
  - no git hook runs a test;
  - `layer-reviewer` does not require a test run;
  - no stale "run the suite" statement survives in `plugin/`.

**Headline.** No Must Fix. There is one net-new Should Fix. The canonical code-review sample that `branch-reviewer`, `skeptic-reviewer` and `review-plan-reviewer` are bound to still models a fix that re-runs another task's verification, and it claims a green suite. That is the pattern the new rule has every meta-reviewer raise as a Must Fix.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Make the canonical code-review sample edit the test it asks to run, and stop it claiming a green suite _(layer: plugin)_

## Must Fix

_None._

## Should Fix

### 1. The canonical code-review sample still asks a fix to re-run another task's verification, and claims the suite is green
→ [finding_1.md](feat_run_gates_phase_skeptic_review/finding_1.md)

## Nice to Have

_None._

## Intentional divergences / call-outs

_None. `phases.parity` is `false`, so there is no reference implementation to diverge from. The story index's own recorded decisions each passed the check-4 re-grade: Phase G after QA rather than directly after C2, the supervised flows running the gates once with a human-owned fix route, and no parity gate on the test fix plan._
