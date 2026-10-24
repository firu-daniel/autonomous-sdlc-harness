### 2. `cleanup-run-copies.test.mjs`'s header lists one uncovered profile line, and leaves out the fail-closed "registry could not be re-read" keep line

**File:** `cli/test/cleanup-run-copies.test.mjs`, the module header, on the sentence that starts "Not covered: the `FAILED to remove run profile` line".

`profile_remove` (`cli/templates/scripts/cleanup-merged-worktrees.sh`) has a fail-closed branch. When `live_runs "$registry"` fails on the re-check, it prints `keep run profile <file> for '<branch>' — the run registry could not be re-read` and keeps the file. That branch is the safety half of the live-run re-check. No case in the suite reaches it. A test can only reach it if the registry turns unreadable after the start-of-sweep read, because that read refuses the whole sweep on the same fault. So the gap is deliberate.

`.claude/context/conventions.md` → `## The testing bar` requires a test file's header to say which documented behaviour it deliberately does not cover, and why. The header names one uncovered line, `FAILED to remove run profile`, and says nothing about this one. A reader therefore takes the re-read failure path to be tested.

**Fix:** in the module header of `cli/test/cleanup-run-copies.test.mjs`, replace

```
 * and `HOME` instead. Not covered: the `FAILED to remove run profile` line, which needs an `rm` that
 * fails on a file the fixture owns.
```

with

```
 * and `HOME` instead. Not covered: the `FAILED to remove run profile` line, which needs an `rm` that
 * fails on a file the fixture owns; and the `keep run profile … — the run registry could not be
 * re-read` line, which needs the registry to turn unreadable between the start-of-sweep read (which
 * refuses the whole sweep on the same fault) and `profile_remove`'s re-check.
```

This is a comment-only edit. Because the fix edits this test file, the one test it runs is `npm test --workspace cli -- test/cleanup-run-copies.test.mjs`, from the repository root, as one plain foreground command.
