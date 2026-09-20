# User-Review Fix Plan: feat_docs_catalog_retrieval

## Context

Branch `feat_docs_catalog_retrieval`. Source user review: `harness-runs/user_reviews/feat_docs_catalog_retrieval_review.md`. The user's hands-on pass over the landed docs-retrieval feature flagged six items: three about how the feature is *framed* for an adopter (a mis-titled trade-offs section, the internal term "docs retrieval" where adopters expect "RAG", a roadmap row that does not name docs-retrieval provisioning as a sub-problem), two about *evidence and observability* (no way to tell whether any agent ever calls `search_docs`, and no gate step that measures cold build and index size on a real-sized catalog), and one *retrieval-quality defect* (empty `##` wrapper sections become chunks of their own, so a real corpus carries roughly a hundred near-identical near-empty rows).

All six observations verified as valid against the working tree. None were invalid.

## Phase 2 Readiness — Ordered Fix List

**This list is the single source of truth for the implementation loop.** Checkbox markers `[ ]` anywhere else in this plan — including sub-step bullets inside the per-finding files — are informational only; the committer never touches them. Sorted lowest blast-radius first.

1. [x] **Finding 5** — Name docs-retrieval provisioning in the `Cloud / CI execution` roadmap row. _(layer: general)_
2. [x] **Finding 4** — Add a real-catalog cold-build and index-size leg to Gate 10. _(layer: general)_
3. [x] **Finding 1** — Split `## Trade-offs` into buys / next / costs. _(layer: general)_
4. [ ] **Finding 6** — Emit no chunk for an empty `##` section that has `###` children. _(layer: cli, general)_
5. [ ] **Finding 3** — Opt-in `search_docs` query logging behind one environment variable. _(layer: cli, general)_
6. [ ] **Finding 2** — Rename the adopter-facing surface to "RAG", leaving every identifier alone. _(layer: cli, plugin, general)_

## Must Fix

### 6. Empty `##` wrapper sections become their own chunks

→ [finding_6.md](feat_docs_catalog_retrieval_fix_plan/finding_6.md)

### 2. Adopter-facing surfaces say "docs retrieval" where adopters know "RAG"

→ [finding_2.md](feat_docs_catalog_retrieval_fix_plan/finding_2.md)

## Should Fix

### 1. `docs/retrieval.md` → `## Trade-offs` is mis-titled

→ [finding_1.md](feat_docs_catalog_retrieval_fix_plan/finding_1.md)

### 3. Nothing records whether an agent ever calls `search_docs`

→ [finding_3.md](feat_docs_catalog_retrieval_fix_plan/finding_3.md)

### 4. Gate 10 measures no real-catalog retrieval cost

→ [finding_4.md](feat_docs_catalog_retrieval_fix_plan/finding_4.md)

## Nice to Have

### 5. The `Cloud / CI execution` roadmap row does not name docs-retrieval provisioning

→ [finding_5.md](feat_docs_catalog_retrieval_fix_plan/finding_5.md)

## Out of scope / verified-OK

No observation was invalid — all six describe the tree as it stands. Two carry a factual detail that the verification refined, and each refinement is written into the finding it belongs to rather than used to reject the observation:

- **Observation 4** says Gate 10 "has no step that measures what retrieval costs on a real catalog". Gate 10 does have a cold-build leg — `docs/development.md` → **(iii) Cold build**, which records the `docs index` summary line and its wall time. What it lacks is what the observation is actually about: the gate's target repository is specified as "a `docs/` of a few real documents", with no corpus-size floor, and no leg records the resulting `<stateDir>/docs_index/` size on disk. The observation stands; Finding 4 is written as an amendment to leg (iii) plus a new measurement rather than as a wholly new leg.
- **Observation 5** describes `retrievalRuntimeState()` as "three file-existence tests". It is `existsSync` on the runtime's CLI entry **plus a version match** against this CLI's own manifest version, then one `existsSync` per optional retrieval peer — so the count is the peer count plus one, and a restored cache satisfies it only when it was populated by the same CLI version (`cli/src/retrieval/runtime.ts` → `retrievalRuntimeState`). The conclusion the observation draws is unaffected — it is existence tests over a directory, so a restored cache satisfies it with no code change — but the roadmap clause must not commit the inaccurate count. Finding 5 states the accurate wording.

## Source observations

1. `docs/retrieval.md` → `## Trade-offs` is mis-titled: four of its five bullets are design choices with upside for the adopter, and only *"The costs, stated plainly"* is an actual trade. Split it into three sections — `## What this buys you` (local and private, so an adopter's docs never leave their machine and there is no key to manage; embedded and in-process, so there is no server to install or keep running; one Postgres engine rather than two stores, so the lexical and vector arms can never describe different corpus states), `## Where it goes next` (the `DocStore`-by-connection-string path, framed as an adapter seam deliberately kept open rather than a limitation), and `## What it costs` (about 300 MB of runtime per machine, PGlite pinned exactly because the two extension packages dictate it, and an index that is a second representation of the docs). Keep every measured fact exactly as written; change only the framing and the headings.

2. Adopter-facing surfaces call this *"docs retrieval"*, which is our own vocabulary from the docs catalog — adopters know the term **RAG**. Rename what a user sees, not the code: `README.md`, the plugin README, `docs/retrieval.md`'s opening paragraph, `init`'s interactive prompt, `doctor`'s three retrieval check descriptions and `config`'s help text should read "RAG (docs retrieval)" on first mention and "RAG" afterwards. Add `--rag` as an accepted alias for `--docs-retrieval`. Do **not** rename the `docs.retrieval` configuration key, the `docs` verb, `DOCS_SERVER_NAME` or any other identifier — ten agent files and two templates quote that wire, and the code review verified it with a re-derivation grep. Leave `ARCHITECTURE.md` and `docs/development.md` on the precise term.

3. Nothing records whether an agent ever calls `search_docs`, so there is no way to tell an unused tool from a useless one. Add **opt-in** query logging to `cli/src/retrieval/server.ts`: when one environment variable is set to a path — the same seam shape as `RETRIEVAL_STUB_ENV`, so no configuration key and no schema change — append one JSON line per `search_docs` call carrying the timestamp, the query, `k`, the hit count, the best score, whether it abstained, the refresh counts and the wall time. Unset writes nothing, so an adopter gains no new surface. Establish how the variable reaches the server process, which the agent runner starts through `.mcp.json` → `docs-search-server.sh` rather than from a shell.

4. `docs/development.md` → Gate 10 has no step that measures what retrieval costs on a real catalog. Add one that records, on a corpus of at least ~1,500 chunks, the **real-model cold build wall time** for a fresh checkout and the resulting **`<stateDir>/docs_index/` size on disk**. The only figure the suite carries today is a *stub* build over a 9-chunk, ~500-byte fixture, which measures Node and PGlite start-up and essentially nothing else — and `docs/retrieval.md` → `## Why setup-worktree.sh does not warm the index` rests its decision on exactly that figure.

5. `ROADMAP.md` → the `Cloud / CI execution` row: add a clause naming docs-retrieval provisioning as a known sub-problem of it. The machine-shared runtime and model cache at `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/` is empty at the start of every ephemeral job, so "installed once per machine" becomes "installed once per job"; `retrievalRuntimeState()` is three file-existence tests, so a restored cache satisfies it with no code change, which is the seam a fix would use.

6. `cli/src/retrieval/chunk.ts`: a `##` or `###` section whose body is empty still becomes its own chunk. `## How it works` in `expause_web/docs/concepts/image-caching-storage.md` is one, and that heading together with `## What it is & why` appears in most documents of that catalog — so a real corpus carries roughly a hundred near-identical, near-empty rows competing for generic query terms. **Emit no row for an empty `##` section that has at least one `###` child**: `makeChunk`'s heading path already spells the parent into every child (`<title> > ## How it works > ### 1. …`), so folding it loses no context and the wrapper heading stops being a hit on its own. State a decision, with its reason, for the remaining case — an empty section with no child at all. A section that has a body keeps today's behaviour exactly.
