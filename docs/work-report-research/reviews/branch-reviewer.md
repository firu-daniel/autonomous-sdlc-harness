# Review — branch-reviewer
verdict: FAIL

Checked: every Read-tree count (`wc -w`), every per-section total (`sed -n 'a,bp' | wc -w`), all ledger arithmetic, template word count and item lengths, and 15+ citations. Counts are exact: 6 175 / 1 695 / 2 647 / 5 864 / 4 174 / 1 199 / 1 146 / 377 / 732 and the four "not read" files all match. All 13 section totals match, and they sum to 6 173. The class columns sum to 927 / 1 482 as stated. 23 277, 15 579 and 3 724 (≈ 3 720) all add up. Citations verified correct: `core.md:273-283`, `:308`; `code_review_instructions.md:21`, `:30`; `autonomous.md:167`, `:281`; `autonomous_pause_and_ledger.md:79-80`; `branch-start-docs-autonomous.md:30`; `committer.md:89`, `:113`; `review-plan-reviewer.md:108`; `skeptic-reviewer.md:99`; `dispatch_discipline_instructions.md:68`; `settings.autonomous.json:50-51`; `hooks.json` (single `Bash` matcher); `branch-reviewer.md:83`, `:73`, `:10`. The adjust re-dispatch cap of 0–4 is correct (FAIL at `iteration` 0–3 re-dispatches, and the 5th FAIL escalates). No `cli/test`, `cli/templates/scripts` or hook file mentions `branch-reviewer` (grep: no output).

## Must Fix

1. **The template writes a literal the agent's own contract says is never saved.**
   - **Claim.** Q1 ("paste carried/covered/stale counts") and Risks ("Q1 (must match the returned `Pass 2 carried over …` line)") put the Pass 2 reconciliation summary into a committed file.
   - **Evidence.** `plugin/agents/branch-reviewer.md:222` says "a one-line reconciliation summary — **not written into any saved file**: `Pass 2 carried over N items, skipped M (already covered) and K (stale).`". `:62` calls that return line load-bearing, and `core.md:283` reads it from the message.
   - **Change.** Name this contract in `## Prose classification` (Output contract, WIRE) and in `## Thinning plan`. Then do one of two things:
     - amend `:222` explicitly, and state that no caller depends on the "not saved" clause (grep shows only `:62`, `:222` and `core.md:283`), or
     - make Q1 record the three counts in a form that is not the literal line.

## Should Fix

1. **Lead 1 rationale rests on the superseded premise.**
   - **Evidence.** Verdict bullet 1 justifies embedding with "The agent has `Write` but no `Edit`, and `cp` is not allow-listed". The corrected brief (lead 1) says `Bash(sed:*)`, `Bash(cat:*)` and `Bash(mkdir -p:*)` are allowed (`settings.autonomous.json:36-45`), so `sed -i` ticking and `cat`-based copying both work.
   - **Change.** Restate the reasons:
     - embedding costs no extra `Read`;
     - `sed -i` in-place ticking is technically possible but is rejected because it works around the deliberate tool-level read-only guarantee (`:10`: "Do not treat it as an oversight to work around");
     - the two checkpoints are chosen for cost (already argued in Risks), not because of tooling.
   - The conclusion stands. Only the stated cause is wrong.
2. **The "after" estimate for `## Common findings` + rubric contradicts its own keep-list.**
   - **Evidence.** Today the two sections total 530 + 477 = 1 007 words. The plan removes only the "doctrine-restatement sentences" (`:190` = 33 words, `:194` = 32 words, by `grep -o … | wc -w`) plus 23 redundant words. That leaves ≈ 920, not 760.
   - The other "after" figures (Resolved values 763 → 300, Pass 1 596 → 300) are judgement, not drafted or subtracted. Pass 1 keeps step 5 verbatim, and `:92` alone is 225 words.
   - **Change.** Show a subtraction per row, or raise the estimates. The constraint still holds: the report's own fallback of 6 175 − 1 482 + 520 = 5 213 < 6 175 is correct. Restate the headline −2 455 (−32 %) as a range.
3. **Template gaps against the definition.**
   - **Evidence and change.**
     - (a) No item for the return (`:221-224`): index path, folder path, finding count, the Pass 2 line, and `## Questions` / `## Unsolicited dispatch guidance` placement. Add an R-item for the return.
     - (b) No item for the test-run rule (`:145`): each fix suggestion must ask for no forbidden test run. Fold it into W2.
     - (c) W1 omits the `_(layer: …)_` tag resolved through `<layer_path_map>` and the ship-order sort (`:214`), and nothing covers sorting by impact within groups (`:147`). Add both to W1.
     - (d) Order: the template puts R3 (task prompt) before P1. `:81-90` runs the diff and segmentation first, then the task prompt (step 2), then Pass 0. Reorder, or state that order is free.
4. **X1 conflicts with the omit-entirely rule.**
   - **Evidence.** X1 says "or write `none`". `:202` says "Omit the section entirely when the dispatch carried nothing".
   - **Change.** Say that `none` goes in the report only and the return still omits the section.
5. **Lead 12 (evidence must not leak) is not addressed.**
   - **Evidence.** The template header carries `<date>`. `:208` tells the agent to `Write` with absolute paths, so pasted evidence is likely to carry absolute worktree paths into a committed file.
   - **Change.** Add a rule to the template instruction: evidence is repo-relative, with no home or worktree paths. Either drop `<date>` or argue that the index Context already carries a date (`:213`).
6. **The Read tree misses adjust-mode inputs.**
   - **Evidence.** On the adjust re-dispatch (`core.md:308`) the agent reads `<findings_file>`, the existing index and the existing finding files. None of these appears in the Read tree.
   - **Change.** Add them as adjust-only up-front rows (variable size).
7. **Leads 10 and 13 are not discussed explicitly.**
   - **Lead 10 (index collision).** Next-free `Glob work_report_*.md` inside a round-suffixed folder is collision-safe across rounds and adjusts. Say so.
   - **Lead 13.** `.claude/CLAUDE.md` names `context/conventions.md` and `harness-runs/lessons.md`, which is the same set as the definition (`:68`, `:71`). Say there is no conflict.
8. **Thinning of `## Output contract` contradicts itself.**
   - **Evidence.** The plan removes "`:219-226` restatements" and also keeps "return lines, `Pass 2 carried over …`" verbatim. Those return lines are `:221-222`, the only place the literal appears.
   - **Change.** List exactly which sentences of `:217-226` go.

## Nice to Have

1. Verdict sentence 2 ("gains the most from the idea of any reviewer studied so far") is an unsupported comparison. Cut it or cite the other reports.
2. `plan_orchestration_instructions_core.md` (cited at `:42`) is missing from the "named for context only" row.
3. P1's evidence (the exclusion count) already appears in the index Context paragraph (`:86`, `:213`), so it adds no new verifiability. Weight the goal (a) argument on P3, P4, P6 and P7 instead.
4. Open question 1 says the same `review_plan_file` staging covers architecture, parity and skeptic. Those reviews have PASS-writes-nothing paths (`autonomous_pause_and_ledger.md` A2g/C2g: "PASS with no findings, no file written"), so lead 8 applies to them. Qualify the claim.

## Bug claims

None. The report names no pre-existing bug. "Unused `<app_dir>` binding" is the definition's own admission (`:23`: "no step in this file consumes `<app_dir>`"), not a bug: CONFIRMED as stated, and harmless.
