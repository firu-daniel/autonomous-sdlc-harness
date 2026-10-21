### Task 6 — Record the user's real-catalog route-2 figure — the park point the fix waits on

**Goal:** Record the real-shape figure for route 2, gate 10's leg (vii) on the private 1,960-chunk catalog `gate10-catalog`, before any fix task runs. `harness-runs/lessons.md` → `## Evidence and measurement`, the first rule: *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision."* The user decided at planning that the fix waits for this figure and that the run parks until it is supplied (`## Context`, Q2 (a)).

**Depends on:**

- **Task 3**, which wrote leg (vii) under `docs/development.md` §5 gate 10: the commands, what to record, and that the result goes to `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch` → `#### Route 2 on the real catalog`.
- **Task 1**, whose `--end-state route-2` and ad-hoc corpus flags the leg runs.
- **Task 5**, the previous writer of `### Route 2 on the fix branch`. This task's part goes after Task 5's `#### The vector arm after a refresh with deletes, before the fix`.

**This task is the run's park point, and it is meant to block once.** It cannot measure anything itself, because the catalog is private and outside this checkout.

- **First dispatch.** No figure has been supplied. Return exactly:

  `blocker: the user's real-catalog route-2 figure (gate 10 leg (vii)) has not been supplied — park with the question in harness-runs/task_plans/fix_docs_retrieval_bm25_index_state_typescript/task_6_plan.md → ### The question to raise`

  Change no file. The orchestrator parks on this by the user's own planning decision, and never assumes past it.
- **On resume**, the figure arrives in one of two ways: an answered pair at the top level of `harness-runs/clarifications/fix_docs_retrieval_bm25_index_state_typescript/` (the `answer_<n>.md` beside the `question_<n>.md` carrying this question), or the dispatch's `context_notes:`. Read it, record it, and return normally.
- **If the answer carries no figure**, return the same blocker again, for example when the user asks a question back or says the run failed.

**Where this task stops.** It records what the user supplied, as supplied, and decides one thing. **If any route-2 `after` reading on the real catalog differs from `reference-reindex` on any hit, in either column, return** `blocker: route 2 does not hold on the real catalog — <scenario(s), hit counts>; the maintainer decides before the fix` **after writing the part.** The record stands either way, and the maintainer decides whether Tasks 7–12 proceed. It re-runs nothing and estimates nothing.

### The question to raise

Write it into the park's question file verbatim. Substitute the literal checkout root from a bare `git rev-parse --show-toplevel` for `<run copy root>`. The question file is machine-local, so the path may appear there and nowhere committed.

> **Q1 — Run gate 10's leg (vii) on the private real catalog, and paste its summary.** Raised by Task 6 of `fix_docs_retrieval_bm25_index_state_typescript`. You decided at planning that the BM25 fix waits for this figure (planning answer Q2 (a)), so the run is parked until you supply it. It cannot be taken from inside the run, because the catalog is held outside this checkout.
>
> **What to run.** From the run copy at `<run copy root>`, which holds the module change, follow `docs/development.md` → `## 5. Verifying a change` → **Gate 10** → leg (vii):
>
> - `npm run build`;
> - create `harness-runs/scratch/bm25-refresh-rule.mjs` as `docs/retrieval-eval.md` → `### The BM25 index-state probe` gives it;
> - with `HARNESS_EVAL_CORPUS_ROOT` set to the catalog's checkout, run the leg's TypeScript command, with one `--conventions` per conventions document the catalog's own `harness.config.json` names. If it refuses because a key is in both corpora, re-run it with `--other self-docs`.
>
> The Python backend is optional. It reads scores and plans, never time, so it can run in a session.
>
> **What to paste back.** Everything the command printed to stdout:
>
> - the `server:` and `pg_textsearch:` lines;
> - the `end state:` line;
> - the `corpus A:` line with the `gate10-catalog` stamp;
> - every scenario block with its candidate decision, statement, `versus reference-…` counts and store plans.
>
> Also give the catalog's commit, the date, `uname -sr` and `node --version`. Do not paste a filesystem path to the catalog. It is identified by its commit and size only.

### Targets

- `docs/retrieval-eval-results.md`: `#### Route 2 on the real catalog`, written only on the resumed dispatch that carries the figure.

**Work:**

- [ ] Look for the figure, in the dispatch's `context_notes:` and in the top-level answered pair under `harness-runs/clarifications/fix_docs_retrieval_bm25_index_state_typescript/`. With none, return the first-dispatch blocker above and stop.
- [ ] Check what was supplied before writing anything:
  - the `pg_textsearch:` line reads `1.5.1`;
  - the `end state:` line reads `route-2`;
  - corpus A's stamp clears the gate's ~1,500-chunk floor;
  - every one of the six scenarios is present.

  If any of these fails, return a blocker naming the gap and asking for the missing piece, and write nothing.
- [ ] Write the part:
  - the provenance as supplied: date, host line, Node, server, `pg_textsearch`, the catalog's commit and stamp, and corpus B and its stamp;
  - one table per backend supplied, in the columns of Task 2's `#### Route 2 at refresh level, issued by hand`;
  - **The verdicts** against `reference-reindex`;
  - the store plan per scenario, with the corpus size beside the 63-row crossover;
  - **Against the built-in corpora**: whether the real catalog's outcome matches Task 2's verdicts structurally (the stamp rule).

  State that the user ran it by hand, which leg it is, and that no time was taken.
- [ ] Apply the stop rule in **Where this task stops** after writing.

**Verification:**

- On a first dispatch, no file changed and the return is the blocker line verbatim.
- On the recording dispatch, every figure in the part traces to a line of the user's pasted summary. Nothing is computed that the summary did not print, and no filesystem path to the catalog appears: `grep -nE '/(Users|home)/[a-z]' docs/retrieval-eval-results.md` shows no hit this task added.
- `git diff --stat` lists `docs/retrieval-eval-results.md` only, and the new lines sit directly after Task 5's part.
  - **Deviations from plan:** The figure arrived in the dispatch, not in a clarifications pair. The orchestrator session ran leg (vii) at the user's direction, TypeScript only, with exit 0. The output is in `harness-runs/scratch/fix-bm25/route-2-typescript-gate10-catalog-1.stdout`. The pre-write check *"corpus A's stamp clears the gate's ~1,500-chunk floor"* failed: the stamp is `{ files: 105, chunks: 1454 }`. The run is also on catalog commit `dce0de74e` rather than `010c50e`, because neither `010c50e` nor `57a6c25` could be found, locally or in a fresh clone of the remote. The plan says to return a blocker and write nothing in that case. The user ruled instead to take the run as it is, to record both gaps, and not to re-park on the floor. The part was written on that basis, and both gaps are recorded under **The gaps, as ruled.** The other three checks passed: `pg_textsearch: 1.5.1`, `end state: route-2`, and all six scenarios present. The stop rule then fired, because `other-corpus`'s `after` reading differs from `reference-reindex.full` on 1 hit in `scan` and 0 in `operator`. That dispatch returned the route-2 blocker. At the user's direction, leg (vii) was run a second time with the same command apart from `--capture harness-runs/scratch/fix-bm25/route-2-typescript-gate10-catalog-2.txt`; it ran 2026-10-21T18:19:41.715Z and exited 0. This dispatch checked that both runs' stdout, and both captures, are identical once line 1 (the `ran` timestamp) is dropped: `diff` and `cmp` each exit 0. So the 1-hit `scan` difference recurred exactly. The user ruled to proceed: record both runs and the hit as recorded, not attributed, and let Tasks 7–12 go ahead. On that ruling this dispatch updated the part to record both runs and the ruling, and did not return the route-2 blocker again. `git diff --stat` also lists this detail file, because of this note.
