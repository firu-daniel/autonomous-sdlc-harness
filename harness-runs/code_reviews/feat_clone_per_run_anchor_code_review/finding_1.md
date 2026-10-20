### 1. The suite-isolation source guard passes a whole file once that file names the anchor anywhere, so an unblanked `process.env` spread added beside a blanked one goes unnoticed

**File:** `cli/test/main-anchor-isolation.test.mjs` (the test `'every test source that spreads process.env names the anchor blank'`) — "return text.includes('...process.env') && !/ISOLATED_ENV|MAIN_REPO_ANCHOR_VARIABLE/.test(text);"

**Problem.** Task prompt goal 5 and the story's second top risk depend on every child environment a suite builds from `process.env` blanking `HARNESS_MAIN_REPO`. Without the blank, a gate run inside a watcher-launched session hands the real main checkout to a QA-lock helper or a plugin reader. This test is the only thing that enforces the blank at each spread, but it checks the **file** and not the **spread**. A file passes as soon as `ISOLATED_ENV` or `MAIN_REPO_ANCHOR_VARIABLE` appears anywhere in it. After this branch, every file that spreads `process.env` (`outer-loop-scripts.test.mjs`, `workflow-templates.test.mjs`, `daemon.test.mjs`, `docs-retrieval.test.mjs`, `watcher-remote-job.test.mjs`, `watcher-remote-park-sequence.test.mjs`, `helpers/fixture.mjs`) already imports the constant. So a new `env: { ...process.env, X: y }` added to any of them passes the guard with no blank. `docs/cli.md` → `## 10. How this is tested`, bullet **The main-checkout anchor is blanked.**, says the file "source-guards every suite's environment spread". That is true only if the check works per spread.

**Fix.** Replace the body of that test so it checks each `...process.env` occurrence. Look at the text from the spread up to the first `}` after it, which is the rest of the object literal on every current site, and require the blank, or the `ISOLATED_ENV` spread, inside that window. Spell the needle so that this file's own source does not contain it literally. Otherwise the test's own code becomes a site it then fails on.

```js
/**
 * Every environment a suite builds from `process.env` must blank the anchor **in the same object**:
 * the shared runners' `ISOLATED_ENV` does not reach a spread written outside them, and one blanked
 * spread in a file says nothing about the next one.
 */
test('every process.env spread in a test source blanks the anchor in the same object', () => {
  const root = import.meta.dirname;
  const spread = ['...process', 'env'].join('.');
  const sources = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((p) => p.endsWith('.mjs'));
  const unguarded = [];
  for (const p of sources) {
    const text = readFileSync(join(root, p), 'utf8');
    for (let at = text.indexOf(spread); at !== -1; at = text.indexOf(spread, at + spread.length)) {
      const close = text.indexOf('}', at);
      const object = text.slice(at, close === -1 ? text.length : close);
      if (!/ISOLATED_ENV|MAIN_REPO_ANCHOR_VARIABLE/.test(object)) unguarded.push(`${p}: ${object.split('\n')[0]}`);
    }
  }
  assert.ok(sources.length > 0);
  assert.deepEqual(unguarded, []);
});
```

Every site in the tree today passes this, including `fixture.mjs`'s `{ ...process.env, ...ISOLATED_ENV, ...env }`, the watcher job spawns' `{ ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '', ...j.jobEnv({}) }` (the window ends at the `}` of `({})`, after the blank), and `workflow-templates.test.mjs`'s multi-line objects, where the blank is on the line after the spread. Update the file header's last sentence to match: "the other reads the suite's sources for a `process.env` spread whose object does not blank it." Verify with that one file: `npm test --workspace cli -- test/main-anchor-isolation.test.mjs`, from the repository root.
