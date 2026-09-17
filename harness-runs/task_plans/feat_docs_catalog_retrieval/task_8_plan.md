### Task 8 — `docs serve`: the stdio MCP server exposing `search_docs`

**Goal:** Serve the search over stdio MCP as one read-only tool, `search_docs(query, k)`, on the server named `harness-docs`. The tool's fully qualified name in a `tools:` allowlist or a permission rule is therefore `mcp__harness-docs__search_docs`. Prove Acceptance 4 by starting the server and calling the tool through the MCP SDK's own client.

**Depends on:**

- **Task 6:** `cli/src/commands/docs.ts` (this task adds the `serve` row), `openRetrieval({ repoRoot, config, inMemory })` returning `{ store, embedder, reranker, refresh(), close() }`, and the suite `cli/test/docs-retrieval.test.mjs` with `retrievalEnv(cacheHome)`, `plantModelFiles(cacheHome)`, `writeRetrievalConfig(dir)` and its 3-file, 9-chunk fixture corpus.
- **Task 7:** `searchDocs({ store, embedder, reranker, query, k, mode }): Promise<{ abstained: boolean; hits: readonly SearchHit[] }>`, `renderResults(result): string`, `DEFAULT_RESULTS = 5`, `MAX_RESULTS = 20` and `ABSTAIN_MESSAGE = 'no confident match'` (`cli/src/retrieval/search.ts`).
- **Task 2:** `loadRetrievalModule<T>(specifier: string): Promise<T>`. The SDK subpaths `@modelcontextprotocol/sdk/server/index.js`, `@modelcontextprotocol/sdk/server/stdio.js` and `@modelcontextprotocol/sdk/types.js` load only through it.

**Where this task stops.** The server is started here, but it is **registered** for adopters by Task 10 (`.mcp.json` and the permission-profile fragment), which reads `DOCS_SERVER_NAME` and `SEARCH_TOOL_NAME` from this task's module. It is **launched** by Task 9's script. The agents that call the tool are Tasks 15–16's.

### Targets

- `cli/src/core/report.ts` — header only: the one named exception to the single output surface.
- `cli/src/retrieval/server.ts` (new).
- `cli/src/commands/docs.ts` — the `serve` sub-verb.
- `cli/test/docs-retrieval.test.mjs` — the MCP cases.

**Work:**

- [ ] `report.ts` (header comment only, no code change): after the paragraph that opens *"The CLI's single output surface."* and names the three properties, add **one named exception**. While `docs serve` runs, the process's stdout belongs to the MCP stdio transport started by `cli/src/retrieval/server.ts` → `serveDocs`, and to nothing else. That module is the **one** place in the package where a transport writes to stdout. `Reporter` still carries every narration and warning line of that sub-verb, on stderr only (`warn` / `fail`). `--quiet` and the plain-ASCII guarantee do not apply to the protocol frames, which are JSON-RPC, not output a test diffs. The clause also says that `.claude/context/conventions.md` → `## Output, logging and errors` does not record this exception yet, and that it is raised for a supervised amendment of that document. This mirrors how Task 5 declares the index-write exception in `cli/src/core/writer.ts`'s header.
- [ ] `server.ts`: export `DOCS_SERVER_NAME = 'harness-docs'`, `SEARCH_TOOL_NAME = 'search_docs'` and `SEARCH_TOOL_PERMISSION = 'mcp__harness-docs__search_docs'`, the last built from the first two. The header says these three are a wire. `plugin/agents/*.md` quotes the permission string in ten `tools:` allowlists, and the two CLI templates of Task 10 carry the server name, so renaming one of them edits all of those. It also says the tool's output is document text an agent must treat as untrusted data. For why this module writes to stdout outside `Reporter`, the header points at the `docs serve` exception in `cli/src/core/report.ts`'s header rather than arguing the exception itself.
- [ ] `server.ts`: export `serveDocs(options: { repoRoot: string; config: HarnessConfig; version: string; report: Reporter }): Promise<void>`. Use the SDK's low-level `Server` rather than `McpServer`, so no schema library is imported directly: `zod` is not one of this package's declared peers. Declare `capabilities: { tools: {} }`.
  - **`ListToolsRequestSchema`** returns one tool, `search_docs`, with a description saying it searches the docs catalog and conventions documents and returns `path#heading` navigation hints, not evidence. Its `inputSchema` is `{ type: 'object', properties: { query: { type: 'string', minLength: 1 }, k: { type: 'integer', minimum: 1, maximum: 20 } }, required: ['query'], additionalProperties: false }`, and its annotations are `{ readOnlyHint: true, openWorldHint: false }`.
  - **`CallToolRequestSchema`** validates the arguments by hand. It calls `refresh()` before every query, so a doc edited mid-run is seen, then `searchDocs({ mode: 'fused-rerank', k: k ?? DEFAULT_RESULTS })`. It returns `{ content: [{ type: 'text', text: renderResults(result) }] }`. Bad arguments, an unknown tool name, or a refresh or search throw return `{ isError: true, content: [{ type: 'text', text: <message> }] }` rather than a protocol error, and a refresh failure names `npx autonomous-sdlc-harness doctor`.
  - **Open once.** `openRetrieval` is called once at startup, and the process closes the store on transport close or `SIGTERM`.
- [ ] `docs.ts`: add `docs serve`, which calls `serveDocs`. **Nothing may write to stdout except the transport.** The sub-verb writes no `result` line, sends narration and warnings only to stderr through `report.warn`, and says so in its doc comment. A stray stdout byte corrupts the JSON-RPC stream, and an agent then sees a tool that never loads. A refusal before the transport starts (retrieval off, model files missing) exits non-zero with the message on stderr.
- [ ] `docs-retrieval.test.mjs`: add cases that import `Client` from `@modelcontextprotocol/sdk/client/index.js` and `StdioClientTransport` from `@modelcontextprotocol/sdk/client/stdio.js`. Those are the workspace's dev dependencies; the suite is not the shipped package. Connect with `command: process.execPath`, `args: [CLI_ENTRY, 'docs', 'serve', '--cwd', fixture.dir]` and `env: { ...process.env, ...retrievalEnv(cacheHome) }`.
  - (a) `listTools()` returns exactly one tool, named `search_docs`.
  - (b) `callTool({ name: 'search_docs', arguments: { query: 'work without a network' } })` returns text whose first line starts with `1. docs/guide.md#offline (score `.
  - (c) `arguments: { query: 'quantum chromodynamics lattice' }` returns exactly `no confident match`.
  - (d) `arguments: { query: '' }` returns `isError: true`.
  - (e) Starting `docs serve` with `docs.retrieval` false exits non-zero before the handshake, with the "retrieval is off" message on stderr.

  Close the client in a `finally`, so a failing assertion cannot leave a server process behind.

**Verification:**

- `bash scripts/test.sh` exits zero with cases (a) to (e) green. Cases (b) and (c) are Acceptance 4 verbatim.
- Case (a) passing is the proof that nothing reached stdout ahead of the transport. A stray `console.log` or `report.info` in the serve path fails the handshake there.
- `grep -rn "from 'zod'" cli/src` is empty.
- `grep -n "docs serve\|serveDocs" cli/src/core/report.ts` finds the header clause, and `grep -n "report.ts" cli/src/retrieval/server.ts` finds the header's pointer to it.
- `grep -rn "process.stdout" cli/src` prints no hit outside `cli/src/retrieval/server.ts`.
