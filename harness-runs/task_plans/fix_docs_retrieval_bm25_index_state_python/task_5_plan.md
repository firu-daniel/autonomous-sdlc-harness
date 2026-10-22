### Task 5 — Re-run the refresh-level probe on the Python backend, both corpora, with the shipped rule

**Goal:** Take goal 4's after-fix figures: `evals/docs-retrieval/bm25-refresh-rule.mjs` on `--backend python`, on `fixture-catalog` and on `self-docs`, now that the package's own refresh ends in the end state, each run taken twice and compared, into scratch captures Task 8 records beside the diagnosis's before-fix Python figures. Bring the module's header up to date with the Python refresh.

**Depends on:** Task 3, which makes the Python package's `index` sub-command (`refresh.py` → `refresh_index`) end every refresh that wrote, and every refresh whose `index_state` is not `rebuilt`, with `REINDEX INDEX chunks_bm25` through `DocStore.rebuild_indexes()`. On this commit, each scenario's `before` reading on Python is therefore the shipped end state, as it has been on TypeScript since `3063e12c`.

**Where this task stops.** It records no figure in a document: **Task 8** owns `docs/retrieval-eval-results.md` and reads this task's captures. It changes no statement the module issues and no reading it takes. It runs no TypeScript backend: nothing the TypeScript backend ranks by changes on this branch.

### Targets

- `evals/docs-retrieval/bm25-refresh-rule.mjs` — the module header only.

**Work:**

- [ ] **The header.** Replace *"on Python, the state its own refresh leaves"* with the Python counterpart of the TypeScript clause before it: on Python, `refresh_index` likewise ends every refresh that wrote anything, and every refresh whose index is not marked rebuilt, by issuing `END_STATE_STATEMENTS` through `DocStore.rebuild_indexes()` (`docs-retrieval-service/src/harness_docs_retrieval/refresh.py`). Change nothing else in the file: `refreshLine`'s *"not reported by indexPythonCorpus, taken as false"* stays true, because `RefreshResult` keeps its shape and the candidate rule's `rebuilt` input is still unreported on Python.
- [ ] **The preconditions.** `npm run build`. The compose `postgres` service up, and its versions read with `docker exec harness-docs-retrieval-postgres-1 psql -U harness -d docs_retrieval -At -c "SELECT version()"`, `… -c "SHOW pg_textsearch.library_version"` and `… -c "SELECT extname, extversion FROM pg_extension ORDER BY extname"`: PostgreSQL 18.6, `pg_textsearch` 1.5.1, `vector` 0.8.7. The Python environment synced with the `models` extra and the weights present, as `docs/retrieval-eval.md` → `### The Python backend` lists. Create `harness-runs/scratch/bm25-refresh-rule.mjs` and `harness-runs/scratch/bm25-history.mjs` exactly as `docs/retrieval-eval.md` → `### The BM25 index-state probe` gives them, where absent. Write the three version readings with the Write tool to `harness-runs/scratch/fix-bm25-python/versions.txt`.
- [ ] **`fixture-catalog`, twice, then compared**, each command one plain foreground call from the repository root:
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend python --corpus fixture-catalog --other self-docs --capture harness-runs/scratch/fix-bm25-python/shipped-python-fixture-catalog-1.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend python --corpus fixture-catalog --other self-docs --capture harness-runs/scratch/fix-bm25-python/shipped-python-fixture-catalog-2.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --compare harness-runs/scratch/fix-bm25-python/shipped-python-fixture-catalog-1.txt --compare harness-runs/scratch/fix-bm25-python/shipped-python-fixture-catalog-2.txt
  ```
  These are `docs/retrieval-eval.md`'s Python refresh-level commands at the default `--end-state candidate`, with the capture paths moved under `fix-bm25-python/`. Keep each run's stdout verbatim in the return, or, where it is too long, write it with the Write tool beside its capture as `…-<n>.stdout.txt`.
- [ ] **`self-docs`, the same way**, with `--corpus self-docs --other fixture-catalog` and captures `shipped-python-self-docs-1.txt` / `-2.txt`, then their `--compare`. Note each run's `corpus A:` stamp; this task edits no file under `docs/`, so both runs share one stamp. A run the tool layer moves to the background is collected through its own exit notification, never polled with `sleep` or `Monitor`.
- [ ] **The reading, for Task 8**, written with the Write tool to `harness-runs/scratch/fix-bm25-python/summary.md`: per corpus and scenario, the last refresh's counts, the candidate decision, the statement issued, the `before` and `after` `≠ ref` counts against `reference-reindex` in `scan` and in `operator`, the largest difference with its query and key where any, and the store plan before and after; each pair's `--compare` result; the versions; the commit (`git rev-parse HEAD`).

**Stops — each returns `blocker:` with the reading:**

- A `before ≠ ref` difference against `reference-reindex` that is not the ruled residual shape — one hit, `operator` identical, index summary identical. A ruled-shape residual is recorded in the summary, not attributed, and is not a stop.
- A precondition missing: the compose service down, the versions differing, the models extra or the weights absent. Name which, and the command that provisions it; fetch no weights over a refused network.

**Verification:**

- All four captures, both `--compare` results, `versions.txt` and `summary.md` exist under `harness-runs/scratch/fix-bm25-python/`, which is gitignored.
- Every run exited 0 and raised no collision refusal.
- `git diff --stat` lists only `evals/docs-retrieval/bm25-refresh-rule.mjs`, and `git diff -- evals/docs-retrieval/bm25-refresh-rule.mjs` touches only lines inside the opening `/** … */` header.
- No time figure is taken or written anywhere.

**Deviations from plan:**

- `summary.md` was not written. The Write tool refused it with `Subagents should return findings as text, not write report files. Include this content in your final response instead.`, and the implementer did not route the write around that refusal. The summary's full content is in the implementer's return, for the orchestrator to place at `harness-runs/scratch/fix-bm25-python/summary.md` or to hand to Task 8 directly. The verification bullet *"… and `summary.md` exist"* is therefore unmet for that one file. The other five artifacts exist: the four captures and `versions.txt`. Both `--compare` results are recorded in the return.
- Each run's stdout went past the tool output limit. The harness saved each one to a tool-results file, and `cp` copied that file verbatim beside its capture as `shipped-python-<corpus>-<n>.stdout.txt`, not the Write tool, so the copy is byte-exact.
- `bash scripts/python-service.sh run self-check`, run bare as a precondition probe, printed `ok` for packages (python 3.14.7) and weights, and `FAIL index` only because no service `harness.config.json` exists outside the eval's own mirror. The four runs passed `assertPythonBackendAvailable` and exited 0, and that is the evidence the precondition held.
