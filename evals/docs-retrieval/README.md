# evals/docs-retrieval/

**Read this when** you are adding a module, a corpus or an arm to the docs-retrieval relevance eval, or you have found a file here and need to know what owns what. The **procedure** for running the eval, the **metric definitions** and the **decision rule** are not here: they are `docs/retrieval-eval.md`, and the figures every run produced are `docs/retrieval-eval-results.md`. How the eval is run is that document's `## How to run it`, and this file states no route of its own.

This directory holds the runner for the relevance eval of the shipped docs-retrieval tool: a set of ES modules that import the compiled retrieval code under `cli/dist/retrieval/` and drive it over labelled query sets. It is not a case for the native eval runner and answers to no runner — `evals/README.md` says what separates the directory's two tenants.

## The modules

| Path | What it owns |
|---|---|
| `run.mjs` | The entry module: one pass over one corpus, and the result object every other reader takes its figures from. Orchestration only. |
| `args.mjs` | The argument surface — the one place a flag is spelled, defaulted and refused. |
| `corpora.mjs` | Resolving a corpus id to the `HarnessConfig` that corpus is read through. |
| `queries.mjs` | Loading a labelled query set, and refusing a label that no longer resolves to a heading in the corpus. |
| `index-build.mjs` | Building the index a run measures against, and the `{ files, chunks }` snapshot every figure from that run is stamped with. |
| `arms.mjs` | The arm table, and the runner that drives one arm over one query set. |
| `metrics.mjs` | The figures: graded recall@k, MRR, latency percentiles, and the two score distributions the abstention threshold was calibrated on. |
| `results.mjs` | Rendering one run into the generated region of `docs/retrieval-eval-results.md` — the only writer of the bytes between that file's markers. |
| `calibrate.mjs` | The fixed re-calibration method of `ABSTAIN_SCORE_THRESHOLD`, over the uncensored scores the generated region publishes. |
| `check-floor.mjs` | The regression gate: this run's figures against the recorded floor, with an exit status per outcome. |
| `floor.json` | The recorded floor the gate reads — a machine artifact, not prose. What the numbers mean and when one is re-recorded is `docs/retrieval-eval.md` → `## The regression floor`, which the file's own `see` key names. |
| `cold-build.mjs` | The cold build of a persisted index: its wall time in three phases, and the size on disk of what it leaves behind. |
| `query-log-pass.mjs` | The shipped `search_docs` query log exercised over MCP against the real models — the only pass whose latency includes the per-call refresh and the MCP round trip. |
| `corpora/fixture-catalog/docs/` | The `fixture-catalog` corpus itself: one invented document per topic, plus the `INDEX.md` the index-first arm navigates from. The topic documents are deliberately not enumerated here — a corpus gains and loses documents, and the list that must stay exhaustive is `INDEX.md`'s, which the index-first arm reads. |
| `queries/` | One labelled query set per corpus, named `<corpus-id>.jsonl` — so `fixture-catalog.jsonl` and `self-docs.jsonl` today; a corpus held outside this tree takes its id from `--corpus-id`. Its own contract is `queries/README.md`. |
| `arm-a/agent-task.md` | The task text of arm A's **A-index** variant, which points the agent at an index through its `{{index}}` token. It is **not** named `prompt.md` because that name would make it a case for the native eval runner, which this is not — the file's own opening comment states it, and `evals/README.md` owns the pattern. |
| `arm-a/agent-task-search.md` | The task text of arm A's **A-search** variant, which names no index: `agent-task.md` with only its opening comment and its navigation paragraph changed. |
| `arm-a/run-arm-a.sh` | The mechanism of the arm A hand run, for either variant (`--variant index` or `search`) — **the one thing here that is never run from this directory.** It sits outside the configured scripts directory so that no agent invoking it obtains an automatic permit, and its own header states the prohibition that does the real work. |
| `arm-a/score-transcript.mjs` | Turning an arm A hand-run transcript into the records `run.mjs` scores every arm by, so arm A's row is generated rather than typed. |
| `arm-a/spread.mjs` | A variant's figures across its repetitions — per-repetition recall@5 and MRR pooled and per half, the median and p95 of latency and billed tokens, negatives answered `none` split by `negativeKind`, and the queries whose refs moved — plus the same per-half breakdown for any arm's records. |
| `arm-a/sample-transcript.json` | A hand-written transcript, with invented usage figures, so the scorer can be exercised without invoking an agent. |

## The two corpora

- **`fixture-catalog`** — the invented catalog under `corpora/fixture-catalog/docs/`, committed here in full. It carries its own `INDEX.md` because the index-first arm navigates from one and this repository's `docs/` has none. It changes only when the eval changes, which is why it is the corpus the regression gate grades.
- **`self-docs`** — this repository's own `docs/` plus every conventions document `layers[]` names. It **moves**: a document added under `docs/` joins the corpus, so every recorded figure over it is stamped with that run's file and chunk counts, and two figures carrying different stamps are not a before/after pair.

## Two single sources this directory reads and never copies

Both exist so that a change made in one place fails loudly here rather than going missing.

- **The arm table is `arms.mjs`**, built by pairing letters onto `SEARCH_MODES` imported from `cli/dist/retrieval/search.js`. Every other module's default arm set, arm column, floor key and by-name refusal reads that table, so no arm letter and no mode string is retyped anywhere else here. A fifth `SearchMode` therefore gains an arm, a metric row, a results row and a floor key from one letter added in that module — and until it is added, the table refuses at load by name.
- **The layer list is `harness.config.json`'s**, at the resolved `--repo` root. `corpora.mjs`'s `self-docs` reads `layers[]` and `stateDir` out of that file verbatim and overrides `docs.root` alone, because `cli/src/retrieval/corpus.ts`'s header forbids a copy of the conventions list anywhere. A layer added to that file is covered by the next run with no edit here; a configuration that is absent or carries no `layers` is refused by name rather than substituted for.
