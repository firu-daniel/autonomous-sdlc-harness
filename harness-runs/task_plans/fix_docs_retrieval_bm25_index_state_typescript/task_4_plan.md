### Task 4 — Take the before-fix relevance figures on both corpora and on the Seq Scan plan

**Goal:** Take the baseline that Task 9 grades the fix's movement against. The task prompt says: *"take the deterministic figures on both corpora at this branch's base commit, before the fix, and grade the fix's movement against that run"* (Leads, **The relevance figures this will move, and the floor.**). It also asks for the one relevance figure the diagnosis never took: the lexical arm on the `Seq Scan` plan that a `REINDEX` puts `fixture-catalog` on (Leads, **The Seq Scan plan below the crossover.**, *"The diagnosis ran no relevance figure on that plan, so measure it"*).

**Depends on:** Task 2, the previous writer of `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch`. This task's part goes after Task 2's `#### Route 2 at refresh level, issued by hand`. The subsection's comparison rule and probe setup are cited in Task 2's lead paragraph.

**Why this is still the base code.** No task before this one touches `cli/src/`, so `cli/dist` built now is the base commit's retrieval code. `self-docs` has moved, though, because Tasks 2 and 3 edited `docs/`. So the `self-docs` run reads a **snapshot of the base commit `d15e5cc3`** (`## Context`, the shared-corpus decision). Task 9 reads the same snapshot after the fix, so the two runs share one stamp.

**Where this task stops.** It owns `#### The relevance eval's deterministic figures, before the fix`. It changes no code and no committed corpus, writes nothing in the generated region, and does not touch `evals/docs-retrieval/floor.json`. The vector arm after deletes is Task 5's.

### Targets

- `docs/retrieval-eval-results.md`: `#### The relevance eval's deterministic figures, before the fix`.

**Work:**

- [ ] **Preconditions.**
  - Run `npm run build`.
  - Confirm that the TypeScript model cache is present, and stop if it is not.
  - Read `SHOW pg_textsearch.library_version` on PGlite, which must read `1.5.1`.
  - Create `harness-runs/scratch/eval.mjs` as `docs/retrieval-eval.md` → `## How to run it` gives it, if absent.
- [ ] **The base snapshot.** Write a scratch program, `harness-runs/scratch/fix-bm25/base-corpus.mjs`, run through `bash scripts/scratch-run.sh`.
  - It lists the files of `d15e5cc3` under `docs/`, `.claude/context/`, `evals/docs-retrieval/queries/` and `harness.config.json` (`git ls-tree -r --name-only` through `execFileSync`, never a shell string).
  - It writes each file's `git show d15e5cc3:<path>` content to the same relative path under `harness-runs/scratch/fix-bm25/base-corpus/`.
  - It first removes that directory in process, so a re-run cannot leave a stale file.
  - **A partial write is removed by the program itself.** The write runs inside a `try`; on any thrown error, including a sandbox refusal, the program removes `base-corpus/` in process and then rethrows, so a failed write leaves no partial snapshot.
  - If a write under the snapshot's `.claude/context/` is refused by the sandbox, return a transient `blocker:` quoting the refusal, after the removal below. Never fall back to the live `self-docs`.
  - Give the program a `--remove` mode that removes the snapshot in process, never through a shelled-out recursive removal (`.claude/context/conventions.md` → `## Shell assets`). It removes only `harness-runs/scratch/fix-bm25/base-corpus/`, the directory this program creates, and nothing else.
  - **Every exit after the snapshot is first written runs `base-corpus.mjs --remove` before returning**: success once this task's readings are taken, the sandbox-refusal `blocker:`, a run or reading that fails mid-task, and every other stop or `blocker:`. If the removal itself fails, the return says so and names the directory left behind. Task 9 writes the snapshot again from the same commit, so nothing outlives the task that made it (`harness-runs/lessons.md` → `## Remote and branch-scoped operations`, the temporary-copy rule: *"removes it on every exit path, success and failure alike"*).
- [ ] **The runs**, each into a scratch `--out` file created beforehand holding only the two generated-region markers, with `--repeat 1`:
  - `fixture-catalog`, fresh: `--corpus fixture-catalog --data-dir harness-runs/scratch/fix-bm25/before-fixture-catalog --out harness-runs/scratch/fix-bm25/before-fixture-catalog.md`, into a data directory that does not exist yet.
  - `self-docs`, fresh, from the snapshot: `--repo harness-runs/scratch/fix-bm25/base-corpus --corpus self-docs --out ../before-self-docs.md`, in memory. Every non-absolute path after `--repo` resolves against the snapshot (`evals/docs-retrieval/args.mjs`, `resolve(repo, path)`), so `../before-self-docs.md` is `harness-runs/scratch/fix-bm25/before-self-docs.md`, **outside** the snapshot. Create that file with the two markers before the run. It outlives the snapshot's removal **on purpose**: it and `before-fixture-catalog.md` are Task 9's diff inputs, and `base-corpus.mjs --remove` must not touch either.
- [ ] **The Seq Scan plan, unfiltered.**
  - Write `harness-runs/scratch/fix-bm25/pglite-statement.mjs`. It opens a PGlite data directory through `evals/docs-retrieval/bm25-history.mjs` → `openPgliteEngine` and runs the statements it is given, printing each answer.
  - On `before-fixture-catalog`, after the fresh run: read `BM25_HISTORY_STATEMENTS.explainStore` bound to the first query, and the index summary.
  - Issue `BM25_HISTORY_STATEMENTS.reindex`, then read both again. The plan must now read `Seq Scan on public.chunks`. If it does not, record what it reads, and say this part did not reach the plan.
  - Run `fixture-catalog` again with `--data-dir harness-runs/scratch/fix-bm25/before-fixture-catalog --out harness-runs/scratch/fix-bm25/before-fixture-catalog-seqscan.md`, a third scratch file holding only the two markers. Its refresh writes nothing (`cli/src/retrieval/refresh.ts` → `refreshIndex`, step (5)), so this run is the shipped `lexicalSearch` ranking on the `REINDEX` state's Seq Scan plan.
  - In this run's per-query refs, record every row the lexical arm returned for a query that carries no matching term, if the eval's output shows one.
- [ ] **The part.**
  - The setup: the date, the commit, the engines and versions, and each run's provenance and stamp. Name the snapshot's commit and its `{ files, chunks }`.
  - For arms B to E: recall@1, @3 and @5, MRR, strict recall@1, @3 and @5, strict MRR, and the negatives abstained on. Give one table per corpus for the fresh runs, and a third table for `fixture-catalog` on the Seq Scan plan beside its fresh run, listing every figure and every query whose ordered refs differ between the two.
  - Each run's plan reading.
  - **The floor, by reading**: each `evals/docs-retrieval/floor.json` row against the fresh `fixture-catalog` run.
  - The fresh `fixture-catalog` figures are expected to equal `#### The relevance eval's deterministic figures, on 1.5.1`, so say whether they do.

**Verification:**

- All four runs completed, each `--out` file was scratch, and `git diff docs/retrieval-eval-results.md` touches nothing between the generated-region markers.
- The snapshot's `self-docs` stamp is recorded, and the part names `d15e5cc3` as its commit.
- The Seq Scan reading names its plan line verbatim, and the third table compares it with the fresh run figure by figure.
- `git diff --stat` lists `docs/retrieval-eval-results.md` only, and the new lines sit directly after Task 2's part.
- `harness-runs/scratch/fix-bm25/base-corpus/` is absent when the task returns, whatever the outcome: success, `blocker:` or stop (`test ! -e harness-runs/scratch/fix-bm25/base-corpus` exits `0`).
- `harness-runs/scratch/fix-bm25/before-fixture-catalog.md` and `harness-runs/scratch/fix-bm25/before-self-docs.md` both exist when the task returns successfully (`test -f` on each exits `0`), each holding its run's metric tables and per-query refs: the snapshot's removal left them in place for Task 9.

**Deviations from plan:**

- **A plan-only `self-docs` run was added.** The `self-docs` run of record is in memory, so its plan cannot be read afterwards, and the part requires each run's plan reading. A fourth eval run, `--repo harness-runs/scratch/fix-bm25/base-corpus --corpus self-docs --data-dir ../before-self-docs-plan --arms B --repeat 1`, with no `--out`, persisted the same snapshot (stamp `{ files: 71, chunks: 829 }`), and `pglite-statement.mjs` read `Index Scan using chunks_bm25 on public.chunks` on it. Its arm B figures equal the in-memory run's. Its data directory, `harness-runs/scratch/fix-bm25/before-self-docs-plan/`, stays in scratch beside `before-fixture-catalog/`.
- **The Seq Scan run's per-query score-`0` claim rests on a direct statement, not only on the eval's output.** The eval prints rank-derived fusion scores, so the zero scores were read with the store's ordering expression on the same data directory: all 41 rows scored `0` for `q-fc-negative-lattice`, and the count of non-zero rows was `0`.
- **The floor table carries a Seq Scan column beside the fresh one**, for reference only. The plan asks for the fresh run alone. Arm B's MRR reads `0.602` against its `0.60` floor on the Seq Scan plan, which bears on Task 8's floor reading (Q1).
