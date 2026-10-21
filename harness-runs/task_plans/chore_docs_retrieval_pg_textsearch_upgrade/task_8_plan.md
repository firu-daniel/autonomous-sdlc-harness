### Task 8 — Re-take the states sequence and the near-tie pairs on 1.5.1, opening the new results subsection

**Goal:** Re-take goal 1 of the diagnosis, the states sequence on both engines and both corpora, and goal 4, the `fixture-catalog` near-tie pairs, with the committed probe, on `pg_textsearch` 1.5.1. Open `### The deciding figures on pg_textsearch 1.5.1` in `docs/retrieval-eval-results.md`, holding these figures beside the 1.3.1 ones, and say for each figure whether 1.5.1 changed it.

**Depends on:**

- **Task 3**: PGlite 0.5.10 with `pg_textsearch` 1.5.1 installed.
- **Task 6**: the default compose project rebuilt on `v1.5.1`.
- **Task 7**: the Python store's old-index handling landed, so the engines this task measures run the code the branch ships.

**Where this task stops.** It owns the new subsection's lead paragraph and three `####` parts:

- `#### How these were taken, on 1.5.1`;
- `#### The score each index state ranks by, on 1.5.1`;
- `#### The near-tie ordering, on 1.5.1`.

Later tasks add their own parts below these, in order: **Task 9** the stray, **Task 10** the refresh rule, **Task 11** the relevance figures, **Task 12** the crossover. This task does not touch any 1.3.1 subsection, the generated region, `### The recommendation for the fix branch` (Task 13's), or `docs/retrieval-eval.md`.

### Targets

- `docs/retrieval-eval-results.md`: the new subsection, placed directly before `### The recommendation for the fix branch`.
- `evals/docs-retrieval/bm25-history.mjs`: the one doc-comment sentence naming `pg_textsearch` 1.3.1.

**Work:**

- [ ] **Read the versions before any run.**
  - Run `npm run build`.
  - PGlite: a scratch probe through `bash scripts/scratch-run.sh` printing `SHOW pg_textsearch.library_version` and both extensions' `extversion` on a fresh in-memory instance.
  - Compose: `docker compose -f docs-retrieval-service/compose.yaml exec -T postgres psql -U harness -d docs_retrieval -c "SHOW pg_textsearch.library_version"`, and the `extversion`s of a database the probe creates.

  If either engine does not read `1.5.1` for both, stop and report. Each probe run also prints `pg_textsearch: <extversion>` in its summary, and every run's line must read `1.5.1`.
- [ ] **The runs**, with the commands of `docs/retrieval-eval.md` → `### The BM25 index-state probe`, through `harness-runs/scratch/bm25-history.mjs` created as that subsection gives it. Take the states sequence twice per engine and corpus, eight runs, each with `--capture harness-runs/scratch/bm25-history/v151-<engine>-<corpus>-<1|2>.txt`, and compare each pair with `--compare`. Take every run before editing any document, and note each `self-docs` run's `{ files, chunks }` stamp. If a step's probe plan is not the index scan, the probe re-scores it under its own forced index scan. Record which reading each figure is.
- [ ] **`bm25-history.mjs`**: amend the doc-comment sentence *"because `pg_textsearch` 1.3.1 computes a score two different ways (tag `v1.3.1` …)"* so that it says the module was written against 1.3.1 and re-run unchanged on 1.5.1. No statement, flag or logic changes, so `git diff` of the file is comment-only.
- [ ] **The lead paragraph and `#### How these were taken, on 1.5.1`.**
  - **Lead.** Who reads the subsection; that the 1.3.1 subsections above stay as they were; that every statement, step and column is the one `### How the probe reads a score, and the setup` defines, cited rather than restated; and the comparison rule. On `fixture-catalog` a figure is compared value for value. On `self-docs` it is compared value for value only at an equal stamp, and otherwise by structural outcome, with both stamps named.
  - **The setup part.** Both engines' `version()` strings, `pg_textsearch.library_version`, and both extensions' `extversion`. That includes `vector`: `0.8.7` on PGlite and `0.8.1` on the compose image, which `docs-retrieval-service/postgres/Dockerfile` record 2 explains. Also the corpora and their stamps, the runs and dates, and a pointer to `docs/retrieval-eval.md` → `### The BM25 index-state probe` for the commands.
- [ ] **`#### The score each index state ranks by, on 1.5.1` and `#### The near-tie ordering, on 1.5.1`.**
  - **The state tables.** The four per-engine-and-corpus tables, with the same columns as the 1.3.1 tables, and the **State against state.** table.
  - **One-run values.** Every value a `--compare` pair listed, recorded and never dropped.
  - **Which build forms score alike.** For example, whether `t3` / `t4` still differ on no hit, and whether `t1` still differs from `t3` on `self-docs`.
  - **The near-tie table.** For both `q-fc-token-lifetime` and `q-fc-unreadable-label`, in each state, from diagnostic (f): whether each pair is still returned against `operator`'s order at `t0`, and in no spilled state.
  - **Changed or unchanged.** After each table, one line per figure saying whether 1.5.1 changed it against its 1.3.1 counterpart, citing that counterpart's table and row.

**Verification:**

- Every probe run's summary reads `pg_textsearch: 1.5.1`, and the setup part's version readings come from this task's own reads.
- Each of the four pairs was compared. Every value a comparison listed appears in the part, as a one-run value.
- Every `self-docs` figure carries its stamp. No `self-docs` comparison against a 1.3.1 count states "unchanged" or "changed" across two different stamps without naming both.
- `git diff docs/retrieval-eval-results.md` adds lines only between the end of `### Whether either mechanism moves relevance` and the `### The recommendation for the fix branch` heading. `git diff evals/docs-retrieval/bm25-history.mjs` changes comment lines only.
- No figure in the new parts is a wall-clock figure, and no line points at a capture file.
