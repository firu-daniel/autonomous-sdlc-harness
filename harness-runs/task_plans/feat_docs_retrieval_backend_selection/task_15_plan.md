### Task 15 — Bring the service README, `docs/remote-execution.md` and `ARCHITECTURE.md` level with the selectable backend

**Goal:** Correct the three remaining documents that describe the Python backend as unselectable, or that do not say where it runs:

- `docs-retrieval-service/README.md`'s opening claim, its now-reverted wire difference, its two "selecting this backend has to settle" seam items and its list of container cases;
- `docs/remote-execution.md`'s **Retrieval.** paragraph, which must state that a remote job provisions nothing for the Python backend;
- `ARCHITECTURE.md`'s statement that the one MCP server it authors is versioned with the CLI package.

**Depends on:**

- Task 9, which restores the refresh-failure remedy to `server.ts`'s text, `run \`npx autonomous-sdlc-harness doctor\` in this repository`, and deletes the `TODO: @claude` marker. The README's first **Deliberate wire differences** bullet is therefore no longer true.
- Task 13, which writes `docs/retrieval.md` → `## Turning on the Python backend`. That section holds the subsections stating the database decision (one database per repository, shared by its checkouts and worktrees, a second repository naming its own in `.mcp.json`) and the recovery decision (no reconnect; the next agent session restarts the server).
- Task 10, which adds `tests/test_launcher_e2e.py`: a `container`-marked MCP-client case through the launcher, and an unmarked exit-`3` case.
- Task 4. With the Python backend selected, the launcher exits `3` when `harness-docs-retrieval` does not resolve or the server cannot reach its database.

**Where this task stops.** No code. `ROADMAP.md`'s retrieval row and the rows the story index's `## Scope register` marks `no-change` are left as they are.

### Targets

- `docs-retrieval-service/README.md`
- `docs/remote-execution.md`
- `ARCHITECTURE.md`

**Work:**

- [ ] README opening paragraph: replace "**Nothing in this repository selects this backend, and an adopter's install is unchanged by it.**" with a statement that an adopter selects it with `docs.retrievalBackend: "python"` (`docs/config.md` §5). The TypeScript backend stays the default, and with the key absent an install is unchanged. Turning it on is `docs/retrieval.md` → `## Turning on the Python backend`.
- [ ] README → `## The wire and its timing` → **Deliberate wire differences.**: delete the first bullet, about the refresh-failure remedy, and adjust the lead-in if it counts the bullets. Search the README for any other mention of `self-check in this repository` and remove it.
- [ ] README → `## The seam, as found`:
  - item 3: replace the closing "Selecting this backend has to settle how that database is named per checkout." with one sentence: selection settled it as one database per repository, shared by its checkouts and worktrees, with the costs stated in `docs/retrieval.md` → `## Turning on the Python backend`;
  - item 8: replace "Selecting this backend has to settle recovery: …" the same way. The store does not reconnect, and the next agent session restarts the server.
  - Keep each item's description of the mechanism.
- [ ] README → `## Testing`: add `tests/test_launcher_e2e.py` to the container-marked cases named in the paragraph opening "The `container`-marked cases". Say its second case is unmarked and runs in `test`. Note that both need `git`, `jq` and `npm run build`'s `cli/dist`.
- [ ] `docs/remote-execution.md` → **Retrieval.**: add that a job restores and provisions only the TypeScript backend. A job installs no Python package, fetches no Python weights and starts no Postgres. So with `docs.retrievalBackend: "python"` the launcher exits `3` in a job, the session has no `harness-docs` server, and the run proceeds without `search_docs`. The Python backend is a local-machine option, and remote jobs need the default. Also, `ARCHITECTURE.md` → the **[shipped]** paragraph opening "This repository **authors one MCP server**": "versioned with the CLI package" becomes the default TypeScript runtime versioned with the CLI package, or, when `docs.retrievalBackend` selects it, the opt-in Python package in `docs-retrieval-service/` answering under the same name, tool and permission string.

**Verification:**

- `git grep -n "Nothing in this repository selects this backend\|Selecting this backend has to settle\|self-check in this repository" -- docs-retrieval-service/README.md` prints nothing.
- Every heading cited resolves: `docs/retrieval.md` → `## Turning on the Python backend` and `docs/config.md` §5's `docs.retrievalBackend` row.
- `ARCHITECTURE.md` and `docs/remote-execution.md` change in those two paragraphs only: `git diff --stat dev...HEAD -- ARCHITECTURE.md docs/remote-execution.md` shows small line counts, read against the two paragraphs.
