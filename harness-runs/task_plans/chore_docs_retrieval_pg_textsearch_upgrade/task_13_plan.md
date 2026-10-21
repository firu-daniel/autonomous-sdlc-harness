### Task 13 — State whether the 1.5.1 figures keep route 2, under the recommendation

**Goal:** Under `docs/retrieval-eval-results.md` → `### The recommendation for the fix branch`, add one short paragraph. It says whether the 1.5.1 figures keep route 2 as proposed, and names the figures that decide it. The 1.3.1 recommendation itself is not rewritten.

**Depends on:** Task 12, the last writer of `### The deciding figures on pg_textsearch 1.5.1`. The subsection is complete when this task starts. Its parts, written by Tasks 8–12:

- `#### How these were taken, on 1.5.1`;
- `#### The score each index state ranks by, on 1.5.1`;
- `#### The near-tie ordering, on 1.5.1`;
- `#### The stray index-scan score, on 1.5.1`;
- `#### The candidate end-state rule, at refresh level, on 1.5.1`;
- `#### The relevance eval's deterministic figures, on 1.5.1`;
- `#### The lexical-plan crossover, on 1.5.1`.

Each part ends with lines saying whether 1.5.1 changed each figure.

**Where this task stops.** It takes no measurement and quotes every figure from those parts. It writes the standing **into the recommendation subsection only**: no other document gains the route, or its standing, as pending work (`harness-runs/lessons.md` → `## Evidence and measurement`, the decision-rule lesson). It changes no existing line of the recommendation subsection.

### Targets

- `docs/retrieval-eval-results.md` → `### The recommendation for the fix branch`: one new closing paragraph.

**Work:**

- [ ] **Re-apply the recommendation's own deciding figures on 1.5.1**, as its **The deciding goals.** paragraph names them:
  - **Goal 5**: the verdicts against `reference-reindex`, and Observation 1, from Task 10's part.
  - **Goal 1**: whether `t3` / `t4` still score alike, and whether the spill still leaves a multi-segment index differing on `self-docs`, from Task 8's state part.
  - **Goal 3**: whether the stray still appears only while the memtable is emptied, or is gone, from Task 9's part.

  Decide whether each still points the way **How the route was chosen.** reads it: route 1 does not hold, route 3 does not hold, and route 2 holds, with `REINDEX` reaching the single-segment state.
- [ ] **Write the paragraph**, headed **Its standing on pg_textsearch 1.5.1.**, at the end of the subsection after **The limits of this recommendation.**. It contains:
  - whether route 2 stands as proposed, stands with a changed qualification, or does not stand;
  - each deciding figure, with its part and row cited;
  - any qualification the 1.5.1 figures change: the not-bit-identical `REINDEX` residual, the Seq Scan plan below the crossover (Task 12's figure), and the `none` branch;
  - the stray's 1.5.1 outcome;
  - one sentence that it remains a proposal, and that the fix branch decides.

  Keep it short, about one paragraph, as the prompt asks.

**Verification:**

- `git diff docs/retrieval-eval-results.md` adds lines only after the last line of **The limits of this recommendation.** and changes no existing line of the subsection.
- Every figure the paragraph names appears, with the same value, in the part it cites.
- `git grep -n "route 2" -- docs ':!docs/retrieval-eval-results.md'` gains no hit from this branch.
