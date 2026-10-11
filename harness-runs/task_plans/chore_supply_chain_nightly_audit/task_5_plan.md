### Task 5 — Move the root `js-yaml` to 4.x and switch `scripts/check-rendered-workflows.mjs` to `yaml.load`

**Goal:** Clear the last two advisory chains in the workspace: `js-yaml` 3's merge-key CPU advisory (GHSA-2883-xcg3-v3hh) and its `argparse` 1 → `sprintf-js` dependency (GHSA-hp3w-g68c-fv3c, no patched `sprintf-js` exists). Do it by moving the root `devDependency` to `js-yaml ^4.3.2`, which is the patched 4.x (`gh api /advisories/GHSA-2883-xcg3-v3hh`: `>= 4.0.0, < 4.3.2`) and depends on `argparse ^2.0.1`, which carries no `sprintf-js`.

**Depends on:** Task 4, which removes `ajv-cli`, the other holder of `js-yaml ^3`. Until then a root bump would leave a nested `js-yaml` 3 and the `sprintf-js` chain in place. Task 4 also last rewrote `package.json` and `package-lock.json`, which this task edits after it.

**Why the 4.x line and not `latest` (5.x).** `js-yaml` 4 is the smallest move that clears both advisories. Its only incompatibility that reaches this tree is that `safeLoad` was removed and `load` became safe by default (the default schema, with no JS types), which is exactly the parse 14a and 14b graded under 3.x. A 5.x move is a larger API change and buys nothing this branch needs.

**Where this task stops.** It changes the YAML parse call and its dependency, nothing else in `scripts/check-rendered-workflows.mjs`. **Task 8** adds the online zizmor mode to the same file after this task, and the file's header line about the online audit is Task 8's to rewrite. The `docs/development.md` gate-14 sentence that names `js-yaml` as "already in the lockfile through `ajv-cli`" is **Task 11**'s.

### Targets

- `package.json` (workspace root) — `devDependencies["js-yaml"]`.
- `package-lock.json` (workspace root) — refreshed by the install.
- `scripts/check-rendered-workflows.mjs` — `parseError`.

**Work:**

- [ ] `package.json` → `devDependencies`: `"js-yaml": "^3.14.0"` → `"js-yaml": "^4.3.2"`. Run `npm install` from the repository root, and confirm `git diff --stat` lists `package.json`, `package-lock.json` and this script only.
- [ ] `scripts/check-rendered-workflows.mjs` → `parseError`: `yaml.safeLoad(readFileSync(path, 'utf8'), { filename: path })` → `yaml.load(readFileSync(path, 'utf8'), { filename: path })`. Add a one-line comment saying why `load` is the safe parse in 4.x. Also amend the comment above the `createRequire` line so it says `js-yaml` is a direct root `devDependency` at 4.x.

**Verification:** run each command from the repository root, without a pipe.

- `node --check scripts/check-rendered-workflows.mjs` exits 0.
- `node -e "require('js-yaml').load(require('fs').readFileSync('cli/templates/github/workflows/harness-run.yml','utf8'))"` exits 0. A shipped template still parses under 4.x `load`.
- `node -e "require('js-yaml').load(require('fs').readFileSync('cli/test/fixtures/harness-control-0.6.1.yml','utf8'))"` exits non-zero with a YAML error. The 0.6.1 fixture is still refused by the same parse, which is 14b's property.
- `npm ls js-yaml argparse sprintf-js` shows `js-yaml` at 4.3.2 or later, `argparse` at 2.x, and no `sprintf-js`.
- `npm audit` prints `found 0 vulnerabilities`, and `npm audit --audit-level=moderate` exits 0. Record both lines in this task's return.
- Gates 14a and 14b, which run this script, are graded at Phase G.
