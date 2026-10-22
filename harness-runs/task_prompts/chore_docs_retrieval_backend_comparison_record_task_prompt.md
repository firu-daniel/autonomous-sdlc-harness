`chore_docs_retrieval_backend_comparison_record` corrects the docs-retrieval backend comparison's record to what the BM25 diagnosis measured and the two fixes shipped. It takes one fresh TypeScript-against-Python parity reading on `fixture-catalog`, as both backends now ship.

**It follows `fix_docs_retrieval_bm25_index_state_python`, which has merged.** If either fix branch already corrected one of the passages below, leave it and say so. Before planning, read all of `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured`, including the subsections the upgrade and fix branches added.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

---

## What the record says, and what the diagnosis found

`## The Python backend against the TypeScript one` was written before the diagnosis. Three of its readings are now known to be partial.

- **Which score its figures read.** Every BM25 figure taken before the diagnosis's probe read the `<@>` operator. The diagnosis's `### How the probe reads a score, and the setup` states this: a bare `BM25_ORDER_CLAUSE` column projects the operator. The store ranks by the index scan's own score, `bm25_get_current_score()`. In a memtable state the two differ: this is mechanism 2.
- **Why the backends differ.** The comparison attributes the Python backend's divergence to its lexical scores depending on what the database held before. The passages are the paragraph **Finding — a defect, recorded and not acted on.** and `### Divergence sources, in the order checked` item 3.
  - The diagnosis found two mechanisms. Mechanism 1 is dead rows that stay in the statistics. Mechanism 2 is exact lengths in the memtable against quantized ones in segments.
  - It also found that the Python store's own fresh build varies between runs: 116 against 276 memtable rows on `self-docs` (`### The candidate end-state rule, at refresh level`).
  - On `fixture-catalog`, the near-tie inversions are mechanism 2 (`### The near-tie ordering on an empty database`).
- **Which version, and which end state.** The comparison ran on `pg_textsearch` 1.3.1. `chore_docs_retrieval_pg_textsearch_upgrade` moved both engines to 1.5.1. The two fix branches made every refresh that changed something, and the first build, end in `REINDEX INDEX chunks_bm25` on both backends.

**Mechanism 2 is reported upstream as `timescale/pg_textsearch#573`.** The maintainer filed it after the diagnosis, and it is still present in 1.5.1. The record does not cite it anywhere yet. This prompt is the source for that number: cite it as a maintainer-filed upstream report, not as something this branch read.

## Why the old figures are not re-taken against themselves

The four `eval:corpus:*@typescript` / `eval:corpus:*@python` blocks were taken on 2026-10-08. A figure re-taken now differs from them through three causes at once:

- the 1.5.1 upgrade;
- the route-2 fix on **both** backends (the TypeScript side's `fixture-catalog` arm B and D figures moved too);
- on `self-docs`, a corpus stamp that no longer matches (`{ files: 20, chunks: 331 }` in the blocks).

An old → new delta would attribute none of them. So this branch takes no before/after pair. The four blocks stay exactly as recorded, as the 2026-10-08 reading on 1.3.1.

## The goal

1. **Correct these passages** to what the diagnosis measured and the fixes shipped, citing the subsections that hold each figure rather than restating them:
   - `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one`: the paragraph opening **Finding — a defect, recorded and not acted on.**, `### Divergence sources, in the order checked` item 3 and item 4's **Arms D and E**, and `### Which case this is`.
   - `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`, step 3's paragraph on the persistent compose database.
   - Cite `timescale/pg_textsearch#573` wherever mechanism 2 is named as the cause, in the comparison section and in the diagnosis section.
2. **Take one fresh parity reading on `fixture-catalog` only,** on both backends as shipped. It answers one question: now that both backends end in the `REINDEX` state, does arm B agree between them, so that only quantization separates the two?
   - Use the existing routes. Run the launcher of `docs/retrieval-eval.md` with `--backend typescript` and `--backend python`, each `--out` into a scratch file. Then run `backend-comparison.mjs` → `compareBackends` / `renderBackendComparison` over that scratch file, not over the committed document.
   - Record it as a new subsection of `## The Python backend against the TypeScript one`, standing on its own. Do not compare it value for value with the 2026-10-08 blocks, and do not write it into the generated region.
   - Report its per-query agreement and its deterministic figures only. Its latencies were taken in a session, so leave them out.
   - Let `### Which case this is` and the divergence sources say what this reading shows. Any difference that remains unexplained stays named as unexplained.
3. **Leave every wall-clock figure as recorded,** and say beside it that it was taken on 1.3.1 before the fixes.
4. **Tidy the diagnosis section's own prose,** found at its review:
   - Its lead paragraph, **Who reads this, and what it decides.**, does not list every subsection the section now holds. It is missing at least `### The near-tie ordering on an empty database`, `### The deciding figures on pg_textsearch 1.5.1` and `### The recommendation for the fix branch`.
   - In `### The stray index-scan score`, **The runs.** says every run was taken with `--capture`. The text below it records that Postgres `self-docs` run 1 wrote no capture.
   - The same lead paragraph says the `pg_textsearch` source paths and issue numbers were not re-read. Keep that true and exact. `#573` is the one issue number that is not a task-prompt lead, so state its provenance separately.

## Constraints

- **No relevance retuning.** Do not change the abstention threshold, the floor, `k` or any fusion weight.
- **No shipped-code change.** This branch corrects records and takes one deterministic reading only.
- **The generated region is not touched.** No `eval:corpus:*` block is written, moved or regenerated, and `evals/docs-retrieval/floor.json` is not changed.
- Every new figure sits beside the command and setup that produced it, with the engine versions read as the fix branches read them.
- Wall-clock figures come only from an operator's hand run on an idle machine (`harness-runs/lessons.md` → `## Evidence and measurement`). This branch takes none.
- The work needs Docker with the compose `postgres` service up, the Python weight cache, and this checkout's synced Python environment (`bash scripts/python-service.sh sync --with-models`). If any of them is missing, stop and say so.
