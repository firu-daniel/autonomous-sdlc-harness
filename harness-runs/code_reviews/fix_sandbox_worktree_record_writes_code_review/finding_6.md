### 6. A commit that landed, but whose index sync failed, is reported as "refusing to commit"

**File:** `cli/templates/scripts/commit-on-branch.sh` (the final `case "$status" in`) — the `*)` arm: `echo "commit-on-branch.sh: refusing to commit: $HR_COMMIT_REFUSAL" >&2`

`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_commit_paths_var` returns 1 in one case where the commit **did** land: `update-ref` moved `refs/heads/<branch>`, and then the working copy's index could not take the records. `HR_COMMIT_NEW` is set and `HR_COMMIT_REFUSAL` reads "'<branch>' moved to <commit>, but the index of '<top>' could not take the committed paths". The wrapper prints that sentence after "refusing to commit:" and exits 1. The header's exit-code map also lists no exit 1 after which the branch has moved. It says the opposite: "if a commit did NOT land, the caller must NOT proceed as if it did".

A caller reading the line is told nothing landed, when the commit exists and its index is out of step. `plugin/agents/committer.md` step 4 maps the exit to `error:` and reports no `commit_sha:`. The caller is also not told the remedy: re-running the same call returns exit 3 and re-syncs the index, because the wrapper syncs on exit 3.

**Fix:** report the landed commit in the `*)` arm, and record the case in the header.

```bash
  *)
    if [ -n "$HR_COMMIT_NEW" ]; then
      sha="$(main_git rev-parse --short "$HR_COMMIT_NEW")" || sha="$HR_COMMIT_NEW"
      echo "commit-on-branch.sh: committed $sha on $branch, but the index of '$top' could not take the committed paths — the commit stands; the same call again re-syncs the index and exits 3" >&2
    else
      echo "commit-on-branch.sh: refusing to commit: $HR_COMMIT_REFUSAL" >&2
    fi
    exit 1
    ;;
```

In the header's **LOUD-FAILURE CONTRACT** map, append to exit 1's list, after "the branch moving under this script": "/ a commit that landed but whose working copy's index could not take the committed paths — the only exit 1 after which `refs/heads/<branch>` has moved, reported on stderr as `committed <short_sha> on <branch>, but …`". In the paragraph that begins "Every refusal is one stderr line beginning", add that this one exit-1 line is not a refusal and does not begin with that prefix.

Add a case to `cli/test/commit-on-branch-plumbing.test.mjs`: "(m) A commit whose index sync fails is reported as landed".

1. Install the suite's own `racingGit` shim: `racingGit(f, [[join(f.record, 'index.lock'), '']], '*" update-ref "*')`. It creates the record's `index.lock` just before `update-ref`, so the ref moves and the next `update-index` on the record fails.
2. Call `f.commit(['new.txt'], undefined, race.env)`.

Assert:

- exit 1;
- stderr matches `/^commit-on-branch\.sh: committed [0-9a-f]+ on feat_w, but the index of /m`;
- `f.tip()` moved, to a commit whose parent is the old tip.

Then remove the lock and repeat the call without the shim. Assert exit 3, and that `f.wtGit('status', '--porcelain', '--', 'new.txt')` is empty.

That test file is the one this fix edits, so it is the only test the fix runs: `npm test --workspace cli -- test/commit-on-branch-plumbing.test.mjs`.
