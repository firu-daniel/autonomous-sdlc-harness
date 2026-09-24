`chore_gate_10_real_catalog_measurement` runs `docs/development.md` §5 **gate 10** against a real documentation
catalog for the first time, and replaces the extrapolation the docs-retrieval cost decisions currently rest on
with measured figures. It follows `feat_docs_retrieval_eval`, which built the eval, calibrated the abstention
threshold, and recorded the cold-build cost as an extrapolation from a 177-chunk corpus because no larger one
had ever been built.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Refer to other
> roadmap items by title only.

> ⚠️ **This branch consumes measurements it cannot take.** Gate 10 is a hand run: leg (i) installs a runtime and
> downloads models, it must run against a throwaway repository **outside this checkout**, and no automated route
> in this repository may perform it. The operator runs the legs and hands in a figures block; the branch's own
> work is everything that follows from those figures. `## The pre-step` below is the contract for that hand-off.
>
> **THE MEASUREMENTS ARE ALL TAKEN.** `## The figures block` below carries gate 10 legs (i)-(vi) **and**
> acceptance 2a's eval-route cross-check, all against `<home>/Work/gate10-corpus` on 2026-09-22.
> **Nothing is owed by the operator, so nothing here is a reason to park.** Do not re-run a leg, do not
> re-derive a figure the block carries, and do not substitute a fixture-sized run for one. The branch's
> work is the document work that follows from these figures.

---

## Why now

Three decisions in this tree currently rest on one extrapolation, and no catalog of the extrapolated size has
ever been built:

- **What a cold build costs on a real catalog.** The per-chunk refresh cost of 62.51 ms was measured at 177
  chunks and extended to a hypothetical ~1,500-chunk catalog — 93.8 s of refresh, 94.8 s in total. That
  extrapolation has never been checked against a catalog of that size, and checking it is still this branch's
  work. What it is *no longer* for is deciding where the build belongs: the threshold that decision rested on
  does not exist (see `## The timeout question, already settled`), so **roadmap item 17 is cancelled** and
  `docs/retrieval.md` → **Why `setup-worktree.sh` does not warm the index.** is now the standing decision. The
  measurement is still owed as a cost figure; it arbitrates nothing.
- **What the feature costs on disk.** 43.2 MB at 177 chunks, 244 kB per chunk, extrapolated linearly to ~366 MB
  at 1,500 chunks. Chunk size is not constant across a real catalog, so this is the figure most likely to break.
- **Whether the real models work at all outside the stub.** Every retrieval case in gate 4 runs under the hash
  stub. Gate 10 is the only thing that exercises the real embedder and reranker, the `.mcp.json` launcher and a
  session reaching `search_docs`.

Separately, three claims those decisions are stated in terms of are weaker than the prose admits, and this branch
is where they get corrected. They are `## What to deliver` items 4, 5 and 6 and each has its own section below.

## The pre-step

**The operator runs gate 10 by hand and hands in one figures block.** The legs, their commands and their pass
conditions are `docs/development.md` → `## 5. …` **Gate 10 — docs retrieval with the real models**; this prompt
does not restate them and the operator follows that document, not this one. What this prompt adds is what the
block must carry for the branch to be able to use it.

**The target repository — ALREADY BUILT, do not build another.** `<home>/Work/gate10-corpus`, assembled
2026-09-22 by a hand run of `gate_10_throwaway_corpus_prep_prompt.md` in a supervised session. It is a git
repository outside this checkout holding a `docs/` of real documents in two halves — `docs/expause-web/` (98
Markdown files, 1,358 chunks) and `docs/vite/` (57 Markdown files, 601 chunks) — **1,959 chunks combined, 2.8 MB
on disk**, clearing the ~1,500 floor by about 30% before `init` adds the conventions documents the layers name,
which lifts the indexed count slightly higher again. No gate 10 leg was run during assembly: no `init`, no
`doctor`, no `docs index`, no `docs search`, no `npm install`. Its `PROVENANCE.md` carries both sources, their
revisions, the chunk-size distributions and the assertions made at assembly time; **read it before leg (i)** and
take the corpus's stated figures from it rather than recomputing them.

The floor itself stands: the corpus must index to **at least ~1,500 chunks**, read off leg (iii)'s own
`docs index: <files> files, <chunks> chunks` line, and a run under that floor is invalid rather than a smaller
data point. Below it the cold build measures process and PGlite start-up rather than the model, which is the
reason the floor exists and is unaffected by anything settled below.

**Download throughput on this host is route-dependent, not a single figure — and leg (i) has now been run.**
An earlier reading of ~1.61 MB/s over `speed.cloudflare.com` was recorded in the corpus's `PROVENANCE.md` as
*this host's link*, predicting ~six minutes for leg (i). Both halves were wrong and both have been corrected
in that file: HuggingFace serves ~17.5–19.1 MB/s on the identical connection while Cloudflare and npm serve
~1.1–1.4 MB/s, so the low number is a CDN route rather than the connection, and npm being Cloudflare-fronted
is why a Cloudflare speed test happened to predict npm. The measured cold leg (i) is **2:08**, not six
minutes, because npm ships compressed tarballs in parallel and installed size is not transfer size.
**Do not reintroduce a single bandwidth number or any wall-clock prediction derived from one** — that error
is the same shape as the 60 s error this branch exists to correct.

**One corpus, two harnesses over it — do not mistake this for two catalogs.** The real documents are a private
catalog that is read and never modified. The throwaway repository is a `git init`'d **copy** of that catalog,
and it exists for exactly one reason: gate 10's subject is the adopter's install path, so leg (i) runs
`init` — which writes a configuration, a `.claude/` tree, wrapper scripts and an index directory — and that must
land somewhere disposable rather than in the catalog's own repository. The tree already has this pattern: the
query-log pass mirrors its corpus into a git-initialized temporary directory, runs against it, and removes it at
the end. Copy the catalog's `docs/` at its own repo-relative paths, the way that pass does, and assert the file
count matches so a drifted copy fails rather than quietly measuring a different corpus.

**What this gate is for, stated so the next reader does not re-litigate it.** The eval's ad-hoc corpus route —
`--repo`, `--docs-root` and repeatable `--conventions` — composes its own configuration and drives
`corpusFiles` → `refreshIndex` → `searchDocs` **directly, never `openRetrieval`**, which `evals/docs-retrieval/corpora.mjs`'s
own header states as the boundary it exists to hold. That route reads any documentation directory in place,
writes nothing into it, needs no `harness.config.json` in the target and no `init` — and `measureColdBuild` takes
its `dataDir` as an argument, so the index lands wherever the operator points it. **So the cold-build wall time,
the per-chunk refresh cost and the on-disk size can be measured over the real catalog through the eval alone**,
which is how the existing 177-chunk figures were produced. Gate 10 is not that measurement; it is the integration
test of the shipped product on the path an adopter actually walks, and it tests precisely the surfaces the eval
bypasses: the installer, `doctor`'s three retrieval checks and their failure mode, the `docs index` and
`docs search` CLI commands reading a real configuration, and — the leg with no substitute anywhere — an
unattended session under the generated permission profile reaching `mcp__harness-docs__search_docs` with no
approval prompt through a launcher path `.mcp.json` resolved at run time.

**Use both, and say which produced which figure.** Take leg (iii)'s figures from the CLI as gate 10 defines them,
**and** take the same measurement through the eval's ad-hoc route over the catalog read in place. Two independent
paths to one number is a cross-check worth its cost here: they exercise different code above the same library, and
a disagreement between them is a finding about the CLI rather than about the corpus. Record both, each labelled
with the route that produced it; **if they disagree, that is the branch's most important result** and it is
investigated rather than reconciled by picking one.

**The figures block must carry, per leg:**

- **(i)** elapsed setup time, both `du -sh` cache sizes, and **whether the cache was cold** — a warm cache's
  elapsed time is not a setup time and a block that does not say which it was is unusable.
- **(ii)** the three `retrieval-*` check lines verbatim, from both the normal run and the models-moved-aside run.
- **(iii)** the full `docs index: …` summary line, the wall time, and the `du -sh <stateDir>/docs_index` figure.
  **This is the leg the whole branch turns on.**
- **(iv)–(vi)** as gate 10 defines them.

**And it must carry the host, because every figure in it is host-dependent.** Chip and model, core count,
physical memory, OS version, Node version, and whether anything else of consequence was running. The existing
figures were taken on an Apple M4 and carry only `darwin 24.6.0` / `v20.19.5`, which is not enough to know what
a slower adopter machine would see — see `## What to deliver` item 5.

**Repetitions.** Leg (iii) is run **three times**, each into a fresh index directory, and all three wall times are
recorded. One cold build is an anecdote; the existing 177-chunk figure is a median of three with its spread
reported, and the real-catalog figure is not allowed to be weaker evidence than the one it replaces.

## The timeout question, already settled

`## What to deliver` item 4 was written as research owed by this branch. **That research has been done** — in a
supervised session on 2026-09-22, against Claude Code **2.1.278** (`claude --version`), macOS arm64. Its result
is below and is not re-derived here. Quoted code is from `strings -a` over the installed binary at
`~/.local/share/claude/versions/2.1.278`, which is bundled JS, so these are source rather than inference from a
variable's name.

**There is no 60 s tool-call timeout, and nothing near one.**

- `MCP_TOOL_TIMEOUT` governs MCP tool-call **execution** and defaults to `1e8` ms — about **27.8 hours**:
  `function Rr(e){let n=(e?.timeout!==void 0&&e.timeout>=1000?e.timeout:void 0)??a.MCP_TOOL_TIMEOUT??co;return
  Math.min(Math.max(n,1000),Qg)}` with `var co=1e8` and `Qg=2147483647`. Floor 1000 ms. A per-server `timeout`
  in `.mcp.json` overrides it, and values under 1000 ms are ignored.
- `MCP_TIMEOUT` is a **different setting** — MCP server **startup** — default 30000 ms:
  `function iu(){let n=a.MCP_TIMEOUT;return n&&n>0?Math.min(n,2147483647):30000}`. Conflating the two is the
  likeliest origin of the error, together with the point below.
- What can end a long MCP call is **silence, not duration**: `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`, default
  **1800000 ms (30 min) for stdio** servers and 300000 ms (5 min) for http/sse/ws, tripped only when the tool
  sends neither a response nor a progress notification. `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` (120000 ms) moves a
  long call to a background task, which does not fail it. The `harness-docs` server is **stdio**.
- **Measured**: a stdio MCP tool sleeping 75 s returned `DONE after 75.0s` under `claude -p`.
- **The Bash path does not fail either.** `BASH_DEFAULT_TIMEOUT_MS` is 120000 ms and `BASH_MAX_TIMEOUT_MS`
  600000 ms (`var Ae=120000,ke=600000`). **Measured**: a 25 s command given a 5 s timeout was *"moved to the
  background"*, not killed, and completed normally. So `docs/retrieval-eval-results.md`'s *"an adopter may set
  their Bash timeouts lower"* is true and harmless — the consequence is backgrounding, not failure.
- The only `60000` near MCP in the binary is `var pr=60000` in the HTTP transport, used as `Math.max(n,pr)` — a
  request **floor**, a minimum, not a ceiling. It means the opposite of what the three documents say.

**Why no replacement constant works.** The premise of the rule was that wall time causes a failure. It does not,
on any path the harness uses. A rule restated against 1800 s, or against `${MCP_TOOL_TIMEOUT}`, would carry the
same defect in a new coat. And every such number is host-dependent in two directions at once — embedding
throughput and link speed, both demonstrated on this very host — which is `## What to deliver` item 5.

**Scope note.** These are all host-side settings in the Claude Code runner. They do not change with the model the
harness runs. What a different model does change is the cold build's own cost, which is what leg (iii) measures.

---

## The figures block — gate 10 RUN IN FULL, legs (i)-(vi)

_Recorded in this prompt rather than in a file beside it, so the prompt stays self-contained._

Hand run of `docs/development.md` §5 **gate 10** against `<home>/Work/gate10-corpus`,
**2026-09-22**, in a supervised session. All six legs executed. **The branch does not need to
re-run them** — it consumes what is below.

### Host stamp

| | |
|---|---|
| machine / chip | MacBook Air, Apple M4 |
| cores | 10 (4 performance + 6 efficiency) |
| memory | 16 GB |
| OS | macOS 15.7.4 (24G517); `uname -sr` -> `Darwin 24.6.0`; arm64 |
| node | v22.23.2 |
| npm | 10.9.8 |
| claude | 2.1.278 (Claude Code) -- the version leg (v) ran under |
| package under test | `autonomous-sdlc-harness@0.2.0` from the registry |
| load at start | `1.92 1.76 1.76`, up 42 days |
| else running | this Claude Code session only |

Node differs from the existing figures' v20.19.5. Recorded, not reconciled.

### Target repository

`<home>/Work/gate10-corpus` @ `010c50e`, restored to that commit immediately before the
cold run. `PROVENANCE.md` (now @ `57a6c25`, see the bandwidth correction) estimated 1,959
chunks; the indexed count came out **1,960 over 156 files** -- the extra file being
`.claude/context/conventions.md`, which `init` writes and the corpus adds to `docs.root`.
Floor of ~1,500 chunks: **cleared by 31%.**

### TWO ENVIRONMENT FAULTS THE BRANCH MUST KNOW ABOUT

**1. `npx autonomous-sdlc-harness` does NOT run the published package on this machine.** A
global link shadows the registry:

```
npm ls -g --depth=0
+-- autonomous-sdlc-harness@0.1.0 -> ./../../../<home>/Work/expause/autonomous-sdlc-harness/cli
npx --yes autonomous-sdlc-harness --version   -> 0.1.0   (no `docs` command at all)
npx --yes autonomous-sdlc-harness@0.2.0 ...   -> 0.2.0   (what every leg below used)
```

Gate 10's leg commands are written unpinned. **Taken literally at the time of this run they
measured a stale 0.1.0 dev link.** Every leg below therefore pinned `@0.2.0`.

**Since resolved:** the global link was a leftover of the harness's extraction from the
`expause` repository, and both it and the staging directory it pointed at have been removed
(`npm rm -g autonomous-sdlc-harness`; `expause` branch `chore_remove_extracted_harness_staging`).
`npx autonomous-sdlc-harness --version` now answers `0.2.0`, so leg (vi)'s recorded `0.1.0`
line does not reproduce today.

**The gate-text defect stands regardless.** Any adopter with a linked or globally installed
copy hits the same thing, and the gate gives no way to notice: `docs index` would simply fail,
or worse, a leg would silently measure the wrong build. Gate 10's text should pin the version,
or verify what the bare name resolves to before the first leg.

**2. `npx ... docs index` cannot load the optional peers; the runtime entry can.** The pinned
npx copy is a standalone install without `@huggingface/transformers`:

```
npx --yes autonomous-sdlc-harness@0.2.0 docs index
-> autonomous-sdlc-harness: docs retrieval needs the optional package @huggingface/transformers,
   which this installation cannot load.
```

The working route is the one `scripts/docs-search-server.sh` itself execs:
`node "$cache/retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js"`. Legs (iii)
and (iv) used that. **Gate 10's leg (iii) and (iv) commands as written do not run** -- a second
defect in the gate's text, and the more serious one.

### Leg (i) -- Setup

Run twice. **The first is not a setup time; the second is.**

**Run 1 -- harness cache cold, npm cache WARM -> not a setup time.**

```
time npx --yes autonomous-sdlc-harness@0.2.0 init --docs --docs-retrieval --non-interactive
-> 4.85s user 2.30s system 41% cpu  17.107 total
du -sh .../retrieval/runtime -> 534M      du -sh .../retrieval/models -> 56M
```

Invalid for the reason gate 10 names: `~/.npm/_cacache` held 222 MB including the retrieval
peers and `~/.npm/_npx` held 1.2 GB, left by a Sep 21 setup. Kept because the contrast is
itself useful: **a re-install with npm warm costs 17 s.**

**Run 2 -- everything cold -> THE SETUP TIME.** Teardown first: corpus reset to `010c50e`;
`retrieval/` moved aside; `npm cache clean --force`; `_npx` moved aside.

```
time npx --yes autonomous-sdlc-harness@0.2.0 init --docs --docs-retrieval --non-interactive
-> 13.17s user 7.33s system 16% cpu  2:08.08 total        = 128.08 s
du -sh .../retrieval/runtime -> 551M      du -sh .../retrieval/models -> 57M
```

**Cold-cache statement: COLD.** No `_cacache`, no `_npx`, no harness retrieval cache existed.

Wiring confirmed: `phases.docs: true`, `docs.retrieval: true`, `stateDir: "sdlc-harness/"`,
`.mcp.json` declaring the `harness-docs` stdio server.

Two deviations: run 2 was **piped** to `tail -20`, which gate 10 forbids (`time` measured the
pipeline; `--non-interactive` was explicit on both runs, so TTY detection could not change
what `init` did); and the two runs' sizes differ by ~17 MB on the same pinned version, cause
not established.

### Leg (ii) -- `doctor`

Normal run -- **all three PASS**:

```
PASS retrieval-dependencies  the RAG runtime is installed at .../retrieval/runtime (version 0.2.0)
                             with every optional peer, and .mcp.json's launcher docs-search-server.sh
                             execs that installation's entry
PASS retrieval-model-cache   every model file RAG loads offline is cached in .../retrieval/models
PASS retrieval-index         docs index: 156 files, 1960 chunks; embedded 1960, unchanged 0, deleted 0
Summary: 30 pass, 5 warn, 1 fail - exit 1 (1 check failed)
```

The one FAIL is `remote` (no remote in a scratch repository) -- gate 5's subject, not this
leg's, exactly as gate 10 says to expect.

Models-moved-aside run -- **fails the two the gate predicts, and only those**:

```
PASS retrieval-dependencies  (unchanged)
FAIL retrieval-model-cache   the model cache at .../retrieval/models is missing
                             Xenova/bge-small-en-v1.5/config.json, ...tokenizer.json,
                             ...tokenizer_config.json, ...onnx/model_quantized.onnx,
                             Xenova/ms-marco-MiniLM-L-6-v2/config.json and 3 more
FAIL retrieval-index         the RAG index did not build in memory: ... missing [same 8 files]
Summary: 28 pass, 5 warn, 3 fail - exit 1 (3 checks failed)
```

**The shared cache was restored in the same command** that moved it, and verified back at 57M.

### Leg (iii) -- Cold build, four runs

Each into a fresh index directory, via the runtime entry (see fault 2).

| run | wall time | seconds | context |
|---|---|---|---|
| 1 | `1:51.25` | **111.25** | first, machine rested |
| 2 | `1:59.30` | **119.30** | immediately after run 1 |
| 3 | `2:07.58` | **127.58** | immediately after run 2 |
| 4 | `1:54.47` | **114.47** | after ~10 min of light load |

Summary line identical on all four: `docs index: 156 files, 1960 chunks; embedded 1960,
unchanged 0, deleted 0`. `du -sh sdlc-harness/docs_index` -> **72M**, identical on all four.
CPU 452-459% throughout.

**The three-run spread is 16.33 s = 13.7% of the median (119.30 s)**, against the under-1%
the 177-chunk measurement reported. The rule in
`## Establish, do not assume` requires this be investigated rather than averaged: runs 1-3 rise
**monotonically** back-to-back, and run 4, taken after a pause, **returns to baseline**. That is
thermal behaviour on a fanless M4 Air under 8+ minutes of sustained ~4.5-core load, not variance
in the software. **The honest figure is ~111-114 s cold on a rested machine, degrading to ~128 s
when builds run back-to-back**, and the existing section's sub-1% spread is not comparable because
it was taken at a corpus 11x smaller, where each run is short enough not to heat the machine.

**Against the extrapolation -- time: it HELD.**

| | predicted | measured |
|---|---|---|
| per-chunk refresh | 62.51 ms | **60.87 ms** (median; 56.76 min, 65.09 max) |

Within 2.6% of the median. Item 2 of `## What to deliver` asks whether this was
linear-and-right or linear-and-lucky: with the thermal spread straddling the predicted value,
**linear-and-lucky is the honest reading** -- the prediction lands inside the noise band of the
host it was tested on.

**Against the extrapolation -- on-disk size: it MISSED, badly, and the reason is instructive.**

| | predicted | measured |
|---|---|---|
| per chunk | 244 kB | **37.6 kB** at 1,960 chunks |
| at 1,500 chunks | ~366 MB | **~65 MB** by the two-point fit |

Fitting 43.2 MB @ 177 chunks and 72 MB @ 1,960 chunks gives **~40.3 MB fixed overhead plus
~16.5 kB per chunk**. So the index is fixed-cost dominated, and **244 kB/chunk was a fixed cost
divided by a small chunk count** -- the same error shape as the 60 s timeout and the six-minute
download: a constant derived from one measurement and extended past its range. The ~366 MB
projection overshoots by **5.6x**. Do not publish a new projection on the strength of one more
data point; publish the fit and its two anchors.

### Leg (iv) -- Search

Default `fused-rerank` mode, so the reranker ran.

Positive -- *"How do I configure a proxy for the Vite dev server?"*:

```
1. docs/vite/config/server-options.md#serverproxy (score 1.000)
2. docs/vite/config/server-options.md#servermiddlewaremode (score 0.998)
3. docs/vite/blog/announcing-vite3.md#improved-websocket-connection-strategy (score 0.995)
```

First result **names the known section exactly**, at **1.000**.

Negative -- *"What is the recommended marinade time for lamb souvlaki?"*:

```
no confident match
```

**Abstained.** The calibration in `docs/retrieval-eval-results.md` -> `## Threshold calibration`
holds on a real catalog at both ends.

### Leg (v) -- Unattended

```
claude -p "Call the search_docs tool once with the query \"How do I configure a proxy for the
  Vite dev server?\", then print its result verbatim." \
  --settings .claude/settings.autonomous.json --permission-mode acceptEdits \
  --output-format stream-json --verbose
```

No permission-bypass flag. From the stream:

- `system/init` -> `mcp_servers: [{"name":"harness-docs","status":"connected","source":"project"}, ...]`
- `mcp__harness-docs__search_docs` **present in the session's tool list**
- called once with the leg (iv) query; **no permission denial anywhere in the stream**
- returned the same ranked list the CLI printed, `#serverproxy` at 1.000 first
- `result: subtype=success, is_error=false, num_turns=3, duration_ms=9235`, exit 0

**The relative launcher path in `.mcp.json` resolved from the session's working directory** --
that is what the returned results prove.

One observation the gate does not ask for but which is worth recording: the session reached the
tool through a `ToolSearch` call first (`select:mcp__harness-docs__search_docs`), because on this
runner version the MCP tool arrives deferred rather than pre-loaded. It cost one extra turn of
the three and required no additional grant.

### Leg (vi) -- Platform

```
uname -sr                             -> Darwin 24.6.0
node --version                        -> v22.23.2
claude --version                      -> 2.1.278 (Claude Code)
npx autonomous-sdlc-harness --version -> 0.1.0   <- the shadowed global link, see fault 1
node .../runtime/.../dist/cli.js --version -> 0.2.0   <- what was actually measured
```

### Acceptance 2a -- the eval-route cross-check: TAKEN, and the two routes AGREE

`cold-build.mjs` exports `measureColdBuild` but has **no CLI entry** -- no `--cold` flag on
`run.mjs`, no npm script -- so this was driven by a throwaway module importing it directly,
pointed at the same corpus the CLI indexed so the two figures are comparable: `repoRoot` and
`docsRoot` at `<home>/Work/gate10-corpus`, `conventions:
['.claude/context/conventions.md']`, `dataDir` a path removed immediately before the call (the
module asserts the directory is absent, and asserts `embedded === chunks`, so an incremental
refresh cannot masquerade as a cold one).

```json
{ "corpus": "ad-hoc", "host": "darwin 24.6.0", "node": "v22.23.2",
  "snapshot": { "files": 156, "chunks": 1960 },
  "cold": { "index": true, "modelCache": false },
  "timings": { "modelLoadMs": 334.38, "storeOpenMs": 941.54,
               "refreshMs": 107984.15, "totalMs": 109260.07 },
  "size": { "apparentBytes": 74195245, "allocatedBytes": 75808768, "files": 986 } }
```

**Same corpus snapshot as the CLI: 156 files, 1960 chunks.** The comparison acceptance 2a asks
for, labelled by route:

| | CLI route (leg iii) | eval ad-hoc route |
|---|---|---|
| total | 111.25 s rested / 114.47 s run 4 | **109.26 s** |
| on disk | 72M (`du -sh`) | 75,808,768 allocated = **72.3 MiB**; 74,195,245 apparent |
| snapshot | 156 files, 1960 chunks | identical |

**No disagreement to investigate: 109.26 s against the CLI's 111.25 s is 1.8% apart**, inside the
thermal band the four CLI runs already established, and `du -sh`'s 72M is the allocated figure to
the megabyte. The shipped CLI path and the library the eval drives are measuring the same thing.
Record both, labelled; do not reconcile by choosing one.

### What the phase breakdown settles, which only this route could show

The CLI prints one wall time; `measureColdBuild` returns three phases, so two of
`## Establish, do not assume`'s open questions are answered here rather than left open:

- **The store-open phase is still per-index-directory, not per-chunk.** 875.8 ms at 177 chunks,
  **941.5 ms at 1,960 chunks** -- an 11x corpus for a 7.5% rise. The assumption holds at the first
  size that could have broken it, and the arithmetic of the recorded section stands.
- **The model load is flat and is not the cost.** 192.5 ms recorded at 177 chunks, **334.4 ms**
  here; as a share of the total it *fell* from about 1.6% to **0.31%**. Item 6's claim that the
  cost of warming is the **refresh** is confirmed by measurement, not merely argued: refresh is
  107,984 ms of a 109,260 ms total, **98.8%** of it.
- Refresh per chunk on this route is **55.1 ms**, against the CLI route's 56.8 ms best and the
  62.51 ms the extrapolation used.

### State left behind

`gate10-corpus` is `init`-ed. The machine-wide model cache is **restored and verified** (57M).
The teardown copies (`retrieval.aside-precold`, `retrieval.warmnpm-17s`, `_npx.aside-gate10`) and
the extra index directories have been deleted; `_cacache` was cleaned and has repopulated
normally.

---

## What to deliver

1. **The measured figures replace the extrapolation, everywhere it appears.** `docs/retrieval-eval-results.md` →
   `## Cold build and index size` is the file of record and the only place the numbers are written; every other
   site cites it rather than restating it. Find every site — at minimum `docs/retrieval.md`, roadmap item 17's
   row in `docs/development.md` → `## 6. The roadmap this tree defers to`, and gate 10's own leg (iii) text —
   and leave none of them describing a figure as extrapolated once it is measured. **The generated region of the
   results file has exactly one writer and this is not it**: the cold-build section is below the end marker and
   is hand-written territory, and nothing in this branch may type inside the markers.

2. **State what the measurement did to the extrapolation, in both directions.** Record the measured per-chunk
   refresh cost beside the 62.51 ms the extrapolation used, and the measured total beside the 93.8 s it predicted.
   **If the extrapolation held, say so and say it was linear-and-lucky rather than linear-and-right**; if it did
   not, the recorded figure is the measured one and the extrapolation becomes a documented miss. Both outcomes
   are results. The same for the on-disk size against 244 kB per chunk and the ~366 MB projection. The figures
   block above has already done this arithmetic — time held within 2.6%, size missed by 5.6× — so this item is
   the write-up, not the calculation.

3. **Record roadmap item 17 as CANCELLED, on the reason below — the decision is taken, not open.** Item 17's
   row states a condition in its own terms — a figure under the threshold cancels the item — but the threshold
   itself does not exist, so the condition can never be evaluated and the item is cancelled without it. The
   recorded reason is not a measurement: **the cold build stays inside the first `search_docs` call because that
   is the only mechanism serving every entry point.** A session that never ran `setup-worktree.sh` — a plain
   interactive session in the main checkout — still gets a built index, which a warm performed by a script on the
   autonomous path would not give it. Update item 17's row and the `docs/retrieval.md` decision paragraph to
   agree, and make **Why `setup-worktree.sh` does not warm the index.** the standing decision rather than a
   deferral. That paragraph's stated revisit condition is a cold build long enough to risk the tool-call timeout;
   that condition can never fire, so replace it with what would actually reopen the question rather than leaving
   a dead trigger in place. **This branch does not make the move and no later branch does either** — see
   `## Out of scope`.

4. **Strike the rule. There is no threshold — not 60, and not a configured value either.** This item was
   written as research to be done; the research has since been done and its result is in
   `## The timeout question, already settled` below. Apply it. Every site currently states the rule as *"a cold
   build costing more than 60 seconds"* and justifies it with *"the agent runner's MCP tool-call timeout defaults
   to 60 s"*. **No tool-call clock fails a slow cold build on any path the harness uses**, so the rule does not
   survive as a function of the configured timeout either — restating it against any number, or publishing a
   crossover chunk count at any value, would preserve the error rather than correct it. What replaces the
   constant is a property of the build rather than of the machine: the build must not go silent for longer than
   the idle timeout, and where it belongs is a cost question. Correct all three documents —
   `docs/retrieval.md`, `docs/retrieval-eval-results.md` → `## Cold build and index size`, and
   `docs/development.md` row 17 — and take the ~940-chunk crossover with them.

5. **Every figure carries the machine it was taken on, and the rule is not judged against the fastest one.**
   Cold-build time is dominated by embedding throughput, which is a property of the host. The existing figures
   were taken on an Apple M4 with the model cache warm; an older or lower-core machine indexes the same corpus
   more slowly. With the threshold gone there is no crossover chunk count left to move, but the point survives
   and now carries the whole weight of item 4's correction: **a wall-clock figure describes the host that
   produced it.** This branch has a second, independent demonstration of that in hand — the recording host's
   ~1.61 MB/s link makes leg (i)'s ~590 MB download about six minutes, a figure that says nothing about the
   software. Deliver: the host stamp on every recorded figure in the shape `## The pre-step` requires; a stated
   sentence in `docs/retrieval.md` that every published cost figure is the one measured on the recording host and
   that a slower host or link pays more; and leg (i)'s elapsed time recorded with its bandwidth caveat attached.
   **Do not invent a scaling factor for other hardware**; one host is one host, and saying so is the honest
   record. Whether the harness should detect this at run time is not this branch's question.

6. **Correct the "agents that do not query" cost framing — it is very close to empty, and the evidence is in the
   tree.** `docs/retrieval.md` already half-concedes this (*"not on branches that never query, which is close to
   an empty category"*), while roadmap item 17's row still states the cost the move accepts as *"a model load per
   worktree, spent on agents that do not query"*. Two things are wrong with that as written, and both are
   checkable rather than arguable:
   - **The index is built once per worktree and shared by every dispatch in it.** So the question is never
     *which agents query* — it is only *whether the worktree queries at all*, and the build is paid either way
     the moment one agent does. Derive the list of agents holding the `search_docs` grant from the `tools:`
     allowlists under `plugin/agents/` rather than from memory, and establish from it whether a worktree that
     reaches planning can fail to query. Name the states that genuinely never query and say how rare they are
     rather than implying a class. Two candidates are known and both are checked rather than taken on trust: a
     run that stalls before its first planning dispatch, and — the one that is structural rather than
     accidental — the docs-catalog engine
     (`/autonomous-sdlc-harness:branch-start-docs-autonomous`), which dispatches only `docs-writer` and
     `docs-reviewer`, **neither of which carries `mcp__harness-docs__search_docs`**. That engine's runs never
     query the index at all.
   - **The model load is not the cost.** The recorded breakdown puts model load at 192.5 ms median, 1.09 ms per
     chunk, against a 12.2 s total — about 1.6% of it. The cost of warming is the **refresh**, and the refresh is
     paid at first query if it is not paid at setup. Restate the cost the move accepts in terms of what is
     actually spent and actually wasted.

   Rewrite both sites accordingly. **If the conclusion is that the move is close to free rather than a trade,
   say that** — it strengthens item 17 independently of the timeout question, and a row that overstates a cost is
   as wrong as one that understates it.

7. **Gate 10's own text records that it has now been run**, with the date, the host and the target corpus's chunk
   count, so the next reader knows the legs have been exercised and what they cost. `docs/retrieval.md`'s item
   (d) and any `## Still open` entry describing a real-model leg as unrun are updated or removed to match — find
   them rather than assuming the two named here are all of them.

## Establish, do not assume — three of these are now ANSWERED by the figures block

These were written as open questions for the branch. The measurements have since been taken, so the
work is to **write them up from the figures**, not to re-measure. Each is stated here with its answer
and with what the branch still owes it.

- **Whether the on-disk size scales linearly — IT DOES NOT, and the miss is 5.6×.** 244 kB per chunk
  came from a 41-file corpus; at 1,960 chunks the measured figure is 37.6 kB per chunk. The two-point
  fit is ~40.3 MB fixed plus ~16.5 kB per chunk, so the index is fixed-cost dominated and the original
  per-chunk number was a fixed cost divided by 177. **Owed:** publish the fit and its two anchors, and
  — as the original bullet already required — **do not publish a new projection to a larger size on the
  strength of one more data point.**
- **Whether leg (iii)'s runs agree — THEY DIFFER BY 13.7%, AND THE CAUSE IS THERMAL.** Runs 1–3 rise
  monotonically back-to-back; run 4, after a pause, returns to baseline. **Owed:** report the spread
  with that cause, and state that the existing sub-1% figure is not comparable because that corpus is
  11× smaller. Do not average it away, and do not present the two spreads as a series.
- **Whether the store-open phase still scales per-directory — IT DOES.** 875.8 ms at 177 chunks,
  941.5 ms at 1,960: an 11× corpus for a 7.5% rise, measured through the eval route, which is the only
  route that reports phases separately. **Owed:** record that the assumption held at the first size
  that could have broken it, so the recorded section's arithmetic stands.
- **What the run does to the shared model cache — STILL THE BRANCH'S TO CHECK.** It is machine-wide and
  every checkout shares it. Leg (ii) moved it aside and back and the block records it verified back at
  57M, but that is one run's statement. Establish that nothing in **this branch's** work leaves it
  moved, truncated or pointed somewhere else, and that a failure mid-leg is recoverable.

## Out of scope

- **Making the move — permanently, not pending.** Warming the index in
  `cli/templates/scripts/setup-worktree.sh` (or in `scripts/setup-worktree.sh`) is cancelled work, not deferred
  work: no later branch makes it either. A change to either script here is a failed change, and a reviewer
  proposing the move, or proposing to gate it on `docs.retrieval`, is proposing work that has been decided
  against.
- **Any change to an agent's `tools:` allowlist.** The orchestrator does not get
  `mcp__harness-docs__search_docs` — it reads none of the context documents by design. The plain interactive
  session does not get it yet, and `layer-implementer` and `layer-reviewer` do not get it yet. Establishing who
  holds the grant is item 6's work; changing who holds it is not this branch's.
- **Arm A.** The index-first-navigation baseline is a different measurement with a different blocker — it needs a
  labelled query set and an `INDEX.md` for whatever catalog it runs against, neither of which exists outside
  `fixture-catalog`. Nothing here produces or plans one.
- **Re-running the relevance eval, re-calibrating the abstention threshold, or touching `floor.json`.** The
  regression floor is graded on `fixture-catalog` alone by design, and a real-catalog corpus is not a second
  floor. The generated region of the results file is not written by this branch at all.
- **Changing the default mode, or the abstention policy.** The recorded finding that arm D outscores the shipped
  arm E on both committed corpora is a measurement awaiting a decision, and it is not this branch's decision.
- **Detecting host speed at run time, or any per-machine adaptive threshold.** Item 5 delivers the statement that
  the figure is per-machine, not a mechanism that reacts to it.

## Acceptance

1. Gate 10 legs (i)–(vi) have been run by hand against a real catalog indexing to at least ~1,500 chunks, outside
   this checkout, and the figures block carries the host stamp and the cold/warm cache statement.
2. Leg (iii) was run **four** times into fresh index directories and all four wall times are recorded. The
   spread is reported rather than averaged away, and reported with its **cause**: runs 1–3 rise monotonically
   back-to-back and run 4 returns to baseline after a pause, so the 13.7% spread is thermal behaviour of the
   recording host under sustained load, not variance in the software. The existing 177-chunk section's sub-1%
   spread is stated as **not comparable**, because that corpus is 11× smaller and its runs are too short to
   heat the machine.
2a. The same cold-build measurement was taken a second time through the eval's ad-hoc corpus route over the
   catalog read in place, both routes' figures are recorded and labelled by route, and any disagreement between
   them is investigated and reported rather than reconciled by choosing one.
2b. The private catalog's own repository is unmodified: no `init` ran against it, no index was written into it,
   and the throwaway copy's file count was asserted equal to the source's.
3. `docs/retrieval-eval-results.md` → `## Cold build and index size` carries the measured real-catalog figures
   beside the 177-chunk ones, each pair with its own host and corpus stamp, and the two are never presented as a
   before/after series.
4. No site in the tree still describes the cold-build cost or the on-disk size as extrapolated, and no site
   restates a figure the file of record owns.
5. No site in the tree states a cold-build rule against a wall-clock threshold — not 60 s, not a configured
   timeout, not a crossover chunk count. The three documents name the real settings and defaults with their
   citation where they explain what changed, and `docs/retrieval.md`'s revisit condition is one that can
   actually fire.
6. Roadmap item 17's row records the item as **cancelled**, on the stated reason — first-call build is the only
   mechanism serving every entry point — rather than on a figure. `docs/retrieval.md`'s decision paragraph agrees
   with it and reads as the standing decision, not a deferral.
7. Item 17's row and `docs/retrieval.md` no longer state the move's cost as a model load spent on agents that do
   not query; the restated cost names the refresh, and the `search_docs` grant list it rests on was derived from
   the agent allowlists rather than asserted.
8. Every recorded figure names the machine it was taken on, and `docs/retrieval.md` states that every published
   cost figure is the one measured on the recording host and that a slower host or route pays more. **No single
   bandwidth number appears anywhere**, and no wall-clock figure is derived from one: the corrected position is
   that throughput here is route-dependent (~1.1–1.4 MB/s Cloudflare and npm, ~17.5–19.1 MB/s HuggingFace on the
   same link), which is why leg (i)'s measured 128 s replaces the ~six minutes a single-number extrapolation
   predicted.
9. `cli/templates/scripts/setup-worktree.sh` and `scripts/setup-worktree.sh` are both byte-identical to their
   state at branch point, and no agent's `tools:` allowlist under `plugin/agents/` changed.
10. The generated region of `docs/retrieval-eval-results.md` is byte-identical to its state at branch point.
11. The machine-wide model cache is in the state gate 10 left it, and the branch says so.
12. `bash scripts/run-gates.sh` prints no new failure.
