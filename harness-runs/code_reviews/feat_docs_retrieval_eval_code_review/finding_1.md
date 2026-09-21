### 1. The eval's strongest result — the shipped default mode is the worst-scoring arm on both corpora — is in the data and in no document of record

**Site.** `docs/retrieval-eval-results.md` → the hand-written sections below `<!-- eval:generated:end -->` (`## Threshold calibration`, `## Cold build and index size`, `## The query-log pass`, `## Arm A — awaiting a hand run`) — the place a measured conclusion over these figures belongs; and `docs/retrieval-eval.md` → `## The decision rule`, which frames the comparison as *"arm E against arm A"* and nothing else.

**The problem.** The generated region this branch ships records, on both committed corpora, that arm E — `fused-rerank`, the **shipped default** of `docs search` and the only mode the MCP server can use (`cli/src/retrieval/server.ts` hardcodes it) — scores below arm D, `fused`, on every relevance column, at two orders of magnitude more latency:

| Corpus | Arm | recall@1 | recall@3 | recall@5 | MRR | p50 ms |
|---|---|---|---|---|---|---|
| `fixture-catalog` | D `fused` | 0.556 | 1.000 | 1.000 | 0.759 | 5.9 |
| `fixture-catalog` | E `fused-rerank` | 0.444 | 0.667 | 0.667 | 0.556 | 652.4 |
| `self-docs` | D `fused` | 0.533 | 0.800 | 0.867 | 0.650 | 9.8 |
| `self-docs` | E `fused-rerank` | 0.400 | 0.600 | 0.600 | 0.500 | 1145.3 |

The per-query records in the same fences say what the deficit is made of, and the two corpora answer differently:

- On `fixture-catalog`, **all three** of E's missed positives are abstentions: `q-fc-billable-weight`, `q-fc-surcharge-compounding`, `q-fc-verify-callback`. D returns a relevant hit for each. So on this corpus the whole gap is the abstention policy, not the ranking.
- On `self-docs`, E misses six positives, of which **two** are abstentions (`q-sd-new-config-key`, `q-sd-run-gates`) and **four** are demotions — `q-sd-deny-guard`, `q-sd-usage-limit`, `q-sd-retrieval-network`, `q-sd-analyze-writes`. D misses only `q-sd-deny-guard` and `q-sd-retrieval-network`, so the cross-encoder pushed `q-sd-usage-limit` and `q-sd-analyze-writes` out of the top five that fusion alone had in it.

E does clear the failure bar the decision rule names: it abstains on every negative query, 3 of 3 and 5 of 5, where B, C and D abstain on none.

Nothing in the branch's prose says any of this. The results file's hand-written sections cover the threshold, the cold build, the query-log pass and arm A; `docs/retrieval-eval.md` → `## The decision rule` compares E to A alone; `docs/retrieval.md` → `## Measured, and how` item (d) cites the region without reading it. A maintainer who opens the file of record to decide the roadmap row's fate — which is who that file names as its reader — is shown a table and is told the arms' *scores* are not comparable across rows, which is true and is not this: recall and MRR are comparable across rows, the file says so, and across rows they say the default mode loses. The branch exists to measure retrieval, and this is the one measured fact it produced that would change what a reader does with the tool.

**The fix.** Add one hand-written section to `docs/retrieval-eval-results.md`, **below** `<!-- eval:generated:end -->` (hand-written territory the runner never rewrites), immediately after `## Threshold calibration`, stating the comparison as a measurement and not as a recommendation. It needs nothing that is not already in the file:

- [ ] The D-versus-E table above, with both corpus stamps beside it (`{ files: 9, chunks: 41 }` and `{ files: 13, chunks: 177 }`), taken from the generated region rather than retyped from here.
- [ ] The decomposition: on `fixture-catalog` every one of E's three missed positives is an abstention; on `self-docs` two of six are abstentions and four are demotions, naming the four query ids.
- [ ] The one column E wins: abstention on negatives, 3 of 3 and 5 of 5 against none for B, C and D — so the comparison is a trade and the section says which way.
- [ ] What it does not settle, in the same terms `## The limit on this calibration` already uses: two fixture-sized corpora, one host, one repetition per query, and `docs/development.md` §5 gate 10's real-catalog hand run as the step that would confirm or overturn it.

Then one cross-reference each, so the fact is reachable from the two documents that point at this file: a clause in `docs/retrieval-eval.md` → `## The decision rule` noting that the recorded figures also bear on **which mode** is the default and pointing at the new section, and a fourth bullet in `docs/retrieval.md` → `## Measured, and how` item (d)'s citation list naming it.

**Not part of this fix, and deliberately:** whether `docs search`'s default mode or the server's hardcoded mode should change, and whether the abstention policy should extend to `fused`. Those are decisions nobody in this loop owns; they are raised in the review's `## Questions` section. Recording the measurement is what this finding asks for.
