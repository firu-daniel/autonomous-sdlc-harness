### Task 8 — Teach the generated table one arm A row per variant through a repeatable `--transcript`

**Goal:** Let one `--out` run publish **two** arm A rows — `A-index` and `A-search` — each scored from its own transcript by the same `scoreTranscript` → `scoreArm` path as today, so both variants' rows are generated rather than typed, while a single unlabelled `--transcript <path>` still renders the one `A` row exactly as it does now.

**Depends on:** Task 7, which adds `--corpus-id`, `checkout` and `corpusId` to `evals/docs-retrieval/args.mjs` → `parseArgs` and edits `docs/retrieval-eval.md` → `## How to run it`'s flag table; this task edits the same two files after it, and only the `--transcript` parts of them.

### Targets

- `evals/docs-retrieval/arms.mjs` — `NAVIGATION_VARIANTS` and `navigationVariant(label)`.
- `evals/docs-retrieval/args.mjs` — `--transcript` becomes repeatable.
- `evals/docs-retrieval/run.mjs` — scores each transcript.
- `evals/docs-retrieval/results.mjs` — one arm A row per supplied transcript.
- `docs/retrieval-eval.md` → `## How to run it` (the `--transcript` flag row) and `### Arm A's row is generated, never typed`.

**The contract this task produces, which Task 18 invokes:**

- `--transcript` is repeatable. Each value is either a bare `<path>` or `<variant>=<path>`, where `<variant>` is one of `NAVIGATION_VARIANTS = ['index', 'search']`, declared once in `arms.mjs`. `args.mjs` splits on the **first** `=` only when the text before it is a bare lower-case word, carries the label as a raw string, and defers its legality to `arms.mjs` → `navigationVariant(label)` — the same deferral the module header already makes for `--arms` letters. Refused by name: a bare path together with a labelled one, two transcripts for one variant, two bare paths, an unknown label.
- `parseArgs` returns `transcripts: [{ variant: 'index' | 'search' | null, path }]`, in the order given, replacing `transcript`. `grep -rn "\.transcript\b" evals/` before and after, and move every reader.
- `runEval` pushes one arm A entry per transcript: `{ letter: 'A', variant, mode: null, embedCalls: 0, rerankCalls: 0, cost, records, metrics }`, in `NAVIGATION_VARIANTS` order, the unlabelled one with `variant: null`.
- `results.mjs`: the table walk over `ARMS` renders, for the navigation entry, one row per arm A result — the `Arm` cell `A-index` / `A-search` for a labelled variant, `A` for the unlabelled one — or the single *awaiting hand run* row when there is none. The machine half's `arms` array carries `variant` on every arm A entry. The footnote under the table says the arm A rows, when present, are each scored from the **first repetition's** transcript of that variant, and that the spread across repetitions is hand-written below the end marker.

**Work:**

- [ ] `arms.mjs`: declare `NAVIGATION_VARIANTS` beside `NAVIGATION_ARM` and export `navigationVariant(label)` refusing an unknown label by name against that list; update the header's arm A paragraph.
- [ ] `args.mjs`: the repeatable `--transcript` with the parse and refusals above; update its `FLAGS` help line.
- [ ] `run.mjs`: score every entry of `options.transcripts` through the existing `loadTranscriptScorer` → `scoreArm` path and push one entry each; keep the module's rule sentence (*arm A's row is generated like every other row*) and pluralise it.
- [ ] `results.mjs`: the per-variant rows in `armRow`'s walk and in `machineSection`, and the footnote; the `COLUMNS`, `AWAITING_COST` and `NOT_RUN_COST` constants and every other row are unchanged.
- [ ] `docs/retrieval-eval.md`: the `--transcript` row and `### Arm A's row is generated, never typed` gain the variant form and one example command per form, each in its own fenced block, one command per line (`harness-runs/lessons.md` → the fenced-block rule).

**Verification:**

- `bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --transcript <a scratch transcript>` renders exactly one `A` row, as before this task. The scratch transcript is the three records of `evals/docs-retrieval/arm-a/sample-transcript.json` against a scratch copy of `fixture-catalog.jsonl` cut to those three ids, passed with `--queries` — `scoreArm` refuses a query with no record, so the full set cannot be scored from the sample.
- The same run with `--transcript index=<t> --transcript search=<t>` renders `A-index` and `A-search` rows with identical figures, and the returned machine half carries `variant` on both; each refusal case above is refused naming the flag.
- `bash scripts/run-gates.sh`, without a pipe: gate 11 passes; no new failure.
