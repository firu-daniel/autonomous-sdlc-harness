### Task 7 — Update `docs/retrieval.md` and the probe paragraph of `docs/retrieval-eval.md` for the Python end state

**Goal:** Make the two behaviour documents true after the port: `docs/retrieval.md` says both backends end every refresh that wrote, and every index not marked rebuilt, in the `REINDEX` state, and that the Python store issues the same SQL with no exception left; its cost list carries the Python rebuild; and `docs/retrieval-eval.md`'s probe paragraph no longer says a Python `before` reading is the unfixed state.

**Depends on:** Task 6, which writes `docs-retrieval-service/README.md` → `## The seam, as found` → **The end state, and the lock it takes.** — the paragraph this task cites for the lock rather than restating it; and through it Tasks 1, 3 and 4: `store.py` issues `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS` and the two-key width-change delete; `refresh.py` → `refresh_index` ends as `refreshIndex` does; `docs-retrieval-service/tests/test_refresh_end_state_postgres.py` pins it.

**Where this task stops.** No figure is written here: the after-fix Python figures are **Task 8's**, in `docs/retrieval-eval-results.md`, and this task cites no subsection Task 8 has not yet written. Scope register rows 4, 7 and 8 are this task's; rows 5, 6 and 9 stay unchanged.

### Targets

- `docs/retrieval.md`
- `docs/retrieval-eval.md`

**Work:**

- [ ] **`docs/retrieval.md` → `## How it fits together` → **Store.**** Replace *"issues that same SQL, except for three statements `store.ts` carries … until `fix_docs_retrieval_bm25_index_state_python`"* with: `open_postgres_store` issues that same SQL, `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS` and the two-key width-change delete included. The rest of the paragraph — the database scope and `## Turning on the Python backend` — is unchanged.
- [ ] **`docs/retrieval.md` → **Incremental refresh.**** Add one sentence after the TypeScript description: the Python backend's `docs-retrieval-service/src/harness_docs_retrieval/refresh.py` → `refresh_index` applies the same rule with the same `index_state` marker, issuing `END_STATE_STATEMENTS` through `DocStore.rebuild_indexes()`. Name `docs-retrieval-service/tests/test_refresh_end_state_postgres.py` beside `cli/test/docs-retrieval-refresh-end-state.test.mjs` where the paragraph says what pins the property. The TypeScript figures sentence is unchanged.
- [ ] **`docs/retrieval.md` → `## What it costs`, the **Python backend** list.** Add one bullet: the same `REINDEX INDEX` of the BM25 index after every refresh that wrote anything, run against a database checkouts may share, so a second server on that database waits for the rebuild's lock (`docs-retrieval-service/README.md` → `## The seam, as found` → **The end state, and the lock it takes.**); its wall-clock cost is **not measured**, and the seam that measures it is the probe's `--reindex-cost`, an operator's hand run. The TypeScript bullet is unchanged.
- [ ] **`docs/retrieval-eval.md` → `### The BM25 index-state probe`.** Replace *"on the Python backend it is still the state that backend's own refresh leaves (… `#### The shipped end state at refresh level`)"* so the sentence says a `before` reading is the shipped end state on both backends, because each backend's refresh issues `END_STATE_STATEMENTS` itself. Leave the `--reindex-cost` sentence, the four commands and the dated route-2 command block unchanged.

**Verification:**

- `git grep -nF 'fix_docs_retrieval_bm25_index_state_python' -- docs/retrieval.md` and `git grep -nF "state that backend's own refresh" -- docs/retrieval-eval.md` each have no hit.
- Every path and anchor the new sentences cite resolves in the tree: the two test files, `refresh.py`, and the README heading Task 6 wrote.
- No sentence added here carries a figure or a time.
- Scope register: derivation entries A, B and D, re-run, reach in these two files only lines inside rows 4–8, and the lines this task adds fall in rows 4, 7 and 8.
- `git diff --stat` lists only the two targets.
