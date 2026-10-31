### 2. Gate 4: task-offer fence stricter case expects silence for a `config.worktree` shape the library now accepts

**Site:** `cli/test/task-offer-fence.test.mjs`. There are two places to change:
- the fixture line `await writeFile(join(configWorktreeClone, '.git', 'config.worktree'), '');`, inside `test('the opt-out script in every run-copy layout', …)` (near line 90)
- the file's header paragraph that begins `**The rule these tests exist to enforce:` and its `RED ONCE` bullet `the unregistered clone and the stricter case:` (near lines 6–25)

**Failing test:** `cli/test/task-offer-fence.test.mjs` — `the opt-out script in every run-copy layout` › `bash` › `the accepted stricter case: a registered clone with a config.worktree is silent`, and the same case under `zsh`

**Failure, from the log:**

```
  FAIL  4 npm test (exit 1)
                not ok 7 - the accepted stricter case: a registered clone with a config.worktree is silent
            not ok 1 - bash
                not ok 7 - the accepted stricter case: a registered clone with a config.worktree is silent
            not ok 2 - zsh
        not ok 1223 - the opt-out script in every run-copy layout
        ...
        # fail 5
        npm error path cli
        npm error command sh -c node --test --test-timeout=1800000
```

The log carries the TAP summary lines only, not the assertion diagnostic. Five nodes fail: the case under each shell, the two shell parents and the top-level test.

**Diagnosis:** This failure persists from the base. No earlier round exists, and this branch did not cause it: the branch touches neither `cli/templates/scripts/task-offer-check.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` nor this test file.

At line 166 the case asserts `assertSilent(...)` for `configWorktreeClone`, a registered clone whose `.git/config.worktree` the fixture writes as an **empty** file (line 90). Base commit `66e1e6c5` (`fix: linux sandbox sibling glob trio (#224)`) changed `hr_clone_target_check_var` in `cli/templates/scripts/lib/harness-run-lib.sh`. Its condition 3 (the header comment above the function, and the loop `for name in config.worktree objects/info/http-alternates; do`) now **accepts** a `config.worktree` that is an empty regular file, provided `.git/config` does not turn `extensions.worktreeConfig` on. The function's comment gives the reason: Linux creates that empty file at every session start. That change makes `task-offer-check.sh`'s clone arm accept this fixture, print the main checkout and exit 0, so `assertSilent` fails (`status 0`, non-empty stdout) under both shells. `git log -S'but an empty regular file'` on the library names `66e1e6c5` as the only commit to introduce the accepted shape, and that commit did not update this test.

The library still refuses a `config.worktree` that is non-empty, is a symbolic link or is not a regular file. It also refuses an empty one when `.git/config` turns `extensions.worktreeConfig` on. So "a registered clone with a `config.worktree` is silent" is still a real contract, but for a non-empty file. The fixture has to plant a shape the library refuses. Weakening or deleting the assertion is not the fix.

**Fix** (in `cli/test/task-offer-fence.test.mjs` only):
- [ ] Change the fixture write on line 90 so the file is non-empty, for example `await writeFile(join(configWorktreeClone, '.git', 'config.worktree'), '[core]\n\tbare = false\n');`. Leave the case name, the `assertPrints('registeredClone', …)` precondition and the `assertSilent(...)` assertion unchanged. The library's `-s` test then refuses the file, whatever `extensions.worktreeConfig` holds.
- [ ] Optionally, update the label passed to `assertSilent` on line 166 to `registered clone with a non-empty .git/config.worktree${why}`. It is diagnostic text only.
- [ ] Amend the header to match (`.claude/context/cli.md` → `## What "done" means here`, *"A reviewer holds a change to its module's own header"*):
  - In the rule paragraph, *"a registered clone carrying a `config.worktree`"* becomes *"a registered clone carrying a non-empty `config.worktree`"*, with one clause noting that an empty one is the shape `hr_clone_target_check_var` condition 3 accepts since #224.
  - Leave the `RED ONCE` record as written, because it records a past run. Do not add a new `RED ONCE` claim unless the implementer actually performs that mutation run.
- [ ] Do not change `cli/templates/scripts/task-offer-check.sh`, `scripts/task-offer-check.sh` or `harness-run-lib.sh`. The library's acceptance of the empty file is #224's deliberate contract.

Informational, not part of this fix: the `THE ACCEPTED STRICTER CASE.` comment in `task-offer-check.sh` (both copies) still lists `config.worktree` among the planted files the script refuses and says the fence is silent on a Linux `config.worktree` placeholder. Since #224 that is true only for a non-empty file or one git reads. Correcting it means editing both byte-identical copies (`cli/templates/scripts/` and `scripts/`), and it lies outside this failure.
