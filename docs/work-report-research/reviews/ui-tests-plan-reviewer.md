# Review — ui-tests-plan-reviewer
verdict: FAIL

## Must Fix

1. **The template leaks absolute paths into a committed file (lead 12 is not addressed).** O3/O4 and the trailing `Verdict returned: <paste>` paste the return. On FAIL the return carries `findings_file: <full_path>` (`plugin/agents/ui-tests-plan-reviewer.md:200`). That path is absolute, because the agent builds every literal path from the absolute `<repo_root>` (`:28`). R3's "driver → file" would resolve `${CLAUDE_PLUGIN_ROOT}` to the plugin install path under the user's home. C6's `literal → file:line` comes from a grep rooted at `<repo_root>`, so it is absolute too. All of these land in a folder that Override 4 commits (`plugin/instructions/task_plan_writing_instructions_autonomous.md:154`). The report never mentions lead 12 (`grep -n -i 'lead\|absolute'` finds only leads 3, 5, 7 and 9).
   **Fix:** Paste only the `verdict:` value and `must_fix_count`, and never `findings_file`. Require every evidence path to be repo-relative and `${CLAUDE_PLUGIN_ROOT}`-relative. Add a line under `## Risks and costs` covering lead 12, and one covering lead 13 (see Should Fix 1).

2. **The qa-tester "frontmatter = 703 words" figure is wrong, so the narrowed-read figure is wrong.** `sed -n 1,6p plugin/agents/qa-tester.md | wc -w` gives **132**. The 703 is lines 1–22, which is the frontmatter plus the intro prose that comes before `## Resolved values` (`sed -n 1,22p … | wc -w` → 703). `## Which MCP to use` (`:99–111`) is 454 words. The narrowed read is therefore about 586 words (frontmatter plus section), not 1 146. That is a 49 % error on this row. It moves the "report + narrowed reads" total by about 560 words (about 5 %). The constraint still holds and the error is conservative, but the stated fact is false.
   **Fix:** Correct `:36`, `:121` and `:143` of the report. Either state that the intro prose is also read (and say why) or use 132 + 454. Recompute the 11 029 / −51 % figures.

## Should Fix

1. **Lead 13 (read-list conflict) is not resolved.** `examples/notes-app/.claude/CLAUDE.md:32` tells every agent doing "**Any implementation, review or planning**" to read `context/conventions.md` (5 125 words). This agent is a reviewer. The report notes the row (`:29`) but files the document as on-demand and does not say which instruction wins. Counting the larger set gives a "today" figure of 27 657. Every "after" column rises by the same 5 125, so the constraint still holds, but the ledger is understated. `ui-tests-plan-reviewer.md:91` argues the agent does not depend on the adopter's restatement, and that is the argument to cite.
   **Fix:** State which instruction wins, and add a "larger set" row or footnote to the ledger.

2. **The tool reasoning rests on the wrong lead-1 premise.** The report says the report is "written once and no ticking happens during the run" *because* `Edit` is absent (`:172`), and "Without `Edit` the agent fills the report and writes it once" (`:187`). Both present this as forced. But `Bash(sed:*)` and `Write(/{{repoRoot}}/**)` are allowed (`cli/templates/claude/settings.autonomous.json:39,50`), so `sed -i` ticking is possible. A single end-`Write` is a design choice. It also does not follow from the read-only guarantee at `:14`: Bash already lets the agent write anywhere, so that guarantee covers only the `Edit` tool.
   **Fix:** Reword `:8`, `:172` and `:187` to present end-`Write` as a choice: fewer calls, no in-place edits by a reviewer, and a single atomic file. Name `sed -i` as the rejected alternative.

3. **The "after" figure for the agent definition (~2 770) is not grounded.** The thinning plan (`:119`) lists what is removed but never subtracts it section by section. A rough subtraction from the report's own classification table (removal of :10/:12/:14/:18/:28, Process, Read-first bullets, docs rows, :130/:138, :149, :52, :91, plus the ~30-word amendment) gives about 3 100–3 200. On that figure the report-only column is about 21 800 against 22 532, so the constraint holds with a margin of about −3 %, not −5 %.
   **Fix:** Add a per-section before/after column to the thinning table, or draft the thinned file and `wc -w` it.

4. **Wrong citations.**
   - `task_plan_writing_instructions_autonomous.md:160` for `--entry ui_review` re-entry, and `:162` for the PAUSE untracked tolerance: those lines are push-related. The real lines are `:188` (resume-from-ledger, `--entry ui_review`) and `:190` (PAUSE "untracked … tolerated").
   - Walker node `ui_review` at `task_plan_writing.graph.json:184–208`: the file ends at line 192. The node is `:161–186`, and the cap is `"iteration": { "cap": 5 }` at `:8`.
   - The `n/a (<qa_driver> variant declares no capability set)` literal is attributed to "core `:40`". Core `:40` is blank. The literal is at core `:259`.
   **Fix:** Correct all three.

5. **The list of places stating the PASS contract is incomplete and inconsistent.** The Verdict says "five places" (`:12`). The storage section lists six and amends four (`:176–181`). It also misses three statements:
   - `ui-tests-plan-reviewer.md:14`: "The only file you write is your own findings file."
   - `task_plan_writing_instructions_autonomous.md:141`: the staging list's "UI-test-plan-review findings, when any".
   - `:148`: "a reviewer that returned PASS created no folder and its path is simply skipped".
   **Fix:** Give one consistent enumeration that includes these three.

6. **Classification column totals are mis-added.** Summing the rows gives REFERENCE 1 475 (the report says 1 495) and REDUNDANT 892 (the report says 873). The grand total of 4 529/4 530 still matches.
   **Fix:** Correct the totals row (`:79`).

7. **C6's description is 27 words, over the 25-word limit.** All other items comply (measured per item).
   **Fix:** Trim it, for example by dropping "Evidence: literal → `file:line` or task." into a shorter form.

8. **The no-plan guard is missing from the template.** `## Process` step 0 (`:75`) is a real, mandatory first step: absent index → `verdict: PASS`, write nothing. The template starts at S1 and only handles the blocker (R7). The report says "no plan means no report" (`:181`), but no item records it.
   **Fix:** Either add a G0 item, or state explicitly that the guard exits before the template is filled.

## Nice to Have

1. **Remote runs carry the folder whole.** The remote planning bundle copies `ui_test_plan_reviews/<branch>` across a pause (`cli/templates/scripts/lib/harness-run-lib.sh:2154`), so the `findings_folder` placement also survives remote resumes. This supports the storage choice and is worth one line.
2. **Header line resembles the findings title.** The template header `# UI-test plan review — work report <k> …` is near-identical to the findings title `# UI-test plan review — iteration {iteration}` (`:182`). Nothing parses either title (`grep -rn "^verdict\|must_fix_count" scripts cli/templates/scripts plugin/hooks` returns nothing), so the risk is low. A distinct title such as `# Work report — ui-tests-plan-reviewer …` would avoid confusion for anyone listing the folder. No line in the template begins with `verdict:` as written. Fix 1 keeps any pasted return from starting a line that way.
3. **Count the sibling sections without headings.** The writer section counts are close (701 / 413 / 270 measured against 693 / 401 / 265 reported), and the gap is within tolerance. State whether headings are included.

## Bug claims

- **"Augmented plans are never re-reviewed" (`:50`): CONFIRMED.** `grep -n ui-tests-plan-reviewer plugin/commands/branch-start-plan.md plugin/instructions/qa_test_instructions.md plugin/instructions/user_review_fixes_instructions_core.md` returns nothing. QA.0 dispatches the writer only (`user_review_fixes_instructions_core.md:155`).
- **"A report indexed by `iteration` would be overwritten after a PASS re-entry" (`:162`): CONFIRMED.** `fw_next_review_index` considers only `review_*.md` (`scripts/lib/flow-walker-gates.sh:57–75`), and PASS writes no `review_n`, so the next dispatch reuses `n`.
- **"A `review_`-prefixed report would advance the cap" (`:164`): CONFIRMED.** `fw_round_count` counts every `review_*` entry (`flow-walker-gates.sh:80–93`), and the cap is 5 (`task_plan_writing.graph.json:8`).
- **"The semi-autonomous hand-off's absent-folder inference breaks" (`:168`): CONFIRMED** as a consequence of the proposal, not a pre-existing bug (`task_plan_writing_instructions_semi_autonomous.md:40`: "where none exists (every plan reviewer passed first time), say nothing").
