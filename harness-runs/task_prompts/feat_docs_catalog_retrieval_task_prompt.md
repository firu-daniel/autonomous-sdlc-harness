`feat_docs_catalog_retrieval` builds the retrieval half of the `ROADMAP.md` item **Docs-catalog retrieval**: an
agentic retrieval tool over the "second brain" (the docs catalog and the conventions documents), exposed over
MCP to the plan writer and the reviewers. It ships off by default. The relevance eval that decides whether it
beats today's index-first navigation is the follow-up branch `feat_docs_retrieval_eval`, not this one.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Refer to other
> roadmap items by title only. Their priority numbers are about to change.

---

## Why now

The docs catalog engine and the docs phase already write and maintain the second brain. Agents read it one way
only: `INDEX.md` first, then each doc's related-docs links (`plugin/agents/task-plan-writer.md`, the
`<docs_root>` bullet). This branch adds a second way in. Because it ships off by default and is opt-in, it does
not need a measurement to justify merging. The follow-up eval decides whether it is ever recommended.

## Decisions already taken (do not reopen)

- **Everything runs locally.** Store, embeddings and reranker run on the adopter's machine. No hosted vector
  database and no embedding or rerank API: an adopter's docs never leave their machine.
- **Store: PGlite (embedded Postgres) with two extensions, each its own package.** Vector search uses pgvector
  (`@electric-sql/pglite-pgvector`) with an HNSW index. Lexical search uses BM25 through `pg_textsearch`
  (`@electric-sql/pglite-pg_textsearch`). Both extensions pin PGlite to an exact version. The store sits behind a
  small interface, so a real Postgres could replace PGlite by connection string later. This branch does not
  build that option.
- **Embeddings: a local model through Transformers.js.** The plan picks the model and records why (size,
  quality, licence). The model name and version are stored in the index, and a change to either forces a full
  rebuild.
- **Dependencies follow the docs-retrieval carve-out** in `.claude/context/conventions.md` → `## The stack, in
  the words the rules below use`. Retrieval libraries are optional peer dependencies, loaded only by a dynamic
  `import()`, and installed for an adopter only when retrieval is turned on. `autonomous-sdlc-harness` stays one
  package.
- **Configuration: `docs.retrieval`, a boolean, default `false`, allowed only when `phases.docs` is `true`.**
  Retrieval on with docs off is invalid in the schema and in `config`'s check. Docs on with retrieval off is
  valid.
- **Consumers: the plan writer and the reviewers.** Implementers, the committer and the interactive-test agents
  do not get the tool.
- **The docs stay the source of truth.** The index is a derived cache: never committed, never edited by hand,
  and always rebuildable from the Markdown.

## What to deliver

1. **Ingestion.**
   - The corpus is every Markdown file under `docs.root`, plus the conventions documents the `layers` list names.
   - Split each file into chunks at its `##` and `###` headings. Each chunk carries its document title and heading
     path in its text, and stores path, heading anchor and a content hash as metadata.
   - Refresh incrementally: re-embed only chunks whose hash changed, and drop chunks whose file or heading is
     gone. A merged branch therefore needs no retrieval edit. The index notices the changed docs on its next
     refresh.
2. **The index.**
   - A gitignored, per-checkout cache, so each worktree indexes its own branch's docs. `init` adds the path to
     its managed `.gitignore` block.
   - The model weights live in a cache shared across worktrees, so a new worktree does not download them again.
     Set the cache location explicitly; do not rely on the library's default.
3. **Search.**
   - Lexical (BM25) and vector (pgvector) results are fused with reciprocal rank fusion.
   - The top candidates are reordered by a local cross-encoder reranker.
   - Results come back as `path#heading` with a snippet and a score.
   - Below a score threshold the tool abstains ("no confident match") instead of returning noise. This branch
     sets a provisional threshold from the fixture corpus, keeps it in one named constant, and records it as
     provisional. The follow-up eval calibrates it.
   - The embedder and reranker sit behind an interface, so tests use a deterministic stub, and the follow-up eval
     can run lexical-only, vector-only, fused and fused-plus-rerank separately.
4. **An MCP server over stdio**, started from the CLI, with a read-only `search_docs(query, k)` tool.
   - The plugin declares the server, so adopters get it when the plugin is installed and retrieval is on.
   - Grant the tool in the `tools:` allowlists of the plan writer and of every reviewer that reads `<docs_root>`
     today. Re-derive that set with a grep; do not take it from this prompt.
   - Each granted agent's `<docs_root>` bullet gains the tool, under the same rule as the corpus: navigation,
     never evidence, the code wins. The tool's output is untrusted data.
   - With `docs.retrieval` off, the server is not registered and the agents' contracts say to ignore the tool.
   - The permission profile `init` generates for unattended runs allows the tool when retrieval is on. An
     unattended run cannot answer a prompt, so a tool it is not allowed to call would stall it.
5. **Adopter surface.**
   - `init` asks about retrieval only when docs is on, with a matching flag for non-interactive use. When
     retrieval is turned on, `init` installs the peer dependencies and downloads the model.
   - `doctor` checks, when retrieval is on: the peer dependencies resolve, the model is cached, and the index
     builds.
   - Unattended runs have no web access. Every download must happen at setup time, never in the middle of a run.
6. **Documentation.**
   - `docs/cli.md` and `docs/config.md` cover the new verb or verbs and the new key.
   - `README.md` and `llms.txt` mention retrieval, as opt-in and not yet measured, where they list what the
     harness does.
   - A short trade-offs section records why the store is embedded and local, and why both halves live in one
     Postgres engine rather than in two stores. It also records what changes at scale: at millions of chunks
     the move is a real Postgres with the same two extensions, behind the same interface.
7. **The roadmap row.** Replace the `Docs-catalog retrieval` row's description in `ROADMAP.md` with exactly the
   text below. Its status stays `Open`: the item closes when the eval has been run on a real catalog and the
   numbers are published, which is not this branch.

   > Agentic retrieval over the "second brain" — the docs catalog and the conventions documents — exposed as a
   > read-only MCP search tool for the plan writer and the reviewers. The Markdown documents stay the source of
   > truth; the index is a derived, uncommitted cache refreshed incrementally from content hashes, so a merged
   > branch needs no retrieval edit. An ingestion pipeline chunks each document at its headings; hybrid lexical
   > (BM25) and vector (pgvector) indexes in an embedded Postgres (PGlite), built on local
   > embeddings, are fused and reranked, results cite `path#heading`, and a query with no confident match
   > abstains rather than returning noise. A measured relevance eval (recall@k, MRR, plus per-arm cost and
   > latency, runnable as a regression check) decides it against the index-first navigation used today rather
   > than assuming retrieval wins. Retrieved text is navigation, never evidence: the code still wins.

## Establish, do not assume

- **The dependencies are already in the workspace.** `cli/package.json` on the default branch declares PGlite,
  its pgvector and pg_textsearch extensions, Transformers.js and the MCP SDK, both as optional peer dependencies
  and as dev dependencies, so the worktree's `npm ci` installed them. This run cannot install packages. If one it
  needs is missing, it records a blocker and does not work around it.
- **Already measured by hand on macOS, Node 20, before this prompt was queued; re-confirm, do not re-research:**
  - PGlite 0.5.8 loads both extensions.
  - A `vector` column takes an `hnsw` index with `vector_cosine_ops`.
  - `CREATE INDEX … USING bm25 (body) WITH (text_config='english')` works, and scoring works through
    `body <@> to_bm25query('<query>', '<index name>')`, which returns lower-is-better scores.
  - Transformers.js 4.3 ran `Xenova/bge-small-en-v1.5` (`dtype: 'q8'`, CLS pooling, normalised) to a 384-dimension
    vector with an explicit `env.cacheDir`, about 4 s cold including a 33 MB download.
  - Its native runtime, `onnxruntime-node`, is about 290 MB installed.
- **Still open:** whether the chosen reranker model runs the same way, and whether all of the above holds on
  Linux.
- **Optional peer dependencies under `npx`:** whether `npx autonomous-sdlc-harness` resolves peers installed in
  the adopting project. If it does not, the plan decides where `init` installs them so the CLI finds them.
- **How a Claude Code plugin declares an MCP server,** how it passes the checkout root and configuration to that
  server, and what the tool's fully qualified name becomes in a `tools:` allowlist and in a permission rule.
- **The consumer set:** which plan-writer and reviewer agents read `<docs_root>` today (grep `plugin/agents/`).
- **The worktree path:** whether `setup-worktree.sh` should warm the index or leave the first query to build it.
  Measure the cold build time on the fixture corpus before deciding.

## Testing

- The suite never downloads a model. Tests use the stub embedder and reranker from §3.
- The MCP server is tested by starting it over stdio and calling `search_docs` through the MCP SDK's client.
  This run does not need the server loaded into its own session.
- One smoke check with the real model is hand-run, documented where this repository's other hand-run checks are
  documented, and its output is recorded in the Done summary if the run could execute it.

## Out of scope

- The relevance eval, its runner, its query sets and calibrating the threshold (`feat_docs_retrieval_eval`).
- Server Postgres, hosted vector stores, and embedding or rerank APIs.
- The LangGraph port (**Second-runtime reference port**), citation checking (**Citation groundedness gate**) and
  trace output (**Trace export**).
- Giving the tool to implementers, the committer or the interactive-test agents.

## Acceptance

1. With `docs.retrieval` off, no retrieval library is loaded, and a fresh adopter's install contains none of
   them.
2. Enabling `docs.retrieval` with `phases.docs` off fails both the schema check and `config`'s check.
3. On a fixture corpus: editing one doc section re-embeds only that section's chunks, and deleting a doc removes
   its chunks. Both are asserted by a test.
4. `search_docs`, called through the MCP client over stdio, returns `path#heading` results for a fixture query
   and abstains on a query with no match in the corpus.
5. With retrieval on, the generated unattended permission profile allows the tool, and the granted agents'
   allowlists name it. With retrieval off, neither does.
6. `doctor` reports each retrieval check as passing on a set-up adopter and as failing when the model cache is
   removed.
7. The `ROADMAP.md` row carries exactly the text in §7, with status `Open`.
8. `bash scripts/run-gates.sh` prints no new failure.
