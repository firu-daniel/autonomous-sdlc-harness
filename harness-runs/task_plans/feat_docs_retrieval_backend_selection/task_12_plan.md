### Task 12 — Rewrite `docs/retrieval.md`'s design sections for two backends

**Goal:** Deliverable 6's four section edits. `## How it fits together` describes both backends. `## What this buys you`'s "embedded and in-process, no database server to install or keep running" claim is scoped to the TypeScript backend. `## What it costs` gains the Python backend's line items, with their figures marked pending for `feat_docs_retrieval_backend_comparison`. `## Where it goes next` retires the entry this sequence executes.

**Depends on:**

- Task 1, which adds the key `docs.retrievalBackend`, `"typescript"` (default) or `"python"`, read only inside `retrievalApplies`.
- Task 4, whose launcher, `docs-search-server.sh`, reads the key at run time. With the TypeScript backend it `exec`s the runtime's `docs serve`, unchanged. With `python` it runs `harness-docs-retrieval serve-mcp --repo <root>` as a child with `TERM`/`INT` forwarded, defaulting `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` to `postgresql://harness:harness@127.0.0.1:5432/docs_retrieval`. It exits `3` when that backend is selected but cannot serve.
- Task 5, whose `doctor` checks are `retrieval-python-dependencies`, `retrieval-python-model-cache` and `retrieval-python-index`, graded from one `harness-docs-retrieval self-check`. The TypeScript three are not applicable under `python`, and the Python three under the default.
- Task 7, under which `init` still installs the TypeScript runtime and models with `python` selected and provisions nothing for Python.

**Where this task stops.** The new end-to-end section, `## Turning on the Python backend`, and its database-scope and recovery decisions are **Task 13's**. This task links to that heading by name. The dated records under `## Measured, and how` are not edited (story index `## Scope register`, row 16). No figure is written for the Python backend.

### Targets

- `docs/retrieval.md`

**Work:**

- [ ] **Who reads this** paragraph and `## How it fits together`. Open the section with a **Two backends.** paragraph:
  - the TypeScript backend, `cli/src/retrieval/`, the default, embedded PGlite, per checkout;
  - the Python backend, `docs-retrieval-service/`, opt-in through `docs.retrievalBackend`, a real Postgres reached by connection string;
  - the same server name, tool, permission string and wire for both;
  - one launcher choosing between them at run time, with the package README (`docs-retrieval-service/README.md`) as the Python side's own description.

  Add one sentence each where the existing **Store.**, **Server.** and **Models.** paragraphs describe only the TypeScript side, pointing at the Python counterparts by module (`store.py`, `mcp_server.py`, `models.py`). Keep every TypeScript sentence that stays true.
- [ ] **Launcher and registration.** and **`doctor`.** paragraphs:
  - restate the launcher's routing, its exit `3` and why the Python branch is not `exec`ed;
  - the `.mcp.json` entry and the profile fragment are unchanged whichever backend answers;
  - `doctor` has six checks, the three per backend and which three are not applicable under which selection, with the reason for each: grading a runtime the launcher never runs passes a server that never starts;
  - `retrieval-python-index` refreshes the index in its database.
- [ ] `## What this buys you`: reword **Embedded and in-process.** so it says *the TypeScript backend*, the default, needs no database server. Add one bullet: the Python backend trades that for a Postgres the operator runs. Keep **Local, not hosted.** true of both, which it is: the compose file binds loopback. **One Postgres engine rather than two stores.** holds for both.
- [ ] `## What it costs`: keep the three TypeScript bullets, labelled as the TypeScript backend's. Add the Python backend's line items:
  - a second weight cache at `${XDG_CACHE_HOME:-$HOME/.cache}/harness-docs-retrieval/models`, fp32 rather than q8;
  - the Postgres container and its volume;
  - the Python environment;
  - an index scoped per database rather than per checkout.

  Each item's figure reads **pending — measured by `feat_docs_retrieval_backend_comparison`**. No size, time or ratio is guessed, and no stub figure is quoted.
- [ ] `## Where it goes next`: retire the paragraph whose closing sentence is "This branch does not build it." The move it describes, a real Postgres with `pgvector` and `pg_textsearch` reached by connection string, is now built (`docs-retrieval-service/`) and selectable. Say so in one sentence, and point at `## Turning on the Python backend`. Name what remains next without deciding it: the side-by-side comparison, `feat_docs_retrieval_backend_comparison`. Its outcome is not written as pending work.

**Verification:**

- `git grep -n "no database server" -- docs/retrieval.md` matches only a sentence scoped to the TypeScript backend.
- `git grep -n "This branch does not build it" -- docs/retrieval.md` prints nothing.
- Every Python cost line carries the pending marker and no number: read `## What it costs` against the lessons ledger's stub-figure and wall-clock rules.
- Every `##` heading this file had still exists with its text unchanged (`git diff dev...HEAD -- docs/retrieval.md` shows no removed `## ` line), because other documents cite them.

**Deviations from plan:**

- `**Query log.**` now reads "the TypeScript server appends", and the **Server.** paragraph's Python sentence states that the Python backend writes no query log (`docs-retrieval-service/README.md` → **No query log.**). The plan named only Store, Server and Models, but without this the Query log paragraph would have stayed a claim about both backends that is true of one.
- The three `## What this buys you` bold labels gained backend qualifiers (`**Embedded and in-process, on the TypeScript backend.**`, `**One Postgres engine rather than two stores, on either backend.**`) and the new bullet is `**A real Postgres, on the Python backend.**`. `git grep` over the tree outside `harness-runs/` found no citation of either old label.
- The `git diff dev...HEAD` heading check was run as `git diff -- docs/retrieval.md` over the uncommitted edit, since this unit has not committed; it showed no removed or added `## ` line.
