### Task 1 — Take the fresh `fixture-catalog` parity reading on both shipped backends and record it as its own subsection

**Goal:** Answer one question with one deterministic reading. Now that both backends end every refresh that wrote anything, and their first build, in `REINDEX INDEX chunks_bm25`, does arm B agree between them on `fixture-catalog`, so that only quantization separates the two? Take the reading through the existing routes, `--backend typescript` and `--backend python`, each `--out` into a scratch file. Compare it with `evals/docs-retrieval/backend-comparison.mjs` → `compareBackends` / `renderBackendComparison` over that scratch file. Record it as the new subsection `### A fresh fixture-catalog reading, both backends as shipped` of `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one`, placed after `### Abstention, query by query` and before `### Latency: the library call and the MCP round trip`.

**Where this task stops.** It writes this one subsection and nothing else in the document. These passages belong to later tasks:

- `### Which case this is`, item 3 and item 4 of `### Divergence sources, in the order checked` say what this reading shows. That is **Task 2's** work, and Task 2 cites this subsection by its exact heading above.
- The section's lead, which must name this subsection, is **Task 3's**.
- No `#573` citation goes here: this subsection reports a reading, not a mechanism.

It edits no file under `cli/`, `docs-retrieval-service/` or `evals/`, and does not touch the generated region.

### Targets

- `docs/retrieval-eval-results.md` — the new subsection `### A fresh fixture-catalog reading, both backends as shipped`, inserted between `### Abstention, query by query` and `### Latency: the library call and the MCP round trip`.

**Work:**

- [ ] **The preconditions and the engine versions**, read before any run, each command one plain foreground call from the repository root:
  - **Build and commit.** Run `npm run build`. Record `git rev-parse HEAD`. `git status --porcelain` must print nothing outside `harness-runs/`.
  - **Compose server.** Run `docker exec harness-docs-retrieval-postgres-1 psql -U harness -d docs_retrieval -At -c "SELECT version()"`, then the same with `-c "SHOW pg_textsearch.library_version"` and with `-c "SELECT extname, extversion FROM pg_extension ORDER BY extname"`. This is the form `fix_docs_retrieval_bm25_index_state_python` read them in. Expected: PostgreSQL 18.6, `pg_textsearch` `1.5.1`, `vector` `0.8.7`.
  - **The compose database's state before the Python run.** With the same `docker exec … psql` form, read `-c "SELECT count(*) FROM chunks"` and `-c "SELECT value FROM meta WHERE key = 'index_state'"`. An error because a table does not exist is itself the reading: record it verbatim. Do not empty the database. The question is about the shipped end state whatever the database held. The setup records what it held, as `docs/retrieval-eval.md` → step 3 asks.
  - **PGlite.** Write the probe `harness-runs/scratch/backend-parity/versions.mjs`. It opens an in-memory PGlite through `evals/docs-retrieval/bm25-history.mjs` → `openPgliteEngine()`, reads `SELECT version()`, `SHOW pg_textsearch.library_version` and `SELECT extname, extversion FROM pg_extension ORDER BY extname`, prints them and closes. Run it with `bash scripts/scratch-run.sh harness-runs/scratch/backend-parity/versions.mjs`. Expected: PostgreSQL 18.6 (PGlite 0.5.10), `1.5.1`, `vector` `0.8.7`.
  - **The Python environment and weights.** Run `bash scripts/python-service.sh run self-check`. `ok` for packages and weights is the pass. `FAIL index` is expected here, because the variable is unset and no service config exists outside the eval's mirror. The Python run's own `assertPythonBackendAvailable` is the final word.
- [ ] **The two runs, into a markers-only scratch file.**
  - **The scratch file.** With the Write tool, create `harness-runs/scratch/backend-parity/results.md` holding exactly two lines: `<!-- eval:generated:start -->` and `<!-- eval:generated:end -->`. It is a tool input, not a report. If the Write tool refuses it, stop with a `blocker:` quoting the refusal. Never `cp` the committed document into it: a failed run would then leave a 2026-10-08 block in the pair.
  - **The runs.** Then, in this order, each one plain foreground command:
    ```
    bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --backend typescript --repeat 1 --out harness-runs/scratch/backend-parity/results.md
    bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --backend python --repeat 1 --out harness-runs/scratch/backend-parity/results.md
    ```
    Create the launcher `harness-runs/scratch/eval.mjs` first if it is absent, with exactly the two lines `docs/retrieval-eval.md` → `## How to run it` gives.
  - **Each run's stamp.** Note each run's printed `{ files, chunks }` stamp. Both must read `{ files: 9, chunks: 41 }`.
  - **After the Python run**, read `SELECT value FROM meta WHERE key = 'index_state'` again with the same `docker exec … psql` form.
- [ ] **The comparison, over the scratch file only.**
  - **The launcher.** Create `harness-runs/scratch/backend-parity/compare-scratch.mjs`. It is the comparison launcher `docs/retrieval-eval.md` → `### Writing the comparison up` gives, with `resultsText` read from `${checkout}/harness-runs/scratch/backend-parity/results.md` instead of `${checkout}/docs/retrieval-eval-results.md`. Nothing else changes.
  - **The run.** Run `bash scripts/scratch-run.sh harness-runs/scratch/backend-parity/compare-scratch.mjs fixture-catalog`. It must not refuse the pair: the same snapshot and the same `--repeat` on both blocks.
  - **What to read.** Read, per arm B to E: recall@1, @3, @5 and MRR per backend; the floor grading (`met` / `short`); the per-query ref lists, giving each arm's *same order* count (five ordered refs identical, negatives included) and each positive's first-relevant-rank change (TypeScript → Python, `0` meaning no relevant hit), read exactly as `### Relevance, side by side` → **Per-query agreement.** defines both; the abstention set on each side; and arm E's `bestRerankScore` per query on each side. Do **not** read or carry the p50 / p95 columns.
  - **The return.** Put the comparison's stdout in your return verbatim, minus its latency columns. If it is too long, put the deterministic parts listed above.
- [ ] **The subsection**, written into `docs/retrieval-eval-results.md` at the position above, standing on its own:
  - **Lead.** Opens with a one-sentence **Who reads this, and what it decides.**: the maintainer reading whether, with both backends ending in the `REINDEX` state on 1.5.1, arm B agrees between them.
  - **The setup.** Covers:
    - the date and the commit;
    - the engines exactly as read: `version()`, `pg_textsearch.library_version` and `extversion` on each;
    - the compose database's `chunks` count and `index_state` before the Python run, and `index_state` after it, stating that the database was not emptied;
    - the Python package `harness-docs-retrieval` and its version from `docs-retrieval-service/pyproject.toml`;
    - the provenance the two blocks read: host, Node, embedder and reranker ids, threshold `0.32`, `k` 5, `--repeat 1`;
    - the stamp;
    - that the stub was unset;
    - that both blocks went to a scratch file holding only the two markers, so the generated region and `evals/docs-retrieval/floor.json` are untouched;
    - the shipped end state each backend's refresh leaves, citing `### The recommendation for the fix branch` → **What shipped.** rather than restating it.
  - **The commands.** The two run commands and the comparison command verbatim, with the body of `compare-scratch.mjs` in a fenced block and `versions.mjs`'s three statements, so the reading can be re-run. Name no scratch file as evidence.
  - **The figures.** The deterministic figures only, as tables: arm, backend, recall@1 / @3 / @5, MRR, floor recall@5, floor MRR. Then the per-query agreement table in the shape of `### Relevance, side by side` → **Per-query agreement.**, for `fixture-catalog` only. Then the abstention sets, and arm E's largest `|typescript − python|` `bestRerankScore` with its query. State that the latency columns were taken in a session and are left out.
  - **The answer, stated plainly.** Either arm B returns the same ordered refs on every query, or name each query where it does not, with both ref lists. Where arm B agrees on every query, the remaining differences are in arms C to E only, and the subsection may say that the models (divergence sources (1) and (2)) are the only measured candidate for them. Where arm B does not, it says so and lists the differing queries as unexplained. State that this reading is not compared value for value with the 2026-10-08 blocks, and why: the 1.5.1 upgrade and the fix on both backends lie between them.
  - **Placement and form.** No line number anywhere. No latency.

**Stops — each returns `blocker:` with the reading:**

- **A precondition missing.** The `docker exec` call fails, so the compose service is down. `self-check` prints `FAIL` for packages or weights. Or a run refuses through `assertPythonBackendAvailable`. Name which, and the command `## Context` → **Manual setup required** gives for it. Provision nothing: `sync` and `fetch-models` reach the network.
- **Versions other than 1.5.1 / 18.6 / 0.8.7** on either engine.
- **Either run's stamp other than `{ files: 9, chunks: 41 }`**, or the comparison refusing the pair.

**Verification:**

- `git diff --stat` lists only `docs/retrieval-eval-results.md`.
- `git diff -U0 -- docs/retrieval-eval-results.md` shows one added block and no removed line. Its hunk starts after the line `git grep -n '^### Abstention, query by query' -- docs/retrieval-eval-results.md` prints, and before the `### Latency: the library call and the MCP round trip` heading. So the generated region, which ends before `## Threshold calibration`, is untouched.
- `git diff --quiet -- evals/docs-retrieval/floor.json` exits `0`.
- `git grep -n '^### A fresh fixture-catalog reading, both backends as shipped$' -- docs/retrieval-eval-results.md` prints exactly one line.
- The new subsection contains no `p50`, `p95` or `ms` figure. A `git diff -- docs/retrieval-eval-results.md | grep -nE 'p50|p95| ms\b'` shows only the sentence stating that the latencies are left out.
- Each arm B to E figure in the subsection equals the comparison output's figure for that arm and backend, as read in your return.
