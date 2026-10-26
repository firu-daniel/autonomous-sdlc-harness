### 1. The seeded `treeGuards` list omits `watcher-main-anchor.test.mjs`, a fourth test that reads the whole `cli/templates/scripts/` tree as text

**Severity:** Must Fix · **Layer:** general

**Site:** `harness.config.json` → `treeGuards` (the three-entry array Task 8 added). Evidence site: `cli/test/watcher-main-anchor.test.mjs` → `const TEMPLATE_SCRIPTS_DIR`, `async function filesUnder(dir)` and the case `'outside comments, only the watcher names the anchor, once, in its export'`.

**Problem.** The task prompt's Proposal item 5 claims the three seeded guards *"are the only tests under `cli/test/` that walk a repository tree: the others that call `readdir` walk temporary fixtures, or read one fixed file"*. Task 8 (`task_8_plan.md` → **Goal**) repeats that claim and seeds exactly three entries. The claim is false. `cli/test/watcher-main-anchor.test.mjs` contains a whole-tree source guard:

```js
const TEMPLATE_SCRIPTS_DIR = fileURLToPath(new URL('../templates/scripts/', import.meta.url));
…
async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  …
}

test('outside comments, only the watcher names the anchor, once, in its export', async () => {
  const hits = [];
  for (const file of await filesUnder(TEMPLATE_SCRIPTS_DIR)) {
    const lines = (await readFile(file, 'utf8')).split('\n');
    …
      if (line.includes(MAIN_REPO_ANCHOR_VARIABLE)) hits.push(…);
  …
  assert.deepEqual(hits, [
    { file: 'autonomous-watcher.sh', line: `export ${MAIN_REPO_ANCHOR_VARIABLE}="$MAIN_REPO"` },
  ]);
});
```

It reads every file under `cli/templates/scripts/`, recursively and not only `.sh`, as text, and enforces a rule over all of them. That is the defining shape of `## The test-run rule` point 8 (*"a test that reads a tree of repository files as text, rather than one module or one fixed file"*). It is not a fixture walk: `TEMPLATE_SCRIPTS_DIR` is the shipped template tree.

**Runtime symptom, and why it is reachable.** Take a unit that adds or edits any file under `cli/templates/scripts/` and names the anchor variable outside a comment. For example, a new `lib/*.sh` helper that reads the anchor, or a watcher edit that moves the export. That unit does not touch `watcher-main-anchor.test.mjs`. Under point 7, its changed-path set matches only `cli/templates/scripts/**/*.sh` → `shipped-scripts-mktemp.test.mjs`, so the anchor guard is never run. The break first surfaces in the Run gates round, which costs a test-fix-plan, a G.4 unit and another full-suite round. This is the escape the branch exists to prevent (task prompt `## Problem`), on the same anchor rule family as the motivating `feat_run_gates_flake_resilience` incident. None of the committed reviews raised this: the code review checked only that *"the three seeded `covers` globs match the trees their tests actually read"*, not that the list is complete.

**Proof of completeness of the rest.** A grep over `cli/test/*.mjs` and `cli/test/helpers/*.mjs` for `readdir`, `readdirSync`, `globSync`, `git grep` and `ls-files` call sites found no other test that walks a committed repository tree. Every other `readdir` site lists a `mkdtemp` fixture, a marker directory, or a temp copy (`init.test.mjs`, `doctor.test.mjs`, `profile.test.mjs`, `create-worktree.test.mjs`, `state-dir-readme-force.test.mjs`, `helpers/fixture.mjs` → `walk`, `remote-control-mention.test.mjs` → `AGENT_STUB`'s `walk` over the stub's cwd, among others). The three seeded guards plus this one are the complete set.

**Fix.** In `harness.config.json` → `treeGuards`, append a fourth entry after the `retrieval-loading` one, keeping the file's two-space indentation and the existing entries byte-identical:

```json
    {
      "test": "test/watcher-main-anchor.test.mjs",
      "covers": "cli/templates/scripts/**"
    }
```

- `test` is spelled as the single-file command's argument, as the other three are (`npm test --workspace cli -- test/<name>.test.mjs`). `doctor`'s `tree-guards` check resolves it under the `cli` layer path.
- `covers` is `cli/templates/scripts/**` and not `…/**/*.sh`, because `filesUnder` reads every file in the tree regardless of extension.

Change no other file. This fix edits no test file and its changed path, `harness.config.json`, matches no `covers` glob, so it runs no test. The full suite runs in the Run gates phase.
