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
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --repo <checkout> --docs-root <dir> --conventions <file> --queries <file>
```

`--repo` is the root every other path is resolved against, and every path in the two documentation
flags is relative to it. `--conventions` is repeatable, once per conventions document, and may be
omitted. `--queries` is **required** for an ad-hoc corpus, which has no query set of its own; for a
built-in id it defaults to `evals/docs-retrieval/queries/<corpus-id>.jsonl`.

The rest of the surface, which `evals/docs-retrieval/args.mjs` owns and refuses an unknown flag
against:

| Flag | What it does |
| --- | --- |
| `--arms <letters>` | Which arms to run, run together or separated; the default is every arm that has a search mode. The legal letters are the arm table's, in `evals/docs-retrieval/arms.mjs`. |
| `--k <n>` | How many hits each arm returns; the default is the CLI's own `DEFAULT_RESULTS`. Every recall@k column with `k` above this is measured over a short list, so leave it at the default when comparing against a recorded figure. |
| `--repeat <n>` | How many times each query is run. Every repetition contributes a latency sample; the **first** repetition is the one scored, and a later repetition returning different refs is recorded as a non-determinism warning rather than averaged away. |
| `--data-dir <path>` | Where the index is persisted. Absent, the store is held in memory and nothing is written into any tree. |
| `--floor <path>` | The recorded floor `evals/docs-retrieval/check-floor.mjs` grades against — read by that module alone and not by a launcher run; see `## The regression floor`. |
| `--out <path>` | Where the results are written. Absent, nothing is written and the table goes to stdout. |
| `--transcript <path>` | An arm A hand-run transcript — see below. |

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

**The cold build.** `measureColdBuild` takes `{ repoRoot, corpus, dataDir }` and returns an object
rather than printing one, so the launcher resolves the repo root through the eval's own `parseArgs`
and names the corpus and the index directory the recorded figures were taken with. Create
`harness-runs/scratch/cold-build.mjs`:

```
import { parseArgs } from '../../evals/docs-retrieval/args.mjs';
import { measureColdBuild } from '../../evals/docs-retrieval/cold-build.mjs';
const { repo } = parseArgs([]);
console.log(JSON.stringify(await measureColdBuild({ repoRoot: repo, corpus: 'self-docs', dataDir: `${repo}/harness-runs/scratch/docs_index` }), null, 2));
```

```
bash scripts/scratch-run.sh harness-runs/scratch/cold-build.mjs
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
`docs/retrieval-eval-results.md` under `## The query-log pass`, which sits **below** the
`<!-- eval:generated:end -->` marker. Never inside the generated region — that region has exactly one
writer, and the next `--out` run destroys anything else put there.

### Arm A's row is generated, never typed

`--transcript <path>` names an arm A transcript produced by a hand run. `evals/docs-retrieval/run.mjs`
reads it, scores it through `evals/docs-retrieval/arm-a/score-transcript.mjs` → `scoreTranscript`, and
renders arm A's row in the same walk, through the same `scoreArm` call, as every other arm. So a hand
run is published by **re-running the eval** with both flags:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --out docs/retrieval-eval-results.md --transcript <transcript>
```

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
- **`query`** — the words a person would actually type. It is passed to the arms verbatim.
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
  `abstained` flag with `bestScoreOnNegative` beside every positive query's `bestScoreOnPositive`.
  Those are per-query values rather than a summary because the abstention threshold is chosen by
  separating the two distributions. Only the reranking mode abstains at all; the arms that cannot
  report `0`, taken off their own records rather than from a letter test.

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
   query, so the bar is that arm E's p95 stays inside the agent tool-call budget the cold-build
   section names while remaining a fraction of arm A's; and that arm E bills **no** tokens against arm
   A's one agent call per query. The charge against retrieval is its **one-time** cold build, plus the
   index on disk, both recorded in `docs/retrieval-eval-results.md` → `## Cold build and index size`
   with the decision about where that build belongs.
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

**The rule compares E to A; the recorded figures also bear on which mode is the default.** This rule
is silent on arm D, and on both committed corpora arm D `fused` outscores the shipped `fused-rerank`
default on every relevance column while abstaining on no negative query at all — recorded, with the
decomposition, in `docs/retrieval-eval-results.md` → `## The shipped default against fusion alone`. It
is a measurement rather than a second decision rule: what to do about the default mode is not settled
there and is not settled here.

**The decision is taken on a real catalog, not on either committed corpus.** Both are far below a
mature catalog's size, and the standing rule in the lessons ledger is that a figure measured on a
fixture-sized corpus never justifies a design decision on its own. The step that produces the
real-shape figure is the hand run in `docs/development.md` §5 → gate 10, against a private real
catalog; the corpora here fix the *procedure* and the regression floor, not the verdict.

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
runs arm A, and nobody else. `docs/retrieval-eval-results.md` → `## Arm A — awaiting a hand run` is the
record of that decision; the mechanism is `evals/docs-retrieval/arm-a/run-arm-a.sh` and the task text
it sends is `evals/docs-retrieval/arm-a/agent-task.md` — that name, not `prompt.md`, for the reason the
file's own opening comment gives.

**Before spending tokens.** Confirm the agent CLI's print-mode flag spellings — `-p`,
`--output-format`, `--allowed-tools`, `--disallowed-tools` — against its own `--help`. The script
carries them as the documented surface and **has never been run**, so a renamed flag shows up as a
failed first query rather than as a refusal. Then the three cheap checks the script's own `REPRO`
header block lists: the task text holds exactly one `{{query}}` token, the query set's ids parse, and
the corpus root carries `docs/INDEX.md`.

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
appended to one JSON record per query as each finishes, created if absent.

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

The script requests `--output-format json` and keeps two fields of the result object: `.result`, the
answer, split into the record's `refs` in the order the agent gave them with nothing repaired; and
`.usage`, **verbatim**, as the record's `usage`. Token counts live in that block's own fields. One
record, with invented numbers, in the shape
`evals/docs-retrieval/arm-a/sample-transcript.json` commits:

```json
{"id":"q-fc-verify-callback","query":"how do i prove a callback really came from you and not from someone replaying one","refs":["docs/webhooks.md#signature-verification","docs/webhooks.md#delivery-and-retries"],"durationMs":14000,"usage":{"input_tokens":9120,"output_tokens":48,"cache_read_input_tokens":0}}
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

Take **five** repetitions of the whole query set, each to its own output path, and **record every
one**. An agent arm is not deterministic, so a single run has no spread to report, and a spread is the
difference between a result and an anecdote. What goes in the record:

- The **median** and the **p95** across the five repetitions, for latency and for token cost.
- The **per-repetition** recall@5 and MRR — five values each, not their mean alone.

**A repetition whose returned refs differ from the others is kept and reported, never discarded.** The
spread is itself a result: an arm whose answers move between runs is a different proposition from one
whose answers do not, whatever its mean. Discarding the odd repetition would report the second arm's
figures for the first arm's behaviour.

### What to do with the result

Score each repetition on its own, which prints the table and writes nothing:

```
bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog --transcript /tmp/arm-a-fixture-catalog-rep1.jsonl
```

That hands the transcript to `scoreTranscript({ transcript, queries })`, whose records go into the same
`scoreArm` call as arms B–E, so arm A's metrics come from the same metric code and are comparable to
theirs by construction. Then **publish by re-running the eval** — `--out
docs/retrieval-eval-results.md --transcript <path>`, through the launcher route `## How to run it`
above names — and let the results renderer regenerate arm A's row in the same walk that renders every
other row. `--transcript` takes one path, so the run that publishes carries the **first**
repetition's transcript, matching `--repeat`'s own rule that the first repetition is the scored one.

**The row is never hand-edited.** It sits inside the `<!-- eval:generated:start -->` /
`<!-- eval:generated:end -->` region, which has exactly one writer, so numbers typed there are
destroyed by the next `--out` run without a word.

**The spread is hand-written**, and goes under `docs/retrieval-eval-results.md` → `## Arm A — awaiting
a hand run` — **below the end marker**, which is hand-written territory the runner never rewrites.
Rename that heading once a number exists; a section still announcing an awaited run above a recorded
one is a false record. Read the filled row against `## The decision rule` above, which was written
before any arm A number existed precisely so this comparison cannot be chosen to fit it.

**This step does not close the roadmap row, and neither did this branch.** Arm A on `fixture-catalog`
fixes the procedure; the verdict is taken on a real catalog. This hand run plus the private-catalog
numbers from `docs/development.md` §5 → gate 10 are together what closes it.
