### 10. The write-up calls the TypeScript side's vectors "stored", though they were embedded in session

**File:** `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Vector agreement, and the embedder id`, the opening sentence "The figures are the cosines between the two embedders' **stored document vectors**, per chunk key"; and `### Divergence sources, in the order checked`, item 1, the **Embedder.** bullet "Measured by the cosine between the two sides' stored document vectors per chunk key"

**Problem.** Only the Python vectors were read back from an index (`psql` over the compose database). `evals/docs-retrieval/vector-agreement.mjs` → `typescriptVectors` embeds the TypeScript side in session, from the same `chunk.text` and in the same `EMBED_BATCH_SIZE` batches a cold refresh uses. That is what the module's header says. No TypeScript index was read. Two sentences of the document of record say both sides were "stored". A reader weighing the embedder-id decision would take the TypeScript figures as read-back figures. That is not what was measured (`.claude/context/conventions.md` → `## Documents of record`: a measured fact states what was measured).

**Fix.** In `docs/retrieval-eval-results.md`:

- [ ] In `### Vector agreement, and the embedder id`, replace "The figures are the cosines between the two embedders' **stored document vectors**, per chunk key, from `renderVectorAgreement`." with: "The figures are the cosines between the two embedders' **document vectors**, per chunk key, from `renderVectorAgreement`: the Python side's read back from its index, the TypeScript side's embedded in the same session from the same chunk text and in the same batches a cold refresh embeds them."
- [ ] In `### Divergence sources, in the order checked`, item 1, **Embedder.** bullet, replace "the cosine between the two sides' stored document vectors per chunk key" with "the cosine between the two sides' document vectors per chunk key".

Change no figure. Documentation only, so no test runs.
