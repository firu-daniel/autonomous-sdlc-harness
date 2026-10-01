### Task 14 — Document the key's effect on `init`, `doctor`, the launcher and the `docs` verb in `docs/cli.md` and `docs/watcher.md`

**Goal:** Bring the CLI's reference, `docs/cli.md`, and the outer-loop script table in `docs/watcher.md` level with what Tasks 4, 5 and 7 built:

- `init`'s retrieval setup with the Python backend selected;
- the three `retrieval-python-*` checks and the TypeScript three's not-applicable state;
- `doctor`'s one write outside a temp probe;
- the launcher's routing and exit `3`;
- the `docs` verb always answering from the TypeScript backend;
- the suites that test it.

**Depends on:**

- Task 7. `init` passes `backend: retrievalBackend(effective)` to `setUpRetrieval`, which with `python` still installs the TypeScript runtime and models and adds one note that nothing was provisioned for the Python backend.
- Task 5. `doctor` checks `retrieval-python-dependencies` (`RAG's Python backend resolves`), `retrieval-python-model-cache` (`RAG's Python backend weights are cached`) and `retrieval-python-index` (`the RAG Python backend's index builds`), after the TypeScript three, all graded from one `harness-docs-retrieval self-check --repo <root>`. They pass with `RETRIEVAL_OFF` when retrieval is off and with a not-selected sentence under the TypeScript backend. The TypeScript three pass not applicable under `python`. `retrieval-python-index` refreshes the Python backend's index in its database. The child's database URL is the `.mcp.json` `env` value, else the compose default.
- Task 4. The launcher reads `docs.retrievalBackend` at run time **only when retrieval is on** — `phases.docs` and `docs.retrieval` both `true`, answered by `hr_docs_retrieval_applies` (Task 3), the shell mirror of `retrievalApplies`. With that gate closed it `exec`s the TypeScript runtime's `docs serve` **whatever the key holds**, including `python` or an out-of-enum value, and never exits `1` for the key nor runs `serve-mcp`; this state is reachable because `.mcp.json`'s `harness-docs` entry outlives turning retrieval off. With the gate open it `exec`s `docs serve` for `typescript` or the key absent; for `python` it runs `harness-docs-retrieval serve-mcp --repo <root>` as a child and exits `3` when that backend is selected but cannot serve; and it exits `1` for an out-of-enum value.
- Tasks 2, 3, 4, 6 and 7, whose tests are `cli/test/retrieval-python-backend.test.mjs`, `outer-loop-scripts.test.mjs`, `doctor.test.mjs` and `init.test.mjs`. Task 10's case is `docs-retrieval-service/tests/test_launcher_e2e.py`.

**Where this task stops.** These two files only. The end-to-end turn-on steps are `docs/retrieval.md` → `## Turning on the Python backend` (Task 13), cited and not restated.

### Targets

- `docs/cli.md`
- `docs/watcher.md`

**Work:**

- [ ] `docs/cli.md` → `## 2. \`init\``, the paragraph opening "**Docs retrieval setup is a post-plan step**". Add that with `docs.retrievalBackend` `python` the same two steps run unchanged and one note says nothing was provisioned for the Python backend. Give the reason TypeScript is kept: switching back costs nothing. Give the reason Python is not provisioned: the package is unpublished, its weights are fetched by an operator, and its database is a container `init` does not orchestrate.
- [ ] `docs/cli.md` → `## 7. \`doctor\``:
  - add the three `retrieval-python-*` rows to the check table after the three `retrieval-*` rows;
  - extend the bullet "**The three `retrieval-*` checks come last…**" to the six, with both not-applicable sentences and which selection makes which three not applicable, and why;
  - add one bullet per Python check, in the existing bullets' form: what it grades from `self-check`, its fail remedy, and the database URL rule (`.mcp.json` `env`, else the compose default, never a shell export);
  - in the `retrieval-index` bullet's "so it keeps this section's promise that nothing is written", add the stated exception: `retrieval-python-index` writes into the Python backend's database, the same write its server's first query makes.
- [ ] `docs/cli.md` → `## 10. How this is tested`: add the new suite `retrieval-python-backend.test.mjs`, the launcher and reader cases in `outer-loop-scripts.test.mjs`, the six-check and key-absent cases in `doctor.test.mjs` and the key-absent and key-set `init` cases. Name the container-gated `docs-retrieval-service/tests/test_launcher_e2e.py` and its unmarked exit-`3` case, run by gate 13.
- [ ] `docs/cli.md` → `## 11. \`docs\``:
  - in the paragraph opening "An unknown sub-verb, flag or extra argument is refused", say that `docs index` and `docs search` always answer from the TypeScript backend whatever `docs.retrievalBackend` selects;
  - in `### \`docs serve\``, say that when retrieval is on (`phases.docs` and `docs.retrieval` both `true`) and `docs.retrievalBackend` is `python`, the launcher starts that package's server instead; with retrieval off the launcher starts `docs serve` whatever the key holds. Cite `docs/retrieval.md` → `## Turning on the Python backend`.
- [ ] `docs/watcher.md` → the outer-loop table's `docs-search-server.sh` row: the description becomes "starts the docs-retrieval MCP server for the checkout it sits in: by `exec`ing the machine-shared runtime's `docs serve` by default, or by running `harness-docs-retrieval serve-mcp` when retrieval is on and `docs.retrievalBackend` is `python`; `docs.retrievalBackend` is read only while `phases.docs` and `docs.retrieval` are both true". The exits are `1` when no runtime is installed (naming `init`) or, with retrieval on, when the key holds an unknown value (naming `doctor`), and `3` when the Python backend is selected but cannot serve. The other columns are unchanged.

**Verification:**

- `git grep -n "retrieval-python-" -- docs/cli.md` shows the three ids in the §7 table and bullets, each spelled as Task 5 registers it.
- Every adopter command added sits in a fenced block, one per line (the lessons ledger's fenced-command rule).
- `docs/watcher.md`'s row keeps its four columns, and its `agentInvocable` column still reads `no`.

**Deviations from plan:**

- `docs/cli.md` → `## 7. \`doctor\``'s opening "Nothing is repaired and nothing is written" sentence also gained the `retrieval-python-index` exception, so the section's first statement of the no-write promise is not contradicted by the bullet the plan amends.
- The two remedies the Python check bullets name that an adopter runs, `harness-docs-retrieval fetch-models` and `docker compose up -d --wait postgres`, sit in fenced blocks under their bullets (the lessons ledger's fenced-command rule); the install remedy is cited to `docs/retrieval.md` → `## Turning on the Python backend` rather than restated.
- The `self-check` bullet also states that a failure prints the database's host, port and name and never its password, from `cli/src/doctor/checks.ts` → `databaseLocation`.
