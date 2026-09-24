### Task 7 — Name a corpus held outside this tree with `--corpus-id`, and never render a climbing query-set path

**Goal:** Let the eval measure a catalog outside this checkout under a stable id of its own — `gate10-catalog` — so its generated block, its query set's file name and every citation agree, and make sure nothing the runner writes into `docs/retrieval-eval-results.md` can name where that catalog, or this checkout, sits on the machine.

**The two defects this task fixes, found by reading the runner.** (1) The ad-hoc route reports every corpus as `ad-hoc` (`evals/docs-retrieval/corpora.mjs` → `AD_HOC_CORPUS`), so its block would be `<!-- eval:corpus:ad-hoc:start -->` and a second outside catalog would overwrite the first; and the directory contract in `evals/docs-retrieval/queries/README.md` — *"one set per corpus, … named `<corpus-id>.jsonl`"* — cannot name a set for it. (2) `evals/docs-retrieval/run.mjs` renders the provenance's query-set path as `relative(options.repo, options.queries)`: with `--repo` pointing at a catalog outside this checkout and the set committed inside it, that is a `../…` path climbing out of the catalog through the machine's own directory names into this worktree — a machine-local path in a committed file.

### Targets

- `evals/docs-retrieval/args.mjs` — `--corpus-id`, the default query set for a named ad-hoc corpus, and `checkout` on the returned options.
- `evals/docs-retrieval/corpora.mjs` → `corpusConfig`.
- `evals/docs-retrieval/run.mjs` → the provenance `queries.path`.
- `evals/docs-retrieval/queries/README.md`, the `queries/` row of `evals/docs-retrieval/README.md`, and `docs/retrieval-eval.md` → `## How to run it` (the ad-hoc command paragraph and the flag table).

**The interface this task produces, which Tasks 10, 14, 18 and 21 use:**

- `--corpus-id <id>` — legal only together with `--docs-root`; `<id>` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is neither a built-in id nor `ad-hoc`; each refusal names the flag and the rule. Absent → the corpus id is `ad-hoc`, exactly as today.
- With `--corpus-id` and no `--queries`, the query set defaults to `evals/docs-retrieval/queries/<id>.jsonl` resolved against **this checkout** (`ownCheckout()`), never against `--repo`. An explicit `--queries` is resolved as today.
- `parseArgs` returns `checkout` (the absolute root of this checkout) beside `repo`, and `corpusId`.
- `corpusConfig({ repoRoot, corpus, docsRoot, conventions, corpusId })` returns `id: corpusId ?? AD_HOC_CORPUS` for the ad-hoc route; nothing else it returns changes.
- The provenance `queries.path` is the set's path relative to `checkout` when the set lies inside it, else relative to `repo` when it lies inside that; **a path that would begin with `..` or be absolute is never rendered** — `runEval` refuses `--out` by name in that case (stdout-only runs print the file's basename).

The built-in invocations `--corpus fixture-catalog` and `--corpus self-docs`, with or without `--out`, keep their exact argument shape and output.

**Work:**

- [ ] `args.mjs`: add `['--corpus-id <id>', …]` to `FLAGS` with its `case`, the refusals above, the default query-set resolution, and `checkout` / `corpusId` on the return; keep the header's rule (no arm letter here) and extend its `--repo` paragraph with the two roots.
- [ ] `corpora.mjs`: accept `corpusId` and return it as the ad-hoc `id`; update the `AD_HOC_CORPUS` doc comment to say it is the id of an **unnamed** operator-composed corpus.
- [ ] `run.mjs`: pass `corpusId` through to `corpusConfig` and compute `queries.path` as above, with the refusal; extend the existing comment on that line that cites gate 6a.
- [ ] `queries/README.md`: the contract stays *one set per corpus, named `<corpus-id>.jsonl`*, and gains how a corpus **held outside this tree** is named — the id given with `--corpus-id`, its set committed here under that id, and the corpus itself identified in `docs/retrieval-eval-results.md` by its commit and size, never by a path. The `queries/` row of `evals/docs-retrieval/README.md` gets the same one clause. `docs/retrieval-eval.md` → `## How to run it`: the ad-hoc command gains `--corpus-id <id>`, and the flag table a `--corpus-id` row.

**Verification:**

- Through `bash scripts/scratch-run.sh` launchers: `--corpus fixture-catalog` prints the same table columns as before this task; `--corpus-id fixture-catalog` with `--docs-root docs`, `--corpus-id ad-hoc` and `--corpus-id Bad_Id` are each refused naming the rule; `--corpus-id x` without `--docs-root` is refused.
- An ad-hoc run over a throwaway copy of the fixture catalog under `harness-runs/scratch/` with `--corpus-id scratch-copy --queries <absolute path of evals/docs-retrieval/queries/fixture-catalog.jsonl>` reports the id `scratch-copy` and renders the provenance query path as `evals/docs-retrieval/queries/fixture-catalog.jsonl`; the same run with the set copied to a directory outside both roots refuses `--out` by name. (Remove the throwaway copy in process, never with a shelled-out recursive removal.)
- `bash scripts/check-eval-artifacts.sh` prints nothing.
