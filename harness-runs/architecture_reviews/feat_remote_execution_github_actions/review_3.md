# Architecture review — iteration 3

The one Must Fix from iteration 2 is resolved in the plan:

- `task_9_plan.md` now lists these three passages as Targets: `WHO RUNS IT.`, `ANCHORS ARE DERIVED, NEVER REMEMBERED.` and the `# Anchors.` block comment. It qualifies each one in place, points at `JOB MODE`, and carries the verification grep.
- `task_11_plan.md` extends both anchors passages for a remote record (a GitHub Actions job, a mirror filled by `sync`, stopped through `stop`) and adds them to its grep.

The one new Must Fix below has the same shape as the earlier ones. Task 12 cannot meet its own test without making a stated watcher guarantee false, and the plan does not name that guarantee as a target.

## Must Fix

1. **Task 12 puts `relay_remote_pauses` after the kill switch's early return, but its test requires the relay to run while the kill switch is up. Meeting that test makes the `tick()` guarantee false.** Offending file: `task_12_plan.md`. Rule violated: `.claude/context/cli.md` → `## What "done" means here`: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit — a header a review reads as a guarantee is worth exactly what the code under it still does."* Iterations 1 and 2 applied the same rule to the watcher's block comments.

   Task 12's contract places the new pass *"in `tick` after the kill-switch check and before the resume passes"*, and says *"The kill switch does not block a pause — it stops starts, and a pause is not one."* Its cases then require: *"with `AUTONOMOUS_STOP` present the answer and resume relays send nothing and every file stays, while the pause relay still sends"*.

   The two statements cannot both hold. In `cli/templates/scripts/autonomous-watcher.sh` → `tick()`, the kill-switch check is `if kill_switch_active; then log …; lane_release_if_idle; return 0; fi`, so nothing placed after it runs while `AUTONOMOUS_STOP` is present. The implementer has two options, and each breaks something:
   - Follow the stated placement. The planned case fails, and a user's pause never reaches a running remote job while the local brake is on.
   - Move the relay ahead of the return, or into the kill-switch branch. That makes these two comments false:
     - The `tick()` block comment: *"One pass. The kill switch first, so an operator's brake beats everything else"*.
     - The `kill_switch_active` doc comment: *"checked before every launch and at the top of every pass"*.

   The header's `THE KILL SWITCH IS THE OPERATOR'S` paragraph (*"stops the watcher from launching or resuming ANY run"*) stays true, because a relayed pause is neither a launch nor a resume. But it is the natural place to say that the relay is the one thing that still runs under the brake. None of the three passages is in Task 12's Targets.

   **Fix:** In `task_12_plan.md`:
   - Change the contract's placement sentence to name one position: inside the kill-switch branch of `tick()`, before its `return 0`, and again at the stated position when the switch is off. Or name a single call ahead of the kill-switch check. Say which, so the planned `AUTONOMOUS_STOP` case can pass as written.
   - Add these to **Targets**, each qualified **in place** and pointing at `REMOTE DISPATCH`:
     - the `tick()` block comment *"The kill switch first, so an operator's brake beats everything else"*;
     - the `kill_switch_active` doc comment;
     - the header's `THE KILL SWITCH IS THE OPERATOR'S, AND THIS SCRIPT NEVER DELETES IT.` paragraph.

     Each qualification says that relaying a remote run's pause is the one action that still runs under the brake, because it starts nothing.
   - Add a verification grep, for example `grep -n -E "brake beats everything else|checked before every launch|THE KILL SWITCH IS THE OPERATOR" cli/templates/scripts/autonomous-watcher.sh`. Each hit must be followed, in the same passage, by the remote-pause qualification.

## Should Fix

These have been carried since iteration 0, 1 or 2 and are still not addressed. None of them blocks.

- **`task_15_plan.md` still re-spells `retrievalApplies`** in the workflow's `jq`. This goes against `cli/src/config/model.ts` → `retrievalApplies`: *"Declared once, here … Import it; do not re-spell it"*. Fix it one of two ways:
  - Declare the exact expression in the template header as a mirror, and name the template in that doc comment.
  - Restore the cache unconditionally.
- **`task_15_plan.md` still records the measurement in two places.** The full record belongs in `docs/remote-execution.md` (`.claude/context/conventions.md` → *"a measured fact or a decision of record"* goes in `docs/`). The shipped template should carry only the derived default and a pointer to that record.
- **`task_26_plan.md` still credits Task 2 with names Task 2 does not own.** These are `HARNESS_MAX_CHAIN`, `HARNESS_SELF_PAUSE_AFTER_MINUTES`, `HARNESS_STEP_TIMEOUT_MINUTES`, `HARNESS_REMOTE_SLUG` and `HARNESS_JOB_MODE`. Either add them to Task 2's table, or name `harness-run.yml`'s and `remote-run.sh`'s headers as their owners and verify against those.
- **`harness-state` is still not declared as a named mirror in `remote-run.sh`.** Task 5's mirror declaration and its grep cover only `harness-run.yml` and `HARNESS_GH_CLI`, but Tasks 6–8 use `-n harness-state`.
- **The remote state bundle still has two formats of record.** Task 4's library section is one. The other is Task 24's `AUTONOMOUS_FLOW.md` row, which reads *"`docs/remote-execution.md` is its format of record"*. Keep one owner, and have the row and Task 28 cite the library section.
- **`task_6_plan.md` still fixes only the readers sentence of `cli/templates/state-dir/autonomous_logs/README.md`.** The README's *"Everything here is written by the run daemon"* stays false once `remote-run.sh` writes `remote_download/`, `remote_superseded/`, `remote_status.json` and `<branch>.remote.log` there.
- **`task_18_plan.md` still names `remote-run.sh` in `requiredBinaries`' source text without arguing it.** `.claude/context/cli.md` → *"One string, one producer"* allows this only as message-only text, with the boundary argued in the entry's own doc comment (`cli/src/doctor/checks.ts` → `WORKTREE_SCRIPT`, `REFRESH_SCRIPT`).
- **New: `task_3_plan.md` / `task_13_plan.md` — who reads the registry.** Task 3's amended library header says the library *"implements the run registry's reads and writes for the scripts that share it"*. Task 13 then extends `restart-watcher.sh`'s own private `jq` enumeration of `registry.json`, and that script already sources the library. The two tasks don't settle whether this is a second reader. Either:
  - scope Task 3's sentence to the primitives the watcher and `remote-run.sh` share, and name `restart-watcher.sh`'s read-only enumeration as its own; or
  - add an `hr_registry_*` enumeration that Task 13 calls.

## Nice to Have

- This note has stood since iteration 0. Between Task 5 and Task 21, `remote-run.sh` is in the shipped table with `agentInvocable: false` but is not yet on `DENY_SCRIPT_BASENAMES`. One sentence in Task 5 saying that no adopter receives the script before the branch merges would make that window explicit.
