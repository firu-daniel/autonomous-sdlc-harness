### 2. Wait for the whole placeholder sweep before case (t)'s after-snapshot

**Site:** `cli/test/launch-sandboxed-gates.test.mjs`, the test `'(t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder'`, at the lines `await f.until(() => !present(scriptsGit), \`the sweep of ${scriptsGit}\`);` and `const after = await snapshotTree(f.dir);` (around lines 696–698 as a navigation hint).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder`

**Failure, from the log** (repository paths shown repo-relative):

```
        not ok 458 - (t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder
          ---
          duration_ms: 16747.362791
          location: 'cli/test/launch-sandboxed-gates.test.mjs:671:1'
          failureType: 'testCodeFailure'
          error: "ENOENT: no such file or directory, lstat '/private/tmp/claude-501/harness-fixture-uzGVIl/.gitconfig'"
          code: 'ENOENT'
          stack: |-
            async lstat (node:internal/fs/promises:1025:18)
            async walk (file://cli/test/helpers/fixture.mjs:654:46)
            async snapshotTree (file://cli/test/helpers/fixture.mjs:673:3)
            async TestContext.<anonymous> (file://cli/test/launch-sandboxed-gates.test.mjs:698:17)
```

**Diagnosis:** this is a race in the test, not a fault in the launcher. The failure happens at line 698, the *after* snapshot. `walk` in `cli/test/helpers/fixture.mjs` lists `.gitconfig` with `readdir`, and the file is gone by the time `lstat` runs on it.

1. The fixture's `bwrap` stub (`BWRAP_STUB` in the test file) creates a `--ro-bind /dev/null <p>` placeholder for every absent path in the vector. When it exits, it leaves each placeholder as a 0-byte 0444 file. That covers `scripts/.git` and each absent root-level dotfile from `expectedVector`'s list (`.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile`, `.zshrc`).
2. After `bwrap` exits, the supervisor in `cli/templates/scripts/launch-sandboxed-gates.sh` (the `if [ "$mode" = supervise ]` block) passes the placeholders to `hr_placeholder_sweep_paths_var` (`cli/templates/scripts/lib/harness-run-lib.sh`). That function removes them one by one, in vector order.
3. In that vector, the `denyWrite` entries come first, so `scripts/.git` is swept before the dotfile placeholders. The test waits only for `scriptsGit` to disappear and for `<LABEL>.running` to be removed. `run-test-suite.sh` removes `.running` inside `bwrap`, which is before the sweep starts. Neither wait shows that the sweep has finished.
4. As a result, `snapshotTree(f.dir)` can run while the supervisor is still deleting `.bashrc`/`.gitconfig`/… placeholders, and the snapshot races the `rm`. Under full-suite load (the run took 1900 s) the timing opened up, and the test failed with ENOENT. Had the timing differed slightly, the same race would have shown up as a spurious `changed` entry in the final `assert.deepEqual(outside, [], …)` instead.

**Fix:** in case (t), before `const after = await snapshotTree(f.dir);`, wait until **every** placeholder the stub recorded has been swept, not only `scriptsGit`. For example, replace or follow the `scriptsGit` wait with:

```js
await f.until(() => f.placeholders().every((p) => !present(p)), 'the sweep of every placeholder');
```

Keep the existing `assert.ok(f.placeholders().includes(scriptsGit), …)` assertion and the `.running` wait. Do not weaken the final `outside` assertion, and do not add `.gitconfig` or any other path to `snapshotTree`'s exclusions: the test's contract is that nothing outside the lane changes once the sweep is done. If you update the comment block at the top of the file (the sentence about the supervisor sweeping every placeholder), keep its claim accurate. Change nothing in `launch-sandboxed-gates.sh` or `harness-run-lib.sh`: sweeping in vector order after `bwrap` exits is the intended behaviour.

- [ ] Add the all-placeholders wait before the after-snapshot in case (t).
- [ ] Check whether any other case in this file snapshots or compares the tree after a launched run, and give it the same wait if so (cases (q), (s) and (l) wait only for `bwrap-exited` and take no snapshot).
