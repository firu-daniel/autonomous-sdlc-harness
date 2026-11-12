### Task 32 — Respell the retrieval, decision and research documents

**Goal:** Make the retrieval documents, the typecheck decision record and the research documents name `devscene.config.json`, `devscene/`, `devscene-scripts/` and `/devscene:analyze`, and the step `Run DevScene` where it appears.

**Depends on:** Tasks 1, 6 and 11, which make every renamed value true.

**Where this task stops.** These are research and decision records. They are respelled silently (`## Context` → *Dated records are respelled, silently*), and no claim, figure or verdict changes. The `harness-docs` server, the `harness_docs_retrieval` package, the database default and every `HARNESS_DOCS_RETRIEVAL_*` / `HARNESS_RETRIEVAL_*` name stay (task prompt → *Out of scope*). `docs/retrieval-eval-results.md` is a large measured record: only lines carrying a table row change.

### Targets

- `docs/retrieval.md`, `docs/retrieval-eval.md`, `docs/retrieval-eval-results.md`, `docs/typecheck-key-decision.md`
- `docs/copilot-foundry-research.md`, `docs/team-accounts-research.md`
- `docs/rag-extraction-research/01-current-mechanism.md`, `docs/rag-extraction-research/07-extraction-plan.md`, `docs/rag-extraction-research/reviews/01-current-mechanism.md`, `docs/rag-extraction-research/reviews/07-extraction-plan.md`

**Work:**

- [ ] `docs/retrieval.md`, `docs/retrieval-eval.md`, `docs/retrieval-eval-results.md`: apply rows 1, 2 and 6 of `## Context`'s spelling table where they occur.
- [ ] `docs/typecheck-key-decision.md`: apply row 1.
- [ ] `docs/copilot-foundry-research.md`: apply rows 1 and 11 (*"Its *Run DevScene* step exports only those two …"*). `docs/team-accounts-research.md`: apply rows 3, 6 and 11 (*"the steps `Check the credentials` and `Run DevScene`"*).
- [ ] The four `docs/rag-extraction-research/` files: apply rows 1, 3, 4 and 6 everywhere except two lines of `docs/rag-extraction-research/reviews/07-extraction-plan.md`, which stay byte-identical as deliberate leftovers:
  - the one quoting the recorded command `` git grep -lE "harness.config|devscene|HARNESS_" main -- .claude `` and the file list it matched;
  - the one opening *"devscene4 renames `harness.config.json` → `devscene.config.json`"*.

  Each states the rename mapping or a measured command, and respelling the old side would make it false. Task 35's closing report lists them.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-task-offer|harness-analyze|Run the harness' --` followed by this task's ten target paths prints only the two `reviews/07-extraction-plan.md` lines named above.
