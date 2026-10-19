### 1. A directory passed to the commit wrapper is refused whole when it holds a submodule

**File:** `cli/templates/scripts/commit-on-branch.sh` (the STAGING POLICY loop) — "main_git ls-tree -r -z --name-only \"$old_tip\" -- \"$rel\"" and "wt_git ls-files -z --cached --others --exclude-standard -- \"$rel\""

When a passed path is a directory, the wrapper expands it into every path the tip holds under it (`ls-tree -r --name-only`) plus every path the working copy's index or working tree holds there (`ls-files --cached --others --exclude-standard`). Both listings include **gitlinks**. `ls-tree -r` prints a submodule as one `160000 commit` entry, and `ls-files --cached` prints it as one index entry. Each expanded path then goes through `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_blob_var`, which returns 1 for anything that is neither a regular file nor a symbolic link. A checked-out submodule is a directory. So `hr_commit_paths_var` sets `HR_COMMIT_REFUSAL` to "'<path>' is not a regular file or a symbolic link reached without a symbolic link in '<top>'", and the wrapper exits 1 with nothing committed. This happens even when the submodule did not change.

This is a regression from the `git add` / `git commit` wrapper it replaces. `git add <dir>` carried an unchanged submodule through untouched. The callers pass directories in the normal course of work:

- `plugin/agents/committer.md` → step 3 passes a deletion's **parent directory**, and a rename's old half, as the wrapper's STAGING POLICY requires. A deletion at the repository root passes `.`.
- The committer also passes a collapsed `?? <dir>/` untracked parent as a directory.
- The autonomous forks pass their per-finding and gate folders unconditionally.

In an adopting repository with a submodule anywhere under such a directory, every one of those commits exits 1 and the unattended run stops at that commit point. The task plan's own claim for this expansion — "This keeps the STAGING POLICY's trap and its remedy true" (`harness-runs/task_plans/fix_sandbox_worktree_record_writes/task_1_plan.md`, **The wrapper's staging set, then the shared commit.**) — does not hold here: passing the parent directory, which is the remedy, is exactly what fails.

An untracked embedded repository under the directory fails the same way. `ls-files --others` lists it as `<path>/`, with a trailing slash. `hr_run_blob_var` refuses that name at its `*//*` pattern, and the whole commit exits 1.

**Fix:** a gitlink is never committed by this wrapper, so leave it out of a directory's expansion. The temporary index is seeded from the tip, so the tip's gitlink is carried into the commit unchanged. A path the caller names **explicitly** keeps today's refusal. Replace the two listing calls inside `if [ -d "$top/$p" ] && [ ! -L "$top/$p" ]; then … fi` with three listings that drop gitlinks and untracked embedded repositories:

```bash
    if [ -d "$top/$p" ] && [ ! -L "$top/$p" ]; then
      [ -n "$rel" ] || rel=.
      # A gitlink (a submodule) under a passed directory is carried from the tip
      # unchanged: this wrapper never commits one, and an unchanged one must not
      # refuse the rest of the directory. An untracked embedded repository,
      # which `ls-files --others` lists as `<path>/`, is left out the same way.
      if ! main_git ls-tree -r -z "$old_tip" -- "$rel" >"$work/listing"; then
        echo "commit-on-branch.sh: refusing to commit: git could not list '$p' at '$branch' (see output above)" >&2
        exit 1
      fi
      while IFS= read -r -d '' entry; do
        case "$entry" in 160000\ *) continue ;; esac
        printf '%s\0' "${entry#*	}" >>"$work/paths"
      done <"$work/listing"
      if ! wt_git ls-files -z --stage -- "$rel" >"$work/listing"; then
        echo "commit-on-branch.sh: refusing to commit: git could not list '$p' in '$top' (see output above)" >&2
        exit 1
      fi
      while IFS= read -r -d '' entry; do
        case "$entry" in 160000\ *) continue ;; esac
        printf '%s\0' "${entry#*	}" >>"$work/paths"
      done <"$work/listing"
      if ! wt_git ls-files -z --others --exclude-standard -- "$rel" >"$work/listing"; then
        echo "commit-on-branch.sh: refusing to commit: git could not list '$p' in '$top' (see output above)" >&2
        exit 1
      fi
      while IFS= read -r -d '' entry; do
        case "$entry" in */) continue ;; esac
        printf '%s\0' "$entry" >>"$work/paths"
      done <"$work/listing"
    else
```

The character after `#*` in `${entry#*	}` is a literal TAB. `ls-tree` and `ls-files --stage` both separate their metadata from the path with one TAB, and no metadata field contains one, so the expansion strips exactly the metadata. `--stage` takes the place of `--cached`. It lists the same entries with their mode, and it must run as its own call because its records and `--others`' bare names cannot share one stream. The `sort -z -u` that follows still removes duplicates, conflict stages included.

Then amend the header to match, in the same edit. In **STAGING POLICY, AND THE ONE TRAP IN IT**, after "every tracked or untracked, not ignored, path the working copy holds there", add: "— except a gitlink (a submodule), which is carried from the tip unchanged, and an untracked embedded repository, which is left out". The exit-1 list's "(a submodule, a special file)" stays: it describes a path named explicitly.

Add a case to `cli/test/commit-on-branch-plumbing.test.mjs`, after `(d)`: "(l) A submodule under a passed directory is carried unchanged". In the fixture's worktree:

1. Add a gitlink at `dir/sub` with `runGit(f.wt, ['update-index', '--add', '--cacheinfo', \`160000,${await f.tip()},dir/sub\`])`.
2. Commit it with `runGit(f.wt, ['commit', '--quiet', '--no-verify', '-m', 'fixture: gitlink'])`.
3. Create the empty directory `dir/sub` with `mkdir`, as a checked-out submodule would leave it.
4. Delete `dir/gone.txt` and call `f.commit(['dir'])`.

Assert:

- exit 0;
- `changed(f, await f.tip())` is `'D\tdir/gone.txt'`;
- `f.mainGit('ls-tree', await f.tip(), 'dir/sub')` starts with `160000 commit`.

That test file is the one this fix edits, so it is the only test the fix runs: `npm test --workspace cli -- test/commit-on-branch-plumbing.test.mjs`.
