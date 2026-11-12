### 2. Put the SB2 clarifications arm's expected paths back in `diff-tree` order under the `devscene` state directory

**Site:** `cli/test/gate12-sandbox-round-plant.test.mjs` → the `ARMS` table, entry `row: 'SB2', arm: 'clarifications'` (around lines 53–60):

```js
paths: ({ stateDir }, branch) => [
  '100644 gate12-sb2-token.txt',
  `120000 ${stateDir}/clarifications/${branch}/gate12-link.md`,
],
```

compared at `assert.deepEqual(await changedPaths(fixture.origin, tip), paths(fixture, branch));` (around line 130).

**Failing test:** `cli/test/gate12-sandbox-round-plant.test.mjs` — subtest `SB2 clarifications` (TAP `not ok 5`) of `plant with no --row pushes one plumbing branch per arm, dispatches and records each, and leaves the checkout alone` (TAP `not ok 416`, failed only because of that subtest: `error: '1 subtest failed'`).

**Failure, as the log reports it:**

```
not ok 5 - SB2 clarifications
  location: 'cli/test/gate12-sandbox-round-plant.test.mjs:116:13'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly deep-equal:
    + actual - expected

      [
    +   '120000 devscene/clarifications/gate12_sb2_clarifications_20261112115759/gate12-link.md',
        '100644 gate12-sb2-token.txt',
    -   '120000 devscene/clarifications/gate12_sb2_clarifications_20261112115759/gate12-link.md'
      ]
  stack: |-
    TestContext.<anonymous> (file://cli/test/gate12-sandbox-round-plant.test.mjs:130:14)
...
not ok 416 - plant with no --row pushes one plumbing branch per arm, dispatches and records each, and leaves the checkout alone
  location: 'cli/test/gate12-sandbox-round-plant.test.mjs:101:1'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
```

**Class:** first round — no earlier log to compare against.

**Diagnosis:** the plant itself is correct — both paths are present with the right modes; only their order differs. `changedPaths` returns entries in the order `git diff-tree -r` lists them, which is bytewise path order, and the `ARMS` comment states each arm's list is "path-sorted as `diff-tree` lists them". Task 26 (commit `b9e2b2e2`) changed the fixture's default state directory in `cli/test/helpers/gate12-round.mjs` → `makeGate12Fixture` from `stateDir = 'sdlc-harness'` to `stateDir = 'devscene'`. Under `sdlc-harness/…` the link sorted after `gate12-sb2-token.txt` (`s` > `g`); under `devscene/…` it sorts before it (`d` < `g`). The expected list was not reordered with the rename, so the deep-equal fails on order alone. No case in this file passes a non-default `stateDir` (grep-verified: no `stateDir:` in the file), so every run takes the `devscene` ordering.

**Fix:** in `cli/test/gate12-sandbox-round-plant.test.mjs`, make the clarifications arm's expected list follow `diff-tree`'s path order whatever the state directory is spelled, rather than hard-swapping the two lines:

```js
paths: ({ stateDir }, branch) =>
  ['100644 gate12-sb2-token.txt', `120000 ${stateDir}/clarifications/${branch}/gate12-link.md`]
    .sort((a, b) => {
      const pa = a.slice(a.indexOf(' ') + 1);
      const pb = b.slice(b.indexOf(' ') + 1);
      return pa < pb ? -1 : pa > pb ? 1 : 0;
    }),
```

(Compare on the path part only — a plain `.sort()` would order by the mode prefix, `100644` before `120000`, and reproduce the failure.) A plain reorder that lists the `120000 ${stateDir}/…` line first is an acceptable minimal alternative, but it re-breaks the moment the default state directory sorts after `gate12`; prefer the sort. Keep the `ARMS` comment's "path-sorted as `diff-tree` lists them" true. Do not change `scripts/lib/gate12-sandbox-round/` or the helper's `stateDir` default — the plant output is correct and the `devscene` default is the branch's intended spelling.

- [ ] Make the SB2 clarifications `paths` list sort by path.
- [ ] Leave every other `ARMS` entry unchanged (each lists a single path, or paths whose order no state-directory spelling affects).
