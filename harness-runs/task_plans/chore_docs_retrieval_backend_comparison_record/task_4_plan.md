### Task 4 — Correct `docs/retrieval-eval.md` → step 3's paragraph on the persistent compose database

**Goal:** Correct the paragraph under step 3 of `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`. It opens *"The Python runs index into the one persistent compose database, and the Python backend's lexical scores depend on what that database held before"*. It should say what the BM25 diagnosis measured and what the fixes shipped, and it keeps the operator's instruction to record the database's state.

**Depends on:** Task 2, which rewrites `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Divergence sources, in the order checked`, item 3. Item 3 keeps its number and now names mechanisms 1 and 2 and what shipped. This paragraph still cites it as *source (3)*, so that citation still resolves. This paragraph names `### A fresh fixture-catalog reading, both backends as shipped`, which Task 1 added, by that exact heading.

**Where this task stops.** It edits that one paragraph and nothing else in `docs/retrieval-eval.md`: not the step 3 commands, not steps 1, 2, 4 to 7, not `### Writing the comparison up`. It edits no other file.

### Targets

- `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`, the paragraph following step 3's four commands.

**Work:**

- [ ] **Rewrite the paragraph**, keeping its last instruction: record in `host.txt` whether the database was emptied (`docker compose down -v`, then `docker compose up -d --wait postgres`, from `docs-retrieval-service/`) before these runs. Its content:
  - **The database.** The Python runs still index into the one persistent compose database.
  - **What shipped.** Both backends now end every refresh that wrote anything, the first build included, and any refresh whose index is not marked rebuilt, in `REINDEX INDEX chunks_bm25`. So arm B no longer depends on what that database held before, within the one-hit residuals `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch` → `#### The shipped end state at refresh level` records.
  - **The recorded blocks.** The recorded `@python` blocks of 2026-10-08 were taken on `pg_textsearch` 1.3.1 before those fixes. Their arm B figures, and arms D and E through the fusion, describe the corpus *and* the database's state at the time (`docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Divergence sources, in the order checked`, source (3)).
  - **No before/after pair.** A block taken now is not a before/after pair with them: the 1.5.1 upgrade, the fix on both backends and, on `self-docs`, the corpus stamp all lie between. Point to `### A fresh fixture-catalog reading, both backends as shipped` in the same document for the reading taken on both backends as shipped.

**Verification:**

- `git diff --stat` lists only `docs/retrieval-eval.md`, and `git diff -U0 -- docs/retrieval-eval.md` has one hunk, inside `### Measuring the Python backend against the TypeScript one`, after step 3's last command line and before **4. The MCP pass**.
- `git grep -nE "held before|database's history" -- docs/retrieval-eval.md` prints no line asserting that the shipped backend's scores depend on the database's past. A remaining match describes the 2026-10-08 blocks only.
- Each heading the paragraph cites resolves. `git grep -nE '^#### The shipped end state at refresh level$|^### Divergence sources, in the order checked$|^### A fresh fixture-catalog reading, both backends as shipped$' -- docs/retrieval-eval-results.md` prints all three.
- `git grep -n 'host.txt' -- docs/retrieval-eval.md` still prints the paragraph's record-whether-emptied instruction.
