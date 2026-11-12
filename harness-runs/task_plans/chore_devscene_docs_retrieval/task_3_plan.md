### Task 3 — Move the CLI test suites and the sandbox-probe fixtures to the new names

**Goal:** Every `cli/test/` suite that states a retrieval name literally must state the new one. Those suites are the contract's independent statement, so they still grade the compiled CLI against it after Tasks 1 and 2. The sandbox-probe judge's suite and its two recorded-stream fixtures carry the tool name in step with each other.

**Depends on:** Task 1 and Task 2. The literals these suites assert (convention: assert the contract literally, never import it back from what produced it) are:

- server `devscene-docs`;
- tool permission `mcp__devscene-docs__search_docs`;
- console script `devscene-docs-retrieval`;
- `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`;
- default URL `postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval`;
- `DEVSCENE_RETRIEVAL_STUB`;
- `DEVSCENE_RETRIEVAL_LOG`.

The Python package Task 5 creates is named `devscene_docs_retrieval` (module) / `devscene-docs-retrieval` (command). These suites only fake it and never import it.

**Where this task stops.** It changes no `cli/src` or `cli/templates` file. `cli/test/outer-loop-scripts.test.mjs` belongs to Task 2. The `harness-…` `mkdtemp` prefixes and the `harness-fixture-…` names are outside the rename table and stay.

### Targets

- `cli/test/init.test.mjs`
- `cli/test/profile.test.mjs`
- `cli/test/doctor.test.mjs`
- `cli/test/docs-retrieval.test.mjs`
- `cli/test/helpers/fixture.mjs`
- `cli/test/sandbox-probe-judge.test.mjs`
- `cli/test/fixtures/sandbox-probe/mcp-ok.jsonl`
- `cli/test/fixtures/sandbox-probe/mcp-error.jsonl`

**Work:**

- [ ] **`init.test.mjs` / `profile.test.mjs`.** Make these edits:
  - In both files, set `DOCS_SERVER = 'devscene-docs'`.
  - In `profile.test.mjs`, set `DOCS_TOOL_ENTRY = 'mcp__devscene-docs__search_docs'`.
  - In `init.test.mjs`, change the refusal assertion `/AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB/` to `/DEVSCENE_RETRIEVAL_STUB/`.
- [ ] **`doctor.test.mjs`, the Python-backend block.** Make these edits:
  - Set `COMPOSE_DEFAULT_DATABASE_URL` to `'postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval'`.
  - Set `DATABASE_URL_VARIABLE` to `'DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL'`.
  - Change the password-leak assertion `':harness@'` to `':devscene@'`.
  - Rename the fake command written to `bin` and its `LAUNCHER_PATH_FALLBACKS` lookup (`REAL_PYTHON_COMMAND`) to `devscene-docs-retrieval`.
  - Change the faked self-check line `'ok   packages: harness_docs_retrieval and its models extra import'` to `devscene_docs_retrieval`, in all three occurrences.
  - Change the `.mcp.json` server key in `writeMcpEnv`'s `mcpServers` to `'devscene-docs'`.
  - Change the remedy assertion `'harness-docs-retrieval fetch-models'` to `'devscene-docs-retrieval fetch-models'`.
  - Rename the remaining comments and subtest titles that name the old command or server.
- [ ] **`docs-retrieval.test.mjs` / `helpers/fixture.mjs`.** In `docs-retrieval.test.mjs`, set `LOG_ENV = 'DEVSCENE_RETRIEVAL_LOG'` and change the stub key in the `indexOk` env to `DEVSCENE_RETRIEVAL_STUB`. In `helpers/fixture.mjs`, change the env object's stub key to `DEVSCENE_RETRIEVAL_STUB`, keeping its value `'hash-v1'`.
- [ ] **The sandbox-probe judge.** In `sandbox-probe-judge.test.mjs`, set `MCP_TOOL = 'mcp__devscene-docs__search_docs'`. In `fixtures/sandbox-probe/mcp-ok.jsonl` and `mcp-error.jsonl`, change the `tool_use` `"name"` to `"mcp__devscene-docs__search_docs"`. These two fixtures are synthetic probe streams, not recorded-release fixtures. The judge matches the tool name it is passed against the stream, so the constant and both fixtures change together. Task 8 makes the same rename in the probe that passes the name (`scripts/lib/sandbox-probe/legs-local.sh`).

**Verification:**

- Each test file this task edits passes, run one at a time:
  - `npm test --workspace cli -- test/init.test.mjs`
  - `npm test --workspace cli -- test/profile.test.mjs`
  - `npm test --workspace cli -- test/doctor.test.mjs`
  - `npm test --workspace cli -- test/docs-retrieval.test.mjs`
  - `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs`

  `init.test.mjs` and `profile.test.mjs` exercise the server-name wire end to end through `init` against a throwaway fixture: the template key, `repoRoot.ts`'s check and the generated `enabledMcpjsonServers` / `allow` entries. That is the story index's first `Top risks:` guard.
- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|:harness@' -- cli/test` returns no hits.
