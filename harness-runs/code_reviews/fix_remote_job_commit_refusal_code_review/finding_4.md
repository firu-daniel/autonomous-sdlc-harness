### 4. The replay's precondition names `git --version` only when the key list differs, not when the replayed commands themselves fail

**File:** `cli/test/setup-worktree-checkout-sparse.test.mjs` (`fixture` → `checkoutCommands`) — "await runGit(main, ['config', '--local', '--unset-all', 'extensions.worktreeConfig']);"

**The problem.** The story index's third top risk says Task 2 "asserts the replay's precondition, naming `git --version` on failure". Case (a) reads the version only after `f.checkoutCommands()` has returned, and puts it only in the message of the key-list assertion.

Now suppose a host's `git sparse-checkout disable` does not turn `extensions.worktreeConfig` on, or the host has no `sparse-checkout` subcommand. `runGit` then throws from inside `checkoutCommands`, for example on the `--unset-all` call's exit 5. The failure reads `fixture setup: \`git config --local --unset-all extensions.worktreeConfig\` exited 5`, with no version. That is the host-git mismatch the risk entry exists to diagnose.

Cases (b) and both (d) cases call `checkoutCommands` with no version at all.

**Fix.** Put the version into the helper itself, so every case that replays the commands names it. In `fixture`, replace the `checkoutCommands` property with:

```js
    checkoutCommands: async () => {
      const version = (await runGit('/', ['--version'])).stdout.trim();
      try {
        await runGit(main, ['sparse-checkout', 'disable']);
        await runGit(main, ['config', '--local', '--unset-all', 'extensions.worktreeConfig']);
      } catch (error) {
        throw new Error(`actions/checkout's two commands could not be replayed under ${version}: ${error.message}`);
      }
    },
```

Leave case (a)'s own `version` read and its assertion message as they are. Run only this file: `npm test --workspace cli -- test/setup-worktree-checkout-sparse.test.mjs`.
