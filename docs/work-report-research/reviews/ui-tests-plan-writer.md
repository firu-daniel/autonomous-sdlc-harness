# Review — ui-tests-plan-writer
verdict: FAIL

Counts I re-checked and found correct: every Read-tree `wc -w` figure (5 671 / 1 676 / 1 695 / 3 012 / 7 201 / 442 / 1 199 / 1 183 / 1 337 / 6 476 / 1 231 / 5 125), all 26 section ranges in the classification table, each row's A/R/W/X split and the column totals, the template (686 words, 26 items), the `qa-tester.md` slices (28 + 454 = 482; 655 + 2 160 = 2 815), and the main ledger (18 002 → 8 998, −9 004). The premise for lead 1 is correct: the report creates the file with `Write` and does not rely on `cp`.

## Must Fix

1. **The report misses a consumer that reads the prose it moves.** `ui-tests-plan-reviewer` reads `${CLAUDE_PLUGIN_ROOT}/agents/ui-tests-plan-writer.md` as "the **contract you validate against**" (`plugin/agents/ui-tests-plan-reviewer.md:63`). It grades against named sections of it: §"Split output spec" (:93) and §"Split output spec (b)" (:103). `user_review_fixes_instructions_core.md:161` also cites the writer's "Augment after user-review fixes" label. The thinning plan moves `## Process` steps 1–4 and `## Quality checks before saving` into a template that the reviewer never reads. That would take the following rules out of the reviewer's grading standard: the `**Depends on:**` links pointing lower, backend names coming from task files, and the ban on failure-only tests. Risk 5 deals only with the scope of the reviewer's `qa-tester.md` read. **Change:** list the reviewer (:63, :93, :103) and core :161 as wire consumers under Risks 7. Then do one of two things: keep the graded rules in the definition as REFERENCE and give the template items a `ref:` to them, or make the reviewer read the template too and count it in the reviewer's load.

2. **Lead 12 is never addressed, and O1 leaks an absolute path into a committed file.** O1's evidence is "first line returned". On a normal write that line is `ui_test_index: <full_path>` (`plugin/agents/ui-tests-plan-writer.md:188`), which is an absolute worktree path under the home directory. The report would commit it through Override 3. **Change:** make O1's evidence `tests_count=…` (with an optional repo-relative index path). Add a line under Storage saying that no `→` line carries an absolute path, a timestamp or env output. A4's `file:line` must be repo-relative.

3. **The "Rejected findings" count is wrong.** Line 63 says "shared with 12 other agents (`grep -l … plugin/agents` → 13)", and line 155 says "the 13 that carry `## Rejected findings`". `grep -rl 'Rejected findings' plugin/agents | wc -l` → **8**, this agent included, so 7 others. The list is user-review-fix-plan-writer, business-parity-reviewer, task-plan-writer, architecture-reviewer, ui-tests-plan-reviewer, task-plan-reviewer and test-fix-plan-writer. **Change:** correct both lines and the shared-base sharing list.

4. **The alternative-total arithmetic is wrong (line 172).** The before figure without the `qa-tester.md` scoping is 2 450 + 686 + 250 + 1 676 + 3 012 + 7 201 + 442 = **15 717**, not 15 467. The delta is −2 285, not −2 535; the report's figure is 11 % off. The shared base was left out. The constraint still holds. **Change:** correct the figure and the delta.

## Should Fix

1. **The "after" figure for the definition is guessed, not drafted.** The 2 450 at line 188 comes from class totals: "REFERENCE shortened to ≈ 1 400" is never broken down by section. My rough tally of the report's own keep-verbatim list plus its shortened sections comes to about 2 450–2 850, so the figure is plausible but not shown. **Change:** add a per-section subtraction table.

2. **The report does not say where the saving comes from.** About 75 % of the −9 004 (−6 719) comes from scoping the `qa-tester.md` read, which is a behaviour change independent of work reports. The mechanism itself adds +936 (template + base). With no thinning it would break the constraint: 18 002 + 936 = 18 938. **Change:** state both points in the Verdict.

3. **Where the template lives is never stated, and the "this repo" row contradicts S1.** Line 178 says "S1 returns before the template or base is read". S1, however, returns "the no-UI block inline with this report", so the template must already be loaded. Storage says "Create it with `Write` from the embedded template", which implies it is embedded in the definition and loaded on every dispatch. **Change:** name the location. If it is embedded, the "this repo" row after is 4 145 + 686 = 4 831; the constraint still holds.

4. **Lead 13 is not addressed.** `examples/notes-app/.claude/CLAUDE.md:32` tells any agent doing "implementation, review or planning" to read `context/conventions.md` (5 125 words). The report files that file as on demand, as "part of 5 125", reached through `presentation.md:24`. **Change:** state which instruction wins. If `CLAUDE.md` wins, add 5 125 to both before and after (23 127 → 14 123). The constraint still holds.

5. **Inline reports on the no-write paths could be misread as wire output.** The template opens with an H1 and six `##` headings, and mentions `## Questions` four times (D1, A3, A4, O1). Every caller stops on a returned `## Questions` section:
   - `task_plan_writing_instructions_core.md:255`;
   - `qa_test_instructions.md` step 4;
   - `user_review_fixes_instructions_core.md:165`.

   No template line *starts* with a parsed literal (`ui_test_index:`, `no_ui:`, `tests_count:`, `reason:`, `blocker:`, `verdict:`). Even so, an inline report would repeat contract literals in the same reply. The report's Open question 2 itself proposes a single `## Work report` heading. **Change:** when the report is returned inline, put it under one `## Work report` heading inside a fenced block, demote the section headings to bold, and add an evidence rule: never start a line with a contract key.

6. **R3 does not fit mobile drivers.** `qa-tester-mobile-*.md` have no `## Which MCP to use` section (headings at `qa-tester-mobile-mcp.md:22–55` and `qa-tester-mobile-maestro.md:22–47`). The scoped read is undefined under those drivers. **Change:** add a branch to R3 that reads the `tools:` line and reaches the `n/a` marker, and add a mobile-driver row to the ledger: before 11 984.

7. **The template is missing steps.**
   - The expected console state (`<convention_symbols>` logger, :125) has no item.
   - The augment-with-no-existing-plan path (:56: re-run No-UI over branch + fix plan, then write from scratch) is folded into D1 without being stated.
   - Nothing says to keep untouched tests undisturbed on augment (:54).

   **Change:** add these items, or extend A-items with conditions.

8. **Commit gaps are understated.** Override 3 fires only on `verdict: PASS` (`task_plan_writing_instructions_autonomous.md:87`). At the cap escalation and on an autonomous `## Questions` park, the revision reports stay untracked. The engine tolerates untracked `<state_dir>/` files (`plan_orchestration_instructions_autonomous.md:281`), but those files are lost at PR time. Lead 5 is also not addressed: once committed, the reports enter the `branch-reviewer` diff. **Change:** cover both under Storage.

9. **The report is too long.** It runs to 3 490 words without the template, against a 1 500–3 000 target. **Change:** trim the classification notes and Risks.

## Nice to Have

1. `ref: → ## Split output spec (a)` / `(b)` are not headings. (a) and (b) are bold paragraphs under `## Split output spec (mirror the task-plan-writer exactly)` (:145, :149, :156). Use the real heading.
2. Line 70 says the no-failing-backend rule is "stated three times: :114, :142, :175 (implied)". :175 is the literal-authority check. Cite :114 and :142 only.
3. Line 213 gives "about 170 per branch". Per-item ticking is 26 × 6 = 156, or 24 × 6 = 144 using the report's own 24. Fix the figure.
4. The `phases.qa: false` basis measures a dispatch the walker never makes: `cli/test/flow-walker-ui-and-reentry.test.mjs:166–176` shows `ui_writer` is never dispatched. Say it is only the caller-bug path at :12.

## Bug claims

- **The augment prompt differs at all three quoting sites: CONFIRMED.**
  - `plugin/agents/ui-tests-plan-writer.md:51` carries `Index:` and `Per-test files:`.
  - `plugin/instructions/qa_test_instructions.md:50–54` carries neither, and splits across lines.
  - `plugin/instructions/user_review_fixes_instructions_core.md:158` uses `<fix_plan_path>`, `<fix_finding_dir>`, `<ui_test_index>` and `<ui_test_files_dir>`.

  Only the leading verb is stable.
- **The QA.0 augment output has no autonomous commit point (Open question 4): CONFIRMED.**
  - The commit-point list (`plugin/instructions/plan_orchestration_instructions_autonomous.md:277–300`) has no QA.0 entry.
  - `ui_test_pass` stages the index only (`plugin/agents/committer.md:150–155`).

  New or revised `ui_test_<K>.md` files are therefore committed only if a QA-fix `review_item` commit happens to sweep them in from `git status --short` (`committer.md:112`). If every test passes, they stay untracked. This is a pre-existing gap that the report would inherit; it is not created by the proposal.
