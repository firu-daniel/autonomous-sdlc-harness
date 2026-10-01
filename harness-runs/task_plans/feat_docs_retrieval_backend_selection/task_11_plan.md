### Task 11 — Document `docs.retrievalBackend` and the connection-string decision in `docs/config.md` §5

**Goal:** Complete the key's four-place contract with its `docs/config.md` → `## 5. Key reference` row, and record there, as the task prompt orders, where the Python backend's connection string comes from and why: a default that matches the compose file, overridden per repository through `.mcp.json`, and no second key.

**Depends on:**

- Task 8, whose schema property is `docs.retrievalBackend`: `"typescript" | "python"`, default `"typescript"`, read only while `phases.docs` and `docs.retrieval` are both true.
- Task 1, which grades an out-of-set value an **error** and a legal value with retrieval off a **warning**: `docs.retrievalBackend is set but docs retrieval is off …`.
- Task 4, whose launcher exports `HARNESS_DOCS_RETRIEVAL_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/docs_retrieval` only when the server's environment carries no non-empty value.
- Task 5, whose `doctor` gives the Python checks the `.mcp.json` `harness-docs` entry's `env` value, else that default, and never a shell export.

**Where this task stops.** Only `docs/config.md`. The end-to-end turn-on steps, the database-per-repository scope and the recovery decision are `docs/retrieval.md`'s (Task 13), and this row cites them rather than restating them.

### Targets

- `docs/config.md`

**Work:**

- [ ] Add a `docs.retrievalBackend` row directly under `docs.retrieval`: type `"typescript"` \| `"python"`, default `typescript`. Its Meaning says:
  - which backend the `harness-docs` launcher starts and `doctor` grades;
  - read only while `phases.docs` and `docs.retrieval` are both true, with any other state graded a warning by `config` and `doctor` and selecting nothing;
  - absent means the TypeScript backend, exactly as before the key existed;
  - `python` selects the opt-in Postgres-backed service, which `init` does not provision;
  - it is set with `config set`, whose command sits in the section named next, and needs no `init --force`, because `.mcp.json` and the permission profile are the same for both backends;
  - how to turn it on end to end is `docs/retrieval.md` → `## Turning on the Python backend`.
- [ ] In the same row, the **connection-string decision**, stated as a decision with its reasons:
  - the launcher defaults the URL to the compose file's loopback database, `postgresql://harness:harness@127.0.0.1:5432/docs_retrieval`, whose credentials are throwaway local values;
  - an operator whose Postgres is elsewhere sets `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` in the `harness-docs` server's `env` object in `.mcp.json`. The route is cited from `docs/retrieval.md` → **How the variable reaches the server, since an export does not.** rather than restated.
  - That file is committed, so the URL carries **no password**, and libpq reads one from `~/.pgpass`.
  - **No `docs.*` connection key**, for three reasons: `harness.config.json` is committed and shared across machines while where Postgres runs is per machine; a credential must never be committed; and an exported shell variable never reaches the server.
  - `doctor` reads the URL the same way, so the check and the server agree.
- [ ] The row inlines **no** command an adopter is meant to run (the lessons ledger's fenced-command rule). The `config set` command and every other turn-on command sit fenced, one per line, in `docs/retrieval.md` → `## Turning on the Python backend` (Task 13), and the row sends the reader there. That is how the `docs.retrieval` row already sends readers to `docs/cli.md` §2 for its block.
**Verification:**

- The row's type and default equal the schema property Task 8 adds, read side by side.
- The heading the row cites that exists at this task's commit resolves: `docs/retrieval.md` → **How the variable reaches the server, since an export does not.**
- **Forward reference, not checked here.** The row's link to `docs/retrieval.md` → `## Turning on the Python backend` points at a heading Task 13 creates, two entries later, so it does not resolve at this task's commit and this task does not check it. Task 13's and Task 15's Verification check that it resolves once the heading exists.
- The row names no password and no figure.
