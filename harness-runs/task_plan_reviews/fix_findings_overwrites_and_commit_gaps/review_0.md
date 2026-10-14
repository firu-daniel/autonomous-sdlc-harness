# Task plan review — iteration 0

## Must Fix

1. **Agent-side quoted dispatch blocks keep the old `iteration:` placeholder that Tasks 3, 5 and 7 rename (scope-register rows 26, 30, 39, 40 have the wrong disposition)** — files: `task_3_plan.md`, `task_5_plan.md`, `task_7_plan.md`, plus the story index (`fix_findings_overwrites_and_commit_gaps_story_plan.md`) → `## Scope register` rows 26, 30, 39 and 40.
   Each of these tasks renames the `iteration:` **value** in the caller's dispatch block so it cannot be confused with the cap counter:
   - Task 3: `<parity_iteration>` / `<arch_iteration>` become `<parity_review_index>` / `<arch_review_index>`;
   - Task 5: B.2 / C2.2 `<iteration>` becomes `<meta_review_index>`, and G.2 `<iteration>` becomes `<test_fix_review_index>`;
   - Task 7: the per-unit review block's `<iteration>` becomes `<review_index>`.

   The receiving agents quote those same dispatch blocks verbatim in their `## Invocation contract`, and no task updates the quotes:
   - `plugin/agents/business-parity-reviewer.md` → insertion point 3 block: `iteration: <parity_iteration>`;
   - `plugin/agents/architecture-reviewer.md` → insertion point 3 block: `iteration: <arch_iteration>`. The insertion point 4 (G.2) block already reads `iteration: <fix_plan_iteration>`, which matches neither side;
   - `plugin/agents/review-plan-reviewer.md` → both the B.2 and the C2.2 blocks: `iteration: <iteration>`;
   - `plugin/agents/layer-reviewer.md` → the unit's fenced block: `iteration: <iteration>`.

   After the branch, each agent would still show its caller passing the loop counter. Readers would be steered back to the counter-as-index reading that this branch exists to remove. This breaks the task prompt's constraint: *"Grep every field name, folder name and wire string you change … and change every quoting site together."* `.claude/context/plugin.md` → `## What this layer is` also counts a placeholder spelling as interface.

   The plan does more than leave the quotes stale. Two of its verification steps forbid fixing them:
   - Task 5: "no hit outside `plugin/instructions/plan_orchestration_instructions_core.md`" for `<meta_review_index>` / `<test_fix_review_index>`;
   - Task 7: "`<review_index>` … in `unit_loop_core.md` only".

   Rows 39 and 40 mark both reviewers `no-change` with a reason about the `iteration` row only. Rows 26 and 30 limit their edits to the `iteration` row.

   **Fix:** In the story index, change rows 39 and 40 to `change`, and widen rows 26 and 30 to include the quoted blocks. Then pick one of the following:
   - (a) Add the quoted block to each owning task's `### Targets` and `**Work:**`:
     - Task 3 → the insertion-point-3 blocks in `business-parity-reviewer.md` and `architecture-reviewer.md`;
     - Task 5 → both blocks in `review-plan-reviewer.md` and the insertion-point-4 block in `architecture-reviewer.md`;
     - Task 7 → the block in `layer-reviewer.md`.

     Then change the Task 5 and Task 7 verification greps so they expect those hits. Watch the 5-bullet ceiling: Tasks 5 and 7 already carry 5 `**Work:**` bullets, so fold the edit into an existing bullet or split the task.
   - (b) Keep each dispatch block's existing placeholder name and redefine its value in place, so no quoting site changes.

   Whichever you choose, state it in each task file.

2. **Task 17's "one commit means this run's series" test is false when this round's meta-review passed clean** — file: `task_17_plan.md`.
   Task 17 rewrites `## Override I` (b) in `plan_orchestration_instructions_autonomous.md` to say: "`git log --format=%h -- <folder>` listing more than one commit means earlier review rounds are present … With one commit, the listing is this run's series."

   That inference breaks in a reachable case:
   - Round 1's B.2 FAILs. Its files are committed by round 1's B.3.
   - On a later round, B.2 PASSes on the first dispatch and writes nothing.
   - B.3 still passes `meta_findings_folder`, because the folder exists and is non-empty (Task 5's own B.3 note says so), but it stages an unchanged folder and makes no new commit there.
   - `git log` therefore lists one commit, round 1's, and the trip-wire attributes round 1's meta-review rounds to this run.

   The module's rule is that "an unmeasurable trip-wire is silence, never a guess". The planned rule produces a wrong count as if it were evidence. The same hole applies to `<skeptic_review_meta_folder>` with C2.3.

   **Fix:** Replace the one-commit test with a condition that actually identifies this run's files. Two options:
   - (i) Mirror the user-review gate rule Task 17 already keeps for bullet (a): the meta folder is measurable only on a round-1 review, meaning `<code_review_path>` / `<skeptic_review_path>` is the unsuffixed index. On a suffixed round it is unmeasurable, and nothing is logged in that class.
   - (ii) Require the folder's single commit to be the same commit that added this round's review index.

   Update the Work bullet, the "What changes" bullet for the task-flow meta folders, and the on-paper Verification walk. Add the clean-later-round case to the walk.

## Should Fix

1. **`cli/templates/state-dir/qa_reviews/README.md` describes the blocked outcome, and no derivation entry reaches it** — files: the story index (`## Scope register`, entry E3) and `task_1_plan.md` (or a new row).
   The README says a round's index records "each test as **passed, failed or blocked**", and that a test the environment prevented driving "is recorded `blocked`". It also says "an index appears only on a round with something to report".

   After Tasks 11–12:
   - a blocked test writes no file;
   - a blocked-plus-pass round writes no index;
   - blocked tests appear only in a FAIL round's merged Context roll-up and in D.2.

   E3's patterns (`record a finding`, `report .?blocked`, …) do not match this file. Its wording is loose enough to stay partly true, so this is graded below Must Fix. Still, it is the adopter-facing description of the very outcome this branch redefines. Either add a row for it (with `change` owned by a cli-layer task, or `no-change` with a reason), or widen E3, e.g. `-e 'recorded .?blocked'` over `cli/templates/state-dir`.

2. **Task 6 cites a heading that does not resolve byte-for-byte** — file: `task_6_plan.md`.
   The Goal, the Work bullet and the second Verification bullet cite `## Final entry — INDEX`. The heading in `plugin/instructions/docs_orchestration_instructions_autonomous.md` is ``## Final entry — `INDEX` ``, with backticks. Quote it exactly, because Task 6's own verification checks that pointers name "a heading that exists, byte-identical".

3. **Task 12's verification expects the wire literal in D.2, but D.2's clause does not carry it** — file: `task_12_plan.md`.
   The first Verification bullet says `git grep -n 'error: blocked — '` shows "E.1, E.2 and D.2" matching the literal. The D.2 clause Task 12 writes is `; N test(s) blocked — Test <T> — <cause>[, …]`, which never contains `error: blocked — `. Drop D.2 from that expectation, or check D.2 with its own grep for the clause.

4. **Task 4's "exactly" grep count may contradict its own entry 13** — file: `task_4_plan.md`.
   The Verification says `git grep -n 'Record lessons for'` shows "exactly the Override 5 command and its prose spelling". If the new commit-points entry 13 restates the subject (the entries 6–12 it sits beside name what each point commits), that grep returns a third hit. Either say entry 13 does not quote the subject, or allow the entry-13 hit.

## Nice to Have

1. **Task 10's example could name the walk-position rule** — file: `task_10_plan.md`.
   Row `C` keys `item_<N>` by walk position, so `**Finding 2**` landing in `item_1/` is correct. A half-sentence saying so would stop an implementer from "correcting" it to `item_2/`.
