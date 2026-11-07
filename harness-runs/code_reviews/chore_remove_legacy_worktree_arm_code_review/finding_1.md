### 1. The run library's comments still describe a linked worktree's record as a run copy's index, and name the wrong target check for `setup-worktree.sh --target`

**File:** `cli/templates/scripts/lib/harness-run-lib.sh`. This finding covers three comment sites in that one file:

- the module header's who-reads-what paragraph: "checks `<dir>` with `hr_wrapper_target_check_var`";
- `hr_run_worktree_diff_var`'s doc comment: "never the record's `index`";
- `hr_run_surface_check_var`'s doc comment, the `reset` mode line: "file the record's index marks skip-worktree".

**Problem.** This branch moves "a linked worktree is never a run copy" into one owner, `hr_run_target_check_var`. Task 12 switches `setup-worktree.sh --target` to call it in place of `hr_wrapper_target_check_var`. The branch also rewrites the section header THE WATCHER FAMILY'S GIT IN A RUN'S COPY so that a run copy's index is `<main>/.git/index` or `<clone>/.git/index`. The removed worktree arm used to borrow `<record>/index`, and the new header drops it.

Three comments in the same file were not updated with those changes:

1. **The module header** still says `setup-worktree.sh --target <dir>` "checks `<dir>` with `hr_wrapper_target_check_var`". That check accepts a linked worktree. A maintainer who reads the header as the contract would conclude that `--target` still bootstraps one. The code refuses it (`setup-worktree.sh` → `if ! hr_run_target_check_var "$main_repo" "$2"; then`). `.claude/context/cli.md` → `## What "done" means here` asks a change to satisfy its module's header or amend it in the same edit.
2. **`hr_run_worktree_diff_var`** says the comparison is judged through a fresh index "never the record's `index`". The run copies this function now serves are the main checkout and a clone. Neither has a worktree record. The index the sentence means is the copy's own `.git/index`.
3. **`hr_run_surface_check_var`**'s `reset` mode line says a reset cannot be relied on to overwrite "a file the record's index marks skip-worktree". The same reasoning applies: the index is the copy's own.

None of these changes behaviour. Each one tells a reader of the shipped library about a layout this branch removed from the run path.

**Fix.** These are comment-only edits in `cli/templates/scripts/lib/harness-run-lib.sh`:

1. In the module header, replace
   ```
   # `hr_wrapper_main_of`, checks `<dir>` with `hr_wrapper_target_check_var`, and
   ```
   with
   ```
   # `hr_wrapper_main_of`, checks `<dir>` with `hr_run_target_check_var`, which
   # refuses a linked worktree, and
   ```
2. In `hr_run_worktree_diff_var`'s doc comment, replace "never the record's `index`" with "never the copy's own `.git/index`".
3. In `hr_run_surface_check_var`'s doc comment, replace "file the record's index marks skip-worktree." with "file the copy's own index marks skip-worktree."

Leave everything else in those comments as it is. In particular, keep the header sentences about the three git wrappers' record and `config.worktree` reads: Option A keeps the wrappers' hand-made-worktree arm, so those sentences are still true.

This fix edits no test file and runs no test. The full suite runs in the Run gates phase.
