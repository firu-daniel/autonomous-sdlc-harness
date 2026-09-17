### Task 10 — Retrieval wiring in `.mcp.json`, the permission-profile fragment and the ignore block

**Goal:** When retrieval is on, and only then, have `init` do three things. Declare the `harness-docs` server in the adopter's `.mcp.json`. Start it and allow its one tool in the unattended permission profile, the same way the Playwright servers are started and allowed. Ignore the per-checkout index directory. With retrieval off the profile carries neither the enablement nor the tool, which is the profile half of Acceptance 5.

**How the Playwright servers are approved, which this task copies.** `cli/templates/claude/settings.autonomous.qa.json` is a partial profile holding `enabledMcpjsonServers` plus `mcp__<server>__<tool>` entries under `permissions.allow`. `cli/src/generators/permissionProfile.ts` → `renderProfile` merges it through `mergeInto` only when `browserWiringApplies(config)` holds. `assertBrowserWiring` checks enablement against allow entries in both directions. `cli/src/generators/repoRoot.ts` → `assertServersMatchProfile` checks the fragment's started servers against `cli/templates/repo/mcp.json`'s declared ones, again in both directions. An un-started server's tools do not exist, and in print mode that stalls rather than fails.

**Depends on:**

- **Task 1:** `retrievalApplies(config: HarnessConfig): boolean` (`cli/src/config/model.ts`). It is imported by both generators here and never re-spelled.
- **Task 5:** `INDEX_DIR_NAME = 'docs_index'` (`cli/src/retrieval/store.ts`).
- **Task 8:** `DOCS_SERVER_NAME = 'harness-docs'` and `SEARCH_TOOL_PERMISSION = 'mcp__harness-docs__search_docs'` (`cli/src/retrieval/server.ts`).
- **Task 6:** the test helpers `retrievalEnv(cacheHome)` (returns `{ XDG_CACHE_HOME, AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB: 'hash-v1' }`), `plantModelFiles(cacheHome)` and `plantRetrievalRuntime(cacheHome, options?)` (plants the runtime layout `retrievalRuntimeState()` answers `installed: true` for) in `cli/test/helpers/fixture.mjs`.
- **Task 9:** `export const DOCS_SEARCH_SERVER_SCRIPT_NAME = 'docs-search-server.sh'` (`cli/src/generators/outerLoopScripts.ts`), whose doc comment names `repoRoot.ts` → `retrievalWiring` as its second consumer, and the `OUTER_LOOP_SCRIPTS` row built from it. This task imports the constant and never retypes the file name. The server's argument is that script's repo-relative path, derived from `scriptInvocation(scriptsDir: string, file: string): string` (`cli/src/generators/scripts.ts`), so the path has one producer.

### Targets

- `cli/templates/repo/mcp.retrieval.json` (new), `cli/templates/claude/settings.autonomous.retrieval.json` (new), `cli/templates/repo/gitignore.retrieval` (new), and a `{{docsRetrievalIndex}}` token line in `cli/templates/repo/gitignore`.
- `cli/src/generators/repoRoot.ts` and `cli/src/generators/permissionProfile.ts`.
- `cli/src/generators/scripts.ts` — export the existing module-private `invokedPath(invocation: string): string`, unchanged.
- `cli/templates/repo/README.md` and `cli/templates/claude/README.md` — entries for the three new templates.
- `cli/test/init.test.mjs` and `cli/test/profile.test.mjs` — the wiring cases.

**Work:**

- [ ] **The templates.**
  - `mcp.retrieval.json` is `{ "_comment_docs_retrieval": "<why: written only when docs.retrieval is on; the program is the repository's own scripts/docs-search-server.sh, which finds the machine-shared runtime init installed, so nothing is fetched at run time and no machine path is committed>", "mcpServers": { "harness-docs": { "type": "stdio", "command": "bash", "args": ["{{docsSearchServerPath}}"], "env": {} } } }`.
  - `settings.autonomous.retrieval.json` is `{ "_README": ["<why, in the QA fragment's register: enablement STARTS the server, the allow entry lets the one tool run, both are needed, written only when phases.docs AND docs.retrieval are true, a re-run does not rewrite a create-if-absent profile so run init --force after turning retrieval on>"], "enabledMcpjsonServers": ["harness-docs"], "permissions": { "allow": ["mcp__harness-docs__search_docs"] } }`.
  - `gitignore.retrieval` is one comment line (*the docs-retrieval index: a derived per-checkout cache, rebuilt from the Markdown, never committed*) plus `{{docsIndexDir}}`.
- [ ] **`repoRoot.ts`.**
  - Add `retrievalWiring(scriptsDir)`: parse `mcp.retrieval.json` **first**, then substitute `docsSearchServerPath` into the one `args` string, on `permissionProfile.ts`'s parse-then-substitute choice. `docsSearchServerPath` is `invokedPath(scriptInvocation(scriptsDir, DOCS_SEARCH_SERVER_SCRIPT_NAME))`: `DOCS_SEARCH_SERVER_SCRIPT_NAME` is imported from `cli/src/generators/outerLoopScripts.ts` (Task 9), and `scriptInvocation` and `invokedPath` from `cli/src/generators/scripts.ts`, where this task exports the existing `invokedPath` instead of copying it. The string `'docs-search-server.sh'` is never retyped here. Throw `internal()` unless the template's single server key equals `DOCS_SERVER_NAME`.
  - Add `assertRetrievalServersMatchProfile`, the retrieval twin of `assertServersMatchProfile`, run against `settings.autonomous.retrieval.json`'s `enabledMcpjsonServers` in both directions. Generalise the shared helpers by passing the fragment path, and do not copy them.
  - **Enqueue `.mcp.json` once.** When `browserWiringApplies` or `retrievalApplies` holds, build one object: the browser template when that applies, plus the retrieval template's `mcpServers` entry and its `_comment_docs_retrieval` key when this applies. Enqueue it under `merge-json`. Two requests for one path are never enqueued.
  - Render `gitignore.retrieval` into the new `docsRetrievalIndex` token only under `retrievalApplies`, with `docsIndexDir` set to `` `${stateDir}/${INDEX_DIR_NAME}/` ``, and `''` otherwise, on the `gitignoreQa` precedent.
  - **Reword the two "no .mcp.json was written" notes** so neither is false when retrieval wired the file. When retrieval is on and QA is off, the note says no *browser* server was declared. Add `retrievalWired: boolean` to `RepoRootResult`. Extend the header's choice 3 to cover the retrieval half and its predicate.
- [ ] **`permissionProfile.ts`.**
  - Export `RETRIEVAL_TEMPLATE_PATH = 'claude/settings.autonomous.retrieval.json'`.
  - In `renderProfile`, merge that fragment through `mergeInto` when `retrievalApplies(config)` holds, after the QA fragment and before `assertEveryScriptListed`. The two fragments' `enabledMcpjsonServers` lists concatenate de-duplicated.
  - Give `mergeInto` a `fragment` label parameter, so its refusal names the fragment that redeclared a key instead of always saying "interactive-test".
  - Assert, through `internal()`, that the fragment's single allow entry equals `SEARCH_TOOL_PERMISSION`.
  - `assertBrowserWiring` already checks every `mcp__` allow entry against `enabledMcpjsonServers`. Confirm it passes unchanged for a profile holding both halves, and extend its doc comment to say it covers the retrieval half as well.
  - Add a `## The docs-retrieval half is a fragment too` paragraph to the module header.
- [ ] **Tests.**
  - `init.test.mjs`: `init` over a pre-written config with `phases.docs: true, docs: { root: 'docs', retrieval: true }`, `retrievalEnv(cacheHome)`, `plantModelFiles(cacheHome)` and `plantRetrievalRuntime(cacheHome)` from `cli/test/helpers/fixture.mjs` (every retrieval-on case in this task plants both, including the two below) produces a `.mcp.json` whose `mcpServers['harness-docs']` is `{ type: 'stdio', command: 'bash', args: ['scripts/docs-search-server.sh'], env: {} }`. The managed ignore block carries `sdlc-harness/docs_index/`. A second `init` changes neither file.
  - The same `init` with `docs.retrieval` absent writes no `harness-docs` key and no `docs_index` rule. When QA is also off, it writes no `.mcp.json` at all.
  - With both QA (`web-playwright`) and retrieval on, `.mcp.json` declares all three servers. With QA on and a mobile `qa.driver`, and retrieval on, `.mcp.json` declares `harness-docs` alone.
  - `profile.test.mjs`: with retrieval on, `enabledMcpjsonServers` contains `harness-docs` and `permissions.allow` contains `mcp__harness-docs__search_docs`. With `docs.retrieval` off, or `phases.docs` off, the profile contains neither string anywhere.

**Verification:**

- `bash scripts/test.sh` exits zero with the new cases green. The on and off pairs are Acceptance 5's profile half. The allowlist half is Tasks 15–16's.
- `grep -rn "docs-search-server.sh" cli/src` reports only the constant's declaration in `cli/src/generators/outerLoopScripts.ts`, plus any doc-comment or message text. In particular, `cli/src/generators/repoRoot.ts` has no hit that is a string literal.
- Break the retrieval template's server key to `harness-doc` and run `init`: it exits `EXIT.INTERNAL` naming the mismatch. Revert.
- The existing QA-on and QA-off cases in `init.test.mjs`, `profile.test.mjs` and `doctor.test.mjs` pass **without an edit to their expected values**, so the browser half is untouched. The one allowed change is the reworded "no .mcp.json was written" note text, where a case asserts on it.
- **Task 12 will add a setup step** that `init` runs whenever retrieval is on. These cases already set `retrievalEnv(cacheHome)` (stub on, cache in a temp dir) and plant both the model files and the runtime, so that step finds the runtime installed and the models cached, and runs neither `npm` nor a download. Task 12 edits none of them.
- The retrieval-on case with a mobile `qa.driver` (or QA off) writes a `.mcp.json` holding only `harness-docs`: `.mcp.json` is written when `browserWiringApplies` **or** `retrievalApplies` holds, which `docs/cli.md` §3 and §6 restate (Task 19).

**Deviations from plan:**

- Plan asked that a retrieval-off profile contain neither `harness-docs` nor `mcp__harness-docs__search_docs` "anywhere". The base template's `_README` (Task 9) names the bare server in its launcher paragraph, so the test asserts `harness-docs` absent from `enabledMcpjsonServers` and the full tool entry absent from the whole document.
- Plan's `phases.docs off` profile case cannot run through `init`: `config/check.ts` refuses `docs.retrieval: true` without `phases.docs`, so that arm calls `renderProfile` directly with the pair, on the precedent of the file's other direct-render tests.
- `mergeInto`'s new label parameter is named `label`, not `fragment`, because `fragment` is already its second parameter's name.
