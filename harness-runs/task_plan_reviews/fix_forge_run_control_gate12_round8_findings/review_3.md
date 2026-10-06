# Task plan review — iteration 3

The Must Fix from iteration 2 is resolved in the artifact:
- In `task_10_plan.md`, rule (a) now accepts a branch only after `remote_branch_exists "$b"` answers `0`. An answer of `1` is refused with "`<b>` no longer exists on origin …", and `2` is refused naming the failed read. Neither refusal says "not a harness branch".
- There is a never-pushed `feat_y` case, and `THE BRANCH.` text that states the condition.
- The condition also appears in the story index's finding 5 paragraph, in `task_14_plan.md` → **Who and where.**, and in register rows 25 and 55.
- `remote_branch_exists` exists in `remote-run.sh` with the `0` / `1` / `2` contract the task cites.

Structure checks pass:
- All sixteen readiness entries map 1:1 to their files.
- Each entry carries one layer and a points value of 20 or less, and no file has more than five `**Work:**` bullets.
- The order runs `cli`, then `plugin` (Task 16), then `general`, and every `**Depends on:**` link points at an earlier entry.
- No task targets a conventions document, and no `**Verification:**` bullet runs the suite or a test file its task does not create or edit.

I re-ran D1 to D8, D14 and D15 word for word, and every site they reach is a row. Re-walking D10 found one site that is not a row.

## Must Fix

1. **Scope register, disposition (i): D10 reaches `docs/github-run-control.md` → `## 2.` → **Which pull requests count.**, and the register has no row for it.** File: the story index (`fix_forge_run_control_gate12_round8_findings_story_plan.md`), `## Scope register`.
   - **Why D10 reaches it.** D10 traverses all of `github-run-control.md` → `## 2.`. Its decision rule (c) reaches any paragraph that states "which branch `control` accepts". This paragraph states exactly that for the review path: *"A review counts on **a pull request from the run's branch**: a head branch in this repository, unprotected, whose tip carries `<stateDir>/flow_progress/<branch>_progress.md`."* That is `control_check_branch`'s protected test followed by its ledger test, which `control` applies to a review's head through `control_check_branch "$REVIEW_HEAD"` (`remote-run.sh` → `verb_control`'s `if [ "$review" -eq 1 ]` branch).
   - **Why the row matters here.** `task_10_plan.md` states that the review path passes no `started` argument, so rule (b), the in-flight test, applies to it too. After Task 10, a review on a pull request whose head has no ledger but has a `harness run <head>` queued or in progress passes `control_check_branch`. "Whose tip carries `<stateDir>/flow_progress/<branch>_progress.md`" is then no longer the test that is applied. The later story-index refusal (`remote-run.sh` header: *"then a head whose origin tip carries no `<state>/story_plans/<head>_story_plan.md` is refused"*) may keep the outcome the same in practice. If so, the row's reason has to say that, rather than the site going unlisted.
   - Row 30 (**The target rule.**) cites this paragraph (*"§2, Which pull requests count"*) as the definition of a recognised pull request. Whatever this row decides has to keep that cross-reference true. The target rule still uses the ledger alone.

   **Fix:** in the story index's `## Scope register`:
   - Add one row for `docs/github-run-control.md` → `## 2.` → **Which pull requests count.**, evidence `D10 (c)`.
   - Give it one of two dispositions:
     - **`change`, owned by Task 14.** State that a review's head passes the same branch test as a command on a pull request (the ledger, or a `harness run` in flight), and that the story-index check that follows still refuses a head with no story index. Add the paragraph to `task_14_plan.md`'s `### Targets` and its `## 2.` **Work:** bullet. Keep "whose tip carries the ledger" as the definition that row 30's target rule relies on, or reword row 30's citation to match.
     - **`no-change`, with a reason that holds against Task 10's rule (b).** For example, the reason may be that no head without a ledger can carry a story index, so the in-flight path changes no outcome. Cite where that ordering is fixed.

## Should Fix

- **Task 14 still adds a never-started clause to the `answer` row.** File: `task_14_plan.md` (`## 1.` Work bullet: *"Make the same addition, less the first-run clause, to the `answer` row"*; and the Tasks 5 to 7 fact *"`resume` and `answer` use the engine its dispatch recorded"*). The same phrase is in `task_7_plan.md`'s Goal (*"and `answer` where it applies"*).
  - The `answer` row's *Accepted when* is "The run is parked and `<n>` is an open question". A never-started run is `paused` / `killed` or `failed`, never `parked`, so `answer` never acts on one.
  - This is the fourth round this has been raised. It is neither resolved nor recorded under `## Rejected findings`.
  - **Fix:** drop the `answer` addition. Or reword it: an answer whose dispatch GitHub never started is recovered with `resume`.
- **The annotation read has no `checks` permission.** Files: `task_6_plan.md`, `task_13_plan.md`. This is raised again, unaddressed.
  - `harness-run.yml`'s `permissions:` block lists no `checks` scope, so `check-runs/<id>/annotations` will fail, and the reason will fall back to the conclusion text.
  - **Fix:** either add `checks: read` with its header line, or state in Tasks 6 and 13 that the fallback is the expected text under the shipped permissions.
- **`notify not_started` sends a word outside `autonomous-notify.sh`'s seven.** File: `task_8_plan.md`. Raised again, unaddressed. Task 9 states its own exception for `bundle_unreadable`.
  - **Fix:** state that the generic title is intended. Or send the push as `paused` / `failed`, and keep `not_started` for `forge_report` alone.
- **Task 8's way on says "from its committed ledger" on a first run, which has none.** File: `task_8_plan.md` (*"Comment `$COMMAND_HANDLE resume` to start it again from its committed ledger."*). Raised again, unaddressed.
  - Task 8's own "A first run, engine recorded" case posts this sentence on a branch with no ledger. Task 16 corrects the same claim in `branch-resume.md`.
  - **Fix:** word the sentence so it holds for a first run.
- **The resumed first run gets the "resume strictly from the committed flow-progress ledger" clause.** Files: `task_7_plan.md`, `task_16_plan.md`.
  - The run is safe in practice: `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.4 Creation` has the planner fork's Setup create the ledger when it is absent.
  - Neither task cites that, and "Resuming it is safe" rests on `verb_restore` alone.
  - **Fix:** cite `### 1.4 Creation` beside the `verb_restore` citation.
- **Task 13's restated Task 10 fact leaves out the existence condition.** File: `task_13_plan.md`, the **Task 10.** bullet: *"or, for a command on an issue, the branch that issue's genuine `started` marker names"*. Task 10 and Task 14 both add *"and it still exists on origin"*. Task 13 writes no branch-recognition prose of its own, but its fact list is what its implementer reads.
  - **Fix:** add the condition.

## Nice to Have

- **Task 13's heading and its readiness entry differ.** The index entry's title includes "what `killed` covers", and `task_13_plan.md`'s `### Task 13 —` heading leaves it out. The numbers agree. Align the two titles.
