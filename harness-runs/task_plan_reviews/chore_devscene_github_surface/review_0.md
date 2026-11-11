# Task plan review — iteration 0

## Must Fix
1. **The file-mode claim is wrong, so Task 16's first verification check cannot pass** — files: the story index (`chore_devscene_github_surface_story_plan.md`) → `## Context` → *"The self-adopted copies follow their templates byte for byte"*, and `task_16_plan.md` → `**Verification:**`, first bullet.
   The index says *"`autonomous-watcher.sh` differs in file mode only"*, and Task 16's first check exempts only that file: *"For each copy, `git diff --no-index --quiet cli/templates/scripts/<file> scripts/<file>` exits 0 … A mode-only difference on `autonomous-watcher.sh` is the pre-existing state, not a defect."* In fact three copies differ from their templates in mode. Each template is `100644` and each copy is `100755`:
   - `scripts/autonomous-watcher.sh`
   - `scripts/remote-run.sh`
   - `scripts/prompt-injection-screen.sh`

   `git ls-files -s` shows identical blob ids for all five pairs, so the content claim holds. `ls -l` shows the same modes on disk. `git diff --no-index --quiet` treats a mode change as a difference, so it exits 1 on `remote-run.sh` and `prompt-injection-screen.sh` both before and after the copy. That leaves the implementer with two instructions that cannot both be met. One says each check must exit 0. The other says to keep each copy's mode (Work bullet 1), and the second Verification bullet requires *"no mode change"*. An implementer who takes the first check literally will `chmod` two executable wrappers to 644.
   **Fix:** In the story index's `## Context`, say that `scripts/autonomous-watcher.sh`, `scripts/remote-run.sh` and `scripts/prompt-injection-screen.sh` each differ from their template in file mode only (`100755` vs `100644`). In `task_16_plan.md`, change the first Verification bullet so that it compares content only and cannot fail on a mode difference. One way is to compare `git hash-object` of each pair. Another is to accept an `old mode`/`new mode`-only diff for all three named files. Keep the second bullet's "no mode change" requirement.

## Should Fix
1. **Task 2's work list leaves out one trigger-label comment that its own verification will catch** — file: `task_2_plan.md`, the `devscene-trigger.yml` Work bullet. In `cli/templates/github/workflows/harness-trigger.yml`, the header line *"label the HARNESS_TRIGGER_LABEL variable names (`sdlc-harness` when"* names the trigger label. The bullet lists only the first line, the `DEFAULT_TRIGGER_LABEL` mirror line and the `harness-run.yml` mentions. The third Verification grep (`grep -n "sdlc-harness"`) would flag the line, so nothing will slip through. Still, name it in the Work bullet so the work list and the check agree.
