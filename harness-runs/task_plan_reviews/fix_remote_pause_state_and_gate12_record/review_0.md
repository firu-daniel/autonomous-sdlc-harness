# Task plan review — iteration 0

## Must Fix

1. **Task 1 routes around the unattended run's capability containment** — story index (`fix_remote_pause_state_and_gate12_record_story_plan.md`, `## Context` → **Task order, and the one exception.**) and `task_1_plan.md` (**Why this is a task and not a human step.**), with `task_4_plan.md` depending on it.
   The plan says outright why Task 1 exists. The unattended permission profile grants no `gh api` call (confirmed: `cli/src/generators/permissionProfile.ts` emits no `Bash(gh …)` or `WebFetch` entry). But a plain `bash scripts/<name>.sh` is auto-allowed by `plugin/hooks/autonomous-script-allowlist-guard.sh`. So the run writes a new script under `scriptsDir` that makes the network calls, commits it, and then runs it in Task 4.
   The guard is the harness's capability containment for an unattended run. Its header says it must let the run execute *"the repository's own version-controlled wrapper scripts"*, and that it *"must NOT be able to run an arbitrary script a prompt points it at"*. A script the unattended run writes for itself, to get a capability its profile deliberately withholds, is the case the guard exists to exclude. Committing it first does not change that. `.claude/context/conventions.md` → `## Shell assets` treats the guard's permit as a containment boundary, not a convenience to be exploited.
   The same task is also the only reason for the plan's one exception to the bottom-up, catch-all-last ordering: a `general` task placed before every `cli` task.
   **Fix:**
   - Remove Task 1 and renumber the rest.
   - Move the evidence-gathering out of the unattended run as a `Manual setup required:` item in `## Context`. It names the read-only lookups a maintainer runs by hand before the run reaches the pin task: each action's `action.yml` `runs.using` at each candidate major, and each new major's `.0.0` release notes. It also names the path where their verbatim output is recorded, for example a file under `harness-runs/scratch/` or an addition to the task prompt.
   - Rewrite `task_4_plan.md`'s **Depends on:** and **Work:** to read the majors from that recorded output, and to return a blocker naming the missing record when it is absent. Keep the rule that every version fact comes from the record, never from memory.
   - Replace Task 4's `bash scripts/check-action-runtimes.sh` verification bullet with a check against the recorded output.
   - Drop the ordering-exception paragraph and the `Top risks:` / `Manual setup required:` references to the wrapper.

2. **Scope register: derivation D2 is under-inclusive** — story index (`## Scope register`).
   I re-ran D1 through D5 verbatim and re-walked D6. Every site they reach appears as a row. But two durable adopter-template sites state what the state bundle carries, or what an expired one loses, and no entry reaches them. After Task 2, both leave out the planning drafts:
   - `cli/templates/github/workflows/harness-run.yml` → header `WHY retention-days IS SET` (*"The `harness-state` bundle is the only remote copy of a run's clarifications and carried counts; a run parked or paused longer than its retention cannot be answered and loses those counts."*). Task 4 edits this same paragraph, but only its unverified sentence.
   - `cli/templates/scripts/autonomous-watcher.sh` → the registry-field comment for `pause_reason`'s `expired` value (*"the job can no longer take an answer, and the carried counts are lost"*).
   **Fix:**
   - Replace D2 with a strictly wider command, for example:
     `git grep -n -E "clarification directory|the walker state|clarification history|carried counts|only remote copy" -- docs plugin cli/templates cli/src README.md ARCHITECTURE.md ROADMAP.md`
   - Add a row for each site it newly reaches, with a disposition. For the `harness-run.yml` sentence, the natural owner is Task 4 (now renumbered), which already edits that paragraph: name the planning drafts beside the clarifications and counts. For the watcher comment, either give it an owning `cli` task or record a `no-change` reason.
   - Re-check the closure invariant after the change.

## Should Fix

1. **Task 2's restore rule can add stale drafts into an already-committed planning directory** (`task_2_plan.md`, **The restorer, in `job` mode only**).
   The never-overwrite rule is per file. `remote-run.sh restore` walks past a run that left no bundle (`remote-run.sh` header: *"walking past a run with none"*). So consider a job that committed P1, after revising the per-task set, and then died without uploading. The next job restores the older pre-P1 bundle. Every draft path the committed set no longer holds, for example a `task_8_plan.md` the revision removed, or a superseded review file, is then placed into the committed `task_plans/<branch>/` directory. The `save` step re-carries it in every later bundle.
   The prompt asks how *"a restore treats a path the fresh checkout already has"*. A directory the checkout already carries is such a path.
   Fix: add a family-level condition. For example, place nothing from `planning/` when the checkout already has `story_plans/<branch>_story_plan.md`, since before Override 4's commit that file is untracked and absent from a fresh checkout. Add a test case for it beside the kept-file case in `task_3_plan.md`.

2. **Task 2's names rule versus `hr_remote_planning_paths`** (`task_2_plan.md`). `THE FORMAT OF RECORD` opens with *"Every name below is a variable `hr_remote_names_var` assigns; no function spells one."* The new `hr_remote_planning_paths` spells eight literal paths inside a second function. Either have the header state that `hr_remote_planning_paths` is the second name owner and why it needs `<branch>`, or amend that sentence in the same edit. `.claude/context/cli.md` → `## What "done" means here`: *"the change either satisfies it or amends the header in the same edit"*.

3. **Task 6 turns an inference into a measurement** (`task_6_plan.md`, bullet **What a profile with no plugin-root grant cost — measured.**). The replacement sentence says round 2 *shows* that the job read the plugin root, on the reasoning that *"no session does without reading the plugin's instruction files"*. The prompt records no read and no preflight line, which Task 7 correctly records as (ii) *reached — lines not recorded*. Word the sentence as an inference from the full delivery, not as a measurement (`.claude/context/conventions.md` → `## Documents of record`, first bullet).

## Nice to Have

1. `docs/outer-loop-verification.md` → **A real GitHub Actions run.** (register row 10, `no-change`) still names the expression-valued `timeout-minutes` as *"the likeliest cause"* of a rejected dispatch. Round 2 found it accepted. The paragraph is about the stub suite and stays true, but that clause could cite Gate 12 round 2.
