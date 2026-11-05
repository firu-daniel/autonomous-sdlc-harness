### 1. No case pins commit-on-branch.sh's em-dash refusal spelling in FR3

**File:** `cli/test/gate12-sandbox-round-full-run.test.mjs` (the `FR3:` cases) — "FR3: a commit-on-branch.sh refusal in the final job's Run the harness log is fail quoting that line"

`g12_fr3_arm` (`scripts/lib/gate12-sandbox-round/grade-full-run.sh`) says each wrapper spells a refusal two ways, `<script>: refusing to <verb>: <reason>` and `<script>: <reason> — refusing to <verb>`. It matches a line that carries both `<script>: ` and `refusing to <verb>`. The suite header says *"A wrapper's refusal line in either spelling fails FR3"*. Three of the four wrapper-and-spelling pairs have a case:

- `push-branch.sh`, colon spelling: round 13's replay (`PUSH_REFUSAL`).
- `push-branch.sh`, em-dash spelling: `PUSH_DETACHED`.
- `commit-on-branch.sh`, colon spelling: `COMMIT_REFUSAL`.

No case covers `commit-on-branch.sh`'s em-dash spelling. The commit-side match is a separate `grep -F 'commit-on-branch.sh: ' | grep -F 'refusing to commit'` pipeline. A later edit could narrow it to the colon prefix, and that edit would pass the suite.

**Fix:** extract the shipped line beside the existing extractions, and add one case next to the em-dash push case.

```js
const commitOnBranchText = source(COMMIT_ON_BRANCH);
const [COMMIT_REFUSAL_OPEN] = extract(
  commitOnBranchText,
  /echo "(commit-on-branch\.sh: refusing to commit: )\$HR_WT_CONFIG_REFUSAL" >&2/,
  'commit-on-branch.sh worktree-config refusal',
);
const [COMMIT_DETACHED] = extract(
  commitOnBranchText,
  /echo "(commit-on-branch\.sh: detached HEAD — refusing to commit)" >&2/,
  'commit-on-branch.sh detached HEAD refusal',
);
```

(This replaces the existing `COMMIT_REFUSAL_OPEN` extraction, which currently calls `source(COMMIT_ON_BRANCH)` inline.)

```js
test('FR3: the em-dash commit-on-branch.sh refusal in Run the harness is fail', async (t) => {
  const fixture = await fixtureFor(t);
  await stage(fixture, fullRun({ harnessExtra: [COMMIT_DETACHED] }));
  const { one } = await grade(fixture);
  const fr3 = one('FR3');
  assert.equal(fr3.result, 'fail', JSON.stringify(fr3));
  assert.ok(fr3.evidence.includes(`run ${COMPLETED}: ${COMMIT_DETACHED}`), fr3.evidence);
});
```

In the header's shipped-string list, change the `commit-on-branch.sh` bullet to say that the suite reads both the prefix of its `$HR_WT_CONFIG_REFUSAL` refusal and its detached-HEAD refusal. Verify by running this one file: `npm test --workspace cli -- test/gate12-sandbox-round-full-run.test.mjs`, from the repository root, as one plain foreground command.
