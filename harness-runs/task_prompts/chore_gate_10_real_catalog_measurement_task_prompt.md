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
> **If the figures block is absent or incomplete when this branch starts, park and ask for it — do not
> substitute a fixture-sized run, and do not re-derive a figure the block does not carry.**

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

**The target repository — ALREADY BUILT, do not build another.** `/Users/daniel/Work/gate10-corpus`, assembled
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

**The link on the recording host is slow, and leg (i) is where that shows.** Measured at ~1.61 MB/s
(~12.9 Mbit/s, two 50 MB samples at 1.62 and 1.61 MB/s), which puts leg (i)'s ~590 MB download at roughly six
minutes on its own. That figure is dominated by the link, not by the software, and it is not comparable to a
fast-link host. It is recorded with that caveat in the corpus's own `PROVENANCE.md` host block; record leg (i)'s
elapsed time with the same caveat attached, and do not let it be read as a setup cost an adopter would see.

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
   are results. The same for the on-disk size against 244 kB per chunk and the ~366 MB projection.

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

## Establish, do not assume

- **Whether the on-disk size scales linearly.** 244 kB per chunk came from a 41-file corpus of this tree's own
  documents. A real catalog has different document lengths and a different chunk-size distribution. Report the
  measured per-chunk figure against the projected one and state whether linear extrapolation survived; do not
  publish a new projection to a larger size on the strength of one more data point.
- **Whether leg (iii)'s three runs agree.** The existing 177-chunk measurement recorded a spread of under 1% on
  the refresh phase and put the whole visible spread in the two short phases. If the real-catalog runs disagree
  by more than that, the disagreement is the finding — investigate it rather than averaging it away, which is the
  rule the existing section already states for itself.
- **Whether the store-open phase still scales the way it did.** It was recorded as per-index-directory rather
  than per-chunk (875.8 ms, 4.95 ms per chunk at 177). At 1,500 chunks that assumption is testable for the first
  time, and a per-directory phase that turns out to grow with corpus size changes the arithmetic of the whole
  section.
- **What the run does to the shared model cache.** It is machine-wide and every checkout shares it. Gate 10's
  leg (ii) moves it aside and back; establish that nothing in this branch's work leaves it moved, truncated or
  pointed somewhere else, and that a failure mid-leg is recoverable.

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
2. Leg (iii) was run three times into fresh index directories and all three wall times are recorded, with the
   spread reported the way the existing 177-chunk section reports its own.
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
8. Every recorded figure names the machine it was taken on; `docs/retrieval.md` states that every published cost
   figure is the one measured on the recording host and that a slower host or link pays more; and leg (i)'s
   elapsed time is recorded with the ~1.61 MB/s bandwidth caveat attached rather than as an adopter's setup cost.
9. `cli/templates/scripts/setup-worktree.sh` and `scripts/setup-worktree.sh` are both byte-identical to their
   state at branch point, and no agent's `tools:` allowlist under `plugin/agents/` changed.
10. The generated region of `docs/retrieval-eval-results.md` is byte-identical to its state at branch point.
11. The machine-wide model cache is in the state gate 10 left it, and the branch says so.
12. `bash scripts/run-gates.sh` prints no new failure.
