### 1. A fix-plan rewrite restarts `fix_round` at 0 and overwrites the user-review round's earlier round files

**File:** `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` step 5 — "Then set `fix_round = 0` and `cap_base = 0`."

Step 5 is the writer's initial-write dispatch, and it is reached from two places: a first write (no fix plan yet), and step 4's **rewrite** outcome, which the supervised fork's `<existing_artifact_decision>` offers whenever a fix-plan index already exists for the active user-review round (`plugin/instructions/user_review_fix_plan_writing_instructions.md` → its `<existing_artifact_decision>` row: "rewrite" → the writer in initial-write mode (step 5)). On the rewrite path the two gate folders for this user-review round, `<state_dir>/business_parity_user_review_reviews/<branch>/user_review_<N>/` and `<state_dir>/architecture_user_review_reviews/<branch>/user_review_<N>/`, already hold `review_0.md`, `review_1.md`, … from the earlier session.

Step 5 still sets `fix_round = 0` unconditionally. So the next round dispatches both gates with `iteration: 0`, and each reviewer, finding `review_0.md` already on disk, treats it as a file from an interrupted round and **replaces** it (`plugin/instructions/plan_review_rounds.md` → `## The round file`: "If `review_<iteration>.md` is already present it is from an interrupted round: review again in the mode the dispatch names, and replace it."). Each later round then overwrites `review_1.md`, `review_2.md` and the revision notes `fix_plan_<N>_revision_<k>.md` in turn. The supervised flow commits nothing during planning, so those earlier files are lost for good.

This contradicts the core's own counter contract in the very next paragraph — "`fix_round` is the review round's index `<k>`: it names both gates' round files and the revision note, and carries on across user-review round `<N>`'s history" — and the decision of record in `docs/converging-plan-reviews.md` → `### The round counter is kept apart from the round files' numbering`: "the round files never overwrite an earlier round's". Step 11 already handles the same situation for its **extend** entry ("first set it to the highest `review_<k>.md` index in the two `user_review_<N>/` gate folders, or `-1` when neither holds one"). Step 5 needs the same rule. The task-plan loop does not have this problem, because its walker's `start` reads the round number off the round files whatever the entry is.

**Fix:** in step 5, replace

```
   Then set `fix_round = 0` and `cap_base = 0`.
```

with

```
   Then set `fix_round` to one past the highest `review_<k>.md` index in the two `user_review_<N>/` gate folders (steps 7–8), read with an `ls` (names only, never contents), or `0` when neither holds one; and set `cap_base = fix_round`.
```

Keep the `**The round counters.**` paragraph after it as it is. Its sentence "`cap_base` is `fix_round` at the last step-5 or step-11 writer dispatch" already describes the new step-5 value, and `fix_round − cap_base` still starts at 0, so the rewrite still gets a full five-round budget and two `full` rounds. A first write still starts at 0, because its `user_review_<N>/` folders are empty, so the sentence in `docs/converging-plan-reviews.md` → `### The fix-plan loop's gate folders are per user-review round` ("the fix-plan loop's round index starts again at 0 with each user-review round") stays true and needs no edit. Under `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, this prose-only fix runs no test.
