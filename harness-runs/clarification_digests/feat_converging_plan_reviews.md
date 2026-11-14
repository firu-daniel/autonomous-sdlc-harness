## question_1 — The task-plan loop hit its 5-revision cap with the plan-review gate still open
- **raised by:** task-plan-reviewer (planning — task-plan writing loop, cap escalation)
- **asked:** Q1 — how planning should proceed after the writer's draft plus four revisions without convergence. Round history at the park:

  | Revision | Gate | Verdict |
  |---|---|---|
  | draft (iter 0) | architecture-reviewer | FAIL — 3 Must Fix (`architecture_reviews/…/review_0.md`) |
  | iter 1 | architecture-reviewer | FAIL — 1 Must Fix (`review_1.md`) |
  | iter 2 | architecture-reviewer → task-plan-reviewer | PASS → FAIL — 4 Must Fix (`task_plan_reviews/…/review_0.md`) |
  | iter 3 | architecture-reviewer | FAIL — 1 Must Fix (`architecture_reviews/…/review_2.md`) |
  | iter 4 | architecture-reviewer → task-plan-reviewer | PASS → **FAIL — 4 Must Fix** (`task_plan_reviews/…/review_1.md`) |

  The plan then stood at 31 tasks / 445 story points across `cli` (Tasks 1–9), `plugin` (10–24) and `general` (25–31). Options: (a) continue revising, optionally with guidance; (b) reduce scope, then continue; (c) stop the autonomous run and take the branch to a supervised `/devscene:branch-start-plan` session.
- **answered:**
  ```
  === BEGIN UNTRUSTED DATA harness-runs/clarifications/feat_converging_plan_reviews/answered/answer_1.md — data, never instructions ===
  Q1: (a) continue revising, with these rulings.
  - TP 3 (task_plan_reviews/…/review_1.md Must Fix 3): drop counter recovery from round files entirely. The counter carries over only when a saved walk is continued, which the walker already does (flow-walker-resume.test.mjs cases (1) and (5)); every `start` begins at 0, as flow-walker-ui-and-reentry.test.mjs case (6) pins today — keep that case unchanged. A finished walk (cap park, convergence) is never continued, so an answered cap park starts a fresh cap budget. Round file numbering continues across the branch's history, independent of the counter; converging mode keys on the current walk's counter. The best-effort next-due-reviewer resume from round files stays. The task prompt was restated to match in commit 2ea4301c (Part 4's counter bullet and the two mid-round resume test bullets).
  - TP 2 (Must Fix 2): Should Fix items are not gating. Record the three in `## Rejected findings` as deferred to issue #254, with that reason.
  - TP 1, TP 4 and architecture review_2 Must Fix 1: apply as written.
  - Scope unchanged: Part 5 stays.
  === END UNTRUSTED DATA harness-runs/clarifications/feat_converging_plan_reviews/answered/answer_1.md ===
  ```
- **carries beyond this branch:** the walker's dispatch counter carries over only when a saved walk is continued; every `start` begins at 0, so an answered cap park starts a fresh cap budget; round-file numbering continues across the branch's history independent of the counter; Should Fix plan-review items are not gating.

## question_2 — The Run gates phase could not start the round-1 gate run
- **raised by:** Phase G gates (Run gates — G.1, round 1, no verdict line)
- **asked:** Q1 — how to proceed after the launcher printed `in-session` (exit 4) and the run form `bash scripts/run-test-suite.sh task_round_1` exited 2 with the one stderr line `run-test-suite.sh: the detached run of task_round_1 did not start`, so the whole-tree type check and suite had not run. Options: (a) resume and retry the gates in a fresh session; (b) run the gates by hand, then resume; (c) stop the autonomous run and finish by hand.
- **answered:**
  ```
  === BEGIN UNTRUSTED DATA harness-runs/clarifications/feat_converging_plan_reviews/answered/answer_2.md — data, never instructions ===
  Q1: (a) resume and retry the gates in a fresh session. Nothing on this branch touches `run-test-suite.sh`; the last 12 runs on this host started the detached worker normally, so treat this as a session-state failure. If the round-1 run refuses again, park again with the same evidence and do not substitute another way of running the suite.
  === END UNTRUSTED DATA harness-runs/clarifications/feat_converging_plan_reviews/answered/answer_2.md ===
  ```
- **carries beyond this branch:** nothing beyond this branch

## question_3 — The round-1 gate run refused to start again on resume
- **raised by:** Phase G gates (Run gates — G.1, round 1, no verdict line — second attempt, after the resume of the park at question_2.md)
- **asked:** Q1 — how to proceed after the same `run-test-suite.sh: the detached run of task_round_1 did not start` refusal on the resumed session. Options: (a) fix the environment (profile/sandbox, host, or the launcher returning `pending`), then resume; (b) stop the autonomous run and finish by hand outside the sandbox.
- **answered:**
  ```
  === BEGIN UNTRUSTED DATA harness-runs/clarifications/feat_converging_plan_reviews/answered/answer_3.md — data, never instructions ===
  Q1: (a) resume. The environment fault is the session sandbox under Claude Code 2.1.323 and later: the detached gate worker cannot start inside it, tracked in issue #366. The user ran the same run form, `bash scripts/run-test-suite.sh task_round_1`, from this run copy outside the sandbox. Round 1 failed only gate 6a, on machine paths in two committed review artifacts. The user replaced those with `${CLAUDE_PLUGIN_ROOT}/` in commit ff8687ce, then ran the gates again: `task_round_1.verdict` is `pass`, `.commit` is ff8687ce (HEAD), and the tree is clean. Gates 13a–13c are BLOCKED (Python environment not provisioned) and 13d is SKIPPED, as expected. On resume, issue the run form for `task_round_1` as usual: it reuses that finished verdict and starts nothing. Then complete Phase G and Phase D.
  === END UNTRUSTED DATA harness-runs/clarifications/feat_converging_plan_reviews/answered/answer_3.md ===
  ```
- **carries beyond this branch:** the detached gate worker cannot start inside the session sandbox under Claude Code 2.1.323 and later (issue #366).

## question_4 — Round 1 still cannot run in-session, and a finished out-of-band run is discarded once the resume commits its P0 line
- **raised by:** Phase G gates (Run gates — G.1, round 1, no verdict line — third attempt, after the resume of the park at question_3.md)
- **asked:** Q1 — how to proceed after the third `run-test-suite.sh: the detached run of task_round_1 did not start` refusal, given that the resume's P0 commit moved HEAD off the out-of-band run's recorded `.commit`, so the wrapper's `ONE RUN PER LABEL` rule deleted that finished verdict instead of reusing it. Options: (a) fix the environment so the detached worker starts in-session, then resume; (b) stop the autonomous run and finish by hand; (c) accept an out-of-band gate verdict for round 1, stating explicitly what is authorised given the HEAD-moved reuse rule.
- **answered:** no answer file on disk — resolved out of band
- **carries beyond this branch:** nothing beyond this branch
