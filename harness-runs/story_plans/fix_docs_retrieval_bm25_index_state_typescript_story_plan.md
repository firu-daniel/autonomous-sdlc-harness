# Story: Make the TypeScript backend's BM25 ranking independent of the index's history — route 2, measured first, pinned by a test

## Context

This branch implements **route 2** of `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured` → `### The recommendation for the fix branch`. Every refresh that changed something, and the first `docs index` build, ends in the state `REINDEX INDEX chunks_bm25` leaves. A database the shipped code left is brought to that state too. `DocStore.lexicalSearch` returns only matching chunks on every plan. A test fails before the fix and passes after it. **Route 2 still holds.** The paragraph **Its standing on pg_textsearch 1.5.1.** at the end of the recommendation opens *"Route 2 stands, with one qualification narrowed"*, and the 1.5.1 figures (`### The deciding figures on pg_textsearch 1.5.1`) are the ones every task here measures against. The Python service's port (`fix_docs_retrieval_bm25_index_state_python`) and the backend comparison's record (`chore_docs_retrieval_backend_comparison_record`) are out of scope. No task edits code under `docs-retrieval-service/`. Task 11 qualifies one sentence of its `README.md`, which Task 7 would otherwise make false (`## Scope register`, row 38).

**Two planning decisions, binding on every task.**

- **Q1 — a moved floor goes to the maintainer before Task 8 commits. No task writes it.** `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule.** requires a moved floor to be re-recorded in the same commit as the change that moved it. Task 8 is the change that can move `fixture-catalog`'s figures. It is a `cli` task, though, and `evals/docs-retrieval/floor.json` is a `general`-layer file outside its dispatched path scope (`.claude/context/conventions.md` → `## The layers`). No plan-level exception can widen that scope, and no clarification on record for this branch asks for one. So Task 8 reads every `floor.json` row against a fresh `fixture-catalog` run and changes nothing. Where a floored figure moved, it returns `blocker:` before its commit. The blocker names each moved row with its arithmetic (measured figure, minus 0.05, truncated) and the reason line the re-recording commit would carry. The maintainer then decides how the re-record lands with Task 8's change. Where no floored figure moved, Task 8 returns normally and `floor.json` stays untouched. Task 9 records the floor's standing in the document of record. No task edits `floor.json`.
- **Q2 — the fix waits for the user's real-catalog figure, and the run parks for it.** `harness-runs/lessons.md` → `## Evidence and measurement`, first rule, asks for the real-shape figure before the design. Task 1 adds the ad-hoc corpus route to the refresh-rule module, and Task 3 writes the hand-run leg under gate 10. The user then runs that leg on the private 1,960-chunk catalog (corpus id `gate10-catalog`). **Task 6 is the park point.** Until that figure has been supplied, Task 6 returns a `blocker:`, and the orchestrator **parks on it and never assumes past it**. That is the user's own decision (planning answer Q2 (a)), not a case for the ask-vs-assume policy to weigh. Task 6's file carries the self-contained question text under `### The question to raise`. On resume, Task 6 reads the answer and records it, and Tasks 7 onward run after that.

**How the work is cut, and why the catch-all is neither first nor last.** The prompt's goal 1 is *"Take the measurement above first"*, so the order follows dependency rather than layer order:

- Tasks 1–6 (`general`) build the instrument, take the before-fix figures and hold for the real-catalog figure. Task 1 is the module change. Task 2 is the route-2 measurement, on both backends and both corpora. Task 3 is the probe documentation and the gate 10 leg. Task 4 takes the before-fix relevance figures, including the Seq Scan plan. Task 5 takes the vector arm after deletes, and records any vector-index statement that restores full lists as a proposal to the maintainer, never as an end-state entry. Task 6 is the real-catalog record.
- Tasks 7–8 (`cli`) are the fix. Task 7 is the store: the matching-rows filter, the end-state method, the marker constants and the Seq Scan test case. Task 8 is the refresh: the end state, the detection, the history test and the floor reading (Q1).
- Tasks 9–12 (`general`) take the after-fix figures and update the behaviour documents.
- **Task 7 ships before Task 8 on purpose.** A `REINDEX` end state without the filter would put `fixture-catalog`, at 41 chunks and below the 63-row crossover, on a Seq Scan returning score-`0` rows. No commit may leave that state behind.

**The new results subsection.** Task 2 creates `### Route 2 on the fix branch` in `docs/retrieval-eval-results.md`, directly before `### The recommendation for the fix branch`, so that the recommendation stays last and Task 12's closing line can cite the subsection above it. Each later measurement task adds one `####` part and owns only that part, in this order:

1. Task 2: `#### Route 2 at refresh level, issued by hand`
2. Task 4: `#### The relevance eval's deterministic figures, before the fix`
3. Task 5: `#### The vector arm after a refresh with deletes, before the fix`
4. Task 6: `#### Route 2 on the real catalog`
5. Task 9: `#### The relevance eval's deterministic figures, after the fix`
6. Task 10: `#### The shipped end state at refresh level`

Every task that edits a shared file runs strictly after the previous editor of that file and names it under **Depends on:**. Nothing is typed between `<!-- eval:generated:start -->` and `<!-- eval:generated:end -->`. Every eval run writes its `--out` into a scratch file holding only the two markers.

**The design decisions this plan makes, stated once:**

- **The end state is issued by the store and decided by the refresh.** Task 7 adds `DocStore.rebuildIndexes()`, which issues the exported `END_STATE_STATEMENTS` in order. That list is `REINDEX INDEX chunks_bm25` alone. No vector-index statement joins it on this branch: Task 5's figures are fixture-sized, and no real-shape step this branch ships reads arm C after deletes or measures a vector statement's cost (`harness-runs/lessons.md` → `## Evidence and measurement`, first rule). A statement Task 5 finds restoring full lists is recorded there as a proposal to the maintainer. Task 8's `refreshIndex` calls `rebuildIndexes()` after every refresh that wrote anything, and after any refresh that finds the index not known to be in the end state.
- **An index the shipped code left is detected by a meta marker, not by parsing `bm25_summarize_index`.** That function's output is extension-version text. The store's `meta` table gains `INDEX_STATE_META_KEY` (`'index_state'`). A refresh about to write sets it to `INDEX_STATE_PENDING` (`'pending'`) before its first write. It sets it to `INDEX_STATE_REBUILT` (`'rebuilt'`) only after `rebuildIndexes()` returns. A refresh that finds any other value (absent, which is what every database the shipped code built holds, or `'pending'` after an interrupted refresh) rebuilds even when the corpus is unchanged. Task 2's `unchanged` scenario measures that a `REINDEX` brings such an index to the reference. If it does not, Task 2 stops the branch.
- **The matching-rows filter cannot change the plan.** `lexicalSearch` selects the ordering expression's value beside `id` and drops every row whose value is exactly `0`, a row carrying no query term, before ranking. The ordering, the `LIMIT` and the plan node are untouched. Task 7 verifies that with `EXPLAIN` on an index-scan store and on a Seq Scan store. A row at score `0` carries no lexical evidence, so this is the defect's fix and not a retune.
- **The before-fix and after-fix relevance runs share one `self-docs` corpus.** `self-docs` moves whenever a task edits `docs/`, and this branch edits it. Tasks 4 and 9 therefore both read `self-docs` from a snapshot of the branch's base commit `d15e5cc3` (`docs/`, `.claude/context/`, `harness.config.json`, `evals/docs-retrieval/queries/`). A scratch program writes the snapshot under `harness-runs/scratch/fix-bm25/base-corpus/`, and the runs pass it as `--repo`. Task 9 checks that its stamp equals Task 4's, and stops if it does not. `fixture-catalog` is committed and does not move.

**Constraints that bind every task** (task prompt, `## Constraints`):

- The TypeScript backend stays the default, and its search behaviour changes only to fix this defect.
- **Never score with the index scan disabled.** Forcing it, as the probe's `SET enable_seqscan = off` does, is allowed.
- No retry, re-score, average or tolerance works around an extension defect. Exact equality is the test's bar, and a residual is reported, never absorbed.
- The `operator` stray is gone on 1.5.1, so nothing is designed around it.
- Nothing is retuned: not the abstention threshold, not `k`, not a fusion weight. A floor re-recorded under the same-commit rule is not a retune.
- `scripts/run-gates.sh` must pass with no Docker and no Python weights. The new tests use PGlite and no model.
- No wall-clock figure is taken or recorded (`harness-runs/lessons.md` → `## Evidence and measurement`, the wall-clock rule). No task runs the probe's `--reindex-cost`. The rebuild's cost is recorded as unmeasured, beside that seam.
- **The test-run rule binds every task** (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`). No task runs `scripts/run-gates.sh`, `commands.test`, `evals/docs-retrieval/check-floor.mjs` or a test file it neither creates nor edits. Eval and probe runs through `bash scripts/scratch-run.sh` are measurements, not test runs.
- Captures and eval outputs go under `harness-runs/scratch/`, which is gitignored, and no document points at one.
- The corpus behind `gate10-catalog` is identified by its commit, its size and its character, and never by a filesystem path (gate 6a).

**Top risks:**

1. **Shipping a regressing intermediate commit**: the `REINDEX` end state without the filter. Task 7 lands the filter and its Seq Scan case (c) before Task 8 calls `rebuildIndexes()` from the refresh.
2. **A floor lowered out of turn**, or a moved floor left stale. No task writes `floor.json`. Task 8 reads every row against a fresh `fixture-catalog` run. If a floored figure moved, it returns `blocker:` with the margin-rule arithmetic before it commits, so the maintainer routes the same-commit re-record (Q1). Task 9 cross-checks every floor against its own `fixture-catalog` run by reading.
3. **Exact equality failing after the fix.** On 1.3.1 the diagnosis recorded a 9.5e-7 difference between two `REINDEX`es (goal 2, not re-taken on 1.5.1). Task 8's test compares exactly. If it fails after the fix on such a residual, Task 8 stops and reports, and never adds a tolerance.
4. **Gate 4's existing retrieval cases**, on their 9-chunk fixture, now rank through a Seq Scan with the filter. Task 8 cannot run `cli/test/docs-retrieval.test.mjs` (the test-run rule), so a moved assertion surfaces at the Run gates phase and goes to its test-fix loop, which owns it.

**Manual setup required** (see the `## Manual setup required` return section for the same list):

- **Docker running, with the default compose project's `postgres` service up** on the rebuilt `docs-retrieval-service/postgres` image (`pgvector/pgvector:0.8.7-pg18`, PostgreSQL 18.6, `pg_textsearch` 1.5.1 and `vector` 0.8.7 available). Needed by Task 2's Python runs. Task 2 reads the versions before it runs, and stops if they are wrong.
- **The Python weight cache** under `~/.cache/harness-docs-retrieval/models`, needed by Task 2. Task 2 runs `bash scripts/python-service.sh sync --with-models` in its own checkout. If the sandbox refuses that sync's network access, the operator runs the same command in the run copy.
- **The TypeScript model cache** under `~/.cache/autonomous-sdlc-harness/retrieval/models`, needed by Tasks 1, 2, 4, 5, 8, 9 and 10. Each stops if it is absent, and none fetches models.
- **The user's hand run of gate 10's leg (vii) on the private real catalog.** Task 6 parks for it.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets in the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_docs_retrieval_bm25_index_state_typescript/task_<K>_plan.md`. The entries are in ship order, which follows dependency (see `## Context`, **How the work is cut**).

1. [x] **Task 1** — Add the route-2 variant and the ad-hoc corpus route to `evals/docs-retrieval/bm25-refresh-rule.mjs` _(layer: general)_ _(points: 15)_
2. [x] **Task 2** — Measure route 2 at refresh level on both backends and both corpora, opening the fix branch's results subsection _(layer: general)_ _(points: 20)_
3. [x] **Task 3** — Document the probe's new flags and add gate 10's leg (vii), the real-catalog route-2 hand run _(layer: general)_ _(points: 10)_
4. [x] **Task 4** — Take the before-fix relevance figures on both corpora and on the Seq Scan plan _(layer: general)_ _(points: 15)_
5. [x] **Task 5** — Measure the vector arm after a refresh with deletes, and record any vector-index statement as a proposal to the maintainer _(layer: general)_ _(points: 15)_
6. [x] **Task 6** — Record the user's real-catalog route-2 figure — the park point the fix waits on _(layer: general)_ _(points: 8)_
7. [x] **Task 7** — Make `lexicalSearch` return only matching chunks on every plan, and give the store its end-state method _(layer: cli)_ _(points: 20)_
8. [ ] **Task 8** — End every changing refresh, and every index the shipped code left, in the `REINDEX` state, pinned by a history test _(layer: cli)_ _(points: 20)_
9. [ ] **Task 9** — Re-run the relevance figures after the fix and report every figure that moved _(layer: general)_ _(points: 15)_
10. [ ] **Task 10** — Read the shipped end state at refresh level and bring the probe modules up to date with it _(layer: general)_ _(points: 15)_
11. [ ] **Task 11** — Update `docs/retrieval.md` and the Python README's seam sentence: the incremental refresh, the lexical-arm bullet, the rebuild's cost, gate 10's legs and the backends' SQL _(layer: general)_ _(points: 15)_
12. [ ] **Task 12** — Record what shipped under the recommendation, and the probe paragraph's post-fix reading _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt, goal 5: *"**Update the behaviour documents:** `docs/retrieval.md` → **Incremental refresh.**; the lexical-arm bullet under `## Still open`, which this branch closes or narrows; the diagnosis section's recommendation, with a line saying what shipped."* Goal 1's *"record it beside the diagnosis's figures"* and the floor lead's *"re-record the floors in the same commit as the change, with the reason"* widen it. So do the planning decisions. Q1 has Task 8 read `floor.json` and hand a moved floor to the maintainer. Q2 adds the gate 10 leg. Together they reach every document that states the refresh's end state, the lexical arm's matching-rows property, the recommendation, gate 10's legs, the recorded floor or the rebuild's cost. Application source files and their comments are outside the register. `floor.json` is a machine artifact, not prose (`evals/docs-retrieval/README.md`), so it is not a register site. It is no task's target either (Q1).

**Site granularity.** A site is the section a hit sits under: the nearest preceding heading of level 2 to 4 in that file. Where a section is divided by bold run-in paragraph labels, the labelled paragraph is the site instead. `docs/development.md` → `## 5. Verifying a change` is the one such case here: its **Gate 10 — …** and **Gate 11 — …** paragraphs are rows 24 and 25. Every hit under one site is one row, and the row names the hits it covers.

**Derivation entry A — the refresh's end state, the lexical arm and the recommendation (command).** Re-run verbatim from the repository root:

```
git grep -nE "Incremental refresh|refreshIndex|REINDEX|end state|end-state|matching chunks|non-matching rows|lexical arm|lexicalSearch|recommendation for the fix branch|route 2" -- '*.md' ':!harness-runs' ':!examples'
```

**Derivation entry B — gate 10's leg count (command).** Re-run verbatim:

```
git grep -nE "six legs|Six legs" -- '*.md' ':!harness-runs' ':!examples'
```

**Derivation entry C — documents that state or cite the recorded floor (command).** Re-run verbatim:

```
git grep -nE "floor\.json" -- '*.md' ':!harness-runs' ':!examples'
```

**Derivation entry D — documents that describe a docs-retrieval test suite (command).** Re-run verbatim:

```
git grep -nE "cli/test/docs-retrieval" -- '*.md' ':!harness-runs' ':!examples'
```

**Derivation entry E — documents that state what retrieval or a rebuild costs (command).** Re-run verbatim:

```
git grep -nE "^## What it costs|reindex-cost" -- '*.md' ':!harness-runs' ':!examples'
```

**Derivation entry F — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- \*\*' harness-runs/lessons.md`. **Artifact:** the lessons ledger at `harness-runs/lessons.md`, whose rows no path-emitting command reaches. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it constrains any of these, which are what this branch's tasks are made of:

- a measurement;
- a design decision taken on a figure;
- the recording of a decision or of a wall-clock figure;
- a temporary copy a task creates;
- a divergence between the two backends.

**Derivation entry G — documents that state the two backends issue the same SQL (command).** Re-run verbatim:

```
git grep -nE "same SQL|issued unchanged|character for character" -- '*.md' ':!harness-runs' ':!examples'
```

**Closure invariant:** every site any of entries A–G reaches appears as a row below. After implementation, entries A and G also reach the lines this branch adds, and each of them falls inside a row marked `change`. The new `####` parts sit inside row 15's subsection. Task 2's lead clause sits in row 1, and the lines Tasks 3, 11 and 12 add sit in rows 16, 18, 20–24 and 38. `Copy` is `—` throughout, because no site has a mirrored counterpart.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured`, its lead paragraph (*"what still differs after `REINDEX` … the candidate end-state rule"*) | — | A (`REINDEX`, `end-state`) | `change` | Task 2: the lead names the new `### Route 2 on the fix branch` among what the section records. |
| 2 | `docs/retrieval-eval-results.md` → `### How the probe reads a score, and the setup` | — | A (`lexicalSearch`, `REINDEX`) | `no-change` | The 1.3.1 setup record. The setup is unchanged, and every new part cites it. |
| 3 | `docs/retrieval-eval-results.md` → `### The 177-chunk build — this repository's own \`docs/\`, 2026-09-21` (*"Refresh (`refreshIndex`, every chunk embedded)"*) | — | A (`refreshIndex`) | `no-change` | A dated cold-build timing. No wall-clock figure is re-taken. |
| 4 | `docs/retrieval-eval-results.md` → `### The score each index state ranks by` | — | A (`REINDEX`) | `no-change` | 1.3.1 figures, kept as taken. |
| 5 | `docs/retrieval-eval-results.md` → `### What still differs after REINDEX` | — | A (`REINDEX`) | `no-change` | 1.3.1 figures and open items, kept as taken. |
| 6 | `docs/retrieval-eval-results.md` → `### The stray index-scan score` | — | A (`REINDEX`) | `no-change` | 1.3.1 figures. The stray is gone on 1.5.1, and nothing here designs around it. |
| 7 | `docs/retrieval-eval-results.md` → `### The candidate end-state rule, at refresh level` | — | A (`REINDEX`, `end-state`, `lexical arm`) | `no-change` | 1.3.1 figures. The route-2 figures go in Task 2's new part. |
| 8 | `docs/retrieval-eval-results.md` → `### Whether either mechanism moves relevance` | — | A (`REINDEX`, `refreshIndex`), C (`floor.json` untouched) | `no-change` | The diagnosis's relevance record. Tasks 4 and 9 take the fix branch's own figures. |
| 9 | `docs/retrieval-eval-results.md` → `### The trade-off, stated` (*"the lexical arm carries the database-history defect recorded above"*) | — | A (`lexical arm`) | `no-change` | It belongs to the backend comparison's record, which is out of scope (`chore_docs_retrieval_backend_comparison_record`). |
| 10 | `docs/retrieval-eval-results.md` → `### The deciding figures on pg_textsearch 1.5.1`, its lead (*"`### The recommendation for the fix branch` still holds"*) | — | A (`recommendation for the fix branch`) | `no-change` | The 1.5.1 lead, dated. |
| 11 | `docs/retrieval-eval-results.md` → `#### The score each index state ranks by, on 1.5.1` | — | A (`REINDEX`) | `no-change` | 1.5.1 figures, kept as taken. |
| 12 | `docs/retrieval-eval-results.md` → `#### The candidate end-state rule, at refresh level, on 1.5.1` | — | A (`REINDEX`, `end-state`, `lexical arm`) | `no-change` | 1.5.1 figures. Task 2's part is the route-2 counterpart. |
| 13 | `docs/retrieval-eval-results.md` → `#### The relevance eval's deterministic figures, on 1.5.1`, including **The floor check, by reading.** | — | C (`floor.json` ×3) | `no-change` | A dated reading against the floors then in force. Task 9 reads the floors in force after the fix. |
| 14 | `docs/retrieval-eval-results.md` → `#### The lexical-plan crossover, on 1.5.1` (*"The next branch's fix ends refreshes in the state `REINDEX INDEX chunks_bm25` leaves"*; `cli/test/docs-retrieval-store.test.mjs` → `CROSSOVER_ROWS`) | — | A (`REINDEX`, `route 2`), D | `no-change` | A dated record of the 1.5.1 re-take. Case (b) and `CROSSOVER_ROWS` are unchanged by Task 7. |
| 15 | `docs/retrieval-eval-results.md` → new `### Route 2 on the fix branch` and its six `####` parts | — | A, after implementation | `change` | Tasks 2, 4, 5, 6, 9 and 10, one part each, in that order. |
| 16 | `docs/retrieval-eval-results.md` → `### The recommendation for the fix branch` (*"The proposed route is route 2"*, **Its standing on pg_textsearch 1.5.1.**, *"the probe's `--reindex-cost` seam may supply it"*) | — | A (`route 2`, `REINDEX`, `non-matching rows`, `recommendation for the fix branch`), E (`reindex-cost`) | `change` | Task 12 adds one closing line saying what shipped. The 1.3.1 and 1.5.1 text stays as it is. |
| 17 | `docs/retrieval-eval.md` → `## What the runner owns, and what it does not` (*"drives `corpusFiles` → `refreshIndex` → `searchDocs` directly"*) | — | A (`refreshIndex`) | `no-change` | It states the eval's call path, which the fix does not change. |
| 18 | `docs/retrieval-eval.md` → `### The BM25 index-state probe` (*"`--reindex-cost` times one `REINDEX`"*, the refresh-level paragraph) | — | A (`REINDEX`, `end-state`), E (`reindex-cost`) | `change` | Task 3 documents `--end-state` and the ad-hoc corpus flags. After the fix, Task 12 adds one sentence saying what a TypeScript `before` reading is. |
| 19 | `docs/retrieval-eval.md` → `### Writing the comparison up` and `## The regression floor` (*"`floor.json` holds"*, the same-commit rule, the planted-shortfall record) | — | C | `no-change` | The floor policy is followed, not changed. The planted shortfall's quoted floor is a dated measurement. |
| 20 | `docs/retrieval.md` → `## How it fits together`: **Incremental refresh.** (`refreshIndex`); **Store.** (*"`open_postgres_store` issues that same SQL against a real Postgres"*); plus the `docs-retrieval-store-upgrade` citation in **An index older extension versions built.** and the stub's timings | — | A (`Incremental refresh`, `refreshIndex`), D, G (`same SQL`) | `change` | Task 11 rewrites **Incremental refresh.** and qualifies **Store.**: after Task 7, `store.ts` issues `LEXICAL_SEARCH_STATEMENT` and `END_STATE_STATEMENTS`, which `store.py` does not issue until `fix_docs_retrieval_bm25_index_state_python` (row 37), so *"that same SQL"* would be false on Task 7's commit. **An index older extension versions built.** and the stub's timings are dated records and stay unchanged. |
| 21 | `docs/retrieval.md` → `## Measured, and how`: item (b) (*"the 'only matching rows' behaviour belongs to the BM25 index scan"*) and item (d) (*"run by hand, in full, all six legs"*) | — | A (`matching chunks`), B | `change` | Task 11 qualifies item (d)'s leg count as the six legs the gate had on 2026-09-22. Item (b) is a dated measurement of the raw statement, which stays true, and is not edited. |
| 22 | `docs/retrieval.md` → `## Still open`, the bullet **Whether the lexical arm filters to matching chunks on every index.** | — | A (`matching chunks`, `lexical arm`, `lexicalSearch`), D | `change` | Task 11 closes it, citing Task 7's case (c). |
| 23 | `docs/retrieval.md` → `## What it costs`, the TypeScript list | — | E | `change` | Task 11 adds the rebuild after every refresh that wrote anything, its `ACCESS EXCLUSIVE` lock, and its unmeasured wall-clock cost beside the `--reindex-cost` seam. |
| 24 | `docs/development.md` → `## 5. Verifying a change` → **Gate 10 — docs retrieval with the real models.** (*"Six legs."*, *"all six legs, on **2026-09-22**"*) | — | B | `change` | Task 3 adds leg (vii) and keeps the 2026-09-22 run's record true as the six legs it then had. |
| 25 | `docs/development.md` → `## 5. Verifying a change` → **Gate 11 — docs-retrieval relevance floor.** | — | C | `no-change` | It states what the gate runs and cites the floor policy. It carries no floor value. |
| 26 | `evals/docs-retrieval/README.md` → `## The modules`, the `bm25-refresh-rule.mjs` row (*"The candidate BM25 end-state rule measured at refresh level"*), and the `floor.json` row | — | A (`end-state`), C | `change` | Task 1 amends the `bm25-refresh-rule.mjs` row for the route-2 variant and the ad-hoc corpus. The `floor.json` row is unchanged. |
| 27 | `docs/retrieval-eval-results.md` → `### What the move cost` and `### Relevance, side by side` | — | C | `no-change` | Dated statements that those runs left `floor.json` untouched, or graded against it. |
| 28 | `docs/retrieval-eval-results.md` → `### The value this replaces` (*"the abstention cases of `cli/test/docs-retrieval.test.mjs`"*) | — | D | `no-change` | It cites the abstention cases, which this branch does not change. |
| 29 | `docs/cli.md` → the docs-retrieval suites list (*"`cli/test/docs-retrieval.test.mjs` drives `docs index`"*) | — | D | `no-change` | The list names the CLI-driving suites and does not enumerate the store-level ones (`docs-retrieval-store`, `-store-upgrade`, `-rerank-score`). The new `docs-retrieval-refresh-end-state.test.mjs` is a store-and-refresh suite of that unlisted kind. |
| 30 | `cli/templates/claude/qa_test_scenarios.md` (*"backend state no test action can produce"*) | — | A (`end state` inside `backend state`) | `no-change` | A false positive of the pattern, about QA seed data. |
| 31 | `plugin/agents/ui-tests-plan-writer.md` → `### Test data — the QA accounts` | — | A (`end state` inside `backend state`) | `no-change` | A false positive of the pattern, about QA accounts. |
| 32 | `harness-runs/lessons.md` → `## Evidence and measurement`, the rule *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision…"* | — | F (constrains a design decision taken on a figure) | `no-change` | Satisfied rather than falsified. The one design decision this branch takes on a figure is the BM25 route-2 end state, and Task 6 records its real-shape figure before Tasks 7–8 design on it, through Task 3's gate step. The vector-index question is not decided on this branch: Task 5's arm C figures are fixture-sized, so `END_STATE_STATEMENTS` is `REINDEX INDEX chunks_bm25` alone, and any vector statement Task 5 finds is recorded only as a proposal to the maintainer. |
| 33 | `harness-runs/lessons.md` → `## Evidence and measurement`, the rule *"A feature that ships as 'not yet measured' ships the seam that will measure it…"* | — | F (constrains a measurement) | `no-change` | The rebuild's cost ships unmeasured, and the seam already exists (`--reindex-cost`), which times exactly the one statement that ships, the BM25 `REINDEX`. Task 11 names it. No `VACUUM` or HNSW rebuild ships, so no unmeasured statement lacks a seam. |
| 34 | `harness-runs/lessons.md` → `## Evidence and measurement`, the rule *"A decision rule's outcome is a proposal to the maintainer…"* | — | F (constrains the recording of a decision) | `no-change` | The maintainer decided route 2 by queueing this task prompt. Task 12 records what shipped, after it shipped. |
| 35 | `harness-runs/lessons.md` → `## Evidence and measurement`, the wall-clock rule | — | F (constrains a wall-clock figure) | `no-change` | No task takes or records a time figure. |
| 36 | `harness-runs/lessons.md` → `## Remote and branch-scoped operations`, the rule *"A script that creates a temporary working copy or branch removes it on every exit path…"* | — | F (constrains a temporary copy) | `no-change` | Satisfied on every exit path. In Tasks 4 and 9, every exit after the base-commit snapshot is first written runs `base-corpus.mjs --remove` before returning: success, every `blocker:` and every stop. The program removes a partial write itself, and removes only the directory it creates. Each task verifies the snapshot directory is absent when it returns. The refresh-rule module already removes its own mirrors, data directories and databases. |
| 37 | `harness-runs/lessons.md` → `## Ports and parallel implementations`, the rule *"A client-visible divergence from the implementation being ported is justified only by a task-prompt exclusion…"* | — | F (constrains a divergence between the backends) | `no-change` | Satisfied. The Python store keeps the shipped lexical statement and refresh until its own port, and the task prompt's `## Out of scope` line *"The Python service's port (`fix_docs_retrieval_bm25_index_state_python`)"* is the exclusion that justifies the divergence. |
| 38 | `docs-retrieval-service/README.md` → `## The seam, as found`, its opening paragraph (*"**Every SQL statement `store.ts` issues is issued unchanged**"*) | — | G (`issued unchanged`) | `change` | Task 11 qualifies the sentence. After Task 7, `store.ts` issues `LEXICAL_SEARCH_STATEMENT` and `END_STATE_STATEMENTS`, and `store.py` keeps the shipped `lexical_search` statement and issues no end-state statement until `fix_docs_retrieval_bm25_index_state_python`. The code divergence is justified by the prompt's exclusion (row 37), but a document stating there is none would be false. The numbered departures list is unchanged. No code under `docs-retrieval-service/` changes. |
| 39 | `harness-runs/lessons.md` → `## Remote and branch-scoped operations`, the rule *"A command scoped to one branch reads and writes that branch's state only: never create a working copy, record or sync for any other branch as a side effect."* | — | F (constrains a temporary copy) | `no-change` | Satisfied. The only working copy this branch creates is Tasks 4 and 9's snapshot under `harness-runs/scratch/fix-bm25/base-corpus/`, of commit `d15e5cc3`, this branch's own base commit and an ancestor of its `HEAD` (`git merge-base --is-ancestor d15e5cc3 HEAD` exits `0`). It is this branch's state, it is gitignored scratch, and it is removed on every exit path (row 36). No task creates a working copy, record or sync for any other branch. |
