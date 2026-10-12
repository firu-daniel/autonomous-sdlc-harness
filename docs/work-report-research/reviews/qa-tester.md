# Review — qa-tester
verdict: FAIL

Counts checked: every Read-tree figure and every section count in `## Prose classification` re-run with `wc -w` / `sed -n 'a,bp' | wc -w`. All match exactly (7 201; 1 695; 5 864 + 2 647 + 4 174; notes-app 5 125 + 2 398 + 2 942 + 3 012 + 2 304 = 15 781; 362; 1 231; 1 388; 1 183 / 1 337; frontmatter 132; all 19 section rows). Thinning totals add up (3 818 + 340 = 4 158). The template measures 289 words (`sed -n '77,91p' | wc -w`), under the ≈ 340 claimed, so the estimate is conservative. The report is 2 908 words without the template. Lead 1 is applied correctly: `:138` blames only `cp`, and the brief's correction holds (`settings.autonomous.json` allows `sed`/`cat`/`mkdir -p` and Write/Edit under the repo or worktree). No reasoning rests on the wrong premise.

## Must Fix

1. **The "blocked has no return shape" claim gets the source wrong, and verdict change (4) is built on it.** The report says `## Output contract` "has only PASS / FAIL / `error:`" (`qa-tester.md:151`, Verdict, Open question 1). The source contradicts this:
   - `qa-tester.md:196` is the heading `### 3. Tests blocked`, and `:198–202` routes blocked runs to `error:`.
   - `plan_orchestration_instructions_core.md:489` calls the credentials-blocked case "its outcome #3".
   - `core:496` handles "per-test `error:`/`blocked`" as a single stop condition.
   - Both mobile stubs cite `qa-tester.md → ## Output contract → "3. Tests blocked"` (`qa-tester-mobile-maestro.md:14`, `qa-tester-mobile-mcp.md:14`).

   The mapping blocked → `error:` therefore exists. The real defect is narrower. The per-test "documented assumption — no fix loop" cases (`:120`, `:128`) and "record a finding and report `blocked`" (`:109`) are not in `:198`'s list. Routed through `error:`, they escalate the whole phase (`core:496`), and an `error:` return has no `findings_file:` for the "finding" to go in. `:122` adds a third route: "record a finding and continue to the next independent test case".

   Change: rewrite the Risks bullet and Open question 1 to say "blocked maps to §3 `error:`, but per-test documented-assumption blocks conflict with `error:` halting the phase". Drop "the template cannot have an outcome item until it is" from the Verdict. Q11 can name `error:` today and carry a note.

2. **Missed wire contract: callers cite `## Preconditions` step 3, and the plan removes "step text (now Q1–Q3)".**
   - `core:485` cites `qa-tester.md → ## Preconditions, step 3` twice, and says that step "also states what that clearing does and does not cover".
   - `qa_test_instructions.md:81` and `user_review_fixes_instructions_core.md:172` cite `→ ## Preconditions` for the same rule.

   Moving the step into template items Q1–Q3 breaks all three citations. Change: in `## Thinning plan` and the "Prose quoted elsewhere" bullet, either keep step 3 verbatim as a numbered step under `## Preconditions` (and re-estimate that row), or list the three caller edits.

3. **Missed wire literals inside `## Output contract`.** The plan merges "full-run vs per-test into one table". That puts at risk:
   - the label "Per-single-test invocation", cited at `core:98` and `core:487`;
   - the sub-heading "3. Tests blocked", cited at the two stub `:14` lines above.

   The report says the stubs "need no edit" (`:113`), but it checked only their `## Operating contract` list, not `:14`. Change: add both literals to the keep-verbatim column and to the wire list at `:71`.

4. **"Every bullet restates an earlier rule" is false, so cutting `## What you must NOT do` whole drops a rule.**
   - `qa-tester.md:213`, "never restate a credential value in a finding, a return line or a commit message", appears nowhere else. `grep -n "credential value"` hits only `:123` (typing credentials) and `:213`. The report itself cites `:213` in Risks as the secrets rule.
   - `:215`, "Never assert on volatile text", is only implied by `:116`.

   Change: keep `:213` (move it to Authentication or to Q4/Q5) and `:215`, and set that row to about 40 words, not 0.

## Should Fix

1. **Read tree omits `harness.config.json`.** The agent reads it up front for `phases.qa`, `qa.driver`, `layers[]`, `stateDir` and more (`qa-tester.md:12`, `:14`, `:27–40`). It is 154 words here and 185 in notes-app. Change: add the row and update the per-dispatch totals.

2. **Lead 12 (evidence leakage) is not addressed.**
   - Q1 asks for the "final URL" as evidence, and that URL carries the per-run probed port (`:63`), so the content differs on every run.
   - Q8 asks for "network/console evidence", and `browser_network_request` returns headers. Auth tokens could then land in a committed PASS report.

   Change: drop the URL from Q1, or keep its path only. Restrict Q8 to request name + payload field names, never headers or values. Add "slot number only, never a credential" to the Q4/Q5 item text itself (Risks says "State this in the item" but the item does not). Add a lead-12 row to `## Storage and lifecycle`.

3. **Template misses a mandatory step.** `## Read first` requires reading every conventions document and returning `error:` on an unreadable path (`:81`, `:84`), and no item covers it. Change: add "Conventions documents read" (or fold it into Q2), with the unreadable-path → `error:` branch.

4. **Template misses a goal-(b) rule.** The rule "missing test attribute → Should Fix finding" (`:116`) is the kind most easily skipped, and no item covers it. Change: add it to Q8 or as its own conditional item.

5. **Collision claim on `/branch-qa-test` re-dispatch needs nuance.** `qa_test_instructions.md:114` says a re-run after a fix "resolves its own next-free round folder in step 3, so it never overwrites". Only the same-invocation clarification re-dispatch reuses the folder. Change: narrow the `## Storage and lifecycle` Index row to that case.

6. **Side effect on round resolution is not mentioned.** Today a clean round creates no folder (`core:483`, `qa_test_instructions.md:97`). With PASS reports, every round creates one, and the next-free `<round>` resolution consumes it: `qa_test_instructions.md:77` and user-review `QA.0` step 1 (`user_review_fixes_instructions_core.md` → `### QA.0`). That is harmless but changes numbering. Change: note it in the PASS-writes-nothing row.

7. **"After" estimates for the two largest rows are not grounded.** `## How it tests` goes 2 147 → 1 050 and `## Output contract` about 1 030 → 800, with no draft and no subtraction shown. The roughly 3 000-word margin makes the constraint robust, but show the per-subsection subtraction (or a draft count) for these two rows.

8. **Citation misrepresents its source.** "the browser-grant claim (`dispatch_discipline_instructions.md:68` roster, `committer.md:8`)" is wrong on both counts. `:68` is the unsolicited-guidance roster. `committer.md:8` cites qa-tester as the PASS sign-off for `ui_test_pass`, not the browser grant. Change: relabel both.

## Nice to Have

1. **Q11 "quote the return line"**: state that the quote stays inline in the tick line (never a standalone line starting `verdict:`), and that the report is never echoed into the return. Callers parse the return "word for word" (`:73`). No file parser reads the report, so this is not a current wire risk. The header line `# QA work report — …` cannot be mistaken for a wire line.
2. **Template header**: carries `<findings_folder>`. It is repo-relative as dispatched (`:55`); say "as given, never absolutized".
3. **Lead 13**: the report counts CLAUDE.md but does not say which read list wins. Add one line: they agree, because CLAUDE.md's `conventions.md` row is a subset of `:81`.

## Bug claims

- **"Per-test `blocked` has no return shape" (Risks bullet 1, Open question 1) — PARTLY REFUTED / CONFIRMED in narrower form.**
  - Refuted part: §3 is titled "Tests blocked" and maps blocked to `error:` (`qa-tester.md:196–202`). The callers treat blocked as outcome #3 / `error:` (`core:489`, `core:496`, `qa_test_instructions.md:99`, `:108`, `user_review_fixes_instructions_core.md:249`), and the stubs cite "3. Tests blocked" (`qa-tester-mobile-maestro.md:14`).
  - Confirmed part: the per-test blocks at `:109`, `:120` (×2), `:121`, `:123` and `:128` are labelled "documented assumption — no fix loop" or "record a finding and report `blocked`". Through `error:` they halt and escalate the whole QA phase (`core:496`, `:708`), which conflicts with the "documented assumption" intent and with `:122`'s "record a finding and continue". `:109`'s "record a finding" has no carrier under `error:`.
  - Also, "five places" undercounts: `grep -n blocked` hits 15 lines (`:12 14 109 119 120 121 123 124 128 130 135 174 196 198 217`), and `:124`/`:130` are covered by `:198`.
- **"No commit point for clean-round PASS reports" — CONFIRMED.** `committer.md:42` (`ui_test_pass` commits "only that index file") and `core` → E.2 Round PASS ("No round-level QA-review index is assembled on a clean round").
- **"Same-round re-dispatch overwrites `qa_review_0_t<T>.md`" — UNCLEAR.** It holds only for an in-invocation clarification re-dispatch. A user-initiated re-run gets a new round folder (`qa_test_instructions.md:77`, `:114`).
