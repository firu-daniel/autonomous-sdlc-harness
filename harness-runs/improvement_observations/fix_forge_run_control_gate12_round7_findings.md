## The plan writer reported a stale rule in the cross-layer conventions document
- **category:** tooling-gap
- **evidence:** both `task-plan-writer` returns (iterations 0 and 1) carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## The testing bar`, the bullet listing the gates of `docs/development.md` → `## 5. Verifying a change`. That list already omits gates 10, 11 and 13, and this branch adds gate 14 (Task 7, commit c1167a7; Task 8, commit 133f380), so the bullet is now further from §5.
- **cost this run:** a follow-up restatement is owed: a supervised `/autonomous-sdlc-harness:harness-analyze` re-run, answered `skip` for every already-filled document except this one, or a hand edit so the bullet lists every §5 gate or says it is a sample.

## Row A's branch-derived commit_prefix contradicted the repository's commit policy on every task commit
- **category:** agent-contract
- **evidence:** the orchestrator passed `commit_prefix: fix` on all ten Phase-A `committer` dispatches, per `unit_loop_core.md` → `## Substitution table` row `A` ("from the branch name: … `fix_` → `fix`"). Each of the ten returns said it dropped the prefix because `.claude/context/conventions.md` → `## Commit-message policy` gives a story task's commit **no** prefix. Commits d97a0da, 72f4976, 4c2614f, 132fc43, 75b8d39, d6a09e9, c1167a7, 133f380, d39b53d and e62165e carry no prefix. The fix rows, whose rule defers to the committer's designation, were passed `none` and drew no such note (77b5b08 through 3423f71).
- **cost this run:** ten committer returns each spent a paragraph explaining the override; no wrong commit landed.
- **hypothesis:** row `A`'s rule predates the per-repository commit policy that the fix rows' rule already defers to.

## Verification commands an implementer needed were refused by the unattended profile
- **category:** tooling-gap
- **evidence:** the Task 7 `layer-implementer` reported `bash -n scripts/run-gates.sh` refused twice and `npm ls js-yaml` refused, and checked both by reading files instead. The Task 2 implementer reported `git hash-object` refused, and computed the fixture's blob id with a scratch probe.
- **cost this run:** the syntax of `scripts/run-gates.sh` and the installed `js-yaml` version went unverified by command until Phase G ran the suite (round 1 `pass`).

## A plan-review Should Fix that no round applied came back as a code-review finding
- **category:** flow-efficiency
- **evidence:** the `task-plan-reviewer` iteration-2 return (verdict PASS, no file written) listed as still open, and raised in earlier rounds, a `task_3_plan.md` Should Fix: with a repair and a replacing `--upgrade-workflows` in one run, the `git diff --no-index` line prints twice and the upgrade block's ".bak files are ignored" sentence is false for the control file's `.bak`. The revision dispatches applied Must Fix items only. The `branch-reviewer` then raised the same defect as Finding 2 (`harness-runs/code_reviews/fix_forge_run_control_gate12_round7_findings_code_review.md`), fixed in commit 339317b.
- **cost this run:** one Phase-C fix unit (an implementer plus a committer dispatch) for a defect known at planning; the PASS-round Should Fix items exist only in that return, not on disk.

## Zero-yield reviewer: architecture-reviewer
- **category:** optimization
- **evidence:** `architecture-reviewer` was dispatched 4 times this run: 3 plan-review iterations (one per task-plan revision) and 1 implemented-branch review (Phase A2). It returned `verdict: PASS` every time and wrote no file: no `harness-runs/architecture_reviews/fix_forge_run_control_gate12_round7_findings/` or `harness-runs/architecture_branch_reviews/fix_forge_run_control_gate12_round7_findings_arch_review.md` exists.
- **cost this run:** 4 dispatches, 0 findings.
