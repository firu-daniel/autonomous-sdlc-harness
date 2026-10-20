### Task 8 — Write the recommendation for the fix branch

**Goal:** Meet goal 7 of the task prompt. Write a recommendation for the fix branch that names which goals' figures decided it. It takes exactly one of the three routes the prompt allows:

1. the candidate rule of goal 5 holds;
2. another route is named;
3. the findings show `pg_textsearch` cannot give stable ranking scores on this workload, and evaluating another lexical engine becomes its own, supervised research step.

The recommendation is a proposal to the maintainer, not a decision.

**Depends on:** Tasks 2, 3, 4, 6 and 7. It reads only the subsections those tasks wrote under `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured`, and takes no measurement of its own:

- **Task 2:** `### The score each index state ranks by`, with its per-state conclusions, its statement of which build forms score alike in `scan`, and whether PGlite exposes `bm25_spill_index`; and `### The near-tie ordering on an empty database`.
- **Task 3:** `### What still differs after REINDEX`, one conclusion per residual: explained by `real` storage, consistent with mechanism 2, or unexplained.
- **Task 4:** `### The stray index-scan score`: the reproducible sequence, the rate, and the memtable-or-segment answer.
- **Task 6:** `### The candidate end-state rule, at refresh level`, with the verdict per backend and corpus, the before-fix figures, the store-plan observation and the near-tie observation from the Python store's own fresh build.
- **Task 7:** `### Whether either mechanism moves relevance`: "ranking quality" or "score parity only", per mechanism.

**Where this task stops.** It writes the recommendation into one subsection and nowhere else. No other document gains the recommended change as pending work: not `docs/retrieval.md`, not `docs/development.md` → `## 6`, not a code comment (`harness-runs/lessons.md` → `## Evidence and measurement`, the decision-rule lesson). It edits none of the backend comparison's existing paragraphs, which are out of scope. If the route is the third one, it says the research step is supervised because unattended runs have no web access, and it plans that step nowhere.

### Targets

- `docs/retrieval-eval-results.md` → a new `### The recommendation for the fix branch`, the last subsection of `## The BM25 index's state, measured`, after `### Whether either mechanism moves relevance`.

**Work:**

- [ ] **Goal 4's conclusion.** Combine Task 2's probe rows with Task 6's observation of the Python store's own fresh build into one sentence: "explained by mechanism 2", or "still unexplained", with what each row shows. Neither task's `self-docs` figures are compared with the other's. Goal 4's pairs are `fixture-catalog`, which does not move.
- [ ] **Choose the route by these tests, applied in order, and state which held.**
  - **Route 1, the candidate rule.** Task 6's verdict holds on both backends and both corpora, in `scan`, against the reference Task 2's statement names. Task 4's stray, if reproduced, appears only in a state the rule leaves behind it: the memtable, when the rule ends every refresh with the rows in a segment.
  - **Route 2, another route.** The rule fails, or holds only with a qualification the figures name. Examples are a failure in one scenario, PGlite's `spill` branch not issuable, a store-plan flip below the crossover on `fixture-catalog`, or a stray in a segment state. Name the route the figures point at, and the figures that point at it. A route this branch did not measure is named as unmeasured, with the measurement the fix branch would take first.
  - **Route 3, another lexical engine.** No `pg_textsearch` index state scores stably across the states and runs measured. Either `scan` differs from every reference after every statement the extension offers, or the stray appears in every state.
  - **Name the deciding goals**, by goal number and by the subsection and row each figure comes from.
- [ ] **Write `### The recommendation for the fix branch`.**
  - **The lead** says what it is: a proposal for the maintainer, with the fix branch deciding.
  - **The route,** with its reasons, each reason citing its subsection and row.
  - **Task 7's answer** on ranking quality against score parity, and what it means for the route's priority.
  - **The open items** Tasks 3 and 4 left unexplained, each restated as unexplained, with its counts.
  - **The limits:**
    - figures from fixture-sized corpora (`fixture-catalog`, 41 chunks, and `self-docs` at its runs' stamps) do not on their own justify the fix's design. A fix branch that adopts the route would take the real-shape figure first (`harness-runs/lessons.md` → `## Evidence and measurement`, the first rule), and this is stated as a limit of this recommendation, not as work queued elsewhere;
    - the rebuild's wall-clock cost was not measured by this branch. Only an operator's hand run through the probe's `--reindex-cost` seam may supply it (`docs/retrieval-eval.md` → `### The BM25 index-state probe`);
    - every `pg_textsearch` source path and issue number cited in the section is a task-prompt lead, not re-read here.
- [ ] **Close the section's own loop.** Re-read `## The BM25 index's state, measured` from its lead paragraph down, and confirm three things. Every goal 1–6 has its subsection and conclusion. The lead paragraph's list of what the section records matches the subsections now present. No subsection names a capture file, a machine-local path or a millisecond figure. Correct only this task's own subsection. A defect found in an earlier task's subsection is reported in the return, not edited, because that subsection is its task's.

**Verification:**

- Exactly one route is recommended, and its test is stated with the rows that met it.
- Every deciding figure is cited by goal number and subsection.
- `git grep -nE "bm25_spill_index|REINDEX INDEX" -- docs ':!docs/retrieval-eval-results.md' ':!docs/retrieval-eval.md'` has no hit, so the recommendation appears in no other document. Its `docs/retrieval-eval.md` hits are confined to `### The BM25 index-state probe`.
- `git diff -- docs/retrieval-eval-results.md` adds bytes only inside `### The recommendation for the fix branch`.
