# RAG extraction research — shared brief

Research only. **Nothing under `plugin/`, `cli/`, `docs-retrieval-service/`, `schemas/` or anywhere else changes**, and nothing is committed. Each research agent writes exactly one file in `docs/rag-extraction-research/`, named by its fork below. A synthesis, `docs/rag-extraction-research/README.md`, is written after the forks are reviewed and revised.

## The question

The maintainer is thinking of moving the docs-retrieval mechanism (the RAG: corpus → chunking → embeddings + BM25 in Postgres → fused + reranked search, served as the `harness-docs` MCP server's `search_docs` tool) **out of this repository into its own repository and product**, for clients and adopters who are not necessarily using the harness.

Framing given by the maintainer, to be taken as settled:

- **How the harness would keep using it is not the focus.** The harness is a source-code product, and the real-catalog eval already showed agents working on code often prefer grep or reading the code, even after calling retrieval (`docs/retrieval-eval-results.md` → `## The decision, applied to the real catalog`). Note harness re-use only where it bears on the seam.
- **The target user has large or extremely large documentation** (not code) and wants to *plug it in*: minimal setup, then invoke it, locally or against an API.
- **Setup means, at minimum:** (1) a source of docs, either a local path or a remote one (a remote source needs a secure connection; whether that is the tool's or the client's responsibility is an open question, as is TLS certificate validation); (2) a Postgres, which may be local or remote (the Python backend already takes a connection string; a remote one needs credentials or a key).
- **The current implementation is not locked** (maintainer, 2026-10-28). The product need not keep `pg_textsearch`, pgvector, PGlite or the current models: a local/embedded search mode, a different lexical engine or different model types (other embedders/rerankers, hosted embedding APIs, multilingual) are all acceptable. Treat today's stack as a starting point, not a constraint.
- **Models: local by default, others by config** (maintainer, 2026-10-28). Keep local retrieval models (embedder, reranker) as the default wherever possible, for no or low money cost, but let a client choose other model types (hosted embedding/rerank APIs, larger or multilingual local models) through configuration.
- **Being a late entrant is not a concern** (maintainer, 2026-10-28). Comparable local no-key tools existing is fine. ~~One engine serving both a local embedded store and a remote Postgres is the accepted direction.~~ **Withdrawn in round 2**, see below.
- Candidate shapes to evaluate, not assume: still a Claude Code plugin; an MCP server (stdio and/or remote HTTP); an HTTP API (self-hosted or hosted); an installable kit (npm / pip / Docker / Homebrew); or a combination.

## Round 2 rulings (maintainer, 2026-10-28, after the round 1 synthesis)

- **R2.1: the "one engine" ruling is withdrawn.** The engine may differ by store type (for example TypeScript/PGlite embedded, Python against a remote Postgres), and supporting both runtimes is acceptable. Large companies often use, recommend or require Python; weigh that as a lever. **The client does not need to know or care which engine runs underneath**; look for a different or better solution than round 1's "one TypeScript engine".
- **R2.2: `pg_textsearch` being unavailable on most managed Postgres is a big drawback and must be decided.** Supabase and DigitalOcean come up often; find out why they are popular for this audience, what lexical/BM25 search they offer, and decide the lexical engine(s) and fallback.
- **R2.3: the default search mode switches to model-free** (no embedder, no reranker on the default path), which also removes today's licence risk from the default. Fused search and reranking stay as options; the maintainer leans to keeping them for large/business corpora, where practice reportedly favours hybrid + rerank. The MS MARCO reranker licence risk is not accepted as it stands: find a model, or models, without it.
- **R2.4: large/business corpus measurements belong to issue #199** (`rag chore_business_corpus_research`). Do not duplicate its eval design; literature and vendor evidence on what works for such corpora is in scope.
- **R2.5: the four security gaps in today's code are filed** as #200–#203.

## Round 3 rulings (maintainer, 2026-10-28, after the round 2 synthesis)

- **R3.1 Name.** The product is **RagScene** (`ragscene`), consistent with the harness's pending rename to DevScene. Every `ragscene` / `RAGSCENE_` name in this folder replaces the earlier working name `docsrag`.
- **R3.2 Platform.** RagScene will most likely always run on Linux, locally too (a container or VM on a Mac). `pgembed`'s missing macOS wheels (Intel, pre-15) therefore matter less.
- **R3.3 AGPL.** Building our own `pgembed` wheels without `pg_search` (the 6 × 3 matrix) is most likely not done; the AGPL licence of the bundled `pg_search` is to be checked instead (§7 step 7).
- **R3.4 Fallback.** If `pgembed` fails the one-day test, the fallback is Python against a local Postgres from RagScene's own Docker image, or TypeScript.
- **R3.5 Hosted tier.** A hosted RagScene is **on the roadmap**; round 1's "hosted SaaS deferred" now means "not first".
- **R3.6 Runtime not confirmed.** Python is the maintainer's lean, but not confirmed; the one-day `pgembed` test (§7 step 2) is filed as its own issue first, since it may surface unexpected points on Python.
- **R3.7 Order.** Finish the sandbox series, then the DevScene rename (expected to take a couple of days), and only then RagScene: one big task at a time. No RagScene work, the private `ragscenedev` repository included, starts before the rename is done.
- **R3.8 History.** The private `ragscenedev` repository is a workspace for early extraction, fixes and issues; at a stable point everything moves to the public `firu-daniel/ragscene` as a single initial commit. Git history is not kept, from the harness or from `ragscenedev`.

## The forks

| File | Fork | Main sources |
|---|---|---|
| `01-current-mechanism.md` | How retrieval works inside this repository today and where it would cut out | This repository's code and docs only. No web. |
| `02-distribution-shapes.md` | How comparable systems are packaged, installed and invoked, and which shape fits | The web (primary sources: official docs, READMEs, registries), as of today (2026-10-28) |
| `03-sources-database-security.md` | Ingesting docs from local and remote sources, the Postgres (local/remote/managed) the store needs, and the security of both connections | The web plus this repository's store and extension requirements |
| `04-engine-architecture.md` | Round 2 (R2.1): engine per store type, dual runtime, or another architecture the client never sees | The web plus this repository |
| `05-managed-postgres-lexical.md` | Round 2 (R2.2): the popular managed Postgres offerings and their lexical search, and the lexical-engine decision | The web plus this repository |
| `06-models-and-modes.md` | Round 2 (R2.3): retrieval practice for large/business corpora, licence-clean embedders and rerankers, and a model-free default | The web plus this repository |
| `07-extraction-plan.md` | Round 3: how to start the extraction (private `ragscenedev`, the cut, adoption, the move), ordered by R3.7 | This repository, Expause and straightedge history, GitHub and registry docs |

## Rules for every fork file

- **Three kinds of statement**, as in `docs/copilot-foundry-research.md` → `## How this was researched`: **Documented** (a source states it — give the URL, or `path:line` / `path → ## heading` for this repository), **Inference** (your own conclusion), **Unconfirmed** (no source checked states it, or sources disagree). Mark every Unconfirmed claim.
- Cite this repository by `path:line` or `path → ## heading`. Cite the web by URL, with the date retrieved (2026-10-28) stated once in the method section.
- Prefer primary sources. Mark a secondary source (blog, aggregator, AI summary) as such.
- No marketing tone. Plain, short sentences. Tables where they compare things.
- Length: about 2 000 – 4 000 words. Dense beats long.
- End with `## Open questions` (what a hands-on test or the maintainer must settle) and `## Fork verdict` (3–8 sentences: what this fork recommends, and how sure it is).

## Fixed opening

```
# RAG extraction research — <fork title>
**Who reads this:** … **It owns:** … **It does not own:** …
## How this was researched   (date, route, sources, the three kinds of statement)
```
