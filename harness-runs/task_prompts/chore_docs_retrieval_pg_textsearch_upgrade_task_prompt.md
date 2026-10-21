`chore_docs_retrieval_pg_textsearch_upgrade` moves both docs-retrieval backends from `pg_textsearch` 1.3.1 to 1.5.1, then re-takes the BM25 diagnosis's deciding figures on 1.5.1. The fix for the BM25 scores' dependence on the index's state is the next branch, and it is designed on the version this branch ships.

**Why now.** `chore_docs_retrieval_bm25_scoring_diagnosis` measured everything on 1.3.1. That was the only version PGlite bundled when the compose image was pinned to match it. Read `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured`, all of it, and its `### The recommendation for the fix branch` first.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** Checked by hand on 2026-10-20, and re-verified by the planner against the live packages and the upstream tags.

---

## Leads

- **PGlite now bundles 1.5.1.**
  - `@electric-sql/pglite-pg_textsearch@0.0.12` was published 2026-10-14. Its `dist/pg_textsearch.tar.gz` carries `pg_textsearch.control` with `default_version = '1.5.1'`, plus upgrade scripts from `pg_textsearch--1.3.1--1.4.0.sql` through `pg_textsearch--1.5.0--1.5.1.sql`.
  - It declares `@electric-sql/pglite` 0.5.10 as its dependency. `@electric-sql/pglite-pgvector@0.0.11` declares the same.
  - None of the three packages declares an `engines` field at those versions (checked 2026-10-21).
  - `cli/package.json` pins `@electric-sql/pglite` 0.5.8, `@electric-sql/pglite-pg_textsearch` `^0.0.10` (which on a `0.0.x` version admits 0.0.10 only) and `@electric-sql/pglite-pgvector` `^0.0.9`. Each is listed in two blocks of that file.
- **Node 20.** Node 20.19.5 is installed at `/opt/homebrew/opt/node@20/bin/node`. It is keg-only and not on `PATH`, and Node 22 stays the default. To run one command on 20, prefix it with `PATH=/opt/homebrew/opt/node@20/bin:$PATH`. Run the CLI's store tests on 20 as well as 22, and report the result. Node 20 support is being retired, so a failure that only happens on 20 is recorded and does not stop the branch. Leave the `engines` floor in `cli/package.json` alone.
- **The compose image** builds `pg_textsearch` from `ARG PG_TEXTSEARCH_TAG=v1.3.1` in `docs-retrieval-service/postgres/Dockerfile`. Its header comment, record 1, explains why 1.3.1 was chosen. `docs-retrieval-service/README.md` → **Extension and server versions.** says the same.
- **What 1.5.1 is expected to change and keep.**
  - `timescale/pg_textsearch#516` was closed 2026-09-29, before `v1.5.0` was released (2026-10-01). Its title: the `<@>` score is not stable within a statement when the index changes.
  - The diagnosis's `### The stray index-scan score` → **Conclusion.** finds the stray consistent with `#516`'s description. The stray is an `operator` reading that disagrees with its own row's `scan` while the memtable is being emptied. So 1.5.1 may remove it.
  - `#573`, mechanism 2 (exact lengths in the memtable, quantized ones in segments and in `<@>`), was filed from this repository. Its text states the source lines are unchanged at `v1.5.1`.
  - `#557`, a wrong top-N before the memtable is spilled, is open on 1.5.1.
  - So mechanism 2 is expected to survive the upgrade. That expectation is a lead to measure, not a figure.

## The goal

1. **Upgrade both engines to 1.5.1.** Bump the three PGlite packages together to versions whose declared `@electric-sql/pglite` agrees. Set the compose image's tag to `v1.5.1`. Update both records of why the tag was chosen. Show that each engine reports `pg_textsearch.library_version` 1.5.1, and the extension's installed version too.
2. **State what happens to a data directory or database that 1.3.1 built,** when the new code opens it. That covers a `docs index` data directory, which is PGlite and also changes PGlite minor version, and the compose database. Make the store handle it, by `ALTER EXTENSION pg_textsearch UPDATE`, a rebuild, or a refusal with a message. Pin the handling with a test that opens a store built by the old packages. The CLI's existing store tests show how a store is opened.
3. **Re-take the diagnosis's deciding figures on 1.5.1,** with the committed probes, unchanged except to name the version they ran on. Use the same commands as `docs/retrieval-eval.md` → `### The BM25 index-state probe`:
   - the states sequence, both engines and both corpora (goal 1 of the diagnosis);
   - the states sequence with `--repeat 30`, and the history sequence with `--repeat 15`, on the compose Postgres with `self-docs` (the stray, goal 3);
   - `evals/docs-retrieval/bm25-refresh-rule.mjs` on both backends and both corpora (goal 5);
   - the `fixture-catalog` near-tie pairs (goal 4).

   Record them in a new subsection of `## The BM25 index's state, measured`, beside the 1.3.1 figures. Do not overwrite the 1.3.1 figures. Say for each figure whether 1.5.1 changed it.
4. **The stray on 1.5.1.**
   - **If it is gone,** say so with the counts.
   - **If it survives,** reduce it to a standalone SQL reproduction that needs nothing from this repository: a script that creates its own table and rows, in the shape of the `#573` reproduction quoted in that issue. Record it beside the figures. Also record whether the memtable is still emptied during a workload that only reads.
5. **The relevance eval on 1.5.1.**
   - Run the deterministic figures on both corpora, fresh state, through the existing launcher.
   - Report every recorded figure that moved against `docs/retrieval-eval-results.md`'s generated region.
   - `scripts/run-gates.sh` must pass. Gate 11 grades the `fixture-catalog` floors in `evals/docs-retrieval/floor.json`. If it fails, stop and report; do not re-record a floor on this branch. An extension upgrade is not in `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule.**'s list of legitimate moves, so that is the maintainer's call.
6. **The lexical-plan crossover.**
   - `docs/retrieval.md` → `## Still open`, the bullet opening **Whether the lexical arm filters to matching chunks on every index.**, records a 63-row crossover. Below it, an index whose statistics describe its rows takes the Seq Scan plan and returns non-matching rows at score `0`.
   - `cli/test/docs-retrieval-store.test.mjs` case (b) asserts that crossover inside a band, and it fails when a `pg_textsearch` or PGlite bump moves it.
   - If it moves, re-measure it and update the band and the bullet together, with the new figure.
   - The next branch's fix ends refreshes in exactly that statistics-bearing state, so this figure matters to it.
7. **Update the recommendation's standing.** Under `### The recommendation for the fix branch`, add a short paragraph saying whether the 1.5.1 figures keep route 2 as proposed. Name the figures that decide it. Do not rewrite the 1.3.1 recommendation.

## Constraints

- **No fix on this branch.** No `REINDEX`, spill or any other end-state change in `cli/src/retrieval/` or `docs-retrieval-service/src/`. Only the version bump and the old-database handling of goal 2.
- **Never score with the index scan disabled,** in a probe or a measurement.
- **Do not work around an extension defect.** Do not retry, re-score, average or apply a tolerance.
- **Do not file or comment on upstream issues.** The maintainer does that, from goal 4's reproduction.
- **Do not retune** the abstention threshold, the floor, `k` or any fusion weight. Leave `harness.config.json` alone, and change no corpus or query set.
- `scripts/run-gates.sh` must still pass on a machine with no Docker and no Python weights.
- **The work needs Docker** (`docker compose up -d --wait postgres` from `docs-retrieval-service/`, after a rebuild of the image) **and the Python weight cache.** If either is missing, stop and say so rather than improvising an install.
- **Every figure in a document of record sits beside the statement, probe and setup that produced it.**
- **Wall-clock figures** enter a document of record only from an operator's hand run on an idle machine (`harness-runs/lessons.md` → `## Evidence and measurement`). That includes any comparison of 1.5.1's speed against 1.3.1's.
- **Keep both engines on the same `pg_textsearch` version.** If PGlite's 1.5.1 package cannot be used on Node 22, stop and report rather than upgrade one engine alone.

## Out of scope

- The route 2 fix and its tests (`fix_docs_retrieval_bm25_index_state_typescript`).
- Correcting the backend comparison's paragraphs (`chore_docs_retrieval_backend_comparison_record`).
- Filing the stray upstream.
