### 1. `cli/templates/scripts/README.md` still says the launcher always `exec`s the TypeScript runtime's `docs serve`

**File:** `cli/templates/scripts/README.md` (the paragraph opening "**The other family in this directory is not generated.**"). The site is its last sentence: "and `exec`s the machine-shared retrieval runtime's `docs serve`."

**Problem.** The sentence says, without qualification, that `docs-search-server.sh` is started by the agent runner "when `docs.retrieval` is on, and `exec`s the machine-shared retrieval runtime's `docs serve`." This branch made that untrue. The launcher (`cli/templates/scripts/docs-search-server.sh`, the `WHICH SERVER.` header paragraph and the `if [ "$backend" = python ]; then` block) now does one of two things:

- with `docs.retrievalBackend` set to `python` and retrieval on, it runs `harness-docs-retrieval serve-mcp --repo <root>` as a child (no `exec`) and exits `3` when that backend cannot serve;
- otherwise it `exec`s `docs serve`, as before.

The reader who gets this wrong is a maintainer working in the template tree. This README is that tree's own map of the outer-loop scripts. Reading it, they conclude the launcher has one route and one exit contract. They would then edit or review the launcher, or the `doctor` checks that grade it, without knowing about the Python branch or exit `3`.

**Why the plan missed it.** The story plan's scope-register derivation entry 1 greps for `docs-search-server` only under `docs README.md ARCHITECTURE.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md docs-retrieval-service/README.md schemas .claude/context`. It never searches `cli/templates/`, so this sentence was never a row. Every other unqualified "execs `docs serve`" description of the launcher was updated in this branch:

- `docs/watcher.md` → the `docs-search-server.sh` row;
- `docs/retrieval.md` → **Launcher and registration.**;
- `docs/cli.md` → `### \`docs serve\``.

**Proof.** `git grep -n 'docs-search-server' -- cli/templates/scripts/README.md` returns this paragraph, and its last sentence reads verbatim: "**One of them is started by neither the watcher nor an agent:** `docs-search-server.sh` is started by the agent runner from `.mcp.json` when `docs.retrieval` is on, and `exec`s the machine-shared retrieval runtime's `docs serve`." This branch does not touch `cli/templates/scripts/README.md`: it is absent from `git diff dev...HEAD --stat`.

**Fix.** In `cli/templates/scripts/README.md`, replace the final sentence of that paragraph with:

> **One of them is started by neither the watcher nor an agent:** `docs-search-server.sh` is started by the agent runner from `.mcp.json` when `docs.retrieval` is on, and starts the backend `docs.retrievalBackend` selects: it `exec`s the machine-shared retrieval runtime's `docs serve` by default, or runs the Python package's `harness-docs-retrieval serve-mcp` when the key is `python` (its header carries the full exit contract).

Change nothing else in the file. No test asserts on this README, so the fix runs no test.
