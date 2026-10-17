### 3. No test covers `restore` placing the bundle by the trusted `stateDir`

**File:** `cli/test/remote-save-links.test.mjs` (the last case, `(T) save reads the stateDir of the trusted configuration, not the checkout's`) — "test('(T) save reads the stateDir"; and the header's `RED ONCE` list

Goal 3 of the task prompt applies the trusted resolution to `restore` as well: *"`restore` places the bundle by the same value, so it uses the same resolution."* Task 2 implemented it. `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_restore` now calls `hr_remote_state_dir_var "$root"` where it used to call `hr_state_dir "$root"`, and `hr_remote_move_aside` does the same. No case anywhere drives a restore with `HARNESS_GITHUB_DEFAULT_COMMIT` set and a checkout whose `stateDir` differs from the trusted one. If `hr_remote_bundle_restore` went back to `state=$(hr_state_dir "$root")`, every suite would stay green. The next job's restore would then write the previous bundle's clarifications, pause note, walker state, status and planning drafts into a directory the session chose. The branch states this behaviour and documents it in `docs/cli.md` §6 residual 1, item 4, but nothing guards it.

**Fix:** add one case to `cli/test/remote-save-links.test.mjs`, after `(T)`, that drives the library's restore directly. It uses the same `runBash` + `. lib/harness-run-lib.sh` form `saveFixture` already uses for `hr_remote_status_write`:

```js
test('(TR) restore places the bundle under the trusted stateDir, not the checkout\'s', async (t) => {
  const fx = await saveFixture(t);
  const saved = await fx.save();
  assert.equal(saved.status, 0, saved.stderr);
  const bundlePause = readFileSync(join(fx.out, 'PAUSE_PROGRESS.md'));
  for (const args of [['add', 'harness.config.json'], ['commit', '--quiet', '--no-verify', '-m', 'fixture: trusted configuration']]) {
    const ran = await runGit(fx.dir, args);
    assert.equal(ran.status, 0, ran.stderr);
  }
  const commit = (await runGit(fx.dir, ['rev-parse', 'HEAD'])).stdout.trim();

  const configPath = join(fx.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.stateDir = 'planted-state';
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  writeFileSync(join(fx.base, 'PAUSE_PROGRESS.md'), 'stale\n');

  const result = await runBash(fx.dir, ['-c',
    `. ${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh && hr_remote_bundle_restore "$1" "$2" feat_x job`,
    '_', fx.out, fx.dir], { HARNESS_GITHUB_DEFAULT_COMMIT: commit, GITHUB_RUN_ID: '' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(readFileSync(join(fx.base, 'PAUSE_PROGRESS.md')).equals(bundlePause), `PAUSE_PROGRESS.md was not restored under ${STATE_DIR}\n${result.stderr}`);
  assert.equal(existsSync(join(fx.dir, 'planted-state')), false, `restore wrote under the checkout's stateDir\n${result.stderr}`);
});
```

The checkout already holds `clarifications/feat_x/`, so this case also takes `hr_remote_move_aside` through the trusted resolution.

Extend the header in three places:
- Add `(TR)` to the cases each existing `RED ONCE` bullet lists as staying green.
- Add this bullet:
  ```
   * - (M7) `state=$(hr_state_dir "$root")` in place of `hr_remote_bundle_restore`'s
   *   `state=$HR_REMOTE_STATE_DIR` → (TR) fails, `restore wrote under the checkout's stateDir`.
   *   Every other case stays green.
  ```
- Widen the opening rule sentence so it covers the restore too, changing *"and `save` reads the state directory the trusted configuration names."* to *"and `save` reads, and `restore` writes, the state directory the trusted configuration names."*

Apply M7 once, run this file, see `(TR)` fail with that message, then revert. This file is the one the fix edits, so it is the only test the fix runs: `npm test --workspace cli -- test/remote-save-links.test.mjs`.
