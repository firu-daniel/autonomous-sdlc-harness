### Task 14 — Name the `docs` verb and the launcher in `cli/README.md`, and the verb in the package description

**Goal:** The package's own README and its npm description list the CLI's verbs, and after this branch there are five. Bring both in line with `SUBCOMMANDS`, and state that retrieval is opt-in and not yet measured. The README also lists the outer-loop shell assets `init` copies into `scriptsDir`, and after this branch that family has one more member, so name it there too.

**Depends on:**

- **Task 6**, which adds `DOCS_COMMAND` (`name: 'docs'`) to `SUBCOMMANDS` in `cli/src/commands/registry.ts`. Tasks 7, 8 and 12 give it the sub-verbs `index`, `search`, `serve` and `fetch-models`. This task describes those and changes none of them.
- **Task 9**, which adds the `OUTER_LOOP_SCRIPTS` row for `docs-search-server.sh` (`DOCS_SEARCH_SERVER_SCRIPT_NAME`, `agentInvocable: false`, mode `0755`, always written) and its template at `cli/templates/scripts/docs-search-server.sh`: started by the agent runner from `.mcp.json` when `docs.retrieval` is on, it `exec`s the machine-shared runtime's `docs serve`.

### Targets

- `cli/README.md` — the opening sentence *"the harness's **outer loop** — `init`, `doctor`, `config` and `daemon`"*; the paragraph headed *"**What the four subcommands do.**"*; and the templates paragraph's outer-loop list *"the run watcher, its restart wrapper, the notifier and its stream formatter, the commit / push / branch-refresh / worktree / cleanup wrappers and the library they share"* (story index `## Scope register` row 42).
- `cli/package.json` — `description`.

**Work:**

- [ ] `cli/README.md` opening: name `docs` as the fifth verb, keeping the sentence's structure. The outer loop stays `init`, `doctor`, `config` and `daemon`. `docs` is added as *the opt-in docs-retrieval search over the docs catalog and conventions documents*, because it is not part of the loop.
- [ ] `cli/README.md` → *"What the four subcommands do."*: rename it *"What the five subcommands do."* and add two sentences. `docs` builds and queries a local search index over `docs.root` and the conventions documents, and serves it over stdio MCP as `search_docs` when `docs.retrieval` is on. It is **off by default, and not yet measured** against index-first navigation. Point to `docs/cli.md` for the verb and `docs/retrieval.md` for the design. Any command an adopter is meant to run goes in a fenced block, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*).
- [ ] `cli/README.md`, the templates paragraph (*"Two families live there: …"*): add the launcher to the outer-loop list, so it reads *"…the commit / push / branch-refresh / worktree / cleanup wrappers, the docs-retrieval server launcher and the library they share…"*. Keep the rest of the paragraph, including *"because each reads `harness.config.json` at run time"*, which holds for the launcher too (it resolves the repository root and the cache directory at run time).
- [ ] `cli/package.json` → `description`: `The outer loop of the autonomous SDLC harness: init, doctor, config and daemon management for the harness Claude Code plugin, plus opt-in local docs retrieval.` Change no other key: the peer dependencies are the ones already declared.

**Verification:**

- `git grep -n -i -E "four (commands|verbs|subcommands)" -- cli/README.md cli/package.json` is empty.
- `grep -n "docs-retrieval server launcher" cli/README.md` returns the templates paragraph's line.
- `node cli/dist/cli.js --help` lists five commands, and every verb it lists is named in `cli/README.md`.
- `bash scripts/test.sh` exits zero. The `--version` gate and `retrieval-loading.test.mjs` case (c) both read `cli/package.json`, and neither depends on `description`.
