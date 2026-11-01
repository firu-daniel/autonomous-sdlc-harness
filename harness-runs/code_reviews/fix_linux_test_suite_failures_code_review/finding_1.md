### 1. The origin-identity probe fails on a host that exports `GIT_AUTHOR_*` / `GIT_COMMITTER_*`

**File:** `cli/test/fixture-isolation.test.mjs` (`test('the origin has its own identity', …)`): "['commit-tree', tree, '-m', 'identity probe']"

The case runs `git commit-tree` in the fixture's bare origin through `runGit`. `runGit` spreads `process.env` under `ISOLATED_ENV` (`cli/test/helpers/fixture.mjs` → `run`: "env: { ...process.env, ...ISOLATED_ENV, ...env }"). `ISOLATED_ENV` isolates git's **configuration** files only, not the identity environment variables. git ranks `GIT_AUTHOR_NAME` / `GIT_AUTHOR_EMAIL` / `GIT_COMMITTER_*` above `user.name` / `user.email` from configuration. On a host whose shell exports those variables, which some developers do, the commit is authored with the host's identity. `assert.match(body, /^author Harness Fixture <fixture@example\.invalid> /m)` then fails, although the origin's configured identity is exactly right. That is a host-dependent failure "for a reason no assertion names", the class this file exists to remove. The neighbouring case `'git never guesses an identity'` already guards against it by unsetting those variables, and `cli/test/clone-trust-check.test.mjs` → `probeCommit` does the same. This case does not.

**Fix:** run the probe through `runBash` with the same `unset` prefix the neighbouring case uses, and assert on its output. Replace the body of `test('the origin has its own identity', …)` after the `origin` line with:

```js
  const result = await runBash(origin, [
    '-c',
    'unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL EMAIL; ' +
      'tree=$(git hash-object -w -t tree /dev/null) && commit=$(git commit-tree "$tree" -m "identity probe") && ' +
      'git cat-file commit "$commit"',
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^author Harness Fixture <fixture@example\.invalid> /m);
```

`runBash` and `runGit` are already imported. `runGit` is still used for the `remote get-url` line. This edits only `cli/test/fixture-isolation.test.mjs`, so that file is the only test the fix runs: `npm test --workspace cli -- test/fixture-isolation.test.mjs`.

**Deviations from plan:** Fix implemented as specified. One extra check could not be executed: re-running `npm test --workspace cli -- test/fixture-isolation.test.mjs` with `GIT_AUTHOR_*` / `GIT_COMMITTER_*` exported, to reproduce the host-identity case, was refused by the permission layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The claim that the case now passes on such a host rests on reading the probe: its `unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL EMAIL` prefix matches the one `'git never guesses an identity'` uses. The plain single-file run passed (`# tests 6`, `# pass 6`, `# fail 0`).
