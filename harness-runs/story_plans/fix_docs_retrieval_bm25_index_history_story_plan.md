# Story: BM25 scores that depend on the index's history — measured, fixed on both backends, recorded

## Context

`feat_docs_retrieval_backend_comparison` found that the Python docs-retrieval backend's lexical (BM25) scores depend on what its database held before, and recorded the finding without acting on it (`docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → the paragraph opening **Finding — a defect, recorded and not acted on.**, and `### Divergence sources, in the order checked`, item 3). This branch measures the cause, fixes it on every backend that carries it, pins the fix with a test on each, explains or records the near-tie ordering, and corrects the comparison's record.

**What the planning session established, and what it did not.** These are leads the tasks re-take under a committed probe. None of them is a figure of record.

- **The `pg_textsearch` 1.3.1 source** (tag `v1.3.1` of `github.com/timescale/pg_textsearch`) composes BM25's `N` and average document length from `metap->total_docs` / `metap->total_len` plus the in-flight memtable's own totals (`src/scoring/bm25.c` → the `total_docs64` / `total_len64` composition). Postgres never calls an index access method on a `DELETE` or an `UPDATE`, so every dead heap tuple stays counted until `VACUUM`. `VACUUM` then spills the memtable to a segment and flips the dead documents' bits in that segment's alive-bitset, but `total_docs` tracks `Σ segment.num_docs`, which a bitset flip does not change. Only a segment whose every document is dead is dropped and subtracted (`src/access/vacuum.c` → `tp_bulkdelete`, Phase 3; `src/index/metapage.h` → the `total_docs` invariant comment). A merge excludes dead documents (`src/segment/merge.c`), and a `REINDEX` rebuilds from live rows only.
- **A planning probe on PGlite with a persistent data directory**, `pg_textsearch` 1.3.1, raw statements against a `chunks` table carrying `BM25_INDEX_DEFINITION`. After deleting 30 of 33 rows, the survivors scored −0.163228 against a fresh index's −1.497972. Reopening the directory changed nothing, and `VACUUM chunks` changed nothing. `REINDEX INDEX chunks_bm25` restored −1.497972 exactly. Two `ON CONFLICT … DO UPDATE` writes of one key skewed the scores again (−0.843103), and a second `REINDEX` restored them. At real paragraph lengths (41 to 383 words, 58 rows), a fresh-insert index, the same index after `REINDEX`, and a fresh index after a `VACUUM` spill scored the top five of three queries identically to six decimals. `SELECT bm25_summarize_index('chunks_bm25')` prints `total_docs` and `total_len`, so the probe can show the dead rows being counted directly rather than inferring it.
- **Consequences for the prompt's leads.** "Rows from other corpora" and "deleted rows still counted" are one defect: a refresh deletes the other corpus's keys, and their tuples stay in the statistics. The TypeScript persistent index carries the defect too, because PGlite runs the same extension and has no autovacuum, so goal 3 is expected to become a fix rather than a recorded absence. Task 2 measures that rather than assuming it.

**The fix route, decided with the maintainer.** At the end of a refresh that left a dead tuple behind, the store runs `REINDEX INDEX chunks_bm25`. A dead tuple is left behind when the refresh cleared the table (an embedder change), deleted any key, or re-embedded a key that was already stored, which is an `ON CONFLICT … DO UPDATE`. A refresh that only inserted new keys, or changed nothing, pays nothing. The alternatives are rejected. `VACUUM` is rejected on both the source and the probe. Indexing each corpus into its own database fixes the eval but not an adopter's refresh, as the task prompt says. `RefreshResult` keeps its shape on both backends, so neither the wire nor the parity surfaces move. The rule is the same on both backends, and each states it once, in its refresh module.

**Why the measurement tasks come before the fixes.** The ship order is Tasks 1 to 3 (`general`), then Tasks 4 and 5 (`cli`), then Tasks 6 to 9 (`general`), which departs from catch-all-last for the measurement tasks only. Goal 3's before-fix figures are refresh-level: `docs index` into a data directory, then a refresh after deletes. They can only be taken while the code they measure is still unfixed. Tasks 1 to 3 change no shipped behaviour. They commit probes and record figures. Within the fix itself the order is bottom-up: the TypeScript store, which the Python package ports, ships first, then its Python port.

**The re-take, decided with the maintainer.** Task 9 re-runs both `@python` blocks through the existing launchers, so arms B, D and E are re-taken from the blocks themselves. The database is deliberately not emptied first, and that is recorded, because the re-take is then itself evidence that the history no longer matters. Every wall-clock figure in the write-up stays as the 2026-10-08 sitting recorded it, and the write-up says that it predates the fix. The re-run blocks' own latency columns are labelled as a post-fix, non-idle measurement and are cited nowhere (`harness-runs/lessons.md` → `## Evidence and measurement` → the wall-clock rule).

**Top risks:**

1. **A `REINDEX`-built index scoring differently from a fresh-insert one at real chunk lengths.** Segments store document lengths above 39 tokens approximately (`src/segment/fieldnorm.h`: about 6% relative error), and the planning probe compared only the top five of three queries over 58 rows. If any hit of any query on `fixture-catalog` or `self-docs` differs between the two, the rule cannot meet goal 2. Task 1 checks every hit, and a difference stops the branch and is reported to the maintainer. It is never absorbed into a tolerance.
2. **The rebuild holds a lock.** `REINDEX INDEX` takes an `ACCESS EXCLUSIVE` lock on the index while it runs. On the Python backend, a second server sharing the database waits for that long. Within one Python server, calls are already serialised under `session.lock` (`docs-retrieval-service/src/harness_docs_retrieval/service.py` → `answer`'s `async with session.lock`), so a refresh's rebuild never races a search in the same process. Its cost on `self-docs` is a wall-clock figure, so it enters a document of record only from an operator's hand run (Task 1 ships the seam, and Task 9 transcribes the capture).
3. **A test that passes for the wrong reason.** A refresh test whose fresh index and refreshed index both carry dead rows, or neither does, would pass with or without the fix. Tasks 5 and 7 are each shown failing with the rebuild call removed before they are accepted.

**Manual setup required** (before `/autonomous-sdlc-harness:branch-implement-plan`, from the repository root unless stated otherwise):

- `bash scripts/python-service.sh sync --with-models`: this worktree's Python environment is not synced. The weight cache under `~/.cache/harness-docs-retrieval/models` is present, so no weight is downloaded.
- From `docs-retrieval-service/`: `docker compose up -d --wait postgres`.
- After Task 1 lands, the `self-docs` rebuild-cost capture, taken by hand outside any headless session on an otherwise idle machine, with the command Task 1 documents. Task 9 transcribes it if it exists, and records the cost as not measured by hand if it does not.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committing role flips each one to `[x]` as that task's commit lands. `[ ]` markers anywhere else are informational only.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_docs_retrieval_bm25_index_history/task_<K>_plan.md`.

1. [ ] **Task 1** — Commit the statement-level BM25 history probe and record what it measures on PGlite and on the compose Postgres _(layer: general)_ _(points: 8)_
2. [ ] **Task 2** — Measure the refresh-level history dependence on both backends before the fix _(layer: general)_ _(points: 5)_
3. [ ] **Task 3** — Explain the near-tie ordering on an empty database, or record it as still unexplained _(layer: general)_ _(points: 5)_
4. [ ] **Task 4** — Rebuild the BM25 index after a refresh that leaves a dead row, in the TypeScript store and refresh _(layer: cli)_ _(points: 5)_
5. [ ] **Task 5** — Pin the TypeScript fix with a refresh-against-fresh-index score test _(layer: cli)_ _(points: 5)_
6. [ ] **Task 6** — Port the rebuild to the Python store and refresh, with its statement-parity assertion _(layer: general)_ _(points: 5)_
7. [ ] **Task 7** — Pin the Python fix with a container test beside the package's own _(layer: general)_ _(points: 5)_
8. [ ] **Task 8** — Re-take the refresh-level measurement after the fix and correct the behaviour documents _(layer: general)_ _(points: 3)_
9. [ ] **Task 9** — Re-take the `@python` blocks and correct the comparison's record _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Update the defect paragraph and item 3 in `docs/retrieval-eval-results.md` to what this branch measured and fixed."* It is widened to every documentation site stating that the lexical scores depend on the index's history, or describing the refresh this branch changes, because the fix makes each such site stale.

**Derivation entry — corpus files (command).** Re-run verbatim from the repository root:

```
git grep -nE "index's history|database's history|depend on what its|delete-and-insert|\*\*Incremental refresh\.\*\*|near-tie" -- docs docs-retrieval-service/README.md
```

**Derivation entry — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** that ledger. **Traversal:** its topic headings in file order, then the rules under each. **Decision rule:** a rule is reached when it names BM25, the retrieval refresh, or this comparison's figures. None is reached: the `## Evidence and measurement` rules govern how this branch measures, and Task 1, Task 9 and risk 2 apply them, but none states a fact this branch makes stale.

**Closure invariant:** every site either entry reaches appears as a row below.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/retrieval-eval-results.md` → `### Which case this is` ("which is the Python index's history in its database") | — | command entry, `index's history` | `change` | Task 9 |
| 2 | `docs/retrieval-eval-results.md` → `### Which case this is`, unexplained bullets ("how arms D and E split between the index's history and model precision"; "two near-tie swaps in arm B that remain on a fresh database") | — | command entry, `index's history`, `near-tie` | `change` | Task 9 |
| 3 | `docs/retrieval-eval-results.md` → `### Divergence sources, in the order checked`, item 3 (**What it shows.** "the Python database's history", "delete-and-insert path, and was not measured"; **What stays unexplained.** "near-tie pair") | — | command entry, `database's history`, `delete-and-insert`, `near-tie` | `change` | Task 9, from Tasks 1–3's measurements |
| 4 | `docs/retrieval-eval-results.md` → item 4, **Arms D and E** ("carry the database's history") | — | command entry, `database's history` | `change` | Task 9 |
| 5 | `docs/retrieval-eval-results.md` → **Finding — a defect, recorded and not acted on.** ("depend on what its database held before") | — | command entry, `depend on what its` | `change` | Task 9 |
| 6 | `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`, step 3's paragraph ("corpus *and* the database's history") | — | command entry, `database's history` | `change` | Task 8 |
| 7 | `docs/retrieval.md` → **Incremental refresh.** | — | command entry, `**Incremental refresh.**` | `change` | Task 8 — gains the rebuild rule |
