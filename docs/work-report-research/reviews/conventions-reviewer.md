# Review — conventions-reviewer
verdict: FAIL

## Must Fix

1. **The claim that the reviewer "never uses" the writer's other sections is wrong, so the narrowed read is unsafe as specified.** The report says the reviewer never uses `## House rules` and the other non-graded sections (`conventions-reviewer.md` report, `## Prose classification`, last paragraph). But `plugin/agents/conventions-writer.md` → `## House rules` is the writer-side text of three reviewer checks:
   - `:166` lists every line-number shape that is banned ("with a colon, with a tilde, in parentheses, as a bare range, as a `(line NNN)` word form, or as a slash-joined run of tails"). Reviewer check (8) (`plugin/agents/conventions-reviewer.md:102`) names no shapes, so it depends on this list.
   - `:168` is the repo-relative path rule that check (14) grades (`:111`).
   - `:170` is the `.claude/**` / `qa_test_scenarios.md` write ban that check (15) grades (`:112`).

   `## The fix dispatch` (`:136`, `:138`) also carries the bounded-merge correction and the corpus-declined literal duty, which false positive (b) and check (11) mirror. `:15` reads the writer file so that "writer and reviewer cannot disagree". Dropping `## House rules` reopens exactly that disagreement on checks 8, 14 and 15.
   **Change:** narrow the read to `## Scope` + `## The document` + `## House rules`: 243 + 1 906 + 252 = **2 401**, delta −2 707 rather than −2 959. Either add `## The fix dispatch` as well (237; 2 638 words read, delta −2 470), or state why (b) carries it inline. Correct the ledger to match. The constraint still holds.

2. **The narrowing conflicts with the sibling report, and the conflict is not noticed.** `docs/work-report-research/conventions-writer.md` assumes the reviewer keeps reading the writer file whole. It says "Unchanged. Its up-front load also falls by ≈1 190, because it reads the writer's definition whole" (sibling `## Thinning plan`, row 3), and keeps REFERENCE prose in place "because `conventions-reviewer` grades against this file whole" (sibling `## Verdict`). The sibling also moves writer ACTION sentences into a template embedded at the end of the writer's `## Output contract`, which is outside this report's two-section read. Its W-items cover the `prior_*` quoting, unfilled-marker removal and census tests. If both plans land, any rule that becomes template-only in the writer disappears from the reviewer's grading view.
   **Change:** add a `## Risks and costs` row and an open question stating the dependency. Either the narrowed sections must remain the sole home of every graded rule (the writer template may only point into them), or the narrowing waits for a joint writer/reviewer thinning (sibling open question 3). Do not present the two savings as independent: −2 959 here and −1 190 in the sibling overlap on the same file.

## Should Fix

1. **The "after" estimate for the definition is internally inconsistent.** `## Thinning plan` cuts ACTION from 1 110 to about 300 words, yet `## Draft work report template` → **Mode handling** says "The checks those items name stay as numbered prose in the definition". The D/K items say only "Run checks 4–8" and similar, and each check's "Concrete correction" text is content the agent copies into its findings; the template cannot carry it. If the check prose stays, ACTION stays near 1 110, and the definition comes to ≈ 3 583 − 300 + 1 110 + 362 ≈ **4 755**, not ~3 940. No draft was written. **Change:** either show which ACTION words leave (and where each correction lives), or use ≈4 750. The fixed total becomes ≈ 4 755 + 2 401 + 1 320 ≈ 8 476, against 12 321 before. The constraint holds by about 3 850, not 4 900.

2. **The inline field has no reader, and the decision record the report itself cites argues against that.** `docs/analyze.md:217` (d2) rejects a findings file partly because "nothing downstream reads it". Step 6 is built field by field from named returns (`plugin/commands/harness-analyze.md:539-571`), and it consumes nothing from the reviewer except `findings:`. Even the reviewer's existing `summary:` has no consumer: the unfilled-member exclusion is reported from the caller's own record (`:594`), not from `summary:`. A `work_report:` with no step-6 consumer adds 150–400 words per dispatch to the main session's context, which `docs/analyze.md` §11 names as the cost the delegation avoids, and it buys nothing beyond the transcript. **Change:** resolve open question 2 inside the verdict. Either name the step-6 consumer and its cost (the caller sentence then exceeds the ~35 words estimated), or recommend the **embedded checklist with no emitted field**, which serves goal (b) and costs only the template words. Compare both options explicitly.

3. **The "biggest" risk is overstated, and the proposed caller sentence is mostly redundant.** The caller already extracts the named field: "Take the reviewer's `findings:` return" (`harness-analyze.md:365`) and "Take its `findings:` and group them by the `document_path` each names" (`:458`). The `work_report:` field sits after one-line `summary:`, so the `findings:` block stays bounded on both axes (`conventions-reviewer.md:168-175`). The residual hazard is different, and the report does not name it: the template's own section labels `pass: document` / `pass: corpus` are spelled as **dispatch field lines**, inside a return the caller reads by field name. **Change:** downgrade the risk to "low, LLM-parsed boundary". Rename the template's section labels to non-field text (e.g. `[document axis]`). Reword the caller change to "step 6 does X with `work_report:`" rather than "forward `findings:` only", which is already the text.

4. **Lead-1 premise.** `## Draft work report template` says the template is not a file to copy "since there is no tool to copy or write one". The agent has `Bash` (`conventions-reviewer.md:4`), and `cat`/`sed` redirection would write. `harness-analyze` is also a supervised session, so `cli/templates/claude/settings.autonomous.json` does not govern it. The real reasons are the ones the report gives in `## Storage and lifecycle`: the read-only guarantee (`:13`, `.claude/context/plugin.md` → `## Frontmatter`) and the lack of a committer (`docs/analyze.md:217`). **Change:** replace the clause with those reasons.

5. **Several caller citations are off.**

   | Report says | Source has it at |
   |---|---|
   | `harness-analyze.md:362` (fix forwards `findings`) | `:365-368` |
   | `:370-374` (closed block) | `:374-379` |
   | `:474` (Iteration 2) | `:476` |

   **Change:** correct all three.

6. **Template gaps.** There is no item for check (3)'s non-grep sub-rules: a source cannot establish history or intent, the build-output rule, and greenfield `proposed` (`:94-97`). D3 says only "grep the asserted construct". **Change:** add "(ref: check 3)" to D3, or widen its description.

## Nice to Have

1. Read tree: the `.claude/CLAUDE.md` 1 320 is the raw template with `{{routingRows}}` unrendered. Say it is a lower bound for an adopter copy, as the report already does for this repository's 1 695.
2. Lead 13: the generated routing row comes from `cli/src/generators/claudeContext.ts:470`. Cite that as the source to change (open question 4) rather than the rendered file.
3. Verified, no change needed:
   - All `wc -w` figures match: 5 893, 5 108, 1 320, 1 695, 2 647, 5 864, 4 174, 10 788, 52 247.
   - All ten section totals of the definition and all eight writer section totals (243, 1 906, 2 959 rest) match.
   - The template is 362 words.
   - The arithmetic 83 + 950 + 2 250 + 300 = 3 583 holds.
   - There is no match for `conventions-reviewer`/`demand_set`/`corpus_documents` in `cli/test`, `cli/templates/scripts` or `plugin/hooks`.
   - `dispatch_discipline_instructions.md:70` is correct.
   - The report is about 2 450 words excluding the template, and all fixed headings are present.

## Bug claims

The report names no pre-existing bug. Its lead-13 "read-list conflict" (`.claude/CLAUDE.md` routing row "Any implementation, review or planning" vs. `conventions-reviewer.md:34`) is **UNCLEAR as a defect**. The row is real (`.claude/CLAUDE.md:40`; generator `cli/src/generators/claudeContext.ts:470`). But `:34` scopes the reviewer's ban to resolving *values*, not to reading. On the `conventions` target that file is the document under review anyway, and when it is an unfilled skeleton `:59` already neutralises it. It is an extra-read cost, not a wrong-grade bug.
