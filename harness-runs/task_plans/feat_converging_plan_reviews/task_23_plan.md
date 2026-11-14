### Task 23 — Restate the implementation-flow readers of the plan-gate folders and add the new commit points

**Goal:** Fix the two implementation-flow forks' improvement-observations trip-wire roots, which assume each plan-gate folder is its own next-free series of failed rounds, and add the four new autonomous commit points to the clean-tree invariant's registry.

**Depends on:** Task 19 (`## Override 6 — commit each plan-review round` and the task-plan planning-pause commit in `task_plan_writing_instructions_autonomous.md`'s Override 5). Task 20 (`## Override 6 — commit each fix-plan review round` and the fix-plan planning-pause commit in `user_review_fix_plan_writing_instructions_autonomous.md`'s `## Safety scaffolding`). Task 11 / Task 12 (every gate writes `review_<n>.md` every round, `PASS` included, `<n>` the round shared by every gate's folder; fix-plan gate files under `<branch>/user_review_<N>/`).

**Where this task stops.** The improvement-observations module's own method is unchanged; only these two forks' description of their group-(a) roots is.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md`
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`

**Work:**

- [ ] `plan_orchestration_instructions_autonomous.md` → **This fork's units and review artifacts** → **(a) Plan-convergence gates**: the first three folders now hold one file per round each, `PASS` included, at the same index in every folder, so the plan's round count is the number of distinct round indices across them (no longer *"the total across all three folders' own series"*), and a failed round is one whose files carry a `verdict: FAIL` line; the UI-test plan-review folder is unchanged.
- [ ] Same file → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`: append entries 16–19 — the task-plan round commit (Override 6 of the task-plan fork), the task-plan planning-pause commit (its Override 5, through `autonomous_pause_and_ledger.md` §2.2), the fix-plan round commit (Override 6 of the fix-plan fork) and the fix-plan planning-pause commit (its `## Safety scaffolding`, through §2.2) — each stating when it fires, that it stages only its fork's planning path set, that it is followed by its own push, that exit 3 is its normal re-entry outcome, and that it **is** a gate (a refusal is surfaced, never ignored, because a planning pause must not honour a dirty tree). Extend the numbering sentence above the list to say entries 16–19 are appended last although they fire during planning.
- [ ] `user_review_fixes_instructions_autonomous.md` → **(a) Fix-plan convergence gates**: *"Each gate's folder is its own next-free series"* and the round-2+ *unmeasurable* clause become: each gate's folder holds one `user_review_<N>/` subfolder per user-review round, one `review_<k>.md` per fix-plan round in it, `PASS` included, the same `<k>` in both gates — so this cycle's rounds are the files under its own `user_review_<N>/`, measurable on every user-review round, and the fix plan's round count is the number of distinct `<k>`.

**Verification:**

- `grep -n "own next-free series\|the total across all three folders" plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md` finds nothing.
- `grep -nE "^1[6-9]\. " plugin/instructions/plan_orchestration_instructions_autonomous.md` lists the four new entries, each naming the override heading it points at, and each heading resolves (`grep -n "^## Override 6" plugin/instructions/task_plan_writing_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`).
