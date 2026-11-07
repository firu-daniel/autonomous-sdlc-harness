## question_1 — How this branch records the CLOSED §1.5 note, and whether the §1.2 latency may be taken by hand
- **raised by:** `task-plan-writer`, planning phase, first iteration (no story index or task files written yet); findings path: none.
- **asked:**
  - **Q1 — How should this branch obtain the 2026-11-06 §1.5 note it is told to rewrite?** The task prompt told this branch to rewrite the 2026-11-06 note in `docs/guard-verification.md` §1.5 from "open" to CLOSED, but that note existed only as commit `622d4ca0` on the unpushed local branch `chore_record_guards_from_clone`, which also edits the §2.4 (a) `cd` sentence and the i19 row. Asked because it decides cross-branch history and a merge into the protected `dev`. Options:
    - **(A)** You push `chore_record_guards_from_clone`, merge it into `dev`, and move this branch onto `dev` before planning resumes. The plan then rewrites the landed note and §2.4 (a) in place. *(Writer's recommendation.)*
    - **(B)** This branch writes its own CLOSED record (new §2.4 rows, corrected §2.4 (a) sentence, a §1.5 note of its own) and leaves `chore_record_guards_from_clone` alone; before that branch merges, you rebase it onto this one and rewrite its note to CLOSED yourself.
    - **(C)** Something else — e.g. drop the record branch and have this branch re-record its 843-cell clone round as well.
  - **Q2 — May the §1.2 before/after latency be taken by hand rather than inside the run?** The task prompt's "Take §1.2's composite row paired, before and after" conflicts with the lessons-ledger rule that a document of record never carries a wall-clock figure measured inside a run's own session. Writer's proposed default:
    - The run measures and records the §1.3 **fork counts** (exact, deterministic, permitted inside a run), which state whether the fix adds a fork or filesystem lookup per piece.
    - The run ships the paired before/after timing recipe for §1.2.
    - You take the §1.2 composite row before and after **by hand** before merge; it is listed under manual setup, and the doc carries an explicit "owed, taken by hand" line until you fill it in.

    Options: accept this default, or state how the latency should be handled instead.
- **answered:**

  > Q1 — (B). This branch writes its own CLOSED record: the new §2.4 rows with the closing arm named, the corrected §2.4 (a) `cd` sentence (a session in a run copy reaches paths under the copy through the sibling glob; after the fix that route no longer leaves the workspace), and a §1.5 note of its own. Leave `chore_record_guards_from_clone` and its commit `622d4ca0` alone, and do not cite that commit as part of this branch's tree. After this branch merges, the record branch will be re-taken on top of it by hand, and its note will be written as CLOSED from the start. The prompt's instruction to rewrite the 2026-11-06 note is therefore satisfied by this branch's own record. The i19 row is the record branch's to correct; leave it unless this branch's own changes move it.
  >
  > Q2 — Accept the writer's default. The run measures and records the §1.3 fork counts before and after, and ships the paired §1.2 timing recipe. The §1.2 composite row is listed under manual setup and carries an explicit "owed, taken by hand" line until it is filled in by hand outside any session. No wall-clock figure measured inside the run goes into a document of record.
- **carries beyond this branch:** `chore_record_guards_from_clone` is to be re-taken by hand on top of this branch after it merges, with its note written as CLOSED from the start and its i19 row corrected there; and the §1.2 composite row stays "owed, taken by hand" until measured outside any session — no in-run wall-clock figure enters a document of record.
