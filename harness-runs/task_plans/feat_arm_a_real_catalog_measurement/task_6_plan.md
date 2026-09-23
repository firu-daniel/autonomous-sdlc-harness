### Task 6 — Encode the fixed re-calibration method in `evals/docs-retrieval/calibrate.mjs`

**Goal:** Turn the re-calibration method Task 3 committed into code, committed before any real-catalog score exists, so the value Task 22 moves the constant to is computed by a function anyone can re-run rather than by hand arithmetic, and so the method cannot quietly drift toward the numbers once they are in.

**Depends on:** Task 3, whose `docs/retrieval-eval-results.md` → `## Threshold calibration` → `### The re-calibration method, fixed before the real-catalog run` is the specification this module implements — read it and implement it as written: separable → midpoint of the highest negative and the lowest positive, rounded half-up to two decimals; overlapping → `L` = the lowest `bestRerankScore` among positives carrying a grade-3 label, `N` = the `near` negatives scoring below `L`, value = the smallest two-decimal number strictly greater than every score in `N`, **price** = every positive scoring below that value, over the pooled set; `N` empty or price above one positive query → *cannot separate*, constant unchanged; a `null` score excluded and listed. **Also depends on Task 4** (`loadQueries` returns `negativeKind` on negatives and `labels[].grade`, and `queries.mjs` exports `NEGATIVE_KINDS = Object.freeze({ far: 'far', near: 'near' })`, the one declaration of that closed set) and **Task 5** (every `metrics.perQuery` entry carries `bestRerankScore: number | null`, and the generated region's fenced `json` block carries `metrics.perQuery` per arm).

### Targets

- `evals/docs-retrieval/calibrate.mjs` (new).
- `evals/docs-retrieval/results.mjs` — one new exported reader, `readCorpusMachineHalf`, beside `rewriteGeneratedRegion`; nothing else in the module changes.
- `evals/docs-retrieval/metrics.mjs` — `export` added to the existing `STRICT_GRADE` declaration, and nothing else.
- `evals/docs-retrieval/README.md` — one row for the new module in `## The modules`.

**Why the block reader lives in `results.mjs`, and the grade comes from `metrics.mjs`.** The per-corpus markers (`corpusStart(id)` / `corpusEnd(id)`, spelling `<!-- eval:corpus:<id>:start -->` / `<!-- eval:corpus:<id>:end -->`) and the block layout (`renderCorpusBlock` → `machineSection`, whose fenced `json` payload carries `arms: [{ arm, mode, ran, embedCalls, rerankCalls, metrics }]`) are owned by `results.mjs`, so the one parser of that block sits beside its one writer and uses the same private marker functions — the pattern `query-log-pass.mjs` already follows by importing `GENERATED_START` / `GENERATED_END` from `results.mjs` rather than retyping them (`.claude/context/conventions.md` → *"a value is imported from its owner rather than retyped"*). The answering grade is `metrics.mjs` → `STRICT_GRADE = 3` (*"the grade a label must carry exactly to count for the strict columns"*) — the same meaning `L` reads — so it is exported and imported, never declared a third time beside `queries.mjs` → `GRADE_MAX`. The `negativeKind` classes come from `queries.mjs` → `NEGATIVE_KINDS` (Task 4), the loader that refuses any other value, so the class the overlapping case reads is the one the loader validated — a renamed or added class cannot silently fall out of `N` as `unclassed`. And no mode string is written in `calibrate.mjs`: `arms.mjs`'s header forbids retyping one, and `cli/src/retrieval/search.ts` → `SEARCH_MODES` is the one source.

**The interface this task produces.** In `results.mjs`, for `calibrate.mjs` (and any later reader of a published block):

```js
// The parsed fenced-json machine half of one corpus block inside the generated region.
export function readCorpusMachineHalf(text, corpusId)
//   -> the payload object machineSection rendered ({ ..., arms: [{ arm, mode, ran, metrics, ... }] })
//   throws, naming corpusId, when the region, the corpus's start/end markers, or the fenced json block is missing
```

In `calibrate.mjs`, which Tasks 21, 22 and 23 call:

```js
// The per-query entries of one arm of one corpus block of docs/retrieval-eval-results.md's generated region.
export function readPerQuery(resultsText, corpusId, mode)
//   mode: required, one of SEARCH_MODES (imported from cli/dist/retrieval/search.js); an unknown or absent value is refused by name
//   -> [{ id, negative, abstained, bestRerankScore, ... }]   (readCorpusMachineHalf(...).arms[] entry whose mode === mode, its metrics.perQuery)

// The fixed method over a pool of corpora.
export function calibrateThreshold(pool)
//   pool: [{ corpus, queries /* loadQueries(...) */, perQuery /* readPerQuery(...) */ }]
//   -> { method: 'separable' | 'overlapping' | 'cannot-separate',
//        value: number | null,                 // null exactly when method === 'cannot-separate'
//        highestNegative: { corpus, id, score } | null,
//        lowestPositive: { corpus, id, score } | null,
//        lowestGrade3Positive: { corpus, id, score } | null,   // L
//        nearBelowL: [{ corpus, id, score }],                  // N
//        price: [{ corpus, id, score }],                       // positives the value abstains on
//        excluded: [{ corpus, id, reason }],                   // null scores, by id
//        points: [{ corpus, id, kind: 'positive' | 'far' | 'near' | 'unclassed', grade3: boolean, score }] }
```

The `far` and `near` members of `points[].kind` are `NEGATIVE_KINDS.far` / `NEGATIVE_KINDS.near`, imported from `./queries.mjs`; `'positive'` and `'unclassed'` are this module's own point kinds, not `negativeKind` values. A negative with no `negativeKind` is `unclassed` in `points` and is **not** a member of `N`; the overlapping case reads `near` alone (`negativeKind === NEGATIVE_KINDS.near`), as the method says.

**Work:**

- [ ] `results.mjs`: add `readCorpusMachineHalf(text, corpusId)` beside `rewriteGeneratedRegion`, locating the block with the module's own `corpusStart` / `corpusEnd` (inside `GENERATED_START` / `GENERATED_END`), parsing the fenced `json` that `machineSection` renders, and refusing by name when the block or its fenced `json` is missing; its doc comment says it is the one reader of the block `renderCorpusBlock` writes. `metrics.mjs`: add `export` to `STRICT_GRADE` and change nothing else.
- [ ] `calibrate.mjs`: a module header stating *"The rule this module exists to enforce"* — the method is the one `## Threshold calibration` → `### The re-calibration method, fixed before the real-catalog run` fixes, and this module is its only implementation, taking no parameter that could tune it — plus `readPerQuery` and `calibrateThreshold` as above. `readPerQuery` calls `readCorpusMachineHalf` (imported from `./results.mjs`; no marker spelling and no block parsing in this module) and keeps only its own job: refuse `mode` by name unless it is a member of `SEARCH_MODES` imported from `../../cli/dist/retrieval/search.js`, pick the `arms[]` entry whose `mode === mode` (refusing by name when it is absent or `ran: false`), and refuse by name when `bestRerankScore` is missing on any entry (a block generated before Task 5 has no such key, and calibrating on it would be calibrating on the censored field). The grade-3 test imports `STRICT_GRADE` from `./metrics.mjs`; the `N` membership test and the `far` / `near` point kinds import `NEGATIVE_KINDS` from `./queries.mjs`; `calibrate.mjs` declares no grade literal, no mode literal and no `negativeKind` literal.
- [ ] Rounding: half-up at two decimals, computed so floating error cannot move a midpoint across a boundary (work in integer hundredths, e.g. `Math.round(x * 100 + Number.EPSILON) / 100` checked against a worked value: the midpoint `0.3195` of the original calibration must round to `0.32`).
- [ ] `evals/docs-retrieval/README.md`: one row for `calibrate.mjs` — *"the fixed re-calibration method of `ABSTAIN_SCORE_THRESHOLD`, over the uncensored scores the generated region publishes"* — and no other row edited.

**Verification:**

- A scratch launcher (`bash scripts/scratch-run.sh harness-runs/scratch/<launcher>.mjs`) exercises `calibrateThreshold` on **invented** pools written inside the launcher, never on a real run's figures: a separable pool whose midpoint is `0.3195` returns `{ method: 'separable', value: 0.32 }`; an overlapping pool returns the smallest two-decimal value above its highest `near`-below-`L` score and lists its price by id; an overlapping pool with no `near` negative below `L`, and one whose price is two positives, each return `cannot-separate` with `value: null`; a pool with a `null` score lists it under `excluded`.
- `readPerQuery` on the current `docs/retrieval-eval-results.md`, with the arm E mode the launcher takes from `SEARCH_MODES` / `arms.mjs` → `ARMS`, refuses by name — its blocks predate Task 5 and carry no `bestRerankScore` — which is the refusal that keeps a censored run out of the pool. The same call with an unknown mode (e.g. `'not-a-mode'`) or with no mode is refused by name, and `readCorpusMachineHalf` on an id with no block (e.g. `'no-such-corpus'`) is refused naming that id.
- `readCorpusMachineHalf(text, 'fixture-catalog')` on the current results file returns an object whose `arms` entries carry the same `arm` / `mode` pairs as `arms.mjs` → `ARMS` — the reader and the writer agree on the layout.
- `git grep -nE "'(lexical|vector|fused|fused-rerank)'|'(far|near)'|eval:corpus:|grade *[=!<>]==? *[0-9]" -- evals/docs-retrieval/calibrate.mjs` returns nothing (no retyped mode string, `negativeKind` class, marker or grade literal), `git grep -nE 'STRICT_GRADE|NEGATIVE_KINDS' -- evals/docs-retrieval/calibrate.mjs` shows both imports, and `git diff evals/docs-retrieval/metrics.mjs` changes only the `STRICT_GRADE` line.
- `bash scripts/test.sh`, without a pipe, prints no failure that was not already failing before this task — the known pre-existing failure is gate `6a no machine paths`, red in this self-adopted checkout by design (`docs/development.md` §5 → **"The `$HOME` half is a different matter, and self-adoption breaches it."**) and not this task's to fix (the eval's existing tests still import `results.mjs` and `metrics.mjs` unchanged in behaviour).
- No real-catalog or regenerated figure is read by this task; the invented pools are the only numbers it computes on.
