# Task plan review — iteration 1

Both Must Fix items from iteration 0 are resolved:
- The FR1–FR7 **Read from** contract is now fixed in the story index's **Shared anchors** and restated byte for byte in `task_1_plan.md` and `task_2_plan.md`. Every step name it quotes is a `name:` in `cli/templates/github/workflows/harness-run.yml`, and `run_profile_check` and `not launching` are in `cli/templates/scripts/autonomous-watcher.sh`.
- Scope-register row 23 now covers `docs/cli.md` §6, residual 1, item 1.

I re-ran the register's command entry verbatim. Every hit maps to a row: rows 1–19, with the `ROADMAP.md` hit on row 1 and the `docs/development.md` roadmap-legend hit on row 11. I re-walked the procedure entry, and it reaches no site that lacks a row.

## Must Fix

1. **`task_2_plan.md` — iteration 0's Should Fix 1 is neither applied nor recorded under `## Rejected findings`**
   `harness-runs/lessons.md` → `## Unattended control loops` says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* _(taught by: fix_linux_detached_gate_run)_.
   - Iteration 0's Should Fix 1 targeted the last **Verification:** bullet of `task_2_plan.md`. That bullet is unchanged: *"Every step name or log string (xvi) quotes appears in the shipped source it cites: `git grep -n -F "<string>" cli/templates` finds each."*
   - The story index has no `## Rejected findings` section.
   - The defect still holds. The strings (xvi) carries for FR6 (`sandbox1c2` §1) hold placeholders. The shipped lines are `echo "remote-run.sh: saved the bundle of $branch into $out_dir"` and `echo "remote-run.sh: restored the bundle of run $id into $root"`, and `placed $HR_REMOTE_PLANNING_PLACED planning file(s) for $branch; …`, all in `cli/templates/scripts/remote-run.sh`. A literal `-F` grep for `saved the bundle of <branch>`, `restored the bundle of run <id>` or `placed <n> planning file(s)` therefore finds nothing.
   - The same applies to the adversarial strings `trusted configuration at <commit> names '<trusted>'` and `skipped <path>: <linked> is a symbolic link`, if (xvi) or the round block quotes them.
   - As written, the bullet fails on correct text. Under the task's own **Depends on:** rule, the implementer would then report a false defect.

   **Fix:** In `task_2_plan.md`, change the last **Verification:** bullet so that a quoted string holding a `<placeholder>` is grepped by its fixed text up to the first placeholder (for example `git grep -n -F "saved the bundle of" cli/templates`, `"restored the bundle of run"`, `"planning file(s) for"`). Strings without a placeholder keep the whole-string grep. Say this in the bullet. If you judge the finding wrong instead, record it as one line under a `## Rejected findings` section at the end of the story index, with its reason.

## Should Fix

1. **Story index (`chore_sandbox_gate12_full_run_leg_story_plan.md`) — "`harness-state` is retained 90 days" is stated as a shipped fact, but the shipped value is 400.**
   - The **Cross-cutting rules** bullet on expiring artifacts says *"`harness-state` is retained 90 days"*.
   - `cli/templates/github/workflows/harness-run.yml` sets `retention-days: 400` on the `harness-state` upload. Its `WHY retention-days IS SET.` comment says the real bound is the repository's own artifact-retention setting.
   - The 90 days was observed once, on the Gate 12 repository, in Gate 12 round 2 (2026-09-29: *"the artifact's `expires_at` fell 90 days after its creation"*).
   - An implementer copying the bullet into §10's **Reading a result.** or into (xvi) would write a figure the template does not set.
   - The `sandbox-probe-evidence` figure, `retention-days: 3` in `scripts/sandbox-probe-runner.yml`, is correct.

   **Fix:** Reword the bullet. Say that `harness-state` is kept as long as the repository's artifact-retention setting allows (`retention-days: 400`, capped at the repository's maximum; 90 days on the Gate 12 repository in round 2), or drop the figure and keep only the rule: record an expired artifact as expired.

## Nice to Have

1. **`task_1_plan.md` / `task_2_plan.md` — "matches once" / "each match exactly once".** These are uniqueness checks on a new heading or bold lead, not baked-in site counts, so they are not findings under the count rule. Stating them as an invariant ("one hit, the new lead") would read more plainly.
