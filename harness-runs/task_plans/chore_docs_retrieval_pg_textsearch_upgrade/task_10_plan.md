### Task 10 — Re-take the candidate end-state rule at refresh level on 1.5.1

**Goal:** Re-take goal 5 of the diagnosis with `evals/docs-retrieval/bm25-refresh-rule.mjs`, unchanged, on both backends and both corpora, on `pg_textsearch` 1.5.1. Record the verdicts against `reference-reindex`, the before-fix figures and the two observations, and say for each whether 1.5.1 changed it. These are among the figures that decide whether route 2 stands, which is Task 13's to state.

**Depends on:**

- **Task 9**, the previous writer of `### The deciding figures on pg_textsearch 1.5.1`. This task's part goes after Task 9's `#### The stray index-scan score, on 1.5.1`. The subsection's comparison rule and its version readings are in Task 8's lead paragraph and `#### How these were taken, on 1.5.1`.
- **Task 4** (TypeScript) and **Task 7** (Python): each store now issues the old-index handling on open. In this module's fresh stores the handling issues nothing, because every extension is already at its default version. Record whether that held.

**Where this task stops.** It owns `#### The candidate end-state rule, at refresh level, on 1.5.1`. It changes no line of `bm25-refresh-rule.mjs`. It never writes the rule into any document as pending work, because the recommendation and its standing are Task 13's (`harness-runs/lessons.md` → `## Evidence and measurement`, the decision-rule lesson).

### Targets

- `docs/retrieval-eval-results.md`: `#### The candidate end-state rule, at refresh level, on 1.5.1`.

**Work:**

- [ ] **Preconditions.**
  - Read `pg_textsearch.library_version` on both engines, which must read `1.5.1` (as Task 8 did); stop and report otherwise.
  - Run `npm run build`.
  - The Python runs need the environment synced with the `models` extra and the weights under `~/.cache/harness-docs-retrieval/models` (`docs/retrieval-eval.md` → `### The Python backend`). If either is missing, stop and say so, and never fetch weights.
- [ ] **The runs**: the four commands of `docs/retrieval-eval.md` → `### The BM25 index-state probe`, its refresh-level paragraph, through `harness-runs/scratch/bm25-refresh-rule.mjs` created as that paragraph gives it.
  - Each `--capture` goes to a `harness-runs/scratch/bm25-history/v151-refresh-rule-<backend>-<corpus>-1.txt` path.
  - Take each `python` run a second time into `-2.txt`, and compare each pair with the probe launcher's `--compare`.
  - Take all runs before editing the document, and note each run's `self-docs` stamp. Each summary prints `pg_textsearch: <extversion>`, which must read `1.5.1`.
- [ ] **The part.**
  - One table per backend and corpus, with the 1.3.1 part's columns: scenario, last refresh, decision, statement, `before` ≠ ref, `after` ≠ ref, largest `after` difference, store plan before → after.
  - **The verdicts** against `reference-reindex`.
  - **The before-fix figures.**
  - **Observation 1**: the store's `LIMIT 50` plan, including whether `REINDEX` still turns it to `Seq Scan` on `fixture-catalog` in `file-edited` and `file-removed`.
  - **Observation 2**: the Python `fresh` `before` reading's near-tie inversions.
  - Every value a Python `--compare` pair listed, counted in its scenario's figure and named.
- [ ] **Changed or unchanged.** One line per 1.3.1 verdict and observation of `### The candidate end-state rule, at refresh level`: whether 1.5.1 changed it, with `fixture-catalog` value for value and `self-docs` by stamp rule. Call out explicitly:
  - the Python `fixture-catalog` `other-corpus` 1-hit residual after `REINDEX`;
  - the TypeScript `self-docs` 1-hit spill residual;
  - the `unchanged` / `none` scenarios.

**Verification:**

- All six runs (four, plus two Python seconds) completed, every summary reads `pg_textsearch: 1.5.1`, and both Python pairs were compared.
- Each of the four tables has all six scenarios. Each verdict names its backend, corpus, scenarios and hit counts, and cites its table.
- `git diff evals/docs-retrieval/bm25-refresh-rule.mjs` is empty. `git diff docs/retrieval-eval-results.md` adds lines only directly after Task 9's part.
- No line in the part proposes the rule or any route as work. It records figures and verdicts only.

**Deviations from plan:**

- **Python precondition (implementer record, 2026-10-21).** The `--backend python` path's own self-check, `assertPythonBackendAvailable` with `--repo <mirror>`, passed: all four Python runs completed with exit 0. The bare `run self-check` FAIL on `index` the dispatch reported was taken without `--repo`, a call the module never makes; it was not investigated further.
- **`fixture-catalog` value-for-value comparison** rests on the figures the 1.3.1 part publishes, not on its captures: no 1.3.1 `refresh-rule-*` capture exists under `harness-runs/scratch/bm25-history/` in this checkout.
- **"The old-index handling issued nothing"** rests on reading its condition false (`pg_available_extensions.default_version` `1.5.1` / `0.8.7` on both engines, read with `docker compose exec … psql` and `harness-runs/scratch/pglite-engine.mjs`; each run's `extversion` `1.5.1`; fresh stores only; no refresh warning), not on a statement trace: `bm25-refresh-rule.mjs` logs no statement a store issues, and the task forbids changing it.
- **Corpus stamp.** `self-docs` read `{ files: 71, chunks: 826 }` (without `F` `{ 70, 815 }`) at commit `5cbd2f60` in all six runs; every `self-docs` count is compared structurally per Task 8's rule. Corpus B's count also moves the `other-corpus` `deleted` input (826 vs 820) and the `other-corpus` `before` values on `fixture-catalog`, which the part says rather than attributing to 1.5.1.
- **Table cross-check.** Each table cell was re-derived from the capture's `score` lines by `harness-runs/scratch/t10-tables.mjs` and `t10-pair.mjs`, and every `≠ ref` count equals the module's own `versus reference-reindex` line.
