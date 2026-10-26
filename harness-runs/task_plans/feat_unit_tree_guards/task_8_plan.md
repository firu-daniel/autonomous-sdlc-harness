### Task 8 — Seed this repository's `harness.config.json` with its three tree guards

**Goal:** This repository's own configuration declares the three tests under `cli/test/` that walk a repository tree, so the unit loop runs them for any unit whose change reaches the files they read (task prompt, Proposal item 5).

**Depends on:** Task 6, whose schema accepts `treeGuards` — an optional array of `{ test, covers }`, both required non-empty strings, declared after `sandbox` — and Task 1, whose shape check accepts the same. `test` is the argument this repository's single-file test command takes (`npm test --workspace cli -- test/<name>.test.mjs`, `.claude/context/conventions.md` → `## The testing bar`), so it is written `test/<name>.test.mjs`, relative to `cli/`; Task 2's `doctor` check resolves it under the `cli` layer path. `covers` is repo-relative.

**Where this layer stops.** One key in one file. No `.claude/` file, conventions document or test changes. This is the catch-all task and ships last: it turns on, for this repository, what Tasks 1–7 built.

### Targets

- `harness.config.json` (repository root) — the `treeGuards` key.

**Work:**

- [ ] Add `treeGuards` after `phases` (the last key the file carries today; the file holds no `sandbox` key, and the schema does not order properties) with exactly these three entries, taken from the task prompt and checked against each test's own tree walk:
  - `{ "test": "test/main-anchor-isolation.test.mjs", "covers": "cli/test/**/*.mjs" }` — its second case reads every `.mjs` under `cli/test/` recursively (`readdirSync(root, { recursive: true })`).
  - `{ "test": "test/shipped-scripts-mktemp.test.mjs", "covers": "cli/templates/scripts/**/*.sh" }` — `shellScripts(SCRIPTS_ROOT)` walks every `.sh` under `cli/templates/scripts/`.
  - `{ "test": "test/retrieval-loading.test.mjs", "covers": "cli/src/**/*.ts" }` — `sourceFiles()` reads every `.ts` under `cli/src/`.
- [ ] Keep the file's existing two-space indentation and key order otherwise byte-identical.

**Verification:**

- `node -e "JSON.parse(require('fs').readFileSync('harness.config.json','utf8'))"` exits zero.
- `ls cli/test/main-anchor-isolation.test.mjs cli/test/shipped-scripts-mktemp.test.mjs cli/test/retrieval-loading.test.mjs` lists all three — the files `doctor`'s `tree-guards` check resolves each `test` to under the `cli` layer path.
- `git ls-files -- 'cli/test/*.mjs' 'cli/templates/scripts/*.sh' 'cli/src/*.ts'` lists at least one file per glob, so no entry covers nothing.
- End-to-end, by walking `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 7 against this file: a changed-path set holding an untracked `cli/test/new-case.test.mjs` selects exactly the `main-anchor-isolation` guard (Acceptance 1); one holding only `docs/config.md` selects none, so that unit runs exactly what it runs today (Acceptance 2); and the selected guard runs as `npm test --workspace cli -- test/main-anchor-isolation.test.mjs`, the same command string a unit already runs for its own test files, so the permission profile is unchanged (Acceptance 3).
