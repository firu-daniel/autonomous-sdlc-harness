`fix_findings_overwrites_and_commit_gaps` fixes ten defects in the plugin's flow contracts that the work-report research (`docs/work-report-research/README.md` → `## Pre-existing bugs found along the way`, branch `research_work_reports`) found and that a second reviewer confirmed against the source. They fall into three groups:
- findings files that overwrite an earlier round's;
- run artifacts that no commit stages, or that the wrong commit sweeps in;
- agent contracts that disagree with their callers.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Line numbers given were true at v0.6.7 (`a53b9b16`) and are hints only. Re-verify each defect before planning it. If one no longer reproduces, say so in the plan and drop it.

---

## Group A — findings indices that overwrite an earlier round

The rule the rest of the corpus already follows is `plugin/instructions/docs_phase_instructions.md`: "**Resolve `<i>` to the next free index in the slug directory — never assume `0`.**" That file names writing to an occupied index a "silent loss". Each defect below breaks that rule.

1. **User-review fix-plan gates reset per round over a flat folder.**
   - `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` step 7 ("Set `parity_iteration = 0`") and step 8 ("Set `arch_iteration = 0`") reset on every gate entry. Their `findings_folder` is flat per branch (`<state_dir>/business_parity_user_review_reviews/<branch>/`, `<state_dir>/architecture_user_review_reviews/<branch>/`). `architecture-reviewer` writes `<findings_folder>/review_{iteration}.md`.
   - So user-review round 2's `review_0.md` overwrites round 1's. The supervised fork commits nothing, so there round 1's copy is lost outright. The autonomous fork keeps it only in git history.
   - `user_review_fix_plan_writing_instructions_autonomous.md` claims "a later round appends findings into the same folder and the wrapper stages the delta". That is false today. The fix has to make it true, or change the sentence. Also check the "(a) Fix-plan convergence gates" bullet in `user_review_fixes_instructions_autonomous.md`, which describes the same folders.
2. **Meta-review folders restart each round.**
   - `<review_plan_review_folder>` = `<state_dir>/review_plan_reviews/<branch>/` and `<skeptic_review_meta_folder>` = `<state_dir>/skeptic_review_plan_reviews/<branch>/` (`plan_orchestration_instructions_core.md` → the placeholder table) are keyed by branch alone.
   - Both loops start at "`iteration = 0`. Loop:". A second code-review or skeptic round on the same branch therefore overwrites the first round's meta-reviews at HEAD.
   - The two state-dir READMEs (`cli/templates/state-dir/review_plan_reviews/README.md`, `…/skeptic_review_plan_reviews/README.md`) describe the current per-branch shape. Update them to match the fix.
3. **Multi-layer fix units share one findings folder with per-layer counters.**
   - `plugin/instructions/unit_loop_core.md`: every layer of a unit writes `review_<i>.md` into the row's one `Per-item findings folder`, each layer with its own counter. A fix iteration then reads "the most recent `review_*.md` in the row's `Per-item findings folder`".
   - For a `**Finding K**` / `**Test K**` unit tagged with two layers, the second layer's `review_0.md` overwrites the first's. The next fix round can hand one layer the other layer's findings.
   - Story-plan `**Task K**` units always carry exactly one layer and are unaffected.
4. **The docs catalog review starts at `i=0` unconditionally.**
   - `plugin/instructions/docs_orchestration_instructions_autonomous.md`: per-entry step 2 ("start i=0") and `## Final entry — INDEX` ("`review_<i>.md` (start `i=0`)").
   - A catalog run over a slug that already holds reviews overwrites committed `review_<n>.md` files. The `existing:` refresh token exists for exactly that case, and the INDEX slug is always present, so the INDEX collides on every run after the first.
   - The justification in `docs_phase_instructions.md` ("legitimately starts at `i=0` … because it is the *first* pass over a slug") must go, or be made true.

**Goal for group A:** no findings file that an earlier round or layer wrote is ever overwritten, and every reader that picks "the most recent" file picks the file meant for it. Choose one keying scheme and apply it to every site, either next-free index or a round or layer component in the folder or file name. State why you chose it. Check every consumer that globs these folders, for example `review-plan-reviewer`'s orphan check, the "most recent `review_*.md`" readers, and `improvement_observations_instructions.md`.

## Group B — run artifacts no commit stages, or the wrong one sweeps in

The committer stages "the code files shown by `git status --short`" (`plugin/agents/committer.md` → step 3). Its subject-reconciliation test asks whether the staged set holds any path other than `plan_path` and the unit's own detail file. The `staged: index-only` / `mark … done — ` signal that `unit_loop_core.md` step 6 and `improvement_observations_instructions.md` row (d) read depends on that answer being right.

5. **`lessons.md` is never committed by either user-review fix-plan fork.**
   - No instruction commits it, and Override 3's explicit staging list in `user_review_fix_plan_writing_instructions_autonomous.md` omits it.
   - It is swept into the first Phase A `review_item` commit in both forks, and that corrupts reconciliation for that unit.
   - A gate-cap park after the writer step leaves it modified at session end.
6. **Per-unit `layer-reviewer` FAIL findings are untracked when the committer runs.**
   - The unit loop writes them into the row's findings folder and never commits them before the commit step. They are staged with the unit, so `staged: index-only` is lost for every unit with a FAIL iteration wherever `<per_unit_review>` is `on`.
   - That covers the semi-autonomous forks and the autonomous user-review flow.
7. **The autonomous user-review QA.0 augment has no commit point.**
   - The commit-point list in `plan_orchestration_instructions_autonomous.md` has no QA.0 entry, and `ui_test_pass` stages only the index (`committer.md`).
   - New or revised `ui_test_<K>.md` files are committed only if a later QA-fix `review_item` commit happens to sweep them in. If every test passes, they stay untracked, which breaks the clean-tree invariant (`autonomous_pause_and_ledger.md` → `## 3`).

**Goal for group B:** every run artifact these flows write is committed by a commit point meant for it. The committer's reconciliation sees only the paths that belong to the unit it is committing. Give each artifact one of the following, and record which:
- an explicit commit point;
- an explicit path in an existing commit's staging list;
- a stated exclusion from reconciliation.

## Group C — contracts that disagree with their callers

8. **qa-tester's per-test "record a finding" blocks have no carrier.**
   - Several blocks in `plugin/agents/qa-tester.md` → `## How it tests` say "record a finding and report `blocked`" or "documented assumption — no fix loop", for example the precondition block in "**Following complex flows:**".
   - In practice they can return only through `error:`. That halts and escalates the whole QA phase (`plan_orchestration_instructions_core.md` → Phase QA), and an `error:` return has no place for a finding.
   - A third route, "record a finding and continue", contradicts both.
   - Give every per-test block a defined return: what it writes, what verdict it returns, and whether the QA phase continues. Then align the Phase QA parsing.
9. **`layer-reviewer`'s description is wrong about where it runs.**
   - Its frontmatter `description` says "(supervised, semi-autonomous and autonomous flows)".
   - No supervised flow dispatches it, because `plan_orchestration_instructions.md` says "no reviewer agents".
   - It runs in the autonomous user-review flow but not in the autonomous plan flow.
   - Rewrite the description to the real dispatch sites. The description is also shown in the agent list.
10. **The augment prompt differs at its three quoting sites.**
    - `plugin/agents/ui-tests-plan-writer.md` carries `Index:` and `Per-test files:`.
    - `plugin/instructions/qa_test_instructions.md` carries neither and splits across lines.
    - `plugin/instructions/user_review_fixes_instructions_core.md` (QA.0) uses `<fix_plan_path>`, `<fix_finding_dir>`, `<ui_test_index>` and `<ui_test_files_dir>`.
    - Only the leading verb is stable. Make the agent definition the single source, and have both callers quote it exactly.
    - Related, confirmed, and decide in the plan: augmented plans are never re-reviewed, because QA.0 dispatches `ui-tests-plan-writer` and never `ui-tests-plan-reviewer`. Either add the review or state why not.

## Constraints

- `plugin/` quotes its own literals across files. Grep every field name, folder name and wire string you change across `plugin/`, `cli/templates/`, `cli/test/` and `docs/`, and change every quoting site together.
- Run artifact folders are created by `init` from `cli/templates/state-dir/`. A new or renamed folder needs its README there and in the generator, and `cli/test/` pins the state-dir layout.
- Ledger row ids stay unchanged (`harness-run-lib.sh` parses them).

## Done when

- Each of the ten points is either fixed or dropped with a reason recorded in the plan.
- `cli/test` passes, and new tests pin the commit-point and keying changes wherever a script or generator is involved.
- A grep for `iteration = 0`, `start i=0`, `start \`i=0\`` and "same folder" across `plugin/instructions/` finds only sites that are collision-safe.

## Out of scope

- Thinning the agent and instruction files, which is a separate series.
- Work reports. They were researched and dropped.
