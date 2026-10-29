### 1. The prose fallback stops in a linked worktree, because F2's `Read` there answers `ENOTDIR` and the module treats every answer other than "does not exist" as a stop

**File:** `plugin/instructions/main_repo_resolution.md` → `## The fallback`, the **Reading a file.** paragraph — "A `Read` answer that the file does not exist means the file is absent."

The task prompt's goal 1 and its constraint *"Today's answer is unchanged in the main checkout and in a linked worktree"* require that a linked worktree keep resolving `<MAIN_REPO>` to its main checkout. Step F2 reads `<copy>/.git/objects/info/alternates` with the `Read` tool and takes the `git worktree list --porcelain` answer only when that file "does not exist". In a linked worktree, `<copy>/.git` is a pointer **file**, not a directory. So the read fails with a not-a-directory error rather than a missing-file answer. This was observed in this review: a `Read` of `<repo>/cli/package.json/objects/info/alternates`, a path whose parent is a regular file, returned `ENOTDIR: not a directory, open '…'`, not "File does not exist".

The **Reading a file.** paragraph then applies: *"A file the `Read` tool cannot read for any other reason — refused, denied, a directory, an error — is a stop, never an absence."* An agent that follows the module to the letter in a linked worktree writes `cannot resolve the main checkout — F2 failed reading …` and stops. Today's answer was the main checkout. Every pointer site inherits this regression: `branch-status`, `branch-answer`, `branch-pause`, `branch-resume`, `branch-prompt`, `branch-user-review`, the kill-switch checks and the committer's `<MAIN_REPO>` row, all in any session without `HARNESS_MAIN_REPO` running in a linked worktree.

The shell halves do not have this defect. `hc_main_root_var` takes the clone arm only when `[ -d "$gd" ]`, and the fence tests `[ ! -e "$f" ]`, which is true on `ENOTDIR`. Only the prose diverges, and `cli/test/main-root-fallback.test.mjs` says explicitly that the prose is not covered.

**Fix:** in `plugin/instructions/main_repo_resolution.md`, replace the whole **Reading a file.** paragraph with:

```markdown
**Reading a file.** A `Read` answer that the file does not exist means the file is absent, and so does an `ENOTDIR` / "not a directory" answer — which is what F2's read returns in a linked worktree, whose `<copy>/.git` is a pointer file. A file the `Read` tool cannot read for any other reason — refused, denied, a directory, any other error — is a stop, never an absence.
```

No other step changes meaning:

- F4 still requires `<candidate>/.git/HEAD` to *read*, so a candidate whose `.git` is a file still stops there.
- F6's registry read still stops when the registry is absent.

The corpus check `cli/test/main-repo-resolution-corpus.test.mjs` does not match this paragraph's text, and the edit leaves the `## The fallback` heading and the `## Who may cite this` roster untouched.
