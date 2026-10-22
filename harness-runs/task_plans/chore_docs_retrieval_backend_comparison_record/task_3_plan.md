### Task 3 — Correct the comparison's **Finding** paragraph, its lead and its trade-off, and mark every wall-clock figure as 1.3.1 before the fixes

**Goal:** Bring the rest of `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` up to date. The **Finding** paragraph should record a defect that has since been diagnosed and fixed. The section's lead should name every subsection the section holds. `### The trade-off, stated` should stop describing the lexical arm as carrying an open defect. Every wall-clock figure should carry, beside it, that it was taken on `pg_textsearch` 1.3.1 before the fixes. Every wall-clock value stays as recorded.

**Depends on:** Task 2, which rewrites item 3 of `### Divergence sources, in the order checked`. Item 3 now names mechanisms 1 and 2, cites `timescale/pg_textsearch#573` with its provenance, and states what shipped. This task's **Finding** paragraph cites item 3 for the mechanisms rather than repeating them, and uses the bare `timescale/pg_textsearch#573`, because the section's provenance sentence is Task 2's. This task also depends on Task 1, through Task 2, for `### A fresh fixture-catalog reading, both backends as shipped`, the subsection the lead must now cover. The three tasks edit the same file and run in order.

**Where this task stops.** These passages are not this task's:

- `### Which case this is` and items 3 and 4 are **Task 2's**. Their wording is not touched here.
- `docs/retrieval-eval.md` is **Task 4's**.
- The diagnosis section is **Task 5's**.

No recorded figure changes. That covers every latency, cold-start, memory and disk value, and the 2026-10-08 blocks.

### Targets

- `docs/retrieval-eval-results.md` → the section's **Who reads this, and what it decides.** lead; the **Finding — a defect, recorded and not acted on.** paragraph; `### Relevance, side by side`; `### Latency: the library call and the MCP round trip` → **When and where.**; `### Cold start`; `### The trade-off, stated`.

**Work:**

- [ ] **The lead.** It says *"The subsections up to `### Abstention, query by query` cover relevance."* Change the range so it covers `### A fresh fixture-catalog reading, both backends as shipped` as well. Add one clause: that subsection is a later, deterministic reading on both backends as shipped, and the rest of the section is the 2026-10-08 reading on 1.3.1. Name nothing else new.
- [ ] **The Finding paragraph.**
  - **The label.** Relabel the bold opener to **Finding — a defect, since diagnosed and fixed.** `git grep -n 'a defect, recorded and not acted on'` outside `harness-runs/` finds no citer but the paragraph itself, so the relabel strands nothing.
  - **The rewrite.** Keep the first sentence's substance as the record of what was found on 2026-10-08. Then state:
    - The dependence was diagnosed as two mechanisms (item 3; `## The BM25 index's state, measured`), mechanism 2 being `timescale/pg_textsearch#573`.
    - The question it left open, whether the TypeScript backend's persistent index carries the same dependence, was measured: it does, in the before readings of `### The candidate end-state rule, at refresh level`'s TypeScript tables.
    - Both backends now end every refresh that wrote anything, and the first build, in `REINDEX INDEX chunks_bm25`, on `fix_docs_retrieval_bm25_index_state_typescript` and `fix_docs_retrieval_bm25_index_state_python` (`### The recommendation for the fix branch` → **What shipped.**).
    - The "this branch fixes nothing / would decide" sentences become past tense, or are removed.
- [ ] **The wall-clock notes.** Beside each wall-clock figure, add one short sentence or clause saying it was taken on `pg_textsearch` 1.3.1 on 2026-10-08, before the BM25 fixes, and is left as recorded. Place one note per site:
  - **`### Relevance, side by side`.** In the paragraph above the tables, which already says the p50 and p95 are measured at different boundaries.
  - **`### Latency: the library call and the MCP round trip`.** In **When and where.**
  - **`### Cold start`.** In its opening paragraph.
  - **`### The trade-off, stated`.** In the sentences quoting latency and cold start.

  No figure is re-taken or re-stated with a new value.
- [ ] **The trade-off's defect clause.** Replace *"and the lexical arm carries the database-history defect recorded above"* with a clause saying the lexical arm's divergence on 2026-10-08 came from the index-state defect, since fixed on both backends (**Finding — a defect, since diagnosed and fixed.**). Leave the quoted verdict *"They disagree, and the reason is not yet identified."* and every other sentence's figures as they are.

**Verification:**

- `git diff --stat` lists only `docs/retrieval-eval-results.md`.
- No hunk of `git diff -U0 -- docs/retrieval-eval-results.md` falls inside `### Which case this is`, `### Divergence sources, in the order checked`, `### A fresh fixture-catalog reading, both backends as shipped`, or any `eval:corpus:*` block.
- `git grep -nE "database-history|held before|recorded and not acted on" -- docs/retrieval-eval-results.md` prints no line inside `## The Python backend against the TypeScript one`, except the unrelated agent-session sentence *"The failed first attempt is a finding, recorded and not acted on."*, which stays.
- `git grep -n '1.3.1' -- docs/retrieval-eval-results.md` prints a line inside each of `### Relevance, side by side`, `### Latency: the library call and the MCP round trip`, `### Cold start` and `### The trade-off, stated`.
- Every numeric value in the edited subsections is unchanged. `git diff -U0 -- docs/retrieval-eval-results.md`'s removed lines carry no number that is missing from its added lines.

- **Deviations from plan:** The second **Verification:** bullet forbids any hunk inside `### Divergence sources, in the order checked`, but the **Finding** paragraph this task targets sits under that heading, after item 4 and before `### Vector agreement, and the embedder id`. Its hunk (`git diff -U0` → `@@ -27870,6 +27873,10 @@`) therefore falls in that subsection's range. Items 1 to 4 are untouched; every other hunk lies outside the four named ranges and outside every `eval:corpus:*` block. The **Finding** paragraph's first sentence was reworded to *"depend on the database's earlier contents"* so the third bullet's `held before` probe prints nothing in the section; its substance and its 2026-10-08 dating are kept. The *"That branch would decide whether a refresh should rebuild the BM25 index or the eval should index into an empty database"* sentence was removed rather than put in the past tense, since **What shipped.** now answers it.
