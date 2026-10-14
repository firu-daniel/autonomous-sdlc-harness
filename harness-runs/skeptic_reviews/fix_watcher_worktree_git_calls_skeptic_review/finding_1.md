### 1. A `refs/replace/` ref or an `info/grafts` line, both sandbox-writable, defeats every protected-surface check and swaps the "trusted" fresh cut

**File:** `cli/templates/scripts/lib/harness-run-lib.sh`, at these sites:
- `hr_run_main_git`: `git -C "$HR_RUN_MAIN" -c core.hooksPath=/dev/null`
- `hr_run_copy_git`: `GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$HR_RUN_COPY_GITDIR/index"`
- `hr_run_worktree_diff_var`: its three inline `GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$tmpdir/index"` calls

Also:
- `cli/templates/scripts/create-worktree.sh`, the default-mode cut: `git -C "$main_repo" worktree add -b "$branch" "$worktree_dir" "$HR_RUN_TRUSTED_BASE"`.
- `cli/src/core/git.ts`: `mergeBase`, `fileAtRef`, `changedPathsBetween` and `commitResolves`, which `cli/src/doctor/checks.ts` → `JOB_SURFACES_CHECK` uses.

**The problem.** The branch's design rests on one stated premise. The story plan says: "A sandboxed session can write the common directory's `refs/` and `packed-refs`… So `hr_run_trusted_base_var` takes the base from `ls-remote`". The task prompt says the same: "In the common directory, `objects/`, `refs/`, `packed-refs`, `info/` and `modules/<name>/config` stay writable too".

The fix therefore holds origin's commit id in a shell variable. But git does not read that id's commit as stored:
- **`refs/replace/<oid>`** lives under `refs/`. Git substitutes the named object on every read, unless `GIT_NO_REPLACE_OBJECTS` is set.
- **`<common>/info/grafts`** lives under `info/`. Git rewrites a commit's parents on every history walk, unless `GIT_GRAFT_FILE` points elsewhere.

Neither of these is set by any runner the branch adds, or by the TypeScript reads. A grep for `replace-objects`, `REPLACE_OBJECTS`, `refs/replace`, `graft` and `commit-graph` across `cli/` and `docs/` finds nothing.

A session can therefore do either of the following:
- Plant a replace ref for the fork-point commit, pointing at a parentless commit that carries its own payload tree. That takes one `commit-tree` and one `update-ref`, both ordinary git commands it may run.
- Graft both its tip and that commit onto the same parentless commit.

Either way, `merge-base(tip, trusted base)` reads a tree equal to the tip's, so the protected-path diff is empty. The check passes. The `read-tree` that follows then installs the tip's **real** tree, payload included, because the tip itself was not replaced.

Every surface check falls to this. That covers:
- the watchdog's reset, locally and in job mode;
- the remote arm's fast-forward;
- the review reuse;
- `remote-run.sh review`;
- `create-worktree.sh --existing`;
- `doctor --job-surfaces=<branch>@<commit>` as the job-mode watchdog runs it.

The default-mode cut is affected too. `create-worktree.sh` documents it as "never off a local ref a sandboxed session can write", and the inventory treats it as class (a), "trusted tree". It checks out `HR_RUN_TRUSTED_BASE` through the replacement. So a previous run that knew `origin/<defaultBranch>`'s id can make the **next** task drop's fresh copy hold any `.claude/settings.json`, `.mcp.json` or `<scriptsDir>/setup-worktree.sh`. `create-worktree.sh` then runs that copy's own `setup-worktree.sh` unsandboxed.

This is not `docs/cli.md` §6 residual 1, item 6. That item is about overwriting an object's **bytes**, and `git fsck --full` reports it. A replace ref or a graft is a supported git feature: `fsck` reports nothing, it survives `gc`, and it lives in `refs/` and `info/`. The plan explicitly claims to close `refs/` against exactly this kind of forgery. Closing the route costs two environment values. `GIT_NO_REPLACE_OBJECTS` alone does not stop a graft, and `GIT_GRAFT_FILE` alone does not stop a replace ref; both are needed (probe below).

**Proof.** All probes ran with git 2.50.1 (Apple Git-155) in throwaway repositories.

- **Library probe.** The fixture:
  - a bare `origin`, with `dev` holding `.claude/settings.json` = `{"ok":1}` and a valid `harness.config.json` (`defaultBranch: dev`, `githooksDir: githooks`);
  - a worktree `copy` on `feat`, whose one commit sets the file to `{"evil":1}`.

  The library was sourced. `hr_run_copy_check_var <main> <copy>` and `hr_run_surface_check_var "$HR_RUN_COPY_TIP" <mode>` were called, and the results were:
  1. **Honest:** `REFUSED: the protected surface differs from the merge base … : .claude/settings.json`.
  2. **Replace:** after `git -C <main> update-ref refs/replace/<dev> $(git -C <main> commit-tree <tip>^{tree} -m fake)`, the `reset`, `copy` and `tree` modes each returned `PASSED`. `hr_run_reset_var` returned `0`, and the copy's file read `{"evil":1}`.
  3. **Grafts:** with `<main>/.git/info/grafts` holding `<tip> <fake>` and `<dev> <fake>` instead of the replace ref, all three modes returned `PASSED`. `hr_run_reset_var` returned `0`, leaving `{"evil":1}`.
  4. **Replace case under each environment value alone:**
     - `GIT_NO_REPLACE_OBJECTS=1`: `REFUSED`.
     - `GIT_GRAFT_FILE=/dev/null` alone: `tree` mode still `PASSED`.
  5. **Grafts case under each environment value alone:**
     - `GIT_NO_REPLACE_OBJECTS=1` alone: still `PASSED`.
     - `GIT_GRAFT_FILE=/dev/null`: `REFUSED`.
  6. **Both values together:** `REFUSED` in both cases.
- **Fresh-cut probe.** `refs/replace/<dev>` was pointed at a parentless commit whose `.claude/settings.json` is `{"evil":1}`. `git worktree add -b next <dir> <dev>` then produced a copy reading `{"evil":1}`.
- **Doctor probe.** This used the built `cli/dist/cli.js`, against a clone on `feat`, whose commit changes `scripts/remote-run.sh`, with `defaultBranch: main`:
  - `doctor --job-surfaces=main@<M>` gave `FAIL … changed … scripts/remote-run.sh`.
  - After `git update-ref refs/replace/<M> $(git commit-tree HEAD^{tree} -m fake)` in the clone, the same command gave `PASS job-surfaces`.

**Fix.**

1. **`cli/templates/scripts/lib/harness-run-lib.sh`, `hr_run_main_git`.** Change the git line to:

   ```bash
     GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null \
       git -C "$HR_RUN_MAIN" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false "$@"
   ```

2. **Same file, `hr_run_copy_git`.** Prefix the existing assignment line with the same two values:

   ```bash
     GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null \
     GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$HR_RUN_COPY_GITDIR/index" GIT_WORK_TREE="$HR_RUN_COPY_TOP" \
       git -C "$HR_RUN_COPY_TOP" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false "$@"
   ```

3. **Same file, `hr_run_worktree_diff_var`.** Prefix each of its three `GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$tmpdir/index" …` assignments (the `read-tree`, the `diff` and the `ls-files --others`) with `GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null `.

4. **Same file, the section header `THE WATCHER FAMILY'S GIT IN A RUN'S COPY.`** Add a fourth bullet under "so every call made here holds three rules:" and change "three" to "four":

   ```
   #   - Git reads history as stored: `GIT_NO_REPLACE_OBJECTS=1` and
   #     `GIT_GRAFT_FILE=/dev/null`. A sandboxed session can write
   #     `refs/replace/` and `info/grafts` in the common directory, and either
   #     one makes the merge base read as a commit carrying the run's own tree,
   #     so every surface diff comes out empty while `read-tree` still writes
   #     the tip's real tree.
   ```

5. **`cli/templates/scripts/create-worktree.sh`, default mode.** Replace

   ```bash
   git -C "$main_repo" worktree add -b "$branch" "$worktree_dir" "$HR_RUN_TRUSTED_BASE"
   ```

   with

   ```bash
   GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null \
     git -C "$main_repo" worktree add -b "$branch" "$worktree_dir" "$HR_RUN_TRUSTED_BASE"
   ```

   Add one comment line above it: `# History as stored: a replace ref or graft for the base would swap the tree cut here.`

6. **`cli/src/core/git.ts`.**
   1. Import `devNull` from `node:os`.
   2. Beside the other constants, add:

      ```ts
      /** Git's switch-off for `refs/replace/`: a sandboxed session can write that namespace. */
      const NO_REPLACE_OBJECTS_ENV = 'GIT_NO_REPLACE_OBJECTS';
      /** Where git looks for `info/grafts`; pointed at the null device so no graft is read. */
      const GRAFT_FILE_ENV = 'GIT_GRAFT_FILE';
      ```

   3. Add a private runner:

      ```ts
      /**
       * {@link runGitUntrimmed} with history read as stored — no `refs/replace/` substitution and no
       * `info/grafts` — for the reads that compare a run's branch with a trusted commit: a session that
       * can write the common directory's `refs/` and `info/` could otherwise make the merge base read
       * as a commit carrying the branch's own tree.
       */
      function runGitAsStored(args: readonly string[], cwd: string): string {
        return execFileSync('git', [...args], {
          cwd,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
          maxBuffer: GIT_OUTPUT_MAX_BYTES,
          env: { ...process.env, [NO_REPLACE_OBJECTS_ENV]: '1', [GRAFT_FILE_ENV]: devNull },
        });
      }
      ```

   4. Make these call `runGitAsStored` instead of their current runner:
      - `mergeBase`: `runGitAsStored(['merge-base', a, b], repoRoot).trim()`.
      - `fileAtRef`: `runGitAsStored(['show', …], repoRoot)`.
      - `changedPathsBetween`: `runGitAsStored([...], repoRoot)`.
   5. Rewrite `commitResolves` so it no longer goes through `refResolves`:

      ```ts
      export function commitResolves(repoRoot: string, revision: string): boolean {
        if (looksLikeOption(revision)) return false;
        try {
          runGitAsStored([...GIT_VERIFY_REF_ARGS, `${revision}^{commit}`], repoRoot);
          return true;
        } catch {
          return false;
        }
      }
      ```

   6. Extend the header paragraph "Three reads compare a branch with the default branch…" with: "They read history as stored, with replace refs and grafts switched off, because a sandboxed session can write both."

7. **`docs/watcher.md`.** In `### Where the family runs git in a run's copy, and under what pins` → `**The pins.**`, after "never a local ref, which a sandboxed session can write; an unreachable origin is a refusal.", insert:

   > Every one of those calls also reads history as stored — `GIT_NO_REPLACE_OBJECTS=1` and `GIT_GRAFT_FILE=/dev/null` — because `refs/replace/` and `info/grafts` are sandbox-writable too, and a replace ref or a graft on the merge base would make the protected-path diff empty while the reset or fast-forward still writes the run's own tree. The default-mode cut of a new branch, and `doctor --job-surfaces`'s reads, do the same.

8. **`docs/remote-execution.md`.** In `## 11.` → `**The branch's own files are checked before the job trusts them.**` → the `**The step.**` bullet, append:

   > `doctor`'s git reads for this check run with replace refs and grafts switched off, so a session that wrote `refs/replace/` or `info/grafts` in the checkout cannot make the watchdog's check read a different base.

9. **Tests.** These are the four files this fix edits, so they are the only ones it runs.
   1. **`cli/test/watcher-stall-reset-payloads.test.mjs`: case `(S8)`.** Name it "a replace ref on the merge base does not pass a payload tip". Model it on `(S6)`, with `const originDefault = await f.originTip(f.config.defaultBranch)` before the stall. Inside `f.localStall`:
      - `const commit = await f.commitInCopy([{ path: SETTINGS, content: markerSettings(f, 'S8-session-start') }], 'run: add a session hook')`;
      - `const base = await git(f.dir, ['merge-base', commit, originDefault])`;
      - `const fake = await git(f.dir, ['commit-tree', `${commit}^{tree}`, '-m', 'fake'])`;
      - `await git(f.dir, ['update-ref', `refs/replace/${base}`, fake])`.

      Assert `assertGivenUp(f, REFUSED(SETTINGS))`, and that the copy's `SETTINGS` reads `await f.defaultFile(SETTINGS)`.
   2. **Same file: case `(S9)`.** Name it "an info/grafts line on the tip and the base does not pass a payload tip". It is the same as `(S8)`, except that in place of the `update-ref` it does `mkdir -p` on `join(f.dir, '.git', 'info')` and writes `join(f.dir, '.git', 'info', 'grafts')` with `${commit} ${fake}\n${originDefault} ${fake}\n`. The assertions are the same.

      Add to the header's `RED ONCE` list:
      - `(S8)`: `GIT_NO_REPLACE_OBJECTS=1` removed from `hr_run_main_git` → the case resumes: fails on the record's `status`, `completed`, not `failed`.
      - `(S9)`: `GIT_GRAFT_FILE=/dev/null` removed from `hr_run_main_git` → the same failure.
   3. **`cli/test/doctor-job-surfaces.test.mjs`: one case.** Build the origin fixture and a clone on a run branch that changes a job surface (as `branchChanging` does). Take `M` from the origin default branch's commit. Then, in the clone, run `git update-ref refs/replace/<M> $(git commit-tree HEAD^{tree} -m fake)`. Assert that `doctor --job-surfaces=<default>@<M>` is refused, naming the changed path. In `RED ONCE`, record: `runGitAsStored` in `mergeBase` replaced by the plain `runGit` → passes.
   4. **`cli/test/create-worktree.test.mjs`: one case.** In the fixture's main checkout:
      - hash a `.claude/settings.json` blob of `{"planted":true}`;
      - build a parentless commit holding only that path (`mktree` twice, then `commit-tree`);
      - `update-ref refs/replace/<origin default tip> <that commit>`.

      Run default-mode `create-worktree.sh --no-bootstrap feat/r`. Assert that the new copy holds no `.claude/settings.json` reading `{"planted":true}`: it is absent, or it equals the origin default tip's own copy. In `RED ONCE`, record: the env prefix removed from the default-mode `worktree add` → the copy holds `{"planted":true}`.
