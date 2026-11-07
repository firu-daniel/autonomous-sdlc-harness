### 2. `setup-worktree.sh --target` still queues the main checkout's `config.worktree` twice in its non-clone arm, which only the main checkout reaches now

**File:** `cli/templates/scripts/setup-worktree.sh`, at the `sparse_files` block: "elif [ \"$target_kind\" != clone ]; then".

**Problem.** Under `--target`, the non-clone arm adds two files to `sparse_files`:

```bash
elif [ "$target_kind" != clone ]; then
  sparse_files+=("$target_gitdir/config.worktree")
  f="$(hr_worktree_config_file "$main_repo")" && sparse_files+=("$f")
fi
```

Before this branch, a linked worktree could reach this arm, and the two lines named two different files: the worktree record's `config.worktree` and the main checkout's own. This branch makes `--target` refuse a linked worktree (`hr_run_target_check_var`). The comment this branch added just above says so: "Under `--target` the non-clone arm is the main checkout given as <dir>". In that case `$target_gitdir` is `<main>/.git`, and `hr_worktree_config_file "$main_repo"` prints the same `<main>/.git/config.worktree`. So `drop_inert_sparse` runs twice on one file.

The second run finds nothing to drop, so nothing breaks. Still, the third line is a leftover of the removed arm. It also contradicts the comment two lines up, which says the main checkout's file is cleaned too *"whenever it is not the one being bootstrapped"*. In this arm it is the one being bootstrapped.

**Fix.** Delete the third line, so that the arm reads:

```bash
elif [ "$target_kind" != clone ]; then
  sparse_files+=("$target_gitdir/config.worktree")
fi
```

Change nothing else in the block. The no-argument arm above it keeps its two lines, because a checkout a person made with `git worktree add` and bootstrapped with no argument still has a separate main-checkout file.

This fix edits no test file and runs no test. The full suite runs in the Run gates phase.
