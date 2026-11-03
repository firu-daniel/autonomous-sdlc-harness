### 2. `scripts/launch-sandboxed-gates.sh` is committed `100644`

**Severity:** Nice to Have (user observation 2)

**Site:** `scripts/launch-sandboxed-gates.sh`, the whole file's git index mode. The content does not change.

**The problem, verified in the current tree.** `git ls-files -s scripts/launch-sandboxed-gates.sh` prints `100644 69699c05… 0 scripts/launch-sandboxed-gates.sh`, and the working-tree file is `-rw-r--r--`. The file was added in `a515d1f8` (*"fix: Task 7 — Bring root run-test-suite.sh, run lib and launcher level"*). Every other rendered wrapper this repository carries in `scripts/` is `100755`: `autonomous-watcher.sh`, `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`, `run-test-suite.sh`, `remote-run.sh`, `create-worktree.sh`, `setup-worktree.sh`, `scratch-run.sh`, `task-offer-check.sh`, `test.sh`, `typecheck.sh` and the rest.

`cli/templates/scripts/launch-sandboxed-gates.sh` is also `100644`, but every file under `cli/templates/scripts/` is `100644`, because `init` sets the mode when it writes. So the template copy is consistent and stays as it is.

**Fix.** Set the executable bit on the root copy only, in the index and in the working tree:

```bash
git update-index --chmod=+x scripts/launch-sandboxed-gates.sh
chmod +x scripts/launch-sandboxed-gates.sh
```

Afterwards, `git ls-files -s scripts/launch-sandboxed-gates.sh` prints `100755` with the blob id unchanged (`69699c05…`). The commit is a mode change only, `old mode 100644` / `new mode 100755`, with no content diff. Leave `cli/templates/scripts/launch-sandboxed-gates.sh` at `100644`.
