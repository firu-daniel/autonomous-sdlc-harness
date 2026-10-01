## question_1 — the planning loop reached its 5-revision cap with the plan-mode architecture gate open
- **raised by:** the task-plan writing loop (`/autonomous-sdlc-harness:branch-start-plan-autonomous`, planning half); the gate still open was the plan-mode `architecture-reviewer`, latest findings `harness-runs/architecture_reviews/feat_docs_retrieval_backend_selection/review_1.md` (FAIL, 2 Must Fix), plan of 15 tasks, 207 story points.
- **asked:** Q1 — how should the planning loop proceed past the cap? Options: (A) revise once more, with the operator's direction on how each of the two findings is resolved; (B) overrule the findings, recorded under `## Rejected findings`; (C) rescope or stop. Gate history at the park, carried verbatim:

  | Revision | Architecture gate | Structural gate (`task-plan-reviewer`) |
  |---|---|---|
  | 0 (initial draft) | FAIL, 2 Must Fix: `architecture_reviews/…/review_0.md` | not reached |
  | 1 | PASS | FAIL, 3 Must Fix: `task_plan_reviews/…/review_0.md` |
  | 2 | PASS | FAIL, 3 Must Fix: `task_plan_reviews/…/review_1.md` |
  | 3 | PASS | FAIL, 1 Must Fix: `task_plan_reviews/…/review_2.md` |
  | 4 | **FAIL, 2 Must Fix: `architecture_reviews/…/review_1.md`** | not reached (cap) |

  Revision 4 had made the launcher read `docs.retrievalBackend` only when retrieval applies, adding a `docs.retrieval` scalar to `hr_config_load`, the shell reader `hr_docs_retrieval_applies` (Task 3) and the Task 4 launcher gate; the architecture gate then failed on that revision.
- **answered:**

  > Q1: (A) Revise again, and the cap is raised by 3 more writer revisions (revisions 5, 6 and 7) before it parks again.
  >
  > Both Must Fix findings in architecture_reviews/…/review_1.md are accepted as written. They don't change runtime behaviour today, because every retyped string is spelled correctly. But each one breaks the stated owner rule in .claude/context/conventions.md ("imported from its owner rather than retyped … including in the message that names it to a reader"), and Task 2's drift-guard grep can't see a mid-string copy, so the copies would drift without anything noticing. Apply each fix exactly as the review states it:
  >
  > 1. Task 7: setup.ts imports PYTHON_RETRIEVAL_COMMAND from cli/src/retrieval/pythonBackend.ts and interpolates it into the python-backend note, instead of spelling harness-docs-retrieval. Add Task 2 to Task 7's Depends on. Add the Verification bullet `git grep -n "harness-docs-retrieval" -- cli/src` matches only pythonBackend.ts and doc comments. In task_2_plan.md's Verification grep, drop the trailing quote so the grep also catches a mid-string copy.
  >
  > 2. Task 2 exports PYTHON_FETCH_MODELS_SUB_COMMAND = 'fetch-models'. Task 5 builds the weights remedy, and the `unresolved` message of RETRIEVAL_PYTHON_DEPENDENCIES_CHECK, from PYTHON_RETRIEVAL_COMMAND (plus PYTHON_FETCH_MODELS_SUB_COMMAND where it applies) rather than literals. List the new import in Task 5's Depends on.
  >
  > Keep revision 4's retrieval-applies gating (the docs.retrieval scalar, hr_docs_retrieval_applies, the Task 4 launcher gate): this ruling doesn't reopen it.
  >
  > Should Fix 1: take the cheap route and narrow the story index's Top risks sentence to the mirrors that are actually asserted. Don't add a new test case. Should Fix 2 (describeDatabaseUrl helper) is at the writer's discretion.
  >
  > Make each fix with the smallest edit that does the job. Don't restructure tasks that already passed the gates.
- **carries beyond this branch:** the owner rule in `.claude/context/conventions.md` ("imported from its owner rather than retyped … including in the message that names it to a reader") applies to a name embedded mid-string in a user-facing message, not only to a standalone literal — a retyped copy is a Must Fix even when it is spelled correctly today, and a drift-guard grep must be able to match a mid-string copy.
