`feat_docs_retrieval_python_backend` builds the **second implementation** of docs retrieval: a Python service that
answers the same `search_docs` tool over the same corpus, on a real Postgres reached by connection string. It executes
the move `docs/retrieval.md` → `## Where it goes next` already declares, and it lands as the Python / FastAPI / Docker
beachhead the roadmap item **Second-runtime reference port** builds on.

This is the first of three branches that together deliver the second backend:

1. **this branch**: the Python package, the parity core, the container and the gates;
2. `feat_docs_retrieval_backend_selection`: the config key, launcher routing and doctor checks that make the
   backend selectable by an adopter, plus the `docs/retrieval.md` rewrite;
3. `feat_docs_retrieval_backend_comparison`: the side-by-side measurement against the TypeScript backend and the
   comparison write-up.

**This branch makes nothing selectable.** No adopter-facing file changes: no config key, no edit to the launcher, no
doctor check. With it merged, an adopter's install behaves exactly as before. It does not run the real-model
comparison either. It ends with a backend that has been proven to speak the same wire and chunk the same way, and is
ready to be measured.

It follows `feat_docs_catalog_retrieval`, which shipped the TypeScript implementation off by default, and
`feat_docs_retrieval_eval`, which owns the measurement the third branch grades against.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Refer to other roadmap
> items by title only.

---

## Why now

**The seam is already declared, and declaring it was the cheap half.** `cli/src/retrieval/store.ts` states in its own
header that the SQL "stays plain Postgres plus the `vector` and `pg_textsearch` extensions" precisely so a real
Postgres stays reachable behind the same `DocStore` interface, and `docs/retrieval.md` → `## Where it goes next` names
that move and says the branch that wrote it does not build it. A declared seam that nothing has ever been fitted to is
a claim, not a seam. This branch is the first thing to press on it, and what it finds is worth more than the port:
either the interface holds, or this branch shows exactly where it does not.

**Python and FastAPI are the ecosystem's language for this, and the harness currently speaks neither.** Everything
retrieval does here (BM25 arms, bi-encoder embeddings, a cross-encoder reranker, rank fusion, an IR eval) is written
in TypeScript against `@huggingface/transformers` and PGlite, which is the unusual way to do it. In Python the same
subsystem is `sentence-transformers` plus `psycopg` plus the MCP Python SDK, and that is the stack this work is
normally read in.

**It is the cheapest possible prerequisite for the LangGraph port.** That port wants a Python package, an async
FastAPI app, a Dockerfile and a compose file that stands up its dependencies, and so does this. Build that packaging
once here, against a subsystem whose correct answers are already known and measured. The LangGraph branch then arrives
at a repository that already has `pyproject.toml`, a lint/type/test gate wired into `scripts/run-gates.sh`, and a
container story, and spends its week on the graph rather than on Python scaffolding. **Do not build any part of the
LangGraph port here.** See `## Out of scope`.

---

## What to deliver

1. **A Python package, in this repository, laid out as a peer of `cli/`.** `pyproject.toml`, a src layout, a pinned
   lockfile, and one console entry point. It is not published to PyPI in this branch and nothing in `cli/` imports it.
   Name it for what it is rather than for the language. The entry point's sub-commands are the surface the second
   branch builds on: at minimum, serve the stdio MCP server, serve the HTTP app, build the index, and a self-check
   that answers the three questions a doctor check will ask (interpreter and packages resolve, weights are present,
   an index builds) with an exit status and one line each. Keep those answers in the package so the second branch
   only has to call them, and does not re-implement them in TypeScript.

2. **The same wire, byte for byte.** The MCP server name is `harness-docs`, its one tool is `search_docs`, and the
   permission string is `mcp__harness-docs__search_docs`. Those three strings are quoted in eleven agent `tools:`
   allowlists under `plugin/agents/`, in `plugin/agents/README.txt`, in `cli/templates/repo/mcp.retrieval.json`, in
   both `cli/templates/claude/settings.autonomous*.json` and in `cli/templates/scripts/docs-search-server.sh`.
   **A client must not be able to tell which backend answered it.** That means the same tool description, the same
   input schema (`query` and `k`, with `k` clamped the same way), the same rendered output shape (two lines per hit,
   `n. ref (score s)`) and the same single-line abstention message. Assert it: a case that renders the same stubbed
   hits through both implementations and compares the bytes, and a case that compares the tool listing both servers
   advertise. **No file that quotes those strings is edited by this branch**, and a diff that touches
   `plugin/agents/` is a sign the port went wrong.

3. **The store, on a real Postgres, issuing the same SQL.** `pgvector` and `pg_textsearch`, an HNSW index over the
   embedding column and a BM25 index over the text column, the same `chunks` table columns and the same `meta` table,
   reached by connection string. Take the statements from `cli/src/retrieval/store.ts` rather than rewriting them.
   The two that decide every relevance number are the lexical arm's `ORDER BY text <@> to_bm25query($1,
   'chunks_bm25')` and the vector arm's `ORDER BY embedding <=> $1::vector`, and the point of the port is that they
   are the *same* statements against a different engine. Keep `store.ts`'s rule too: every value reaches SQL as a
   bound parameter. Where a statement cannot be carried over, record it in `## The seam, as found` (deliverable 10)
   and name the reason. That is a finding about the seam, which is what this work exists to produce.

4. **The same two models, through the normal Python path, with two decisions recorded.**
   `sentence-transformers` over `BAAI/bge-small-en-v1.5` and a cross-encoder over
   `cross-encoder/ms-marco-MiniLM-L-6-v2`, the originals of the `Xenova/*` ONNX exports the TypeScript side runs.
   - **Precision.** The TypeScript side does not run full-precision weights. Its recorded ids are
     `Xenova/bge-small-en-v1.5:q8:cls:384:v1` and `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1`, which are
     **q8-quantized**. `sentence-transformers` loads full-precision PyTorch weights by default. Decide whether the
     Python backend runs full precision (the normal Python path, and the default here) or an equivalent quantization,
     and record the choice and the reason. Either way, the third branch has to be able to attribute a relevance
     difference to it, so it must not be left implicit.
   - **The embedder `id`.** It is stored in the index and a change to it forces a full rebuild
     (`cli/src/retrieval/models.ts`). A shared id would claim the two backends produce interchangeable vectors, and
     nothing in this branch measures that. **Namespace it**, and encode the precision in it the way the TypeScript id
     encodes `q8`. Sharing becomes defensible only once the third branch has a measured vector-agreement number, and
     that is its decision to make, not this one's.

5. **The same constants, and the same abstention rule.** `RRF_K = 60`, 50 rows from each arm before fusion, 20 fused
   rows to the reranker, 5 results by default, 20 maximum, a 240-character snippet, and the abstention message
   `no confident match`. **Only the fused-plus-rerank mode abstains**, and only below the threshold. That rule is the
   reason `cli/src/retrieval/search.ts` exists, and it survives the port intact. Take the threshold from
   `ABSTAIN_SCORE_THRESHOLD` in `cli/src/retrieval/search.ts`, whose value `docs/retrieval-eval-results.md` →
   `## Threshold calibration` records the calibration of. **Do not re-derive it.** The four search modes
   (`lexical`, `vector`, `fused`, `fused-rerank`) all exist, because the third branch measures each as an arm.

6. **Chunking parity, asserted rather than assumed, and written first.** The same headings must produce the same
   chunk keys, the same `path#heading` anchors and the same change-signal hashes. The eval's labels resolve against
   the keys, so a chunker that splits differently makes every recall number incomparable. Port
   `cli/src/retrieval/corpus.ts` alongside it, so that both sides enumerate the same file set. Write a case that runs
   both chunkers over both corpora the eval commits and asserts an identical key set and identical hashes. It is the
   cheapest insurance the whole three-branch sequence has.

7. **An async FastAPI app and a container story.** One `POST /search` endpoint over the same search path the MCP tool
   uses, a health endpoint, a `Dockerfile`, and a compose file that stands up Postgres with both extensions alongside
   the service. The MCP stdio server and the HTTP app are two entry points over one search module, not two
   implementations. The stdio one is what an agent runner starts; the HTTP one makes the service inspectable, and the
   LangGraph branch calls it later. Time the library-level search call inside the Python process and expose it from
   both entry points (the HTTP response, and a stderr or log line for stdio) so the third branch can report it
   separately from the round trip without adding a second timing path.

8. **A stub seam, with the same shape as the one that already exists.** The TypeScript suite swaps both models for
   hash-based stand-ins through `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB`, so a test never downloads or loads a model
   (`cli/src/retrieval/models.ts`). The Python package needs the equivalent, and for the same reason. Reuse the same
   variable name if the semantics are identical; introduce a second name only if they are not, and say why. Where the
   stubs can be made to produce identical scores to the TypeScript ones, do it: the byte-for-byte case in deliverable
   2 then runs end to end with no weights at all.

9. **Gates.** Python lint, type-check and tests run where this repository's other gates run, in
   `scripts/run-gates.sh`, graded by exit status like every other gate there. `docs/development.md` §5's gate list
   gains whatever this adds. A gate that needs a Postgres container is opt-in and skips loudly rather than failing
   when Docker is absent. The no-container path must still cover the pure-logic half (chunking, fusion, abstention,
   rendering), which is most of it.

10. **A package README with `## The seam, as found`.** How to stand the service up, where its weight cache lives
    and how to provision it, which precision and embedder id it runs and why (deliverable 4), and a section recording
    every place `DocStore`'s statements or contract did not carry over unchanged, each with its reason. If everything
    carried over, the section says so in one line, and that is a result too.

---

## Settled before this branch was queued

Read these as findings, not as questions to re-open.

- **The TypeScript implementation stays the default, and this sequence does not deprecate it.** `docs/retrieval.md`
  → `## What this buys you` sells retrieval on being local, embedded and in-process, with nothing to install or keep
  running. A backend that needs a Postgres container cannot make that claim, and an adopter who wants retrieval to
  cost them one `init` and no infrastructure must keep getting exactly that. This is a **second, opt-in backend**. A
  design that reaches for "replace the TypeScript store now that a real one exists" has misread the trade-off.

- **The Python backend must stay local-only too.** No hosted vector database, no embedding API, no rerank API, no key
  to manage. The reasoning in `## What this buys you` applies to both backends identically: an adopter's docs never
  leave their machine, and an unattended run has nothing to reach. A port that quietly acquires a network dependency
  has given away the property the subsystem was built for.

- **The weights are provisioned by hand, as a pre-step, and an unattended run downloads nothing.**
  `cli/src/retrieval/setup.ts` puts every download where "an operator is present, because an unattended run has no
  network to count on", and that holds for the Python cache as well. The PyTorch weights are a **separate cache**
  from the Xenova ONNX exports `init` installs: same models, different artifacts, different location. Budget for both
  on disk and say where the Python one lives. This branch's gates must not need the weights at all (deliverable 8).
  If a real-model check needs them and the cache is missing, **stop and say so rather than improvising an install**.

- **Leave `harness.config.json` alone.** This repository has `phases.docs: false`, and turning it on would make every
  later branch here run the post-implementation docs phase. The service owns its config.

- **`sqlite` with FTS5 and `sqlite-vec` was considered and rejected** as the Python store. It would keep the embedded
  property, which is the one thing worth having about it. But it replaces BM25 scoring with a different implementation
  and a different tokenizer, which makes every relevance difference uninterpretable because the store and the
  language changed together. Real Postgres with the same two extensions changes exactly one variable, and it is the
  move the store header was kept plain for.

- **Relevance parity is a hypothesis, not a requirement, and it is not measured here.** Nothing in this branch tunes
  the Python backend toward the TypeScript numbers. A port that has been tuned leaves the third branch unable to say
  what it measured.

---

## Acceptance

1. A chunk-key and hash parity case passes over both corpora the eval commits.
2. With the stub models, the same query over the same corpus renders byte-identical `search_docs` output from both
   backends, abstention included, and both servers advertise the same tool listing.
3. `docker compose up` stands up Postgres with `vector` and `pg_textsearch` alongside the service. `POST /search` and
   the stdio MCP server both answer from one search module, and the index builds through the console entry point.
4. The console entry point's self-check answers its three questions with an exit status, and fails cleanly (not with
   a traceback) when the weights or the database are absent.
5. `scripts/run-gates.sh` passes on a machine with no Docker and no Python weights, with the container-dependent
   gates skipping loudly.
6. No file under `plugin/` and no adopter-facing file under `cli/` is modified.

---

## Out of scope

- **Making the backend selectable**: the config key, launcher routing, doctor checks and the `docs/retrieval.md`
  rewrite. That is `feat_docs_retrieval_backend_selection`.
- **The real-model comparison** and its write-up. That is `feat_docs_retrieval_backend_comparison`.
- **The LangGraph port.** It is its own branch, and it reuses this one's `pyproject.toml`, container and gate wiring
  rather than being built alongside them. Nothing here imports LangGraph or models a graph.
- **Publishing the Python package** to PyPI, and any versioning or release story for it.
- **A provider or engine abstraction in the harness core.** The roadmap row this sequence feeds is the retrieval
  seam, not the engine seam.
- **Changing the corpus.** No docs-catalog run, no new committed documents. Either would move the numbers the eval
  branch recorded.
- **The query log** (`cli/src/retrieval/queryLog.ts`). It is opt-in and invisible to a client, and nothing in this
  sequence reads it. Say in the README that the Python backend does not write one.
