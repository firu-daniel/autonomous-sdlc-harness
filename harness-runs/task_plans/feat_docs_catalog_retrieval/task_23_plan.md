### Task 23 — Mention retrieval in `README.md`, `llms.txt` and `ARCHITECTURE.md`, and replace the roadmap row's text

**Goal:** Wherever the repository says what the harness does, and wherever it counts the CLI's verbs, say that retrieval exists, that it is opt-in, and that it is not yet measured. Replace the `Docs-catalog retrieval` row's description in `ROADMAP.md` with exactly the task prompt's §7 text, and keep its status `Open`.

**Depends on:**

- **Task 20:** `docs/cli.md` now opens *"The commands are `init`, `doctor`, `config`, `daemon` and `docs`."* and documents the verb in a new `## 11. \`docs\``.
- **Task 21:** `docs/retrieval.md` is the design document, and says the feature is off by default, opt-in and not yet measured.
- **Task 14:** `cli/README.md` now names five subcommands. The verb is `docs`, its sub-verbs are `index`, `search`, `serve` and `fetch-models`, the key is `docs.retrieval`, and `init --docs --docs-retrieval` turns it on.

### Targets

- `README.md` — the Mermaid node *"init · doctor · config · daemon"*; the paragraph *"**The CLI is the npm package that carries the outer loop:** `init`, `doctor`, `config` and `daemon`."* and the two paragraphs under it; *"The four commands are [`docs/cli.md`](docs/cli.md)."*; the reading-list line *"[`docs/cli.md`](docs/cli.md) — the four subcommands, …"*; and a reading-list line for `docs/retrieval.md`.
- `llms.txt` — the `cli/` bullet (*"namely `init`, `doctor`, `config` and `daemon`"*), the `docs/cli.md` bullet (*"the four subcommands"*), and a `docs/retrieval.md` bullet.
- `ARCHITECTURE.md` — *"[`docs/cli.md`](docs/cli.md) — the four subcommands, …"*.
- `ROADMAP.md` — the `Docs-catalog retrieval` row's description cell under `## Engines, environments and integrations`.

**Work:**

- [ ] `README.md`, the CLI description. Make the Mermaid node `init · doctor · config · daemon · docs`. After *"…`config` reads and updates one configuration key at a time. `daemon` installs, starts and stops the run daemon…"*, add one sentence: *"`docs` is an opt-in, local search over the docs catalog and the conventions documents, served to the plan writer and the reviewers as an MCP tool; it is off by default and not yet measured against reading the docs index first."* Change *"carries the outer loop:"* so the list reads `init`, `doctor`, `config` and `daemon`, with `docs` beside them, and *"The four commands"* to *"The five commands"*. Keep every heading and named bullet other files cite: `## Quick start`, `## Two ledgers`, `## Scope and limits`, *Claude-bound today*, *Single-machine*, *Forge-agnostic*.
- [ ] `README.md`, the reading list. *"the four subcommands"* becomes *"the five subcommands"*, and a new line `- [\`docs/retrieval.md\`](docs/retrieval.md) — docs retrieval: opt-in, local, not yet measured; its design, measured facts and trade-offs.` goes after the `docs/cli.md` line. If the README shows how to turn retrieval on, the command sits in its own fenced block, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*). Otherwise it points at `docs/cli.md`.
- [ ] `llms.txt`. The `cli/` bullet becomes *"…carrying the outer loop, namely `init`, `doctor`, `config` and `daemon`, plus `docs`, an opt-in local docs-retrieval search that is not yet measured."* In the `docs/cli.md` bullet, "four" becomes "five". Add a bullet for `docs/retrieval.md` in the same absolute-URL form as its neighbours (`https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/retrieval.md`). No link may point at a path `scripts/publish-main.sh` → `removed_paths` strips, which gate 6c checks.
- [ ] `ARCHITECTURE.md`: *"the four subcommands"* becomes *"the five subcommands"*. That is this task's only edit to the file: the restatement of §6's permission-model row, §7's *No MCP server* bullet and §10 belongs to Task 25, which depends on this task.
- [ ] `ROADMAP.md`: replace **only** the description cell of the `Docs-catalog retrieval` row with exactly this text, one line, and leave the title cell and the `Open` status cell byte-identical:

  ```text
  Agentic retrieval over the "second brain" — the docs catalog and the conventions documents — exposed as a read-only MCP search tool for the plan writer and the reviewers. The Markdown documents stay the source of truth; the index is a derived, uncommitted cache refreshed incrementally from content hashes, so a merged branch needs no retrieval edit. An ingestion pipeline chunks each document at its headings; hybrid lexical (BM25) and vector (pgvector) indexes in an embedded Postgres (PGlite), built on local embeddings, are fused and reranked, results cite `path#heading`, and a query with no confident match abstains rather than returning noise. A measured relevance eval (recall@k, MRR, plus per-arm cost and latency, runnable as a regression check) decides it against the index-first navigation used today rather than assuming retrieval wins. Retrieved text is navigation, never evidence: the code still wins.
  ```

  The block above is the cell's whole content, without the fence or its two-space indent. Leave the `## Index` table, whose row keeps its title and number, untouched.

**Verification:**

- `git grep -n -E "doctor.{1,6}config.{1,10}daemon" -- . ":!harness-runs" ":!examples/notes-app/sdlc-harness"` reports only lines that also name `docs`, plus the three `no-change` sites in the story index's `## Scope register` (rows 13, 14, 20).
- `git grep -n -i -E "four (commands|verbs|subcommands)" -- . ":!harness-runs" ":!examples/notes-app/sdlc-harness"` reports only `cli/test/init.test.mjs` (register row 27).
- `grep -c "Agentic retrieval over the \"second brain\"" ROADMAP.md` is `1`, and that row's last cell is `Open`. Diff the row against the task prompt's §7 block: the texts are identical once the prompt's `> ` quote markers and line wraps are removed.
- `bash scripts/run-gates.sh` passes gate 6c (`llms.txt` links resolve on `main`) and gate 6a.
