### Task 1 — Raise the `@modelcontextprotocol/sdk` floor above GHSA-6qxp-vccf-f47h in `cli/package.json`

**Goal:** Make sure no version the published package's peer range admits for `@modelcontextprotocol/sdk` falls inside [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h). The affected range is `>= 1.12.0, < 1.31.0`, per `gh api /advisories/GHSA-6qxp-vccf-f47h`, and the first patched release is `1.31.0`. An adopter's `init` installs the peers into the machine-wide runtime against this package's own ranges (`cli/src/retrieval/runtime.ts`, module header), so the range itself is the fix. Updating only the lock would leave `^1.30.0` resolving vulnerable versions for adopters.

**Why the floor rises even though the vulnerable path is unused.** The advisory concerns the SDK's OAuth **client**. This package imports only the server side: `cli/src/retrieval/server.ts` → `SERVER_SPECIFIER` (`@modelcontextprotocol/sdk/server/index.js`), `STDIO_SPECIFIER` (`server/stdio.js`) and `TYPES_SPECIFIER` (`types.js`). The suite and the evals use only `client/index.js` and `client/stdio.js`, with no auth provider, and nothing in the tree imports `client/auth.js`. The floor rises anyway, because the range is what an adopter resolves against. Task 13 records this finding in `docs/development.md`.

**Where this task stops.** It edits `cli/package.json` and nothing else. **The lockfile is not this task's.** `package-lock.json` sits at the workspace root, in the `general` layer, and **Task 3** refreshes it. Until Task 3 lands, `npm ci` refuses the tree, because the lock's `1.30.0` does not satisfy `^1.31.0`. No unit between this task and Task 3 runs `npm ci`, and Phase G runs after every task. Do **not** add a `sharp` entry here. `sharp` is a transitive dependency of `@huggingface/transformers` (`^0.35.4` in 4.3.0), which already admits the patched 0.35.5, so a fresh adopter install resolves the fix with no range change. Task 3 moves the workspace lock.

### Targets

- `cli/package.json` — `peerDependencies` and `devDependencies`, the `@modelcontextprotocol/sdk` entry in each.

**Work:**

- [ ] `peerDependencies["@modelcontextprotocol/sdk"]`: `^1.30.0` → `^1.31.0`.
- [ ] `devDependencies["@modelcontextprotocol/sdk"]`: `^1.30.0` → `^1.31.0`. The two must stay equal: the cross-layer conventions document says the optional retrieval peers are "repeated under `devDependencies` so this workspace's own `npm ci` installs them" (`.claude/context/conventions.md` → `## The stack, in the words the rules below use`, the docs-retrieval carve-out bullet). `peerDependenciesMeta` is unchanged, and so is every other entry.

**Verification:**

- `node -e "const p=require('./cli/package.json');console.log(p.peerDependencies['@modelcontextprotocol/sdk'],p.devDependencies['@modelcontextprotocol/sdk'])"`, run from the repository root, prints `^1.31.0 ^1.31.0`.
- `git diff --stat` lists `cli/package.json` alone, and `git diff cli/package.json` changes exactly those two lines.
- Run `commands.typecheck` (`bash scripts/typecheck.sh`). It compiles against the installed `node_modules`, which this edit does not change.
