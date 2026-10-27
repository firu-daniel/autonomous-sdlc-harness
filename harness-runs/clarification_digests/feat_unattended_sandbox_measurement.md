## question_1 — the task-plan loop hit its 5-revision cap without converging; how should the run continue?
- **raised by:** planning phase, `task-plan-reviewer` (the `## Loop` plan-review gate), via the flow walker's `binding: <escalate>`, `reason: cap`; latest findings `harness-runs/task_plan_reviews/feat_unattended_sandbox_measurement/review_1.md` (3 Must Fix).
- **asked:** Q1 — how should the run continue past the cap? The loop, as the question file recorded it:

  | Round | Gate | Result |
  |---|---|---|
  | 0 | architecture-reviewer | FAIL, 3 Must Fix: `harness-runs` hard-coded in Tasks 4–5; a test ran the probe against this repository. Fixed. |
  | 1 | architecture-reviewer | FAIL, 2 Must Fix: the model/effort were hard-coded; the N5 rule was split across files. Fixed. |
  | 2 | architecture-reviewer | FAIL, 0 Must Fix (Should Fix only). Applied. |
  | 3 | architecture-reviewer, then task-plan-reviewer | arch PASS; plan-review FAIL, 6 Must Fix. Fixed (16 → 18 tasks). |
  | 4 | architecture-reviewer, then task-plan-reviewer | arch PASS; plan-review FAIL, **3 Must Fix**. The cap fired here. |

  The three open Must Fix items:
  1. **Positive controls.** The prompt's §0 method requires *"a positive control in the same session for every refusal"*. The plan doesn't state this as a rule for the whole probe, and about 20 refusal rows have no control call named: P3, CW2, P1c, CW5, R4, C1, CW3, C2, K2, CW4, CS15, CS12–CS14, N1, N2, N5, RT1, S1 and S2.
  2. **"Each base path" missing from the write-protection set (Task 10).** The set comes from `run_profile_entries` plus `hr_run_protected_rel_paths`, which return only the per-run additions. The base profile's `denyWrite` entries, such as the wrappers, `.mcp.json`, the settings files and `<main>/.git`, are left out. Suggested fix: read `.sandbox.filesystem.denyWrite[]` (and the `Edit(…)` denies) from the per-run profile itself.
  3. **CS4's refresh half and R0 have no call and no verdict rule (Tasks 6–7).** The rows touched are CS4 and R0. These are the closest the findings come to the `## Scope register`; no register row's `Disposition` is disputed by name.

  Options: **(a)** one more revision round — re-enter the planning loop as a fresh walk over the existing draft so the writer fixes review_1.md's three Must Fix items, and the gates run again; **(b)** accept the plan as it stands and go to implementation, recording the three items as known gaps to be caught at branch review; **(c)** stop the run, for a hand fix or a supervised `/autonomous-sdlc-harness:branch-start-plan`, then relaunch.
- **answered:** "Q1: (a) One more revision round. Re-enter the planning loop so the writer fixes review_1.md's three Must Fix items, and run the gates again."
- **carries beyond this branch:** nothing beyond this branch
