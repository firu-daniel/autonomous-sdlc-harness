### Task 5 — Tidy the diagnosis section's lead, its stray-score runs paragraph and its `#573` citations

**Goal:** Tidy `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured`, the three findings of its review:

- Its **Who reads this, and what it decides.** lead lists every subsection the section holds.
- `### The stray index-scan score` → **The runs.** stops saying every run was taken with `--capture` when the text below records that Postgres `self-docs` run 1 wrote none.
- `timescale/pg_textsearch#573` is cited wherever the section names mechanism 2 as the cause.

Its provenance is stated separately from the task-prompt leads, so the lead's statement about those leads stays true and exact.

**Depends on:** Task 3, the last task to edit `docs/retrieval-eval-results.md` before this one. The tasks editing that file run in order. This task's `#573` wording matches the comparison section's, which **Task 2** wrote: the bare `timescale/pg_textsearch#573`, with the full provenance in the form `## Context` → **The `#573` citation.** fixes. That provenance is stated once in this section, in the lead. This task touches nothing inside `## The Python backend against the TypeScript one`.

**Where this task stops.** These stay out of scope:

- **Measured content.** It changes no measured figure, table, statement or setup in the diagnosis section.
- **Other leads.** It does not re-read or re-cite `#557` or `#516`. Those stay task-prompt leads, and **The lead.** of `### The stray index-scan score` is not edited.
- **Other mechanism-2 lines.** It adds `#573` at the four sites below and nowhere else. The story index's `## Scope register` rows 16–20 list every mechanism-2 line and why each other one carries no citation.

### Targets

- `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured`:
  - its lead;
  - `### The near-tie ordering on an empty database` → **Explained by mechanism 2, for the probe's states.**;
  - `### The stray index-scan score` → **The runs.**;
  - `### Whether either mechanism moves relevance`, its opening paragraph;
  - `### The deciding figures on pg_textsearch 1.5.1` → `#### The near-tie ordering, on 1.5.1`, the **Explained by mechanism 2, for the probe's states**: bullet;
  - `### The recommendation for the fix branch` → **Goal 4's conclusion: explained by mechanism 2.**, and the bullet "Every `pg_textsearch` source path and issue number cited in this section is a task-prompt lead".

**Work:**

- [ ] **The lead lists every subsection.** Rewrite its enumeration so it names, in file order, every `###` heading the section holds:
  - `### How the probe reads a score, and the setup`
  - `### The score each index state ranks by`
  - `### The near-tie ordering on an empty database`
  - `### What still differs after REINDEX`
  - `### The stray index-scan score`
  - `### The candidate end-state rule, at refresh level`
  - `### Whether either mechanism moves relevance`
  - `### The deciding figures on pg_textsearch 1.5.1`
  - `### Route 2 on the fix branch`
  - `### The recommendation for the fix branch`

  Name each by its heading or a phrase plainly mapping to it, with the 1.5.1 and route-2 subsections' own scope stated in a clause each. Keep the sentence about `{ files, chunks }` stamps.
- [ ] **`#573`'s provenance, in the lead and in the recommendation.**
  - **The lead.** Keep *"The `pg_textsearch` source paths and issue numbers cited here are the leads of the task prompt that opened this work; none was re-read on the branch that measured them"* true and exact by excepting `#573`. Add a sentence: `timescale/pg_textsearch#573` is not one of those leads. It reports mechanism 2 upstream, was filed by the maintainer after this diagnosis, and is still open on 1.5.1. It is cited from the task prompt of `chore_docs_retrieval_backend_comparison_record` and was not read on that branch.
  - **The recommendation.** In `### The recommendation for the fix branch`, amend the bullet *"Every `pg_textsearch` source path and issue number cited in this section is a task-prompt lead, not re-read on this branch."* the same way: every one but `#573`, whose provenance is the lead's.
- [ ] **The stray-score runs paragraph.** In `### The stray index-scan score` → **The runs.**, the closing *"…each with `--capture`"* becomes a statement that every run was taken with `--capture` except Postgres `self-docs` run 1, which wrote no capture, as the table's `not captured` cells and the sentence "Run 1 wrote no capture" below record. Change nothing else in the paragraph.
- [ ] **`#573` where mechanism 2 is named as the cause**, one bare `timescale/pg_textsearch#573` at each of four sites:
  - **`### The near-tie ordering on an empty database`.** In the **Explained by mechanism 2, for the probe's states.** paragraph.
  - **`### Whether either mechanism moves relevance`.** In the opening paragraph's sentence defining mechanism 2.
  - **`#### The near-tie ordering, on 1.5.1`.** In the **Explained by mechanism 2, for the probe's states**: unchanged. bullet. Note that this is consistent with the upstream report that the mechanism is still present on 1.5.1.
  - **`### The recommendation for the fix branch`.** In **Goal 4's conclusion: explained by mechanism 2.**

  Write it as a parenthetical or a short clause, and alter no figure.

**Verification:**

- `git diff --stat` lists only `docs/retrieval-eval-results.md`. Every hunk of `git diff -U0 -- docs/retrieval-eval-results.md` falls after the `## The BM25 index's state, measured` heading.
- `git grep -n 'timescale/pg_textsearch#573' -- docs/retrieval-eval-results.md`, restricted to lines after that heading, prints the lead and the four sites above, and no other line.
- Re-run the story index's derivation entry C, `git grep -nE 'echanism 2' -- docs README.md evals/docs-retrieval/README.md docs-retrieval-service/README.md`. Every hit inside the diagnosis section falls in a `## Scope register` row 16–20 passage, and each `change` row's passage carries `#573`.
- Every heading listed in the first Work bullet is named by the lead. Check each against `git grep -nE '^### ' -- docs/retrieval-eval-results.md`, between the `## The BM25 index's state, measured` heading and the end of the file.
- `git grep -nE 'each with .--capture.' -- docs/retrieval-eval-results.md` shows no claim left inside `### The stray index-scan score` → **The runs.** that every run wrote a capture.
- `git grep -n 'task-prompt lead' -- docs/retrieval-eval-results.md` still prints the recommendation bullet, now carrying the `#573` exception.

- **Deviations from plan:** `### The near-tie ordering on an empty database`'s opening sentence still cited item 3's old label **What stays unexplained.**, which Task 2 (commit `2446a80a`) renamed to **The near-tie pairs, since explained.**; updated the citation to the new label so the cross-reference resolves (source: Task 2's deviation note, relayed by the orchestrator). Not a measured-content change. Wrapped lines around the four `#573` sites were reflowed to the file's width; no other wording changed.
