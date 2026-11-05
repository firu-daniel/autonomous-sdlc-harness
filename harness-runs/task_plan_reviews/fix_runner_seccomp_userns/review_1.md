# Task plan review — iteration 1

## Must Fix

1. **The previous round's three Should Fix findings were neither applied nor recorded under `## Rejected findings`.** Files: the story index (`fix_runner_seccomp_userns_story_plan.md`), `task_3_plan.md`, `task_4_plan.md` and `task_5_plan.md`.
   The lessons ledger (`harness-runs/lessons.md` → `## Unattended control loops`) says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* _(taught by: fix_linux_detached_gate_run)_. The story index has no `## Rejected findings` section, and none of these three findings from `review_0.md` is resolved in the files:
   - **Should Fix 1 (`task_3_plan.md`, "The early path" / "Non-Linux and no root").** The plan still says the present path "does not `exit`: it falls through to the verification". It also still keeps the non-Linux arm's `::warning::` and `exit 0`, and the no-root arm's `::warning::`. In today's body (`cli/templates/github/workflows/harness-run.yml` → `Install the sandbox prerequisites`), the present-path `exit 0` comes before both arms. Read literally, the plan therefore prints *"not a Linux runner, so nothing was installed"* on a non-Linux runner that has nothing missing. It also prints the *"no root and no passwordless sudo … nothing was installed"* warning on every Linux job without sudo, even when nothing was needed.
   - **Should Fix 2 (`task_4_plan.md`, `doctor-sandbox-prerequisites.test.mjs`).** The check's grade for `failed-stock-restrict` (`fail` in both modes, with the AppArmor context) is still reached only by case (e). Case (e) is Linux-only and depends on whether `/etc/apparmor.d/bwrap-userns-restrict` happens to exist on the host. The new header sentence covers `assessSandboxHost`'s **answer** on every host, but not the check's **grade and message**.
   - **Should Fix 3 (self-adopted copies).** `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` are still byte-identical to their `cli/templates/scripts/` templates (`cmp` exits 0 on both). Task 5 edits only the templates, so this repository's own watcher will not run the new launch check. No task refreshes the copies.
   **Fix:** For each of the three, either apply it or record it with its reason in a trailing `## Rejected findings` section of the story index (placed last, after `## Scope register`). To apply them:
   - **(1)** In `task_3_plan.md`, state that the present path skips the non-Linux, root, install, stock and profile blocks and goes straight to the verification, which still runs on Linux only.
   - **(2)** In `task_4_plan.md`, extract the grade into a pure exported function and add host-independent cases for all four verdicts in both modes.
   - **(3)** Add a `general` task that depends on Task 5 and byte-copies both templates into `scripts/`, verified by `cmp`.

2. **The prompt's `collect` requirement maps to no task.** Files: `task_3_plan.md`, plus `task_8_plan.md` for the description.
   The task prompt → `## What this branch does` → item 1, third bullet, says: *"Check how the later steps' `if:` conditions treat a failed step, so that `Save the state bundle`, `Push the branch` and `collect` still behave as they should for a job that never launched."* Task 3's case (l) covers `Push the branch`, `Save the state bundle`, `Upload the state bundle`, `Open the pull request and report` and `Continue, wait or stop`, all in the `run` job. No per-task file mentions the separate `collect` job. That job is `needs: run` with `if: ${{ inputs.action == 'run' && !cancelled() && github.ref_name == inputs.branch }}`, so it runs after a failed `run` job and calls `remote-run.sh collect`. Task 8's restated facts likewise describe only the bundle-saving and reporting steps.
   **Fix:** In `task_3_plan.md`:
   - Extend case (l) to read the `collect` job from the parsed template. Assert that its `if:` keeps `!cancelled()` and adds no `success()` / `needs.run.result` gate, so it runs after a failed install step exactly as it does after a failed `Preflight with doctor`.
   - State in the case's `**Work:**` bullet what `remote-run.sh collect` does for a run whose harness step never started.
   - Add `collect` to the job-level claims the THE SANDBOX PREREQUISITES paragraph makes.

   In `task_8_plan.md`, add `collect` to the restated fact *"A failed step leaves the job's bundle-saving and reporting steps running"*.

## Should Fix

1. **`docs/watcher.md` §1 step 3 keeps two sentences the branch makes wrong** — `task_8_plan.md`, `**Work:**` → *"`docs/watcher.md` §1 step 3"* (*"Change nothing else in step 3"*). Step 3 also says:
   - *"a definite missing piece archives the drop as `failed_<ts>_<name>` … naming the piece and its install command"*. After Task 5, a failed nested check archives the drop through the same `fail_before_launch` path, and that sentence does not name it.
   - *"A resume and job mode are not judged here; the profile's `failIfUnavailable` covers them"*. That is false for this failure: on a `bwrap-userns-restrict` host the sandbox starts, so `failIfUnavailable` never fires. Job mode is now covered by the install step instead.

   **Fix:** Widen the bullet, and register row 36's anchor, to restate both sentences. Add that a failed nested check archives the drop the same way. Replace "`failIfUnavailable` covers them" for this failure with what is now true: the install step and `doctor --remote-job` cover a job, and a resumed local session is not judged (cli.md §6).

## Nice to Have

1. **The step and `doctor` disagree on a host without `unshare`** — `task_3_plan.md`, "The verification". Task 4 runs the check only when both `bwrap` and `unshare` resolve, and otherwise reports `not-run`. Task 5's watcher probe does the same. The step, though, always runs `bwrap … -- unshare -U -r true` on Linux and fails the job when it fails, `unshare` missing included. Consider stating the step's arm for a missing `unshare`: either fail it by name, or skip the check with a `::warning::` as the other two readers do.
2. **The doctor pointer still appears twice in the watcher's refusal** — `task_5_plan.md`, "The judge", carried over from `review_0.md`. The judge's new sentence ends *"run `npx autonomous-sdlc-harness doctor` for the remedy"*. The unchanged `fail_before_launch` message already ends *"npx autonomous-sdlc-harness doctor reports it under sandbox-prerequisites"*.
