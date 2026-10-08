### Task 2 — Measure the refresh-level history dependence on both backends before the fix

**Goal:** Meet the measurement half of goal 3, on both backends. Task 1 measures the extension at statement level. This task measures what an adopter actually runs: the shipped refresh path, into a persistent index, refreshed after documents are removed and changed. It takes the before-fix figures, which only exist until Tasks 4 and 6 land. Task 8 re-runs the same sequence after the fix.

**Depends on:** Task 1, which commits `evals/docs-retrieval/bm25-history.mjs` and records `### The index's history, measured` in `docs/retrieval-eval-results.md`. This task extends that module and that subsection. It does not re-measure the statement-level facts.

**The sequence, per backend.** The corpus is `fixture-catalog`, mirrored into a throwaway repository with `evals/docs-retrieval/mirror-fixture.mjs` → `buildMirrorFixture` so it can be edited.

1. **Build:** index the mirror.
2. **Edit:** remove two corpus files from the mirror and change the body text of a section in a third, so the refresh both deletes keys and re-embeds a stored key.
3. **Refresh:** index the edited mirror again.
4. **Reference:** index a second, untouched copy of the edited mirror into an empty index.
5. **Score:** run item 3's scored `ORDER BY` statement for every `fixture-catalog` query against steps 3 and 4. Report the hits differing at six decimals, and `bm25_summarize_index`'s `total_docs` for each.

- **TypeScript:** steps 1 and 3 are `cli/dist`'s refresh into a persistent data directory, through `evals/docs-retrieval/index-build.mjs` → `buildIndex({ repoRoot, config, dataDir })` with the same `dataDir` both times, so step 3 is an incremental refresh and not a cold build. Score by reopening the directory with PGlite, as item 3's probe did.
- **Python:** steps 1 and 3 go through `evals/docs-retrieval/python-backend.mjs` → `indexPythonCorpus` into one throwaway database on the compose server, selected through `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`, with step 4 in a second one. Both are created and dropped as item 3's probe did. Score through `docker compose exec -T postgres psql`.

Both routes use the real models, because that is the refresh path as shipped. The models only decide which keys are re-embedded, not any BM25 figure. Record the embedder ids from the run.

### Targets

- `evals/docs-retrieval/bm25-history.mjs`: a second exported function, the refresh-level sequence above, reusing Task 1's scoring and summary helpers rather than a second copy of them.
- `docs/retrieval-eval.md`: the run command for the refresh-level pass, in the subsection Task 1 added.
- `docs/retrieval-eval-results.md` → `### The index's history, measured`: a `#### Through the refresh, before the fix` part.

**Work:**

- [ ] Add the refresh-level function, taking the backend name, the corpus and the edit set, and returning steps 3 and 4's score tables and `total_docs` values. The edit set is fixed in the module, not chosen at run time, so a re-run after the fix edits exactly the same files.
- [ ] Run it for `typescript` and for `python` against the unfixed tree. Capture the output under `harness-runs/scratch/bm25-history/` and record from the captures alone.
- [ ] Record per backend: the edit set (files removed, section changed); the refresh's own summary line (`embedded`, `unchanged`, `deleted`); `total_docs` after steps 3 and 4 against the live row count; the number of hits differing between steps 3 and 4; and the first three differing keys with both scores. State plainly whether the TypeScript persistent index carries the dependence. That sentence is goal 3's answer, and Task 4 is conditioned on it.

**Verification:**

- The recorded TypeScript and Python results each answer, with a figure, whether the refreshed index scores differently from a fresh index of the same corpus.
- If the TypeScript result shows **no** dependence, which the planning probe makes unlikely, stop before Task 4 and report it to the maintainer. Tasks 4 and 5 would then be replaced by recording that measurement, as the prompt's goal 3 allows, and that replacement is the maintainer's to approve.
- No figure in the new part is a time.
- `bash scripts/run-gates.sh` passes.
