### Task 2 — Measure route 2 at refresh level on both backends and both corpora, opening the fix branch's results subsection

**Goal:** Take the measurement the diagnosis named and did not take (task prompt, Leads, **Measurement.**): *"Goal 5's six scenarios, on both backends and both corpora, with `REINDEX` issued wherever the candidate rule issued the spill and in the `unchanged` scenario. Grade each against `reference-reindex`, and read the store's `LIMIT 50` plan as goal 5 did."* Record it beside the diagnosis's figures, in the new subsection this task opens.

**Depends on:** Task 1. It adds `--end-state route-2` to `evals/docs-retrieval/bm25-refresh-rule.mjs`, where every scenario issues `REINDEX INDEX chunks_bm25` after its last refresh and prints the candidate decision beside it. This task runs that flag with the module's built-in corpora only, and changes no line of the module.

**Where this task stops.** It owns:

- the new `### Route 2 on the fix branch` heading and lead paragraph;
- its first part, `#### Route 2 at refresh level, issued by hand`;
- one clause in the lead paragraph of `## The BM25 index's state, measured`.

The real catalog is Task 6's. Relevance is Tasks 4 and 9's. It proposes nothing: the decision is already route 2, and the code is Tasks 7–8's. **The fix's detection premise rests on this task.** `## Context` records that an index the shipped code left is detected by a meta marker and rebuilt. So the `unchanged` scenario's `after` reading must match the reference on every backend and corpus. **If any `after` reading differs from `reference-reindex` on any hit, in either column, stop and report:** route 2's premise does not hold as measured, and the maintainer decides. Do not write the part in that case.

### Targets

- `docs/retrieval-eval-results.md`:
  - new `### Route 2 on the fix branch`, directly after `#### The lexical-plan crossover, on 1.5.1` and before `### The recommendation for the fix branch`, with its lead paragraph and `#### Route 2 at refresh level, issued by hand`;
  - the lead paragraph of `## The BM25 index's state, measured`, which gains one clause naming the new subsection among what the section records.

**Work:**

- [ ] **Preconditions**, each read before any run, with the result recorded in the part's setup:
  - Read `SHOW pg_textsearch.library_version` and both extensions' `extversion` on PGlite and on the compose Postgres. Both must read `pg_textsearch` 1.5.1 and `vector` 0.8.7, and the compose server must read PostgreSQL 18.6. Stop and report otherwise, and label no figure.
  - Run `npm run build`.
  - Run `bash scripts/python-service.sh sync --with-models` in this checkout: the environment is per checkout (task prompt, `## Environment preconditions`). If the sandbox refuses its network access, return a transient `blocker:` naming that command as the operator's step.
  - Confirm that the Python weights are under `~/.cache/harness-docs-retrieval/models`. Never fetch them.
  - A bare `bash scripts/python-service.sh run self-check` reporting `FAIL index` with `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` unset is expected. The `--backend python` path's own availability check is the one that counts.
- [ ] **The runs**: the four refresh-level commands of `docs/retrieval-eval.md` → `### The BM25 index-state probe`, each with `--end-state route-2` added, through `harness-runs/scratch/bm25-refresh-rule.mjs` (created as that section gives it, if absent).
  - Each `--capture` goes to `harness-runs/scratch/fix-bm25/route-2-<backend>-<corpus>-1.txt`.
  - Take each `python` run a second time into `-2.txt`, and compare each pair with the probe launcher's `--compare` (`harness-runs/scratch/bm25-history.mjs`, created as that section gives it). A value the comparison lists is recorded as a one-run value, never dropped.
  - Take all six runs before editing the document. Note each run's `self-docs` stamp, and the commit it was taken at.
- [ ] **The part**: one table per backend and corpus, with the columns of `#### The candidate end-state rule, at refresh level, on 1.5.1`, plus a column for the candidate decision:
  - scenario, last refresh, candidate decision, statement issued;
  - `before` ≠ ref and `after` ≠ ref against `reference-reindex`, in both columns;
  - the largest `after` difference;
  - the store plan, before → after.

  Under the tables, write:
  - **The verdicts** against `reference-reindex`.
  - **The `unchanged` scenario**, read as an index the shipped code left: what its `before` reading's summary shows (memtable documents and segment count), and whether the `REINDEX` brought it to the reference.
  - **The store's `LIMIT 50` plan**, including every reading where `REINDEX` turned it to `Seq Scan on public.chunks`, with the corpus size beside the 63-row crossover.
  - **Against the candidate rule**: per scenario where the candidate rule issued the spill, whether route 2 differs from the reference where the spill did. The comparison is with `#### The candidate end-state rule, at refresh level, on 1.5.1`: value for value on `fixture-catalog`, and structurally on `self-docs` when the stamps differ (`### The deciding figures on pg_textsearch 1.5.1`, **The comparison rule.**).
- [ ] **The subsection's lead**, written once, here:
  - who reads it: the maintainer and the next reader of the fix;
  - what it holds: route 2 measured with its statement issued by hand, the real-catalog figure, the relevance and vector-arm figures before and after the fix, and the shipped end state read at refresh level;
  - that its comparison rule is `### The deciding figures on pg_textsearch 1.5.1` → **The comparison rule.**, cited and not restated;
  - that its probe setup is `### How the probe reads a score, and the setup`, likewise cited.

  Add the one clause to `## The BM25 index's state, measured`'s lead.
- [ ] **No wall-clock figure**, and no `--reindex-cost`. The part records counts, values and plans only.

**Verification:**

- All six runs completed. Every summary reads `pg_textsearch: 1.5.1` and names the `route-2` end state. Both Python pairs were compared.
- Each of the four tables has all six scenarios, and each verdict names its backend, corpus, scenarios and hit counts and cites its table.
- Every `after` reading reads 0 hits against `reference-reindex` in both columns. Anything else stopped the task, per **Where this task stops**.
- `git diff docs/retrieval-eval-results.md` adds lines only inside the new subsection, plus the one clause in the section lead. The generated region is untouched.
- `git diff --stat` lists `docs/retrieval-eval-results.md` only. `evals/docs-retrieval/bm25-refresh-rule.mjs` is unchanged.
