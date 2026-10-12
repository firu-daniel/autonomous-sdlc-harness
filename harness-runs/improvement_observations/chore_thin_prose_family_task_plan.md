## Two task implementers skipped the unit's own type-check run
- **category:** agent-contract
- **evidence:** The `layer-implementer` returns for Task 6 ("Type check: not run. The unit-loop test-run rule leaves the whole-tree checks to the Run gates phase") and Task 8 ("I did not run `<typecheck_cmd>`. The task changes no code") both skipped `bash scripts/typecheck.sh`. `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 2 says a unit runs `<typecheck_cmd>`. Tasks 1–5 and 7 ran it and reported `PASS: typecheck`.
- **cost this run:** none observed. Phase G round 1 printed `pass`, so the whole-tree check covered both units.
- **hypothesis:** (guess) Point 1's "no unit runs a gate script" reads, out of context, as covering the type check too.

## Story-task commit prefix disagrees with the repository's commit-message policy
- **category:** agent-contract
- **evidence:** Unit-loop row `A`'s `commit_prefix rule` (`plugin/instructions/unit_loop_core.md` → `## Substitution table`) derives `chore` from the `chore_` branch prefix. `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for a story task's commit. The committer flagged the conflict on Task 6 (`37236a6f`). The orchestrator passed `chore` per row `A`, so all 8 task commits (`a1982ee8` … `551f9161`) carry `chore:`. The Phase C fix rows resolve their prefix from the policy, so the 5 fix commits (`d48401bf` … `1a6c9935`) carry none.
- **cost this run:** the branch's work commits use two prefix styles; making them conform means rewording 8 subjects before merge.

## Review-ordered restorations raised agent-definition word counts the conventions say must never rise
- **category:** convention
- **evidence:** The implementers of code-review Findings 1, 3, 4 and 5 each flagged that `.claude/context/plugin.md` → `## Writing agent prose` says a change to an agent definition never raises its up-front word count, while their finding restored text. By `wc -w`, `plugin/agents/task-plan-writer.md` went 4249 → 4358 and `plugin/agents/task-plan-reviewer.md` went 4247 → 4263 across Phase C. Both stay below the `4cbe7f72` baselines (6335 / 5776) each finding set as its own bound.
- **cost this run:** none. Four implementers each spent part of their return reconciling the two rules.

## The plan needed 3 review rounds, each with a Must Fix on the same scope-register derivation
- **category:** optimization
- **evidence:** Plan-review roots: `harness-runs/task_plan_reviews/chore_thin_prose_family_task_plan/` holds `review_0.md`, `review_1.md`, `review_2.md`. The architecture and business-parity plan folders were never written. That is 3 round artifacts; the 4th `task-plan-reviewer` dispatch passed and wrote none. By exact heading, round 1 had 0 re-raised / 5 net-new findings, and round 2 had 0 re-raised / 5 net-new. By the headings' own subject, each round's single Must Fix was the C3 derivation still missing sites. Each named a different set of missed sites, so the subject repeated but the finding was net-new each time. Should Fix "caller reads back" appears in all three rounds, unapplied, and its own heading says "still unresolved and not recorded".
- **cost this run:** 3 extra writer revisions and 6 extra reviewer dispatches (12 planning dispatches of a 40 cap).

## The architecture reviewer produced no findings all run
- **category:** optimization
- **evidence:** `architecture-reviewer` was dispatched 5 times: 4 plan-mode rounds and 1 Phase A2 branch review. Each returned `verdict: PASS` and wrote no file. Neither `harness-runs/architecture_reviews/chore_thin_prose_family_task_plan/` nor `harness-runs/architecture_branch_reviews/chore_thin_prose_family_task_plan_arch_review.md` exists. The `skeptic-reviewer` (1 dispatch, Phase C2) also passed with no file.
- **cost this run:** 6 dispatches with no change.

## Index-only commit
- **category:** optimization
- **evidence:** `551f9161` — Task 8 — subject `chore: Mark Task 8 done — story index After and delta columns filled`; the only staged file was `harness-runs/story_plans/chore_thin_prose_family_task_plan_story_plan.md`.
- **cost this run:** none; the task's deliverable was the measurement written into the story index.
