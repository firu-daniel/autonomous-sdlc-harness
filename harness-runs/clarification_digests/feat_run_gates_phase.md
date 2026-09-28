## question_1 — the task-plan loop hit its 5-revision cap with one plan-review Must Fix open
- **raised by:** planning phase, `task-plan-reviewer` (plan-review gate), via the planning walker's `<escalate>` at `reason: cap`; latest findings `harness-runs/task_plan_reviews/feat_run_gates_phase/review_2.md` (1 Must Fix)
- **asked:** Q1 — how should planning continue? The round record the park carried:

  | Round | Gate | Verdict |
  |---|---|---|
  | 0 | architecture-reviewer | PASS |
  | 0 | task-plan-reviewer | FAIL — 4 Must Fix (`review_0.md`) |
  | 1 | architecture-reviewer | FAIL — 2 Must Fix (`architecture_reviews/.../review_0.md`) |
  | 2 | architecture-reviewer | FAIL — 1 Must Fix (`architecture_reviews/.../review_1.md`) |
  | 3 | architecture-reviewer | PASS |
  | 3 | task-plan-reviewer | FAIL — 3 Must Fix (`review_1.md`) |
  | 4 | architecture-reviewer | PASS |
  | 4 | task-plan-reviewer | FAIL — 1 Must Fix (`review_2.md`) |

  Options:
  - **(a) One more revision.** The writer revises against `review_2.md`, then every gate runs again. Say so, and if you want, name the fix you expect for that Must Fix.
  - **(b) Your ruling on the finding.** Read `review_2.md` and give the fix yourself, or reject the finding with a reason. The writer applies your ruling, then the gates run again.
  - **(c) Accept the plan as it stands** and go straight to implementation with that Must Fix open. It would be recorded as an assumption in the story index.
  - **(d) Stop the run** so you can rescope the task prompt (for example split the branch; the plan is 23 tasks / 303 points).
- **answered:**

  > Q1: (b) then (a) — apply this ruling, and the plan loop gets up to three more revisions past the cap.
  >
  > Ruling on review_2.md Must Fix 1: the finding is valid. As written, Task 23 would record a false failure of criterion 5 in the acceptance walk. In `task_23_plan.md` → **Criterion 5**, define the expected set as the agent members of the `## The test-run rule` roster that Task 5 fixes: `layer-implementer`, `test-fix-plan-writer`, `architecture-reviewer`, `business-parity-reviewer`, `task-plan-writer`, `task-plan-reviewer`, `user-review-fix-plan-writer`, `review-plan-reviewer`, `branch-reviewer`, `skeptic-reviewer`. Do not define it as "Scope register rows 31–44 marked `change`". `grep -ln "The test-run rule" plugin/agents` must equal that set exactly. `committer.md` (row 34) is not in the set, because the committer writes and grades no plan.
  >
  > Budget for the extra rounds: spend a revision only on a Must Fix that would cause wrong behaviour or a wrong implementation. Apply Should Fix items only where they are cheap. If the three extra revisions run out while a Must Fix is still open, park again rather than proceeding.
- **carries beyond this branch:** the agent membership of `## The test-run rule` roster is the ten agents listed in the ruling, and `committer` is outside it because it writes and grades no plan

## question_2 — Phase C could not set the executable bit on `scripts/run-test-suite.sh` for code-review Finding 6
- **raised by:** Phase C (code-review fix loop), `layer-implementer` (layer `general`), on readiness item 1 = Finding 6; latest findings `harness-runs/code_reviews/feat_run_gates_phase_code_review.md` → `harness-runs/code_reviews/feat_run_gates_phase_code_review/finding_6.md` (Should Fix)
- **asked:** Q1 — how should Finding 6 be closed? The self-adopted `scripts/run-test-suite.sh` was tracked at `100644` while `init` writes it `0755`; both routes were refused with "This command requires approval":
  - `chmod 755 scripts/run-test-suite.sh`
  - `git update-index --chmod=+x scripts/run-test-suite.sh`

  Options:
  - **(a) You set the bit, then answer "done".** Run `chmod 755 scripts/run-test-suite.sh` in this worktree and leave it uncommitted. On resume, the fix loop re-dispatches Finding 6, and the committer commits the mode change as the fix.
  - **(b) Close Finding 6 without a fix.** The run records it as a documented assumption (the file stays `0644` on this branch, and you fix the mode by hand before merge), marks the item closed, and continues with Findings 5 → 1.
  - **(c) Stop the run** so you can handle it another way, for example by adding a permission entry and resuming.
- **answered:**

  > Q1: (a) — done. The operator ran `chmod 755 scripts/run-test-suite.sh` in this worktree and left it uncommitted. `git diff --summary` shows `mode change 100644 => 100755 scripts/run-test-suite.sh`. Re-dispatch Finding 6 and commit the mode change as its fix, then continue with Findings 5 → 1.
- **carries beyond this branch:** nothing beyond this branch
