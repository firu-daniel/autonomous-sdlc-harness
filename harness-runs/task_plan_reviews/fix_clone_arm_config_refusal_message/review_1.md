# Task plan review — iteration 1

## Must Fix
1. **The revision round left the previous review's Should Fix items neither applied nor recorded as rejected** — `task_2_plan.md`, plus the story index (`fix_clone_arm_config_refusal_message_story_plan.md`) if any item is rejected.
   This round revised the plan in response to `review_0.md`: it added Scope register row 26 for that review's Must Fix. But `review_0.md` also raised two Should Fix items. Neither was applied, and the story index has no `## Rejected findings` section recording either one with a reason. That is the mistake this ledger entry records, in `harness-runs/lessons.md` → `## Unattended control loops`:
   > **In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay.** _(taught by: fix_linux_detached_gate_run)_

   Both items are still in `task_2_plan.md`, `**Work:**`, the `cli/test/wrapper-clone-config-refusal.test.mjs` bullet:
   - **Cause count.** It still says "Define the two unresolvable causes:" and then lists three: (i) truncated, (ii) absent, (iii) old `jq`.
   - **Absent-file form not run against push or refresh.** Cases (c) `push-branch.sh` and (d) `refresh-branch.sh` still run only (i) and (iii). `hr_config_load` returns a different status for an absent file (`1`, "not adopted") than for an unresolvable one (`2`). The hoisted `if ! hr_config_load` must refuse on both, and the Goal claims all three wrappers behave alike on every target. Yet nothing exercises the `1` path through the push or refresh hoist, and no header sentence says why it is left out.

   **Fix:** In `task_2_plan.md`, either apply each item or record it with its reason under a trailing `## Rejected findings` section in the story index. To apply them: change "two" to "three", or describe (i) and (ii) as two forms of one cause, unreadable configuration, and (iii) as the second cause. Then add (ii) to cases (c) and (d), or have the new suite's header state why the absent form is not driven there.

## Should Fix
1. **`docs/cli.md` does not describe the new library sentence that the non-wrapper callers will print** — `task_3_plan.md`, the `docs/cli.md` bullet.
   Task 1's new sentence (`… the run registry that would record a clone of <main> cannot be located, because '<main>/harness.config.json' cannot be resolved`) is what `launch-sandboxed-gates.sh`, `setup-worktree.sh` and `cleanup-merged-worktrees.sh` now print for a clone when the configuration cannot be resolved. `task_1_plan.md` → "Where this layer's work stops" says so. The `docs/cli.md` paragraph covers all four excluded scripts, the gate launcher included, and its clone-arm half describes when the arm accepts and which sentence a refusal carries. Task 3 adds only the three-wrapper ordering sentence. The paragraph's closing list of the suites that exercise the clone arm ("The clone arm is exercised by `cli/test/clone-*.test.mjs`, `cli/test/wrapper-clone-arm.test.mjs`, …") also does not gain `cli/test/wrapper-clone-config-refusal.test.mjs`.
   **Fix:** Add a clause to the clone-arm half of that paragraph: a configuration that cannot be resolved is refused with its own sentence naming `<main>/harness.config.json`, not the "records no clone" clause. Add the new suite to that list.
