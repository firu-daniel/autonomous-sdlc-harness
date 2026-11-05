# RAG extraction research — review brief

You review ONE research file in `docs/rag-extraction-research/`, written under [`_brief.md`](_brief.md) (read the brief first). Read-only on everything except your own output file, `docs/rag-extraction-research/reviews/<same file name>`. Do not commit.

## Check, in this order

1. **Citations to this repository.** Spot-check at least 12 `path:line` / `path → ## heading` / symbol-name claims against the source. Flag any that are wrong, stale or misrepresent the text.
2. **Web claims.** Spot-check at least 8 web claims by fetching the cited URL (or searching when the URL fails). Flag wrong facts, dead or misattributed links, outdated information, and secondary sources presented as primary.
3. **Statement kinds.** Is each claim honestly labelled Documented / Inference / Unconfirmed? Flag inferences dressed as facts.
4. **Completeness.** What material option, system, risk or code path is missing that would change the fork verdict? Search for it yourself before flagging it, and name what you found.
5. **Fit to the framing.** The target is a plug-in docs RAG for large documentation, not the harness. Flag sections that drift into harness re-use beyond what bears on the seam, and gaps on the minimal-setup, remote-source and remote-Postgres requirements.
6. **Verdict.** Does the evidence support the fork verdict? Is anything missing that would change it?
7. **Brief compliance.** Fixed opening, `## Open questions`, `## Fork verdict`, length roughly 2 000 – 4 000 words.

## Output format (`docs/rag-extraction-research/reviews/<file>`)

```
# Review — <file>
verdict: PASS | FAIL        (FAIL if any Must Fix)
## Must Fix      (wrong facts, broken citations, unsupported verdict, a missing option that changes the verdict)
## Should Fix    (weak grounding, mislabelled statement kinds, gaps)
## Nice to Have
```

Each finding: one line of claim, the evidence (`path:line`, URL, command + output), and the concrete change to make. Be terse. No praise.
