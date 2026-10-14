### 1. The working-tree side of the surface check, and the watchdog's reset, trust the run's own index, so a skip-worktree bit hides a session-written protected file

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_run_surface_check_var`): `if [ "$mode" = copy ]; then` and `if [ "$mode" != tree ]; then`. Also `hr_run_reset_var`, at `hr_run_copy_git read-tree --reset -u --no-recurse-submodules "$HR_RUN_COPY_TIP"`.

**The problem.** Every working-tree call here runs through `hr_run_copy_git`, which sets `GIT_INDEX_FILE` to the record's own `index`, `<main>/.git/worktrees/<name>/index`. The story plan's design paragraph says a sandboxed process can write that file. Git decides whether a working-tree file differs from the index using that index's per-entry flags and stat data:

- An entry carrying **skip-worktree** is never compared and never rewritten.
- An entry carrying **assume-unchanged** is never compared.

So the session can do the following on any checkout where it can write the working-tree file at a protected path:
1. Write `.claude/settings.json` (or `.mcp.json`, or a hook under `<githooksDir>`) in its copy.
2. Run `git update-index --skip-worktree .claude/settings.json`. That is an ordinary allowed git command against its own index.

Then all three of these pass and leave the file in place:
- **`copy` mode.** `diff … "$tip" -- <paths>` reports nothing, and `ls-files --others` lists nothing because the path is in the index. This is the review reuse, the recreated copy and `remote-run.sh review`.
- **`reset` mode**, which has no working-tree comparison at all.
- **`read-tree --reset -u`**, which skips the entry, so the reset does not restore the file.

The resumed session, or the launched review session, then loads that settings file's hooks outside the sandbox.

This needs the working-tree write to succeed, and only the worktree-glob `denyWrite` entries stop that write. `docs/cli.md` §6 residual 2 records those entries as unverified on Linux. The task prompt's constraint is *"The design does not rely on the Linux glob entries. Where a call is safe only because a worktree-glob entry holds, it counts as exposed on Linux."* Both `docs/watcher.md` (`**The pins.**`: "and a reused copy's working tree must match too, with nothing untracked there") and the story plan claim this check holds. The residual list in `docs/cli.md` does not name this exposure.

**Probed** with git 2.50.1 (Apple Git-155) in a throwaway repository:
1. A worktree `c` on `feat` was cut from a commit holding `.claude/settings.json` = `{"ok":1}`.
2. The working-tree file was then overwritten with `{"evil":1}`, and the entry was marked with `git update-index --skip-worktree`.
3. The library's commands were run under `GIT_DIR=<main>/.git GIT_INDEX_FILE=<main>/.git/worktrees/c/index GIT_WORK_TREE=<c>`:
   - `diff --name-only --exit-code --no-renames --no-ext-diff --no-textconv --ignore-submodules <tip> -- .claude/settings.json` exited `0` and printed nothing.
   - `diff --quiet --no-ext-diff --ignore-submodules` exited `0`.
   - `ls-files --others -- .claude/settings.json` printed nothing.
   - `read-tree --reset -u --no-recurse-submodules <tip>` exited `0`, and the file still read `{"evil":1}`.
4. The same `diff` under a **fresh** temporary index, populated by `read-tree <tip>`, printed `.claude/settings.json` and exited `1`.

**Fix.** Judge the copy's working tree on the protected set through a fresh temporary index read from the tip, never through the record's index. Run that comparison in `reset` mode as well as in `copy` mode.

1. Add this function to the section `THE WATCHER FAMILY'S GIT IN A RUN'S COPY`, directly above `hr_run_surface_check_var`:

```bash
# hr_run_worktree_diff_var <tip> <path>... — set HR_RUN_WT_DIFF to the paths
# under <path>... where the copy's working tree differs from <tip>, plus every
# file there <tip> does not hold, ignored ones included. Judged through a fresh
# temporary index read from <tip>, never the record's `index`: a sandboxed
# session can write that index's skip-worktree / assume-unchanged bits and stat
# data, which make git skip a file. 0 compared (HR_RUN_WT_DIFF may be empty);
# 1 the temporary index or a git call failed.
hr_run_worktree_diff_var() {
  local tip="${1-}" tmpdir out untracked status
  HR_RUN_WT_DIFF=""
  shift
  [ -n "$tip" ] && [ "$#" -gt 0 ] && [ -n "${HR_RUN_MAIN-}" ] && [ -n "${HR_RUN_COPY_TOP-}" ] || return 1
  tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/hr-surface-index.XXXXXX") || return 1
  hr_wt() {
    GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$tmpdir/index" GIT_WORK_TREE="$HR_RUN_COPY_TOP" \
      git -C "$HR_RUN_COPY_TOP" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false "$@"
  }
  if ! hr_wt read-tree "$tip" >/dev/null 2>&1; then
    rm -rf "$tmpdir"
    return 1
  fi
  out=$(hr_wt diff --name-only --exit-code --no-renames --no-ext-diff --no-textconv --ignore-submodules -- "$@" 2>/dev/null)
  status=$?
  if [ "$status" -gt 1 ] || ! untracked=$(hr_wt ls-files --others -- "$@" 2>/dev/null); then
    rm -rf "$tmpdir"
    return 1
  fi
  rm -rf "$tmpdir"
  HR_RUN_WT_DIFF="$out${out:+${untracked:+
}}$untracked"
  return 0
}
```

   If a nested function definition is unwanted, inline the `GIT_DIR=… GIT_INDEX_FILE="$tmpdir/index" GIT_WORK_TREE=… git -C … -c …` prefix at each of the three calls. Once the function is in, add `HR_RUN_WT_DIFF` to the header's `NAMING` list beside `HR_RUN_SURFACE_REFUSAL`. Add the temporary index to write exception 5's fence, removed on every exit path, as exception 4 already does for `hr_commit_placed`'s.

2. In `hr_run_surface_check_var`, replace both of these with one block that applies to `copy` and `reset` alike:
   - the whole `if [ "$mode" = copy ]; then … fi` block, the record-index `diff … "$tip"`;
   - the `if [ "$mode" != tree ]; then … ls-files --others … fi` block.

```bash
  if [ "$mode" != tree ]; then
    if ! hr_run_worktree_diff_var "$tip" "${paths[@]}"; then
      HR_RUN_SURFACE_REFUSAL="cannot compare '$HR_RUN_COPY_TOP' with '$tip' on the protected set"
      return 1
    fi
    [ -z "$HR_RUN_WT_DIFF" ] || names="${names:+$names
}$HR_RUN_WT_DIFF"
  fi
```

   Then update the function's mode comment to read:

```
#   tree   the commit <tip> against the base;
#   copy   `tree`, plus the copy's working tree on the set against <tip>
#          through a fresh index, untracked and ignored files included;
#   reset  the same as `copy`: a reset cannot be relied on to overwrite a
#          file the record's index marks skip-worktree.
```

   An honest run never writes a protected path, so the working tree there always equals the tip. The watchdog's honest resume and the honest reuse are therefore unchanged.

3. In `hr_run_reset_var`'s comment, find the exit-status line beginning `refused with nothing written` (it continues onto the next comment line with the `reset` surface check). Reword that entry so it says the check now also compares the working tree on the protected set.

4. In `docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins` → `**The pins.**`, replace "and a reused copy's working tree must match too, with nothing untracked there" with:

   > and the copy's working tree must match too — for a reuse and before the watchdog's reset — judged through a fresh index read from the tip rather than the record's own `index`, whose skip-worktree and assume-unchanged bits a sandboxed session can set, with nothing untracked there

5. Add one case to each of `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`. The fixture runs unsandboxed, which stands in for a Linux worktree glob that does not hold. In each case:
   - Write `{"hooks":{}}` with a marker comment, or any bytes that differ from the tip, to `<copy>/.claude/settings.json`.
   - Run `git -C <copy> update-index --skip-worktree .claude/settings.json`.
   - Drive the existing stall setup in the first file, and the reuse drop in the second.
   - Assert the outcome: the record is `failed`, with one `failed` notification naming `.claude/settings.json`. The stub is not relaunched in the stall case and not launched in the drop case.

   In each case's header `RED ONCE` list, record the mutation that turns it red: `hr_run_worktree_diff_var` using `GIT_INDEX_FILE="$HR_RUN_COPY_GITDIR/index"` in place of the temporary index. These two files are the ones this fix edits, so they are the only tests it runs.

- **Deviations from plan:** (cli layer) The `GIT_DIR=… GIT_INDEX_FILE="$tmpdir/index" GIT_WORK_TREE=… git -C … -c …` prefix is inlined at the three calls, as the finding's alternative allows, rather than defined as a nested `hr_wt`, which would have leaked a global function. The RED ONCE mutation was applied to the `diff` and `ls-files --others` calls only: a `read-tree` into the record's index replaces its entries and drops the skip-worktree bit, so mutating that call too would leave the cases green. Under it, S7 and L10 each failed on the record's `status`, `completed`, not `failed`; both passed again after the revert. The L6 RED ONCE line in `cli/test/watcher-review-drop-payloads.test.mjs` now names `hr_run_worktree_diff_var`, where the `ls-files --others` test moved. Step 4 (`docs/watcher.md`) is outside `cli/` and is left for this unit's `general` layer.
