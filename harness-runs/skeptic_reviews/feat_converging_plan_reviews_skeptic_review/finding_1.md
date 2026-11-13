### 1. An answered fix-plan park resumes through step 11 with `fix_round` never set, so the resumed rounds reuse round indices already on disk

**File:** `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` step 11 — "Where this session has not set `fix_round` — step 4's **extend** outcome — first set it to the highest `review_<k>.md` index in the two `user_review_<N>/` gate folders, or `-1` when neither holds one; a fork's resumability rule sets its own."

**Problem.** `fix_round` is now a session variable. Before this branch, every gate dispatch derived its index from the folder on disk (the next free `review_<n>.md`). A new session therefore has no `fix_round` until something sets it. Three places do:
- step 5, after the code review's Finding 1;
- step 11's clause above, but only for step 4's **extend** outcome;
- the autonomous fork's `## Override 2 — resumability` case **(d)**, which enters at step 7, not step 11.

Step 11's clause hands every other entry to "a fork's resumability rule". The only fork rule that enters step 11 in a new session is the autonomous fork's case **(a)** (`plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, the bullet opening `- **(a) Fix-plan index for the active round exists AND pending top-level answered pairs`). Case (a) resumes "the writer in revision mode … that dispatch is the core's **step 11**", and it sets no round counter. A grep of that fork for `fix_round` finds it only in case (d)'s bullets, the Override 6 trigger and the Safety-scaffolding pause and overload steps.

**Why it is reachable.** Case (a) is how the headless flow resumes every answered fix-plan park, including the cap park. That park fires at step 8's round close after five failing rounds, when `user_review_<N>/` already holds `review_0.md` … `review_4.md` in both gate folders and `plan_revisions/<branch>/` holds `fix_plan_<N>_revision_1.md` … `_4.md`. In the resumed session, step 11 runs `fix_round += 1` on a value nothing set. Taking it as 0 gives `fix_round = 1` and `cap_base = 1`. The writer then overwrites `fix_plan_<N>_revision_1.md`. Each gate finds `review_1.md` present and, under `plugin/instructions/plan_review_rounds.md` → `## The round file` ("If `review_<iteration>.md` is already present it is from an interrupted round … replace it"), replaces it. Later rounds replace `review_2.md` … in turn.

This breaks two statements:
- the core's own **The round counters.** paragraph: `fix_round` "carries on across user-review round `<N>`'s history";
- `docs/converging-plan-reviews.md` → `### The round counter is kept apart from the round files' numbering`: "the round files never overwrite an earlier round's".

The trip-wire count in `plugin/instructions/user_review_fixes_instructions_autonomous.md` → bullet (a) ("the fix plan's round count is the number of distinct `<k>` across the two") then undercounts the cycle's rounds. The working-tree history of the earlier rounds survives only in Override 6's commits.

**Fix.** In `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` step 11, replace

```
    Before dispatching, set `fix_round += 1` and then `cap_base = fix_round`; `<revision_note>` is step 5's path at that `fix_round`. Where this session has not set `fix_round` — step 4's **extend** outcome — first set it to the highest `review_<k>.md` index in the two `user_review_<N>/` gate folders, or `-1` when neither holds one; a fork's resumability rule sets its own.
```

with

```
    Before dispatching, set `fix_round += 1` and then `cap_base = fix_round`; `<revision_note>` is step 5's path at that `fix_round`. Where this session has not set `fix_round` — step 4's **extend** outcome, or a fork's resumability rule that enters here — first set it to the highest `review_<k>.md` index in the two `user_review_<N>/` gate folders, read with an `ls` (names only, never contents), or `-1` when neither holds one.
```

No fork edit is needed. Case (a) already routes to "the core's **step 11**", and case (d) enters at step 7 with its own counters, so it never reaches this clause unset.

Worked check after the fix:
- A cap park with `review_0.md` … `review_4.md` on disk resumes at `fix_round = 4 + 1 = 5` and `cap_base = 5`. The writer writes `fix_plan_<N>_revision_5.md`, and the gates write `review_5.md`, with a full five-round budget and two `full` rounds.
- A writer park during the initial write, with no round files, resumes at `-1 + 1 = 0`.

Under `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, this prose-only fix runs no test.
