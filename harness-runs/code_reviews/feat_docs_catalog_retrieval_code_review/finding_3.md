### 3. `docs-search-server.sh` re-spells the repository-root probe the shared library owns

**File:** `cli/templates/scripts/docs-search-server.sh` — `root="$(git -C "$script_dir" rev-parse --show-toplevel)"`

The launcher sources `lib/harness-run-lib.sh` on the line above and then resolves the repository root with its own `git` invocation. Every other outer-loop script in that directory calls the library instead — `autonomous-notify.sh`, `cleanup-merged-worktrees.sh`, `create-worktree.sh`, `commit-on-branch.sh`, `refresh-branch.sh`, `push-branch.sh`, `scratch-run.sh`, `restart-watcher.sh` and `setup-worktree.sh` all take `hr_repo_root "$script_dir"` — and the library's own header states that it is *"the one place every generated outer-loop script resolves the repository it is operating on"*, with `.claude/context/conventions.md` → `### Where a new responsibility goes` making a re-derived shared answer a defect rather than a style choice. This is the branch's only new copy of that answer, which is visible only with the whole branch in view.

There is a behavioural difference beside the duplication. `hr_repo_root` silences git's stderr and returns 1, leaving the caller to name the failure; the inline form lets git's own message through and, under `set -e`, exits with git's status (128) rather than the script's own. The header's exit contract already promises the caller a named diagnostic on stderr, so the library form is what the header describes.

**Fix:** replace the one line with the library call plus the diagnostic the header promises.

```bash
if ! root="$(hr_repo_root "$script_dir")"; then
  echo "docs-search-server: $script_dir is not inside a git repository, so there is no checkout to serve" >&2
  exit 1
fi
```

Then extend the header's `MIRRORS` / exit-contract block so the `1` row covers this arm too — it currently reads *"no runtime entry at the resolved path, or no cache directory to resolve it under; stderr names which"*; make it *"no runtime entry at the resolved path, no cache directory to resolve it under, or no repository at this script's location; stderr names which"*, and drop the trailing *"or to resolve the repository root"* clause from the `N` row, which that arm no longer reaches.

`cli/test/outer-loop-scripts.test.mjs` compares the shipped template byte for byte against what `init` writes, so it stays green on an edit to the template alone; its two behavioural launcher cases (no runtime planted, and the `exec`'d argv) both run inside a git fixture and are unaffected.
