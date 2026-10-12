### 6. `push-branch.sh` passes a sandbox-writable branch name to `git push` where a leading `-` is parsed as an option

**File:** `cli/templates/scripts/push-branch.sh`, the push-command build: "push_cmd=(git -C \"$top\" -c core.hooksPath=\"$pinned\" push --set-upstream origin \"$branch\")"

**The problem.** The main checkout's copy of this script now runs outside the sandbox. Its header's paragraph **THE TARGET IS NOT TRUSTED.** says why that matters: a sandboxed command can hand the unsandboxed wrapper a repository state chosen to make it run a program. The target check, the per-working-copy configuration check and the hooks pin each close one route. The branch name is a route none of them closes.

`branch` comes from `hr_current_branch`, which is `git symbolic-ref --short HEAD`, and a linked worktree's `HEAD` lives in `<main>/.git/worktrees/<name>/HEAD`. That file is sandbox-writable: the sandbox may write the main repository's `.git` except `hooks/` and `config`, as the library's own `hr_wrapper_target_check_var` comment states. git's ref-name rules reject a space but do not reject a component that starts with `-`, so a sandboxed command can point `HEAD` at a branch such as `refs/heads/--receive-pack=<path>`. For a branch with no upstream, the wrapper then runs `git push --set-upstream origin --receive-pack=<path>`. `git push` parses an option even after its positional arguments, so `--receive-pack` names the program git starts as the remote receive-pack. With a local-path or `file://` remote, git starts that program locally, outside the sandbox, from a file the sandbox wrote. An SSH or HTTPS remote does not start it locally. That limits the reach, which is why this is a Should Fix, but the wrapper's own contract is that what the sandbox writes does not decide what it runs. No legitimate branch name starts with `-`, because `git branch` and `git switch -c` refuse one.

**Fix.**

- [ ] In `push-branch.sh`, directly after the detached-HEAD refusal (the block ending "echo \"push-branch.sh: detached HEAD — refusing to push\""), add:

  ```bash
  # A branch name git would parse as an option (THE TARGET IS NOT TRUSTED): a
  # worktree's HEAD is sandbox-writable, and no branch git creates starts with `-`.
  case "$branch" in
    -*)
      echo "push-branch.sh: branch '$branch' starts with '-', which git would read as an option — refusing to push"
      exit 0
      ;;
  esac
  ```

- [ ] In the header's **EVERY FAILURE PATH IS NON-FATAL (exit 0).** list, after "a hooks directory it will not pin", add ", a branch name starting with `-`".
- [ ] In `cli/test/push-branch-worktree-config.test.mjs`, add a case. On a clean worktree, rewrite that worktree's record `HEAD`, `<main>/.git/worktrees/<name>/HEAD`, to `ref: refs/heads/--receive-pack=<fixture>/marker.sh` with the file system rather than git; `git symbolic-ref --short HEAD` reads the name whether or not the ref exists. Run the main checkout's copy aimed at the worktree, then assert exit 0, a `refusing to push` line, no file created by `marker.sh`, and origin unchanged. That is the test file this fix edits, so it is the one the fix runs.
