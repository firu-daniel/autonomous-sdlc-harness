### 5. `protectedPaths`' doc comment now gives the run registry the `hr_wrapper_main_of` reason that belongs to the configuration file

**File:** `cli/src/generators/writeProtection.ts` (`protectedPaths`, the doc comment beginning "The write-protected set, in a fixed order"): "configuration file, the run registry by its exact path — the clone arm of the wrappers' target check reads which run copy a branch has from it — and a `.git` at each level of the scripts directory — the last two kinds because the wrappers place their main checkout from their own location".

**Problem.** Before this branch the list ended "the main checkout's configuration file, and a `.git` at each level of the scripts directory — the last two kinds because the wrappers place their main checkout from their own location …". "The last two kinds" meant the configuration file and the `.git` levels. Task 12 inserted the run registry between them, so "the last two kinds" now names the registry and the `.git` levels. The `hr_wrapper_main_of` reason is attached to the registry, and the configuration file loses it. A reader of this comment, which is what `doctor` and the module header point at as the one statement of the set, gets the wrong reason for two entries.

**Fix.** Replace that span of the comment, keeping the list in the array's order:

```ts
 * its `commondir`, the linked worktrees' records, the legacy remote definitions, the main checkout's
 * configuration file, the run registry by its exact path, and a `.git` at each level of the scripts
 * directory. The configuration file and the `.git` levels are protected because the wrappers place
 * their main checkout from their own location, as the nearest directory holding a `.git` that is a
 * real directory without a `commondir` (`cli/templates/scripts/lib/harness-run-lib.sh` →
 * `hr_wrapper_main_of`); the run registry because the clone arm of the wrappers' target check reads
 * which run copy a branch has from it.
```

Comment edit only; no test runs.
