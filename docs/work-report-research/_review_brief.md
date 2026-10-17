# Work-report research — review brief

You review ONE research report, `docs/work-report-research/<agent>.md`, written under `docs/work-report-research/_brief.md` (read the brief first). Read-only on everything except your own output file: `docs/work-report-research/reviews/<agent>.md` (`mkdir -p` the folder). Do not commit.

## Check, in this order

1. **Counts.** Re-run `wc -w` for every file in the report's Read tree and every "today" figure in its Word-count ledger. Flag any mismatch over 5 %. Check the arithmetic of totals and deltas.
2. **"After" estimates.** Are they grounded (a draft was written and counted, or a section-by-section subtraction is shown) or guessed? Does the hard constraint (up-front total after < before, template included) really hold? Is the saving attributed honestly (thinning vs. the report mechanism)?
3. **Citations.** Spot-check at least 10 `path:line` / `path → ## heading` claims against the source. Flag any that are wrong or that misrepresent the text.
4. **Read tree completeness.** Grep the agent definition for files it is told to read (`${CLAUDE_PLUGIN_ROOT}`, `<repo_root>`, `context/`, `samples/`, `lessons.md`, `CLAUDE.md`, sibling agents). Anything missing or misclassified up-front vs. on-demand?
5. **Template quality.** Titles ≤ 8 words, descriptions ≤ 25 words, imperative. One item per real step of the agent's actual procedure; no missing mandatory step (compare against the agent definition section by section); no item that paraphrases a wire literal. Branches/modes handled. Evidence items present where goal (a) depends on them.
6. **Wire contracts.** Does the thinning plan move, cut or paraphrase anything a caller, script (`cli/templates/scripts/`, `plugin/hooks/`), test (`cli/test/`) or another plugin file quotes literally? Grep for the literals it proposes touching.
7. **Storage / lifecycle claims.** Verify the claims about `tools:` frontmatter, PASS-writes-nothing contracts, which commit stages which path, and the proposed storage key against the callers in `plugin/instructions/` and `plugin/commands/`.
8. **Claimed pre-existing bugs.** For each "existing bug" the report names, reproduce the reasoning from the source and mark it CONFIRMED / REFUTED / UNCLEAR with citations.
9. **Verdict.** Does the evidence support it? Is anything material missing that would change it? Is the report honest about goal (a) and about where the savings come from?
10. **Brief compliance.** Fixed headings present; length roughly 1 500–3 000 words (template excluded).

## Output format (`docs/work-report-research/reviews/<agent>.md`)

```
# Review — <agent>
verdict: PASS | FAIL        (FAIL if any Must Fix)
## Must Fix      (wrong facts, wrong counts >5 %, broken constraint math, missed wire contract, unsupported verdict)
## Should Fix    (weak grounding, template gaps, missing risks)
## Nice to Have
## Bug claims    (each: CONFIRMED / REFUTED / UNCLEAR + evidence)
```

Each finding: one line of claim, the evidence (`path:line`, command + output), and the concrete change to make in the report. Be terse. No praise.

Reply with: verdict, Must Fix count, Should Fix count, and the most important finding in one line.
