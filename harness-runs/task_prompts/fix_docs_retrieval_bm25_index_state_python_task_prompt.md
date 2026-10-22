`fix_docs_retrieval_bm25_index_state_python` ports the TypeScript backend's BM25 index-state fix to the Python docs-retrieval service, so both backends end every refresh in the same index state. A container test pins it.

**It follows `fix_docs_retrieval_bm25_index_state_typescript`, which must merge first.** Port what that branch shipped, not this prompt's summary of it. Read its changes to `cli/src/retrieval/` and its additions to `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured` before planning.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** The planner and the reviewers re-verify each lead against the live code.

---

## Leads

- **The Python store needs the fix more than the TypeScript one.** The diagnosis's `### The candidate end-state rule, at refresh level` found:
  - **Its own fresh build is the unspilled state.** On `fixture-catalog`, the Python store's fresh build on an empty database is the diagnosis's `t0` state: 41 memtable documents, no segment. Both near-tie pairs are inverted there (**Observation 2**).
  - **The build varies between runs.** On `self-docs`, the Python store's build splits differently each run: 116 against 276 rows left in the memtable, and 6 against 5 segments after a spill. Two runs of the same scenario differed on most hits (`--compare`). The `REINDEX` end state removes that variation: every reading that followed `REINDEX` matched the reference, with one 9.5e-7 exception.
  - **Every scenario failed the candidate rule.** On Python, the rule failed in every scenario where it issued a spill or nothing. That is 10 and 7 hits in `fresh`, 3 and 8 in `file-added`, and 109 and 156 in `unchanged`.
- **What the TypeScript branch shipped, as its own docs record it.** Re-verify each against `cli/src/retrieval/` at the merge commit.
  - **The end state.** `refreshIndex` (`cli/src/retrieval/refresh.ts`) calls `DocStore.rebuildIndexes()` when the refresh wrote anything, or when the stored `index_state` meta value is not `rebuilt`. `rebuildIndexes()` issues `END_STATE_STATEMENTS` (`cli/src/retrieval/store.ts`), which is `REINDEX INDEX chunks_bm25` alone. An unchanged refresh over a rebuilt index issues nothing.
  - **The old-database detection is a meta marker, not an index-summary read.** The `index_state` key (`INDEX_STATE_META_KEY`) reads `pending` (`INDEX_STATE_PENDING`) from before a refresh's first write until `rebuildIndexes()` returns, then `rebuilt` (`INDEX_STATE_REBUILT`). A database the shipped code left carries no such key, so its next refresh rebuilds it.
  - **The width-change path widened.** When the embedding width changes, `store.ts` now issues `DELETE FROM meta WHERE key = ANY($1::text[])` over both the `embedder` and `index_state` keys. `store.py` still issues `DELETE FROM meta WHERE key = $1` over `embedder` only.
  - **The lexical arm.** `lexicalSearch` issues `LEXICAL_SEARCH_STATEMENT` (`SELECT id, <BM25_ORDER_CLAUSE> AS score … ORDER BY … LIMIT $2`) and drops every row whose score is exactly `0`, on every plan.
  - **What `store.py` lacks** is listed in `docs/retrieval.md` → **Store.** and `docs-retrieval-service/README.md` → `## The seam, as found`: the three statements above and the `rebuildIndexes` method.
- **The parity bridge already reads the end-state statements.** `docs-retrieval-service/tests/ts_bridge.mjs`'s `constants` command prints `store.END_STATE_STATEMENTS`, and `END_STATE_STATEMENTS` is exported from `store.ts` for that reason. Code-review Finding 1 on the TypeScript branch had made it module-private while it had no outside consumer; the bridge is that consumer now, so exporting it is not a regression of that finding. `LEXICAL_SEARCH_STATEMENT` and the three `INDEX_STATE_*` constants are exported but the bridge does not print them yet.
- **`RefreshResult` has no `rebuilt` field visible to the eval, and the shipped rule does not need one.** `evals/docs-retrieval/python-backend.mjs`'s `indexPythonCorpus` returns none, and the refresh-level module assumes `false` on Python (the `task_5_plan.md` deviation on the diagnosis branch). The TypeScript rule decides from whether the refresh wrote and from the meta marker, and `RefreshResult` did not change. Re-verify whether the eval module still needs the field before adding one.
- **The lock.** `REINDEX INDEX` takes an `ACCESS EXCLUSIVE` lock on the index, so a second server sharing the compose database waits for it. How long it waits comes only from an operator's hand run.

## Decisions taken before planning

These are the maintainer's rulings, not leads. Do not park on them.

- **A residual after `REINDEX` is recorded, not attributed, and is not a defect.** The TypeScript branch met two such cases: one `scan` hit off by one float32 ULP, with `operator` and the index summary identical, and a second `REINDEX` leaving it (`docs/retrieval-eval-results.md` → `#### Route 2 on the real catalog`, `other-corpus`, and `#### The shipped end state at refresh level`, `self-docs` `file-edited`). The same ruling holds here, on either backend, in the container test and in the probe re-run alike. It loosens nothing: the "no tolerance" constraint below stands, so a test still compares scores exactly, and a residual is recorded beside the figures rather than absorbed by the test. A difference that is not of that shape (more than one hit, `operator` also differing, or a changed index summary) is not covered and is a stop.
- **A real-catalog Python figure is wanted, on the same snapshot the TypeScript branch used.** Run gate 10's leg (vii) (`docs/development.md` → `## 5. Verifying a change` → **Gate 10**) with `--backend python` on the private catalog at commit `dce0de74e`, `{ files: 105, chunks: 1454 }`. The recorded catalog commit `010c50e` no longer exists. Record the gap the TypeScript run recorded: 1,454 chunks is under the leg's ~1,500-chunk floor, and it is a different snapshot from the 2026-09-22 catalog runs. The catalog is held outside this checkout, so this is the maintainer's hand run (the run parks for it, or the maintainer runs it at the orchestrator session's request); the branch ships the figure in `docs/retrieval-eval-results.md` beside the TypeScript one.
- **Gate 11's floor is out of this branch's reach.** `evals/docs-retrieval/floor.json` grades the TypeScript backend's run, and this branch changes nothing that backend ranks by. Do not re-record any floor row. A TypeScript figure that moves on this branch is a defect to fix, not a re-record under `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule.**

## The goal

1. **The same end-state rule as the TypeScript fix,** stated once in the Python refresh module (`docs-retrieval-service/src/harness_docs_retrieval/`).
   - Add a statement-parity assertion against the TypeScript store's statements, in the form the service's existing parity tests use.
   - Port the TypeScript fix's handling of a database the shipped code left, and its `lexicalSearch` matching-only rule, if that branch shipped them.
2. **`RefreshResult` keeps its shape,** so the wire and parity surfaces do not move.
3. **A container test beside the package's own tests.**
   - It needs the compose Postgres like the other container tests, and is skipped where Docker is absent.
   - It fails before the fix and passes after it, and must be shown failing with the fix removed.
   - It compares `bm25_get_current_score()` after a refresh with deletes against a fresh build of the final corpus. It also covers the Python store's own fresh build on an empty database.
4. **Re-run `evals/docs-retrieval/bm25-refresh-rule.mjs` on the Python backend,** both corpora, with the shipped rule. Record the after-fix figures beside the diagnosis's before-fix ones. Add the real-catalog leg (vii) figure on `dce0de74e`, as **Decisions taken before planning** states.
5. **The lock and the rebuild.** State in the service README which statement takes which lock, and that a hand-run measurement supplies its duration.
6. **`test_both_backends_answer_byte_identically` goes green.** This is an acceptance signal, so the branch is not done while it fails.
   - `docs-retrieval-service/tests/test_backend_parity_e2e.py`'s case passed twice at `3e0ed0ce`, the commit before the TypeScript fix. It fails at `3063e12c`, that fix's merge, on both runs taken. The failing query is `'what is actually encoded in the barcode printed on the label'`. Both servers return the same five hits with the same scores, but results 4 and 5 are swapped: TypeScript returns `docs/labels.md#the-routing-barcode` then `#label-anatomy`, Python the reverse. Both score 0.429 as displayed.
   - The lead is that TypeScript now ends a refresh on a rebuilt index while Python still ranks from its unspilled fresh build. That is research, not a decision: re-verify it.
   - **A failure of this case after the fix is a stop.** It is not a residual under **Decisions taken before planning**, and it is not something to fix by editing the test or its expected output.

## Constraints

- Both backends must issue the same end-state statements for the same refresh outcome.
- **Never score with the index scan disabled.**
- Do not work around an extension defect with a retry, re-score, average or tolerance.
- **Do not retune** the abstention threshold, the floor, `k` or any fusion weight.
- `scripts/run-gates.sh` must pass with no Docker and no Python weights.
- Wall-clock figures come only from an operator's hand run.

## Out of scope

- Correcting the backend comparison's record and re-taking its `@python` arms (`chore_docs_retrieval_backend_comparison_record`).
