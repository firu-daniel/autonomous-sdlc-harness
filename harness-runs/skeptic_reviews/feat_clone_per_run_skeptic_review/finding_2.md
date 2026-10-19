### 2. `docs/watcher.md`'s **The pins.** says no call on a clone reads the clone's object store or `.git/config`, though sync-in and sync-out do

**File:** `docs/watcher.md`, `### Where the family runs git in a run's copy, and under what pins`, the **The pins.** paragraph. The sentence is: "On a clone the runners are the same — `git -C <main>` or `GIT_DIR=<main>/.git` — borrowing `<clone>/.git/index` where a worktree's record `index` is borrowed, so no call reads the clone's object store, `.git/config` or hooks;"

**Problem.** The sentence says that no watcher-family call on a clone reads the clone's object store or `.git/config`. That is not true:
- The copy check's sync-in, `hr_copy_sync_in_var` called from `hr_run_copy_check_var`, runs `git-upload-pack` in the clone. That reads the clone's `.git/config`, its refs, and its objects through `objects/info/alternates`.
- Sync-out's `update-ref`, run through `hr_clone_git` after `hr_commit_paths_var` or `hr_run_fast_forward_var`, reads the clone's `.git/config`.

Code-review finding 4 corrected this same omission in two places: the library's THE WATCHER FAMILY'S GIT IN A RUN'S COPY bullet, and `docs/cli.md` residual 1's item 3. It did not reach this third statement.

The reader who gets this wrong is a maintainer weighing what a post-check rewrite of a clone's records can reach, for example on Linux, where `docs/cli.md` residual 1's item 3 says the runtime's refusal is unmeasured. Reading **The pins.**, that maintainer concludes that the watcher family never reads the clone's `.git/config` after the check, and so leaves sync-in's and sync-out's re-reads out of the weighing.

**Fix.** In `docs/watcher.md`, in the **The pins.** paragraph, replace the quoted sentence with:

```text
On a clone the runners are the same — `git -C <main>` or `GIT_DIR=<main>/.git` — borrowing `<clone>/.git/index` where a worktree's record `index` is borrowed, so no runner call reads the clone's object store, `.git/config` or hooks; the two clone-arm rows above are the exceptions: sync-in's fetch runs `git-upload-pack` in the clone, which reads its `.git/config`, refs and objects (through `objects/info/alternates`) under the measured fetch pins, and sync-out's `update-ref` reads its `.git/config`;
```

Leave the rest of the paragraph unchanged. This edits documentation only, so no test runs.
