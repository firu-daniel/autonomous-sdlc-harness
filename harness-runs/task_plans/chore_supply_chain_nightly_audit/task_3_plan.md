### Task 3 — Refresh `package-lock.json` for the SDK floor and the transitive `sharp` / `fast-uri` advisories

**Goal:** Bring the workspace lock back in sync with Task 1's `@modelcontextprotocol/sdk` floor, and move the transitive packages that have an in-range fix past their advisories: `sharp` past GHSA-wq5f-xc86-pv6w (`< 0.35.5`), and `fast-uri` past its six advisories (`3.0.0 - 3.1.7`). That leaves only the advisories whose fix is to remove a dependency, which Tasks 4 and 5 own.

**Depends on:** Task 1, which sets `cli/package.json` → `peerDependencies` and `devDependencies` `"@modelcontextprotocol/sdk": "^1.31.0"`. Until this task lands, `npm ci` refuses the tree, because the lock's `1.30.0` does not satisfy that range. This is the first `general` task for exactly that reason.

**Where this task stops.** It changes `package-lock.json` alone. It does not touch the root `package.json` → `devDependencies` (`ajv-cli`, `js-yaml`); **Task 4** removes `ajv-cli` and **Task 5** moves `js-yaml`. It never runs `npm audit fix --force`: that "fix" installs `ajv-cli@0.6.0`, a downgrade. `@huggingface/transformers` must stay at **4.3.0**. `cli/src/retrieval/models.ts` → `MODEL_FILES` documents paths read off 4.3.0, and 4.3.0 already admits `sharp ^0.35.4`. If the refresh moves it, stop and report a blocker rather than re-verify those paths here.

### Targets

- `package-lock.json` (workspace root).

**Work:**

- [ ] From the repository root, run `npm install` once to resync the lock with `^1.31.0`, then `npm audit fix` (never `--force`). Both are plain foreground commands.
- [ ] Confirm the manifests are untouched: `git diff --stat` lists `package-lock.json` alone. If either `package.json` changed, restore it and report what changed it.

**Verification:**

- `npm ls @modelcontextprotocol/sdk sharp fast-uri @huggingface/transformers` shows `@modelcontextprotocol/sdk` at `1.31.0` or later, `sharp` at `0.35.5` or later, `fast-uri` at `3.1.8` or later, and `@huggingface/transformers` at exactly `4.3.0`.
- `npm audit` (full tree, no `--omit`). Every advisory it still lists must sit on a path through root `ajv-cli` (`fast-json-patch`, `ajv-cli`, and `brace-expansion` under `glob` → `minimatch`) or through root `js-yaml` 3 (`js-yaml`, `argparse`, `sprintf-js`). None may name `@modelcontextprotocol/sdk`, `sharp` or `fast-uri`. Tasks 4 and 5 remove what remains. Record the summary line in this task's return.
- `npm ci --ignore-scripts --dry-run` exits 0. The lock is back in sync with both manifests.
