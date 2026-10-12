### 2. The unsandboxed `refresh-branch.sh` passes the sandbox-writable `defaultBranch` to `git fetch`, where `--upload-pack=` runs a program outside the sandbox

**File:** `cli/templates/scripts/refresh-branch.sh`. The value is set at "base=\"$(hr_default_branch \"$top\")\" || base=\"\"" and used at "git -C \"$top\" -c core.hooksPath=\"$pinned\" fetch origin \"$base\" || true".

**The problem.** The profile runs the main checkout's copy of this script outside the sandbox, through `sandbox.excludedCommands` → `Bash(bash <repoRoot>/<scriptsDir>/refresh-branch.sh:*)`. The script is allow-listed for agents in all three forms. Its header paragraph **THE TARGET IS NOT TRUSTED.** (and the matching one in `push-branch.sh`) states the contract: what a sandboxed command can write must not decide what this unsandboxed wrapper runs. Three checks enforce that:

- the target check;
- the `config.worktree` check;
- the hooks pin.

Code-review Finding 6 then closed the same class for `push-branch.sh`'s branch name. Nothing closes it for `defaultBranch` here:

- `top` is the target worktree. `hr_config_load "$top"` and `hr_default_branch "$top"` read `<worktree>/harness.config.json`.
- That file is writable by a sandboxed command, because the worktree is the run's working directory. It is also writable by the file tools, through the profile's `Edit(//<worktree glob>/**)` and `Write(//<worktree glob>/**)` allows. The write protection does not cover it: it protects only the **main** checkout's `harness.config.json`.
- `hr_default_branch` is `hr_config_scalar … defaultBranch ""`, which returns the string as written.
- Outside `--local` mode, the script runs `git fetch origin "$base"`. `git fetch` parses an option after its positional arguments, so a `defaultBranch` of `--upload-pack=<path>` names the program git starts as upload-pack. With a local-path or `file://` remote, git starts that program on this machine, outside the sandbox.

**Reproduced** against the shipped template, in a throwaway fixture: a main checkout with a local bare `origin`, and a clean linked worktree. Only the worktree's committed `harness.config.json` was changed, to `"defaultBranch": "--upload-pack=<fixture>/evil.sh"`, where `evil.sh` touches a marker file and then runs `git-upload-pack`. Then:

```
bash <main>/scripts/refresh-branch.sh <worktree>
```

All three trust checks passed. The script exited 1 with "no 'origin/--upload-pack=…' … nothing to merge from", and **the marker file was created**: `evil.sh` had run unsandboxed.

The reach is the same as Finding 6's. An SSH or HTTPS remote does not start the program locally, which is why this is a Should Fix. No legitimate branch name starts with `-`.

**Fix.**

- [ ] In `refresh-branch.sh`, directly after the block that ends `echo "refresh-branch.sh: no defaultBranch in '$top/harness.config.json' — refusing to merge" >&2` and its `exit 1` / `fi`, add:

  ```bash
  # A base git would parse as an option (THE TARGET IS NOT TRUSTED): the
  # worktree's harness.config.json is sandbox-writable, and no branch git
  # creates starts with `-`.
  case "$base" in
    -*)
      echo "refresh-branch.sh: defaultBranch '$base' in '$top/harness.config.json' starts with '-', which git would read as an option — refusing to merge" >&2
      exit 1
      ;;
  esac
  ```

- [ ] In the header's `# Exit map a caller can switch on:` list, extend the exit-`1` entry: after "a hooks directory this script does not trust (THE PER-WORKING-COPY CONFIG IS NOT TRUSTED above)", add "/ a `defaultBranch` starting with `-`".
- [ ] In `cli/test/refresh-branch-worktree-config.test.mjs`, add a case **(f)**. Start from the same clean worktree fixture case (a) builds:
  1. Write the worktree's `harness.config.json` with `defaultBranch` set to `--upload-pack=<fixture>/marker.sh`, where `marker.sh` creates a marker file and then `exec`s `git-upload-pack "$@"`. Commit it in the worktree, because the wrapper refuses uncommitted tracked changes.
  2. Run the main checkout's copy aimed at the worktree.
  3. Assert exit 1, a line matching `/starts with '-'/`, no marker file, and the worktree's `HEAD` unchanged.

  That is the test file this fix edits, so it is the one the fix runs.
