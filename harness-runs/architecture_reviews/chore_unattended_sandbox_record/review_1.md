# Architecture review — iteration 1

## Must Fix

None. Iteration 0's Must Fix is resolved. `task_7_plan.md` now owns the trio guard's re-measurement line in `docs/guard-verification.md` → `### 2.6 The file-tool trio guard`, in the `general` layer, and `task_2_plan.md` names Task 7 as its owner. That satisfies `.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts` (*"A change to any guard or to the library re-measures itself in `docs/guard-verification.md`"*) and keeps the write in the layer that owns `docs/` (`.claude/context/conventions.md` → `## The layers`).

Checked and found sound:

- **Layer placement.** Task 1 (`cli`) touches only `cli/templates/scripts/…` and `cli/test/…`. Task 2 (`plugin`) touches only `plugin/hooks/git-trust-file-guard.sh`. Tasks 3–8 (`general`) touch `docs/`, `README.md`, `llms.txt` and `scripts/lib/gate12-sandbox-round/`. The last has no counterpart under `cli/templates/scripts/lib/`, so it is this repository's own file and is not an `init` copy.
- **Self-adopted copies.** The plan leaves `scripts/launch-sandboxed-gates.sh` and `scripts/lib/harness-run-lib.sh` alone and lets them follow at the re-render. This is consistent with `.claude/context/conventions.md` → `## Documents of record`, which says `scripts/` at this root is `init`'s output.
- **Where a new responsibility goes.** The new document of record lives in `docs/` (`### Where a new responsibility goes`, *"a measured fact or a decision of record"*). Task 3 gives it its own statement of who reads it and what it owns (`## What accompanies a new unit of each kind`, last row).
- **Wire literals.** Task 2 changes the deny-reason literal. The only other place it is quoted is the observed cell of `docs/sandbox-verification.md` row AP9, which is deliberately left byte-identical, and `cli/test/git-trust-file-guard.test.mjs` does not assert on the citation. Task 7 changes `G12_FR4_DEPARTURE`, and no test asserts on its text.
- **Test-run rule.** The only test file any plan names is Task 1's own edited `cli/test/run-copy-clone-arm.test.mjs`. That is allowed by `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 4. Task 2's REPRO drive and Task 7's paired-tree re-drive run no test file.

## Should Fix

1. **Re-raised from iteration 0, and unaddressed: Task 5's reason for leaving the watcher's clamp literals unchanged contradicts Tasks 2 and 7.** Offending file: `task_5_plan.md`, the `**§7 bullets.**` work item.
   That item still says the watcher log lines are *"left unchanged, because changing a literal is behaviour"*. On the same branch, though, Task 2 changes the guard's runtime `deny` reason literal and Task 7 changes the runtime string `G12_FR4_DEPARTURE`. A reader of the record's §7 bullet will see the stated principle broken twice.
   The story index has no `## Rejected findings` section, and the work item is unchanged. So this finding was neither applied nor recorded. `harness-runs/lessons.md` → `## Unattended control loops` says *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held"*.
   **Fix:** In `task_5_plan.md`, rewrite the `**§7 bullets.**` item so the reason states the real distinction:
   - The watcher literals carry no residual number, so the prompt's scope predicate (*"every citation of a residual by number"*) does not reach them.
   - They sit in a cli-layer template, `cli/templates/scripts/autonomous-watcher.sh`, whose self-adopted copy only follows at the post-merge re-render.
   - They still resolve through `docs/cli.md`'s pointer.

   Delete *"because changing a literal is behaviour"*. Alternatively, record this finding with its reason under a `## Rejected findings` section in `chore_unattended_sandbox_record_story_plan.md`.

## Nice to Have

1. **Task 2 does not state its half-built window.** Affects `task_2_plan.md`. `task_1_plan.md` now says *"This task lands before the file exists"*. `task_2_plan.md` has no equivalent line, even though its `deny` reason will cite `docs/sandbox-record.md residual 12` three commits before Task 5 creates §6. Adding one sentence to its `**Depends on:**` paragraph would make that state explicit for anyone bisecting the branch.
