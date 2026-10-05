### Task 15 — Add roadmap item 19 for the split-off design changes, cite it from the round 6 record, and restate the archive set in `ARCHITECTURE.md` §5

**Goal:** Give the design changes the operator decided in Gate 12 round 6, and that this branch hands to a follow-up, a number the documents can cite. Also make `ARCHITECTURE.md` → `## 5.` describe `classify_run_exit`'s archive set as Task 1 leaves it, since its two `**[shipped]**` sentences would otherwise state the old set.

**Depends on:** Task 1, which changes the archive set in `cli/templates/scripts/autonomous-watcher.sh`. Restated here: `spawn_engine` records `launch_answered_set`, every top-level index with both `question_<n>.md` and `answer_<n>.md` present when the session launched, in local mode and job mode alike; on every non-pause exit `classify_run_exit` archives the **union** of `resumed_for_index` and `launch_answered_set` through `archive_answered_pair`, then clears both; the pause arm still returns before any archival; a pair written during the session is in neither set and stays at the top level. The order of `classify_run_exit`'s branches (`stall_killing`, `PAUSE_ACK`, a top-level `question_<n>.md`, then `rc`) and the park-loop guard's registry fields are unchanged. They are items 4, 13 and 6 only: the draft pull request opened at start with its draft state following the run, `completed` on the pull request and the source issue with the §5 target rule rewritten to match, phase-progress comments, and resolving addressed review threads. `.claude/context/conventions.md` → `## Documents of record`: *"A deferral cites a numbered roadmap item, and the number owes a row."* Task 16's item 10 paragraph and Task 17's §4 paragraph cite it for the pull request that opens with the run, so the row lands first.

**What the row does not carry.** Two changes this plan names were decided by no one but this plan, so they are not owed work and no roadmap row carries them (`harness-runs/lessons.md` → `## Evidence and measurement`: *"A decision rule's outcome is a proposal to the maintainer, not a settled future … never write the change into other documents as pending work until the maintainer has decided to execute it"*):
- taking option (c), a threaded answer to a park, once the pull request exists from the start — Task 16 records the verdict *not now* and the revisit as a proposal;
- linking the pull request through the issue's Development panel — Task 17 records it as a proposal.

**Where this task stops.** `docs/development.md` → `## 6.`, one sentence of the Round 6 record, and two `ARCHITECTURE.md` §5 sentences:
- the Gate 12 (xiv) legs are **Task 19**'s;
- the follow-up's own task prompt is written out in this branch's story index (`## Follow-up task prompt — the decided design changes`), not in `docs/`;
- `ARCHITECTURE.md`'s `forge` coupling bullets stay as they are (story index `## Scope register`, row 21), and so does `## 7.` operation 7 (*"Exit with a status"*), which names the sentinels but not which pairs are archived (row 30). The §5 sentences this task edits are row 29.

### Targets

- `docs/development.md` → `## 6. The roadmap this tree defers to` — a new row.
- `docs/development.md` → Gate 12 → **Round 6** — the paragraph opening *"The round also settled four design changes for the follow-up"*.
- `ARCHITECTURE.md` → `## 5. Where the engine is reached — the launch path` — the inventory table's `autonomous-watcher.sh` → `classify_run_exit` row (its second cell, *"any `question_<n>.md` left at the top level once the resumed-for pairs are archived"*) and the paragraph after the table opening *"The honest negative result of this inventory"* (its *"once the pairs a park-resume consumed are archived"* clause).

**Work:**

- [ ] Add row **19** to the `## 6.` table, after row 18. It says, as owed work (not shipped):
  - **run control from the pull request**, the design changes Gate 12 round 6 decided: the draft pull request opened when the run starts, its draft state following the run (ready on `completed`, back to draft for a user-review round), and `completed` posted on the pull request and the source issue, with the §5 target rule rewritten to match;
  - one short comment per main phase;
  - resolving the review threads a round addressed.

  Name `docs/github-run-control.md` as the document it changes. Name nothing else: neither option (c) nor the Development-panel link is part of the row.
- [ ] In the Round 6 paragraph, cite the row without changing what was measured. After *"All are carried to a follow-up fix; none is fixed here."*, add: the defects (findings 1–8) and the two open questions were then addressed by `fix_forge_run_control_gate12_findings`, and the four design changes, finding 9 among them, are roadmap item 19.
- [ ] `ARCHITECTURE.md` §5, both sentences, as Task 1 leaves the code. In the table row, replace *"once the resumed-for pairs are archived"* with *"once every pair answered when the session launched is archived (`launch_answered_set`, the resumed-for pairs among them)"*. In the *"The honest negative result of this inventory"* paragraph, replace *"once the pairs a park-resume consumed are archived"* with *"once every pair answered when the session launched — by a park resume, a pause resume or a fresh launch — is archived"*. Keep each sentence's `**[shipped]**` marker, the branch order, the park-loop guard's field list and every other clause as they are; the paragraph's argument (every signal but the exit status is a filesystem sentinel) is unchanged, because `launch_answered_set` is read off the clarification directory, the same sentinel.
- [ ] Run the section's own check, `grep -rn -E "items? [0-9]+" . --exclude-dir=node_modules --exclude-dir=dist`, and confirm 19 now has a row. That command is the one the section states. It is read-only.

**Verification:**

- The `## 6.` table has a row whose first cell is `19`, and the paragraph after the table (*"Items 3, 4, 13 and 14 have shipped…"*) needs no change, because row 19 is owed rather than shipped. Re-read it to confirm.
- Row 19's text names neither a threaded answer, option (c), nor the Development panel. Re-read it to confirm.
- Leg text, findings 1–9 and every measured figure in the Round 6 record are byte-identical before and after. Only the one sentence was added.
- `git grep -n -e "resumed-for pairs are archived" -e "pairs a park-resume consumed" -- ARCHITECTURE.md` finds nothing, and `git grep -n "launch_answered_set" -- ARCHITECTURE.md` hits only the §5 table row. Re-read both §5 sentences against Task 1's `classify_run_exit`: each still opens with `**[shipped]**`, and each claim is checkable in the tree.
