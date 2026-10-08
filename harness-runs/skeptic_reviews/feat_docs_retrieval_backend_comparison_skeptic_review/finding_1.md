### 1. A `@python` block records the TypeScript abstention threshold as the one "in force", and the comparison's threshold check never reaches the Python server

**Severity:** Should Fix. **Layer:** general.

**Site.**

- `evals/docs-retrieval/results.mjs` → `provenanceSection`, the element `` `- Abstention threshold in force: \`${ABSTAIN_SCORE_THRESHOLD}\`, read off the \`search.js\` this run loaded.` `` (around line 241), and `machineSection` → `abstainScoreThreshold: ABSTAIN_SCORE_THRESHOLD`. The value comes from `import { ABSTAIN_SCORE_THRESHOLD } from '../../cli/dist/retrieval/search.js'`, whatever the block's backend.
- `evals/docs-retrieval/backend-comparison.mjs` → the module header sentence "A pair whose `snapshot`, `k`, `repeat` or `abstainScoreThreshold` differ is refused by name, quoting both values.", and `assertPair`'s `for (const field of ['k', 'repeat', 'abstainScoreThreshold'])`.
- `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Abstention, query by query`, the sentence "Neither corpus has an entry whose abstention disagrees with that threshold on either side."

**Problem.** The Python server applies its own threshold, `docs-retrieval-service/src/harness_docs_retrieval/search.py` → `ABSTAIN_SCORE_THRESHOLD` (`if best < ABSTAIN_SCORE_THRESHOLD:` in `search_docs`). The eval never reads that value: `/health` exposes only the two model ids, and `POST /search` returns `abstained` and `best_rerank_score`, not the threshold. But `results.mjs` renders every block's threshold from the TypeScript `search.js`. So each committed `@python` block says, for example, in `eval:corpus:fixture-catalog@python`:

> - Abstention threshold in force: `0.32`, read off the `search.js` this run loaded.

and carries `"abstainScoreThreshold": 0.32` in its machine half. That line is false for a Python block. `search.js` is not what the Python server runs, so the value is not the one "in force" for those figures.

That has two effects:

1. `backend-comparison.mjs` → `assertPair` compares `abstainScoreThreshold` between the `@typescript` and `@python` blocks. Both sides were read from the same TypeScript constant, so the comparison can never differ. The header's promise that a threshold mismatch is "refused by name" does nothing for the one pair this module exists to compare. If `search.py`'s value drifted from `search.ts`'s, both blocks would still record `0.32`. Nothing would be refused, and the provenance would still name `0.32` as the Python run's threshold.
2. The real check on the Python side is `compareAbstention`'s `inconsistent` list. It tests each side's `abstained` against `bestRerankScore < threshold`, using the recorded value. That list is the measurement behind task prompt item 4's *"At the calibrated threshold … the set of queries the Python backend abstains on"*. Neither the module nor the write-up says so.

**Who reaches the wrong answer.** A maintainer reading the `@python` blocks or `### Abstention, query by query`. They take the Python block's `0.32` as the Python server's configured threshold, verified by the pair check. In fact it was never read from the Python side. What the record actually shows is narrower: the Python abstentions are consistent with `0.32` on these queries. No decision turns on this today, because `search.py` and `search.ts` both hold `0.32`, so this is Should Fix rather than Must Fix.

**Proof.**

- `git grep -n "Abstention threshold in force" evals/docs-retrieval/results.mjs` finds the one unconditional line in `provenanceSection`. No branch on `corpus.backend` precedes it.
- `docs/retrieval-eval-results.md`, block `eval:corpus:fixture-catalog@python`, carries the line quoted above and `"abstainScoreThreshold": 0.32`.
- `docs-retrieval-service/src/harness_docs_retrieval/http_app.py` → `create_app`: `/health` returns `status`, `embedder`, `reranker`. `/search` returns `text`, `mode`, `abstained`, `best_rerank_score`, `hits`, `notes`, `search_ms`. No threshold.

**Fix.** Change no figure, and do not hand-edit the generated region. The committed `@python` blocks keep their rendered line until the next `--out` run re-renders them.

- [ ] `evals/docs-retrieval/results.mjs` → `provenanceSection`: replace the single element

  ```js
      `- Abstention threshold in force: \`${ABSTAIN_SCORE_THRESHOLD}\`, read off the \`search.js\` this run loaded.`,
  ```

  with

  ```js
      ...(corpus.backend === 'python'
        ? [
            `- Abstention threshold recorded: \`${ABSTAIN_SCORE_THRESHOLD}\`, read off the \`search.js\` this run loaded. The`,
            "  Python server applies its own `docs-retrieval-service/src/harness_docs_retrieval/search.py` →",
            '  `ABSTAIN_SCORE_THRESHOLD`, which this run does not read.',
          ]
        : [`- Abstention threshold in force: \`${ABSTAIN_SCORE_THRESHOLD}\`, read off the \`search.js\` this run loaded.`]),
  ```

  The unlabelled block and a `@typescript` block render byte for byte as before.

- [ ] `evals/docs-retrieval/backend-comparison.mjs` → module header: directly after the sentence "A pair whose `snapshot`, `k`, `repeat` or `abstainScoreThreshold` differ is refused by name, quoting both values.", add:

  > A `@python` block's `abstainScoreThreshold` is the TypeScript `search.js` constant `evals/docs-retrieval/results.mjs` renders, not the Python server's, so that field's equality does not test the Python side; {@link compareAbstention}'s `inconsistent` list, which tests each side's abstentions against the recorded value, does.

  Change no code in this module.

- [ ] `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Abstention, query by query`: directly after the sentence "Neither corpus has an entry whose abstention disagrees with that threshold on either side.", add:

  > The Python blocks record the value read off the TypeScript `search.js`, not the Python server's own `docs-retrieval-service/src/harness_docs_retrieval/search.py` → `ABSTAIN_SCORE_THRESHOLD`, which no endpoint exposes. So that no Python entry disagrees with it is the evidence that the server's abstentions are consistent with `0.32` on these queries.

No test file covers these modules, so no test runs. The full gate set runs later, in the Run gates phase.
