### Task 2 — Correct `### Which case this is` and divergence sources 3 and 4 to the diagnosis's mechanisms and the fresh reading, citing `#573`

**Goal:** Make the passages that explain *why* the backends differ say what the BM25 diagnosis measured, what the two fixes shipped, and what Task 1's fresh reading shows. They are `### Which case this is`, and in `### Divergence sources, in the order checked`, item 3 and item 4's **Arms D and E**, all in `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one`. Cite the diagnosis subsections that hold each figure rather than restating them. Cite `timescale/pg_textsearch#573` wherever mechanism 2 is named as the cause.

**Depends on:** Task 1, which adds `### A fresh fixture-catalog reading, both backends as shipped` to the same section. That subsection states whether arm B returns the same ordered refs on every `fixture-catalog` query, and if not, which queries differ. This task cites it by that exact heading. Its claims about the fresh reading are only those that subsection records. Read the subsection before writing, and make every sentence below that depends on the answer match it.

**Where this task stops.** These passages are not this task's:

- The **Finding — a defect, recorded and not acted on.** paragraph, the section's lead, `### The trade-off, stated` and the wall-clock notes are **Task 3's**.
- `docs/retrieval-eval.md` is **Task 4's**.
- The diagnosis section's own `#573` citations are **Task 5's**.

Every recorded value in these passages stays as written. That covers the scores −17.528924 / −9.200331, the near-tie scores, and the same-order counts. Only attribution and citations change, and sentences are added.

### Targets

- `docs/retrieval-eval-results.md` → `### Which case this is`, and `### Divergence sources, in the order checked` item 3 (its **The configuration is the same on both sides.**, **The probe.**, **What it shows.** and **What stays unexplained.** bullets) and item 4's **Arms D and E** bullet.

**Work:**

- [ ] **Item 3, which score the figures read, and on which version.**
  - **The configuration is the same on both sides.** Add one sentence: these readings were taken on `pg_textsearch` 1.3.1. `chore_docs_retrieval_pg_textsearch_upgrade` has since moved both engines to 1.5.1 (`### The deciding figures on pg_textsearch 1.5.1` → `#### How these were taken, on 1.5.1`).
  - **The probe.** Add that its statement's column is the `<@>` operator, not the score the store ranks by. The store ranks by the index scan's own score, `bm25_get_current_score()`, and the two differ while rows sit in the memtable. Cite `### How the probe reads a score, and the setup`, the `scan` and `operator` bullets. So every score this probe recorded, the compose-database and empty-database readings alike, is an `operator` score.
- [ ] **Item 3, what it shows.** Rewrite **What it shows.** to the two mechanisms, keeping the sentence that the measured fact is the scores' dependence on the database's state.
  - **Mechanism 1**, dead rows that stay in the index's statistics. Name it as the "was not measured" inference this bullet carried, now measured. Cite `### The candidate end-state rule, at refresh level`, the `other-corpus` rows, and `### Whether either mechanism moves relevance`, which defines both mechanisms.
  - **Mechanism 2**, exact lengths in the memtable against quantized ones in segments. Cite `### The score each index state ranks by`, the `t0` rows.
  - **The `#573` provenance.** At mechanism 2's first naming as a cause in this section, write the `#573` provenance in the form `## Context` → **The `#573` citation.** fixes. It is the one place this section states it.
  - **The fresh build varies between runs.** Add that the Python store's own fresh build is not one state: it left 116 memtable documents in one run and 276 in another on `self-docs`. Cite `### The candidate end-state rule, at refresh level`, the paragraph after its Python `self-docs` table.
  - **What shipped.** Close with what shipped. Both backends now end every refresh that wrote anything, the first build, and any refresh whose index is not marked rebuilt, in `REINDEX INDEX chunks_bm25` (`### The recommendation for the fix branch` → **What shipped.**). Their shipped end states match a fresh build followed by `REINDEX` in 11 of 12 scenarios each (`### Route 2 on the fix branch` → `#### The shipped end state at refresh level`, both parts).
- [ ] **Item 3, the near-tie pairs.** Retitle **What stays unexplained.** to a label that reflects the explanation, for example **The near-tie pairs, since explained.** Keep both pairs' scores as recorded.
  - **The explanation.** On the empty database they are mechanism 2, `timescale/pg_textsearch#573`. The store ranks by `scan`, and the recorded scores are `operator`. The Python store's fresh build on an empty database is the `t0` state that inverts them. Cite `### The near-tie ordering on an empty database` and `### The recommendation for the fix branch` → **Goal 4's conclusion**.
  - **On 1.5.1.** The same inversions recur on 1.5.1 (`#### The near-tie ordering, on 1.5.1`).
  - **The fresh reading.** Then say, in one sentence, what Task 1's reading shows for these two queries' arm B order.
- [ ] **Item 4, Arms D and E.** For the 2026-10-08 blocks, they carry arm B's index-state mechanisms through the fusion, as well as sources (1) and (2). The blocks still cannot separate the two, so that split stays unexplained for them. Replace "the database's history" with that wording.
  - **If Task 1's arm B agrees on every query,** add that on the fresh reading arm B contributes no difference to the fusion, so arms D and E differ there only where the vector arm or the reranker does. Cite `### A fresh fixture-catalog reading, both backends as shipped`.
  - **If it does not,** add that the split remains unexplained on the fresh reading too.
- [ ] **`### Which case this is`.**
  - **Keep the verdict.** Keep the bold verdict line **They disagree, and the reason is not yet identified.** byte for byte, as the case for the 2026-10-08 blocks. `### The trade-off, stated` quotes it.
  - **The first identified difference.** Correct it from "the Python index's history in its database" to the Python index's state: mechanisms 1 and 2, the latter `timescale/pg_textsearch#573` (divergence source (3)).
  - **The unexplained list.** Change "how arms D and E split between the index's history and model precision" to "… between the index's state and model precision". Remove "two near-tie swaps in arm B that remain on a fresh database", because source (3) now explains them, and move it to the identified differences as a third. So the list holds three unexplained items.
  - **The fresh reading.** Add a closing paragraph saying what Task 1's reading shows, citing its subsection. State whether arm B agrees on every `fixture-catalog` query with both backends in the `REINDEX` state. If it does, say that on that reading the backends differ only in arms C to E, for which the models (sources (1) and (2)) are the measured candidate, and that `self-docs` was not re-read. If it does not, name the differing queries as unexplained. Do not set the reading's figures against the 2026-10-08 ones.

**Verification:**

- `git diff --stat` lists only `docs/retrieval-eval-results.md`.
- Every hunk of `git diff -U0 -- docs/retrieval-eval-results.md` falls between the `### Which case this is` heading and the `### Vector agreement, and the embedder id` heading.
- `git grep -nE "index's history|database's history|delete-and-insert" -- docs/retrieval-eval-results.md` prints no line inside `### Which case this is` or items 3 and 4. The story index's `## Scope register` rows 1–3 own those passages, and any hit elsewhere is a row this task does not own.
- `git grep -n 'timescale/pg_textsearch#573' -- docs/retrieval-eval-results.md` prints at least one line inside item 3. Every line between the two headings above that names mechanism 2 as a cause carries `#573` itself or follows the provenance sentence within the same item.
- `git grep -nF 'They disagree, and the reason is not yet identified.' -- docs/retrieval-eval-results.md` still prints the verdict line and the trade-off's quote.
- Every number in the rewritten passages appears verbatim either in the subsection it cites or in the passage's own pre-edit text: grep each against `docs/retrieval-eval-results.md`.
- Every sentence about the fresh reading agrees with what `### A fresh fixture-catalog reading, both backends as shipped` states.

- **Deviations from plan:**
  - **The retitled label is still cited outside this task's range.** `### The near-tie ordering on an empty database`, its opening sentence, cites "`### Divergence sources, in the order checked`, item 3, **What stays unexplained.**", which this task retitled to **The near-tie pairs, since explained.** That line lies outside the `### Which case this is` … `### Vector agreement, and the embedder id` range this task's verification confines it to, and the subsection is Task 5's (`## Scope register` row 16), so it was not edited. Task 5 should update that citation to the new label.
  - **`#573` before its provenance.** `### Which case this is` names mechanism 2 as a cause before item 3 does, so it carries the bare `timescale/pg_textsearch#573` twice; the provenance sentence is stated once, at item 3's **Mechanism 2** sub-bullet, as `## Context` → **The `#573` citation.** assigns it.
  - **The trade-off's quote of the verdict wraps a line.** `git grep -nF 'They disagree, and the reason is not yet identified.'` prints only the verdict line, because `### The trade-off, stated` quotes it across a line break ("…is not yet" / "identified."). That quote is unchanged; its presence was checked by `grep -n 'They disagree, and the reason is not yet'` and reading the next line, not by the plan's one-line probe.
