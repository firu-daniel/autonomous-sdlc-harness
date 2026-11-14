### 2. Commit-point entry 18 lists the fix-plan round commit's path set without `<state_dir>/plan_revisions/<branch>/`

**File:** `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`, entry 18 — "It stages only that fork's planning path set — the round's fix-plan index and folder and both gates' `user_review_<N>/` folders — followed by its own push."

**Problem.** Entry 18 spells out the path set its commit point stages, and the list stops at four paths. The commit point it describes stages five. In `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 6 — commit each fix-plan review round`, the wrapper call passes `"<state_dir>/plan_revisions/<branch>/"` after the two `user_review_<N>/` folders. That is where the writer's revision notes `fix_plan_<N>_revision_<k>.md` go, and the converging reviewers read them (`plugin/instructions/plan_review_rounds.md` → `## Converging mode`). Entry 19 defines its pause commit as "entry 18's planning path set", so it inherits the same gap.

The register calls itself the single source of truth for this invariant and asks that the entries be edited "as a group". A maintainer who checks Override 6 or the pause commit against entry 18 reads the revision-notes folder as outside the path set. Entry 16, the task-plan analogue, avoids this by naming no paths.

**Fix.** In entry 18, replace

```
the round's fix-plan index and folder and both gates' `user_review_<N>/` folders
```

with

```
the round's fix-plan index and folder, both gates' `user_review_<N>/` folders and `<state_dir>/plan_revisions/<branch>/`
```

and leave the rest of the entry unchanged. Entry 19 needs no edit: it inherits "entry 18's planning path set" by reference. Under `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, this prose-only fix runs no test.
