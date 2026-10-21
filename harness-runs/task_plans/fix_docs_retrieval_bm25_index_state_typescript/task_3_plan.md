### Task 3 — Document the probe's new flags and add gate 10's leg (vii), the real-catalog route-2 hand run

**Goal:** Write the two documents an operator follows to take the route-2 figure:

- the flags Task 1 added, in `docs/retrieval-eval.md` → `### The BM25 index-state probe`;
- the hand-run leg on a real catalog, as a new leg (vii) of `docs/development.md` §5 gate 10. The user chose gate 10 as its home at planning (`## Context`, Q2).

The user runs that leg on the private 1,960-chunk catalog. Task 6 parks the run until the user has.

**Depends on:**

- **Task 1**, which adds `--end-state <candidate|route-2>` (default `candidate`) and the ad-hoc corpus A flags to `evals/docs-retrieval/bm25-refresh-rule.mjs`:
  - `--repo <path>`, `--docs-root <dir>`, `--conventions <file>` (repeatable), `--corpus-id <id>` and `--queries <file>`, given instead of `--corpus`;
  - resolved exactly as `evals/docs-retrieval/args.mjs` resolves them for the eval: every path after `--repo` is relative to it, and a corpus named by `--corpus-id` takes `evals/docs-retrieval/queries/<corpus-id>.jsonl` from this checkout;
  - `--other` stays a built-in id, and `--capture` resolves against this checkout.
- **Task 2**, which opens `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch`. Leg (vii) names that subsection as where its result is recorded, and names its real-catalog part as `#### Route 2 on the real catalog`, which Task 6 writes.

**Where this task stops.** It writes how to take the figure and where it goes. It takes no figure, writes nothing under `docs/retrieval-eval-results.md`, and states no expected outcome. Whether route 2 holds at real shape is what the leg measures.

### Targets

- `docs/retrieval-eval.md` → `### The BM25 index-state probe`: the refresh-level paragraph and its commands.
- `docs/development.md` → `## 5. Verifying a change` → **Gate 10 — docs retrieval with the real models.**: its leg count, its *"This gate has been run."* paragraph, and the new leg (vii).

**Work:**

- [ ] **`docs/retrieval-eval.md`.** After the existing four refresh-level commands, add:
  - `--end-state route-2`: what it issues (`REINDEX INDEX chunks_bm25` after every scenario's last refresh, with the candidate decision still printed), and that `candidate` is the default and is what the four commands above run;
  - the ad-hoc corpus A flags, with the eval's own `## How to run it` cited for their meaning and not restated;
  - one route-2 command per backend and built-in corpus, as Task 2 ran them, with captures under `harness-runs/scratch/fix-bm25/`, and the Python pairs compared as the paragraph already states.

  Every command sits in its own fenced block, one command per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`, first rule). Change no existing command.
- [ ] **Gate 10's leg count.**
  - The gate paragraph's closing *"Six legs."* becomes seven.
  - The *"This gate has been run."* paragraph keeps its record true. The 2026-09-22 run ran the six legs the gate then had, and leg (vii) is recorded on its own. State that leg (vii)'s figure lives in `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch` → `#### Route 2 on the real catalog`.
- [ ] **Leg (vii), "The BM25 end state on a real catalog"**, placed after leg (vi) and before **Where the results go.**, in the same register as the other legs:
  - **What it is for.** The real-shape figure for route 2 (`harness-runs/lessons.md` → `## Evidence and measurement`, the first rule), on a catalog of at least the gate's ~1,500-chunk floor. The figures in `### Route 2 on the fix branch` come from 41 and about 826 chunks.
  - **Where it runs.** From **this** repository's root, unlike every other leg, because the module and its launcher live here. The catalog checkout is named through `HARNESS_EVAL_CORPUS_ROOT`, as `docs/retrieval-eval.md` → `## Running arm A by hand` names it. The commands:
    - `npm run build`;
    - creating `harness-runs/scratch/bm25-refresh-rule.mjs` as the probe section gives it;
    - one TypeScript command: `bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend typescript --end-state route-2 --repo "$HARNESS_EVAL_CORPUS_ROOT" --docs-root <docs-root> --conventions <file> --corpus-id gate10-catalog --other fixture-catalog --capture harness-runs/scratch/fix-bm25/route-2-typescript-gate10-catalog-1.txt`, with one `--conventions` per document the catalog's own `harness.config.json` names. The Python backend is optional, with the same flags, given the compose service and weights.
  - **The preconditions.** The TypeScript model cache, and nothing timed: this leg reads scores and plans, never time, so it may be run in a session. It is a hand run because the catalog is private.
  - **The `--other` collision.** If the module refuses because a key is in both corpora, re-run with `--other self-docs`.
  - **What to record.** The summary the command prints to stdout:
    - the server and `pg_textsearch` lines;
    - corpus A's `gate10-catalog` stamp, with the catalog's commit beside it;
    - each scenario's candidate decision, statement, `≠ ref` counts and store plan.

    The corpus is identified by its commit, its size and its character, and never by a filesystem path (gate 6's rule). The capture stays in the gitignored scratch directory.
- [ ] **No other edit.** Legs (i)–(vi), **Where the results go.** and every other gate stay as they are. `**Where the results go.**` may gain one sentence pointing leg (vii) at its section of record, and nothing more.

**Verification:**

- Every command in the two edited sections sits in a fenced block, one per line, and the flag names match `evals/docs-retrieval/bm25-refresh-rule.mjs` as Task 1 left it. Grep the module for each flag the documents name.
- `git grep -nE "six legs|Six legs" -- docs/development.md` shows no line claiming the gate has six legs today. The one remaining *"six legs"* phrase describes the 2026-09-22 run.
- `grep -nE '/(Users|home)/[a-z]' docs/development.md docs/retrieval-eval.md` shows no hit this task added. Gate 6a is red in this checkout by design, so a new hit would be invisible to a *"no new failure"* reading.
- `git diff --stat` lists the two target files only.

- **Deviations from plan:** The plan gave leg (vii)'s comparison sizes as "41 and about 826 chunks". `docs/retrieval-eval-results.md` → `#### Route 2 at refresh level, issued by hand` records `self-docs` at `{ files: 71, chunks: 829 }` in all six route-2 runs; 826 is the earlier candidate-rule run's size. Implemented as "41 and 829 chunks".
