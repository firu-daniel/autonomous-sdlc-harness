### 6. Empty `##` wrapper sections become their own chunks

**Site anchor.** `cli/src/retrieval/chunk.ts` → `chunkMarkdown`, its closing `for` loop over `sections` — specifically the unconditional final `chunks.push(makeChunk(path, section.anchor, section.heading, headingPath, resolvedTitle, joinBody(section.lines)));`. Contrast the preamble branch a few lines above it, which **is** guarded: `if (body !== '') chunks.push(makeChunk(path, undefined, '', resolvedTitle, resolvedTitle, body));`. Lines 155–167 today, a navigation hint only.

**Problem.** Every `##` and `###` section becomes a chunk whether or not it has a body. The preamble is the one case that already skips an empty body; a heading section is not.

In a real catalog this is not an edge case. A `##` heading used as a **wrapper** — one that carries no prose of its own and exists only to group its `###` children — is a normal documentation shape, and in a catalog written to a house template it is the dominant one. `## How it works` in `expause_web/docs/concepts/image-caching-storage.md` is one such heading, and that heading together with `## What it is & why` appears in most documents of that catalog. So a real corpus carries on the order of a hundred rows whose entire embedded text is `<title>\n<title> > ## How it works\n\n` — near-identical to one another, near-empty, and all competing for generic query terms. They dilute both arms: the BM25 arm because a near-empty document scores high on the few terms it does carry, and the vector arm because a hundred near-identical vectors crowd the top-`k` for any query near the wrapper's wording. `ARM_CANDIDATES = 50` per arm is a fixed budget, and these rows spend it.

**Fix.**

- [ ] **Emit no row for an empty `##` section that has at least one `###` child.** "Empty" means `joinBody(section.lines)` is `''` — the same emptiness test the preamble branch already uses, so the two cases agree. "Has a `###` child" means the next section in document order is a level-3 section (equivalently: at least one level-3 section follows before the next level-2 one).

  Nothing is lost by folding it. `makeChunk`'s heading path already spells the parent into every child — a child chunk's text opens `<title>\n<title> > ## How it works > ### 1. …` — so the wrapper's words remain searchable through each child, while the wrapper stops being a hit on its own.

- [ ] **A section with a body keeps today's behaviour exactly.** A `##` section with prose of its own is emitted whether or not it has `###` children, unchanged. This fix touches the empty case only.

- [ ] **State a decision, with its reason, for the remaining case: an empty section with no child at all.** The user asked for a decision to be made and written down, not for a particular one. Both are defensible and either is acceptable if the reason is recorded:
  - *Skip it too* — it carries no text at all, so it can never be a useful hit, and it is the same near-empty-row problem in a smaller population. Consistent with the preamble branch.
  - *Keep it* — it is a real heading a reader can navigate to, and unlike the wrapper case its words survive nowhere else in the index, so skipping it makes that heading unfindable.

  Write the decision and its reason as a comment at the emission site in `chunk.ts`, and reflect it in the `chunkMarkdown` doc comment, which today states `only `##` and `###` start a chunk` — that sentence becomes inaccurate the moment the first skip lands and must be amended in the same change.

- [ ] **Update `docs/retrieval.md` → `## How it fits together` → the `**Chunking.**` paragraph.** It currently says `chunkMarkdown` starts a chunk at every `## ` and `### ` line outside a fence; a `###` section is its own chunk. Add the skip rule and the decision above, in one sentence each.

- [ ] **Tests.** Extend the chunking cases in `cli/test/docs-retrieval.test.mjs`: a document with an empty `##` wrapper over two `###` children yields chunks for the two children and none for the wrapper, and each child's text carries the wrapper's heading in its heading path; a `##` section with a body and `###` children yields a chunk for the section and for each child, exactly as today; and a case covering whichever answer the decision above takes for an empty section with no child.

- [ ] **Watch the refresh path.** A chunk's identity is `path#anchor` and `refreshIndex` deletes stored keys the corpus no longer has, so an existing on-disk index built before this change drops its wrapper rows on the next refresh with no rebuild and no migration. Confirm that in the refresh test rather than assuming it — this is the behaviour that makes the change safe to ship without an index version bump.
