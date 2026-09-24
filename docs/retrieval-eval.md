# Docs-retrieval eval

**Who reads this, and what it owns.** Anyone re-running the docs-retrieval relevance eval — on this
repository, or against a documentation catalog of their own. It owns the **procedure** (how the runner
is invoked, and against which corpus), the **query-set format**, the **definition of every metric**,
the **decision rule** that says when retrieval earns its place against the index-first navigation
agents use today, and the **regression floor** the gate enforces. It owns no figure:
`docs/retrieval-eval-results.md` is the record of what was measured, and `docs/retrieval.md` owns how
the tool itself works. Every number below is a pointer into the first of those, with the two
exceptions its own sections name — the floor margin, and the numbers inside a quoted failure line.

## What the runner owns, and what it does not

The eval is not CLI surface. `cli/src/retrieval/session.ts` refuses to open a retrieval session unless
`retrievalApplies(config)` — `phases.docs` **and** `docs.retrieval` both true — and this repository's
`harness.config.json` has `phases.docs: false` and no `docs` key at all. That file is deliberately
**unchanged** by the eval: the runner under `evals/docs-retrieval/` supplies `phases` and `docs`
itself and drives `corpusFiles` → `refreshIndex` → `searchDocs` directly, which
`cli/src/retrieval/corpus.ts`'s header licenses (the gate "is its callers' to check, not this
module's"). So **`phases.docs` and `docs.retrieval` are never read by the eval**, and turning
retrieval on in a checkout is not a precondition for measuring it.

That licence covers the gate and nothing else. The same header forbids a second copy of the
conventions list anywhere, so the runner **reads `layers[]` and `stateDir` out of the
`harness.config.json` at `--repo`** and overrides `docs.root` alone. The consequence is the only one an
adopter needs: **point `--repo` at your checkout and the conventions documents your own `layers[]`
names are in the corpus automatically**, with nothing to configure here — a layer added to that file is
covered by the next run. A checkout with **no** `harness.config.json`, or one whose configuration you
do not want read, is served by `--docs-root` and `--conventions` instead, which compose an ad-hoc
corpus from paths you name; that corpus reports itself as `ad-hoc` and reads no configuration at all.

## Preconditions

Three, each a state rather than a step, and each checked by `evals/docs-retrieval/index-build.mjs`
before anything is loaded — a run that fails one refuses by name rather than producing a number.

- **The real models are present**: `modelFilesPresent(retrievalModelCacheDir()).present` is true. The
  cache is machine-shared, so it is provisioned once and every worktree sees it. The command that
  fills it is `docs/cli.md` §11 → `### docs fetch-models`, which needs no configuration and no
  retrieval gate; the refusal names the cache directory and every missing file.
- **The stub is unset**: `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` is empty or absent. Set, it swaps
  both models for deterministic hash stubs, and the eval refuses to write any figure while it is set.
- **The retrieval runtime is installed**: `retrievalRuntimeState().installed` is true. In a clone of
  this repository the workspace's own install provides it — the optional peers are repeated under
  `devDependencies` — and elsewhere the harness's retrieval setup installs them
  (`docs/retrieval.md` → the **Setup** paragraph).

And one step, because the runner imports the **compiled** retrieval modules under
`cli/dist/retrieval/` — the real interfaces, never a copy of them — so the build has to have run:

```
npm run build
```

## How to run it

The runner is a set of ES modules, entered through `evals/docs-retrieval/run.mjs` → `main`. Drive it
from a **launcher** in this repository's scratch directory, which is the route a harness run and an
operator at a terminal share. Create `harness-runs/scratch/eval.mjs` with these two lines:

```
import { main } from '../../evals/docs-retrieval/run.mjs';
await main();
```

Every argument after the launcher's path is forwarded to it unchanged. The **two built-in corpora**,
by id — the committed fixture catalog, and this repository's own documentation:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog
```

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus self-docs
```

Each prints the arm table and the corpus's `{ files, chunks }` snapshot stamp, and writes nothing.

**An arbitrary checkout**, with a query set of your own — the form that measures a catalog this
repository has never seen:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --repo <checkout> --docs-root <dir> --conventions <file> --corpus-id <id> --queries <file>
```

`--repo` is the root every other path is resolved against, and every path in the two documentation
flags is relative to it. `--conventions` is repeatable, once per conventions document, and may be
omitted. `--corpus-id` names the corpus: its results block, its query set's file name and every
citation of it carry that id, where an unnamed one reports itself as `ad-hoc`. `--queries` is
**required** for an unnamed ad-hoc corpus, which has no query set of its own; for a built-in id it
defaults to `evals/docs-retrieval/queries/<corpus-id>.jsonl`, and for a named one to that same path
in **this** checkout, never under `--repo`.

The rest of the surface, which `evals/docs-retrieval/args.mjs` owns and refuses an unknown flag
against:

| Flag | What it does |
| --- | --- |
| `--corpus-id <id>` | Names an ad-hoc corpus, and is legal only with `--docs-root`. The id matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is neither a built-in id nor `ad-hoc`. With `--out`, the query set must lie inside this checkout or `--repo`: a provenance path that would begin with `..` or be absolute is refused rather than written. |
| `--arms <letters>` | Which arms to run, run together or separated; the default is every arm that has a search mode. The legal letters are the arm table's, in `evals/docs-retrieval/arms.mjs`. |
| `--k <n>` | How many hits each arm returns; the default is the CLI's own `DEFAULT_RESULTS`. Every recall@k column with `k` above this is measured over a short list, so leave it at the default when comparing against a recorded figure. |
| `--repeat <n>` | How many times each query is run. Every repetition contributes a latency sample; the **first** repetition is the one scored, and a later repetition returning different refs is recorded as a non-determinism warning rather than averaged away. |
| `--data-dir <path>` | Where the index is persisted. Absent, the store is held in memory and nothing is written into any tree. |
| `--floor <path>` | The recorded floor `evals/docs-retrieval/check-floor.mjs` grades against — read by that module alone and not by a launcher run; see `## The regression floor`. |
| `--out <path>` | Where the results are written. Absent, nothing is written and the table goes to stdout. |
| `--transcript <path>` | An arm A hand-run transcript, given bare or as `<variant>=<path>`; repeatable, once per variant — see below. |

### Writing the results, and the corpus that grows when you do

`--out` rewrites **only** the region between `<!-- eval:generated:start -->` and
`<!-- eval:generated:end -->` in the file it names, one block per corpus, and leaves every byte
outside those markers alone:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --out docs/retrieval-eval-results.md
```

**A results file written into a path under `docs.root` joins the corpus the next run measures.** The
corpus is *every* `*.md` under that root, with nothing filtered out, so either keep the results file
outside it, or read each run's `snapshot` (file and chunk counts) out of the provenance before
comparing two runs. This repository takes the second route deliberately:
`docs/retrieval-eval-results.md` is itself in `self-docs`. That is why every figure recorded over that
corpus is stamped with the snapshot of the run that took it, and why **two figures carrying different
stamps are not a before/after pair** — part of the difference is the corpus, not the change under test.

### The cold-build and query-log launchers

Two passes are not entered through `run.mjs` and carry no flag of their own: each is an exported
function a launcher calls directly, filling one hand-written section of
`docs/retrieval-eval-results.md` — `## Cold build and index size` and `## The query-log pass`. Both
launchers live under `harness-runs/scratch/` and are run exactly like `eval.mjs` above.

**The cold build.** `measureColdBuild` takes `{ repoRoot, corpus, dataDir, docsRoot, conventions }`
and returns an object rather than printing one, so the launcher resolves the repo root through the
eval's own `parseArgs` and names the corpus and the index directory the recorded figures were taken
with. The corpus is named the same two ways `corpusConfig` accepts one and the choice is forwarded
untouched: a built-in id through `corpus`, or an ad-hoc corpus through `docsRoot` plus the repeatable
`conventions` — the route that reads a documentation directory **in place**, with no
`harness.config.json` in the target and no `init`, writing nothing into it but the `dataDir` this
measurement owns and removes. Naming neither is refused by `corpusConfig`, and the returned `corpus`
field is the id it resolved, so an ad-hoc figure is stamped `ad-hoc` and never passes for a built-in
one. Create `harness-runs/scratch/cold-build.mjs`:

```
import { parseArgs } from '../../evals/docs-retrieval/args.mjs';
import { measureColdBuild } from '../../evals/docs-retrieval/cold-build.mjs';
const { repo } = parseArgs([]);
console.log(JSON.stringify(await measureColdBuild({ repoRoot: repo, corpus: 'self-docs', dataDir: `${repo}/harness-runs/scratch/docs_index` }), null, 2));
```

```
bash scripts/scratch-run.sh harness-runs/scratch/cold-build.mjs
```

The same launcher over a documentation directory outside this checkout names that directory's own
repository as `repoRoot` and its `docs/` as `docsRoot`, and keeps `dataDir` on a scratch path of this
checkout so nothing is written into the corpus being read:

```
await measureColdBuild({ repoRoot: '<the corpus repository>', docsRoot: 'docs', dataDir: `${repo}/harness-runs/scratch/docs_index` });
```

**One measurement per process**, which is why the launcher calls it once and why three runs means
three invocations of that command: the returned model-load figure is a per-process load, and a second
`resolveModels` in the same process would time a load that had already happened.
`dataDir` is required — there is nothing to size about an in-memory store — and it is **removed**
before the build starts, so it names a scratch path and never an index worth keeping.

**The query-log pass.** `runQueryLogPass` takes the same parsed argument surface and returns a result
object; `renderQueryLogSection` is what turns that object into the section's prose. Create
`harness-runs/scratch/query-log-pass.mjs`:

```
import { parseArgs } from '../../evals/docs-retrieval/args.mjs';
import { renderQueryLogSection, runQueryLogPass } from '../../evals/docs-retrieval/query-log-pass.mjs';
console.log(renderQueryLogSection(await runQueryLogPass(parseArgs(['--corpus', 'self-docs']))));
```

```
bash scripts/scratch-run.sh harness-runs/scratch/query-log-pass.mjs
```

The pass takes no `--out` and writes into no document: its stdout is pasted into
`docs/retrieval-eval-results.md` under `## The query-log pass`. That section quotes the generated
region's arm E row, which `runQueryLogPass` reads live, so an `--out` run that regenerates the region
leaves the quotation describing bytes that are gone — re-run this pass after the region, never before
it, or restate the quoted row by hand. The section sits **below** the
`<!-- eval:generated:end -->` marker. Never inside the generated region — that region has exactly one
writer, and the next `--out` run destroys anything else put there.

### Arm A's row is generated, never typed

`--transcript <path>` names an arm A transcript produced by a hand run. `evals/docs-retrieval/run.mjs`
reads it, scores it through `evals/docs-retrieval/arm-a/score-transcript.mjs` → `scoreTranscript`, and
renders arm A's row in the same walk, through the same `scoreArm` call, as every other arm. So a hand
run is published by **re-running the eval** with both flags. One bare path renders the single `A` row:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --out docs/retrieval-eval-results.md --transcript <transcript>
```

The flag is repeatable in its labelled form, `<variant>=<path>`, once per variant of
`## The decision rule` → `### Two arm A variants, and how they combine`; each renders its own row, `A-index` and `A-search`, in
that order:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --out docs/retrieval-eval-results.md --transcript index=<index transcript> --transcript search=<search transcript>
```

The variants are `evals/docs-retrieval/arms.mjs` → `NAVIGATION_VARIANTS`. A label is read only where
the text before the first `=` is a bare lower-case word: `/tmp/a=b.jsonl` is a bare path, while
`other=b.jsonl` names the variant `other`. Refused by name: an unknown label, two transcripts for one variant, two bare paths, and a
bare path together with a labelled one.

Never by typing numbers between the markers: the generated region has exactly one writer, and the next
`--out` run destroys anything hand-edited there. `## Running arm A by hand` below is the procedure that
produces the transcript this flag takes.

### The two execution routes, and the one that stalls

The route above — `bash scripts/scratch-run.sh <file under harness-runs/scratch/>` — is the first of
two. The second is a command **inside** `scripts/run-gates.sh`, whose commands run as a bash
subprocess with no per-command permission check; that is where the regression gate lives, and it is
how `node evals/docs-retrieval/check-floor.mjs` is reached.

A bare interpreter invocation — `node evals/docs-retrieval/run.mjs …` typed as a tool call — matches no
entry in the unattended permission profile, and an unmatched tool call in print mode **stalls** rather
than failing: the run hangs instead of reporting a refusal. That is why the launcher exists and why
nothing in this document asks for a bare `node`. At a terminal outside a harness run the launcher route
works identically, so there is one set of commands to keep true rather than two.

## The query-set format

**This section is the only statement of the format.** `evals/docs-retrieval/queries/README.md` carries
the directory contract — one set per corpus, named `<corpus-id>.jsonl` — and cites this heading for
everything below; `evals/docs-retrieval/queries.mjs` checks it by machine.

One JSON object per line, no array wrapper and no commentary:

```json
{"id":"q-abstain-threshold","query":"when does the docs search abstain","labels":[{"ref":"docs/retrieval.md#abstention","grade":3}]}
{"id":"q-negative-lattice","query":"quantum chromodynamics lattice spacing","labels":[]}
```

- **`id`** — unique within the set, and stable: it is the key every per-query record, every quoted
  distribution and every refusal names, so renaming one orphans the history of that query.
- **`query`** — the words the consumer would send. It is passed to the arms verbatim. The committed
  sets carry natural-language questions; a set written for the harness's own agents — the first is
  `gate10-catalog` — carries short, identifier-dense agent-shaped queries, so a figure over one kind
  of set and a figure over the other are not over like-phrased sets.
- **`labels[]`** — the sections that answer it, each `{ ref, grade }`.
- **`ref`** — `path#anchor`, **exactly as a search hit cites it**: the path relative to the corpus's own
  root, a GitHub-style slug for the heading, and `path` alone for a document's preamble chunk. This is
  `SearchHit.ref`'s own spelling, which is what lets a label be compared to a hit by string equality.
- **`grade`** — an integer `1`–`3`. **`3`** is the section that *answers* the query; **`2`** is the
  middle grade, for a section that is more than related but does not itself answer; **`1`** is related
  and useful. Relevance is graded rather than binary because a threshold calibrated against "any
  related section" and one calibrated against "the answering section" are different numbers, and both
  columns ship.
- **An empty `labels` array is a negative query** — the corpus does not cover the question, and the
  right answer is to find nothing. It enters neither recall nor MRR, where it would score `0` by
  construction and drag every arm down by the share of negatives in the set. It is the other half of
  the abstention calibration: what it measures is whether an arm declines to answer.
- **`situation`** — optional; a non-empty string: one line of the task prompt, plan step or review
  finding that would issue the query.
- **`intent`** — optional; one of `surroundings` (feature surroundings and ripples), `convention`
  (convention and placement rules), `contract` (backend or contract lookups).
- **`origin`** — optional; `written` for a query written for the set, `harvested` for one taken from
  what a consumer actually sent.
- **`negativeKind`** — optional, and legal only on a negative — on a positive it is refused; `far` or
  `near`. `near` is a query plausibly adjacent to material the corpus covers, `far` one that is not.
  The class is judged from the query and the corpus's documents, never from a score.
- **A real-catalog set carries `situation`, `intent` and `origin` on every record, and `negativeKind`
  on every negative.** A record carrying none of the four loads exactly as one written before they
  existed.

**A stale label is a refusal, not a worse score.** Every `ref` is resolved against the chunk keys of
the index that was just built, **before any arm runs**, so a renamed heading fails the run loudly
instead of quietly costing every arm a hit. Measured by copying
`evals/docs-retrieval/queries/fixture-catalog.jsonl` to `harness-runs/scratch/stale-label.jsonl` with
`docs/routing.md#zone-graph` rewritten to `docs/routing.md#zone-graph-renamed`, then running the
launcher with `--corpus fixture-catalog --queries harness-runs/scratch/stale-label.jsonl`. The message:

```
eval: label docs/routing.md#zone-graph-renamed (query q-fc-route-choice, harness-runs/scratch/stale-label.jsonl) resolves to no chunk in corpus fixture-catalog
```

The query-set path is printed as the runner resolved it — absolute — and is shown here repo-relative,
because nothing in this tree may name a location on the machine that wrote it.

## What each metric means

Every figure is computed the same way for every arm, with no test on which arm produced it
(`evals/docs-retrieval/metrics.mjs`). The primary columns score `grade >= 1`; the two `strict` columns
score `grade == 3` alone. Negative queries are excluded from all four.

- **recall@k** — the share of **positive** queries whose first relevant hit lands at rank `k` or
  better. `k` is `1`, `3` and `5`. A query whose relevant section is not among the `--k` hits the arm
  returned counts as a miss at every `k`.
- **MRR** — the mean, over positive queries, of `1 / rank` of the first relevant hit, counting `0`
  for a query with no relevant hit in the returned list. It separates two arms that recall the same
  sections at different ranks, which recall@5 alone cannot.
- **p50 / p95 latency** — nearest-rank percentiles: the samples sorted ascending, index
  `ceil(p/100 × n) - 1`. The timed span is the `searchDocs` call **alone** — embedding the query, both
  arms' SQL, the fusion, and the rerank where the mode reranks — and it excludes the index build, the
  corpus walk and the eval's own loop. One sample per query per repetition, all of them kept.
  A latency figure is a property of one host on one day; `docs/retrieval-eval-results.md` states the
  host and Node version beside each.
- **cost** — not a score. Arms B–E read `local — no billed tokens` with their embed and rerank call
  counts, because they run local models and bill nothing; arm A's is an agent's token cost, summed out
  of the transcript's own usage blocks. The one-time index build those local arms depend on is charged
  where `docs/retrieval-eval-results.md` → `## Cold build and index size` puts it.
- **Abstention** — over negative queries, and **in the machine half rather than the table**: each
  corpus's trailing fenced `json` block carries `abstainedOnNegative` per arm, and a per-query
  `abstained` flag with `bestScoreOnNegative` beside every positive query's `bestScoreOnPositive`,
  and `bestRerankScore` on every query, positive and negative. The pair is **censored**: the top
  **returned** hit's score, `null` on an abstention. `bestRerankScore` is **uncensored**: the top
  reranker score the abstention test compared against the threshold, present whether or not the
  query abstained, and `null` for every arm that does not rerank, for arm A, and for a query that
  found no candidate to rerank. The threshold is
  calibrated on `bestRerankScore`, because the censored pair has already dropped every score that
  fell below it; the pair stays because it is what a caller actually received. All three are
  per-query values rather than a summary because the threshold is chosen by separating the positive
  and negative distributions. Only the reranking mode abstains at all; the arms that cannot report
  `0`, taken off their own records rather than from a letter test.

**The score columns are not comparable across arms, and the tables carry no score column for that
reason.** The non-reranking modes report rank-derived reciprocal-rank-fusion values in the
`0.004`–`0.033` range; the reranking mode reports calibrated `[0, 1]` cross-encoder scores; and arm A
reports the reciprocal of a hit's position in the agent's own answer. Compare recall, MRR and latency
across arms. Compare scores only within one arm.

## The decision rule

**Stated before any real-catalog number exists**, so it cannot be chosen to fit them. The comparison is
**arm E against arm A** — the shipped `fused-rerank` mode against index-first navigation — over the
**same query set and the same corpus at one snapshot**, which in practice means one run that carries
`--transcript`, so both rows are generated from the same pass.

Three bars. Retrieval has to clear all three.

1. **Relevance.** Arm E's recall@5 **and** MRR must exceed arm A's by more than one positive query's
   worth of the set they were measured on — more than `1 / positives` of recall@5, and more than the
   MRR a single rank-one-versus-rank-two swap produces. A lead smaller than one query is not a lead on
   a set this size; and index-first navigation is already in every agent's hands, so retrieval has to
   be *better*, not equal.
2. **Cost.** Arm E's p95 latency is milliseconds of local compute and arm A's is agent wall time per
   query, so the bar is the **ratio between them**: arm E's p95 must be a fraction of arm A's per-query
   wall time, both taken from the same pass. No absolute wall-clock ceiling stands behind that bar, and
   this bar states no constant of its own — the cold-build section records why there is no such budget
   to measure against. And arm E bills **no** tokens against arm A's one agent call per query. The
   charge against retrieval is its **one-time** cold build, plus the index on disk, both recorded in
   `docs/retrieval-eval-results.md` → `## Cold build and index size` with the decision about where that
   build belongs.
3. **Failure.** On negative queries arm E must abstain at least as reliably as arm A answers `none`.
   An arm that answers confidently where the catalog says nothing is worse than one that sends the
   agent to the index, because a wrong pointer is read as an answer.

The outcomes, each a different change:

- **All three clear** → retrieval goes **on by default**: `docs.retrieval`'s default flips, which is the
  four-place contract `.claude/context/conventions.md` → `### The order files are created…` describes
  (schema, model, check, `docs/config.md` §5).
- **Relevance clears, cost does not** → retrieval **stays opt-in**, as it ships today, and the cost
  figure that failed is recorded as the thing a later change has to move.
- **Relevance does not clear** → retrieval is **withdrawn**: the tool and its optional dependencies
  come out, and this eval and its numbers stay as the record of why.

### Two arm A variants, and how they combine

**The reading chosen on 2026-09-23, before any real-catalog figure, uncensored score or arm A transcript
existed**; the commit that adds this subsection precedes every one of them. It applies the rule above and
amends none of it: the three bars and the three outcomes stand as written.

**The two variants.** An adopter's agents navigate a catalog in two ways, so arm A runs in both:

- **A-index** — told to read the catalog's `INDEX.md` first and follow its links.
- **A-search** — told only that the catalog is rooted in its working directory, and left to find
  sections with its tools.

Both carry the same `Read` / `Grep` / `Glob` tool set, so they differ in their instruction alone.

**The combination.** Retrieval has to beat **the stronger alternative an agent has**, so each bar is
graded against whichever variant does better **on that bar**, and the verdict is the one that comparison
produces. The verdict is **also recorded against each variant separately**, because an adopter whose
catalog has no index faces A-search alone.

**The readings the combination leaves open:**

- **"Stronger" is per metric.** Where a bar carries two figures — relevance's recall@5 and MRR — each is
  graded against whichever variant's figure is higher, even when that makes the comparison a composite no
  single variant produced.
- **A variant's figure is the median of its repetitions.** Every repetition is reported; the median is
  the one a bar grades.
- **Pooled figures decide.** Relevance is graded on the pooled query set, with the per-half figures
  reported beside it; failure on all negatives together, with the `far` and `near` figures reported
  beside it.
- **The cost bar's *"a fraction"* is any ratio below 1.** The results state that both cost figures clear
  by construction — local milliseconds and zero billed tokens against an agent session per query — so the
  cost bar cannot discriminate here and the verdict turns on relevance and failure. The one-time cold
  build and the index on disk are cited and graded against nothing.
- **Relevance and cost clear, failure does not** — a combination the three outcomes do not name — reads
  as **stays opt-in**, with arm E's abstention rate on negatives recorded as the figure a later change
  must move.
- **A variant stopped at the cost checkpoint** of its first repetition is graded on the repetitions it
  has, marked *partial* wherever its figures appear, and its stop is recorded as a cost result of its
  own. It does not make the rule inapplicable.

**The statistics the rule does not name.** `positives` and `negatives` are the pooled counts of the query
set used. Arm E's figures come from its generated block; arm A's are taken per repetition, from that
repetition's transcript as `scoreTranscript` scores it, and a variant's figure is their median.

- **Relevance margins.** One positive query's worth is `1 / positives` of recall@5 and `0.5 / positives`
  of MRR — what MRR loses when one query moves from rank 1 to rank 2. Arm E's lead over the stronger
  figure must **exceed** each margin; a lead equal to one does not clear.
- **Per-query wall time.** Per repetition, the nearest-rank p50 (`## What each metric means`) of that
  repetition's per-query `durationMs`. The cost ratio is arm E's p95 latency over the stronger variant's
  median of those — the stronger being the lower.
- **Token cost per query.** Per repetition, the sum over its records of `input_tokens + output_tokens +
  cache_creation_input_tokens + cache_read_input_tokens`, divided by the record count; a field absent
  from a record's `usage` counts as `0`. Every usage field is also reported on its own. The variant's
  figure is the median; the stronger is the lower.
- **Failure.** Arm E's `abstainedOnNegative / negatives` against the stronger variant's median share of
  negatives answered `none` — per repetition, the negatives its records score as `abstained`
  (`evals/docs-retrieval/arm-a/score-transcript.mjs`: the single answer `none`, or no ref at all) over
  `negatives`. Arm E's share must be at least as high; an equal share clears.

**The rule compares E to A; the recorded figures also bear on which mode is the default.** This rule
is silent on arm D, and on both committed corpora arm D `fused` outscores the shipped `fused-rerank`
default on every primary relevance column while abstaining on no negative query at all — recorded, with the
decomposition, in `docs/retrieval-eval-results.md` → `## The shipped default against fusion alone`. It
is a measurement rather than a second decision rule: what to do about the default mode is not settled
there and is not settled here.

**The decision is taken on a real catalog, not on either committed corpus.** Both are far below a
mature catalog's size, and the standing rule in the lessons ledger is that a figure measured on a
fixture-sized corpus never justifies a design decision on its own, and that rule binds whatever these
two corpora measure. The step that produces the real-shape figure has since been taken:
`docs/development.md` §5 → gate 10 was run by hand on **2026-09-22** against a private real
documentation catalog held outside this checkout — commit `010c50e`, **156 files / 1,960 chunks** —
and its figures are recorded in `docs/retrieval-eval-results.md` → `## Cold build and index size`,
which is their one home. What that run settles is the real-catalog **cost** side — the cold build and
the index on disk — and not this rule's verdict, which is an arm E against arm A comparison. **That
verdict has since been taken**: the arm A hand run `## Running arm A by hand` below describes was run on
the same catalog, this rule was applied to it bar by bar, and the outcome is **withdrawn** —
`docs/retrieval-eval-results.md` → `## The decision, applied to the real catalog` is its record. The
corpora here fix the *procedure* and the regression floor, not the verdict.

## The regression floor

**This is the record of the floor policy** — the only place the margin, the reason for it, the reason
for the single corpus and the re-record rule are stated. `evals/docs-retrieval/floor.json`'s `see`
field and `docs/development.md` §5's gate 11 paragraph both cite this section and state none of it.

**What `floor.json` holds.** One entry per `{ corpus, arm, metric }` — `recallAt5` and `mrr`, for every
arm the eval's arm table has a search mode for — each with the recorded value and a `recordedAt` date,
plus the single `see` field naming this section. No prose rule lives in that file, and the arm keys are
graded against the arm table itself: a key the table does not carry is refused by name, and an arm the
table carries with no entry is reported, so the two cannot drift apart in silence.

**The margin, and why there is one.** Each recorded floor sits **0.05 below the measured value**,
truncated down to two decimals. A floor is a **regression tripwire, not a target**: recorded at the
measurement it would fail on any difference at all, including the ones that are not regressions — a
tie broken the other way, a patch-level change in the store's ranking or in a model runtime. The margin
is deliberately **smaller than the recall a single positive query contributes** on that corpus's query
set, so one genuinely lost hit still trips the gate while sub-query noise does not. This is the one
figure in this document that is not a pointer into
`docs/retrieval-eval-results.md`: the margin is a decision, and this section is its home.

**Why the gate grades `fixture-catalog` alone.** That corpus is committed and moves only when this eval
moves, so a change in its numbers is a property of the retrieval code. `self-docs` is this repository's
own documentation and moves whenever any branch edits a document — a floor over it would fail on
unrelated work and be switched off within a month. `self-docs` figures are recorded in
`docs/retrieval-eval-results.md` and re-taken deliberately; they are not enforced.

**The same-commit re-record rule.** A change that legitimately moves a floor **re-records it in the same
commit as the change that moved it**, with the reason. The changes that legitimately move one are: a
change to the fixture corpus or its query set, to the chunker, to the models, or to the search modes.
Adding a document under `docs/` is **not** one of them — it moves `self-docs` and the gate does not
grade `self-docs`. A floor lowered in a commit of its own, or lowered to make a red gate green, is the
failure this gate exists to catch.

**What a shortfall looks like.** Measured by planting one: `RERANK_CANDIDATES` in
`cli/src/retrieval/search.ts` temporarily cut from its shipped value to a single candidate, so the
reranking arm saw one row to rank, `bash scripts/run-gates.sh` run, and the change reverted. The script reported `FAIL  11 docs-retrieval relevance floor (exit 1)` and
exited 1, on this line:

```
check-floor: fixture-catalog arm E recall@5 floor 0.61 (recorded 2026-09-21), measured 0.3333333333333333 — below the floor. Snapshot { files: 9, chunks: 41 }. docs/retrieval-eval.md → ## The regression floor
```

An **empty model cache** is a different outcome: the gate module exits with a status reserved for that
case, and `scripts/run-gates.sh` prints it as `BLOCKED`, lists it with the gates it cannot run, and
counts it among neither the passes nor the failures — a provisioning gap is not a regression. A
shortfall is not exempt: it fails the script. `docs/development.md` §5 → gate 11 states what the gate
runs and what a failure means.

## Running arm A by hand

**Who runs this, and why it is you.** Arm A needs a nested agent subprocess, and no automated route in
this repository may start one: the unattended permission profile carries no grant for the agent binary
and an unmatched tool call stalls in print mode rather than refusing, while the `scratch-run.sh` route
to the same subprocess is declined on purpose rather than unavailable — it would put an unsupervised
agent session with its own auth and no token cap inside an unattended run. So an operator at a terminal
runs arm A, and nobody else. `docs/retrieval-eval-results.md` → `## Arm A — the real-catalog hand run` is the
record of that decision; the mechanism is `evals/docs-retrieval/arm-a/run-arm-a.sh`, and the task
texts it sends are `evals/docs-retrieval/arm-a/agent-task.md` for A-index and
`evals/docs-retrieval/arm-a/agent-task-search.md` for A-search — those names, not `prompt.md`, for the
reason `agent-task.md`'s own opening comment gives. What the two variants are, and how their figures
are graded, is `## The decision rule` → `### Two arm A variants, and how they combine`.

**A third route, a dispatched subagent, is rejected as well, and nothing is built for it.** Each of
its three differences from the script would change what is measured. It returns its answer and no
`usage` block, so the cost column — the one column arm A has and arms B–E cannot — would be empty. It
inherits the parent session's working directory and context instead of starting clean in the corpus
root, so its `ref`s are not relative to the corpus and its answers carry whatever the parent had
already read. And its tools are fenced by the static allowlist of its agent definition, not by the
per-invocation `--allowed-tools`, `--disallowed-tools` and `--strict-mcp-config` the script passes on
every query.

**Before spending tokens.** Two things are settled first: that the route can score at all, and that
the invocation is right.

*The route is comparable — measured, not assumed.* Arms B–E reach a catalog outside this checkout
through the ad-hoc corpus route (`--repo`, `--docs-root`, `--corpus-id`), while arm A is handed a
corpus root on its command line. The comparison rests on a `ref` arm A writes being string-comparable
to a label and to a B–E hit when the catalog is read that way. Measured on 2026-09-23 by reading the
fixture catalog both ways in one process: as the built-in `--corpus fixture-catalog`, and copied to
`harness-runs/scratch/throwaway-catalog/docs/` and read as a repository of its own through
`--repo harness-runs/scratch/throwaway-catalog --docs-root docs --corpus-id throwaway-catalog`. Both
passes ran over the three queries `evals/docs-retrieval/arm-a/sample-transcript.json` answers, and
both scored that transcript as arm A. The launcher, `harness-runs/scratch/comparability.mjs`:

```js
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { parseArgs } from '../../evals/docs-retrieval/args.mjs';
import { runEval } from '../../evals/docs-retrieval/run.mjs';
const { checkout } = parseArgs([]);
const at = (path) => `${checkout}/${path}`;
const sample = at('evals/docs-retrieval/arm-a/sample-transcript.json');
const cut = at('harness-runs/scratch/comparability.jsonl');
const ids = JSON.parse(readFileSync(sample, 'utf8')).records.map((record) => record.id);
writeFileSync(cut, readFileSync(at('evals/docs-retrieval/queries/fixture-catalog.jsonl'), 'utf8').split('\n').filter((line) => line && ids.includes(JSON.parse(line).id)).join('\n'));
cpSync(at('evals/docs-retrieval/corpora/fixture-catalog/docs'), at('harness-runs/scratch/throwaway-catalog/docs'), { recursive: true });
const shape = (corpus) => JSON.stringify([corpus.snapshot, corpus.arms.map(({ letter, metrics }) => [letter, metrics.recall[5], metrics.mrr, metrics.perQuery.map((query) => [query.id, query.hits.map((hit) => hit.ref), query.bestRerankScore])])]);
try {
  const builtIn = await runEval(parseArgs(['--corpus', 'fixture-catalog', '--queries', cut, '--transcript', sample]));
  const adHoc = await runEval(parseArgs(['--repo', 'harness-runs/scratch/throwaway-catalog', '--docs-root', 'docs', '--corpus-id', 'throwaway-catalog', '--queries', cut, '--transcript', sample]));
  console.log(shape(builtIn) === shape(adHoc) ? `comparable: ${shape(adHoc)}` : `NOT comparable:\n${shape(builtIn)}\n${shape(adHoc)}`);
} finally {
  rmSync(at('harness-runs/scratch/throwaway-catalog'), { recursive: true, force: true });
  rmSync(cut, { force: true });
}
```

```
bash scripts/scratch-run.sh harness-runs/scratch/comparability.mjs
```

Both passes resolved every label, and the launcher printed a line opening
`comparable: [{"files":9,"chunks":41},[["B",1,0.41666666666666663,` — the same snapshot, and every
arm's recall@5, MRR, per-query `hits[].ref` list and `bestRerankScore` identical across the two routes.
Arm A's refs were `docs/rates.md#surcharges`, `docs/rates.md#fuel-surcharge` and
`docs/rates.md#volumetric-weight` for `q-fc-billable-weight` on both, the transcript's
`./`-prefixed third ref normalised the same way each time. Arms B–D matched on full five-hit lists.
Arm E abstained on all three queries on both routes, so its ref lists are empty on each side and its
agreement rests on the three uncensored `bestRerankScore` values, which matched to every digit. The
copy and the cut query set are removed in process. The query set and the transcript are passed
**absolute** because every path argument after `--repo` is resolved against `--repo` — which is why
`--out` and `--transcript` are given as `"$PWD/…"` in `### What to do with the result` below.

*What the comparison does not cover, settled rather than hidden.* Arms B–E index `docs.root` **plus
every conventions document** — for a catalog read through `--docs-root`, the ones passed as
`--conventions`, which are the ones the catalog's own `harness.config.json` → `layers[].conventions`
names. Neither arm A variant is pointed at them, though both can read them from the corpus root. And
A-index's index need not link every half of a mixed catalog. Both are limits of the comparison, not
defects to correct: the results report each half, and the labels that land in a conventions document,
apart from the pooled figure, and no root index is written to close the gap.

*The invocation.* None of these spends a token. Confirm the agent CLI's print-mode flags — `-p`,
`--output-format stream-json`, `--verbose`, `--allowed-tools`, `--disallowed-tools`,
`--strict-mcp-config` and `--model` — against its own help, naming the binary the way
`HARNESS_AGENT_CLI` below does if it is not `claude`:

```
claude --help
```

The script carries them as the documented surface. They were confirmed against Claude Code `2.1.280`'s
own `--help` before the real-catalog run (`docs/retrieval-eval-results.md` → `## Arm A — the
real-catalog hand run`), and a flag renamed in a later version still shows up as a failed first query
rather than as a refusal. Then the checks the script's own `REPRO` header
block lists — each task file's token counts, which must print `1`, `1`, `1` and `0` in this order:

```
grep -c '{{query}}' evals/docs-retrieval/arm-a/agent-task.md
grep -c '{{index}}' evals/docs-retrieval/arm-a/agent-task.md
grep -c '{{query}}' evals/docs-retrieval/arm-a/agent-task-search.md
grep -c '{{index}}' evals/docs-retrieval/arm-a/agent-task-search.md
```

the query set's ids parse:

```
jq -r .id evals/docs-retrieval/queries/<corpus-id>.jsonl
```

and, for A-index, the index exists under the corpus root:

```
ls "$HARNESS_EVAL_CORPUS_ROOT/<index>"
```

The script refuses the first and the last on its own before any agent call — exit 65 for a wrong token
count, 66 for a missing index — so these checks find the fault before a pass is launched rather than
after. One further check costs the first query alone and is worth it: that the transcript's first
record carries bare `path#anchor` strings in its `refs` array and no `` ``` `` entry — a fenced answer
is scored as references and silently costs every rank.

### The command

From the repository root:

```
bash evals/docs-retrieval/arm-a/run-arm-a.sh \
  evals/docs-retrieval/corpora/fixture-catalog \
  evals/docs-retrieval/queries/fixture-catalog.jsonl \
  /tmp/arm-a-fixture-catalog-rep1.jsonl
```

`bash` explicitly: the script is committed non-executable. The three arguments are **relative to the
base the script documents** — the working directory your shell is in when you invoke it, which the
script resolves before it changes directory — and are never prefixed with a derived checkout root.
They are, in order: the **corpus root**, the directory holding the catalog's `docs/`, which becomes the
agent's own working directory so it cannot read past the corpus and every `ref` it writes is relative
to it; the **query set**, a labelled set from `evals/docs-retrieval/queries/`; and the **output path**,
appended to one JSON record per query as each finishes, created if absent — its directory is not.
With no option the variant is A-index and the index is `docs/INDEX.md`, which is what the fixture
carries.

**The real catalog**, one command per variant and repetition, with `<N>` running `1` to `5`. The
catalog is named by `HARNESS_EVAL_CORPUS_ROOT` alone — its repository root, exported machine-locally,
the same value the eval's `--repo` takes — so no command and no committed file carries its location.
The query set is the one committed for the corpus under its id, and the outputs go to a gitignored
scratch directory, which exists first:

```
mkdir -p harness-runs/scratch/arm-a/<corpus-id>
```

A-index, with `--index` naming the index relative to the corpus root:

```
bash evals/docs-retrieval/arm-a/run-arm-a.sh --variant index --index <index> --model <name> "$HARNESS_EVAL_CORPUS_ROOT" evals/docs-retrieval/queries/<corpus-id>.jsonl harness-runs/scratch/arm-a/<corpus-id>/index-rep<N>.jsonl
```

A-search, which takes no `--index`:

```
bash evals/docs-retrieval/arm-a/run-arm-a.sh --variant search --model <name> "$HARNESS_EVAL_CORPUS_ROOT" evals/docs-retrieval/queries/<corpus-id>.jsonl harness-runs/scratch/arm-a/<corpus-id>/search-rep<N>.jsonl
```

**What each session starts with.** No MCP server: `--strict-mcp-config` keeps a catalog's own
docs-search server from handing the agent a retrieval tool outside the fence. A harness-initialised
catalog's own `CLAUDE.md` **is** still loaded, because the corpus root is the working directory — the
realistic adopter case, since an adopter's agents navigate with it loaded too. And every record carries
`toolCalls`, the session's tool calls counted by name: it is how a reader later tells whether A-index
grepped instead of following its index, and whether any session used a tool outside the fence.

The agent binary is reached through `${HARNESS_AGENT_CLI:-claude}` — set `HARNESS_AGENT_CLI` to name it
if `claude` is not what is on your PATH. That single indirection is the place the engine binary is
chosen (`ARCHITECTURE.md` §4).

**One output path per repetition.** The script appends, so pointing two repetitions at one file leaves
two records per query id in a file the scorer reads as a single pass.

### The tool set, and the network

The property the measurement depends on: **arm A is read-only over the corpus and nothing else.**
`Read`, `Grep` and `Glob` are granted — what navigating a catalog needs — and `Bash`, `Write`, `Edit`,
`MultiEdit`, `NotebookEdit`, `WebFetch` and `WebSearch` are withheld. The script passes both the allow
list and the deny list, because an allow list that a future default widens is not on its own a fence.

Each withheld tool would invalidate a different thing. A **web tool** makes the arm something other
than index-first navigation over the corpus: an answer assembled from the open web is not the
alternative retrieval is being measured against, and its `ref`s would cite sections the corpus does not
contain. A **shell** makes the tool fence meaningless — anything withheld above is reachable through
it — so the run would no longer be bounded by the corpus at all. `Write`, `Edit`, `MultiEdit` and
`NotebookEdit` would let the arm modify the corpus it is being scored over.

**How it is kept off the network:** the withheld web tools are the whole of it on the tool side. After
the run, confirm no web tool call appears in the run's output. The session's **own model traffic** is
not "the network" in this sense — every arm's inference goes somewhere, arms B–E to a local runtime and
arm A to the agent's API — and it is not what this fence is about; what is fenced is the arm reaching
material outside the corpus.

### Reading the token cost out of the run

The script requests `--output-format stream-json --verbose` and keeps two fields of the stream's final
`result` event: `.result`, the answer, split into the record's `refs` in the order the agent gave them
with nothing repaired; and `.usage`, **verbatim**, as the record's `usage`. Token counts live in that
block's own fields. From the rest of the stream it keeps only the `tool_use` names, counted into
`toolCalls` — no tool input, which carries absolute paths. One record, with invented numbers, in the
shape the script writes (`evals/docs-retrieval/arm-a/sample-transcript.json` commits the same shape
without `variant` and `toolCalls`):

```json
{"id":"q-fc-verify-callback","query":"how do i prove a callback really came from you and not from someone replaying one","refs":["docs/webhooks.md#signature-verification","docs/webhooks.md#delivery-and-retries"],"durationMs":14000,"usage":{"input_tokens":9120,"output_tokens":48,"cache_read_input_tokens":0},"variant":"index","toolCalls":{"Read":3}}
```

`durationMs` has **whole-second resolution**: the `bash` floor in this tree is 3.2 and BSD `date` has
no sub-second format, which an agent turn measured in seconds can afford.

The **figure recorded for arm A is the sum over the whole query set for one repetition**, and that is
what the published row carries: `score-transcript.mjs` sums every numeric field of every record's
`usage` by field name and renders arm A's `cost` cell as
`agent hand run over <n> queries — <field> <total>, …`. **Keep the per-query figures as well** — they
are the per-record `usage` blocks in your transcripts — because arm A's cost is the column arms B–E
cannot have, and a total alone cannot say whether one pathological query paid for the arm.

No money figure enters the transcript: the script keeps `.usage` alone, so converting tokens to a
charge is done outside it, at your own rates, and is not part of the recorded row.

### Five repetitions, and what is recorded

Take **five** repetitions of the whole query set **per variant**, each to its own output path, and
**record every one**. An agent arm is not deterministic, so a single run has no spread to report, and
a spread is the difference between a result and an anecdote. What goes in the record, for each of
A-index and A-search:

- The **median** and the **p95** across the five repetitions, for latency and for token cost.
- The **per-repetition** recall@5 and MRR — five values each, not their mean alone — pooled and per
  half of a mixed catalog.
- The **per-query `usage` blocks**, which are the committed transcripts themselves.
- The **host stamp**, in the shape every other figure in `docs/retrieval-eval-results.md` carries
  (host, Node version, timestamp), plus the agent CLI's version and the model the sessions ran
  against — latency and token cost both move with the model, so a figure that does not name it is
  unreadable.
- The account's **5-hour and 7-day usage-window utilisation**, read before and after each pass.

How these figures are graded — which repetition statistic a bar reads, and how the two variants
combine — is `## The decision rule` → `### Two arm A variants, and how they combine`, and is not
restated here.

**A repetition whose returned refs differ from the others is kept and reported, never discarded.** The
spread is itself a result: an arm whose answers move between runs is a different proposition from one
whose answers do not, whatever its mean. Discarding the odd repetition would report the second arm's
figures for the first arm's behaviour.

### What to do with the result

Score each repetition on its own, which prints the table and writes nothing. On the fixture:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --transcript /tmp/arm-a-fixture-catalog-rep1.jsonl
```

On the real catalog, one repetition of both variants per run, with one `--conventions` per document
the catalog's own `harness.config.json` names — the checkout-side paths given as `"$PWD/…"` from this
repository's root, because every relative path after `--repo` resolves inside the catalog:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --repo "$HARNESS_EVAL_CORPUS_ROOT" --docs-root <docs-root> --conventions <file> --corpus-id <corpus-id> --transcript index="$PWD/harness-runs/scratch/arm-a/<corpus-id>/index-rep<N>.jsonl" --transcript search="$PWD/harness-runs/scratch/arm-a/<corpus-id>/search-rep<N>.jsonl"
```

The query set is not named: for a corpus named by `--corpus-id` it defaults to
`evals/docs-retrieval/queries/<corpus-id>.jsonl` in this checkout. Inside a harness run the variable is
not expanded on a command line, which is not reliably auto-allowed there; the same arguments go into a
launcher under `harness-runs/scratch/` that reads `process.env.HARNESS_EVAL_CORPUS_ROOT` itself.

Each transcript goes to `scoreTranscript({ transcript, queries })`, whose records go into the same
`scoreArm` call as arms B–E, so arm A's metrics come from the same metric code and are comparable to
theirs by construction. Then **publish by re-running the eval** with `--out` and **repetition 1** of
each variant, matching `--repeat`'s own rule that the first repetition is the scored one, and let the
results renderer regenerate the `A-index` and `A-search` rows in the same walk that renders every
other row:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --repo "$HARNESS_EVAL_CORPUS_ROOT" --docs-root <docs-root> --conventions <file> --corpus-id <corpus-id> --out "$PWD/docs/retrieval-eval-results.md" --transcript index="$PWD/<index rep 1>" --transcript search="$PWD/<search rep 1>"
```

**The row is never hand-edited.** It sits inside the `<!-- eval:generated:start -->` /
`<!-- eval:generated:end -->` region, which has exactly one writer, so numbers typed there are
destroyed by the next `--out` run without a word.

**The spread is hand-written**, and goes under `docs/retrieval-eval-results.md` → `## Arm A — the
real-catalog hand run` — **below the end marker**, which is hand-written territory the runner never rewrites.
Rename that heading once a number exists; a section still announcing an awaited run above a recorded
one is a false record. Read the filled row against `## The decision rule` above, which was written
before any arm A number existed precisely so this comparison cannot be chosen to fit it.

**What gate 10 settled, and the hand run that followed it.** Arm A on `fixture-catalog` fixes the
procedure; the verdict is taken on a real catalog. `docs/development.md` §5 → gate 10 has been run — by
hand, in full, on 2026-09-22 against a private real documentation catalog held outside this checkout,
commit `010c50e`, 156 files / 1,960 chunks — and what it produced is the real-catalog **cold-build and
index-size** evidence (`docs/retrieval-eval-results.md` → `## Cold build and index size`) together
with leg (iv)'s confirmation of the abstention threshold at both ends (that file's `### The limit on
this calibration`, a confirmation and not a re-calibration). Gate 10 is **not** the arm A hand run.
That run was taken on **2026-09-23**, on the same catalog at commit `57a6c25` — a later commit whose
`docs/` is unchanged from `010c50e`'s — against the labelled set `evals/docs-retrieval/queries/gate10-catalog.jsonl`, both variants,
five repetitions each, by the procedure this section gives. Its record — how it was taken, its
transcripts and its figures — is `docs/retrieval-eval-results.md` → `## Arm A — the real-catalog hand
run`, and the verdict `## The decision rule` above takes on it is that file's `## The decision, applied
to the real catalog`.
