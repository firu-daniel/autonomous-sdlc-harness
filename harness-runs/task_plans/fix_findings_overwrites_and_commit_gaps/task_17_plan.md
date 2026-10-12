### Task 17 — Teach both autonomous `Override I` round counts the branch-wide next-free series

**Goal:** Keep the improvement-observations trip-wires measuring the right files once Tasks 3 and 5 change the keying. Both autonomous forks' `Override I` describe the round series they count, and both descriptions are written for the old counter-keyed folders:

- `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Override I` → bullet **(b)** calls `<review_plan_review_folder>` (B.2) and `<skeptic_review_meta_folder>` (C2.2) "the only two plain consecutive `review_<i>.md` series here";
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override I` → bullet **(a) Fix-plan convergence gates** says the two gates "run off *independent* counters (`parity_iteration` / `arch_iteration`, each reset to 0 in its own step)".

After this task, both bullets describe what the folders now are: branch-wide `review_<n>.md` series that continue across rounds at the next free index and never overwrite. Both also say how a run counts only its own round.

**Depends on:** Task 3 (the user-review gates' next-free keying), Task 5 (B.2 / C2.2's next-free keying), and Task 16 (the last earlier task to edit these two files).

**The keying both bullets now describe:**

- every file in these four folders is named by the next free `review_<n>.md` index at the moment its reviewer was dispatched;
- no file is overwritten;
- a folder may hold earlier rounds' files.

What changes is how a Phase-D count isolates *this* run's files:

- **User-review gate folders.** Unchanged in outcome: measurable only on a round-1 cycle (unsuffixed fix-plan index). On a round-2+ cycle the folders also carry earlier rounds' files, so the count is unmeasurable and nothing is logged in that class.
- **Task-flow meta folders.** The same rule as the user-review gate folders, keyed on the review index the folder serves. `<review_plan_review_folder>` is measurable only when this run's `<code_review_path>` is the **unsuffixed** index (`…_code_review.md`, the branch's first code-review round); `<skeptic_review_meta_folder>` only when `<skeptic_review_path>` is the unsuffixed `…_skeptic_review.md`. On a suffixed round (`_2`, `_3`, …) the folder may carry earlier rounds' files, so that folder's count is **unmeasurable** and nothing is logged in that class (the module's "an unmeasurable trip-wire is silence, never a guess"). The test reads only the path the flow already resolved: no `git log`, no listing, no commit counting.

  **Why not a commit count.** A commit-count test ("one commit touching the folder means this run's series") is false in a reachable case: round 1's B.2 FAILs and round 1's B.3 commits its files; a later round's B.2 PASSes on the first dispatch and writes nothing; that round's B.3 still passes `meta_findings_folder` (the folder exists and is non-empty, Task 5's B.3 note) but stages an unchanged folder and makes no new commit there. `git log` then lists one commit — round 1's — and the count would attribute round 1's meta-review rounds to this run. The same holds for `<skeptic_review_meta_folder>` with C2.3. The unsuffixed-index rule has no such case, because on round 1 no earlier round can have written into the folder.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md` (`## Override I` → bullet (b), the meta-folder sentences only)
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` (`## Override I` → bullet (a) only)

**Work:**

- [ ] `plan_orchestration_instructions_autonomous.md` → `## Override I` → (b): replace "The meta folders hold a per-round file instead: … as `review_<i>.md` — the only two plain consecutive `review_<i>.md` series here." with:
  - the branch-wide next-free series;
  - the unsuffixed-index measurability rule above: each meta folder is measurable only when the index it serves (`<code_review_path>` for `<review_plan_review_folder>`, `<skeptic_review_path>` for `<skeptic_review_meta_folder>`) is unsuffixed; on a suffixed round that folder is unmeasurable and nothing is logged in its class. Name both indices by placeholder, never as a `<state_dir>/…` expansion.

  Keep the rest of (b) unchanged: the suffixed-index roots, the QA round folders and the test-fix roots. Leave bullet (a)'s task-plan gate text unchanged, because those folders are walker-keyed and untouched by this branch.
- [ ] `user_review_fixes_instructions_autonomous.md` → `## Override I` → (a): replace the "**The two gates run off *independent* counters** (… each reset to 0 in its own step) …" sentence with "each gate's folder is its own next-free series, so the two roots are two separate series and the fix plan's round count is the **total** across both". Rewrite the ⚠️ round-2+ sentence's reason: the folders carry earlier rounds' files because a later round **continues** each series, not because a counter restarts. Keep its conclusion, which is that round-1 cycles are measurable and round-2+ are unmeasurable.

**Verification:**

- `git grep -n -E -e 'plain consecutive' -e 'reset to 0 in its own step' -- plugin/instructions` returns nothing.
- Walk three cases on paper:
  - **Round 1.** `<code_review_path>` is `…_code_review.md` (unsuffixed); B.2 writes `review_0`–`review_2`, then PASSes. The folder is measurable and the run counts its own files.
  - **Later round with findings.** `<code_review_path>` is `…_code_review_2.md`; B.2 writes `review_3.md` after round 1's `review_0`–`review_2`. The folder is unmeasurable and its count is never reported as 4.
  - **Later round that passes clean.** Round 1's B.2 FAILed and B.3 committed its files; on `…_code_review_2.md` B.2 PASSes on the first dispatch and writes nothing, and B.3 stages an unchanged folder with no new commit there. The folder is unmeasurable because the index is suffixed — round 1's files are never attributed to this run. Repeat the same case for `<skeptic_review_meta_folder>` with `<skeptic_review_path>` and C2.3.
- `git grep -n -e 'git log' -- plugin/instructions/plan_orchestration_instructions_autonomous.md` shows no hit inside `## Override I` → (b): the rule reads the resolved index path, not history.
- Both bullets still name their roots by placeholder or by the owning core's step, never as a `<state_dir>/…` expansion, which is each fork's existing ⚠️ rule.

**Deviations from plan:**

- `user_review_fixes_instructions_autonomous.md` → `## Override I` → (a): the Work bullet names only the "independent counters" sentence and the ⚠️ reason, but the preceding clause "each a plain consecutive `review_<i>.md` series" also matched the Verification grep for `plain consecutive`; it was dropped, its content now carried by the next-free sentence. The ⚠️ sentence's `review_<i>.md` was respelled `review_<n>.md` to match the owning core's next-free wording.
